const db = require('./index');

// Class sessions + bookings (E3). No migration runner, so ensure on startup.
const STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS class_sessions (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title         VARCHAR(160) NOT NULL,
    description   TEXT,
    starts_at     TIMESTAMPTZ NOT NULL,
    duration_mins INTEGER NOT NULL DEFAULT 120,
    capacity      INTEGER NOT NULL DEFAULT 8,
    price_cents   INTEGER NOT NULL,
    active        BOOLEAN NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS class_bookings (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id        UUID NOT NULL REFERENCES class_sessions(id),
    name              VARCHAR(160) NOT NULL,
    email             VARCHAR(255) NOT NULL,
    phone             VARCHAR(50),
    seats             INTEGER NOT NULL DEFAULT 1,
    amount_cents      INTEGER NOT NULL,
    square_payment_id VARCHAR(255),
    status            VARCHAR(40) DEFAULT 'confirmed',
    created_at        TIMESTAMPTZ DEFAULT NOW()
  )`,
  // Seed one upcoming session so the booking page isn't empty before an admin adds real ones.
  `INSERT INTO class_sessions (title, description, starts_at, duration_mins, capacity, price_cents)
     SELECT 'Coffee Masterclass',
            'A hands-on session at our Lancefield roastery — dial in espresso, master milk texturing and brew like a pro.',
            date_trunc('hour', NOW() + INTERVAL '14 days') + INTERVAL '10 hours',
            120, 8, 9900
     WHERE NOT EXISTS (SELECT 1 FROM class_sessions)`,
];

module.exports = async function ensureClasses() {
  for (const sql of STATEMENTS) {
    try {
      await db.query(sql);
    } catch (err) {
      console.error('ensure classes error:', err.message);
    }
  }
  console.log('class_sessions + class_bookings ready');
};
