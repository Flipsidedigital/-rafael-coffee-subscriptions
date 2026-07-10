// Rafael's Coffee catalogue (E1). Names/prices/blends mirror the live shop at
// rafaelscoffee.com.au/shop. IDs match the backend PRODUCT_TYPES keys in
// backend/src/routes/subscriptions-create.js (onesto, ipanema, llaneros,
// calabrian, equinox, guatemala, peru, decaf) so orders/subscriptions line up.
// NOTE: tasting notes, blurbs and ratings are placeholder copy — confirm with
// the client. The core labels (name, blend %, price) are from the live site.

export const CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'coffee', label: 'Coffee' },
  { key: 'accessories', label: 'Accessories' },
  { key: 'classes', label: 'Classes' },
];

// Automatic discount applied for logged-in subscribers (see E5).
export const SUBSCRIBER_DISCOUNT = 0.1; // 10%

// Shipping (mirrored server-side in backend/src/routes/orders-oneoff.js).
export const FREE_SHIPPING_THRESHOLD = 60; // $ subtotal for free shipping
export const FLAT_SHIPPING = 10; // $ flat rate under the threshold

export function shippingFor(subtotal) {
  return subtotal <= 0 || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING;
}

// Each coffee is rendered as a designed "bag" — `accent` is the pack colour.
export const PRODUCTS = [
  {
    id: 'onesto',
    category: 'coffee',
    name: 'The Onesto',
    sub: '100% Arabica',
    weight: '250g',
    price: 18,
    accent: '#402020',
    rating: 4.9,
    reviews: 214,
    blurb: 'A smooth, balanced house blend — chocolate and caramel with a clean, lingering finish.',
    origin: 'Colombia · Mexico · Ethiopia · India Arabica',
    roast: 'Medium',
    notes: ['Milk chocolate', 'Caramel', 'Toasted almond'],
  },
  {
    id: 'ipanema',
    category: 'coffee',
    name: 'The Ipanema',
    sub: '100% Arabica',
    weight: '250g',
    price: 18,
    accent: '#9a4a2f',
    rating: 4.8,
    reviews: 168,
    blurb: 'Bright and juicy with a soft, syrupy body — our everyday crowd-pleaser.',
    origin: 'Brazil · Mexico · Sumatra',
    roast: 'Medium',
    notes: ['Red berry', 'Brown sugar', 'Citrus'],
  },
  {
    id: 'llaneros',
    category: 'coffee',
    name: 'The Llaneros',
    sub: '85% Arabica · 15% Robusta',
    weight: '250g',
    price: 18,
    accent: '#5c3a2e',
    rating: 4.8,
    reviews: 132,
    blurb: 'A bold, full-throttle blend with a thick crema — built for milk and busy mornings.',
    origin: 'Colombia · Brazil · PNG · India Robusta',
    roast: 'Medium-dark',
    notes: ['Dark chocolate', 'Molasses', 'Walnut'],
  },
  {
    id: 'calabrian',
    category: 'coffee',
    name: 'The Calabrian',
    sub: '80% Arabica · 20% Robusta',
    weight: '250g',
    price: 18,
    accent: '#6b4f2a',
    rating: 4.7,
    reviews: 118,
    blurb: 'Traditional Italian-style strength — intense, syrupy and unapologetically rich.',
    origin: 'Brazil · India Arabica · India Robusta',
    roast: 'Dark',
    notes: ['Cocoa', 'Roasted hazelnut', 'Baking spice'],
  },
  {
    id: 'equinox', // backend seasonal slot; display rotates with the season
    category: 'coffee',
    name: 'Old Man Winter',
    sub: '100% Arabica · Winter blend',
    weight: '250g',
    price: 18,
    accent: '#34424c',
    rating: 4.9,
    reviews: 74,
    blurb: 'Our limited winter seasonal — deep, warming and made for cold mornings by the fire.',
    origin: 'Seasonal winter blend',
    roast: 'Medium-dark',
    notes: ['Dark chocolate', 'Baked plum', 'Warm spice'],
  },
  {
    id: 'guatemala',
    category: 'coffee',
    name: 'Guatemala Antigua',
    sub: 'Single Origin',
    weight: '250g',
    price: 20,
    accent: '#38412f',
    rating: 4.9,
    reviews: 97,
    blurb: 'A classic Antigua profile — full-bodied and cocoa-rich with a gentle whisper of spice.',
    origin: 'Antigua, Guatemala',
    roast: 'Medium-dark',
    notes: ['Dark cocoa', 'Baking spice', 'Orange peel'],
  },
  {
    id: 'peru',
    category: 'coffee',
    name: 'Peru Aprocassi Organic',
    sub: 'Single Origin · Organic',
    weight: '250g',
    price: 20,
    accent: '#2f4738',
    rating: 4.8,
    reviews: 61,
    blurb: 'A certified-organic Peruvian single origin — clean, sweet and beautifully balanced.',
    origin: 'Aprocassi Co-op, Cajamarca, Peru',
    roast: 'Medium',
    notes: ['Caramel', 'Red apple', 'Almond'],
  },
  {
    id: 'decaf',
    category: 'coffee',
    name: 'Mexico Swiss Water® Process Organic Decaf',
    sub: 'Organic Decaf',
    weight: '250g',
    price: 20,
    accent: '#4a4640',
    rating: 4.7,
    reviews: 63,
    blurb: 'All of the flavour, none of the buzz — Swiss Water® decaffeinated and certified organic.',
    origin: 'Chiapas, Mexico',
    roast: 'Medium',
    notes: ['Hazelnut', 'Milk chocolate', 'Maple'],
  },

  // ── Accessories ──────────────────────────────────────────────────────────
  {
    id: 'airscape',
    category: 'accessories',
    name: 'Airscape® Coffee Canister',
    sub: 'Airtight storage',
    price: 55,
    image: '/products/airscape.jpg',
    fit: 'cover',
    rating: 4.9,
    reviews: 41,
    blurb: 'A patented plunger lid forces the air out and locks freshness in — keep your beans at their best for longer.',
  },
  {
    id: 'silicone',
    category: 'accessories',
    name: 'Silicone Storage Bags',
    sub: 'Reusable · food-grade',
    price: 5.95,
    fit: 'contain',
    rating: 4.7,
    reviews: 18,
    blurb: 'Durable, food-grade reusable bags — perfect for beans, snacks and leftovers. Kind on the planet, too.',
  },

  // ── Classes ──────────────────────────────────────────────────────────────
  {
    id: 'masterclass',
    category: 'classes',
    name: 'Coffee Masterclass',
    sub: 'At the roastery · ~2 hrs',
    price: 99,
    image: '/products/masterclass.jpg',
    fit: 'cover',
    rating: 5,
    reviews: 23,
    blurb: 'A hands-on session at our Lancefield roastery — dial in espresso, master milk texturing and brew like a pro.',
  },
];

const API_URL = 'https://rafael-coffee-subscriptions-production.up.railway.app';

// Fetch the live catalogue from the DB; returns null on any failure so callers
// fall back to the hardcoded PRODUCTS above (the shop can never go empty).
export async function fetchCatalog() {
  try {
    const res = await fetch(`${API_URL}/api/shop-products`);
    if (!res.ok) return null;
    const rows = await res.json();
    if (!Array.isArray(rows) || rows.length === 0) return null;
    return rows.map((r) => ({
      id: r.id,
      category: r.category,
      name: r.name,
      sub: r.sub || undefined,
      weight: r.weight || undefined,
      price: r.price_cents / 100,
      image: r.image || undefined,
      fit: r.fit || undefined,
      blurb: r.blurb || undefined,
      origin: r.origin || undefined,
      roast: r.roast || undefined,
      notes: Array.isArray(r.notes) ? r.notes : undefined,
      rating: r.rating != null ? Number(r.rating) : undefined,
      reviews: r.reviews != null ? Number(r.reviews) : undefined,
      featured: !!r.featured,
    }));
  } catch {
    return null;
  }
}

// Public site settings (announcement banner, etc.); {} on failure.
export async function fetchSettings() {
  try {
    const res = await fetch(`${API_URL}/api/site-settings`);
    if (!res.ok) return {};
    return await res.json();
  } catch {
    return {};
  }
}

export function getProduct(id) {
  return PRODUCTS.find((p) => p.id === id) || null;
}

export function formatPrice(value) {
  return `$${Number(value).toFixed(2)}`;
}

export function subscriberPrice(value) {
  return Math.round(value * (1 - SUBSCRIBER_DISCOUNT) * 100) / 100;
}
