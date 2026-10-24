const axios = require('axios');

const BASE_URL = 'https://openrouter.ai/api/v1';
const DEFAULT_MODEL = 'deepseek/deepseek-v4-pro';

async function chat(messages, options = {}) {
  const { model = DEFAULT_MODEL, temperature = 0.7, max_tokens = 2000 } = options;

  const post = (tokens) =>
    axios.post(
      `${BASE_URL}/chat/completions`,
      { model, messages, temperature, max_tokens: tokens, reasoning: { enabled: false, exclude: true } },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://viralflow.app',
          'X-Title': 'ViralFlow',
        },
        timeout: 120000,
      }
    );

  let response = await post(max_tokens);
  let content = response.data.choices[0].message.content;

  // Some reasoning models consume the entire max_tokens budget on hidden
  // reasoning even with reasoning.exclude=true, leaving no room for the
  // visible answer (finish_reason 'length' + empty content). Retry once
  // with a much larger budget before giving up.
  if (!content && response.data.choices[0].finish_reason === 'length') {
    response = await post(max_tokens * 3);
    content = response.data.choices[0].message.content;
  }

  if (!content) {
    throw new Error('OpenRouter returned empty content (likely reasoning consumed max_tokens)');
  }
  return content;
}

module.exports = { chat };
