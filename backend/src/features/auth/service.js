const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sql } = require('../../db/client');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

function issueToken(userId) {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

async function signup(instagramId, password) {
  const existing = await sql`SELECT id FROM users WHERE instagram_id = ${instagramId}`;
  if (existing.length > 0) {
    const err = new Error('Instagram ID already registered');
    err.status = 409;
    throw err;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const [user] = await sql`
    INSERT INTO users (instagram_id, password_hash)
    VALUES (${instagramId}, ${passwordHash})
    RETURNING id, instagram_id, created_at
  `;

  return { user, token: issueToken(user.id) };
}

async function login(instagramId, password) {
  const [user] = await sql`SELECT id, instagram_id, password_hash, created_at FROM users WHERE instagram_id = ${instagramId}`;
  if (!user) {
    const err = new Error('Invalid Instagram ID or password');
    err.status = 401;
    throw err;
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    const err = new Error('Invalid Instagram ID or password');
    err.status = 401;
    throw err;
  }

  return {
    user: { id: user.id, instagram_id: user.instagram_id, created_at: user.created_at },
    token: issueToken(user.id),
  };
}

async function getUserById(userId) {
  const [user] = await sql`SELECT id, instagram_id, created_at FROM users WHERE id = ${userId}`;
  return user || null;
}

module.exports = { issueToken, verifyToken, signup, login, getUserById };
