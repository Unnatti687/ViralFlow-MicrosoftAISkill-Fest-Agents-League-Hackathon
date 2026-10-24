const { Router } = require('express');
const auth = require('../../middleware/auth');
const { handleSignup, handleLogin, handleLogout, handleMe } = require('./controller');

const router = Router();

router.post('/auth/signup', handleSignup);
router.post('/auth/login', handleLogin);
router.post('/auth/logout', handleLogout);
router.get('/auth/me', auth, handleMe);

module.exports = router;
