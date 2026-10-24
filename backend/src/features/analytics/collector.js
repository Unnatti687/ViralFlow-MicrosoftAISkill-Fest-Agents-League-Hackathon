const { sql } = require('../../db/client');
const { chat } = require('../../lib/openrouter');
const { getMediaInsights, getMediaComments, getAccountInfo } = require('../../lib/instagram');
const { getToken } = require('../publisher/token');
const { getMockReel } = require('./mock-data');
const { buildSentimentMessages, parseSentiment } = require('./prompts');

const MOCK = process.env.MOCK_INSTAGRAM === 'true';

// First-cycle benchmarks (no account history yet) — see spec Module 7 edge cases
const FIRST_CYCLE_ENGAGEMENT_BASELINE = 0.055;
const MIN_FOLLOWERS_FOR_REAL_INSIGHTS = 100;
const PROFESSIONAL_ACCOUNT_TYPES = new Set(['BUSINESS', 'CREATOR']);
const INSIGHTS_MIN_AGE_MS = 24 * 60 * 60 * 1000;

// Maps a raw insights object (real API or mock) to our normalized metric columns.
function normalizeMetrics(raw) {
  return {
    views: raw.views ?? null,
    reach: raw.reach ?? null,
    likes: raw.likes ?? null,
    comments: raw.comments ?? null,
    shares: raw.shares ?? null,
    saved: raw.saved ?? null,
    reposts: raw.reposts ?? null,
    total_interactions: raw.total_interactions ?? null,
    reels_skip_rate: raw.reels_skip_rate ?? null,
    ig_reels_avg_watch_time: raw.ig_reels_avg_watch_time ?? null,
  };
}

// Pulls raw insights + comments for one Reel. Mock path uses the pre-loaded dataset
// and flags is_mock; real path hits the Instagram Graph API through lib/instagram.
async function fetchReelData(mediaId, accessToken, useMock) {
  if (useMock) {
    const reel = getMockReel(mediaId);
    return { metrics: normalizeMetrics(reel.insights), comments: reel.comments, is_mock: true };
  }
  const insights = await getMediaInsights(mediaId, accessToken);
  let comments = [];
  try {
    comments = await getMediaComments(mediaId, accessToken);
  } catch (_) {
    // Comments disabled on the Reel — skip sentiment, leave comment_sentiment null
    comments = [];
  }
  return { metrics: normalizeMetrics(insights), comments, is_mock: false };
}

// Batches a Reel's comments into a single OpenRouter sentiment call.
// Returns null when there are no comments or the LLM call fails (graceful degrade).
async function collectSentiment(comments) {
  if (!comments || comments.length === 0) return null;
  try {
    const raw = await chat(buildSentimentMessages(comments), { temperature: 0.2, max_tokens: 1000 });
    return parseSentiment(raw, comments);
  } catch (err) {
    console.error('[Analytics] Sentiment call failed:', err.message);
    return null;
  }
}

// Account trailing-average engagement rate. First cycle (no prior data) uses the
// platform-generic benchmark; cycle 2+ uses the account's own average.
async function getAccountBaseline(userId) {
  const rows = await sql`
    SELECT AVG(engagement_rate)::float AS avg_er
    FROM reel_analytics
    WHERE user_id = ${userId} AND engagement_rate IS NOT NULL
  `;
  const avg = rows[0]?.avg_er;
  return avg && avg > 0 ? avg : FIRST_CYCLE_ENGAGEMENT_BASELINE;
}

async function upsertAnalytics(record) {
  const {
    userId, video_id, scheduled_post_id, instagram_media_id,
    metrics, engagement_rate, vs_baseline, save_share_ratio, retention,
    comment_sentiment, is_mock,
  } = record;

  const rows = await sql`
    INSERT INTO reel_analytics (
      user_id, video_id, scheduled_post_id, instagram_media_id,
      views, reach, likes, comments, shares, saved, reposts,
      total_interactions, reels_skip_rate, ig_reels_avg_watch_time,
      engagement_rate, vs_baseline, save_share_ratio, retention,
      comment_sentiment, is_mock, collected_at
    ) VALUES (
      ${userId}, ${video_id}, ${scheduled_post_id || null}, ${instagram_media_id},
      ${metrics.views}, ${metrics.reach}, ${metrics.likes}, ${metrics.comments},
      ${metrics.shares}, ${metrics.saved}, ${metrics.reposts},
      ${metrics.total_interactions}, ${metrics.reels_skip_rate}, ${metrics.ig_reels_avg_watch_time},
      ${engagement_rate}, ${vs_baseline}, ${save_share_ratio}, ${retention},
      ${comment_sentiment ? JSON.stringify(comment_sentiment) : null}, ${is_mock}, NOW()
    )
    ON CONFLICT (video_id) DO UPDATE SET
      scheduled_post_id = EXCLUDED.scheduled_post_id,
      instagram_media_id = EXCLUDED.instagram_media_id,
      views = EXCLUDED.views, reach = EXCLUDED.reach, likes = EXCLUDED.likes,
      comments = EXCLUDED.comments, shares = EXCLUDED.shares, saved = EXCLUDED.saved,
      reposts = EXCLUDED.reposts, total_interactions = EXCLUDED.total_interactions,
      reels_skip_rate = EXCLUDED.reels_skip_rate,
      ig_reels_avg_watch_time = EXCLUDED.ig_reels_avg_watch_time,
      engagement_rate = EXCLUDED.engagement_rate, vs_baseline = EXCLUDED.vs_baseline,
      save_share_ratio = EXCLUDED.save_share_ratio, retention = EXCLUDED.retention,
      comment_sentiment = EXCLUDED.comment_sentiment, is_mock = EXCLUDED.is_mock,
      collected_at = NOW()
    RETURNING *
  `;
  return rows[0];
}

// Real path only: accounts under 100 followers or non-professional don't get reliable
// insights from the Graph API, so the collector falls back to the mock dataset for them.
async function shouldFallBackToMock(token) {
  try {
    const info = await getAccountInfo(token.ig_user_id, token.access_token);
    return (
      (info.followers_count ?? 0) < MIN_FOLLOWERS_FOR_REAL_INSIGHTS ||
      !PROFESSIONAL_ACCOUNT_TYPES.has(info.account_type)
    );
  } catch (err) {
    console.error('[Analytics] getAccountInfo failed, falling back to mock:', err.message);
    return true;
  }
}

// Collect analytics for every posted Reel in a brand's cycle.
async function collectForBrand(userId, brandCardId) {
  const posts = await sql`
    SELECT sp.id AS scheduled_post_id, sp.instagram_media_id, sp.video_id, sp.published_at, gv.slot_data
    FROM scheduled_posts sp
    JOIN generated_videos gv ON gv.id = sp.video_id
    WHERE gv.brand_card_id = ${brandCardId}
      AND sp.user_id = ${userId}
      AND sp.status = 'posted'
      AND sp.instagram_media_id IS NOT NULL
    ORDER BY sp.published_at ASC
  `;

  const token = MOCK ? null : await getToken(userId);
  const accessToken = token?.access_token;
  const useMock = MOCK || (token ? await shouldFallBackToMock(token) : true);
  const baseline = await getAccountBaseline(userId);

  // Eligible posts processed concurrently — sentiment calls (one OpenRouter request
  // per Reel) are the dominant cost, and they're independent of each other.
  const eligible = posts.filter(
    (post) =>
      !post.published_at || Date.now() - new Date(post.published_at).getTime() >= INSIGHTS_MIN_AGE_MS
  );

  const rows = await Promise.all(
    eligible.map(async (post) => {
      const { metrics, comments, is_mock } = await fetchReelData(post.instagram_media_id, accessToken, useMock);

      // Reel too fresh / insights not populated yet → skip, do not record zeros as final
      if (metrics.views == null && metrics.reach == null) return null;
      // Divide-by-zero guard → skip, retry next collection
      if (!metrics.reach || metrics.reach === 0) return null;

      const engagement_rate = metrics.total_interactions / metrics.reach;
      const vs_baseline = baseline ? engagement_rate / baseline : 1.0;
      const save_share_ratio = metrics.views ? (metrics.saved + metrics.shares) / metrics.views : null;
      const targetDuration = post.slot_data?.target_duration_seconds;
      const retention =
        metrics.reels_skip_rate != null
          ? 1 - metrics.reels_skip_rate
          : (metrics.ig_reels_avg_watch_time != null && targetDuration
              ? metrics.ig_reels_avg_watch_time / targetDuration
              : null);
      const comment_sentiment = await collectSentiment(comments);

      return upsertAnalytics({
        userId,
        video_id: post.video_id,
        scheduled_post_id: post.scheduled_post_id,
        instagram_media_id: post.instagram_media_id,
        metrics,
        engagement_rate,
        vs_baseline,
        save_share_ratio,
        retention,
        comment_sentiment,
        is_mock,
      });
    })
  );

  return rows.filter(Boolean);
}

// Fetch stored analytics for a single Reel (GET /api/analytics/:video_id)
async function getAnalyticsForVideo(userId, videoId) {
  const rows = await sql`
    SELECT * FROM reel_analytics
    WHERE video_id = ${videoId} AND user_id = ${userId}
  `;
  return rows[0] || null;
}

module.exports = { collectForBrand, getAnalyticsForVideo };
