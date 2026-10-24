// Mock Instagram Graph API — activated when MOCK_INSTAGRAM=true.
// Mirrors lib/instagram.js's interface exactly so publisher service/worker/token/controller
// run unchanged against fake data. Flip the flag off when real IG access lands.

const { randomUUID } = require('crypto');

const MOCK_ACCESS_TOKEN = 'mock-ig-access-token';
const MOCK_USER_ID = 'mock-ig-user-1789';
const MOCK_USERNAME = 'viralflow_demo';
const SIXTY_DAYS_SEC = 60 * 24 * 60 * 60;

// Tracks poll count per container so the first poll returns IN_PROGRESS and the
// next returns FINISHED — exercises the worker's real poll loop.
const containerPolls = new Map();

function buildAuthorizeUrl() {
  // Skip the real Meta consent screen — bounce straight back to our callback with a fake code.
  const redirect =
    process.env.INSTAGRAM_OAUTH_REDIRECT_URI ||
    'http://localhost:3001/api/instagram/oauth/callback';
  return `${redirect}?code=mock-oauth-code`;
}

async function exchangeCodeForToken() {
  return { access_token: 'mock-short-lived-token', user_id: MOCK_USER_ID };
}

async function getLongLivedToken() {
  return { access_token: MOCK_ACCESS_TOKEN, token_type: 'bearer', expires_in: SIXTY_DAYS_SEC };
}

async function refreshLongLivedToken() {
  return { access_token: MOCK_ACCESS_TOKEN, token_type: 'bearer', expires_in: SIXTY_DAYS_SEC };
}

async function getIgUserProfile() {
  return { user_id: MOCK_USER_ID, username: MOCK_USERNAME };
}

async function createMediaContainer() {
  const id = `mock_container_${randomUUID()}`;
  containerPolls.set(id, 0);
  return id;
}

async function getContainerStatus(containerId) {
  const polls = (containerPolls.get(containerId) || 0) + 1;
  containerPolls.set(containerId, polls);
  // First poll: still processing. Second+: ready.
  const status_code = polls < 2 ? 'IN_PROGRESS' : 'FINISHED';
  return { status_code, status: status_code };
}

async function publishContainer(igUserId, containerId) {
  containerPolls.delete(containerId);
  return `mock_media_${randomUUID()}`;
}

async function getPublishingLimit() {
  return { quotaUsage: 0, maxQuota: 50 };
}

// Insights / comments are read by the analytics collector. The collector takes the
// mock branch on its own (using mock-data.js with per-Reel variety), so these exist
// only for interface parity and are not used on the mock path.
async function getMediaInsights() {
  return {};
}

async function getMediaComments() {
  return [];
}

function getGraphErrorCode(err) {
  return err.response?.data?.error?.code;
}

// Reports a healthy professional account so the collector's follower/account-type
// fallback never overrides the explicit MOCK_INSTAGRAM mock path.
async function getAccountInfo() {
  return { followers_count: 1500, account_type: 'BUSINESS' };
}

module.exports = {
  buildAuthorizeUrl,
  exchangeCodeForToken,
  getLongLivedToken,
  refreshLongLivedToken,
  getIgUserProfile,
  createMediaContainer,
  getContainerStatus,
  publishContainer,
  getPublishingLimit,
  getMediaInsights,
  getMediaComments,
  getAccountInfo,
  getGraphErrorCode,
};
