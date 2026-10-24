-- Additional derived metrics per spec Module 7 (save_share_ratio, retention)
ALTER TABLE reel_analytics ADD COLUMN IF NOT EXISTS save_share_ratio NUMERIC;
ALTER TABLE reel_analytics ADD COLUMN IF NOT EXISTS retention NUMERIC;
