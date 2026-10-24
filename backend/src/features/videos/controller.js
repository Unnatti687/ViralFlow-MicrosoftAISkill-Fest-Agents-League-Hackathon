const { sql } = require('../../db/client');
const { createVideoRow, runGeneration, getBrandCard } = require('./generator');
const { getVideo, listVideosForReview, approveVideo, rejectVideo, updateCaption } = require('./reviewer');
const { publishVideoDemo, publishAllDemo } = require('../publisher/service');

async function handleGenerate(req, res, next) {
  try {
    const { brandCardId, slot } = req.body;
    if (!brandCardId || !slot) {
      return res.status(400).json({ error: 'brandCardId and slot are required' });
    }

    const card = await getBrandCard(brandCardId, req.userId);
    if (!card) return res.status(404).json({ error: 'Brand card not found' });

    const video = await createVideoRow(req.userId, brandCardId, slot);

    // Run async — client polls /status
    runGeneration(video.id, req.userId).catch((err) => {
      console.error(`Generation failed for video ${video.id}:`, err.message);
    });

    res.status(202).json(video);
  } catch (err) {
    next(err);
  }
}

async function handleGetStatus(req, res, next) {
  try {
    const video = await getVideo(req.params.id, req.userId);
    if (!video) return res.status(404).json({ error: 'Video not found' });
    res.json(video);
  } catch (err) {
    next(err);
  }
}

async function handleListVideos(req, res, next) {
  try {
    const videos = await listVideosForReview(req.userId);
    res.json(videos);
  } catch (err) {
    next(err);
  }
}

async function handleApprove(req, res, next) {
  try {
    const scheduled = await approveVideo(req.params.id, req.userId);
    res.json({ success: true, scheduled_post: scheduled });
  } catch (err) {
    next(err);
  }
}

async function handleReject(req, res, next) {
  try {
    await rejectVideo(req.params.id, req.userId);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

async function handleRegenerate(req, res, next) {
  try {
    const { note } = req.body;
    const existing = await getVideo(req.params.id, req.userId);
    if (!existing) return res.status(404).json({ error: 'Video not found' });

    // Mark old row as rejected
    await sql`
      UPDATE generated_videos SET status = 'rejected', updated_at = NOW()
      WHERE id = ${existing.id}
    `;

    // New row with lineage
    const rows = await sql`
      INSERT INTO generated_videos
        (user_id, brand_card_id, slot_data, script, status, parent_video_id, version, review_note)
      VALUES (
        ${req.userId},
        ${existing.brand_card_id},
        ${JSON.stringify(existing.slot_data)},
        ${JSON.stringify({})},
        'script_ready',
        ${existing.parent_video_id || existing.id},
        ${existing.version + 1},
        ${note || null}
      )
      RETURNING *
    `;
    const newVideo = rows[0];

    runGeneration(newVideo.id, req.userId).catch((err) => {
      console.error(`Regeneration failed for video ${newVideo.id}:`, err.message);
    });

    res.status(202).json(newVideo);
  } catch (err) {
    next(err);
  }
}

async function handleUpdateCaption(req, res, next) {
  try {
    const { caption, hashtags } = req.body;
    if (caption === undefined) return res.status(400).json({ error: 'caption is required' });
    const video = await updateCaption(req.params.id, req.userId, caption, hashtags || []);
    res.json(video);
  } catch (err) {
    next(err);
  }
}

async function handlePublishDemo(req, res, next) {
  try {
    const result = await publishVideoDemo(req.params.id, req.userId);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

async function handlePublishAllDemo(req, res, next) {
  try {
    const { brandCardId } = req.body;
    if (!brandCardId) return res.status(400).json({ error: 'brandCardId is required' });
    const result = await publishAllDemo(req.userId, brandCardId);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  handleGenerate,
  handleGetStatus,
  handleListVideos,
  handleApprove,
  handleReject,
  handleRegenerate,
  handleUpdateCaption,
  handlePublishDemo,
  handlePublishAllDemo,
};
