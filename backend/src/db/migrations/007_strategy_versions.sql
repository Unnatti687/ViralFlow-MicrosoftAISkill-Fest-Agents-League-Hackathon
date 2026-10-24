CREATE TABLE IF NOT EXISTS strategy_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  brand_card_id UUID NOT NULL REFERENCES brand_cards(id),
  cycle_number INT NOT NULL,
  strategy_rules JSONB NOT NULL,
  insights JSONB,
  source TEXT NOT NULL DEFAULT 'agent',  -- agent | user_override
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Only one active strategy version per brand at a time
CREATE UNIQUE INDEX IF NOT EXISTS strategy_versions_one_active_per_brand
  ON strategy_versions (brand_card_id)
  WHERE is_active = true;
