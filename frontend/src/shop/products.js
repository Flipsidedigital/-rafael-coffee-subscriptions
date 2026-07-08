// Sample catalogue for the shop (E1). Backed by hardcoded data for now;
// swap for GET /api/products / a shop catalogue endpoint when the backend lands.

export const CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'coffee', label: 'Coffee' },
  { key: 'accessories', label: 'Accessories' },
  { key: 'classes', label: 'Classes' },
];

// Automatic discount applied for logged-in subscribers (see E5).
export const SUBSCRIBER_DISCOUNT = 0.1; // 10%

export const PRODUCTS = [
  {
    id: 'onesto',
    category: 'coffee',
    name: 'The Onesto',
    sub: '100% Arabica',
    weight: '250g',
    price: 18,
    blurb: 'A smooth, balanced house blend — chocolate and caramel with a clean finish.',
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
    blurb: 'Bright and juicy with a soft body — our everyday crowd-pleaser.',
    origin: 'Brazil · Mexico · Sumatra',
    roast: 'Medium',
    notes: ['Red berry', 'Brown sugar', 'Citrus'],
  },
  {
    id: 'guatemala-antigua',
    category: 'coffee',
    name: 'Guatemala Antigua',
    sub: 'Single Origin',
    weight: '250g',
    price: 20,
    blurb: 'A classic Antigua profile — full-bodied, cocoa-rich with gentle spice.',
    origin: 'Antigua, Guatemala',
    roast: 'Medium-dark',
    notes: ['Dark cocoa', 'Baking spice', 'Orange peel'],
  },
  {
    id: 'mexico-decaf',
    category: 'coffee',
    name: 'Mexico Decaf',
    sub: 'Swiss Water Decaf',
    weight: '250g',
    price: 20,
    blurb: 'All of the flavour, none of the buzz — sweet, nutty and comforting.',
    origin: 'Chiapas, Mexico',
    roast: 'Medium',
    notes: ['Hazelnut', 'Milk chocolate', 'Maple'],
  },
];

export function getProduct(id) {
  return PRODUCTS.find((p) => p.id === id) || null;
}

export function formatPrice(value) {
  return `$${Number(value).toFixed(2)}`;
}

export function subscriberPrice(value) {
  return Math.round(value * (1 - SUBSCRIBER_DISCOUNT) * 100) / 100;
}
