CREATE TYPE user_role AS ENUM ('customer', 'admin');
 
CREATE TYPE order_status AS ENUM (
  'pending',
  'paid',
  'shipped',
  'delivered',
  'cancelled'
);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;