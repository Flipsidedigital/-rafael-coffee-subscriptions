const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const squareClient = require('../config/square');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();

const FREQUENCY_MAP = {
  'fortnightly':  'EVERY_TWO_WEEKS',
  'three-weekly': 'EVERY_28_DAYS',
  'monthly':      'MONTHLY',
};

const PRICING = {
  blend:  { 250: 1800, 500: 3000, 1000: 5500 },
  single: { 250: 2000, 500: 3500, 1000: 6000 },
  decaf:  { 250: 2000, 500: 3500, 1000: 6000 },
};

const PRODUCT_TYPES = {
  onesto: 'blend', ipanema: 'blend', llaneros: 'blend',
  calabrian: 'blend', equinox: 'blend',
  guatemala: 'single', peru: 'single',
  decaf: 'decaf',
};

router.post('/create', authMiddleware, async (req, res) => {
  const { product_id, frequency, quantity_grams, card_token, shipping_name, shipping_address_1, shipping_suburb, shipping_state, shipping_postcode } = req.body;

  if (!product_id || !frequency || !quantity_grams || !card_token) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const cadence = FREQUENCY_MAP[frequency];
  if (!cadence) return res.status(400).json({ error: 'Invalid frequency' });

  const productType = PRODUCT_TYPES[product_id];
  if (!productType) return res.status(400).json({ error: 'Invalid product' });

  const priceCents = PRICING[productType] && PRICING[productType][quantity_grams];
  if (!priceCents) return res.status(400).json({ error: 'Invalid quantity' });

  try {
    const custRow = await db.query('SELECT * FROM customers WHERE id = $1', [req.customer.id]);
    const customer = custRow.rows[0];
    if (!customer) return res.status(404).json({ error: 'Customer not found' });

    let squareCustomerId = customer.square_customer_id;

    if (!squareCustomerId) {
      const { result } = await squareClient.customersApi.createCustomer({
        idempotencyKey: uuidv4(),
        givenName: customer.first_name,
        familyName: customer.last_name,
        emailAddress: customer.email,
      });
      squareCustomerId = result.customer.id;
      await db.query('UPDATE customers SET square_customer_id = $1 WHERE id = $2', [squareCustomerId, customer.id]);
    }

    const { result: cardResult } = await squareClient.cardsApi.createCard({
      idempotencyKey: uuidv4(),
      sourceId: card_token,
      card: { customerId: squareCustomerId },
    });
    const cardId = cardResult.card.id;

    const planName = 'Rafael Coffee ' + product_id + ' ' + quantity_grams + 'g ' + frequency;
    const { result: catalogResult } = await squareClient.catalogApi.upsertCatalogObject({
      idempotencyKey: uuidv4(),
      object: {
        type: 'SUBSCRIPTION_PLAN',
        id: '#plan_' + product_id + '_' + quantity_grams + '_' + frequency,
        subscriptionPlanData: {
          name: planName,
          phases: [{
            cadence: cadence,
            pricing: {
              type: 'STATIC',
              priceMoney: { amount: priceCents, currency: 'AUD' },
            },
          }],
        },
      },
    });

    const planId = catalogResult.catalogObject.id;
    const phaseUid = catalogResult.catalogObject.subscriptionPlanData.phases[0].uid;

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const startDate = tomorrow.toISOString().split('T')[0];

    const { result: subResult } = await squareClient.subscriptionsApi.createSubscription({
      idempotencyKey: uuidv4(),
      locationId: process.env.SQUARE_LOCATION_ID,
      planId: planId,
      planVariationId: phaseUid,
      customerId: squareCustomerId,
      startDate: startDate,
      cardId: cardId,
      timezone: 'Australia/Melbourne',
    });

    const squareSub = subResult.subscription;

    let productRow = await db.query('SELECT id FROM products WHERE name = $1', [product_id]);
    let productDbId;
    if (productRow.rows.length === 0) {
      const ins = await db.query('INSERT INTO products (name, roast_level, active) VALUES ($1, $2, TRUE) RETURNING id', [product_id, productType]);
      productDbId = ins.rows[0].id;
    } else {
      productDbId = productRow.rows[0].id;
    }

    await db.query(
      'INSERT INTO subscriptions (customer_id, product_id, square_subscription_id, square_plan_id, status, frequency, quantity_grams, shipping_name, shipping_address_1, shipping_suburb, shipping_state, shipping_postcode) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)',
      [customer.id, productDbId, squareSub.id, planId, 'active', frequency, quantity_grams, shipping_name, shipping_address_1, shipping_suburb, shipping_state, shipping_postcode]
    );

    res.status(201).json({ success: true, subscription_id: squareSub.id });

  } catch (err) {
    console.error('Subscription creation error:', err);
    if (err.errors) return res.status(400).json({ error: err.errors.map(function(e) { return e.detail; }).join(', ') });
    res.status(500).json({ error: 'Failed to create subscription' });
  }
});

module.exports = router;

