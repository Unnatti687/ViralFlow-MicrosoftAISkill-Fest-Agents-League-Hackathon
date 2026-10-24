const { Router } = require('express');
const auth = require('../../middleware/auth');
const {
  handleGenerate,
  handleGetStatus,
  handleListVideos,
  handleApprove,
  handleReject,
  handleRegenerate,
  handleUpdateCaption,
  handlePublishDemo,
  handlePublishAllDemo,
} = require('./controller');

const router = Router();

router.post('/videos/generate', auth, handleGenerate);
router.get('/videos', auth, handleListVideos);
router.post('/videos/publish-all-demo', auth, handlePublishAllDemo);
router.get('/videos/:id/status', auth, handleGetStatus);
router.post('/videos/:id/approve', auth, handleApprove);
router.post('/videos/:id/reject', auth, handleReject);
router.post('/videos/:id/regenerate', auth, handleRegenerate);
router.post('/videos/:id/publish-demo', auth, handlePublishDemo);
router.patch('/videos/:id/caption', auth, handleUpdateCaption);

module.exports = router;
