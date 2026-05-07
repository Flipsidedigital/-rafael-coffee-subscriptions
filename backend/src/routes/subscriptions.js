const express = require('express');
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();

// All subscription routes require authentication
router.use(authMiddleware);

// GET /api/subscriptions/mine — get current customer's subscriptions
router.get('/mine', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT s.*, p.name as product_name, p.roast_level, p.origin
       FROM subscriptions s
       JOIN products p ON p.id = s.product_id
       WHERE s.customer_id = $1
       ORDER BY s.created_at DESC`,
      [req.customer.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Subscriptions fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch subscriptions' });
  }
});

// POST /api/subscriptions/:id/pause
router.post('/:id/pause', async (req, res) => {
  const { pause_until } = req.body;

  if (!pause_until) {
    return res.status(400).json({ error: 'pause_until date required' });
  }

  try {
    const result = await db.query(
      `UPDATE subscriptions SET status = 'paused', pause_until = $1, updated_at = NOW()
       WHERE id = $2 AND customer_id = $3 RETURNING *`,
      [pause_until, req.params.id, req.customer.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    // TODO: Pause in Square Subscriptions API
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Pause error:', err);
    res.status(500).json({ error: 'Failed to pause subscription' });
  }
});

// POST /api/subscriptions/:id/resume
router.post('/:id/resume', async (req, res) => {
  try {
    const result = await db.query(
      `UPDATE subscriptions SET status = 'active', pause_until = NULL, updated_at = NOW()
       WHERE id = $1 AND customer_id = $2 RETURNING *`,
      [req.params.id, req.customer.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    // TODO: Resume in Square Subscriptions API
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Resume error:', err);
    res.status(500).json({ error: 'Failed to resume subscription' });
  }
});

// POST /api/subscriptions/:id/cancel
router.post('/:id/cancel', async (req, res) => {
  try {
    const result = await db.query(
      `UPDATE subscriptions SET status = 'cancelled', cancelled_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND customer_id = $2 RETURNING *`,
      [req.params.id, req.customer.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    // TODO: Cancel in Square Subscriptions API
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Cancel error:', err);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
});

// PATCH /api/subscriptions/:id — update coffee selection or address
router.patch('/:id', async (req, res) => {
  const { product_id, shipping_address_1, shipping_suburb, shipping_state, shipping_postcode } = req.body;

  try {
    const fields = [];
    const values = [];
    let i = 1;

    if (product_id) { fields.push(`product_id = $${i++}`); values.push(product_id); }
    if (shipping_address_1) { fields.push(`shipping_address_1 = $${i++}`); values.push(shipping_address_1); }
    if (shipping_suburb) { fields.push(`shipping_suburb = $${i++}`); values.push(shipping_suburb); }
    if (shipping_state) { fields.push(`shipping_state = $${i++}`); values.push(shipping_state); }
    if (shipping_postcode) { fields.push(`shipping_postcode = $${i++}`); values.push(shipping_postcode); }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    fields.push(`updated_at = NOW()`);
    values.push(req.params.id, req.customer.id);

    const result = await db.query(
      `UPDATE subscriptions SET ${fields.join(', ')}
       WHERE id = $${i++} AND customer_id = $${i++} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update error:', err);
    res.status(500).json({ error: 'Failed to update subscription' });
  }
});

module.exports = router;
