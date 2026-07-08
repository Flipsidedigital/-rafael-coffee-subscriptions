const db = require('./index');

// One-off (non-subscription) shop orders. The existing `orders` table is bound
// to subscriptions (subscription_id NOT NULL), so guest shop orders live here.
// This project has no migration runner, so we ensure the table on startup.
const SQL = `
CREATE TABLE IF NOT EXISTS shop_orders (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number        VARCHAR(20) UNIQUE,
  email               VARCHAR(255) NOT NULL,
  first_name          VARCHAR(100),
  last_name           VARCHAR(100),
  phone               VARCHAR(50),
  shipping_address_1  VARCHAR(255),
  shipping_suburb     VARCHAR(120),
  shipping_state      VARCHAR(10),
  shipping_postcode   VARCHAR(10),
  items               JSONB NOT NULL,
  subtotal_cents      INTEGER NOT NULL,
  shipping_cents      INTEGER NOT NULL DEFAULT 0,
  amount_cents        INTEGER NOT NULL,
  square_payment_id   VARCHAR(255),
  status              VARCHAR(50) DEFAULT 'paid',
  tracking_number     VARCHAR(255),
  tracking_carrier    VARCHAR(100),
  shipped_at          TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);`;

module.exports = async function ensureShopOrders() {
  try {
    await db.query(SQL);
    console.log('shop_orders table ready');
  } catch (err) {
    console.error('Failed to ensure shop_orders table:', err.message);
  }
};
