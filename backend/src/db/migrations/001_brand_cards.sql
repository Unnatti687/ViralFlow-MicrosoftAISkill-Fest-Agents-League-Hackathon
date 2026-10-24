CREATE TABLE IF NOT EXISTS brand_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  brand JSONB NOT NULL,
  audience JSONB NOT NULL,
  tone TEXT NOT NULL,
  platforms TEXT[] NOT NULL DEFAULT '{"Instagram"}',
  goal TEXT NOT NULL,
  preferred_voice TEXT DEFAULT 'en-US-GuyNeural',
  content_guidelines JSONB DEFAULT '{}',
  brand_voice_summary TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
