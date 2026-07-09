const db = require('./index');

// Storefront catalogue (E-commerce). Keyed by slug (id) so it matches the cart,
// checkout pricing and frontend. Seeded from the original hardcoded catalogue so
// switching the shop to DB-driven is a no-op visually.
const CREATE = `
CREATE TABLE IF NOT EXISTS shop_products (
  id          VARCHAR(60) PRIMARY KEY,
  category    VARCHAR(20) NOT NULL DEFAULT 'coffee',
  name        VARCHAR(200) NOT NULL,
  sub         VARCHAR(200),
  weight      VARCHAR(40),
  price_cents INTEGER NOT NULL,
  image       VARCHAR(400),
  fit         VARCHAR(10) DEFAULT 'contain',
  blurb       TEXT,
  origin      VARCHAR(200),
  roast       VARCHAR(60),
  notes       JSONB,
  rating      NUMERIC(2,1),
  reviews     INTEGER,
  active      BOOLEAN NOT NULL DEFAULT TRUE,
  sort        INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
)`;

const SEED = [
  { id: 'onesto', category: 'coffee', name: 'The Onesto', sub: '100% Arabica', weight: '250g', price_cents: 1800, image: '/products/onesto.png', fit: 'contain', blurb: 'A smooth, balanced house blend — chocolate and caramel with a clean, lingering finish.', origin: 'Colombia · Mexico · Ethiopia · India Arabica', roast: 'Medium', notes: ['Milk chocolate', 'Caramel', 'Toasted almond'], rating: 4.9, reviews: 214 },
  { id: 'ipanema', category: 'coffee', name: 'The Ipanema', sub: '100% Arabica', weight: '250g', price_cents: 1800, image: '/products/ipanema.png', fit: 'contain', blurb: 'Bright and juicy with a soft, syrupy body — our everyday crowd-pleaser.', origin: 'Brazil · Mexico · Sumatra', roast: 'Medium', notes: ['Red berry', 'Brown sugar', 'Citrus'], rating: 4.8, reviews: 168 },
  { id: 'llaneros', category: 'coffee', name: 'The Llaneros', sub: '85% Arabica · 15% Robusta', weight: '250g', price_cents: 1800, image: '/products/llaneros.png', fit: 'contain', blurb: 'A bold, full-throttle blend with a thick crema — built for milk and busy mornings.', origin: 'Colombia · Brazil · PNG · India Robusta', roast: 'Medium-dark', notes: ['Dark chocolate', 'Molasses', 'Walnut'], rating: 4.8, reviews: 132 },
  { id: 'calabrian', category: 'coffee', name: 'The Calabrian', sub: '80% Arabica · 20% Robusta', weight: '250g', price_cents: 1800, image: '/products/calabrian.png', fit: 'contain', blurb: 'Traditional Italian-style strength — intense, syrupy and unapologetically rich.', origin: 'Brazil · India Arabica · India Robusta', roast: 'Dark', notes: ['Cocoa', 'Roasted hazelnut', 'Baking spice'], rating: 4.7, reviews: 118 },
  { id: 'equinox', category: 'coffee', name: 'Old Man Winter', sub: '100% Arabica · Winter blend', weight: '250g', price_cents: 1800, image: '/products/equinox.png', fit: 'contain', blurb: 'Our limited winter seasonal — deep, warming and made for cold mornings by the fire.', origin: 'Seasonal winter blend', roast: 'Medium-dark', notes: ['Dark chocolate', 'Baked plum', 'Warm spice'], rating: 4.9, reviews: 74 },
  { id: 'guatemala', category: 'coffee', name: 'Guatemala Antigua', sub: 'Single Origin', weight: '250g', price_cents: 2000, image: '/products/guatemala.png', fit: 'contain', blurb: 'A classic Antigua profile — full-bodied and cocoa-rich with a gentle whisper of spice.', origin: 'Antigua, Guatemala', roast: 'Medium-dark', notes: ['Dark cocoa', 'Baking spice', 'Orange peel'], rating: 4.9, reviews: 97 },
  { id: 'peru', category: 'coffee', name: 'Peru Aprocassi Organic', sub: 'Single Origin · Organic', weight: '250g', price_cents: 2000, image: '/products/peru.png', fit: 'contain', blurb: 'A certified-organic Peruvian single origin — clean, sweet and beautifully balanced.', origin: 'Aprocassi Co-op, Cajamarca, Peru', roast: 'Medium', notes: ['Caramel', 'Red apple', 'Almond'], rating: 4.8, reviews: 61 },
  { id: 'decaf', category: 'coffee', name: 'Mexico Swiss Water® Process Organic Decaf', sub: 'Organic Decaf', weight: '250g', price_cents: 2000, image: '/products/decaf.png', fit: 'contain', blurb: 'All of the flavour, none of the buzz — Swiss Water® decaffeinated and certified organic.', origin: 'Chiapas, Mexico', roast: 'Medium', notes: ['Hazelnut', 'Milk chocolate', 'Maple'], rating: 4.7, reviews: 63 },
  { id: 'airscape', category: 'accessories', name: 'Airscape® Coffee Canister', sub: 'Airtight storage', weight: null, price_cents: 5500, image: '/products/airscape.jpg', fit: 'cover', blurb: 'A patented plunger lid forces the air out and locks freshness in — keep your beans at their best for longer.', origin: null, roast: null, notes: null, rating: 4.9, reviews: 41 },
  { id: 'silicone', category: 'accessories', name: 'Silicone Storage Bags', sub: 'Reusable · food-grade', weight: null, price_cents: 595, image: '/products/silicone.png', fit: 'contain', blurb: 'Durable, food-grade reusable bags — perfect for beans, snacks and leftovers. Kind on the planet, too.', origin: null, roast: null, notes: null, rating: 4.7, reviews: 18 },
  { id: 'masterclass', category: 'classes', name: 'Coffee Masterclass', sub: 'At the roastery · ~2 hrs', weight: null, price_cents: 9900, image: '/products/masterclass.jpg', fit: 'cover', blurb: 'A hands-on session at our Lancefield roastery — dial in espresso, master milk texturing and brew like a pro.', origin: null, roast: null, notes: null, rating: 5, reviews: 23 },
];

module.exports = async function ensureShopProducts() {
  try {
    await db.query(CREATE);
    const { rows } = await db.query('SELECT COUNT(*) FROM shop_products');
    if (parseInt(rows[0].count, 10) === 0) {
      for (let i = 0; i < SEED.length; i++) {
        const p = SEED[i];
        await db.query(
          `INSERT INTO shop_products (id, category, name, sub, weight, price_cents, image, fit, blurb, origin, roast, notes, rating, reviews, active, sort)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,TRUE,$15)`,
          [p.id, p.category, p.name, p.sub, p.weight, p.price_cents, p.image, p.fit, p.blurb, p.origin, p.roast, p.notes ? JSON.stringify(p.notes) : null, p.rating, p.reviews, i]
        );
      }
      console.log(`shop_products seeded (${SEED.length})`);
    }
    console.log('shop_products ready');
  } catch (err) {
    console.error('ensure shop_products error:', err.message);
  }
};
