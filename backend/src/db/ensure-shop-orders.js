const db = require('./index');

// One-off (non-subscription) shop orders + promo codes. The existing `orders`
// table is bound to subscriptions, so guest shop orders live here. This project
// has no migration runner, so we ensure the tables/columns on startup.
const STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS shop_orders (
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
  )`,
  `ALTER TABLE shop_orders ADD COLUMN IF NOT EXISTS discount_cents INTEGER DEFAULT 0`,
  `ALTER TABLE shop_orders ADD COLUMN IF NOT EXISTS promo_code VARCHAR(40)`,
  `CREATE TABLE IF NOT EXISTS promo_codes (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code              VARCHAR(40) UNIQUE NOT NULL,
    kind              VARCHAR(10) NOT NULL DEFAULT 'percent', -- 'percent' | 'fixed'
    value             INTEGER NOT NULL,                       -- percent 1-100, or cents for fixed
    min_subtotal_cents INTEGER NOT NULL DEFAULT 0,
    max_uses          INTEGER,                                -- null = unlimited
    uses              INTEGER NOT NULL DEFAULT 0,
    active            BOOLEAN NOT NULL DEFAULT TRUE,
    expires_at        TIMESTAMPTZ,
    created_at        TIMESTAMPTZ DEFAULT NOW()
  )`,
];

module.exports = async function ensureShopOrders() {
  for (const sql of STATEMENTS) {
    try {
      await db.query(sql);
    } catch (err) {
      console.error('ensure shop tables error:', err.message);
    }
  }
  console.log('shop_orders + promo_codes ready');
};
