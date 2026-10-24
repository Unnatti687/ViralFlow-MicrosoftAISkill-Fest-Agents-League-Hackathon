// Prompts + parsers for the analytics/optimization LLM calls (OpenRouter).
// These are LLM steps, not Instagram API calls, so they run identically on the mock path.

function stripFences(raw) {
  return raw.replace(/```(?:json)?\n?/g, '').replace(/```/g, '').trim();
}

// ---- Comment sentiment (batched, one call per Reel) ----

function buildSentimentMessages(comments) {
  const numbered = comments.map((c, i) => `${i + 1}. ${c.text}`).join('\n');
  return [
    {
      role: 'system',
      content:
        'You are a sentiment classifier for social media comments. ' +
        'Classify each comment as positive, neutral, or negative. ' +
        'Return ONLY JSON, no markdown, no prose.',
    },
    {
      role: 'user',
      content:
        `Classify these ${comments.length} comments:\n${numbered}\n\n` +
        'Return JSON in this exact shape:\n' +
        '{ "labels": ["positive"|"neutral"|"negative", ...], ' +
        '"positive": <int>, "neutral": <int>, "negative": <int> }\n' +
        'The labels array must have one entry per comment, in order.',
    },
  ];
}

function parseSentiment(raw, comments) {
  try {
    const parsed = JSON.parse(stripFences(raw));
    const labels = Array.isArray(parsed.labels) ? parsed.labels : [];
    const positive = Number.isInteger(parsed.positive)
      ? parsed.positive
      : labels.filter((l) => l === 'positive').length;
    const neutral = Number.isInteger(parsed.neutral)
      ? parsed.neutral
      : labels.filter((l) => l === 'neutral').length;
    const negative = Number.isInteger(parsed.negative)
      ? parsed.negative
      : labels.filter((l) => l === 'negative').length;

    // A few sample comments with their labels for the UI
    const samples = comments.slice(0, 5).map((c, i) => ({
      text: c.text,
      username: c.username,
      label: labels[i] || 'neutral',
    }));

    return { positive, neutral, negative, samples };
  } catch (_) {
    return null;
  }
}

// ---- Optimization Agent ----

function buildOptimizerMessages(brandSummary, goal, scoredReels, currentRules) {
  return [
    {
      role: 'system',
      content: 'You are a data-driven content strategist for short-form Instagram Reels.',
    },
    {
      role: 'user',
      content:
        `Brand: ${brandSummary || 'N/A'}\n` +
        `Goal: ${goal || 'grow engagement'}\n\n` +
        'Per-Reel performance for the last cycle (already scored — do not recompute):\n' +
        `${JSON.stringify(scoredReels, null, 2)}\n\n` +
        'Current strategy_rules:\n' +
        `${JSON.stringify(currentRules || {}, null, 2)}\n\n` +
        'Do the following:\n' +
        '1. List the top 3 insights, each with the specific numbers that support it.\n' +
        '2. List underperforming patterns and the likely reason.\n' +
        '3. Rewrite strategy_rules for the next cycle: keep what beat baseline, ' +
        'down-weight or fix what underperformed, but keep at least one experimental ' +
        'angle so testing continues.\n\n' +
        'Use only these metric names: views, reach, saved, shares, reels_skip_rate, ' +
        'total_interactions, engagement_rate, vs_baseline, save_share_ratio, retention. ' +
        'NEVER reference plays or impressions.\n\n' +
        'Return ONLY JSON in this exact shape, no prose, no markdown:\n' +
        '{ "insights": [ { "observation": "", "evidence": "", "confidence": "high|medium|low" } ], ' +
        '"underperforming": [ { "pattern": "", "evidence": "", "action": "" } ], ' +
        '"updated_strategy": { "strategy_rules": {} } }',
    },
  ];
}

function parseOptimizer(raw) {
  try {
    const parsed = JSON.parse(stripFences(raw));
    if (
      !Array.isArray(parsed.insights) ||
      !Array.isArray(parsed.underperforming) ||
      !parsed.updated_strategy ||
      typeof parsed.updated_strategy.strategy_rules !== 'object'
    ) {
      return null;
    }
    return parsed;
  } catch (_) {
    return null;
  }
}

module.exports = {
  buildSentimentMessages,
  parseSentiment,
  buildOptimizerMessages,
  parseOptimizer,
};
