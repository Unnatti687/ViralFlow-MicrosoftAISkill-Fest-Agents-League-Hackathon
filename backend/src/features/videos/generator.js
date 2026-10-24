const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { sql } = require('../../db/client');
const { chat } = require('../../lib/openrouter');
const { submitVideo, pollUntilDone } = require('../../lib/mpt');
const { buildScriptMessages, tryParseScript } = require('./prompts');
const { validateVideo } = require('../../lib/ffprobe');

const VIDEOS_DIR = path.join(__dirname, '../../../public/videos');

function ensureVideosDirExists() {
  if (!fs.existsSync(VIDEOS_DIR)) {
    fs.mkdirSync(VIDEOS_DIR, { recursive: true });
  }
}

async function generateScript(brandCard, slot, regenerateNote) {
  const messages = buildScriptMessages(brandCard, slot, regenerateNote);
  let raw = await chat(messages, { temperature: 0.8, max_tokens: 16000 });
  console.log('[Script Gen] Raw AI response (attempt 1):\n', raw);
  let script = tryParseScript(raw);

  if (!script) {
    console.warn('[Script Gen] First parse failed, retrying with strict prompt...');
    const retryMessages = [
      ...messages,
      { role: 'assistant', content: raw },
      {
        role: 'user',
        content: 'Your response contained invalid JSON. Return ONLY a valid JSON object, no markdown, no code fences, no prose.',
      },
    ];
    raw = await chat(retryMessages, { temperature: 0.3, max_tokens: 16000 });
    console.log('[Script Gen] Raw AI response (attempt 2):\n', raw);
    script = tryParseScript(raw);
    if (!script) {
      const err = new Error('AI returned malformed script JSON after retry');
      err.status = 502;
      throw err;
    }
  }

  return script;
}

async function downloadVideoFile(mptVideoUrl, videoId) {
  ensureVideosDirExists();
  const destPath = path.join(VIDEOS_DIR, `${videoId}.mp4`);
  const response = await axios.get(mptVideoUrl, { responseType: 'stream', timeout: 120000 });
  await new Promise((resolve, reject) => {
    const writer = fs.createWriteStream(destPath);
    response.data.pipe(writer);
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
  return destPath;
}

async function getBrandCard(brandCardId, userId) {
  const rows = await sql`
    SELECT * FROM brand_cards WHERE id = ${brandCardId} AND user_id = ${userId}
  `;
  return rows[0] || null;
}

async function runGeneration(videoId, userId) {
  const rows = await sql`SELECT * FROM generated_videos WHERE id = ${videoId} AND user_id = ${userId}`;
  const video = rows[0];
  if (!video) throw new Error('Video row not found');

  const brandCard = await getBrandCard(video.brand_card_id, userId);
  if (!brandCard) throw new Error('Brand card not found');

  const slot = video.slot_data;

  // Generate script
  let script;
  try {
    script = await generateScript(brandCard, slot, video.review_note);
  } catch (err) {
    await sql`UPDATE generated_videos SET status = 'failed', updated_at = NOW() WHERE id = ${videoId}`;
    throw err;
  }

  await sql`
    UPDATE generated_videos
    SET script = ${JSON.stringify(script)},
        caption = ${script.caption},
        hashtags = ${script.hashtags},
        status = 'rendering',
        updated_at = NOW()
    WHERE id = ${videoId}
  `;

  // Submit to MPT
  // Edge-tts voices (xx-XX-VoiceName format) fail in Docker due to network timeouts.
  // Route them to SiliconFlow TTS instead.
  const OPENROUTER_DEFAULT = 'openrouter:af_heart-Female';
  const rawVoice = brandCard.preferred_voice || '';
  const isEdgeTtsVoice = /^[a-z]{2}-[A-Z]{2}-/.test(rawVoice);
  const voiceName = (!rawVoice || isEdgeTtsVoice) ? OPENROUTER_DEFAULT : rawVoice;
  const mptParams = {
    video_subject: slot.topic,
    video_script: script.narration_script,
    video_terms: script.footage_keywords,
    video_aspect: '9:16',
    voice_name: voiceName,
    video_source: 'pexels',
    video_count: 1,
  };

  console.log('[MPT Submit] Params:', JSON.stringify(mptParams, null, 2));

  let mptTaskId;
  try {
    mptTaskId = await submitVideo(mptParams);
    console.log('[MPT Submit] Got task_id:', mptTaskId);
  } catch (err) {
    await sql`UPDATE generated_videos SET status = 'failed', updated_at = NOW() WHERE id = ${videoId}`;
    throw err;
  }

  await sql`UPDATE generated_videos SET mpt_task_id = ${mptTaskId}, updated_at = NOW() WHERE id = ${videoId}`;

  // Poll until MPT done
  let mptVideoUrl;
  try {
    mptVideoUrl = await pollUntilDone(mptTaskId);
  } catch (err) {
    await sql`UPDATE generated_videos SET status = 'failed', updated_at = NOW() WHERE id = ${videoId}`;
    throw err;
  }

  // Download to local static folder
  let localPath;
  try {
    localPath = await downloadVideoFile(mptVideoUrl, videoId);
  } catch (err) {
    // Download failure → render_complete, not under_review
    await sql`UPDATE generated_videos SET status = 'render_complete', updated_at = NOW() WHERE id = ${videoId}`;
    throw err;
  }

  // Validate codec (H.264 + AAC) and duration (5–90s)
  try {
    await validateVideo(localPath);
  } catch (err) {
    await sql`UPDATE generated_videos SET status = 'failed', updated_at = NOW() WHERE id = ${videoId}`;
    throw err;
  }

  const backendBase = process.env.BACKEND_BASE_URL || 'http://localhost:3001';
  const publicUrl = `${backendBase}/videos/${videoId}.mp4`;

  await sql`
    UPDATE generated_videos
    SET video_url = ${publicUrl}, status = 'under_review', updated_at = NOW()
    WHERE id = ${videoId}
  `;
}

async function createVideoRow(userId, brandCardId, slot) {
  const rows = await sql`
    INSERT INTO generated_videos (user_id, brand_card_id, slot_data, script, status)
    VALUES (${userId}, ${brandCardId}, ${JSON.stringify(slot)}, ${JSON.stringify({})}, 'script_ready')
    RETURNING *
  `;
  return rows[0];
}

module.exports = { runGeneration, createVideoRow, getBrandCard };
