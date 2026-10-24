// Pre-loaded Week-1 Reel performance — same shape as the Instagram Graph insights response.
// Used when MOCK_INSTAGRAM=true (also the fallback path for accounts under 100 followers /
// non-professional accounts, per spec). Deliberately spread so the Optimization Agent finds
// real patterns: educational/9am Reels overperform; opinion + slow-opener Reels underperform.

const MOCK_REELS = [
  {
    // Educational, 9am — strong winner
    insights: {
      views: 5400, reach: 4200, likes: 310, comments: 24, shares: 41,
      saved: 88, reposts: 6, total_interactions: 463,
      reels_skip_rate: 0.34, ig_reels_avg_watch_time: 18.5,
    },
    comments: [
      { text: 'This is exactly what I needed, saved!', username: 'maria_builds', timestamp: '2026-06-02T09:40:00+0000' },
      { text: 'So clear, thank you 🙏', username: 'devjon', timestamp: '2026-06-02T10:12:00+0000' },
      { text: 'Underrated tip honestly', username: 'growthkate', timestamp: '2026-06-02T11:02:00+0000' },
      { text: 'meh, heard this before', username: 'skeptic_sam', timestamp: '2026-06-02T12:30:00+0000' },
    ],
  },
  {
    // Listicle, midday — solid
    insights: {
      views: 4800, reach: 3900, likes: 270, comments: 19, shares: 33,
      saved: 71, reposts: 4, total_interactions: 393,
      reels_skip_rate: 0.39, ig_reels_avg_watch_time: 15.2,
    },
    comments: [
      { text: 'Number 3 changed how I work', username: 'pixel_priya', timestamp: '2026-06-03T12:20:00+0000' },
      { text: 'great list 🔥', username: 'tomtomtom', timestamp: '2026-06-03T12:55:00+0000' },
      { text: 'could you do a part 2?', username: 'lena_codes', timestamp: '2026-06-03T13:40:00+0000' },
    ],
  },
  {
    // Opinion with slow opener — underperformer
    insights: {
      views: 3100, reach: 2700, likes: 78, comments: 6, shares: 5,
      saved: 9, reposts: 1, total_interactions: 98,
      reels_skip_rate: 0.61, ig_reels_avg_watch_time: 6.1,
    },
    comments: [
      { text: 'got boring fast', username: 'realtalk_99', timestamp: '2026-06-04T18:10:00+0000' },
      { text: 'disagree with this take', username: 'counterpoint', timestamp: '2026-06-04T19:25:00+0000' },
    ],
  },
  {
    // Founder story — average
    insights: {
      views: 4100, reach: 3400, likes: 198, comments: 31, shares: 22,
      saved: 40, reposts: 3, total_interactions: 291,
      reels_skip_rate: 0.45, ig_reels_avg_watch_time: 12.8,
    },
    comments: [
      { text: 'love the transparency 💯', username: 'startup_nina', timestamp: '2026-06-05T08:30:00+0000' },
      { text: 'this hit home', username: 'foundermike', timestamp: '2026-06-05T09:15:00+0000' },
      { text: 'how long did that take you?', username: 'curious_cal', timestamp: '2026-06-05T10:05:00+0000' },
    ],
  },
  {
    // Sales tip, 9am — high saves, strong
    insights: {
      views: 5900, reach: 4600, likes: 288, comments: 21, shares: 52,
      saved: 102, reposts: 8, total_interactions: 463,
      reels_skip_rate: 0.36, ig_reels_avg_watch_time: 17.0,
    },
    comments: [
      { text: 'sending this to my whole team', username: 'agency_owen', timestamp: '2026-06-06T09:50:00+0000' },
      { text: 'saved for later 📌', username: 'clara_sells', timestamp: '2026-06-06T10:30:00+0000' },
      { text: 'finally someone said it', username: 'b2b_brian', timestamp: '2026-06-06T11:10:00+0000' },
    ],
  },
  {
    // Trend reaction, evening — weak retention
    insights: {
      views: 3600, reach: 3100, likes: 121, comments: 9, shares: 11,
      saved: 18, reposts: 1, total_interactions: 159,
      reels_skip_rate: 0.55, ig_reels_avg_watch_time: 7.9,
    },
    comments: [
      { text: 'eh this trend is dead', username: 'trendwatch', timestamp: '2026-06-07T20:00:00+0000' },
      { text: 'lol ok', username: 'random_rui', timestamp: '2026-06-07T20:45:00+0000' },
    ],
  },
  {
    // How-to, 9am — winner
    insights: {
      views: 5200, reach: 4100, likes: 264, comments: 18, shares: 38,
      saved: 79, reposts: 5, total_interactions: 399,
      reels_skip_rate: 0.37, ig_reels_avg_watch_time: 16.4,
    },
    comments: [
      { text: 'best explanation i have seen', username: 'eng_emma', timestamp: '2026-06-08T09:20:00+0000' },
      { text: 'clean and to the point', username: 'mvp_max', timestamp: '2026-06-08T09:55:00+0000' },
      { text: 'subscribed', username: 'newfan_22', timestamp: '2026-06-08T10:40:00+0000' },
    ],
  },
];

// Stable index assignment per Instagram media id, so a Reel always maps to the same
// mock dataset across re-collections.
const mediaIndex = new Map();
let nextIndex = 0;

function getMockReel(mediaId) {
  if (!mediaIndex.has(mediaId)) {
    mediaIndex.set(mediaId, nextIndex % MOCK_REELS.length);
    nextIndex += 1;
  }
  return MOCK_REELS[mediaIndex.get(mediaId)];
}

module.exports = { MOCK_REELS, getMockReel };
