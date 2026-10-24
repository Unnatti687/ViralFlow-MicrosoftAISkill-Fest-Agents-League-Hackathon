const { sql } = require('../../db/client');
const { encrypt, decrypt } = require('../../lib/crypto');
const { refreshLongLivedToken } = require('../../lib/instagram');

async function saveToken(userId, igUserId, accountName, accessToken, expiresInSeconds) {
  const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);
  const rows = await sql`
    INSERT INTO instagram_tokens (user_id, ig_user_id, account_name, access_token, token_expires_at, needs_reauth)
    VALUES (${userId}, ${igUserId}, ${accountName}, ${encrypt(accessToken)}, ${expiresAt.toISOString()}, FALSE)
    ON CONFLICT (user_id) DO UPDATE
    SET ig_user_id = EXCLUDED.ig_user_id,
        account_name = EXCLUDED.account_name,
        access_token = EXCLUDED.access_token,
        token_expires_at = EXCLUDED.token_expires_at,
        needs_reauth = FALSE,
        updated_at = NOW()
    RETURNING *
  `;
  return rows[0];
}

async function getToken(userId) {
  const rows = await sql`SELECT * FROM instagram_tokens WHERE user_id = ${userId}`;
  const row = rows[0];
  if (!row) return null;
  return { ...row, access_token: decrypt(row.access_token) };
}

async function markNeedsReauth(userId) {
  await sql`UPDATE instagram_tokens SET needs_reauth = TRUE, updated_at = NOW() WHERE user_id = ${userId}`;
}

async function setLastPublishedAt(userId, publishedAt) {
  await sql`UPDATE instagram_tokens SET last_published_at = ${publishedAt.toISOString()}, updated_at = NOW() WHERE user_id = ${userId}`;
}

// Manually refresh a single user's token (POST /api/instagram/token/refresh)
async function refreshUserToken(userId) {
  const token = await getToken(userId);
  if (!token) {
    const err = new Error('No Instagram account connected');
    err.status = 404;
    throw err;
  }

  const { access_token, expires_in } = await refreshLongLivedToken(token.access_token);
  const expiresAt = new Date(Date.now() + expires_in * 1000);
  await sql`
    UPDATE instagram_tokens
    SET access_token = ${encrypt(access_token)}, token_expires_at = ${expiresAt.toISOString()}, updated_at = NOW()
    WHERE user_id = ${userId}
  `;
  return { expires_at: expiresAt };
}

// Refresh tokens nearing the 60-day expiry, run every 30 days (30-day buffer)
async function refreshDueTokens() {
  const cutoff = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // expiring within 30 days
  const rows = await sql`
    SELECT * FROM instagram_tokens
    WHERE token_expires_at <= ${cutoff.toISOString()} AND needs_reauth = FALSE
  `;

  for (const row of rows) {
    try {
      const decrypted = decrypt(row.access_token);
      const { access_token, expires_in } = await refreshLongLivedToken(decrypted);
      const expiresAt = new Date(Date.now() + expires_in * 1000);
      await sql`
        UPDATE instagram_tokens
        SET access_token = ${encrypt(access_token)}, token_expires_at = ${expiresAt.toISOString()}, updated_at = NOW()
        WHERE id = ${row.id}
      `;
      console.log(`[Instagram] Refreshed token for user ${row.user_id}`);
    } catch (err) {
      console.error(`[Instagram] Token refresh failed for user ${row.user_id}:`, err.response?.data || err.message);
    }
  }
}

module.exports = { saveToken, getToken, markNeedsReauth, setLastPublishedAt, refreshUserToken, refreshDueTokens };
