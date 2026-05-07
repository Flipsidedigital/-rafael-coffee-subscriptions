const express = require('express');
const db = require('../db');
const { adminMiddleware } = require('../middleware/auth');
const router = express.Router();

router.use(adminMiddleware);

// GET /api/admin/dashboard — summary stats
router.get('/dashboard', async (req, res) => {
  try {
    const [activeSubs, pendingOrders, revenue] = await Promise.all([
      db.query(`SELECT COUNT(*) FROM subscriptions WHERE status = 'active'`),
      db.query(`SELECT COUNT(*) FROM orders WHERE status = 'pending'`),
      db.query(`SELECT COALESCE(SUM(amount_cents), 0) as total FROM orders WHERE status != 'cancelled' AND created_at > NOW() - INTERVAL '30 days'`),
    ]);

    res.json({
      active_subscriptions: parseInt(activeSubs.rows[0].count),
      pending_orders: parseInt(pendingOrders.rows[0].count),
      revenue_last_30_days_cents: parseInt(revenue.rows[0].total),
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// GET /api/admin/subscriptions — all subscriptions
router.get('/subscriptions', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT s.*, c.email, c.first_name, c.last_name, p.name as product_name
       FROM subscriptions s
       JOIN customers c ON c.id = s.customer_id
       JOIN products p ON p.id = s.product_id
       ORDER BY s.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Admin subscriptions error:', err);
    res.status(500).json({ error: 'Failed to fetch subscriptions' });
  }
});

// GET /api/admin/orders — all orders with customer details
router.get('/orders', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT o.*, c.email, c.first_name, c.last_name,
              s.shipping_address_1, s.shipping_suburb, s.shipping_state, s.shipping_postcode,
              p.name as product_name
       FROM orders o
       JOIN customers c ON c.id = o.customer_id
       JOIN subscriptions s ON s.id = o.subscription_id
       JOIN products p ON p.id = s.product_id
       ORDER BY o.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Admin orders error:', err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// PATCH /api/admin/orders/:id/tracking — update tracking number
router.patch('/orders/:id/tracking', async (req, res) => {
  const { tracking_number, tracking_carrier } = req.body;

  if (!tracking_number) {
    return res.status(400).json({ error: 'tracking_number required' });
  }

  try {
    const result = await db.query(
      `UPDATE orders SET tracking_number = $1, tracking_carrier = $2, status = 'shipped', shipped_at = NOW(), updated_at = NOW()
       WHERE id = $3 RETURNING *`,
      [tracking_number, tracking_carrier || null, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Tracking update error:', err);
    res.status(500).json({ error: 'Failed to update tracking' });
  }
});

module.exports = router;
