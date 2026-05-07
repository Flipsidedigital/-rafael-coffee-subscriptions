const express = require('express');
const db = require('../db');
const router = express.Router();

// GET /api/products — public, returns all active coffee products
router.get('/', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM products WHERE active = TRUE ORDER BY name ASC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Products fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM products WHERE id = $1 AND active = TRUE',
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Product fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

module.exports = router;
