const express = require('express');
const db = require('../db');
const router = express.Router();

// GET /api/shop-products — public storefront catalogue (active only)
router.get('/', async (req, res) => {
  try {
    const r = await db.query('SELECT * FROM shop_products WHERE active = TRUE ORDER BY sort ASC, name ASC');
    res.json(r.rows);
  } catch (err) {
    console.error('shop-products list error:', err);
    res.status(500).json({ error: 'Failed to load products' });
  }
});

module.exports = router;
