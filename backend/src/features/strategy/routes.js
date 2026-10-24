const { Router } = require('express');
const auth = require('../../middleware/auth');
const { handleGenerateCalendar, handleRegenerateSlot, handleGetSlots, handleSaveSlots } = require('./controller');

const router = Router();

router.post('/strategy/generate', auth, handleGenerateCalendar);
router.get('/strategy/slots', auth, handleGetSlots);
router.put('/strategy/slots', auth, handleSaveSlots);
router.post('/strategy/slots/regenerate', auth, handleRegenerateSlot);

module.exports = router;
