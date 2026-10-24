const { signup, login, getUserById } = require('./service');

const COOKIE_NAME = 'token';
const COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE_MS,
  };
}

async function handleSignup(req, res, next) {
  try {
    const { instagram_id, password } = req.body;
    if (!instagram_id || !password) {
      return res.status(400).json({ error: 'instagram_id and password are required' });
    }

    const { user, token } = await signup(instagram_id, password);
    res.cookie(COOKIE_NAME, token, cookieOptions());
    res.status(201).json({ user });
  } catch (err) {
    next(err);
  }
}

async function handleLogin(req, res, next) {
  try {
    const { instagram_id, password } = req.body;
    if (!instagram_id || !password) {
      return res.status(400).json({ error: 'instagram_id and password are required' });
    }

    const { user, token } = await login(instagram_id, password);
    res.cookie(COOKIE_NAME, token, cookieOptions());
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

function handleLogout(req, res) {
  res.clearCookie(COOKIE_NAME, cookieOptions());
  res.json({ success: true });
}

async function handleMe(req, res, next) {
  try {
    const user = await getUserById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

module.exports = { handleSignup, handleLogin, handleLogout, handleMe };
