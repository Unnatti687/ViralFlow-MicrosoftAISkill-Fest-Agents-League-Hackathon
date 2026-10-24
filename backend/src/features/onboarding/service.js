const { sql } = require('../../db/client');
const { chat } = require('../../lib/openrouter');
const {
  buildChatMessages,
  buildVoiceSummaryPrompt,
  buildFallbackSummary,
} = require('./prompts');

async function processChat(conversationHistory, extractionState) {
  const messages = buildChatMessages(conversationHistory, extractionState);

  let reply;
  try {
    reply = await chat(messages, { temperature: 0.8, max_tokens: 2000 });
  } catch (_) {
    reply = await chat(messages, { temperature: 0.8, max_tokens: 2000 });
  }

  let parsed = parseReply(reply, extractionState);

  // Model said it has everything but didn't produce a usable brand_card —
  // retry once with a fresh generation before giving up.
  if (!parsed.parsedCard && cardIntentDetected(reply)) {
    try {
      const retryReply = await chat(messages, { temperature: 0.8, max_tokens: 2000 });
      const retryParsed = parseReply(retryReply, extractionState);
      if (retryParsed.parsedCard) {
        reply = retryReply;
        parsed = retryParsed;
      }
    } catch (_) {
      // Keep original reply/parse result
    }
  }

  const { updatedState, parsedCard, cleanReply } = parsed;
  return { reply: cleanReply, extractionState: updatedState, card: parsedCard };
}

function cardIntentDetected(reply) {
  return /<brand_card>/.test(reply) || /"brand"\s*:\s*\{/.test(reply);
}

function parseReply(reply, extractionState) {
  const brandCardMatch = reply.match(/<brand_card>([\s\S]*?)<\/brand_card>/);
  const collectedMatch = reply.match(/<collected>([\s\S]*?)<\/collected>/);
  let updatedState = { ...extractionState };
  let parsedCard = null;

  const untaggedCollectedMatch = reply.match(/\{\s*"collected"\s*:\s*\{[\s\S]*?\}\s*\}/);

  if (collectedMatch || untaggedCollectedMatch) {
    try {
      const raw = collectedMatch
        ? collectedMatch[1].trim()
        : untaggedCollectedMatch[0];
      const parsedJson = JSON.parse(raw);
      const partial = parsedJson.collected || parsedJson;
      const merged = { ...extractionState.collected };
      for (const [k, v] of Object.entries(partial)) {
        if (v !== null && v !== undefined && v !== '') merged[k] = v;
      }
      updatedState = { ...updatedState, collected: merged };
    } catch (_) {
      // Malformed <collected> — keep existing state
    }
  }

  if (brandCardMatch) {
    try {
      parsedCard = JSON.parse(brandCardMatch[1].trim());
    } catch (_) {
      // Malformed JSON inside tags — fall through to untagged extraction below
    }
  }

  // Model sometimes omits the <brand_card> tags and just emits the JSON inline
  if (!parsedCard) {
    const untaggedMatch = reply.match(/\{\s*"brand"\s*:\s*\{[\s\S]*\}\s*\}/);
    if (untaggedMatch) {
      try {
        parsedCard = JSON.parse(untaggedMatch[0]);
      } catch (_) {
        // Still malformed — give up, conversation continues
      }
    }
  }

  if (parsedCard) {
    updatedState = {
      collected: {
        brand_name: parsedCard.brand?.name,
        niche: parsedCard.brand?.niche,
        description: parsedCard.brand?.description,
        audience: parsedCard.audience?.description,
        tone: parsedCard.tone,
        goal: parsedCard.goal,
        preferred_voice: parsedCard.preferred_voice,
      },
      status: 'confirming',
      card: parsedCard,
    };
  }

  let cleanReply = reply
    .replace(/<brand_card>[\s\S]*?<\/brand_card>/g, '')
    .replace(/<collected>[\s\S]*?<\/collected>/g, '')
    .replace(/<\/?brand_card>/g, '')
    .replace(/<\/?collected>/g, '')
    .replace(/\{\s*"brand"\s*:\s*\{[\s\S]*\}\s*\}/g, '')
    .replace(/\{\s*"collected"\s*:\s*\{[\s\S]*?\}\s*\}/g, '')
    .trim();

  return { updatedState, parsedCard, cleanReply };
}

async function saveBrandCard(userId, cardData) {
  const rows = await sql`
    INSERT INTO brand_cards (user_id, brand, audience, tone, platforms, goal, preferred_voice, content_guidelines)
    VALUES (
      ${userId},
      ${JSON.stringify(cardData.brand)},
      ${JSON.stringify(cardData.audience)},
      ${cardData.tone},
      ${cardData.platforms || ['Instagram']},
      ${cardData.goal},
      ${cardData.preferred_voice || 'en-US-GuyNeural'},
      ${JSON.stringify(cardData.content_guidelines || { avoid_topics: [], custom_instructions: '' })}
    )
    RETURNING *
  `;
  return rows[0];
}

async function getBrandCard(id, userId) {
  const rows = await sql`
    SELECT * FROM brand_cards WHERE id = ${id} AND user_id = ${userId}
  `;
  return rows[0] || null;
}

async function getLatestBrandCard(userId) {
  const rows = await sql`
    SELECT * FROM brand_cards WHERE user_id = ${userId} ORDER BY created_at DESC LIMIT 1
  `;
  return rows[0] || null;
}

async function generateVoiceSummary(brandCardId, userId) {
  const card = await getBrandCard(brandCardId, userId);
  if (!card) {
    const err = new Error('Brand card not found');
    err.status = 404;
    throw err;
  }

  const prompt = buildVoiceSummaryPrompt(card);
  let summary;

  try {
    summary = await chat([{ role: 'user', content: prompt }], { temperature: 0.7, max_tokens: 200 });
  } catch (_) {
    try {
      summary = await chat([{ role: 'user', content: prompt }], { temperature: 0.7, max_tokens: 200 });
    } catch (_2) {
      summary = buildFallbackSummary(card);
    }
  }

  const rows = await sql`
    UPDATE brand_cards
    SET brand_voice_summary = ${summary}, updated_at = NOW()
    WHERE id = ${brandCardId} AND user_id = ${userId}
    RETURNING *
  `;
  return rows[0];
}

module.exports = { processChat, saveBrandCard, getBrandCard, getLatestBrandCard, generateVoiceSummary };
