import { useState, useEffect, useCallback } from 'react';
import '../shop.css';
import {
  PRODUCTS,
  CATEGORIES,
  getProduct,
  formatPrice,
  subscriberPrice,
  SUBSCRIBER_DISCOUNT,
} from '../shop/products';
import { addToCart, cartCount, isSubscriber } from '../shop/cart';
import { Stars, SectionHeading, CoffeeBag, PriceTag } from '../shop/ui';
import CartDrawer from '../shop/CartDrawer';
import Checkout from '../shop/Checkout';

const LOGO = '/Rafaels_Coffee_logo-rnd.png';

/* ================================================================= Shop root */
export default function Shop() {
  const [path, setPath] = useState(window.location.pathname);
  const [count, setCount] = useState(cartCount());
  const [cartOpen, setCartOpen] = useState(false);
  const subscriber = isSubscriber();

  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    const onCart = () => setCount(cartCount());
    const onOpen = () => setCartOpen(true);
    window.addEventListener('popstate', onPop);
    window.addEventListener('cart:change', onCart);
    window.addEventListener('cart:open', onOpen);
    return () => {
      window.removeEventListener('popstate', onPop);
      window.removeEventListener('cart:change', onCart);
      window.removeEventListener('cart:open', onOpen);
    };
  }, []);

  const navigate = useCallback((to) => {
    window.history.pushState({}, '', to);
    setPath(to);
    window.scrollTo({ top: 0 });
  }, []);

  const isCheckout = /^\/shop\/checkout\/?$/.test(path);
  const detailMatch = !isCheckout && path.match(/^\/shop\/([^/]+)\/?$/);
  const product = detailMatch ? getProduct(detailMatch[1]) : null;

  return (
    <div className="shop-root min-h-screen bg-cream font-body text-ink antialiased">
      <AnnounceBar />
      <ShopHeader count={count} subscriber={subscriber} navigate={navigate} onOpenCart={() => setCartOpen(true)} />
      {isCheckout ? (
        <Checkout navigate={navigate} />
      ) : detailMatch ? (
        <ProductDetail product={product} subscriber={subscriber} navigate={navigate} />
      ) : (
        <ShopListing subscriber={subscriber} navigate={navigate} />
      )}
      <ShopFooter navigate={navigate} />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} navigate={navigate} />
    </div>
  );
}

/* =================================================================== Chrome */
function AnnounceBar() {
  return (
    <div className="bg-maroon text-cream">
      <p className="mx-auto max-w-6xl px-4 py-2 text-center font-heading text-[11px] font-medium uppercase tracking-[0.28em]">
        Freshly roasted in the Macedon Ranges · Complimentary shipping over $60
      </p>
    </div>
  );
}

function MenuIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}
function CloseIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

function CartButton({ count, onOpenCart }) {
  return (
    <button
      type="button"
      onClick={onOpenCart}
      aria-label={`Cart, ${count} items`}
      className="relative flex items-center gap-2 rounded-full bg-maroon px-4 py-2 font-heading text-xs font-semibold uppercase tracking-wider text-cream transition hover:bg-maroon-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
    >
      Cart
      <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-cream px-1.5 text-[11px] font-bold text-maroon">
        {count}
      </span>
    </button>
  );
}

function ShopHeader({ count, subscriber, navigate, onOpenCart }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const goHome = (e) => { e.preventDefault(); window.location.href = '/'; };
  const linkCls = 'text-left transition hover:text-maroon';

  const links = (
    <>
      <button onClick={() => { setMenuOpen(false); navigate('/shop'); }} className={linkCls}>Coffee</button>
      <a href="/subscribe" className={linkCls}>Subscribe</a>
      {/* centered brand — desktop only */}
      <a href="/" onClick={goHome} className="hidden shrink-0 items-center gap-2.5 lg:flex">
        <img src={LOGO} alt="Rafael's Coffee" className="h-9 w-9 rounded-full object-contain" />
        <span className="font-heading text-sm font-semibold uppercase tracking-[0.22em] text-maroon">Rafael's Coffee</span>
      </a>
      <a href="/about" className={linkCls}>Our Story</a>
      <a href="https://rafaelscoffee.com.au" target="_blank" rel="noreferrer" className={linkCls}>Visit</a>
    </>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-maroon/10 bg-cream/90 backdrop-blur-md">
      <nav className="mx-auto w-full max-w-6xl px-4 py-3 sm:px-6 lg:flex lg:items-center lg:gap-4">
        {/* mobile bar: brand + controls */}
        <div className="flex items-center justify-between lg:hidden">
          <a href="/" onClick={goHome} className="flex items-center gap-2.5">
            <img src={LOGO} alt="Rafael's Coffee" className="h-9 w-9 rounded-full object-contain" />
            <span className="font-heading text-sm font-semibold uppercase tracking-[0.2em] text-maroon">Rafael's Coffee</span>
          </a>
          <div className="flex items-center gap-2">
            <CartButton count={count} onOpenCart={onOpenCart} />
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="Toggle menu"
              aria-expanded={menuOpen}
              className="flex items-center justify-center rounded-lg border border-maroon/25 p-2 text-maroon transition hover:bg-maroon/5"
            >
              {menuOpen ? <CloseIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>

        {/* centered links (desktop) / collapsible (mobile) */}
        <div className={(menuOpen ? 'block' : 'hidden') + ' grow lg:block'}>
          <div className="flex flex-col gap-4 pt-4 font-heading text-[11px] font-semibold uppercase tracking-[0.2em] text-ink/70 lg:flex-row lg:items-center lg:justify-center lg:gap-12 lg:pt-0">
            {links}
          </div>
        </div>

        {/* actions (desktop) */}
        <div className="hidden items-center gap-3 lg:flex">
          {subscriber && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-brass/40 bg-brass/10 px-3 py-1.5 font-heading text-[11px] font-semibold uppercase tracking-wider text-maroon">
              ★ Subscriber · {Math.round(SUBSCRIBER_DISCOUNT * 100)}% off
            </span>
          )}
          <CartButton count={count} onOpenCart={onOpenCart} />
        </div>
      </nav>
    </header>
  );
}

/* ================================================================== Listing */
function ShopListing({ subscriber, navigate }) {
  const [active, setActive] = useState('all');
  const visible = active === 'all' ? PRODUCTS : PRODUCTS.filter((p) => p.category === active);
  const placeholder = visible.length === 0;

  return (
    <main>
      <Hero navigate={navigate} />
      <TrustStrip />

      {/* Shop */}
      <section id="coffee" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <SectionHeading
          eyebrow="The Collection"
          title="Small-batch coffee"
          italic="roasted to order"
        />

        <div className="mt-8 mb-10 flex flex-wrap justify-center gap-2">
          {CATEGORIES.map((c) => {
            const isActive = active === c.key;
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => setActive(c.key)}
                className={
                  'rounded-full px-5 py-2 font-heading text-xs font-semibold uppercase tracking-[0.15em] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass ' +
                  (isActive
                    ? 'bg-maroon text-cream'
                    : 'border border-maroon/20 text-ink/70 hover:border-maroon/50 hover:text-maroon')
                }
              >
                {c.label}
              </button>
            );
          })}
        </div>

        {placeholder ? (
          <ComingSoon category={active} />
        ) : (
          <div className="grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-4 lg:gap-x-7">
            {visible.map((p) => (
              <ProductCard key={p.id} product={p} subscriber={subscriber} navigate={navigate} />
            ))}
          </div>
        )}
      </section>

      <SubscriptionTeaser navigate={navigate} />
      <Testimonials />
    </main>
  );
}

function Hero({ navigate }) {
  return (
    <section className="relative overflow-hidden bg-cream">
      {/* soft warm glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(80% 65% at 82% 5%, rgba(124,48,70,0.07), transparent 60%)' }}
      />
      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <p className="font-heading text-xs font-semibold uppercase tracking-[0.32em] text-brass">
            Lancefield · Victoria
          </p>
          <h1 className="mt-5 font-heading text-4xl font-bold uppercase leading-[1.08] tracking-[0.01em] text-maroon sm:text-5xl">
            Coffee worth<br />slowing down for
          </h1>
          <p className="mt-6 max-w-md text-base leading-relaxed text-ink/70">
            Roasted by hand in the Macedon Ranges, in small batches, the day it ships.
            Honest beans, ethically sourced, delivered on your rhythm.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              onClick={() => document.getElementById('coffee')?.scrollIntoView({ behavior: 'smooth' })}
              className="rounded-full bg-maroon px-7 py-3.5 font-heading text-sm font-semibold uppercase tracking-wider text-cream transition hover:bg-maroon-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
            >
              Shop the coffee
            </button>
            <a
              href="/subscribe"
              className="rounded-full border border-maroon/30 px-7 py-3.5 font-heading text-sm font-semibold uppercase tracking-wider text-maroon transition hover:bg-maroon/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass"
            >
              Start a subscription
            </a>
          </div>

          <div className="mt-8 flex items-center gap-3 text-sm text-mid">
            <Stars value={4.9} />
            <span className="font-heading tracking-wide">4.9 · loved by 500+ locals</span>
          </div>
        </div>

        {/* Bag cluster */}
        <div className="relative mx-auto hidden h-[440px] w-full max-w-md items-center justify-center lg:flex">
          <div className="absolute left-0 top-12 w-40 -rotate-6 drop-shadow-2xl">
            <CoffeeBag product={PRODUCTS[2]} />
          </div>
          <div className="absolute right-0 top-16 w-40 rotate-6 drop-shadow-2xl">
            <CoffeeBag product={PRODUCTS[1]} />
          </div>
          <div className="relative z-10 w-52 drop-shadow-2xl">
            <CoffeeBag product={PRODUCTS[0]} />
          </div>
        </div>
      </div>
    </section>
  );
}

function TrustStrip() {
  const items = [
    ['Roasted to order', 'never off a warehouse shelf'],
    ['Ethically sourced', 'traceable, fairly paid beans'],
    ['Macedon Ranges', 'roasted in Lancefield, VIC'],
    ['★ 4.9 rating', 'from 500+ happy locals'],
  ];
  return (
    <section className="border-y border-maroon/10 bg-porcelain">
      <div className="mx-auto grid max-w-6xl grid-cols-2 divide-y divide-maroon/10 sm:grid-cols-4 sm:divide-x sm:divide-y-0">
        {items.map(([title, sub]) => (
          <div key={title} className="px-4 py-6 text-center">
            <p className="font-heading text-sm font-bold uppercase tracking-[0.14em] text-maroon">{title}</p>
            <p className="mt-1 text-xs text-mid">{sub}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ============================================================== Product card */
function ProductCard({ product, subscriber, navigate }) {
  const [added, setAdded] = useState(false);
  const href = `/shop/${product.id}`;

  function onAdd(e) {
    e.stopPropagation();
    addToCart(product);
    window.dispatchEvent(new Event('cart:open'));
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
  }

  return (
    <article className="group flex flex-col">
      <button
        onClick={() => navigate(href)}
        aria-label={`View ${product.name}`}
        className="block overflow-hidden rounded-2xl transition duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass group-hover:-translate-y-1 group-hover:drop-shadow-xl"
      >
        <CoffeeBag product={product} />
      </button>

      <div className="mt-4 flex flex-1 flex-col">
        <h3 className="font-heading text-sm font-semibold uppercase leading-snug tracking-[0.03em] text-maroon">
          {product.name}
        </h3>
        <p className="mt-1 text-xs text-mid">{product.sub}{product.weight ? ` · ${product.weight}` : ''}</p>
        <div className="mt-1.5 flex items-center gap-1.5">
          <Stars value={product.rating} small />
          <span className="text-[11px] text-mid">({product.reviews})</span>
        </div>

        <div className="mt-3 flex items-center justify-between gap-2">
          <PriceTag price={product.price} subscriber={subscriber} />
          <button
            type="button"
            onClick={onAdd}
            className={
              'rounded-full px-4 py-2 font-heading text-[11px] font-bold uppercase tracking-wider transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass ' +
              (added ? 'bg-espresso text-cream' : 'bg-maroon text-cream hover:bg-maroon-light')
            }
          >
            {added ? 'Added ✓' : 'Add'}
          </button>
        </div>
      </div>
    </article>
  );
}

/* ========================================================= Subscription band */
function SubscriptionTeaser({ navigate }) {
  const steps = [
    ['01', 'Choose your beans', 'Pick a blend and a size you love.'],
    ['02', 'We roast fresh', 'Roasted to order and packed the same day.'],
    ['03', 'Delivered on repeat', 'On your rhythm — pause or cancel anytime.'],
  ];
  return (
    <section className="border-y border-maroon/10 bg-stone/50">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div>
          <p className="font-heading text-xs font-semibold uppercase tracking-[0.32em] text-brass">
            Never run out
          </p>
          <h2 className="mt-4 font-heading text-3xl font-bold uppercase leading-tight tracking-[0.02em] text-maroon sm:text-4xl">
            Subscribe &amp; save ten percent
          </h2>
          <p className="mt-5 max-w-md text-ink/70">
            The freshest way to drink Rafael's. Delivered fortnightly, three-weekly or monthly —
            you stay in complete control. No lock-in, no fuss.
          </p>
          <a
            href="/subscribe"
            className="mt-8 inline-block rounded-full bg-maroon px-7 py-3.5 font-heading text-sm font-semibold uppercase tracking-wider text-cream transition hover:bg-maroon-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
          >
            Explore subscriptions
          </a>
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          {steps.map(([n, title, sub]) => (
            <div key={n} className="rounded-2xl border border-maroon/10 bg-white p-5">
              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-maroon/25 font-heading text-sm font-bold text-maroon">
                {n}
              </span>
              <p className="mt-4 font-heading text-sm font-bold uppercase tracking-wide text-maroon">{title}</p>
              <p className="mt-1.5 text-sm text-mid">{sub}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================= Testimonials */
// NOTE: sample testimonials — replace with real customer reviews before launch.
function Testimonials() {
  const quotes = [
    ['The Onesto has completely ruined café coffee for me — nothing else compares now.', 'Hannah M.', 'Kyneton'],
    ['Turns up like clockwork, always ridiculously fresh. The Guatemala is unreal.', 'Dave R.', 'Woodend'],
    ['Beautiful beans and a beautiful local story. Proud to have Rafael’s on the bench.', 'Priya S.', 'Gisborne'],
  ];
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
      <SectionHeading eyebrow="From our regulars" title="Loved across" italic="the ranges" />
      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {quotes.map(([quote, name, town]) => (
          <figure key={name} className="flex flex-col rounded-2xl border border-maroon/10 bg-porcelain p-7">
            <Stars value={5} />
            <blockquote className="mt-4 flex-1 text-base leading-relaxed text-ink/80">
              “{quote}”
            </blockquote>
            <figcaption className="mt-5 font-heading text-xs font-semibold uppercase tracking-[0.15em] text-maroon">
              {name} <span className="font-medium text-mid">· {town}</span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

/* =========================================================== Product detail */
function ProductDetail({ product, subscriber, navigate }) {
  const [added, setAdded] = useState(false);

  if (!product) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-28 text-center">
        <h1 className="font-heading text-3xl font-bold uppercase text-maroon">Product not found</h1>
        <button
          onClick={() => navigate('/shop')}
          className="mt-6 rounded-full bg-maroon px-6 py-3 font-heading text-sm font-bold uppercase tracking-wider text-cream hover:bg-maroon-light"
        >
          Back to shop
        </button>
      </main>
    );
  }

  function onAdd() {
    addToCart(product);
    window.dispatchEvent(new Event('cart:open'));
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  }

  return (
    <main className="mx-auto max-w-6xl px-4 pb-24 pt-8 sm:px-6">
      <button
        onClick={() => navigate('/shop')}
        className="mb-8 font-heading text-xs font-semibold uppercase tracking-[0.18em] text-mid transition hover:text-maroon"
      >
        ← Back to the collection
      </button>

      <div className="grid grid-cols-1 gap-12 md:grid-cols-2 md:gap-16">
        <div className="md:sticky md:top-28 md:self-start">
          <div className="mx-auto w-full max-w-sm drop-shadow-2xl">
            <CoffeeBag product={product} />
          </div>
        </div>

        <div className="flex flex-col">
          <p className="font-heading text-xs font-semibold uppercase tracking-[0.3em] text-brass">
            {product.origin || product.sub}
          </p>
          <h1 className="mt-3 font-heading text-3xl font-bold uppercase leading-tight tracking-[0.01em] text-maroon sm:text-4xl">
            {product.name}
          </h1>
          <p className="mt-2 text-lg text-mid">{product.sub}</p>

          <div className="mt-4 flex items-center gap-2">
            <Stars value={product.rating} />
            <span className="text-sm text-mid">{product.rating} · {product.reviews} reviews</span>
          </div>

          <div className="mt-6">
            <PriceTag price={product.price} subscriber={subscriber} large />
          </div>

          <p className="mt-5 max-w-md leading-relaxed text-ink/80">{product.blurb}</p>

          {product.origin && (
            <dl className="mt-7 grid grid-cols-3 gap-4 border-y border-maroon/10 py-6 text-sm">
              <Meta label="Origin" value={product.origin} />
              <Meta label="Roast" value={product.roast} />
              <Meta label="Format" value="Whole bean" />
            </dl>
          )}

          {product.notes?.length > 0 && (
            <div className="mt-6">
              <p className="font-heading text-xs font-semibold uppercase tracking-[0.2em] text-mid">
                In the cup
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {product.notes.map((n) => (
                  <span key={n} className="rounded-full border border-brass/30 bg-brass/[0.08] px-3.5 py-1.5 text-xs font-medium text-maroon">
                    {n}
                  </span>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={onAdd}
            className={
              'mt-9 w-full rounded-full px-6 py-4 font-heading text-sm font-bold uppercase tracking-[0.15em] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass focus-visible:ring-offset-2 focus-visible:ring-offset-cream sm:w-auto sm:px-14 ' +
              (added ? 'bg-espresso text-cream' : 'bg-maroon text-cream hover:bg-maroon-light')
            }
          >
            {added ? 'Added to cart ✓' : `Add to cart — ${formatPrice(subscriber ? subscriberPrice(product.price) : product.price)}`}
          </button>

          <p className="mt-4 text-sm text-mid">
            {subscriber ? (
              <>★ Your {Math.round(SUBSCRIBER_DISCOUNT * 100)}% subscriber discount is applied.</>
            ) : (
              <>
                ☕ Subscribers save {Math.round(SUBSCRIBER_DISCOUNT * 100)}% on every order.{' '}
                <a href="/subscribe" className="font-semibold text-maroon underline decoration-brass underline-offset-2">
                  Start a subscription
                </a>.
              </>
            )}
          </p>

          {/* roaster's note */}
          {product.category === 'coffee' && (
          <div className="mt-8 rounded-2xl bg-porcelain p-6">
            <p className="font-heading text-xs font-semibold uppercase tracking-[0.2em] text-brass">Roaster's note</p>
            <p className="mt-2 text-base leading-relaxed text-ink/75">
              Roasted to order in Lancefield and rested, never rushed — so every bag reaches
              you at its sweetest. Best enjoyed within four weeks of the roast date on the base.
            </p>
          </div>
          )}
        </div>
      </div>
    </main>
  );
}

/* ================================================================= Bits */
function Meta({ label, value }) {
  return (
    <div>
      <dt className="font-heading text-[11px] font-semibold uppercase tracking-[0.15em] text-mid">{label}</dt>
      <dd className="mt-1 text-sm text-ink/85">{value}</dd>
    </div>
  );
}

function ComingSoon({ category }) {
  const label = category === 'accessories' ? 'Accessories' : 'Training Classes';
  const copy =
    category === 'accessories'
      ? 'Mugs, brew gear and Rafael’s merch — thoughtfully chosen, coming soon.'
      : 'Hands-on brewing and barista classes at the roastery — coming soon.';
  return (
    <div className="rounded-2xl border border-dashed border-maroon/25 bg-white px-6 py-20 text-center">
      <p className="font-heading text-xs font-semibold uppercase tracking-[0.25em] text-brass">Just roasting the details</p>
      <p className="mt-3 font-heading text-2xl font-bold uppercase tracking-[0.02em] text-maroon sm:text-3xl">
        {label} — Coming Soon
      </p>
      <p className="mx-auto mt-3 max-w-md text-mid">{copy}</p>
    </div>
  );
}

function ShopFooter({ navigate }) {
  return (
    <footer className="border-t border-maroon/10 bg-cream">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:grid-cols-3 sm:px-6">
        <div>
          <div className="flex items-center gap-3">
            <img src={LOGO} alt="Rafael's Coffee" className="h-12 w-12 rounded-full object-contain" />
            <span className="font-heading text-base font-semibold uppercase tracking-[0.2em] text-maroon">Rafael's Coffee</span>
          </div>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-mid">
            Small-batch specialty coffee, roasted by hand in Lancefield in the heart of the
            Macedon Ranges.
          </p>
        </div>
        <div>
          <p className="font-heading text-xs font-semibold uppercase tracking-[0.25em] text-brass">Shop</p>
          <ul className="mt-4 space-y-2.5 text-sm text-ink/70">
            <li><button onClick={() => navigate('/shop')} className="transition hover:text-maroon">All coffee</button></li>
            <li><a href="/subscribe" className="transition hover:text-maroon">Subscriptions</a></li>
            <li><a href="/portal" className="transition hover:text-maroon">Manage my account</a></li>
          </ul>
        </div>
        <div>
          <p className="font-heading text-xs font-semibold uppercase tracking-[0.25em] text-brass">Visit</p>
          <ul className="mt-4 space-y-2.5 text-sm text-ink/70">
            <li>Lancefield, VIC 3435</li>
            <li><a href="https://rafaelscoffee.com.au" target="_blank" rel="noreferrer" className="text-maroon underline decoration-maroon/40 underline-offset-2 hover:decoration-maroon">rafaelscoffee.com.au</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-maroon/10">
        <p className="mx-auto max-w-6xl px-4 py-5 text-center font-heading text-[11px] uppercase tracking-[0.28em] text-mid sm:px-6">
          © Rafael's Coffee · Macedon Ranges Roastery
        </p>
      </div>
    </footer>
  );
}
