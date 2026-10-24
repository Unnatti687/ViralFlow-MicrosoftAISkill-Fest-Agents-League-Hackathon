CREATE TABLE IF NOT EXISTS instagram_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE,
  ig_user_id TEXT NOT NULL,
  account_name TEXT,
  access_token TEXT NOT NULL,
  token_expires_at TIMESTAMPTZ NOT NULL,
  needs_reauth BOOLEAN NOT NULL DEFAULT FALSE,
  last_published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
