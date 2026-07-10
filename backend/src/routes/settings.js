const express = require('express');
const db = require('../db');
const router = express.Router();

// GET /api/site-settings — public site settings as a { key: value } object
router.get('/', async (req, res) => {
  try {
    const r = await db.query('SELECT key, value FROM site_settings');
    const out = {};
    r.rows.forEach((x) => { out[x.key] = x.value; });
    res.json(out);
  } catch (err) {
    console.error('settings error:', err.message);
    res.json({});
  }
});

module.exports = router;
