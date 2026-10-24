CREATE TABLE IF NOT EXISTS reel_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  video_id UUID NOT NULL REFERENCES generated_videos(id),
  scheduled_post_id UUID REFERENCES scheduled_posts(id),
  instagram_media_id TEXT NOT NULL,
  views INT,
  reach INT,
  likes INT,
  comments INT,
  shares INT,
  saved INT,
  reposts INT,
  total_interactions INT,
  reels_skip_rate NUMERIC,
  ig_reels_avg_watch_time NUMERIC,
  engagement_rate NUMERIC,        -- derived
  vs_baseline NUMERIC,            -- derived
  comment_sentiment JSONB,        -- { positive, neutral, negative, samples: [] }
  is_mock BOOLEAN NOT NULL DEFAULT false,
  collected_at TIMESTAMPTZ DEFAULT NOW()
);

-- One analytics row per Reel — re-collection updates in place
CREATE UNIQUE INDEX IF NOT EXISTS reel_analytics_one_per_video
  ON reel_analytics (video_id);
