import { useState, useEffect, useRef } from 'react';
import { getCart, clearCart } from './cart';
import { formatPrice, shippingFor, getProduct } from './products';
import { Eyebrow, BTN_PRIMARY, BTN_OUTLINE, FIELD, LABEL } from './ui';

const API_URL = 'https://rafael-coffee-subscriptions-production.up.railway.app';
const SQUARE_APP_ID = import.meta.env.VITE_SQUARE_APPLICATION_ID || '';
const SQUARE_LOCATION_ID = import.meta.env.VITE_SQUARE_LOCATION_ID || '';

function loadSquareScript() {
  return new Promise((resolve, reject) => {
    if (window.Square) return resolve();
    const existing = document.querySelector('script[src*="squarecdn"]');
    if (existing) { existing.onload = resolve; return; }
    const s = document.createElement('script');
    s.src = 'https://sandbox.web.squarecdn.com/v1/square.js';
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

export default function Checkout({ navigate }) {
  const [items] = useState(getCart());
  const [details, setDetails] = useState({
    email: '', firstName: '', lastName: '', phone: '',
    address1: '', suburb: '', state: 'VIC', postcode: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [order, setOrder] = useState(null);
  const [cardReady, setCardReady] = useState(false);
  const [cardError, setCardError] = useState(null);
  const cardRef = useRef(null);
  const attachedRef = useRef(false);

  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const shipping = shippingFor(subtotal);
  const total = subtotal + shipping;
  const canPay =
    details.email && details.firstName && details.lastName &&
    details.address1 && details.suburb && details.postcode;

  useEffect(() => {
    if (order || items.length === 0 || attachedRef.current) return;
    (async () => {
      try {
        await loadSquareScript();
        if (!window.Square) throw new Error('Square not loaded');
        const payments = window.Square.payments(SQUARE_APP_ID, SQUARE_LOCATION_ID);
        const card = await payments.card();
        await card.attach('#sq-card-checkout');
        cardRef.current = card;
        attachedRef.current = true;
        setCardReady(true);
      } catch (err) {
        console.error('Square error:', err);
        setCardError('Unable to load the payment form. Please refresh and try again.');
      }
    })();
  }, [order, items.length]);

  async function pay() {
    setSubmitting(true);
    setError(null);
    try {
      if (!cardRef.current) throw new Error('Payment form not ready');
      const result = await cardRef.current.tokenize();
      if (result.status !== 'OK') {
        throw new Error(result.errors?.map((e) => e.message).join(', ') || 'Card error');
      }
      const res = await fetch(`${API_URL}/api/orders/one-off`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((i) => ({ id: i.id, qty: i.qty })),
          contact: {
            email: details.email,
            first_name: details.firstName,
            last_name: details.lastName,
            phone: details.phone || null,
          },
          shipping: {
            address_1: details.address1,
            suburb: details.suburb,
            state: details.state,
            postcode: details.postcode,
          },
          card_token: result.token,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Payment failed. Please try again.');
      clearCart();
      setOrder(data);
      window.scrollTo({ top: 0 });
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  /* ----------------------------------------------------------- confirmation */
  if (order) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-maroon text-3xl text-cream">✓</div>
        <Eyebrow className="mt-6">Order confirmed</Eyebrow>
        <h1 className="mt-3 font-heading text-3xl font-bold uppercase tracking-[0.02em] text-maroon sm:text-4xl">
          Thank you{order.first_name ? `, ${order.first_name}` : ''}!
        </h1>
        <p className="mt-4 text-ink/75">
          Your order <strong className="text-maroon">#{order.order_number || order.order_id?.slice(0, 8)}</strong> is in.
          We roast to order every Thursday — you'll get a confirmation at{' '}
          <strong className="text-maroon">{order.email}</strong>.
        </p>
        <p className="mt-2 text-sm text-mid">Total charged: {formatPrice((order.amount_cents || 0) / 100)}</p>
        <button onClick={() => navigate('/shop')} className={BTN_PRIMARY + ' mt-8'}>Back to the shop</button>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6">
        <h1 className="font-heading text-2xl font-bold uppercase tracking-[0.02em] text-maroon">Your cart is empty</h1>
        <button onClick={() => navigate('/shop')} className={BTN_PRIMARY + ' mt-6'}>Browse coffee</button>
      </main>
    );
  }

  /* --------------------------------------------------------------- checkout */
  return (
    <main className="mx-auto max-w-6xl px-4 pb-24 pt-8 sm:px-6">
      <button onClick={() => navigate('/shop')} className="mb-8 font-heading text-xs font-semibold uppercase tracking-[0.18em] text-mid transition hover:text-maroon">
        ← Continue shopping
      </button>

      <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr]">
        {/* form */}
        <div>
          <Eyebrow>Checkout</Eyebrow>
          <h1 className="mt-3 font-heading text-3xl font-bold uppercase tracking-[0.02em] text-maroon sm:text-4xl">Your details</h1>
          <p className="mt-2 text-sm text-mid">Guest checkout — no account needed.</p>

          <div className="mt-8 space-y-5">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div><label className={LABEL}>First name</label><input className={FIELD} value={details.firstName} onChange={(e) => setDetails((d) => ({ ...d, firstName: e.target.value }))} /></div>
              <div><label className={LABEL}>Last name</label><input className={FIELD} value={details.lastName} onChange={(e) => setDetails((d) => ({ ...d, lastName: e.target.value }))} /></div>
            </div>
            <div><label className={LABEL}>Email address</label><input type="email" className={FIELD} placeholder="you@example.com" value={details.email} onChange={(e) => setDetails((d) => ({ ...d, email: e.target.value }))} /></div>
            <div><label className={LABEL}>Phone <span className="normal-case text-mid/60">(optional)</span></label><input type="tel" className={FIELD} placeholder="04xx xxx xxx" value={details.phone} onChange={(e) => setDetails((d) => ({ ...d, phone: e.target.value }))} /></div>
            <div><label className={LABEL}>Street address</label><input className={FIELD} placeholder="123 Main Street" value={details.address1} onChange={(e) => setDetails((d) => ({ ...d, address1: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
              <div className="col-span-2"><label className={LABEL}>Suburb</label><input className={FIELD} value={details.suburb} onChange={(e) => setDetails((d) => ({ ...d, suburb: e.target.value }))} /></div>
              <div>
                <label className={LABEL}>State</label>
                <select className={FIELD} value={details.state} onChange={(e) => setDetails((d) => ({ ...d, state: e.target.value }))}>
                  {['VIC', 'NSW', 'QLD', 'SA', 'WA', 'TAS', 'ACT', 'NT'].map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div><label className={LABEL}>Postcode</label><input className={FIELD} maxLength={4} placeholder="3435" value={details.postcode} onChange={(e) => setDetails((d) => ({ ...d, postcode: e.target.value }))} /></div>
            </div>
          </div>

          <div className="mt-8">
            <h2 className="font-heading text-sm font-bold uppercase tracking-[0.15em] text-maroon">Payment</h2>
            {cardError && <p className="mt-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{cardError}</p>}
            {!cardReady && !cardError && <p className="mt-3 text-sm text-mid">Loading secure payment form...</p>}
            <div id="sq-card-checkout" className="mt-3 min-h-[52px] rounded-xl border border-maroon/15 bg-white px-3 py-1" />
            <p className="mt-3 text-xs text-mid">🔒 Secured by Square · card details never touch our servers</p>
          </div>

          {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
        </div>

        {/* summary */}
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="rounded-2xl border border-maroon/10 bg-white p-6">
            <h2 className="font-heading text-sm font-bold uppercase tracking-[0.15em] text-maroon">Order summary</h2>
            <ul className="mt-4 space-y-4">
              {items.map((i) => (
                <li key={i.id} className="flex gap-3">
                  <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-lg border border-black/5 bg-white p-1">
                    <img src={i.image || getProduct(i.id)?.image || `/products/${i.id}.png`} alt={i.name} className="h-full w-full object-contain" />
                    <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-maroon px-1 text-[10px] font-bold text-cream">{i.qty}</span>
                  </div>
                  <div className="flex flex-1 items-center justify-between gap-2">
                    <p className="font-heading text-xs font-semibold uppercase leading-snug tracking-[0.02em] text-maroon">{i.name}</p>
                    <span className="whitespace-nowrap text-sm text-ink">{formatPrice(i.price * i.qty)}</span>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-5 space-y-1.5 border-t border-maroon/10 pt-4 text-sm">
              <div className="flex justify-between text-mid"><span>Subtotal</span><span className="text-ink">{formatPrice(subtotal)}</span></div>
              <div className="flex justify-between text-mid"><span>Shipping</span><span className="text-ink">{shipping === 0 ? 'Free' : formatPrice(shipping)}</span></div>
              <div className="flex justify-between border-t border-maroon/10 pt-2 font-heading text-lg font-bold text-maroon"><span>Total</span><span>{formatPrice(total)}</span></div>
            </div>

            <button onClick={pay} disabled={!canPay || submitting || !cardReady} className={BTN_PRIMARY + ' mt-6 w-full'}>
              {submitting ? 'Processing…' : `Pay ${formatPrice(total)}`}
            </button>
            <button onClick={() => navigate('/shop')} className={BTN_OUTLINE + ' mt-2 w-full'}>Cancel</button>
          </div>
        </aside>
      </div>
    </main>
  );
}
