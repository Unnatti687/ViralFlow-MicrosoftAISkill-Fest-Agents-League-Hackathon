const { Router } = require('express');
const auth = require('../../middleware/auth');
const {
  handleGetAnalytics,
  handleCollect,
  handleOptimize,
  handleGetLatestOptimization,
  handleActivateVersion,
  handleOverrideVersion,
} = require('./controller');

const router = Router();

router.get('/analytics/:video_id', auth, handleGetAnalytics);
router.post('/analytics/collect/:brand_card_id', auth, handleCollect);

router.post('/internal/optimize', auth, handleOptimize);
router.get('/internal/optimize/latest', auth, handleGetLatestOptimization);

router.post('/strategy/versions/:id/activate', auth, handleActivateVersion);
router.post('/strategy/versions/:id/override', auth, handleOverrideVersion);

module.exports = router;
