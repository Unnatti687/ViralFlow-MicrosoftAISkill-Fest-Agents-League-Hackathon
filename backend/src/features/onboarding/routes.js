const { Router } = require('express');
const auth = require('../../middleware/auth');
const { handleChat, handleCreateBrandCard, handleGetBrandCard, handleGetMyBrandCard, handleVoiceSummary } = require('./controller');

const router = Router();

router.post('/onboarding/chat', auth, handleChat);
router.post('/brand-cards', auth, handleCreateBrandCard);
router.get('/brand-cards/me', auth, handleGetMyBrandCard);
router.get('/brand-cards/:id', auth, handleGetBrandCard);
router.post('/brand-cards/:id/voice-summary', auth, handleVoiceSummary);

module.exports = router;
