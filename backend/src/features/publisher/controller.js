const {
  buildAuthorizeUrl,
  exchangeCodeForToken,
  getLongLivedToken,
  getIgUserProfile,
} = require('../../lib/instagram');
const { saveToken, getToken, refreshUserToken } = require('./token');
const { retryScheduledPost, listScheduledPosts } = require('./service');

function handleOAuthStart(req, res) {
  res.redirect(buildAuthorizeUrl());
}

async function handleOAuthCallback(req, res, next) {
  try {
    const { code, error } = req.query;
    const frontendUrl = process.env.FRONTEND_BASE_URL || 'http://localhost:5173';

    if (error) {
      return res.redirect(`${frontendUrl}/schedule?ig_error=${encodeURIComponent(String(error))}`);
    }
    if (!code) return res.status(400).json({ error: 'code is required' });

    const shortLived = await exchangeCodeForToken(code);
    const longLived = await getLongLivedToken(shortLived.access_token);
    const profile = await getIgUserProfile(longLived.access_token);

    await saveToken(req.userId, profile.user_id, profile.username, longLived.access_token, longLived.expires_in);

    res.redirect(`${frontendUrl}/schedule?ig_connected=1`);
  } catch (err) {
    next(err);
  }
}

async function handleStatus(req, res, next) {
  try {
    const token = await getToken(req.userId);
    if (!token) return res.json({ connected: false });

    res.json({
      connected: true,
      account_name: token.account_name,
      ig_user_id: token.ig_user_id,
      expires_at: token.token_expires_at,
      needs_reauth: token.needs_reauth,
    });
  } catch (err) {
    next(err);
  }
}

async function handleRefreshToken(req, res, next) {
  try {
    const result = await refreshUserToken(req.userId);
    res.json({ success: true, expires_at: result.expires_at });
  } catch (err) {
    next(err);
  }
}

async function handleListSchedule(req, res, next) {
  try {
    const posts = await listScheduledPosts(req.userId);
    res.json(posts);
  } catch (err) {
    next(err);
  }
}

async function handleRetry(req, res, next) {
  try {
    const post = await retryScheduledPost(req.params.id, req.userId);
    res.json({ success: true, scheduled_post: post });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  handleOAuthStart,
  handleOAuthCallback,
  handleStatus,
  handleRefreshToken,
  handleListSchedule,
  handleRetry,
};
