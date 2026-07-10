const db = require('./index');

// Product categories for the storefront filter tabs + product form. Seeded with
// the original three; keyed by slug (id) which matches shop_products.category.
const CREATE = `
CREATE TABLE IF NOT EXISTS product_categories (
  id         VARCHAR(40) PRIMARY KEY,
  label      VARCHAR(80) NOT NULL,
  sort       INTEGER NOT NULL DEFAULT 0,
  active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
)`;
const SEED = [['coffee', 'Coffee', 0], ['accessories', 'Accessories', 1], ['classes', 'Classes', 2]];

module.exports = async function ensureCategories() {
  try {
    await db.query(CREATE);
    const { rows } = await db.query('SELECT COUNT(*) FROM product_categories');
    if (parseInt(rows[0].count, 10) === 0) {
      for (const [id, label, sort] of SEED) {
        await db.query('INSERT INTO product_categories (id, label, sort) VALUES ($1,$2,$3)', [id, label, sort]);
      }
    }
    console.log('product_categories ready');
  } catch (err) {
    console.error('ensure categories error:', err.message);
  }
};
