const { sql } = require('../../db/client');

async function getVideo(videoId, userId) {
  const rows = await sql`
    SELECT * FROM generated_videos WHERE id = ${videoId} AND user_id = ${userId}
  `;
  return rows[0] || null;
}

async function listVideosForReview(userId) {
  const rows = await sql`
    SELECT * FROM generated_videos
    WHERE user_id = ${userId}
      AND status IN ('render_complete', 'under_review', 'approved', 'rejected')
    ORDER BY created_at DESC
  `;
  return rows;
}

async function approveVideo(videoId, userId) {
  const video = await getVideo(videoId, userId);
  if (!video) {
    const err = new Error('Video not found');
    err.status = 404;
    throw err;
  }
  if (!['render_complete', 'under_review'].includes(video.status)) {
    const err = new Error(`Cannot approve video with status: ${video.status}`);
    err.status = 400;
    throw err;
  }

  await sql`
    UPDATE generated_videos
    SET status = 'approved', reviewed_at = NOW(), updated_at = NOW()
    WHERE id = ${videoId}
  `;

  // Default scheduled_time: tomorrow at 9am if slot didn't provide a full timestamp
  const scheduledTime = video.slot_data?.scheduled_time
    ? new Date(video.slot_data.scheduled_time)
    : new Date(Date.now() + 24 * 60 * 60 * 1000);

  const rows = await sql`
    INSERT INTO scheduled_posts (user_id, video_id, public_video_url, caption, scheduled_time, status)
    VALUES (
      ${userId},
      ${videoId},
      ${video.video_url || ''},
      ${video.caption || ''},
      ${scheduledTime.toISOString()},
      'scheduled'
    )
    RETURNING *
  `;

  return rows[0];
}

async function rejectVideo(videoId, userId) {
  const video = await getVideo(videoId, userId);
  if (!video) {
    const err = new Error('Video not found');
    err.status = 404;
    throw err;
  }

  await sql`
    UPDATE generated_videos
    SET status = 'rejected', reviewed_at = NOW(), updated_at = NOW()
    WHERE id = ${videoId}
  `;
}

async function updateCaption(videoId, userId, caption, hashtags) {
  const video = await getVideo(videoId, userId);
  if (!video) {
    const err = new Error('Video not found');
    err.status = 404;
    throw err;
  }

  const rows = await sql`
    UPDATE generated_videos
    SET caption = ${caption},
        hashtags = ${hashtags},
        updated_at = NOW()
    WHERE id = ${videoId}
    RETURNING *
  `;
  return rows[0];
}

module.exports = { getVideo, listVideosForReview, approveVideo, rejectVideo, updateCaption };
