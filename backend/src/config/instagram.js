const GRAPH_VERSION = process.env.INSTAGRAM_GRAPH_VERSION || 'v23.0';
const GRAPH_BASE_URL = `https://graph.instagram.com/${GRAPH_VERSION}`;

// Instagram Login flow OAuth endpoints (not the Facebook Login flow)
const OAUTH_AUTHORIZE_URL = 'https://www.instagram.com/oauth/authorize';
const OAUTH_TOKEN_URL = 'https://api.instagram.com/oauth/access_token';

const PUBLISH_SPACING_MS = 10 * 60 * 1000; // 10 min minimum gap between publishes
const DAILY_PUBLISH_LIMIT = 50; // posts / 24h
const CONTAINER_POLL_TIMEOUT_MS = 10 * 60 * 1000; // safety cap, mirrors MPT poll

module.exports = {
  GRAPH_VERSION,
  GRAPH_BASE_URL,
  OAUTH_AUTHORIZE_URL,
  OAUTH_TOKEN_URL,
  PUBLISH_SPACING_MS,
  DAILY_PUBLISH_LIMIT,
  CONTAINER_POLL_TIMEOUT_MS,
};
