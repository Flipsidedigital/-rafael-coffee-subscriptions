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

const LOGO = '/Rafaels_Coffee_logo-rnd.png';

/* ================================================================= Shop root */
export default function Shop() {
  const [path, setPath] = useState(window.location.pathname);
  const [count, setCount] = useState(cartCount());
  const subscriber = isSubscriber();

  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    const onCart = () => setCount(cartCount());
    window.addEventListener('popstate', onPop);
    window.addEventListener('cart:change', onCart);
    return () => {
      window.removeEventListener('popstate', onPop);
      window.removeEventListener('cart:change', onCart);
    };
  }, []);

  const navigate = useCallback((to) => {
    window.history.pushState({}, '', to);
    setPath(to);
    window.scrollTo({ top: 0 });
  }, []);

  const detailMatch = path.match(/^\/shop\/([^/]+)\/?$/);
  const product = detailMatch ? getProduct(detailMatch[1]) : null;

  return (
    <div className="shop-root min-h-screen bg-cream font-body text-ink antialiased">
      <AnnounceBar />
      <ShopHeader count={count} subscriber={subscriber} navigate={navigate} />
      {detailMatch ? (
        <ProductDetail product={product} subscriber={subscriber} navigate={navigate} />
      ) : (
        <ShopListing subscriber={subscriber} navigate={navigate} />
      )}
      <ShopFooter navigate={navigate} />
    </div>
  );
}

/* =================================================================== Chrome */
function AnnounceBar() {
  return (
    <div className="bg-espresso text-cream">
      <p className="mx-auto max-w-6xl px-4 py-2 text-center font-heading text-[11px] font-medium uppercase tracking-[0.28em]">
        Freshly roasted in the Macedon Ranges · Complimentary shipping over $60
      </p>
    </div>
  );
}

function ShopHeader({ count, subscriber, navigate }) {
  return (
    <header className="sticky top-0 z-40 border-b border-maroon/10 bg-cream/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <a
          href="/"
          onClick={(e) => { e.preventDefault(); window.location.href = '/'; }}
          className="flex items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
        >
          <img src={LOGO} alt="Rafael's Coffee" className="h-11 w-11 rounded-full object-contain" />
          <span className="hidden font-heading text-base font-bold uppercase leading-none tracking-[0.2em] text-maroon sm:block">
            Rafael's<span className="block text-[10px] font-medium tracking-[0.3em] text-mid">Macedon Ranges</span>
          </span>
        </a>

        <nav className="hidden items-center gap-8 font-heading text-xs font-semibold uppercase tracking-[0.18em] text-ink/70 md:flex">
          <button onClick={() => navigate('/shop')} className="transition hover:text-maroon">Coffee</button>
          <a href="/subscribe" className="transition hover:text-maroon">Subscribe</a>
          <a href="/about" className="transition hover:text-maroon">Our Story</a>
        </nav>

        <div className="flex items-center gap-3">
          {subscriber && (
            <span className="hidden items-center gap-1.5 rounded-full border border-brass/40 bg-brass/10 px-3 py-1.5 font-heading text-[11px] font-semibold uppercase tracking-wider text-maroon sm:inline-flex">
              ★ Subscriber · {Math.round(SUBSCRIBER_DISCOUNT * 100)}% off
            </span>
          )}
          <button
            type="button"
            onClick={() => navigate('/shop')}
            aria-label={`Cart, ${count} items`}
            className="relative flex items-center gap-2 rounded-full bg-maroon px-4 py-2 font-heading text-xs font-semibold uppercase tracking-wider text-cream transition hover:bg-maroon-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
          >
            Cart
            <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-brass px-1.5 text-[11px] font-bold text-espresso">
              {count}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}

/* ================================================================== Listing */
function ShopListing({ subscriber, navigate }) {
  const [active, setActive] = useState('all');
  const visible = active === 'all' ? PRODUCTS : PRODUCTS.filter((p) => p.category === active);
  const placeholder = active === 'accessories' || active === 'classes';

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
    <section className="relative overflow-hidden bg-maroon text-cream">
      {/* soft radial glow */}
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{ background: 'radial-gradient(120% 80% at 15% 0%, rgba(176,137,91,0.22), transparent 60%)' }}
      />
      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <p className="font-heading text-xs font-semibold uppercase tracking-[0.35em] text-brass-soft">
            Lancefield · Victoria
          </p>
          <h1 className="mt-5 font-heading text-5xl font-extrabold uppercase leading-[0.95] tracking-tight sm:text-6xl">
            Coffee worth
            <span className="mt-1 block font-serif text-5xl font-normal italic tracking-normal text-brass-soft sm:text-6xl">
              slowing down for
            </span>
          </h1>
          <p className="mt-6 max-w-md text-base leading-relaxed text-cream/75">
            Roasted by hand in the Macedon Ranges, in small batches, the day it ships.
            Honest beans, ethically sourced, delivered on your rhythm.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              onClick={() => document.getElementById('coffee')?.scrollIntoView({ behavior: 'smooth' })}
              className="rounded-full bg-brass px-7 py-3.5 font-heading text-sm font-bold uppercase tracking-wider text-espresso transition hover:bg-brass-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cream"
            >
              Shop the coffee
            </button>
            <a
              href="/subscribe"
              className="rounded-full border border-cream/35 px-7 py-3.5 font-heading text-sm font-bold uppercase tracking-wider text-cream transition hover:border-cream hover:bg-cream/5"
            >
              Start a subscription
            </a>
          </div>

          <div className="mt-8 flex items-center gap-3 text-sm text-cream/70">
            <Stars value={4.9} />
            <span className="font-heading tracking-wide">4.9 · loved by 500+ locals</span>
          </div>
        </div>

        {/* Bag cluster */}
        <div className="relative mx-auto hidden h-[420px] w-full max-w-md items-center justify-center lg:flex">
          <div className="absolute left-2 top-10 w-40 -rotate-6 opacity-90">
            <CoffeeBag product={PRODUCTS[2]} />
          </div>
          <div className="absolute right-2 top-14 w-40 rotate-6 opacity-90">
            <CoffeeBag product={PRODUCTS[1]} />
          </div>
          <div className="relative z-10 w-48 drop-shadow-2xl">
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
        <h3 className="font-heading text-lg font-bold uppercase tracking-tight text-maroon">
          {product.name}
        </h3>
        <p className="mt-0.5 text-xs text-mid">{product.sub} · {product.weight}</p>
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
    <section className="bg-espresso text-cream">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div>
          <p className="font-heading text-xs font-semibold uppercase tracking-[0.35em] text-brass-soft">
            Never run out
          </p>
          <h2 className="mt-4 font-heading text-4xl font-extrabold uppercase leading-[0.95] tracking-tight sm:text-5xl">
            Subscribe &amp; save{' '}
            <span className="font-serif font-normal italic text-brass-soft">ten percent</span>
          </h2>
          <p className="mt-5 max-w-md text-cream/75">
            The freshest way to drink Rafael's. Delivered fortnightly, three-weekly or monthly —
            you stay in complete control. No lock-in, no fuss.
          </p>
          <a
            href="/subscribe"
            className="mt-8 inline-block rounded-full bg-brass px-7 py-3.5 font-heading text-sm font-bold uppercase tracking-wider text-espresso transition hover:bg-brass-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cream"
          >
            Explore subscriptions
          </a>
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          {steps.map(([n, title, sub]) => (
            <div key={n} className="rounded-2xl border border-cream/12 bg-cream/[0.04] p-5">
              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-brass/50 font-serif text-lg italic text-brass-soft">
                {n}
              </span>
              <p className="mt-4 font-heading text-base font-bold uppercase tracking-wide">{title}</p>
              <p className="mt-1.5 text-sm text-cream/65">{sub}</p>
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
            <blockquote className="mt-4 flex-1 font-serif text-lg italic leading-relaxed text-ink/85">
              “{quote}”
            </blockquote>
            <figcaption className="mt-5 font-heading text-sm font-bold uppercase tracking-wider text-maroon">
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
            {product.origin}
          </p>
          <h1 className="mt-3 font-heading text-5xl font-extrabold uppercase leading-none tracking-tight text-maroon">
            {product.name}
          </h1>
          <p className="mt-2 font-serif text-xl italic text-mid">{product.sub}</p>

          <div className="mt-4 flex items-center gap-2">
            <Stars value={product.rating} />
            <span className="text-sm text-mid">{product.rating} · {product.reviews} reviews</span>
          </div>

          <div className="mt-6">
            <PriceTag price={product.price} subscriber={subscriber} large />
          </div>

          <p className="mt-5 max-w-md leading-relaxed text-ink/80">{product.blurb}</p>

          <dl className="mt-7 grid grid-cols-3 gap-4 border-y border-maroon/10 py-6 text-sm">
            <Meta label="Origin" value={product.origin} />
            <Meta label="Roast" value={product.roast} />
            <Meta label="Format" value="Whole bean" />
          </dl>

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
          <div className="mt-8 rounded-2xl bg-porcelain p-6">
            <p className="font-heading text-xs font-semibold uppercase tracking-[0.2em] text-brass">Roaster's note</p>
            <p className="mt-2 font-serif text-base italic leading-relaxed text-ink/80">
              Roasted to order in Lancefield and rested, never rushed — so every bag reaches
              you at its sweetest. Best enjoyed within four weeks of the roast date on the base.
            </p>
          </div>
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
    <div className="rounded-2xl border border-dashed border-maroon/25 bg-porcelain px-6 py-20 text-center">
      <p className="font-serif text-sm italic text-brass">Just roasting the details</p>
      <p className="mt-2 font-heading text-3xl font-extrabold uppercase tracking-tight text-maroon">
        {label} — Coming Soon
      </p>
      <p className="mx-auto mt-3 max-w-md text-mid">{copy}</p>
    </div>
  );
}

function ShopFooter({ navigate }) {
  return (
    <footer className="bg-maroon text-cream">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:grid-cols-3 sm:px-6">
        <div>
          <div className="flex items-center gap-3">
            <img src={LOGO} alt="Rafael's Coffee" className="h-12 w-12 rounded-full object-contain" />
            <span className="font-heading text-lg font-bold uppercase tracking-[0.2em]">Rafael's Coffee</span>
          </div>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-cream/70">
            Small-batch specialty coffee, roasted by hand in Lancefield in the heart of the
            Macedon Ranges.
          </p>
        </div>
        <div>
          <p className="font-heading text-xs font-semibold uppercase tracking-[0.25em] text-brass-soft">Shop</p>
          <ul className="mt-4 space-y-2.5 text-sm text-cream/75">
            <li><button onClick={() => navigate('/shop')} className="transition hover:text-cream">All coffee</button></li>
            <li><a href="/subscribe" className="transition hover:text-cream">Subscriptions</a></li>
            <li><a href="/portal" className="transition hover:text-cream">Manage my account</a></li>
          </ul>
        </div>
        <div>
          <p className="font-heading text-xs font-semibold uppercase tracking-[0.25em] text-brass-soft">Visit</p>
          <ul className="mt-4 space-y-2.5 text-sm text-cream/75">
            <li>Lancefield, VIC 3435</li>
            <li><a href="https://rafaelscoffee.com.au" target="_blank" rel="noreferrer" className="underline decoration-brass underline-offset-2 hover:text-cream">rafaelscoffee.com.au</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-cream/12">
        <p className="mx-auto max-w-6xl px-4 py-5 text-center font-heading text-[11px] uppercase tracking-[0.28em] text-cream/50 sm:px-6">
          © Rafael's Coffee · Macedon Ranges Roastery
        </p>
      </div>
    </footer>
  );
}
