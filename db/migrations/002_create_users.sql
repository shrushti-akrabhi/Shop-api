CREATE TABLE users (
  user_id       uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name     varchar(255)  NOT NULL,
  email         varchar(255)  NOT NULL,
  password_hash varchar(255)  NOT NULL,
  role          user_role     NOT NULL DEFAULT 'customer',
  is_active     boolean       NOT NULL DEFAULT true,
  created_at    timestamptz   NOT NULL DEFAULT now(),
  updated_at    timestamptz   NOT NULL DEFAULT now(),
 
  CONSTRAINT users_email_unique    UNIQUE (email),
  CONSTRAINT users_email_lowercase CHECK (email = lower(email))
);

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();