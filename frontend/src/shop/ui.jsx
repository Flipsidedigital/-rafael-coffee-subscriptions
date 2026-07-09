// Shared Tailwind UI for the premium shop + subscription pages.
// Both Shop.jsx and SubscribeWizard.jsx import from here so the two flows use
// the exact same components, palette and control styling.

import { useState } from 'react';
import { formatPrice, subscriberPrice } from './products';

const LOGO = '/Rafaels_Coffee_logo-rnd.png';

/* ---- reusable control class tokens (the "same components" across pages) ---- */
const BTN_BASE =
  'inline-flex items-center justify-center gap-2 rounded-full font-heading text-sm font-bold uppercase tracking-wider transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass focus-visible:ring-offset-2 focus-visible:ring-offset-cream disabled:cursor-not-allowed disabled:opacity-40';

export const BTN_PRIMARY = `${BTN_BASE} bg-maroon px-7 py-3.5 text-cream hover:bg-maroon-light`;
export const BTN_BRASS = `${BTN_BASE} bg-brass px-7 py-3.5 text-espresso hover:bg-brass-soft`;
export const BTN_OUTLINE = `${BTN_BASE} border border-maroon/25 px-7 py-3.5 text-maroon hover:border-maroon/60 hover:bg-maroon/5`;
export const BTN_GHOST =
  'inline-flex items-center gap-1.5 font-heading text-xs font-semibold uppercase tracking-[0.18em] text-mid transition hover:text-maroon focus-visible:outline-none';

export const FIELD =
  'w-full rounded-xl border border-maroon/15 bg-white px-4 py-3 text-ink transition placeholder:text-mid/50 focus:border-maroon/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass/40';
export const LABEL =
  'mb-1.5 block font-heading text-[11px] font-semibold uppercase tracking-[0.15em] text-mid';

/* -------------------------------------------------------------- components */
export function Eyebrow({ children, className = '' }) {
  return (
    <p className={`font-heading text-xs font-semibold uppercase tracking-[0.35em] text-brass ${className}`}>
      {children}
    </p>
  );
}

export function SectionHeading({ eyebrow, title, italic, align = 'center' }) {
  return (
    <div className={align === 'center' ? 'text-center' : ''}>
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <h2 className="mt-2 font-heading text-4xl font-extrabold uppercase leading-none tracking-tight text-ink sm:text-5xl">
        {title}{' '}
        {italic && <span className="font-serif text-4xl font-normal normal-case italic tracking-normal text-maroon sm:text-5xl">{italic}</span>}
      </h2>
    </div>
  );
}

export function Stars({ value = 5, small }) {
  const full = Math.round(value);
  const size = small ? 'text-xs' : 'text-sm';
  return (
    <span className={`inline-flex tracking-tight text-brass ${size}`} aria-label={`${value} out of 5 stars`}>
      {'★★★★★'.split('').map((s, i) => (
        <span key={i} className={i < full ? '' : 'text-brass/25'}>★</span>
      ))}
    </span>
  );
}

export function PriceTag({ price, subscriber, large }) {
  const size = large ? 'text-3xl' : 'text-lg';
  if (subscriber) {
    return (
      <span className="flex items-baseline gap-2">
        <span className={`font-heading font-extrabold text-maroon ${size}`}>{formatPrice(subscriberPrice(price))}</span>
        <span className="text-xs text-mid line-through">{formatPrice(price)}</span>
      </span>
    );
  }
  return <span className={`font-heading font-extrabold text-maroon ${size}`}>{formatPrice(price)}</span>;
}

// Real product photo (black Rafael's pouch on white). Images live in
// public/products/<id>.png — the pouch's own white background blends with the
// white card, so object-contain letterboxing is invisible. Named CoffeeBag for
// backwards-compat with existing imports across Shop + SubscribeWizard.
export function CoffeeBag({ product }) {
  const [err, setErr] = useState(false);
  const src = product.image || `/products/${product.id}.png`;
  const cover = product.fit === 'cover';
  return (
    <div className="flex aspect-[4/5] w-full items-center justify-center overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm">
      {err ? (
        <img src={LOGO} alt={product.name} className="h-1/3 w-1/3 object-contain opacity-60" />
      ) : (
        <img
          src={src}
          alt={product.name}
          loading="lazy"
          onError={() => setErr(true)}
          className={cover ? 'h-full w-full object-cover' : 'h-full w-full object-contain p-2'}
        />
      )}
    </div>
  );
}
