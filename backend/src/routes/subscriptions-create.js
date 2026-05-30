const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const squareClient = require('../config/square');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();

const FREQUENCY_MAP = {
  'fortnightly':  { cadence: 'EVERY_TWO_WEEKS' },
  'three-weekly': { cadence: 'EVERY_28_DAYS' },
  'monthly':      { cadence: 'MONTHLY' },
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
    return res.status(400).json({ error: 'Missin
cat > ~/Documents/-rafael-coffee-subscriptions/backend/src/routes/subscriptions-create.js << 'EOF'
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const squareClient = require('../config/square');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();

const FREQUENCY_MAP = {
  'fortnightly':  { cadence: 'EVERY_TWO_WEEKS' },
  'three-weekly': { cadence: 'EVERY_28_DAYS' },
  'monthly':      { cadence: 'MONTHLY' },
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

  const cadence = FREQUENCY_MAP[frequency]?.cadence;
  if (!cadence) return res.status(400).json({ error: 'Invalid frequency' });

  const productType = PRODUCT_TYPES[product_id];
  if (!productType) return res.status(400).json({ error: 'Invalid product' });

  const priceCents = PRICING[productType]?.[quantity_grams];
  if (!priceCents) return res.status(400).json({ error: 'Invalid quantity' });

  try {
    const customerResult = await db.query('SELECT * FROM customers WHERE id = $1', [req.customer.id]);
    const customer = customerResult.rows[0];
    if (!customer) return res.status(404).json({ error: 'Customer not found' });

    const { customersApi, subscriptionsApi, catalogApi } = squareClient;
    let squareCustomerId = customer.square_customer_id;

    if (!squareCustomerId) {
      const { result } = await customersApi.createCustomer({
        idempotencyKey: uuidv4(),
        givenName: customer.first_name,
        familyName: customer.last_name,
        emailAddress: customer.email,
        phoneNumber: customer.phone || undefined,
      });
      squareCustomerId = result.customer.id;
      await db.query('UPDATE customers SET square_customer_id = $1 WHERE id = $2', [squareCustomerId, customer.id]);
    }

    const { result: cardResult } = await squareClient.cardsApi.createCard({
      idempotencyKey: uuidv4(),
      sourceId: card_token,
      card: {
        customerId: squareCustomerId,
        billingAddress: {
          addressLine1: shipping_address_1,
          locality: shipping_suburb,
          administrativeDistrictLevel1: shipping_state,
          postalCode: shipping_postcode,
          country: 'AU',
        },
      },
    });
    const cardId = cardResult.card.id;

    const { result: catalogResult } = await catalogApi.upsertCatalogObject({
      idempotencyKey: uuidv4(),
      object: {
        type: 'SUBSCRIPTION_PLAN',
        id: `#${product_id}_${quantity_grams}_${frequency}`,
        subscriptionPlanData: {
          name: `Rafael Coffee - ${product_id} ${quantity_grams}g ${frequency}`,
          phases: [{
            cadence,
            pricing: {
              type: 'STATIC',
              priceMoney: { amount: BigInt(priceCents), currency: 'AUD' },
            },
          }],
        },
      },
    });

    const planId = catalogResult.catalogObject.id;
    const phaseUid = catalogResult.catalogObject.subscriptionPlanData.phases[0].uid;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 1);
    const startDateStr = startDate.toISOString().split('T')[0];

    const { result: subResult } = await subscriptionsApi.createSubscription({
      idempotencyKey: uuidv4(),
      locationId: process.env.SQUARE_LOCATION_ID,
      planId,
      planVariationId: phaseUid,
      customerId: squareCustomerId,
      startDate: startDateStr,
      cardId,
      timezone: 'Australia/Melbourne',
    });

    const squareSubscription = subResult.subscription;

    let productDbResult = await db.query('SELECT id FROM products WHERE name = $1', [product_id]);
    let productDbId;
    if (productDbResult.rows.length === 0) {
      const ins = await db.query('INSERT INTO products (name, roast_level, active) VALUES ($1,$2,TRUE) RETURNING id', [product_id, productType]);
      productDbId = ins.rows[0].id;
    } else {
      productDbId = productDbResult.rows[0].id;
    }

    await db.query(
      `INSERT INTO subscriptions (customer_id, product_id, square_subscription_id, square_plan_id, status, frequency, quantity_grams, shipping_name, shipping_address_1, shipping_suburb, shipping_state, shipping_postcode)
       VALUES ($1,$2,$3,$4,'active',$5,$6,$7,$8,$9,$10,$11)`,
      [customer.id, productDbId, squareSubscription.id, planId, frequency, quantity_grams, shipping_name, shipping_address_1, shipping_suburb, shipping_state, shipping_postcode]
    );

    res.status(201).json({ success: true, subscription_id: squareSubscription.id });

  } catch (err) {
    console.error('Subscription creation error:', err);
    if (err.errors) return res.status(400).json({ error: err.errors.map(e => e.detail).join(', ') });
    res.status(500).json({ error: 'Failed to create subscription' });
  }
});

module.exports = router;
