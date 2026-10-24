CREATE TABLE IF NOT EXISTS performance_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  brand_card_id UUID NOT NULL REFERENCES brand_cards(id),
  cycle_number INT NOT NULL,
  reel_scores JSONB NOT NULL,        -- array of scored per-Reel objects
  created_at TIMESTAMPTZ DEFAULT NOW()
);
