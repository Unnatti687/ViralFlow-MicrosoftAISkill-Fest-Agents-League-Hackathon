function buildScriptMessages(brandCard, slot, regenerateNote) {
  const brand = brandCard.brand;
  const audience = brandCard.audience;
  const wordsPerSecond = 2.5;
  const targetWords = Math.round(slot.target_duration_seconds * wordsPerSecond);

  const systemPrompt = `You are a short-form video scriptwriter for Instagram Reels.
You write punchy, brand-aligned scripts that sound natural when spoken aloud.

Brand context:
${brandCard.brand_voice_summary || `Brand: ${brand.name}. Niche: ${brand.niche}. Tone: ${brandCard.tone}. Audience: ${audience.description}.`}

Rules:
- Script is spoken word only — no stage directions, no emojis, no [brackets]
- Target ~${targetWords} words (${slot.target_duration_seconds}s at 2.5 words/sec)
- Hook in the first 3 seconds
- One clear insight or takeaway
- End with a soft CTA (follow, save, share)`;

  const userPrompt = `Generate a complete video package for this slot:

Topic: ${slot.topic}
Content angle: ${slot.content_angle}
Platform: ${slot.platform}
Duration: ${slot.target_duration_seconds} seconds
Rationale: ${slot.rationale}
${regenerateNote ? `\nNote from reviewer: ${regenerateNote}` : ''}

Return a JSON object with exactly these fields:
{
  "narration_script": "...",
  "caption": "...",
  "cta": "...",
  "hashtags": ["...", "..."],
  "footage_keywords": ["...", "..."]
}

Rules:
- narration_script: spoken words only, ~${targetWords} words
- caption: punchy one-liner with 1-2 emojis
- cta: short follow/save line (1 sentence, no hashtags)
- hashtags: 10-15 tags, mix of niche and broad, each prefixed with #
- footage_keywords: 4-6 Pexels/Pixabay search terms that match the topic visually

Return ONLY the JSON object. No markdown, no code fences, no prose.`;

  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];
}

function tryParseScript(raw) {
  try {
    const cleaned = raw.replace(/```(?:json)?\n?/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    const required = ['narration_script', 'caption', 'cta', 'hashtags', 'footage_keywords'];
    for (const field of required) {
      if (!parsed[field]) {
        console.warn(`[Script Parse] Missing required field: "${field}"`);
        return null;
      }
    }
    return parsed;
  } catch (err) {
    console.warn('[Script Parse] JSON.parse failed:', err.message);
    return null;
  }
}

module.exports = { buildScriptMessages, tryParseScript };
