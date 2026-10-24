const { sql } = require('../../db/client');
const { getToken, markNeedsReauth, setLastPublishedAt } = require('./token');
const { collectForBrand } = require('../analytics/collector');
const { optimizeBrand } = require('../analytics/optimizer');
const {
  createMediaContainer,
  getContainerStatus,
  publishContainer,
  getPublishingLimit,
  getGraphErrorCode,
} = require('../../lib/instagram');

// Caption folding happens here, at publish time — DB stores caption/cta/hashtags separately
async function buildFinalCaption(videoId, caption) {
  const rows = await sql`SELECT script, hashtags FROM generated_videos WHERE id = ${videoId}`;
  const video = rows[0] || {};
  const cta = video.script?.cta || '';
  const hashtags = video.hashtags || [];
  return [caption, cta, hashtags.join(' ')].filter(Boolean).join('\n\n');
}

// Atomically claims one due row, respecting per-account spacing + reauth pause
async function claimNextScheduledPost() {
  const rows = await sql`
    UPDATE scheduled_posts sp
    SET status = 'publishing', updated_at = NOW()
    WHERE sp.id = (
      SELECT sp2.id FROM scheduled_posts sp2
      JOIN instagram_tokens it ON it.user_id = sp2.user_id
      WHERE sp2.status = 'scheduled'
        AND sp2.scheduled_time <= NOW()
        AND it.needs_reauth = FALSE
        AND (it.last_published_at IS NULL OR NOW() - it.last_published_at >= INTERVAL '10 minutes')
      ORDER BY sp2.scheduled_time ASC
      FOR UPDATE OF sp2 SKIP LOCKED
      LIMIT 1
    )
    RETURNING sp.*
  `;
  return rows[0] || null;
}

async function getPublishingRowsWithContainer() {
  return sql`SELECT * FROM scheduled_posts WHERE status = 'publishing' AND ig_container_id IS NOT NULL`;
}

async function revertToScheduled(rowId, fields = {}) {
  const { scheduledTime, errorMessage, retryCountIncrement } = fields;
  await sql`
    UPDATE scheduled_posts
    SET status = 'scheduled',
        scheduled_time = COALESCE(${scheduledTime ? scheduledTime.toISOString() : null}, scheduled_time),
        error_message = COALESCE(${errorMessage || null}, error_message),
        retry_count = retry_count + ${retryCountIncrement || 0},
        updated_at = NOW()
    WHERE id = ${rowId}
  `;
}

async function markFailed(rowId, errorMessage) {
  await sql`
    UPDATE scheduled_posts
    SET status = 'failed', error_message = ${errorMessage}, updated_at = NOW()
    WHERE id = ${rowId}
  `;
}

// Shared error handling for Graph API failures during container create / status / publish
async function handleGraphError(row, userId, err) {
  const code = getGraphErrorCode(err);
  const message = err.response?.data?.error?.message || err.message;

  if (code === 190) {
    // Token expired — pause this user's queue, do not mark posts failed
    await markNeedsReauth(userId);
    await revertToScheduled(row.id, { errorMessage: 'Instagram authorization expired — reconnect required' });
    return;
  }
  if (code === 25) {
    // Account restricted — pause publishing, surface clearly
    await markNeedsReauth(userId);
    await revertToScheduled(row.id, { errorMessage: `Instagram account restricted: ${message}` });
    return;
  }
  if (code === 9007) {
    // Media not ready — auto-retry with backoff (next cron tick)
    await revertToScheduled(row.id, { retryCountIncrement: 1, errorMessage: message });
    return;
  }
  if (code === 352) {
    // Video spec rejected — fail with reason, surface for regeneration
    await markFailed(row.id, `Video rejected by Instagram: ${message}`);
    return;
  }

  await markFailed(row.id, message);
}

// New claim: create the IG media container (containers expire after 24h, so this happens at publish time)
async function startContainer(row) {
  const token = await getToken(row.user_id);
  if (!token) {
    await revertToScheduled(row.id, { errorMessage: 'No Instagram account connected' });
    await markNeedsReauth(row.user_id);
    return;
  }

  try {
    const limit = await getPublishingLimit(token.ig_user_id, token.access_token);
    if (limit.quotaUsage >= limit.maxQuota) {
      // Daily limit hit — requeue for next window, do not fail
      await revertToScheduled(row.id, { scheduledTime: new Date(Date.now() + 60 * 60 * 1000) });
      return;
    }

    const finalCaption = await buildFinalCaption(row.video_id, row.caption);
    const containerId = await createMediaContainer(token.ig_user_id, row.public_video_url, finalCaption, token.access_token);

    await sql`
      UPDATE scheduled_posts
      SET ig_container_id = ${containerId}, updated_at = NOW()
      WHERE id = ${row.id}
    `;
  } catch (err) {
    await handleGraphError(row, row.user_id, err);
  }
}

// Poll an existing container, publish once FINISHED
async function pollAndPublish(row) {
  const token = await getToken(row.user_id);
  if (!token) {
    await revertToScheduled(row.id, { errorMessage: 'No Instagram account connected' });
    await markNeedsReauth(row.user_id);
    return;
  }

  try {
    const { status_code } = await getContainerStatus(row.ig_container_id, token.access_token);

    if (status_code === 'IN_PROGRESS') return; // check again next tick

    if (status_code === 'EXPIRED') {
      // Rebuild container from scratch next tick
      await sql`
        UPDATE scheduled_posts
        SET ig_container_id = NULL, status = 'scheduled', updated_at = NOW()
        WHERE id = ${row.id}
      `;
      return;
    }

    if (status_code === 'ERROR') {
      await markFailed(row.id, 'Instagram container processing failed');
      return;
    }

    if (status_code === 'FINISHED') {
      const mediaId = await publishContainer(token.ig_user_id, row.ig_container_id, token.access_token);
      const now = new Date();
      await sql`
        UPDATE scheduled_posts
        SET status = 'posted', instagram_media_id = ${mediaId}, published_at = ${now.toISOString()}, updated_at = NOW()
        WHERE id = ${row.id}
      `;
      await setLastPublishedAt(row.user_id, now);
      await maybeCloseCycle(row);
    }
  } catch (err) {
    await handleGraphError(row, row.user_id, err);
  }
}

// After a publish, check if every post in this brand's cycle is now posted/failed.
// If so, close the loop: collect analytics + run the Optimization Agent (Slice 5).
// Best-effort and non-fatal — a failure here must never break the publish path.
async function maybeCloseCycle(row) {
  try {
    const vid = await sql`SELECT brand_card_id FROM generated_videos WHERE id = ${row.video_id}`;
    const brandCardId = vid[0]?.brand_card_id;
    if (!brandCardId) return;

    const pending = await sql`
      SELECT COUNT(*)::int AS n
      FROM scheduled_posts sp
      JOIN generated_videos gv ON gv.id = sp.video_id
      WHERE gv.brand_card_id = ${brandCardId}
        AND sp.user_id = ${row.user_id}
        AND sp.status IN ('scheduled', 'publishing')
    `;
    if ((pending[0]?.n || 0) > 0) return; // cycle not complete yet

    console.log(`[Publisher] Cycle complete for brand ${brandCardId} — collecting analytics + optimizing`);
    await collectForBrand(row.user_id, brandCardId);
    await optimizeBrand(row.user_id, brandCardId);
  } catch (err) {
    console.error('[Publisher] Cycle close / optimize failed:', err.message);
  }
}

// Manual retry — reset a failed row back into the queue
async function retryScheduledPost(rowId, userId) {
  const rows = await sql`
    UPDATE scheduled_posts
    SET status = 'scheduled', error_message = NULL, ig_container_id = NULL, updated_at = NOW()
    WHERE id = ${rowId} AND user_id = ${userId} AND status = 'failed'
    RETURNING *
  `;
  if (!rows[0]) {
    const err = new Error('Scheduled post not found or not in failed state');
    err.status = 404;
    throw err;
  }
  return rows[0];
}

async function listScheduledPosts(userId) {
  return sql`
    SELECT sp.*, gv.video_url, gv.hashtags
    FROM scheduled_posts sp
    JOIN generated_videos gv ON gv.id = sp.video_id
    WHERE sp.user_id = ${userId}
    ORDER BY sp.scheduled_time ASC
  `;
}

// Backdated past the 24h Instagram-insights-readiness gate (collector.js) so
// (demo) publishes can be collected and optimized immediately.
const DEMO_BACKDATE_HOURS = 25;

function assertMockMode() {
  if (process.env.MOCK_INSTAGRAM !== 'true') {
    const err = new Error('(demo) publish is only available in mock mode');
    err.status = 400;
    throw err;
  }
}

// Marks one scheduled post as posted with a fake Instagram media id, bypassing the
// cron queue, spacing rule, and container poll loop entirely.
async function markPostedDemo(row) {
  const containerId = await createMediaContainer();
  const mediaId = await publishContainer(null, containerId);
  const publishedAt = new Date(Date.now() - DEMO_BACKDATE_HOURS * 60 * 60 * 1000);
  await sql`
    UPDATE scheduled_posts
    SET status = 'posted', instagram_media_id = ${mediaId}, ig_container_id = NULL,
        published_at = ${publishedAt.toISOString()}, error_message = NULL, updated_at = NOW()
    WHERE id = ${row.id}
  `;
}

// (demo) Instantly mock-publish a single approved video, then run analytics
// collection + optimization synchronously so the self-improvement loop is visible
// without waiting on cron, spacing, or the 24h insights delay.
async function publishVideoDemo(videoId, userId) {
  assertMockMode();

  const rows = await sql`
    SELECT sp.*, gv.brand_card_id
    FROM scheduled_posts sp
    JOIN generated_videos gv ON gv.id = sp.video_id
    WHERE sp.video_id = ${videoId} AND sp.user_id = ${userId}
  `;
  const row = rows[0];
  if (!row) {
    const err = new Error('No scheduled post found for this video — approve it first');
    err.status = 404;
    throw err;
  }
  if (row.status === 'posted') {
    const err = new Error('This video is already published');
    err.status = 400;
    throw err;
  }

  await markPostedDemo(row);

  const analytics = await collectForBrand(userId, row.brand_card_id);
  const optimize_result = await optimizeBrand(userId, row.brand_card_id);

  const updated = await sql`SELECT * FROM scheduled_posts WHERE id = ${row.id}`;
  return { scheduled_post: updated[0], analytics, optimize_result };
}

// (demo) Instantly mock-publish every still-scheduled post for a brand, then run
// analytics collection + optimization once for the whole batch.
async function publishAllDemo(userId, brandCardId) {
  assertMockMode();

  const rows = await sql`
    SELECT sp.*
    FROM scheduled_posts sp
    JOIN generated_videos gv ON gv.id = sp.video_id
    WHERE gv.brand_card_id = ${brandCardId} AND sp.user_id = ${userId} AND sp.status = 'scheduled'
  `;

  for (const row of rows) {
    await markPostedDemo(row);
  }

  const analytics = await collectForBrand(userId, brandCardId);
  const optimize_result = await optimizeBrand(userId, brandCardId);

  return { published: rows.length, analytics, optimize_result };
}

module.exports = {
  claimNextScheduledPost,
  getPublishingRowsWithContainer,
  startContainer,
  pollAndPublish,
  retryScheduledPost,
  listScheduledPosts,
  publishVideoDemo,
  publishAllDemo,
};
