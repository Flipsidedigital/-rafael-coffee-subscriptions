import { useState, useEffect, useRef } from "react";
import "../shop.css";
import { CoffeeBag, Stars, Eyebrow, BTN_PRIMARY, BTN_BRASS, BTN_OUTLINE, BTN_GHOST, FIELD, LABEL } from "../shop/ui";

const API_URL = "https://rafael-coffee-subscriptions-production.up.railway.app";
const SQUARE_APP_ID = import.meta.env.VITE_SQUARE_APPLICATION_ID || "";
const SQUARE_LOCATION_ID = import.meta.env.VITE_SQUARE_LOCATION_ID || "";
const LOGO = "/Rafaels_Coffee_logo-rnd.png";

const PRODUCTS = [
  { id: "onesto", name: "The Onesto", sub: "100% Arabica", desc: "Colombia · Mexico · Ethiopia · India Arabica", type: "blend", price250: 18, price500: 30, price1kg: 55, accent: "#402020" },
  { id: "ipanema", name: "The Ipanema", sub: "100% Arabica", desc: "Brazil · Mexico · Sumatra", type: "blend", price250: 18, price500: 30, price1kg: 55, accent: "#9a4a2f" },
  { id: "llaneros", name: "The Llaneros", sub: "85% Arabica · 15% Robusta", desc: "Colombia · Brazil · PNG · India Robusta", type: "blend", price250: 18, price500: 30, price1kg: 55, accent: "#5c3a2e" },
  { id: "calabrian", name: "The Calabrian", sub: "80% Arabica · 20% Robusta", desc: "Brazil · India Arabica · India Robusta", type: "blend", price250: 18, price500: 30, price1kg: 55, accent: "#6b4f2a" },
  { id: "equinox", name: "Old Man Winter", sub: "100% Arabica · Winter blend", desc: "Seasonal 100% Arabica winter blend", type: "blend", price250: 18, price500: 30, price1kg: 55, accent: "#34424c" },
  { id: "guatemala", name: "Guatemala Antigua", sub: "Single Origin", desc: "Seasonal · rotating every ~3 months", type: "single", price250: 20, price500: 35, price1kg: 60, accent: "#38412f" },
  { id: "peru", name: "Peru Aprocassi Organic", sub: "Single Origin · Organic", desc: "Seasonal · rotating every ~3 months", type: "single", price250: 20, price500: 35, price1kg: 60, accent: "#2f4738" },
  { id: "decaf", name: "Mexico Decaf", sub: "Swiss Water® Process · Organic", desc: "Full flavour without the caffeine", type: "decaf", price250: 20, price500: 35, price1kg: 60, accent: "#33404a" },
];

const FREQUENCIES = [
  { id: "fortnightly", label: "Fortnightly", desc: "Every two weeks", badge: "Most popular" },
  { id: "three-weekly", label: "Three Weekly", desc: "Every three weeks", badge: null },
  { id: "monthly", label: "Monthly", desc: "Once a month", badge: "Best value" },
];

const SIZES = [
  { id: "250", label: "250g", desc: "~2–3 weeks for 1 person" },
  { id: "500", label: "500g", desc: "Great for couples" },
  { id: "1000", label: "1kg", desc: "For the serious drinker" },
];

const TYPE_LABELS = { blend: "Blend", single: "Single Origin", decaf: "Decaf" };

function loadSquareScript() {
  return new Promise((resolve, reject) => {
    if (window.Square) return resolve();
    const existing = document.querySelector('script[src*="squarecdn"]');
    if (existing) {
      existing.onload = resolve;
      return;
    }
    const script = document.createElement("script");
    script.src = "https://sandbox.web.squarecdn.com/v1/square.js";
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

export default function SubscribeWizard({ onBack }) {
  const [step, setStep] = useState(1);
  const [selection, setSelection] = useState({ product: null, frequency: null, size: "250" });
  const [details, setDetails] = useState({
    firstName: "", lastName: "", email: "", phone: "",
    address1: "", suburb: "", state: "VIC", postcode: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");
  const [cardReady, setCardReady] = useState(false);
  const [cardError, setCardError] = useState(null);
  const cardRef = useRef(null);
  const attachedRef = useRef(false);

  const selectedProduct = PRODUCTS.find((p) => p.id === selection.product);
  const priceKey =
    selection.size === "1000" ? "price1kg" : selection.size === "500" ? "price500" : "price250";
  const price = selectedProduct ? selectedProduct[priceKey] : null;
  const filteredProducts = filter === "all" ? PRODUCTS : PRODUCTS.filter((p) => p.type === filter);
  const canProceedStep1 = selection.product && selection.frequency && selection.size;
  const canProceedStep2 =
    details.firstName && details.lastName && details.email &&
    details.address1 && details.suburb && details.postcode;

  // Initialise Square card when step 3 becomes active
  useEffect(() => {
    if (step !== 3 || attachedRef.current) return;

    async function initCard() {
      try {
        await loadSquareScript();
        if (!window.Square) throw new Error("Square not loaded");
        const payments = window.Square.payments(SQUARE_APP_ID, SQUARE_LOCATION_ID);
        const card = await payments.card();
        await card.attach("#square-card-element");
        cardRef.current = card;
        attachedRef.current = true;
        setCardReady(true);
      } catch (err) {
        console.error("Square error:", err);
        setCardError("Unable to load payment form. Please refresh and try again.");
      }
    }

    initCard();
  }, [step]);

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      if (!cardRef.current) throw new Error("Payment form not ready");
      const result = await cardRef.current.tokenize();
      if (result.status !== "OK") {
        throw new Error(result.errors?.map((e) => e.message).join(", ") || "Card error");
      }
      const cardToken = result.token;

      const tempPassword = crypto.randomUUID();
      const registerRes = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: details.email,
          password: tempPassword,
          first_name: details.firstName,
          last_name: details.lastName,
          phone: details.phone || null,
        }),
      });
      let authData = await registerRes.json();
      if (!authData.token && registerRes.status === 409) {
        const loginRes = await fetch(`${API_URL}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: details.email, password: tempPassword }),
        });
        authData = await loginRes.json();
      }
      if (!authData.token)
        throw new Error("Unable to create or access your account. Please try again.");

      const subRes = await fetch(`${API_URL}/api/subscriptions/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authData.token}`,
        },
        body: JSON.stringify({
          product_id: selection.product,
          frequency: selection.frequency,
          quantity_grams: parseInt(selection.size),
          card_token: cardToken,
          shipping_name: `${details.firstName} ${details.lastName}`,
          shipping_address_1: details.address1,
          shipping_suburb: details.suburb,
          shipping_state: details.state,
          shipping_postcode: details.postcode,
        }),
      });
      if (!subRes.ok) {
        const err = await subRes.json();
        throw new Error(err.error || "Subscription creation failed");
      }
      setSuccess(true);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  /* --------------------------------------------------------------- success */
  if (success) {
    return (
      <div className="shop-root flex min-h-screen items-center justify-center bg-cream px-4 font-body text-ink antialiased">
        <div className="w-full max-w-lg rounded-3xl border border-maroon/10 bg-porcelain p-10 text-center shadow-xl">
          <img src={LOGO} alt="Rafael's Coffee" className="mx-auto h-20 w-20 rounded-full object-contain" />
          <h2 className="mt-6 font-heading text-4xl font-extrabold uppercase tracking-tight text-maroon">
            You're Subscribed!
          </h2>
          <p className="mt-4 leading-relaxed text-ink/80">
            Welcome to the Rafael's Coffee family. Your first bag of{" "}
            <strong className="text-maroon">{selectedProduct?.name}</strong> will be freshly roasted and
            dispatched this Thursday.
          </p>
          <p className="mt-2 text-sm text-mid">Check your email for confirmation and account details.</p>
          <button className={`${BTN_PRIMARY} mt-8`} onClick={onBack}>Back to Home</button>
        </div>
      </div>
    );
  }

  /* ---------------------------------------------------------------- wizard */
  return (
    <div className="shop-root min-h-screen bg-cream font-body text-ink antialiased">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-maroon/10 bg-cream/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <button className={BTN_GHOST} onClick={onBack}>← Back</button>
          <img src={LOGO} alt="Rafael's Coffee" className="h-10 w-10 rounded-full object-contain" />
          <div className="flex items-center gap-1.5">
            {[1, 2, 3].map((s) => (
              <span
                key={s}
                className={
                  "h-1.5 rounded-full transition-all " +
                  (step === s ? "w-6 bg-maroon" : step > s ? "w-3 bg-brass" : "w-3 bg-maroon/15")
                }
              />
            ))}
          </div>
        </div>
        <div className="h-0.5 w-full bg-maroon/10">
          <div className="h-full bg-brass transition-all duration-500" style={{ width: `${((step - 1) / 2) * 100}%` }} />
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
        {/* ---------------------------------------------------------- Step 1 */}
        {step === 1 && (
          <div>
            <div className="text-center">
              <Eyebrow>Step 1 of 3</Eyebrow>
              <h2 className="mt-3 font-heading text-4xl font-extrabold uppercase tracking-tight text-maroon sm:text-5xl">
                Choose Your Coffee
              </h2>
              <p className="mt-3 text-mid">All beans roasted to order in Lancefield, Victoria.</p>
            </div>

            <div className="mt-8 mb-8 flex flex-wrap justify-center gap-2">
              {[["all", "All"], ["blend", "Blends"], ["single", "Single Origins"], ["decaf", "Decaf"]].map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setFilter(val)}
                  className={
                    "rounded-full px-5 py-2 font-heading text-xs font-semibold uppercase tracking-[0.15em] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass " +
                    (filter === val ? "bg-maroon text-cream" : "border border-maroon/20 text-ink/70 hover:border-maroon/50 hover:text-maroon")
                  }
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
              {filteredProducts.map((p) => {
                const selected = selection.product === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelection((s) => ({ ...s, product: p.id }))}
                    className="group text-left focus-visible:outline-none"
                    aria-pressed={selected}
                  >
                    <div className={"relative overflow-hidden rounded-2xl transition duration-300 group-hover:-translate-y-1 " + (selected ? "ring-2 ring-brass ring-offset-2 ring-offset-cream" : "")}>
                      <CoffeeBag product={p} />
                      {selected && (
                        <span className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-brass text-sm font-bold text-espresso shadow">✓</span>
                      )}
                    </div>
                    <p className="mt-3 font-heading text-[10px] font-semibold uppercase tracking-[0.15em] text-brass">{TYPE_LABELS[p.type]}</p>
                    <p className="font-heading text-sm font-bold uppercase tracking-tight text-maroon">{p.name}</p>
                    <p className="text-xs text-mid">{p.sub}</p>
                    <p className="mt-0.5 text-[11px] leading-snug text-ink/60">{p.desc}</p>
                    <p className="mt-1 font-heading text-sm font-extrabold text-maroon">From ${p.price250}</p>
                  </button>
                );
              })}
            </div>

            {/* Bag size */}
            <div className="mt-12">
              <h3 className="font-heading text-sm font-bold uppercase tracking-[0.15em] text-maroon">Bag Size</h3>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                {SIZES.map((s) => {
                  const selected = selection.size === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => setSelection((sel) => ({ ...sel, size: s.id }))}
                      className={
                        "rounded-2xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass " +
                        (selected ? "border-maroon bg-maroon text-cream" : "border-maroon/15 bg-porcelain hover:border-maroon/40")
                      }
                    >
                      <span className="block font-heading text-lg font-extrabold uppercase tracking-tight">{s.label}</span>
                      <span className={"mt-0.5 block text-xs " + (selected ? "text-cream/70" : "text-mid")}>{s.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Frequency */}
            <div className="mt-10">
              <h3 className="font-heading text-sm font-bold uppercase tracking-[0.15em] text-maroon">Delivery Frequency</h3>
              <div className="mt-4 space-y-3">
                {FREQUENCIES.map((f) => {
                  const selected = selection.frequency === f.id;
                  return (
                    <button
                      key={f.id}
                      onClick={() => setSelection((s) => ({ ...s, frequency: f.id }))}
                      className={
                        "flex w-full items-center justify-between rounded-2xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass " +
                        (selected ? "border-maroon bg-maroon text-cream" : "border-maroon/15 bg-porcelain hover:border-maroon/40")
                      }
                    >
                      <span>
                        <span className="block font-heading text-base font-bold uppercase tracking-wide">{f.label}</span>
                        <span className={"text-xs " + (selected ? "text-cream/70" : "text-mid")}>{f.desc}</span>
                      </span>
                      <span className="flex items-center gap-3">
                        {f.badge && (
                          <span className={"rounded-full px-2.5 py-1 font-heading text-[10px] font-bold uppercase tracking-wider " + (selected ? "bg-brass text-espresso" : "bg-brass/15 text-maroon")}>
                            {f.badge}
                          </span>
                        )}
                        {selected && <span className="text-brass-soft">✓</span>}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {price && (
              <div className="mt-8 flex items-center justify-between rounded-2xl border border-maroon/10 bg-espresso px-6 py-5 text-cream">
                <span className="text-sm text-cream/80">
                  {selectedProduct?.name} · {selection.size}g · {selection.frequency}
                </span>
                <span className="font-heading text-xl font-extrabold text-brass-soft">${price} <span className="text-xs font-medium text-cream/60">/ delivery</span></span>
              </div>
            )}

            <div className="mt-8 flex justify-end">
              <button className={BTN_PRIMARY} disabled={!canProceedStep1} onClick={() => setStep(2)}>
                Continue to your details →
              </button>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------------- Step 2 */}
        {step === 2 && (
          <div className="mx-auto max-w-2xl">
            <div className="text-center">
              <Eyebrow>Step 2 of 3</Eyebrow>
              <h2 className="mt-3 font-heading text-4xl font-extrabold uppercase tracking-tight text-maroon sm:text-5xl">
                Your Details
              </h2>
              <p className="mt-3 text-mid">Where should we deliver your coffee?</p>
            </div>

            <div className="mt-8 space-y-5">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label className={LABEL}>First name</label>
                  <input className={FIELD} type="text" placeholder="First name" value={details.firstName}
                    onChange={(e) => setDetails((d) => ({ ...d, firstName: e.target.value }))} />
                </div>
                <div>
                  <label className={LABEL}>Last name</label>
                  <input className={FIELD} type="text" placeholder="Last name" value={details.lastName}
                    onChange={(e) => setDetails((d) => ({ ...d, lastName: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className={LABEL}>Email address</label>
                <input className={FIELD} type="email" placeholder="you@example.com" value={details.email}
                  onChange={(e) => setDetails((d) => ({ ...d, email: e.target.value }))} />
              </div>
              <div>
                <label className={LABEL}>Phone <span className="normal-case text-mid/60">(optional)</span></label>
                <input className={FIELD} type="tel" placeholder="04xx xxx xxx" value={details.phone}
                  onChange={(e) => setDetails((d) => ({ ...d, phone: e.target.value }))} />
              </div>
              <div>
                <label className={LABEL}>Street address</label>
                <input className={FIELD} type="text" placeholder="123 Main Street" value={details.address1}
                  onChange={(e) => setDetails((d) => ({ ...d, address1: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
                <div className="col-span-2">
                  <label className={LABEL}>Suburb</label>
                  <input className={FIELD} type="text" placeholder="Suburb" value={details.suburb}
                    onChange={(e) => setDetails((d) => ({ ...d, suburb: e.target.value }))} />
                </div>
                <div>
                  <label className={LABEL}>State</label>
                  <select className={FIELD} value={details.state}
                    onChange={(e) => setDetails((d) => ({ ...d, state: e.target.value }))}>
                    {["VIC", "NSW", "QLD", "SA", "WA", "TAS", "ACT", "NT"].map((st) => <option key={st}>{st}</option>)}
                  </select>
                </div>
                <div>
                  <label className={LABEL}>Postcode</label>
                  <input className={FIELD} type="text" placeholder="3435" maxLength={4} value={details.postcode}
                    onChange={(e) => setDetails((d) => ({ ...d, postcode: e.target.value }))} />
                </div>
              </div>
            </div>

            <div className="mt-8 flex items-center justify-between">
              <button className={BTN_OUTLINE} onClick={() => setStep(1)}>← Back</button>
              <button className={BTN_PRIMARY} disabled={!canProceedStep2} onClick={() => setStep(3)}>
                Continue to payment →
              </button>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------------- Step 3 */}
        {step >= 3 && (
          <div className="mx-auto max-w-2xl">
            <div className="text-center">
              <Eyebrow>Step 3 of 3</Eyebrow>
              <h2 className="mt-3 font-heading text-4xl font-extrabold uppercase tracking-tight text-maroon sm:text-5xl">
                Review &amp; Pay
              </h2>
              <p className="mt-3 text-mid">Confirm your subscription and enter your payment details.</p>
            </div>

            <div className="mt-8 overflow-hidden rounded-2xl border border-maroon/10 bg-porcelain">
              <div className="grid gap-6 p-6 sm:grid-cols-2">
                <div>
                  <h4 className="font-heading text-xs font-semibold uppercase tracking-[0.18em] text-brass">Your subscription</h4>
                  <dl className="mt-3 space-y-2 text-sm">
                    <Row label="Coffee" value={selectedProduct?.name} />
                    <Row label="Type" value={TYPE_LABELS[selectedProduct?.type]} />
                    <Row label="Size" value={`${selection.size}g`} />
                    <Row label="Frequency" value={selection.frequency} />
                    <div className="mt-2 flex justify-between border-t border-maroon/10 pt-2">
                      <dt className="font-heading font-bold uppercase tracking-wide text-maroon">Per delivery</dt>
                      <dd className="font-heading text-lg font-extrabold text-maroon">${price}</dd>
                    </div>
                  </dl>
                </div>
                <div className="border-t border-maroon/10 pt-6 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0">
                  <h4 className="font-heading text-xs font-semibold uppercase tracking-[0.18em] text-brass">Delivery address</h4>
                  <div className="mt-3 space-y-1 text-sm text-ink/80">
                    <p>{details.firstName} {details.lastName}</p>
                    <p>{details.address1}</p>
                    <p>{details.suburb} {details.state} {details.postcode}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-2xl bg-brass/10 px-5 py-4 text-sm text-maroon">
              ☕ We roast to order every Thursday. Your first delivery will be dispatched COB Friday.
            </div>

            <div className="mt-6">
              <h4 className="font-heading text-sm font-bold uppercase tracking-[0.15em] text-maroon">Card Details</h4>
              {cardError && <p className="mt-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{cardError}</p>}
              {!cardReady && !cardError && <p className="mt-3 text-sm text-mid">Loading secure payment form...</p>}
              <div id="square-card-element" className="mt-3 min-h-[52px] rounded-xl border border-maroon/15 bg-white px-3 py-1" />
              <p className="mt-3 text-xs text-mid">
                🔒 Secured by Square · PCI compliant · Card details never stored on our servers
              </p>
            </div>

            {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

            <div className="mt-8 flex items-center justify-between">
              <button className={BTN_OUTLINE} onClick={() => setStep(2)} disabled={submitting}>← Back</button>
              <button className={BTN_BRASS} onClick={handleSubmit} disabled={submitting || !cardReady}>
                {submitting ? "Processing…" : `Start subscription · $${price}`}
              </button>
            </div>
            <p className="mt-4 text-center text-xs text-mid">
              Your card will be charged ${price} on each {selection.frequency} delivery. Cancel or pause anytime from your account.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between">
      <dt className="text-mid">{label}</dt>
      <dd className="font-semibold text-ink">{value}</dd>
    </div>
  );
}
