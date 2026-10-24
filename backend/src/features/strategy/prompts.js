const SLOT_SCHEMA_INSTRUCTION = `Return ONLY a valid JSON array. No markdown, no code fences, no prose. Start with [ end with ].

Each slot must have exactly these fields:
{
  "day": "Monday",
  "date": "YYYY-MM-DD",
  "platform": "Instagram",
  "post_type": "reel",
  "topic": "<specific, opinionated topic — NOT vague>",
  "content_angle": "educational|story|opinion|social_proof|listicle",
  "suggested_time": "HH:MM AM",
  "target_duration_seconds": <integer 15–60>,
  "rationale": "<one sentence why this post for this day>"
}

Topic rules:
- BAD: "Content marketing tips"
- GOOD: "Why most SaaS companies waste their first 50 blog posts and what to do instead"
Topics must be specific and opinionated.

Distribution rules:
- Do NOT repeat the same content_angle two days in a row
- Vary suggested_time based on audience and platform best practices
- target_duration_seconds must be an integer between 15 and 60`;

const STRATEGIST_ROLE = 'You are a senior content strategist generating Instagram Reels calendars.';

function buildModeAMessages(card, weekDates) {
  const weekSchedule = weekDates.map(w => `${w.day} ${w.date}`).join(', ');
  return [
    { role: 'system', content: `${STRATEGIST_ROLE}\n\n${SLOT_SCHEMA_INSTRUCTION}` },
    {
      role: 'user',
      content: `Brand: ${card.brand_voice_summary || buildFallbackSummary(card)}
Platform: Instagram
Goal: ${card.goal}
Audience: ${card.audience.description}
Tone: ${card.tone}

Generate exactly 7 slots for this week: ${weekSchedule}
One slot per day, Monday through Sunday.`,
    },
  ];
}

function buildModeBMessages(card, weekDates, strategy_rules, insights) {
  const weekSchedule = weekDates.map(w => `${w.day} ${w.date}`).join(', ');
  return [
    { role: 'system', content: `${STRATEGIST_ROLE}\n\n${SLOT_SCHEMA_INSTRUCTION}` },
    {
      role: 'user',
      content: `Brand: ${card.brand_voice_summary || buildFallbackSummary(card)}
Platform: Instagram
Goal: ${card.goal}
Audience: ${card.audience.description}

Last week's performance insights:
${JSON.stringify(insights, null, 2)}

Current strategy rules:
${JSON.stringify(strategy_rules, null, 2)}

Generate a new 7-day calendar for: ${weekSchedule}
Rules:
- Increase weight on top_performing_angles and top_performing_durations
- Avoid patterns in the avoid list
- Apply best_posting_times where applicable
- Keep at least 1 experimental angle to continue testing
One slot per day, Monday through Sunday.`,
    },
  ];
}

function buildSlotRegenerateMessages(card, slot) {
  return [
    { role: 'system', content: `${STRATEGIST_ROLE}\n\n${SLOT_SCHEMA_INSTRUCTION}` },
    {
      role: 'user',
      content: `Brand: ${card.brand_voice_summary || buildFallbackSummary(card)}
Platform: Instagram
Goal: ${card.goal}
Audience: ${card.audience.description}
Tone: ${card.tone}

Regenerate ONLY the slot for ${slot.day} (${slot.date}).
Previous slot was: "${slot.topic}" (${slot.content_angle}) — generate something different.

Return a JSON array with exactly 1 slot for ${slot.day} ${slot.date}.`,
    },
  ];
}

function getWeekDates() {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon
  const daysToMonday = dayOfWeek === 1 ? 0 : dayOfWeek === 0 ? 1 : (8 - dayOfWeek);
  const monday = new Date(now);
  monday.setDate(now.getDate() + daysToMonday);

  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  return dayNames.map((name, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return { day: name, date: d.toISOString().split('T')[0] };
  });
}

function buildFallbackSummary(card) {
  return `${card.brand.name} is a ${card.brand.niche} brand targeting ${card.audience.description}. Tone: ${card.tone}. Goal: ${card.goal}.`;
}

module.exports = { buildModeAMessages, buildModeBMessages, buildSlotRegenerateMessages, getWeekDates };
