const express = require('express');
const crypto = require('crypto');
const db = require('../db');
const router = express.Router();

// Verify Square webhook signature
function verifySquareSignature(req) {
  const signature = req.headers['x-square-hmacsha256-signature'];
  const webhookSignatureKey = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY;

  if (!signature || !webhookSignatureKey) return false;

  const url = `${process.env.API_URL}/webhooks/square`;
  const body = req.body.toString('utf8');
  const hmac = crypto.createHmac('sha256', webhookSignatureKey);
  hmac.update(url + body);
  const expected = hmac.digest('base64');

  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

// POST /webhooks/square
router.post('/', async (req, res) => {
  // Respond to Square immediately
  res.status(200).json({ received: true });

  // Verify signature
  if (!verifySquareSignature(req)) {
    console.warn('Invalid Square webhook signature');
    return;
  }

  let event;
  try {
    event = JSON.parse(req.body.toString('utf8'));
  } catch (err) {
    console.error('Failed to parse webhook payload:', err);
    return;
  }

  // Log the event first (idempotency check)
  try {
    await db.query(
      `INSERT INTO webhook_events (square_event_id, event_type, payload)
       VALUES ($1, $2, $3)
       ON CONFLICT (square_event_id) DO NOTHING`,
      [event.event_id, event.type, JSON.stringify(event)]
    );
  } catch (err) {
    console.error('Failed to log webhook event:', err);
    return;
  }

  // Route to correct handler
  try {
    switch (event.type) {
      case 'subscription.created':
        await handleSubscriptionCreated(event);
        break;
      case 'subscription.updated':
        await handleSubscriptionUpdated(event);
        break;
      case 'payment.created':
        await handlePaymentCreated(event);
        break;
      case 'payment.updated':
        await handlePaymentUpdated(event);
        break;
      default:
        console.log(`Unhandled webhook event type: ${event.type}`);
    }

    // Mark as processed
    await db.query(
      `UPDATE webhook_events SET processed = TRUE, processed_at = NOW()
       WHERE square_event_id = $1`,
      [event.event_id]
    );
  } catch (err) {
    console.error(`Error handling webhook ${event.type}:`, err);
    await db.query(
      `UPDATE webhook_events SET error = $1 WHERE square_event_id = $2`,
      [err.message, event.event_id]
    );
  }
});

async function handleSubscriptionCreated(event) {
  const sub = event.data?.object?.subscription;
  if (!sub) return;
  console.log('Subscription created in Square:', sub.id);
  // Update our DB record with Square's subscription ID
  await db.query(
    `UPDATE subscriptions SET square_subscription_id = $1, updated_at = NOW()
     WHERE square_subscription_id IS NULL
     ORDER BY created_at DESC LIMIT 1`,
    [sub.id]
  );
}

async function handleSubscriptionUpdated(event) {
  const sub = event.data?.object?.subscription;
  if (!sub) return;
  console.log('Subscription updated in Square:', sub.id, sub.status);
}

async function handlePaymentCreated(event) {
  const payment = event.data?.object?.payment;
  if (!payment || payment.status !== 'COMPLETED') return;

  console.log('Payment completed:', payment.id);

  // Find the matching subscription via Square customer ID
  const customerResult = await db.query(
    `SELECT s.id as subscription_id, s.customer_id FROM subscriptions s
     JOIN customers c ON c.id = s.customer_id
     WHERE c.square_customer_id = $1 AND s.status = 'active'
     LIMIT 1`,
    [payment.customer_id]
  );

  if (customerResult.rows.length === 0) {
    console.warn('No active subscription found for payment:', payment.id);
    return;
  }

  const { subscription_id, customer_id } = customerResult.rows[0];

  // Create an order record
  await db.query(
    `INSERT INTO orders (subscription_id, customer_id, square_payment_id, status, amount_cents)
     VALUES ($1, $2, $3, 'pending', $4)
     ON CONFLICT (square_payment_id) DO NOTHING`,
    [subscription_id, customer_id, payment.id, payment.total_money?.amount || 0]
  );
}

async function handlePaymentUpdated(event) {
  const payment = event.data?.object?.payment;
  if (!payment) return;
  console.log('Payment updated:', payment.id, payment.status);
}

module.exports = router;
