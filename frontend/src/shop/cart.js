// Minimal localStorage cart. E1 only needs add + count so the "Add to Cart"
// buttons are functional; E2 (Cart & Checkout) will build the full drawer on top.

const KEY = 'rafael_cart';

export function getCart() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function save(items) {
  localStorage.setItem(KEY, JSON.stringify(items));
  // Let any listening UI (cart badge/drawer) react.
  window.dispatchEvent(new CustomEvent('cart:change', { detail: items }));
}

export function addToCart(product, qty = 1) {
  const items = getCart();
  const existing = items.find((i) => i.id === product.id);
  if (existing) {
    existing.qty += qty;
  } else {
    items.push({
      id: product.id,
      name: product.name,
      price: product.price,
      weight: product.weight || null,
      qty,
    });
  }
  save(items);
  return items;
}

export function cartCount() {
  return getCart().reduce((n, i) => n + i.qty, 0);
}

// True if a subscriber is logged into the portal (drives the subscriber discount).
export function isSubscriber() {
  try {
    const raw = localStorage.getItem('portal_auth');
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return Boolean(parsed && parsed.token);
  } catch {
    return false;
  }
}
