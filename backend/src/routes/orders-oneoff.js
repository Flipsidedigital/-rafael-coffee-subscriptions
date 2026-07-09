const express = require('express');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const squareClient = require('../config/square');
const router = express.Router();

// Server-side price list (cents) — never trust amounts sent by the client.
// Keep in sync with frontend/src/shop/products.js.
const PRICE_CENTS = {
  onesto: 1800, ipanema: 1800, llaneros: 1800, calabrian: 1800, equinox: 1800,
  guatemala: 2000, peru: 2000, decaf: 2000,
  airscape: 5500, silicone: 595, masterclass: 9900,
};
const NAMES = {
  onesto: 'The Onesto', ipanema: 'The Ipanema', llaneros: 'The Llaneros',
  calabrian: 'The Calabrian', equinox: 'Old Man Winter', guatemala: 'Guatemala Antigua',
  peru: 'Peru Aprocassi Organic', decaf: 'Mexico Swiss Water® Process Organic Decaf',
  airscape: 'Airscape® Coffee Canister', silicone: 'Silicone Storage Bags', masterclass: 'Coffee Masterclass',
};
const FREE_SHIPPING_CENTS = 6000; // $60 (mirrors frontend)
const FLAT_SHIPPING_CENTS = 1000; // $10
const MAX_QTY = 50;
const SUBSCRIBER_DISCOUNT = 0.1; // 10% for logged-in customers

function genOrderNumber() {
  const t = Date.now().toString(36).toUpperCase().slice(-5);
  const r = Math.floor(Math.random() * 46656).toString(36).toUpperCase().padStart(3, '0');
  return `RC-${t}${r}`;
}

// Validate a promo code against a subtotal. Returns a preview (no side effects).
async function validatePromo(rawCode, subtotalCents) {
  const code = String(rawCode || '').trim().toUpperCase();
  if (!code) return { valid: false, message: 'Enter a code' };
  const { rows } = await db.query('SELECT * FROM promo_codes WHERE upper(code) = $1', [code]);
  const p = rows[0];
  if (!p || !p.active) return { valid: false, message: 'Invalid code' };
  if (p.expires_at && new Date(p.expires_at) < new Date()) return { valid: false, message: 'This code has expired' };
  if (p.max_uses != null && p.uses >= p.max_uses) return { valid: false, message: 'This code has reached its limit' };
  if (subtotalCents < p.min_subtotal_cents) {
    return { valid: false, message: `Spend $${(p.min_subtotal_cents / 100).toFixed(2)}+ to use this code` };
  }
  let discount = p.kind === 'percent' ? Math.round(subtotalCents * (p.value / 100)) : p.value;
  discount = Math.min(discount, subtotalCents);
  return { valid: true, code: p.code, kind: p.kind, value: p.value, discount_cents: discount };
}

function priceCart(items) {
  let subtotal = 0;
  const lineItems = [];
  for (const it of items) {
    const unit = PRICE_CENTS[it?.id];
    const qty = parseInt(it?.qty, 10);
    if (!unit) return { error: `Unknown product: ${it?.id}` };
    if (!Number.isInteger(qty) || qty < 1 || qty > MAX_QTY) return { error: 'Invalid quantity' };
    subtotal += unit * qty;
    lineItems.push({ id: it.id, name: NAMES[it.id] || it.id, qty, unit_cents: unit });
  }
  return { subtotal, lineItems };
}

// POST /api/orders/validate-promo — preview a promo discount for the current cart
router.post('/validate-promo', async (req, res) => {
  try {
    const subtotal = parseInt(req.body?.subtotal_cents, 10) || 0;
    res.json(await validatePromo(req.body?.code, subtotal));
  } catch (err) {
    console.error('validate-promo error:', err.message);
    res.status(500).json({ valid: false, message: 'Could not validate code' });
  }
});

// POST /api/orders/one-off — public guest checkout for shop (one-off) orders.
router.post('/one-off', async (req, res) => {
  const { items, contact, shipping, card_token, promo_code } = req.body || {};

  if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ error: 'Your cart is empty' });
  if (!card_token) return res.status(400).json({ error: 'Missing payment details' });
  if (!contact?.email || !contact?.first_name) return res.status(400).json({ error: 'Missing contact details' });
  if (!shipping?.address_1 || !shipping?.suburb || !shipping?.postcode) {
    return res.status(400).json({ error: 'Missing shipping address' });
  }

  const priced = priceCart(items);
  if (priced.error) return res.status(400).json({ error: priced.error });
  const { subtotal, lineItems } = priced;
  const shipping_cents = subtotal >= FREE_SHIPPING_CENTS ? 0 : FLAT_SHIPPING_CENTS;

  // Discounts — take the better of the subscriber perk and any promo code (no stacking).
  let subscriberDiscount = 0;
  const bearer = (req.headers['authorization'] || '').split(' ')[1];
  if (bearer) {
    try {
      const decoded = jwt.verify(bearer, process.env.JWT_SECRET);
      if (decoded?.id) subscriberDiscount = Math.round(subtotal * SUBSCRIBER_DISCOUNT);
    } catch { /* not logged in — no perk */ }
  }
  let promo = { discount_cents: 0 };
  if (promo_code) promo = await validatePromo(promo_code, subtotal);
  const promoDiscount = promo.valid ? promo.discount_cents : 0;
  const usePromo = promoDiscount > 0 && promoDiscount >= subscriberDiscount;
  const discount_cents = Math.max(subscriberDiscount, promoDiscount);
  const appliedCode = usePromo ? promo.code : null;

  const amount_cents = Math.max(0, subtotal - discount_cents) + shipping_cents;

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

  // 2) Record the order (best-effort — card already charged; never fail here).
  const orderNumber = genOrderNumber();
  let orderId = null;
  try {
    const ins = await db.query(
      `INSERT INTO shop_orders (order_number, email, first_name, last_name, phone,
         shipping_address_1, shipping_suburb, shipping_state, shipping_postcode,
         items, subtotal_cents, shipping_cents, discount_cents, promo_code, amount_cents, square_payment_id, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,'paid')
       RETURNING id`,
      [orderNumber, contact.email, contact.first_name, contact.last_name || null, contact.phone || null,
        shipping.address_1, shipping.suburb, shipping.state || null, shipping.postcode,
        JSON.stringify(lineItems), subtotal, shipping_cents, discount_cents, appliedCode, amount_cents, paymentId],
    );
    orderId = ins.rows[0].id;
    if (usePromo) {
      await db.query('UPDATE promo_codes SET uses = uses + 1 WHERE upper(code) = $1', [appliedCode.toUpperCase()]);
    }
  } catch (err) {
    console.error('Payment captured but order insert failed:', err.message, 'payment:', paymentId);
  }

  return res.json({
    order_id: orderId,
    order_number: orderNumber,
    email: contact.email,
    first_name: contact.first_name,
    discount_cents,
    amount_cents,
    status: 'paid',
  });
});

module.exports = router;
