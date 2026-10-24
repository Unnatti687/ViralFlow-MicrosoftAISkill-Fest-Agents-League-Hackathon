const { collectForBrand, getAnalyticsForVideo } = require('./collector');
const { optimizeBrand, getLatestOptimization, activateVersion, overrideVersion } = require('./optimizer');

async function handleGetAnalytics(req, res, next) {
  try {
    const row = await getAnalyticsForVideo(req.userId, req.params.video_id);
    if (!row) return res.status(404).json({ error: 'No analytics found for this Reel' });
    res.json(row);
  } catch (err) {
    next(err);
  }
}

async function handleCollect(req, res, next) {
  try {
    const results = await collectForBrand(req.userId, req.params.brand_card_id);
    // Auto-run optimization right after collection, so the self-improvement loop
    // doesn't need a separate manual "Run Optimization" step.
    const optimize_result = await optimizeBrand(req.userId, req.params.brand_card_id);
    res.json({ collected: results.length, analytics: results, optimize_result });
  } catch (err) {
    next(err);
  }
}

async function handleOptimize(req, res, next) {
  try {
    const { brand_card_id } = req.body;
    if (!brand_card_id) return res.status(400).json({ error: 'brand_card_id is required' });
    const result = await optimizeBrand(req.userId, brand_card_id);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function handleGetLatestOptimization(req, res, next) {
  try {
    const { brand_card_id } = req.query;
    if (!brand_card_id) return res.status(400).json({ error: 'brand_card_id is required' });
    const result = await getLatestOptimization(req.userId, brand_card_id);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function handleActivateVersion(req, res, next) {
  try {
    const version = await activateVersion(req.userId, req.params.id);
    res.json({ success: true, strategy_version: version });
  } catch (err) {
    next(err);
  }
}

async function handleOverrideVersion(req, res, next) {
  try {
    const { strategy_rules } = req.body;
    if (!strategy_rules || typeof strategy_rules !== 'object') {
      return res.status(400).json({ error: 'strategy_rules object is required' });
    }
    const version = await overrideVersion(req.userId, req.params.id, strategy_rules);
    res.json({ success: true, strategy_version: version });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  handleGetAnalytics,
  handleCollect,
  handleOptimize,
  handleGetLatestOptimization,
  handleActivateVersion,
  handleOverrideVersion,
};
