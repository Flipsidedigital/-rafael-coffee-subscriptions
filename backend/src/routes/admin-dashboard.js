const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const router = express.Router();

// Admin auth middleware
function adminAuth(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorised' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.isAdmin) return res.status(403).json({ error: 'Admin access required' });
    req.admin = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// POST /api/admin/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  try {
    const result = await db.query(
      'SELECT id, email, first_name, last_name, password_hash, is_admin FROM customers WHERE email = $1 AND is_admin = TRUE',
      [email.toLowerCase().trim()]
    );

    if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

    const admin = result.rows[0];
    const valid = await bcrypt.compare(password, admin.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { id: admin.id, email: admin.email, isAdmin: true },
      process.env.JWT_SECRET,
      { expiresIn: '12h' }
    );

    res.json({ token, admin: { id: admin.id, email: admin.email, first_name: admin.first_name } });
  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// GET /api/admin/dashboard
router.get('/dashboard', adminAuth, async (req, res) => {
  try {
    const [active, paused, cancelled, totalRevenue, recentOrders] = await Promise.all([
      db.query("SELECT COUNT(*) FROM subscriptions WHERE status = 'active'"),
      db.query("SELECT COUNT(*) FROM subscriptions WHERE status = 'paused'"),
      db.query("SELECT COUNT(*) FROM subscriptions WHERE status = 'cancelled'"),
      db.query("SELECT COALESCE(SUM(amount_cents), 0) as total FROM orders WHERE created_at > NOW() - INTERVAL '30 days'"),
      db.query(`SELECT o.*, c.first_name, c.last_name, c.email, p.name as product_name,
                s.shipping_name, s.shipping_address_1, s.shipping_suburb, s.shipping_state, s.shipping_postcode,
                s.frequency, s.quantity_grams
                FROM orders o
                JOIN customers c ON c.id = o.customer_id
                JOIN subscriptions s ON s.id = o.subscription_id
                JOIN products p ON p.id = s.product_id
                ORDER BY o.created_at DESC LIMIT 5`),
    ]);

    res.json({
      stats: {
        active_subscriptions: parseInt(active.rows[0].count),
        paused_subscriptions: parseInt(paused.rows[0].count),
        cancelled_subscriptions: parseInt(cancelled.rows[0].count),
        revenue_30_days: parseInt(totalRevenue.rows[0].total),
      },
      recent_orders: recentOrders.rows,
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: 'Failed to load dashboard' });
  }
});

// GET /api/admin/subscriptions
router.get('/subscriptions', adminAuth, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT s.*, c.first_name, c.last_name, c.email, c.phone, p.name as product_name
      FROM subscriptions s
      JOIN customers c ON c.id = s.customer_id
      JOIN products p ON p.id = s.product_id
      ORDER BY s.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Subscriptions error:', err);
    res.status(500).json({ error: 'Failed to load subscriptions' });
  }
});

// GET /api/admin/orders
router.get('/orders', adminAuth, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT o.*, c.first_name, c.last_name, c.email,
             p.name as product_name,
             s.shipping_name, s.shipping_address_1, s.shipping_suburb,
             s.shipping_state, s.shipping_postcode, s.frequency, s.quantity_grams
      FROM orders o
      JOIN customers c ON c.id = o.customer_id
      JOIN subscriptions s ON s.id = o.subscription_id
      JOIN products p ON p.id = s.product_id
      ORDER BY o.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Orders error:', err);
    res.status(500).json({ error: 'Failed to load orders' });
  }
});

// PATCH /api/admin/orders/:id/tracking
router.patch('/orders/:id/tracking', adminAuth, async (req, res) => {
  const { tracking_number, tracking_carrier } = req.body;
  try {
    const result = await db.query(
      `UPDATE orders SET tracking_number = $1, tracking_carrier = $2, status = 'shipped', shipped_at = NOW(), updated_at = NOW()
       WHERE id = $3 RETURNING *`,
      [tracking_number, tracking_carrier || null, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Order not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Tracking error:', err);
    res.status(500).json({ error: 'Failed to update tracking' });
  }
});

// PATCH /api/admin/subscriptions/:id/status
router.patch('/subscriptions/:id/status', adminAuth, async (req, res) => {
  const { status } = req.body;
  try {
    const result = await db.query(
      `UPDATE subscriptions SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Subscription not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Status update error:', err);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// GET /api/admin/shop-orders — one-off (non-subscription) shop orders
router.get('/shop-orders', adminAuth, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM shop_orders ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Shop orders error:', err);
    res.status(500).json({ error: 'Failed to load shop orders' });
  }
});

// PATCH /api/admin/shop-orders/:id — update status / tracking (fulfilment)
router.patch('/shop-orders/:id', adminAuth, async (req, res) => {
  const { status, tracking_number, tracking_carrier } = req.body;
  try {
    const result = await db.query(
      `UPDATE shop_orders
         SET tracking_number = COALESCE($1, tracking_number),
             tracking_carrier = COALESCE($2, tracking_carrier),
             status = COALESCE($3, status),
             shipped_at = CASE WHEN $3 = 'shipped' AND shipped_at IS NULL THEN NOW() ELSE shipped_at END
       WHERE id = $4 RETURNING *`,
      [tracking_number ?? null, tracking_carrier ?? null, status ?? null, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Order not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Shop order update error:', err);
    res.status(500).json({ error: 'Failed to update order' });
  }
});

module.exports = { router, adminAuth };
