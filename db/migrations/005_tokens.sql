CREATE TABLE refresh_tokens (
  token_id   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES users (user_id) ON DELETE CASCADE,
  token_hash char(64)    NOT NULL,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT refresh_tokens_hash_unique UNIQUE (token_hash)
);
 
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens (user_id);
 