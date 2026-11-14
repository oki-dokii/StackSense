CREATE TABLE products (
  id integer PRIMARY KEY,
  name text NOT NULL,
  category integer NOT NULL,
  price_cents integer NOT NULL,
  description text NOT NULL
);
INSERT INTO products
SELECT n, 'Product ' || n, n % 100, 100 + n, repeat('x', 256)
FROM generate_series(0, 9999) n;
CREATE INDEX products_category_id ON products(category, id);
CREATE TABLE events (id integer PRIMARY KEY, product_id integer NOT NULL REFERENCES products(id));
ANALYZE products;
