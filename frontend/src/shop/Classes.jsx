import { useState, useEffect, useRef } from 'react';
import { formatPrice } from './products';
import { Eyebrow, SectionHeading, BTN_PRIMARY, BTN_OUTLINE, FIELD, LABEL } from './ui';

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
    s.onload = resolve; s.onerror = reject;
    document.head.appendChild(s);
  });
}

function fmt(d) {
  try {
    return new Date(d).toLocaleString('en-AU', { timeZone: 'Australia/Melbourne', weekday: 'long', day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit' });
  } catch { return new Date(d).toISOString(); }
}

export default function Classes({ navigate }) {
  const [sessions, setSessions] = useState(null);
  const [selected, setSelected] = useState(null);
  const [details, setDetails] = useState({ name: '', email: '', phone: '', seats: 1 });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [booking, setBooking] = useState(null);
  const [cardReady, setCardReady] = useState(false);
  const [cardError, setCardError] = useState(null);
  const cardRef = useRef(null);
  const attachedRef = useRef(false);

  useEffect(() => {
    fetch(`${API_URL}/api/classes`).then(r => r.json()).then(d => setSessions(Array.isArray(d) ? d : [])).catch(() => setSessions([]));
  }, []);

  useEffect(() => {
    if (!selected || booking || attachedRef.current) return;
    (async () => {
      try {
        await loadSquareScript();
        if (!window.Square) throw new Error('Square not loaded');
        const payments = window.Square.payments(SQUARE_APP_ID, SQUARE_LOCATION_ID);
        const card = await payments.card();
        await card.attach('#sq-card-class');
        cardRef.current = card; attachedRef.current = true; setCardReady(true);
      } catch (err) {
        console.error('Square error:', err);
        setCardError('Unable to load the payment form. Please refresh and try again.');
      }
    })();
  }, [selected, booking]);

  function choose(s) {
    setSelected(s);
    setDetails(d => ({ ...d, seats: 1 }));
    setError(null);
  }
  function backToList() {
    setSelected(null); setCardReady(false); setCardError(null);
    attachedRef.current = false; cardRef.current = null;
  }

  async function book() {
    setSubmitting(true); setError(null);
    try {
      if (!cardRef.current) throw new Error('Payment form not ready');
      const result = await cardRef.current.tokenize();
      if (result.status !== 'OK') throw new Error(result.errors?.map(e => e.message).join(', ') || 'Card error');
      const res = await fetch(`${API_URL}/api/classes/book`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: selected.id, name: details.name, email: details.email,
          phone: details.phone || null, seats: details.seats, card_token: result.token,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Booking failed');
      setBooking(data);
      window.scrollTo({ top: 0 });
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  /* confirmation */
  if (booking) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-maroon text-3xl text-cream">✓</div>
        <Eyebrow className="mt-6">You're booked</Eyebrow>
        <h1 className="mt-3 font-heading text-3xl font-bold uppercase tracking-[0.02em] text-maroon sm:text-4xl">See you there, {booking.name?.split(' ')[0]}!</h1>
        <p className="mt-4 text-ink/75"><strong className="text-maroon">{booking.title}</strong><br />{fmt(booking.starts_at)}</p>
        <p className="mt-2 text-sm text-mid">{booking.seats} seat{booking.seats > 1 ? 's' : ''} · {formatPrice((booking.amount_cents || 0) / 100)} · confirmation sent to {booking.email}</p>
        <button onClick={() => navigate('/shop')} className={BTN_PRIMARY + ' mt-8'}>Back to the shop</button>
      </main>
    );
  }

  const canBook = details.name && details.email && details.seats >= 1;
  const amount = selected ? (selected.price_cents / 100) * details.seats : 0;

  return (
    <main className="mx-auto max-w-4xl px-4 pb-24 pt-10 sm:px-6">
      <SectionHeading eyebrow="At the roastery" title="Coffee" italic="classes" />
      <p className="mx-auto mt-3 max-w-lg text-center text-mid">Hands-on sessions in Lancefield. Small groups, big flavour.</p>

      {/* session list */}
      {!selected && (
        <div className="mt-10 space-y-4">
          {sessions === null && <p className="text-center text-mid">Loading classes…</p>}
          {sessions?.length === 0 && (
            <div className="rounded-2xl border border-dashed border-maroon/25 bg-white px-6 py-16 text-center">
              <p className="font-heading text-xl font-bold uppercase tracking-wide text-maroon">No classes scheduled right now</p>
              <p className="mt-2 text-mid">Check back soon — new sessions are added regularly.</p>
            </div>
          )}
          {sessions?.map(s => (
            <div key={s.id} className="flex flex-col gap-4 rounded-2xl border border-maroon/10 bg-white p-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-heading text-lg font-bold uppercase tracking-tight text-maroon">{s.title}</h3>
                <p className="mt-1 text-sm text-mid">{fmt(s.starts_at)} · {s.duration_mins} mins</p>
                {s.description && <p className="mt-2 max-w-xl text-sm text-ink/70">{s.description}</p>}
                <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-brass">{s.seats_remaining > 0 ? `${s.seats_remaining} seat${s.seats_remaining > 1 ? 's' : ''} left` : 'Sold out'}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="font-heading text-2xl font-extrabold text-maroon">{formatPrice(s.price_cents / 100)}</p>
                <button
                  disabled={s.seats_remaining < 1}
                  onClick={() => choose(s)}
                  className={BTN_PRIMARY + ' mt-2'}
                >
                  {s.seats_remaining > 0 ? 'Book now' : 'Sold out'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* booking form */}
      {selected && (
        <div className="mx-auto mt-10 max-w-xl">
          <button onClick={backToList} className="mb-6 font-heading text-xs font-semibold uppercase tracking-[0.18em] text-mid transition hover:text-maroon">← Choose another class</button>
          <div className="rounded-2xl border border-maroon/10 bg-white p-6">
            <h3 className="font-heading text-lg font-bold uppercase tracking-tight text-maroon">{selected.title}</h3>
            <p className="mt-1 text-sm text-mid">{fmt(selected.starts_at)} · {selected.duration_mins} mins</p>

            <div className="mt-6 space-y-5">
              <div><label className={LABEL}>Full name</label><input className={FIELD} value={details.name} onChange={e => setDetails(d => ({ ...d, name: e.target.value }))} /></div>
              <div><label className={LABEL}>Email</label><input type="email" className={FIELD} placeholder="you@example.com" value={details.email} onChange={e => setDetails(d => ({ ...d, email: e.target.value }))} /></div>
              <div><label className={LABEL}>Phone <span className="normal-case text-mid/60">(optional)</span></label><input type="tel" className={FIELD} value={details.phone} onChange={e => setDetails(d => ({ ...d, phone: e.target.value }))} /></div>
              <div>
                <label className={LABEL}>Seats</label>
                <select className={FIELD} value={details.seats} onChange={e => setDetails(d => ({ ...d, seats: parseInt(e.target.value, 10) }))}>
                  {Array.from({ length: Math.min(selected.seats_remaining, 10) }, (_, i) => i + 1).map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>

              <div>
                <label className={LABEL}>Payment</label>
                {cardError && <p className="mb-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{cardError}</p>}
                {!cardReady && !cardError && <p className="mb-2 text-sm text-mid">Loading secure payment form…</p>}
                <div id="sq-card-class" className="min-h-[52px] rounded-xl border border-maroon/15 bg-white px-3 py-1" />
              </div>
            </div>

            {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

            <div className="mt-6 flex items-center justify-between border-t border-maroon/10 pt-5">
              <span className="font-heading text-lg font-bold text-maroon">{formatPrice(amount)}</span>
              <button onClick={book} disabled={!canBook || submitting || !cardReady} className={BTN_PRIMARY}>
                {submitting ? 'Processing…' : `Book · ${formatPrice(amount)}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
