CREATE TABLE IF NOT EXISTS scheduled_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  video_id UUID NOT NULL REFERENCES generated_videos(id),
  public_video_url TEXT NOT NULL,
  caption TEXT NOT NULL,
  scheduled_time TIMESTAMPTZ NOT NULL,
  ig_container_id TEXT,
  instagram_media_id TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled',
  error_message TEXT,
  published_at TIMESTAMPTZ,
  retry_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
