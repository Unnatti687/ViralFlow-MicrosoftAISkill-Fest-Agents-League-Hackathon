const { sql } = require('../../db/client');
const { chat } = require('../../lib/openrouter');
const {
  buildModeAMessages,
  buildModeBMessages,
  buildSlotRegenerateMessages,
  getWeekDates,
} = require('./prompts');

const REQUIRED_SLOT_FIELDS = [
  'day', 'date', 'platform', 'post_type', 'topic',
  'content_angle', 'suggested_time', 'target_duration_seconds', 'rationale',
];

async function generateCalendar(userId, brandCardId, strategy_rules, insights) {
  const card = await getBrandCard(brandCardId, userId);
  if (!card) {
    const err = new Error('Brand card not found');
    err.status = 404;
    throw err;
  }

  const weekDates = getWeekDates();
  const isModeB = !!(strategy_rules && insights);
  const messages = isModeB
    ? buildModeBMessages(card, weekDates, strategy_rules, insights)
    : buildModeAMessages(card, weekDates);

  const slots = await callAndParse(messages);
  const stamped = slots.map(s => ({ ...s, status: 'pending_generation' }));
  const mode = isModeB ? 'B' : 'A';

  const saved = await replaceSlots(userId, brandCardId, stamped, mode);

  return { slots: saved, mode };
}

async function getSlots(userId, brandCardId) {
  const rows = await sql`
    SELECT * FROM strategy_slots
    WHERE brand_card_id = ${brandCardId} AND user_id = ${userId}
    ORDER BY sort_order ASC
  `;
  return { slots: rows.map(toSlot), mode: rows[0]?.mode || null };
}

async function replaceSlots(userId, brandCardId, slots, mode) {
  const queries = [
    sql`DELETE FROM strategy_slots WHERE brand_card_id = ${brandCardId} AND user_id = ${userId}`,
  ];
  slots.forEach((s, i) => {
    queries.push(sql`
      INSERT INTO strategy_slots (
        user_id, brand_card_id, sort_order, day, date, platform, post_type,
        topic, content_angle, suggested_time, target_duration_seconds, rationale,
        status, mode
      ) VALUES (
        ${userId}, ${brandCardId}, ${i}, ${s.day}, ${s.date}, ${s.platform}, ${s.post_type},
        ${s.topic}, ${s.content_angle}, ${s.suggested_time}, ${s.target_duration_seconds}, ${s.rationale},
        ${s.status || 'pending_generation'}, ${mode || null}
      )
    `);
  });
  queries.push(sql`
    SELECT * FROM strategy_slots
    WHERE brand_card_id = ${brandCardId} AND user_id = ${userId}
    ORDER BY sort_order ASC
  `);

  const results = await sql.transaction(queries);
  return results[results.length - 1].map(toSlot);
}

function toSlot(row) {
  return {
    id: row.id,
    day: row.day,
    date: typeof row.date === 'string' ? row.date : row.date.toISOString().slice(0, 10),
    platform: row.platform,
    post_type: row.post_type,
    topic: row.topic,
    content_angle: row.content_angle,
    suggested_time: row.suggested_time,
    target_duration_seconds: row.target_duration_seconds,
    rationale: row.rationale,
    status: row.status,
  };
}

async function regenerateSlot(userId, brandCardId, slot) {
  const card = await getBrandCard(brandCardId, userId);
  if (!card) {
    const err = new Error('Brand card not found');
    err.status = 404;
    throw err;
  }

  const messages = buildSlotRegenerateMessages(card, slot);
  const slots = await callAndParse(messages);
  return { ...slots[0], status: 'pending_generation' };
}

async function callAndParse(messages) {
  let raw = await chat(messages, { temperature: 0.8, max_tokens: 3000 });
  let slots = tryParseSlots(raw);

  if (!slots) {
    const retryMessages = [
      ...messages,
      { role: 'assistant', content: raw },
      {
        role: 'user',
        content: 'Your response contained invalid JSON. Return ONLY a valid JSON array, no markdown, no code fences, no prose. Start with [ and end with ].',
      },
    ];
    raw = await chat(retryMessages, { temperature: 0.3, max_tokens: 3000 });
    slots = tryParseSlots(raw);
    if (!slots) {
      const err = new Error('Strategy generation failed: AI returned malformed JSON after retry');
      err.status = 502;
      throw err;
    }
  }

  validateSlots(slots);
  return slots;
}

function tryParseSlots(raw) {
  try {
    const cleaned = raw.replace(/```(?:json)?\n?/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    return parsed;
  } catch (_) {
    return null;
  }
}

function validateSlots(slots) {
  for (const slot of slots) {
    for (const field of REQUIRED_SLOT_FIELDS) {
      if (slot[field] === undefined || slot[field] === null || slot[field] === '') {
        const err = new Error(`Slot missing required field: ${field}`);
        err.status = 502;
        throw err;
      }
    }
    const dur = slot.target_duration_seconds;
    if (typeof dur !== 'number' || dur < 5 || dur > 90) {
      const err = new Error(`target_duration_seconds must be a number between 5 and 90, got: ${dur}`);
      err.status = 502;
      throw err;
    }
  }
}

async function getBrandCard(id, userId) {
  const rows = await sql`
    SELECT * FROM brand_cards WHERE id = ${id} AND user_id = ${userId}
  `;
  return rows[0] || null;
}

module.exports = { generateCalendar, regenerateSlot, getSlots, replaceSlots, getBrandCard };
