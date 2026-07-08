const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const squareClient = require('../config/square');
const router = express.Router();

// Server-side price list (cents) — never trust amounts sent by the client.
// Keep in sync with frontend/src/shop/products.js.
const PRICE_CENTS = {
  onesto: 1800, ipanema: 1800, llaneros: 1800, calabrian: 1800, equinox: 1800,
  guatemala: 2000, peru: 2000, decaf: 2000,
};
const NAMES = {
  onesto: 'The Onesto', ipanema: 'The Ipanema', llaneros: 'The Llaneros',
  calabrian: 'The Calabrian', equinox: 'Old Man Winter', guatemala: 'Guatemala Antigua',
  peru: 'Peru Aprocassi Organic', decaf: 'Mexico Swiss Water® Process Organic Decaf',
};
const FREE_SHIPPING_CENTS = 6000; // $60 (mirrors frontend)
const FLAT_SHIPPING_CENTS = 1000; // $10
const MAX_QTY = 50;

function genOrderNumber() {
  const t = Date.now().toString(36).toUpperCase().slice(-5);
  const r = Math.floor(Math.random() * 46656).toString(36).toUpperCase().padStart(3, '0');
  return `RC-${t}${r}`;
}

// POST /api/orders/one-off — public guest checkout for shop (one-off) orders.
router.post('/one-off', async (req, res) => {
  const { items, contact, shipping, card_token } = req.body || {};

  if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ error: 'Your cart is empty' });
  if (!card_token) return res.status(400).json({ error: 'Missing payment details' });
  if (!contact?.email || !contact?.first_name) return res.status(400).json({ error: 'Missing contact details' });
  if (!shipping?.address_1 || !shipping?.suburb || !shipping?.postcode) {
    return res.status(400).json({ error: 'Missing shipping address' });
  }

  // Price everything server-side.
  let subtotal = 0;
  const lineItems = [];
  for (const it of items) {
    const unit = PRICE_CENTS[it?.id];
    const qty = parseInt(it?.qty, 10);
    if (!unit) return res.status(400).json({ error: `Unknown product: ${it?.id}` });
    if (!Number.isInteger(qty) || qty < 1 || qty > MAX_QTY) return res.status(400).json({ error: 'Invalid quantity' });
    subtotal += unit * qty;
    lineItems.push({ id: it.id, name: NAMES[it.id] || it.id, qty, unit_cents: unit });
  }
  const shipping_cents = subtotal >= FREE_SHIPPING_CENTS ? 0 : FLAT_SHIPPING_CENTS;
  const amount_cents = subtotal + shipping_cents;

  // 1) Take the payment.
  let paymentId = null;
  try {
    const { result } = await squareClient.paymentsApi.createPayment({
      sourceId: card_token,
      idempotencyKey: uuidv4(),
      amountMoney: { amount: BigInt(amount_cents), currency: 'AUD' },
      note: "Rafael's Coffee shop order",
    });
    paymentId = result?.payment?.id || null;
  } catch (err) {
    const sqMsg = err?.result?.errors?.map((e) => e.detail || e.code).join(', ');
    console.error('One-off payment error:', sqMsg || err.message);
    return res.status(402).json({ error: sqMsg || 'Payment could not be processed. Please check your card and try again.' });
  }

  // 2) Record the order (best-effort — the card is already charged, so never
  //    fail the request here or the customer could be double-charged on retry).
  const orderNumber = genOrderNumber();
  let orderId = null;
  try {
    const ins = await db.query(
      `INSERT INTO shop_orders (order_number, email, first_name, last_name, phone,
         shipping_address_1, shipping_suburb, shipping_state, shipping_postcode,
         items, subtotal_cents, shipping_cents, amount_cents, square_payment_id, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,'paid')
       RETURNING id`,
      [orderNumber, contact.email, contact.first_name, contact.last_name || null, contact.phone || null,
        shipping.address_1, shipping.suburb, shipping.state || null, shipping.postcode,
        JSON.stringify(lineItems), subtotal, shipping_cents, amount_cents, paymentId],
    );
    orderId = ins.rows[0].id;
  } catch (err) {
    console.error('Payment captured but order insert failed:', err.message, 'payment:', paymentId);
  }

  return res.json({
    order_id: orderId,
    order_number: orderNumber,
    email: contact.email,
    first_name: contact.first_name,
    amount_cents,
    status: 'paid',
  });
});

module.exports = router;
