const { processChat, saveBrandCard, getBrandCard, getLatestBrandCard, generateVoiceSummary } = require('./service');

async function handleChat(req, res, next) {
  try {
    const { conversationHistory, extractionState } = req.body;
    if (!Array.isArray(conversationHistory)) {
      return res.status(400).json({ error: 'conversationHistory must be an array' });
    }
    const result = await processChat(
      conversationHistory,
      extractionState || { collected: {}, status: 'in_progress' }
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function handleCreateBrandCard(req, res, next) {
  try {
    const card = await saveBrandCard(req.userId, req.body);
    res.status(201).json(card);
  } catch (err) {
    next(err);
  }
}

async function handleGetBrandCard(req, res, next) {
  try {
    const card = await getBrandCard(req.params.id, req.userId);
    if (!card) return res.status(404).json({ error: 'Not found' });
    res.json(card);
  } catch (err) {
    next(err);
  }
}

async function handleGetMyBrandCard(req, res, next) {
  try {
    const card = await getLatestBrandCard(req.userId);
    if (!card) return res.status(404).json({ error: 'Not found' });
    res.json(card);
  } catch (err) {
    next(err);
  }
}

async function handleVoiceSummary(req, res, next) {
  try {
    const card = await generateVoiceSummary(req.params.id, req.userId);
    res.json(card);
  } catch (err) {
    next(err);
  }
}

module.exports = { handleChat, handleCreateBrandCard, handleGetBrandCard, handleGetMyBrandCard, handleVoiceSummary };
