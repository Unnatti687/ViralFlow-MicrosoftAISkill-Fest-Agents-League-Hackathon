const axios = require('axios');
const {
  GRAPH_BASE_URL,
  OAUTH_TOKEN_URL,
  OAUTH_AUTHORIZE_URL,
} = require('../config/instagram');

function buildAuthorizeUrl() {
  const params = new URLSearchParams({
    client_id: process.env.INSTAGRAM_APP_ID,
    redirect_uri: process.env.INSTAGRAM_OAUTH_REDIRECT_URI,
    response_type: 'code',
    scope: 'instagram_business_basic,instagram_business_content_publish',
  });
  return `${OAUTH_AUTHORIZE_URL}?${params.toString()}`;
}

// Step 1: exchange the OAuth code for a short-lived token
async function exchangeCodeForToken(code) {
  const params = new URLSearchParams({
    client_id: process.env.INSTAGRAM_APP_ID,
    client_secret: process.env.INSTAGRAM_APP_SECRET,
    grant_type: 'authorization_code',
    redirect_uri: process.env.INSTAGRAM_OAUTH_REDIRECT_URI,
    code,
  });
  const { data } = await axios.post(OAUTH_TOKEN_URL, params);
  return data; // { access_token, user_id }
}

// Step 2: exchange short-lived token for a long-lived (60-day) token
async function getLongLivedToken(shortLivedToken) {
  const { data } = await axios.get(`${GRAPH_BASE_URL}/access_token`, {
    params: {
      grant_type: 'ig_exchange_token',
      client_secret: process.env.INSTAGRAM_APP_SECRET,
      access_token: shortLivedToken,
    },
  });
  return data; // { access_token, token_type, expires_in }
}

// Refresh a long-lived token before it expires (must be > 24h old, < 60 days)
async function refreshLongLivedToken(longLivedToken) {
  const { data } = await axios.get(`${GRAPH_BASE_URL}/refresh_access_token`, {
    params: {
      grant_type: 'ig_refresh_token',
      access_token: longLivedToken,
    },
  });
  return data; // { access_token, token_type, expires_in }
}

async function getIgUserProfile(accessToken) {
  const { data } = await axios.get(`${GRAPH_BASE_URL}/me`, {
    params: { fields: 'user_id,username', access_token: accessToken },
  });
  return data; // { user_id, username }
}

async function createMediaContainer(igUserId, videoUrl, caption, accessToken) {
  const { data } = await axios.post(`${GRAPH_BASE_URL}/${igUserId}/media`, null, {
    params: {
      media_type: 'REELS',
      video_url: videoUrl,
      caption,
      access_token: accessToken,
    },
  });
  return data.id; // container id
}

async function getContainerStatus(containerId, accessToken) {
  const { data } = await axios.get(`${GRAPH_BASE_URL}/${containerId}`, {
    params: { fields: 'status_code,status', access_token: accessToken },
  });
  return data; // { status_code: 'IN_PROGRESS' | 'FINISHED' | 'ERROR' | 'EXPIRED', status }
}

async function publishContainer(igUserId, containerId, accessToken) {
  const { data } = await axios.post(`${GRAPH_BASE_URL}/${igUserId}/media_publish`, null, {
    params: { creation_id: containerId, access_token: accessToken },
  });
  return data.id; // instagram media id
}

async function getPublishingLimit(igUserId, accessToken) {
  const { data } = await axios.get(`${GRAPH_BASE_URL}/${igUserId}/content_publishing_limit`, {
    params: { fields: 'config,quota_usage', access_token: accessToken },
  });
  const item = data.data?.[0] || {};
  return { quotaUsage: item.quota_usage || 0, maxQuota: item.config?.quota_total || 50 };
}

// Analytics — current metric names only (views-first model). NEVER impressions/plays/video_views.
const INSIGHT_METRICS = 'views,reach,likes,comments,shares,saved,total_interactions,reels_skip_rate';

async function getMediaInsights(mediaId, accessToken) {
  const { data } = await axios.get(`${GRAPH_BASE_URL}/${mediaId}/insights`, {
    params: { metric: INSIGHT_METRICS, access_token: accessToken },
  });
  // Response shape: data.data = [{ name, values: [{ value }] }]
  const out = {};
  for (const item of data.data || []) {
    out[item.name] = item.values?.[0]?.value ?? null;
  }
  return out;
}

async function getMediaComments(mediaId, accessToken) {
  const { data } = await axios.get(`${GRAPH_BASE_URL}/${mediaId}/comments`, {
    params: { fields: 'text,username,timestamp', access_token: accessToken },
  });
  return data.data || []; // [{ text, username, timestamp }]
}

// Graph API errors arrive as err.response.data.error = { message, type, code, error_subcode }
function getGraphErrorCode(err) {
  return err.response?.data?.error?.code;
}

// Used by the analytics collector to decide whether to fall back to the mock dataset
// (accounts under 100 followers or non-professional, per spec).
async function getAccountInfo(igUserId, accessToken) {
  const { data } = await axios.get(`${GRAPH_BASE_URL}/${igUserId}`, {
    params: { fields: 'followers_count,account_type', access_token: accessToken },
  });
  return data; // { followers_count, account_type: 'BUSINESS' | 'CREATOR' | 'PERSONAL' | ... }
}

const realImpl = {
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

// Swap in the mock at the boundary — every caller (publisher service/worker/token,
// analytics collector) goes through this module, so nothing downstream changes.
module.exports =
  process.env.MOCK_INSTAGRAM === 'true' ? require('./instagram.mock') : realImpl;
