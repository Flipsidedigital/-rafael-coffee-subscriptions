import { useState, useEffect } from 'react';
import { getCart, setQty, removeFromCart } from './cart';
import { formatPrice, FREE_SHIPPING_THRESHOLD, shippingFor } from './products';
import { BTN_PRIMARY } from './ui';

// Slide-in cart drawer. Controlled by `open`; syncs with localStorage cart.
export default function CartDrawer({ open, onClose, navigate }) {
  const [items, setItems] = useState(getCart());

  useEffect(() => {
    const sync = () => setItems(getCart());
    window.addEventListener('cart:change', sync);
    return () => window.removeEventListener('cart:change', sync);
  }, []);

  // Lock body scroll while open.
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const shipping = shippingFor(subtotal);
  const total = subtotal + shipping;
  const awayFromFree = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);

  return (
    <div className={'shop-root fixed inset-0 z-50 ' + (open ? '' : 'pointer-events-none')} aria-hidden={!open}>
      {/* overlay */}
      <div
        onClick={onClose}
        className={'absolute inset-0 bg-black/40 transition-opacity duration-300 ' + (open ? 'opacity-100' : 'opacity-0')}
      />
      {/* panel */}
      <aside
        className={
          'absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-cream shadow-2xl transition-transform duration-300 ' +
          (open ? 'translate-x-0' : 'translate-x-full')
        }
        role="dialog"
        aria-label="Shopping cart"
      >
        <header className="flex items-center justify-between border-b border-maroon/10 px-5 py-4">
          <h2 className="font-heading text-sm font-semibold uppercase tracking-[0.2em] text-maroon">
            Your cart {items.length > 0 && <span className="text-mid">({items.reduce((n, i) => n + i.qty, 0)})</span>}
          </h2>
          <button onClick={onClose} aria-label="Close cart" className="text-2xl leading-none text-mid transition hover:text-maroon">×</button>
        </header>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <p className="font-heading text-lg font-semibold uppercase tracking-wide text-maroon">Your cart is empty</p>
            <p className="mt-2 text-sm text-mid">Add some freshly roasted coffee to get started.</p>
            <button onClick={onClose} className={BTN_PRIMARY + ' mt-6'}>Browse coffee</button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {subtotal < FREE_SHIPPING_THRESHOLD && (
                <p className="mb-4 rounded-lg bg-maroon/5 px-4 py-2.5 text-center text-xs text-maroon">
                  You're <strong>{formatPrice(awayFromFree)}</strong> away from free shipping ☕
                </p>
              )}
              <ul className="space-y-4">
                {items.map((i) => (
                  <li key={i.id} className="flex gap-3">
                    <div className="h-20 w-16 shrink-0 overflow-hidden rounded-lg border border-black/5 bg-white p-1">
                      <img src={`/products/${i.id}.png`} alt={i.name} className="h-full w-full object-contain" />
                    </div>
                    <div className="flex flex-1 flex-col">
                      <p className="font-heading text-xs font-semibold uppercase leading-snug tracking-[0.02em] text-maroon">{i.name}</p>
                      {i.weight && <p className="text-[11px] text-mid">{i.weight}</p>}
                      <div className="mt-auto flex items-center justify-between">
                        <div className="inline-flex items-center rounded-full border border-maroon/20">
                          <button onClick={() => setQty(i.id, i.qty - 1)} aria-label="Decrease quantity" className="px-2.5 py-1 text-maroon transition hover:bg-maroon/5">−</button>
                          <span className="min-w-6 text-center text-sm text-ink">{i.qty}</span>
                          <button onClick={() => setQty(i.id, i.qty + 1)} aria-label="Increase quantity" className="px-2.5 py-1 text-maroon transition hover:bg-maroon/5">+</button>
                        </div>
                        <span className="font-heading text-sm font-bold text-maroon">{formatPrice(i.price * i.qty)}</span>
                      </div>
                    </div>
                    <button onClick={() => removeFromCart(i.id)} aria-label={`Remove ${i.name}`} className="self-start text-mid transition hover:text-maroon">×</button>
                  </li>
                ))}
              </ul>
            </div>

            <footer className="border-t border-maroon/10 px-5 py-4">
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between text-mid"><span>Subtotal</span><span className="text-ink">{formatPrice(subtotal)}</span></div>
                <div className="flex justify-between text-mid"><span>Shipping</span><span className="text-ink">{shipping === 0 ? 'Free' : formatPrice(shipping)}</span></div>
                <div className="flex justify-between border-t border-maroon/10 pt-2 font-heading text-base font-bold text-maroon"><span>Total</span><span>{formatPrice(total)}</span></div>
              </div>
              <button
                onClick={() => { onClose(); navigate('/shop/checkout'); }}
                className={BTN_PRIMARY + ' mt-4 w-full'}
              >
                Checkout
              </button>
              <button onClick={onClose} className="mt-2 w-full py-2 font-heading text-xs font-semibold uppercase tracking-wider text-mid transition hover:text-maroon">
                Continue shopping
              </button>
            </footer>
          </>
        )}
      </aside>
    </div>
  );
}
