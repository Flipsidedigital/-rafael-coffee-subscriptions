const express = require("express");
const crypto = require("crypto");
const { v4: uuidv4 } = require("uuid");
const db = require("../db");
const { authMiddleware } = require("../middleware/auth");
const jwt = require("jsonwebtoken");
const router = express.Router();

// Placeholder email sender - swap for FlipSend when ready
async function sendMagicLinkEmail(email, magicLink) {
  // TODO: Replace with FlipSend API call
  console.log("=== MAGIC LINK EMAIL ===");
  console.log("To:", email);
  console.log("Link:", magicLink);
  console.log("========================");
  // When FlipSend is ready:
  // await fetch('https://api.flipsend.com.au/send', {
  //   method: 'POST',
  //   headers: { 'Authorization': `Bearer ${process.env.FLIPSEND_API_KEY}` },
  //   body: JSON.stringify({
  //     to: email,
  //     subject: "Your Rafael's Coffee portal link",
  //     html: `<p>Click here to access your subscription portal:</p><a href="${magicLink}">${magicLink}</a>`
  //   })
  // });
}

// POST /api/portal/request-link
// Customer enters email, we send a magic link
router.post("/request-link", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email required" });

  try {
    const result = await db.query(
      "SELECT id, email, first_name FROM customers WHERE email = $1",
      [email.toLowerCase().trim()],
    );

    // Always return success to prevent email enumeration
    if (result.rows.length === 0) {
      return res.json({
        success: true,
        message: "If an account exists, a link has been sent.",
      });
    }

    const customer = result.rows[0];

    // Generate secure token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    // Store token
    await db.query(
      `INSERT INTO magic_links (customer_id, token, expires_at)
       VALUES ($1, $2, $3)`,
      [customer.id, token, expiresAt],
    );

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const magicLink = `${frontendUrl}/portal?token=${token}`;

    await sendMagicLinkEmail(customer.email, magicLink);

    res.json({
      success: true,
      message: "If an account exists, a link has been sent.",
    });
  } catch (err) {
    console.error("Magic link error:", err);
    res.status(500).json({ error: "Failed to send link" });
  }
});

// POST /api/portal/verify-token
// Customer clicks magic link, we verify and return JWT
router.post("/verify-token", async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: "Token required" });

  try {
    const result = await db.query(
      `SELECT ml.*, c.email, c.first_name, c.last_name
       FROM magic_links ml
       JOIN customers c ON c.id = ml.customer_id
       WHERE ml.token = $1 AND ml.used = FALSE AND ml.expires_at > NOW()`,
      [token],
    );

    if (result.rows.length === 0) {
      return res
        .status(401)
        .json({ error: "Invalid or expired link. Please request a new one." });
    }

    const link = result.rows[0];

    // Mark token as used
    await db.query("UPDATE magic_links SET used = TRUE WHERE id = $1", [
      link.id,
    ]);

    // Issue JWT
    const jwtToken = jwt.sign(
      { id: link.customer_id, email: link.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.json({
      token: jwtToken,
      customer: {
        id: link.customer_id,
        email: link.email,
        first_name: link.first_name,
        last_name: link.last_name,
      },
    });
  } catch (err) {
    console.error("Token verify error:", err);
    res.status(500).json({ error: "Failed to verify link" });
  }
});

// GET /api/portal/me
// Get customer's subscription and order details
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const subscriptions = await db.query(
      `SELECT s.*, p.name as product_name, p.roast_level, p.origin, p.description
       FROM subscriptions s
       JOIN products p ON p.id = s.product_id
       WHERE s.customer_id = $1
       ORDER BY s.created_at DESC`,
      [req.customer.id],
    );

    const orders = await db.query(
      `SELECT o.*, p.name as product_name
       FROM orders o
       JOIN subscriptions s ON s.id = o.subscription_id
       JOIN products p ON p.id = s.product_id
       WHERE o.customer_id = $1
       ORDER BY o.created_at DESC
       LIMIT 10`,
      [req.customer.id],
    );

    const customer = await db.query(
      "SELECT id, email, first_name, last_name, phone, created_at FROM customers WHERE id = $1",
      [req.customer.id],
    );

    res.json({
      customer: customer.rows[0],
      subscriptions: subscriptions.rows,
      orders: orders.rows,
    });
  } catch (err) {
    console.error("Portal me error:", err);
    res.status(500).json({ error: "Failed to load portal data" });
  }
});

// PATCH /api/portal/address
// Update shipping address
router.patch("/address", authMiddleware, async (req, res) => {
  const {
    subscription_id,
    shipping_address_1,
    shipping_suburb,
    shipping_state,
    shipping_postcode,
  } = req.body;

  try {
    const result = await db.query(
      `UPDATE subscriptions
       SET shipping_address_1 = $1, shipping_suburb = $2, shipping_state = $3, shipping_postcode = $4, updated_at = NOW()
       WHERE id = $5 AND customer_id = $6
       RETURNING *`,
      [
        shipping_address_1,
        shipping_suburb,
        shipping_state,
        shipping_postcode,
        subscription_id,
        req.customer.id,
      ],
    );

    if (result.rows.length === 0)
      return res.status(404).json({ error: "Subscription not found" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Address update error:", err);
    res.status(500).json({ error: "Failed to update address" });
  }
});

// POST /api/portal/pause
router.post("/pause", authMiddleware, async (req, res) => {
  const { subscription_id, pause_until } = req.body;

  try {
    const result = await db.query(
      `UPDATE subscriptions SET status = 'paused', pause_until = $1, updated_at = NOW()
       WHERE id = $2 AND customer_id = $3 RETURNING *`,
      [pause_until, subscription_id, req.customer.id],
    );

    if (result.rows.length === 0)
      return res.status(404).json({ error: "Subscription not found" });

    // TODO: Pause in Square Subscriptions API
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Pause error:", err);
    res.status(500).json({ error: "Failed to pause subscription" });
  }
});

// POST /api/portal/resume
router.post("/resume", authMiddleware, async (req, res) => {
  const { subscription_id } = req.body;

  try {
    const result = await db.query(
      `UPDATE subscriptions SET status = 'active', pause_until = NULL, updated_at = NOW()
       WHERE id = $1 AND customer_id = $2 RETURNING *`,
      [subscription_id, req.customer.id],
    );

    if (result.rows.length === 0)
      return res.status(404).json({ error: "Subscription not found" });

    // TODO: Resume in Square Subscriptions API
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Resume error:", err);
    res.status(500).json({ error: "Failed to resume subscription" });
  }
});

// POST /api/portal/skip
router.post("/skip", authMiddleware, async (req, res) => {
  const { subscription_id } = req.body;

  try {
    // TODO: Skip next delivery in Square Subscriptions API
    res.json({ success: true, message: "Next delivery skipped" });
  } catch (err) {
    console.error("Skip error:", err);
    res.status(500).json({ error: "Failed to skip delivery" });
  }
});

// PATCH /api/portal/coffee
// Swap coffee selection
router.patch("/coffee", authMiddleware, async (req, res) => {
  const { subscription_id, product_id } = req.body;

  try {
    const productRow = await db.query(
      `INSERT INTO products (name, roast_level, active) VALUES ($1, 'blend', TRUE)
   ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
   RETURNING id`,
      [product_id],
    );

    const result = await db.query(
      `UPDATE subscriptions SET product_id = $1, updated_at = NOW()
       WHERE id = $2 AND customer_id = $3 RETURNING *`,
      [productRow.rows[0].id, subscription_id, req.customer.id],
    );

    if (result.rows.length === 0)
      return res.status(404).json({ error: "Subscription not found" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Coffee swap error:", err);
    res.status(500).json({ error: "Failed to swap coffee" });
  }
});

// POST /api/portal/cancel
router.post("/cancel", authMiddleware, async (req, res) => {
  const { subscription_id } = req.body;

  try {
    const result = await db.query(
      `UPDATE subscriptions SET status = 'cancelled', cancelled_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND customer_id = $2 RETURNING *`,
      [subscription_id, req.customer.id],
    );

    if (result.rows.length === 0)
      return res.status(404).json({ error: "Subscription not found" });

    // TODO: Cancel in Square Subscriptions API
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Cancel error:", err);
    res.status(500).json({ error: "Failed to cancel subscription" });
  }
});

module.exports = router;
