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

// Each coffee is rendered as a designed "bag" — `accent` is the pack colour.
export const PRODUCTS = [
  {
    id: 'onesto',
    category: 'coffee',
    name: 'The Onesto',
    sub: '100% Arabica',
    weight: '250g',
    price: 18,
    accent: '#402020', // deep maroon
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
    accent: '#9a4a2f', // terracotta
    rating: 4.8,
    reviews: 168,
    blurb: 'Bright and juicy with a soft, syrupy body — our everyday crowd-pleaser.',
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
    accent: '#38412f', // deep olive
    rating: 4.9,
    reviews: 97,
    blurb: 'A classic Antigua profile — full-bodied and cocoa-rich with a gentle whisper of spice.',
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
    accent: '#33404a', // slate
    rating: 4.7,
    reviews: 63,
    blurb: 'All of the flavour, none of the buzz — sweet, nutty and quietly comforting.',
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
