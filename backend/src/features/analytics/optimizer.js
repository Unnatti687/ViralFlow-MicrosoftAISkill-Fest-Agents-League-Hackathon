const { sql } = require('../../db/client');
const { chat } = require('../../lib/openrouter');
const { buildOptimizerMessages, parseOptimizer } = require('./prompts');

const MIN_REELS_FOR_PATTERNS = 5;

// Builds the scored per-Reel array fed to the Optimization Agent.
// Metrics are already computed in the collector (deterministic, done before the LLM call).
async function buildScoredReels(userId, brandCardId) {
  const rows = await sql`
    SELECT ra.*, gv.slot_data
    FROM reel_analytics ra
    JOIN generated_videos gv ON gv.id = ra.video_id
    WHERE ra.user_id = ${userId} AND gv.brand_card_id = ${brandCardId}
    ORDER BY ra.collected_at ASC
  `;

  return rows.map((r) => {
    const slot = r.slot_data || {};
    return {
      video_id: r.video_id,
      topic: slot.topic,
      content_angle: slot.content_angle,
      suggested_time: slot.suggested_time,
      target_duration_seconds: slot.target_duration_seconds,
      views: r.views,
      reach: r.reach,
      total_interactions: r.total_interactions,
      saved: r.saved,
      shares: r.shares,
      reels_skip_rate: r.reels_skip_rate != null ? Number(r.reels_skip_rate) : null,
      engagement_rate: r.engagement_rate != null ? Number(r.engagement_rate) : null,
      vs_baseline: r.vs_baseline != null ? Number(r.vs_baseline) : null,
      save_share_ratio: r.save_share_ratio != null ? Number(r.save_share_ratio) : null,
      retention: r.retention != null ? Number(r.retention) : null,
      comment_sentiment: r.comment_sentiment,
    };
  });
}

async function getActiveStrategyRules(brandCardId) {
  const rows = await sql`
    SELECT strategy_rules FROM strategy_versions
    WHERE brand_card_id = ${brandCardId} AND is_active = true
    LIMIT 1
  `;
  return rows[0]?.strategy_rules || null;
}

async function getNextCycleNumber(brandCardId) {
  const rows = await sql`
    SELECT COALESCE(MAX(cycle_number), 0) AS max_cycle
    FROM strategy_versions WHERE brand_card_id = ${brandCardId}
  `;
  return (rows[0]?.max_cycle || 0) + 1;
}

async function callOptimizer(messages) {
  let raw = await chat(messages, { temperature: 0.5, max_tokens: 3000 });
  let parsed = parseOptimizer(raw);

  if (!parsed) {
    const retry = [
      ...messages,
      { role: 'assistant', content: raw },
      {
        role: 'user',
        content:
          'Your response was not valid JSON in the required shape. Return ONLY the JSON object, ' +
          'no markdown, no code fences, no prose.',
      },
    ];
    raw = await chat(retry, { temperature: 0.2, max_tokens: 3000 });
    parsed = parseOptimizer(raw);
    if (!parsed) {
      const err = new Error('Optimization Agent returned malformed JSON after retry');
      err.status = 502;
      throw err;
    }
  }
  return parsed;
}

// Runs the Optimization Agent for a brand: scores Reels, finds patterns, produces a new
// (inactive) strategy version. The new version becomes active only on accept/override.
async function optimizeBrand(userId, brandCardId) {
  const scored = await buildScoredReels(userId, brandCardId);

  if (scored.length < MIN_REELS_FOR_PATTERNS) {
    return {
      status: 'not_enough_data',
      message: `Need at least ${MIN_REELS_FOR_PATTERNS} analyzed Reels for confident patterns; have ${scored.length}. Keeping current strategy.`,
      reel_count: scored.length,
    };
  }

  const cardRows = await sql`
    SELECT brand_voice_summary, goal FROM brand_cards
    WHERE id = ${brandCardId} AND user_id = ${userId}
  `;
  const card = cardRows[0];
  if (!card) {
    const err = new Error('Brand card not found');
    err.status = 404;
    throw err;
  }

  const currentRules = await getActiveStrategyRules(brandCardId);
  const messages = buildOptimizerMessages(card.brand_voice_summary, card.goal, scored, currentRules);
  const result = await callOptimizer(messages);

  const cycleNumber = await getNextCycleNumber(brandCardId);
  const newRules = result.updated_strategy.strategy_rules;
  const insightsBlob = { insights: result.insights, underperforming: result.underperforming };

  // Persist the cycle's scored report and the new (inactive) strategy version
  const reportRows = await sql`
    INSERT INTO performance_reports (user_id, brand_card_id, cycle_number, reel_scores)
    VALUES (${userId}, ${brandCardId}, ${cycleNumber}, ${JSON.stringify(scored)})
    RETURNING *
  `;
  const versionRows = await sql`
    INSERT INTO strategy_versions
      (user_id, brand_card_id, cycle_number, strategy_rules, insights, source, is_active)
    VALUES
      (${userId}, ${brandCardId}, ${cycleNumber}, ${JSON.stringify(newRules)},
       ${JSON.stringify(insightsBlob)}, 'agent', false)
    RETURNING *
  `;

  return {
    status: 'ok',
    cycle_number: cycleNumber,
    insights: result.insights,
    underperforming: result.underperforming,
    current_strategy_rules: currentRules,
    updated_strategy_rules: newRules,
    strategy_version: versionRows[0],
    performance_report: reportRows[0],
  };
}

// Reload the most recent optimization run for a brand (so the UI survives a refresh).
// Reconstructs the same shape returned by optimizeBrand's 'ok' status.
async function getLatestOptimization(userId, brandCardId) {
  const latestRows = await sql`
    SELECT * FROM strategy_versions
    WHERE brand_card_id = ${brandCardId} AND user_id = ${userId}
    ORDER BY cycle_number DESC, created_at DESC
    LIMIT 1
  `;
  const latest = latestRows[0];
  if (!latest) return null;

  const reportRows = await sql`
    SELECT * FROM performance_reports
    WHERE brand_card_id = ${brandCardId} AND user_id = ${userId} AND cycle_number = ${latest.cycle_number}
    ORDER BY created_at DESC
    LIMIT 1
  `;

  // If the latest cycle's version is itself the active one, there's nothing pending —
  // current_strategy_rules is null (handled by the UI as "already accepted").
  let currentRules = null;
  if (!latest.is_active) {
    currentRules = await getActiveStrategyRules(brandCardId);
  }

  const insightsBlob = latest.insights || { insights: [], underperforming: [] };

  return {
    status: 'ok',
    cycle_number: latest.cycle_number,
    insights: insightsBlob.insights || [],
    underperforming: insightsBlob.underperforming || [],
    current_strategy_rules: currentRules,
    updated_strategy_rules: latest.strategy_rules,
    strategy_version: latest,
    performance_report: reportRows[0] || null,
    already_accepted: latest.is_active,
  };
}

// Accept the agent's proposed version: it becomes the single active version for the brand.
async function activateVersion(userId, versionId) {
  const rows = await sql`
    SELECT brand_card_id FROM strategy_versions
    WHERE id = ${versionId} AND user_id = ${userId}
  `;
  if (!rows[0]) {
    const err = new Error('Strategy version not found');
    err.status = 404;
    throw err;
  }
  const brandCardId = rows[0].brand_card_id;

  // Deactivate all then activate this one — single transaction (partial unique index)
  await sql.transaction([
    sql`UPDATE strategy_versions SET is_active = false WHERE brand_card_id = ${brandCardId} AND is_active = true`,
    sql`UPDATE strategy_versions SET is_active = true WHERE id = ${versionId}`,
  ]);

  const out = await sql`SELECT * FROM strategy_versions WHERE id = ${versionId}`;
  return out[0];
}

// Override: save the user's edited rules as a new active version (source = user_override).
async function overrideVersion(userId, versionId, editedRules) {
  const rows = await sql`
    SELECT brand_card_id, cycle_number, insights FROM strategy_versions
    WHERE id = ${versionId} AND user_id = ${userId}
  `;
  if (!rows[0]) {
    const err = new Error('Strategy version not found');
    err.status = 404;
    throw err;
  }
  const { brand_card_id, cycle_number, insights } = rows[0];

  const results = await sql.transaction([
    sql`UPDATE strategy_versions SET is_active = false WHERE brand_card_id = ${brand_card_id} AND is_active = true`,
    sql`
      INSERT INTO strategy_versions
        (user_id, brand_card_id, cycle_number, strategy_rules, insights, source, is_active)
      VALUES
        (${userId}, ${brand_card_id}, ${cycle_number}, ${JSON.stringify(editedRules)},
         ${insights ? JSON.stringify(insights) : null}, 'user_override', true)
      RETURNING *
    `,
  ]);

  // results[1] is the INSERT ... RETURNING result set
  const inserted = Array.isArray(results[1]) ? results[1][0] : results[1];
  return inserted;
}

module.exports = { optimizeBrand, getLatestOptimization, activateVersion, overrideVersion };
