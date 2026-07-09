// One-off admin bootstrap / password reset.
// Usage (run where DATABASE_URL is set, e.g. locally against prod or on Railway):
//   node scripts/create-admin.js <email> <password> [firstName] [lastName]
//
// Promotes an existing customer to admin (and resets their password), or creates
// a new admin customer. Safe to run repeatedly.
require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('../src/db');

(async () => {
  const [, , emailArg, password, first = 'Admin', last = 'User'] = process.argv;
  if (!emailArg || !password) {
    console.error('Usage: node scripts/create-admin.js <email> <password> [firstName] [lastName]');
    process.exit(1);
  }
  const email = emailArg.toLowerCase().trim();
  const hash = bcrypt.hashSync(password, 10);

  try {
    // Ensure the is_admin column exists (not in the original schema.sql).
    await db.query('ALTER TABLE customers ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE');

    const existing = await db.query('SELECT id FROM customers WHERE email = $1', [email]);
    if (existing.rows.length) {
      await db.query(
        'UPDATE customers SET password_hash = $1, is_admin = TRUE, updated_at = NOW() WHERE email = $2',
        [hash, email]
      );
      console.log(`✓ Existing customer promoted to admin & password reset: ${email}`);
    } else {
      await db.query(
        'INSERT INTO customers (email, first_name, last_name, password_hash, is_admin) VALUES ($1,$2,$3,$4,TRUE)',
        [email, first, last, hash]
      );
      console.log(`✓ Admin created: ${email}`);
    }
    process.exit(0);
  } catch (err) {
    console.error('Failed to create admin:', err.message);
    process.exit(1);
  }
})();
