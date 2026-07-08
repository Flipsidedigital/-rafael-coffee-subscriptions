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

const LOGO = '/Rafaels_Coffee_logo-rnd.png';

/* ---------------------------------------------------------------- Shop root */
export default function Shop() {
  const [path, setPath] = useState(window.location.pathname);
  const [count, setCount] = useState(cartCount());
  const subscriber = isSubscriber();

  // Keep in sync with browser back/forward and cart updates.
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
    <div className="font-body min-h-screen bg-stone text-ink">
      <ShopHeader count={count} subscriber={subscriber} navigate={navigate} />
      {detailMatch ? (
        <ProductDetail product={product} subscriber={subscriber} navigate={navigate} />
      ) : (
        <ShopListing subscriber={subscriber} navigate={navigate} />
      )}
      <ShopFooter />
    </div>
  );
}

/* -------------------------------------------------------------------- Header */
function ShopHeader({ count, subscriber, navigate }) {
  return (
    <header className="sticky top-0 z-30 border-b border-maroon/10 bg-stone/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <a
          href="/"
          className="flex items-center gap-3"
          onClick={(e) => {
            e.preventDefault();
            window.location.href = '/';
          }}
        >
          <img src={LOGO} alt="Rafael's Coffee" className="h-11 w-11 rounded-full object-contain" />
          <span className="font-heading text-lg font-bold uppercase tracking-widest text-maroon">
            Shop
          </span>
        </a>

        <div className="flex items-center gap-3">
          {subscriber && (
            <span className="hidden items-center gap-1.5 rounded-full bg-maroon px-3 py-1.5 font-heading text-xs font-semibold uppercase tracking-wider text-stone sm:inline-flex">
              ★ Subscriber · {Math.round(SUBSCRIBER_DISCOUNT * 100)}% off
            </span>
          )}
          <button
            type="button"
            onClick={() => navigate('/shop')}
            className="relative flex items-center gap-2 rounded-full border border-maroon/25 px-4 py-2 font-heading text-xs font-semibold uppercase tracking-wider text-maroon transition hover:bg-maroon hover:text-stone"
          >
            Cart
            <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-maroon px-1.5 text-[11px] font-bold text-stone">
              {count}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------- Listing */
function ShopListing({ subscriber, navigate }) {
  const [active, setActive] = useState('all');

  const visible =
    active === 'all'
      ? PRODUCTS
      : PRODUCTS.filter((p) => p.category === active);

  const placeholderCategory = active === 'accessories' || active === 'classes';

  return (
    <main className="mx-auto max-w-6xl px-4 pb-20 pt-10 sm:px-6">
      {/* Hero */}
      <section className="mb-10 text-center">
        <p className="font-heading text-sm font-semibold uppercase tracking-[0.3em] text-mid">
          Rafael's Coffee
        </p>
        <h1 className="mt-2 font-heading text-4xl font-extrabold uppercase tracking-tight text-maroon sm:text-5xl">
          The Shop
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-mid">
          Freshly roasted in Lancefield. Grab a bag, browse the gear, or book a class.
        </p>
      </section>

      {/* Category tabs */}
      <div className="mb-8 flex flex-wrap justify-center gap-2">
        {CATEGORIES.map((c) => {
          const isActive = active === c.key;
          return (
            <button
              key={c.key}
              type="button"
              onClick={() => setActive(c.key)}
              className={
                'rounded-full px-5 py-2 font-heading text-sm font-semibold uppercase tracking-wider transition ' +
                (isActive
                  ? 'bg-maroon text-stone'
                  : 'border border-maroon/25 text-maroon hover:bg-maroon/5')
              }
            >
              {c.label}
            </button>
          );
        })}
      </div>

      {/* Grid / placeholder */}
      {placeholderCategory ? (
        <ComingSoon category={active} />
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              subscriber={subscriber}
              navigate={navigate}
            />
          ))}
        </div>
      )}
    </main>
  );
}

/* --------------------------------------------------------------- Product card */
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
    <article
      onClick={() => navigate(href)}
      className="group flex cursor-pointer flex-col overflow-hidden rounded-xl border border-maroon/10 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
    >
      <ImagePlaceholder name={product.name} />
      <div className="flex flex-1 flex-col p-5">
        <p className="font-heading text-xs font-semibold uppercase tracking-widest text-mid">
          {product.sub} · {product.weight}
        </p>
        <h3 className="mt-1 font-heading text-xl font-bold uppercase tracking-tight text-maroon">
          {product.name}
        </h3>
        <p className="mt-2 flex-1 text-sm text-ink/70">{product.blurb}</p>

        <div className="mt-4 flex items-end justify-between">
          <PriceTag price={product.price} subscriber={subscriber} />
          <button
            type="button"
            onClick={onAdd}
            className={
              'rounded-full px-4 py-2 font-heading text-xs font-bold uppercase tracking-wider transition ' +
              (added
                ? 'bg-green-700 text-white'
                : 'bg-maroon text-stone hover:bg-maroon-light')
            }
          >
            {added ? 'Added ✓' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </article>
  );
}

/* ------------------------------------------------------------- Product detail */
function ProductDetail({ product, subscriber, navigate }) {
  const [added, setAdded] = useState(false);

  if (!product) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-24 text-center">
        <h1 className="font-heading text-3xl font-bold uppercase text-maroon">
          Product not found
        </h1>
        <button
          type="button"
          onClick={() => navigate('/shop')}
          className="mt-6 rounded-full bg-maroon px-6 py-3 font-heading text-sm font-bold uppercase tracking-wider text-stone hover:bg-maroon-light"
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
        type="button"
        onClick={() => navigate('/shop')}
        className="mb-6 font-heading text-xs font-semibold uppercase tracking-wider text-mid hover:text-maroon"
      >
        ← Back to shop
      </button>

      <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
        <div className="overflow-hidden rounded-2xl border border-maroon/10 bg-white">
          <ImagePlaceholder name={product.name} large />
        </div>

        <div className="flex flex-col">
          <p className="font-heading text-sm font-semibold uppercase tracking-[0.25em] text-mid">
            {product.sub} · {product.weight}
          </p>
          <h1 className="mt-1 font-heading text-4xl font-extrabold uppercase tracking-tight text-maroon">
            {product.name}
          </h1>

          <div className="mt-4">
            <PriceTag price={product.price} subscriber={subscriber} large />
          </div>

          <p className="mt-5 text-ink/80">{product.blurb}</p>

          <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-maroon/10 pt-6 text-sm">
            <Meta label="Origin" value={product.origin} />
            <Meta label="Roast" value={product.roast} />
          </dl>

          {product.notes?.length > 0 && (
            <div className="mt-6">
              <p className="font-heading text-xs font-semibold uppercase tracking-widest text-mid">
                Tasting notes
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {product.notes.map((n) => (
                  <span
                    key={n}
                    className="rounded-full bg-maroon/8 px-3 py-1 text-xs font-medium text-maroon"
                  >
                    {n}
                  </span>
                ))}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={onAdd}
            className={
              'mt-8 w-full rounded-full px-6 py-4 font-heading text-sm font-bold uppercase tracking-widest transition sm:w-auto ' +
              (added
                ? 'bg-green-700 text-white'
                : 'bg-maroon text-stone hover:bg-maroon-light')
            }
          >
            {added ? 'Added to cart ✓' : 'Add to Cart'}
          </button>

          {!subscriber && (
            <p className="mt-4 text-sm text-mid">
              ☕ Subscribers save {Math.round(SUBSCRIBER_DISCOUNT * 100)}% on every order.{' '}
              <a href="/portal" className="font-semibold text-maroon underline">
                Log in
              </a>
              .
            </p>
          )}
        </div>
      </div>
    </main>
  );
}

/* ---------------------------------------------------------------- Small parts */
function PriceTag({ price, subscriber, large }) {
  const size = large ? 'text-3xl' : 'text-xl';
  if (subscriber) {
    return (
      <div className="flex items-baseline gap-2">
        <span className={`font-heading font-extrabold text-maroon ${size}`}>
          {formatPrice(subscriberPrice(price))}
        </span>
        <span className="text-sm text-mid line-through">{formatPrice(price)}</span>
        <span className="rounded bg-maroon px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-stone">
          Sub
        </span>
      </div>
    );
  }
  return (
    <span className={`font-heading font-extrabold text-maroon ${size}`}>
      {formatPrice(price)}
    </span>
  );
}

function Meta({ label, value }) {
  return (
    <div>
      <dt className="font-heading text-xs font-semibold uppercase tracking-widest text-mid">
        {label}
      </dt>
      <dd className="mt-1 text-ink/80">{value}</dd>
    </div>
  );
}

function ImagePlaceholder({ name, large }) {
  return (
    <div
      className={
        'flex w-full items-center justify-center bg-gradient-to-br from-maroon to-maroon-light ' +
        (large ? 'aspect-square' : 'aspect-[4/3]')
      }
    >
      <img
        src={LOGO}
        alt={name}
        className={large ? 'h-40 w-40 opacity-90' : 'h-24 w-24 opacity-90'}
      />
    </div>
  );
}

function ComingSoon({ category }) {
  const label = category === 'accessories' ? 'Accessories' : 'Training Classes';
  return (
    <div className="rounded-2xl border border-dashed border-maroon/25 bg-white/50 px-6 py-20 text-center">
      <p className="font-heading text-2xl font-bold uppercase tracking-tight text-maroon">
        {label} — Coming Soon
      </p>
      <p className="mx-auto mt-3 max-w-md text-mid">
        {category === 'accessories'
          ? "We're stocking the shelves with mugs, gear and merch. Check back soon."
          : "Hands-on brewing and barista classes are on the way. Check back soon."}
      </p>
    </div>
  );
}

function ShopFooter() {
  return (
    <footer className="border-t border-maroon/10 bg-stone-dark/40">
      <div className="mx-auto max-w-6xl px-6 py-8 text-center font-heading text-xs uppercase tracking-widest text-mid">
        Rafael's Coffee · Lancefield, VIC
      </div>
    </footer>
  );
}
