CREATE TABLE IF NOT EXISTS strategy_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  brand_card_id UUID NOT NULL REFERENCES brand_cards(id),
  sort_order INT NOT NULL DEFAULT 0,
  day TEXT NOT NULL,
  date DATE NOT NULL,
  platform TEXT NOT NULL,
  post_type TEXT NOT NULL,
  topic TEXT NOT NULL,
  content_angle TEXT NOT NULL,
  suggested_time TEXT NOT NULL,
  target_duration_seconds INT NOT NULL,
  rationale TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending_generation',
  mode TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS strategy_slots_brand_card_id_idx
  ON strategy_slots (brand_card_id);
