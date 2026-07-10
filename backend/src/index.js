require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const app = express();
app.set("trust proxy", 1);
const PORT = process.env.PORT || 3001;

// ── Security Middleware ──────────────────────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  }),
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
});
app.use("/api/", limiter);

// ── Body Parsing ─────────────────────────────────────────────────────────────
// Raw body needed for Square webhook signature verification
app.use("/webhooks", express.raw({ type: "application/json" }));
app.use(express.json());

// ── Health Check ─────────────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "rafael-coffee-api",
    timestamp: new Date().toISOString(),
  });
});

// ── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/auth", require("./routes/auth"));
app.use("/api/subscriptions", require("./routes/subscriptions"));
app.use("/api/subscriptions", require("./routes/subscriptions-create"));
app.use("/api/products", require("./routes/products"));
app.use("/api/shop-products", require("./routes/shop-products")); // public storefront catalogue
app.use("/api/site-settings", require("./routes/settings")); // public site settings (announcement etc.)
app.use("/api/categories", require("./routes/categories")); // public product categories
app.use("/api/orders", require("./routes/orders-oneoff")); // public guest checkout — must precede the auth-protected orders router
app.use("/api/orders", require("./routes/orders"));
app.use("/api/classes", require("./routes/classes"));
app.use("/api/portal", require("./routes/portal"));
app.use("/webhooks/square", require("./webhooks/square"));
const { router: adminRouter } = require("./routes/admin-dashboard");
app.use("/api/admin", adminRouter);

// ── 404 Handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// ── Error Handler ─────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal server error" });
});

// ── Start ─────────────────────────────────────────────────────────────────────
require("./db/ensure-shop-orders")(); // shop_orders + promo_codes (no migration runner)
require("./db/ensure-classes")(); // class_sessions + class_bookings
require("./db/ensure-shop-products")(); // storefront catalogue (seeded from the original list)
require("./db/ensure-settings")(); // site_settings (announcement banner etc.)
require("./db/ensure-categories")(); // product_categories (seeded coffee/accessories/classes)

app.listen(PORT, () => {
  console.log(`Rafael Coffee API running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
});
