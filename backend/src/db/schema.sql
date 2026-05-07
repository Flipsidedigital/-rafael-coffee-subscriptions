-- Rafael Coffee Subscription Platform
-- Database Schema v1.0
-- Run this against your PostgreSQL instance to initialise the database

-- ── Customers ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS customers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           VARCHAR(255) UNIQUE NOT NULL,
  first_name      VARCHAR(100) NOT NULL,
  last_name       VARCHAR(100) NOT NULL,
  phone           VARCHAR(50),
  password_hash   TEXT NOT NULL,
  square_customer_id VARCHAR(255) UNIQUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── Products (Coffee Listings) ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR(255) NOT NULL,
  origin          VARCHAR(255),
  roast_level     VARCHAR(50),  -- light, medium, dark
  tasting_notes   TEXT,
  description     TEXT,
  price_250g      NUMERIC(10,2),
  price_500g      NUMERIC(10,2),
  price_1kg       NUMERIC(10,2),
  square_item_id  VARCHAR(255),
  active          BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── Subscriptions ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscriptions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id           UUID NOT NULL REFERENCES customers(id),
  product_id            UUID NOT NULL REFERENCES products(id),
  square_subscription_id VARCHAR(255) UNIQUE,
  square_plan_id        VARCHAR(255),
  status                VARCHAR(50) DEFAULT 'active',  -- active, paused, cancelled
  frequency             VARCHAR(50) NOT NULL,           -- weekly, fortnightly, monthly
  quantity_grams        INTEGER NOT NULL DEFAULT 250,
  shipping_name         VARCHAR(255),
  shipping_address_1    VARCHAR(255),
  shipping_address_2    VARCHAR(255),
  shipping_suburb       VARCHAR(100),
  shipping_state        VARCHAR(50),
  shipping_postcode     VARCHAR(20),
  pause_until           DATE,
  next_billing_date     DATE,
  started_at            TIMESTAMPTZ DEFAULT NOW(),
  cancelled_at          TIMESTAMPTZ,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ── Orders ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id     UUID NOT NULL REFERENCES subscriptions(id),
  customer_id         UUID NOT NULL REFERENCES customers(id),
  square_payment_id   VARCHAR(255) UNIQUE,
  square_order_id     VARCHAR(255),
  status              VARCHAR(50) DEFAULT 'pending',  -- pending, processing, shipped, delivered
  amount_cents        INTEGER NOT NULL,
  tracking_number     VARCHAR(255),
  tracking_carrier    VARCHAR(100),
  shipped_at          TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ── Webhook Events (Audit Log) ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS webhook_events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  square_event_id VARCHAR(255) UNIQUE,
  event_type    VARCHAR(255) NOT NULL,
  payload       JSONB NOT NULL,
  processed     BOOLEAN DEFAULT FALSE,
  processed_at  TIMESTAMPTZ,
  error         TEXT,
  received_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── Indexes ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_subscriptions_customer ON subscriptions(customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status   ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_orders_subscription    ON orders(subscription_id);
CREATE INDEX IF NOT EXISTS idx_orders_status          ON orders(status);
CREATE INDEX IF NOT EXISTS idx_webhook_events_type    ON webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON webhook_events(processed);
