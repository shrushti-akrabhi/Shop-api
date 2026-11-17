CREATE TABLE categories (
  category_id uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  name        varchar(100) NOT NULL,
  description text,
  created_at  timestamptz  NOT NULL DEFAULT now(),
  updated_at  timestamptz  NOT NULL DEFAULT now(),
 
  CONSTRAINT categories_name_unique UNIQUE (name)
);

CREATE TRIGGER trg_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
 
CREATE TABLE products (
  product_id     uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id    uuid          REFERENCES categories (category_id) ON DELETE SET NULL,
  product_name   varchar(255)  NOT NULL,
  description    text,
  price          numeric(10,2) NOT NULL,
  stock_quantity integer       NOT NULL DEFAULT 0,
  is_active      boolean       NOT NULL DEFAULT true,
  created_at     timestamptz   NOT NULL DEFAULT now(),
  updated_at     timestamptz   NOT NULL DEFAULT now(),
 
  CONSTRAINT products_price_nonneg CHECK (price >= 0),
  CONSTRAINT products_stock_nonneg CHECK (stock_quantity >= 0)
);

CREATE INDEX idx_products_category_id ON products (category_id);
CREATE INDEX idx_products_active_created ON products (is_active, created_at DESC);

CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();