const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { put } = require('@vercel/blob');
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
  const n = (r) => parseInt(r.rows[0].count ?? r.rows[0].total ?? 0, 10);
  try {
    const [active, paused, cancelled, subRev, shopRev, classRev, shopCount, classCount, upcoming, activePromos, series] = await Promise.all([
      db.query("SELECT COUNT(*) FROM subscriptions WHERE status = 'active'"),
      db.query("SELECT COUNT(*) FROM subscriptions WHERE status = 'paused'"),
      db.query("SELECT COUNT(*) FROM subscriptions WHERE status = 'cancelled'"),
      db.query("SELECT COALESCE(SUM(amount_cents),0) AS total FROM orders WHERE created_at > NOW() - INTERVAL '30 days'"),
      db.query("SELECT COALESCE(SUM(amount_cents),0) AS total FROM shop_orders WHERE created_at > NOW() - INTERVAL '30 days'"),
      db.query("SELECT COALESCE(SUM(amount_cents),0) AS total FROM class_bookings WHERE created_at > NOW() - INTERVAL '30 days'"),
      db.query("SELECT COUNT(*) FROM shop_orders"),
      db.query("SELECT COALESCE(SUM(seats),0) AS count FROM class_bookings WHERE status = 'confirmed'"),
      db.query("SELECT COUNT(*) FROM class_sessions WHERE active = TRUE AND starts_at > NOW()"),
      db.query("SELECT COUNT(*) FROM promo_codes WHERE active = TRUE"),
      db.query(`
        SELECT to_char(d, 'YYYY-MM-DD') AS day,
          COALESCE((SELECT SUM(amount_cents) FROM orders WHERE created_at::date = d),0)
          + COALESCE((SELECT SUM(amount_cents) FROM shop_orders WHERE created_at::date = d),0)
          + COALESCE((SELECT SUM(amount_cents) FROM class_bookings WHERE created_at::date = d),0) AS cents
        FROM generate_series(CURRENT_DATE - INTERVAL '13 days', CURRENT_DATE, INTERVAL '1 day') d
        ORDER BY day`),
    ]);

    const revenue_30_days = n(subRev) + n(shopRev) + n(classRev);
    res.json({
      stats: {
        active_subscriptions: n(active),
        paused_subscriptions: n(paused),
        cancelled_subscriptions: n(cancelled),
        revenue_30_days,
        subscription_revenue_30_days: n(subRev),
        shop_revenue_30_days: n(shopRev),
        class_revenue_30_days: n(classRev),
        shop_orders_total: n(shopCount),
        class_seats_booked: n(classCount),
        upcoming_classes: n(upcoming),
        active_promos: n(activePromos),
      },
      revenue_series: series.rows.map((r) => ({ day: r.day, cents: parseInt(r.cents, 10) })),
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

// ── Promo codes (E5) ─────────────────────────────────────────────────────────
router.get('/promo-codes', adminAuth, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM promo_codes ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Promo list error:', err);
    res.status(500).json({ error: 'Failed to load promo codes' });
  }
});

router.post('/promo-codes', adminAuth, async (req, res) => {
  const { code, kind, value, min_subtotal_cents, max_uses, expires_at } = req.body;
  if (!code || !value) return res.status(400).json({ error: 'Code and value are required' });
  const k = kind === 'fixed' ? 'fixed' : 'percent';
  if (k === 'percent' && (value < 1 || value > 100)) return res.status(400).json({ error: 'Percent must be 1–100' });
  try {
    const result = await db.query(
      `INSERT INTO promo_codes (code, kind, value, min_subtotal_cents, max_uses, expires_at)
       VALUES (upper($1), $2, $3, $4, $5, $6) RETURNING *`,
      [code.trim(), k, parseInt(value, 10), parseInt(min_subtotal_cents, 10) || 0, max_uses ? parseInt(max_uses, 10) : null, expires_at || null]
    );
    res.json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'That code already exists' });
    console.error('Promo create error:', err);
    res.status(500).json({ error: 'Failed to create promo code' });
  }
});

router.patch('/promo-codes/:id', adminAuth, async (req, res) => {
  const { active } = req.body;
  try {
    const result = await db.query(
      'UPDATE promo_codes SET active = COALESCE($1, active) WHERE id = $2 RETURNING *',
      [typeof active === 'boolean' ? active : null, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Promo code not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Promo update error:', err);
    res.status(500).json({ error: 'Failed to update promo code' });
  }
});

// ── Class sessions & bookings (E3) ───────────────────────────────────────────
router.get('/class-sessions', adminAuth, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT s.*, COALESCE(SUM(b.seats), 0)::int AS booked, COUNT(b.id)::int AS bookings_count
      FROM class_sessions s
      LEFT JOIN class_bookings b ON b.session_id = s.id AND b.status = 'confirmed'
      GROUP BY s.id ORDER BY s.starts_at DESC`);
    res.json(result.rows);
  } catch (err) {
    console.error('Class sessions error:', err);
    res.status(500).json({ error: 'Failed to load classes' });
  }
});

router.post('/class-sessions', adminAuth, async (req, res) => {
  const { title, description, starts_at, duration_mins, capacity, price_cents } = req.body;
  if (!title || !starts_at || !price_cents) return res.status(400).json({ error: 'Title, date and price are required' });
  try {
    const result = await db.query(
      `INSERT INTO class_sessions (title, description, starts_at, duration_mins, capacity, price_cents)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [title, description || null, starts_at, parseInt(duration_mins, 10) || 120, parseInt(capacity, 10) || 8, parseInt(price_cents, 10)]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Class create error:', err);
    res.status(500).json({ error: 'Failed to create class' });
  }
});

router.patch('/class-sessions/:id', adminAuth, async (req, res) => {
  const { active } = req.body;
  try {
    const result = await db.query(
      'UPDATE class_sessions SET active = COALESCE($1, active) WHERE id = $2 RETURNING *',
      [typeof active === 'boolean' ? active : null, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Class not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Class update error:', err);
    res.status(500).json({ error: 'Failed to update class' });
  }
});

router.get('/class-sessions/:id/bookings', adminAuth, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM class_bookings WHERE session_id = $1 ORDER BY created_at ASC',
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Class bookings error:', err);
    res.status(500).json({ error: 'Failed to load bookings' });
  }
});

// ── Product catalogue (admin) ────────────────────────────────────────────────
const CATALOG_FIELDS = ['category', 'name', 'sub', 'weight', 'price_cents', 'image', 'fit', 'blurb', 'origin', 'roast', 'notes', 'rating', 'reviews', 'active', 'sort', 'featured'];

function slugify(s) {
  return String(s || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
}

router.get('/shop-products', adminAuth, async (req, res) => {
  try {
    const r = await db.query('SELECT * FROM shop_products ORDER BY sort ASC, name ASC');
    res.json(r.rows);
  } catch (err) {
    console.error('Catalogue list error:', err);
    res.status(500).json({ error: 'Failed to load products' });
  }
});

router.post('/shop-products', adminAuth, async (req, res) => {
  const b = req.body || {};
  if (!b.name || !b.price_cents) return res.status(400).json({ error: 'Name and price are required' });
  const id = (b.id && slugify(b.id)) || slugify(b.name);
  if (!id) return res.status(400).json({ error: 'Could not derive a product id' });
  try {
    const r = await db.query(
      `INSERT INTO shop_products (id, category, name, sub, weight, price_cents, image, fit, blurb, origin, roast, notes, rating, reviews, active, sort)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,COALESCE($15,TRUE),COALESCE($16,0)) RETURNING *`,
      [id, b.category || 'coffee', b.name, b.sub || null, b.weight || null, parseInt(b.price_cents, 10),
        b.image || null, b.fit || 'contain', b.blurb || null, b.origin || null, b.roast || null,
        b.notes ? JSON.stringify(Array.isArray(b.notes) ? b.notes : String(b.notes).split(',').map(s => s.trim()).filter(Boolean)) : null,
        b.rating || null, b.reviews || null, typeof b.active === 'boolean' ? b.active : null, b.sort ?? null]
    );
    res.json(r.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'A product with that id already exists' });
    console.error('Catalogue create error:', err);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

router.patch('/shop-products/:id', adminAuth, async (req, res) => {
  const b = req.body || {};
  const sets = [];
  const vals = [];
  let i = 1;
  for (const f of CATALOG_FIELDS) {
    if (b[f] === undefined) continue;
    let v = b[f];
    if (f === 'notes') v = v ? JSON.stringify(Array.isArray(v) ? v : String(v).split(',').map(s => s.trim()).filter(Boolean)) : null;
    if (f === 'price_cents' || f === 'reviews' || f === 'sort') v = v === null ? null : parseInt(v, 10);
    sets.push(`${f} = $${i++}`);
    vals.push(v);
  }
  if (sets.length === 0) return res.status(400).json({ error: 'Nothing to update' });
  vals.push(req.params.id);
  try {
    const r = await db.query(`UPDATE shop_products SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`, vals);
    if (r.rows.length === 0) return res.status(404).json({ error: 'Product not found' });
    res.json(r.rows[0]);
  } catch (err) {
    console.error('Catalogue update error:', err);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

router.delete('/shop-products/:id', adminAuth, async (req, res) => {
  try {
    await db.query('DELETE FROM shop_products WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    console.error('Catalogue delete error:', err);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// ── Product categories ───────────────────────────────────────────────────────
router.get('/categories', adminAuth, async (req, res) => {
  try {
    const r = await db.query('SELECT * FROM product_categories ORDER BY sort ASC, label ASC');
    res.json(r.rows);
  } catch (err) {
    console.error('Categories list error:', err);
    res.status(500).json({ error: 'Failed to load categories' });
  }
});

router.post('/categories', adminAuth, async (req, res) => {
  const { label, sort } = req.body || {};
  if (!label) return res.status(400).json({ error: 'Label is required' });
  const id = (req.body.id && slugify(req.body.id)) || slugify(label);
  if (!id) return res.status(400).json({ error: 'Could not derive a category id' });
  try {
    const r = await db.query(
      'INSERT INTO product_categories (id, label, sort) VALUES ($1,$2,$3) RETURNING *',
      [id, label, parseInt(sort, 10) || 0]
    );
    res.json(r.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'That category already exists' });
    console.error('Category create error:', err);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

router.patch('/categories/:id', adminAuth, async (req, res) => {
  const { label, sort, active } = req.body || {};
  try {
    const r = await db.query(
      `UPDATE product_categories
         SET label = COALESCE($1, label), sort = COALESCE($2, sort), active = COALESCE($3, active)
       WHERE id = $4 RETURNING *`,
      [label ?? null, sort != null ? parseInt(sort, 10) : null, typeof active === 'boolean' ? active : null, req.params.id]
    );
    if (r.rows.length === 0) return res.status(404).json({ error: 'Category not found' });
    res.json(r.rows[0]);
  } catch (err) {
    console.error('Category update error:', err);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

router.delete('/categories/:id', adminAuth, async (req, res) => {
  try {
    await db.query('DELETE FROM product_categories WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    console.error('Category delete error:', err);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

// ── Site settings (Marketing) ────────────────────────────────────────────────
router.get('/site-settings', adminAuth, async (req, res) => {
  try {
    const r = await db.query('SELECT key, value FROM site_settings');
    const out = {};
    r.rows.forEach((x) => { out[x.key] = x.value; });
    res.json(out);
  } catch (err) {
    console.error('admin settings error:', err);
    res.status(500).json({ error: 'Failed to load settings' });
  }
});

router.patch('/site-settings', adminAuth, async (req, res) => {
  const entries = Object.entries(req.body || {});
  if (entries.length === 0) return res.status(400).json({ error: 'Nothing to update' });
  try {
    for (const [key, value] of entries) {
      await db.query(
        'INSERT INTO site_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2',
        [key, value == null ? null : String(value)]
      );
    }
    res.json({ ok: true });
  } catch (err) {
    console.error('admin settings update error:', err);
    res.status(500).json({ error: 'Failed to save settings' });
  }
});

// ── Image upload (Vercel Blob) ───────────────────────────────────────────────
// Frontend POSTs the raw file bytes with ?filename= and the image Content-Type.
router.post('/upload', adminAuth, express.raw({ type: ['image/*', 'application/octet-stream'], limit: '8mb' }), async (req, res) => {
  try {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return res.status(500).json({ error: 'Image storage not configured — set BLOB_READ_WRITE_TOKEN.' });
    }
    if (!req.body || !req.body.length) return res.status(400).json({ error: 'No file received' });
    const safe = String(req.query.filename || 'image').replace(/[^a-z0-9._-]/gi, '-').slice(0, 80);
    const blob = await put(`products/${Date.now()}-${safe}`, req.body, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN,
      contentType: req.headers['content-type'] || 'image/jpeg',
      addRandomSuffix: false,
    });
    res.json({ url: blob.url });
  } catch (err) {
    console.error('Upload error:', err.message);
    res.status(500).json({ error: 'Upload failed' });
  }
});

module.exports = { router, adminAuth };
