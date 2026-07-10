const express = require('express');
const db = require('../db');
const router = express.Router();

// GET /api/categories — public active categories (ordered)
router.get('/', async (req, res) => {
  try {
    const r = await db.query('SELECT id, label FROM product_categories WHERE active = TRUE ORDER BY sort ASC, label ASC');
    res.json(r.rows);
  } catch (err) {
    console.error('categories error:', err.message);
    res.json([]);
  }
});

module.exports = router;
