const axios = require('axios');

const BASE_URL = () => process.env.MPT_BASE_URL || 'http://localhost:8080';
const POLL_INTERVAL_MS = 5000;
const POLL_TIMEOUT_MS = 40 * 60 * 1000;

// MPT state integers
const STATE_COMPLETE = 1;
const STATE_FAILED = -1;
// state 4 = processing

async function submitVideo(params) {
  const response = await axios.post(`${BASE_URL()}/api/v1/videos`, params, {
    timeout: 30000,
  });
  console.log('[MPT] Submit response:', JSON.stringify(response.data));
  const taskId = response.data?.data?.task_id;
  if (!taskId) throw new Error('MPT did not return a task_id');
  return taskId;
}

async function getTaskStatus(taskId) {
  const response = await axios.get(`${BASE_URL()}/api/v1/tasks/${taskId}`, {
    timeout: 10000,
  });
  return response.data?.data;
}

async function pollUntilDone(taskId) {
  const deadline = Date.now() + POLL_TIMEOUT_MS;

  while (Date.now() < deadline) {
    const data = await getTaskStatus(taskId);
    const state = data?.state;
    console.log(`[MPT Poll] task_id=${taskId} state=${state} progress=${data?.progress ?? '?'}`);

    if (state === STATE_COMPLETE) {
      const rawPath = data.videos?.[0] || data.combined_videos?.[0];
      if (!rawPath) throw new Error('MPT task complete but no video URL returned');
      console.log('[MPT] Raw video path from task:', rawPath);
      // MPT returns absolute URL (when endpoint set), /tasks/... (when endpoint empty), or relative path
      let videoUrl;
      if (rawPath.startsWith('http')) {
        videoUrl = rawPath;
      } else {
        const normalizedPath = rawPath.startsWith('/') ? rawPath : `/${rawPath}`;
        videoUrl = `${BASE_URL()}${normalizedPath}`;
      }
      return videoUrl;
    }

    if (state === STATE_FAILED) {
      console.error('[MPT] Task failed. Full task data:', JSON.stringify(data));
      throw new Error('MPT render failed');
    }

    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }

  throw new Error('MPT render timed out after 40 minutes');
}

module.exports = { submitVideo, pollUntilDone, getTaskStatus };
