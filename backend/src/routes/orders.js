const express = require('express');
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();

router.use(authMiddleware);

// GET /api/orders/mine — order history for logged in customer
router.get('/mine', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT o.*, p.name as product_name
       FROM orders o
       JOIN subscriptions s ON s.id = o.subscription_id
       JOIN products p ON p.id = s.product_id
       WHERE o.customer_id = $1
       ORDER BY o.created_at DESC`,
      [req.customer.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Orders fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

module.exports = router;
