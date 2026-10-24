const { generateCalendar, regenerateSlot, getSlots, replaceSlots, getBrandCard } = require('./service');

async function handleGenerateCalendar(req, res, next) {
  try {
    const { brand_card_id, strategy_rules, insights } = req.body;
    if (!brand_card_id) {
      return res.status(400).json({ error: 'brand_card_id is required' });
    }
    const result = await generateCalendar(req.userId, brand_card_id, strategy_rules, insights);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function handleRegenerateSlot(req, res, next) {
  try {
    const { brand_card_id, slot } = req.body;
    if (!brand_card_id || !slot) {
      return res.status(400).json({ error: 'brand_card_id and slot are required' });
    }
    if (!slot.day || !slot.date) {
      return res.status(400).json({ error: 'slot must include day and date' });
    }
    const newSlot = await regenerateSlot(req.userId, brand_card_id, slot);
    res.json(newSlot);
  } catch (err) {
    next(err);
  }
}

async function handleGetSlots(req, res, next) {
  try {
    const { brand_card_id } = req.query;
    if (!brand_card_id) {
      return res.status(400).json({ error: 'brand_card_id is required' });
    }
    const card = await getBrandCard(brand_card_id, req.userId);
    if (!card) {
      return res.status(404).json({ error: 'Brand card not found' });
    }
    const result = await getSlots(req.userId, brand_card_id);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function handleSaveSlots(req, res, next) {
  try {
    const { brand_card_id, slots, mode } = req.body;
    if (!brand_card_id || !Array.isArray(slots)) {
      return res.status(400).json({ error: 'brand_card_id and slots are required' });
    }
    const card = await getBrandCard(brand_card_id, req.userId);
    if (!card) {
      return res.status(404).json({ error: 'Brand card not found' });
    }
    const saved = await replaceSlots(req.userId, brand_card_id, slots, mode);
    res.json({ slots: saved, mode: mode || null });
  } catch (err) {
    next(err);
  }
}

module.exports = { handleGenerateCalendar, handleRegenerateSlot, handleGetSlots, handleSaveSlots };
