const { Router } = require('express');
const auth = require('../../middleware/auth');
const {
  handleOAuthStart,
  handleOAuthCallback,
  handleStatus,
  handleRefreshToken,
  handleListSchedule,
  handleRetry,
} = require('./controller');

const router = Router();

router.get('/instagram/oauth/start', auth, handleOAuthStart);
router.get('/instagram/oauth/callback', auth, handleOAuthCallback);
router.get('/instagram/status', auth, handleStatus);
router.post('/instagram/token/refresh', auth, handleRefreshToken);

router.get('/schedule', auth, handleListSchedule);
router.post('/schedule/:id/retry', auth, handleRetry);

module.exports = router;
