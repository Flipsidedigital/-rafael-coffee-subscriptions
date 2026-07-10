const db = require('./index');

// Simple key/value site settings (announcement banner, etc.) for the Marketing tab.
const STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS site_settings (
    key   VARCHAR(60) PRIMARY KEY,
    value TEXT
  )`,
  `INSERT INTO site_settings (key, value)
     SELECT 'announcement', 'Freshly roasted in the Macedon Ranges · Complimentary shipping over $60'
     WHERE NOT EXISTS (SELECT 1 FROM site_settings WHERE key = 'announcement')`,
];

module.exports = async function ensureSettings() {
  for (const sql of STATEMENTS) {
    try { await db.query(sql); } catch (err) { console.error('ensure settings error:', err.message); }
  }
  console.log('site_settings ready');
};
