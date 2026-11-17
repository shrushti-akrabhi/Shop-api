CREATE TABLE orders (
  order_id         uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid          NOT NULL REFERENCES users (user_id) ON DELETE RESTRICT,
  status           order_status  NOT NULL DEFAULT 'pending',
  total_amount     numeric(12,2) NOT NULL DEFAULT 0,
  shipping_address text          NOT NULL,
  created_at       timestamptz   NOT NULL DEFAULT now(),
  updated_at       timestamptz   NOT NULL DEFAULT now(),

  CONSTRAINT orders_total_nonneg CHECK (total_amount >= 0)
);

CREATE INDEX idx_orders_user_created ON orders (user_id, created_at DESC);
CREATE INDEX idx_orders_status       ON orders (status);

CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE order_items (
  order_item_id uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id      uuid          NOT NULL REFERENCES orders   (order_id)   ON DELETE CASCADE,
  product_id    uuid          NOT NULL REFERENCES products (product_id) ON DELETE RESTRICT,
  quantity      integer       NOT NULL,
  -- Price at time of purchase; later changes to products.price must not alter old orders.
  unit_price    numeric(10,2) NOT NULL,
  subtotal      numeric(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,

  CONSTRAINT order_items_quantity_pos     CHECK (quantity > 0),
  CONSTRAINT order_items_unit_price_nonneg CHECK (unit_price >= 0),
  CONSTRAINT order_items_order_product_unique UNIQUE (order_id, product_id)
);

CREATE INDEX idx_order_items_order_id   ON order_items (order_id);
CREATE INDEX idx_order_items_product_id ON order_items (product_id);