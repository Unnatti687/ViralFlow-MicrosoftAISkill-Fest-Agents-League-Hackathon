CREATE TABLE IF NOT EXISTS generated_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  brand_card_id UUID REFERENCES brand_cards(id),
  slot_data JSONB NOT NULL,
  script JSONB NOT NULL,
  mpt_task_id TEXT,
  video_url TEXT,
  caption TEXT,
  hashtags TEXT[],
  status TEXT NOT NULL DEFAULT 'script_ready',
  instagram_post_id TEXT,
  parent_video_id UUID REFERENCES generated_videos(id),
  version INT NOT NULL DEFAULT 1,
  review_note TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
