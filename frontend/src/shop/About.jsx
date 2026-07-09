import { Eyebrow, SectionHeading, BTN_PRIMARY, BTN_OUTLINE } from './ui';

// Content from rafaelscoffee.com.au/about
const DIFFERENCES = [
  ['Roasted to order', 'We roast strictly to order to a medium level — preserving the 850 flavour components, oils and subtle nuances of every bean.'],
  ['Rotating single origins', 'We periodically source single-origin beans from different regions and growers around the world, rotating our selection roughly every three months.'],
  ['Fresh every Thursday', 'Roasting happens every Thursday. Collect from our Lancefield roastery or one of five local farmers’ markets — with free local delivery and postal options too.'],
];

const MARKETS = ['Woodend', 'Kyneton', 'Riddells Creek', 'Lancefield', 'Macedon'];

export default function About({ navigate }) {
  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden bg-cream">
        <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(80% 65% at 82% 5%, rgba(64,32,32,0.06), transparent 60%)' }} />
        <div className="relative mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 sm:py-24">
          <Eyebrow>Macedon Ranges · Since 2012</Eyebrow>
          <h1 className="mt-4 font-heading text-5xl font-extrabold uppercase leading-[0.95] tracking-tight text-ink sm:text-6xl">
            About<span className="font-serif font-normal normal-case italic text-maroon"> us</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-ink/70">
            Rafael's Coffee is a boutique, small-batch roaster in the Macedon Ranges — ethically
            sourcing beans from around the world and roasting them to order for superior freshness,
            sustainable sourcing and genuine, personal service.
          </p>
        </div>
      </section>

      {/* Origins */}
      <section className="border-y border-maroon/10 bg-stone">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="mx-auto w-full max-w-xs">
            <img src="/Rafaels_Coffee_logo-rnd.png" alt="Rafael's Coffee" className="mx-auto w-48 drop-shadow-xl" />
          </div>
          <div>
            <Eyebrow>Our origins</Eyebrow>
            <h2 className="mt-2 font-heading text-4xl font-extrabold uppercase leading-none tracking-tight text-ink sm:text-5xl">
              A viticulturist's <span className="font-serif font-normal normal-case italic text-maroon">side obsession</span>
            </h2>
            <p className="mt-5 max-w-xl leading-relaxed text-ink/75">
              Founder Rafael Fabris was working as a viticulturist in central Victoria when his
              passion for coffee took hold. He set up a boutique roastery to share freshly roasted,
              carefully sourced beans with fellow enthusiasts — and hasn't looked back since.
            </p>
          </div>
        </div>
      </section>

      {/* Why we're different */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <SectionHeading eyebrow="Why we're different" title="Roasted with" italic="intention" />
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {DIFFERENCES.map(([title, body]) => (
            <div key={title} className="rounded-2xl border border-maroon/10 bg-white p-7">
              <h3 className="font-heading text-lg font-bold uppercase tracking-wide text-ink">{title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-ink/70">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Where to find us */}
      <section className="border-y border-maroon/10 bg-stone">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 sm:py-20">
          <Eyebrow>Where to find us</Eyebrow>
          <h2 className="mt-2 font-heading text-4xl font-extrabold uppercase leading-none tracking-tight text-ink sm:text-5xl">
            At the roastery <span className="font-serif font-normal normal-case italic text-maroon">&amp; the markets</span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl leading-relaxed text-ink/75">
            Collect from our Lancefield roastery, or catch us at these local farmers' markets.
            Free local delivery and postal options are available too.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2.5">
            {MARKETS.map((m) => (
              <span key={m} className="rounded-full border border-maroon/20 bg-white px-4 py-2 font-heading text-xs font-semibold uppercase tracking-wider text-maroon">{m}</span>
            ))}
          </div>
          <p className="mx-auto mt-8 max-w-xl text-sm text-mid">
            We also supply Expobar &amp; Crem espresso machines and Macap grinders — ask us about kitting out your café or home setup.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 sm:py-20">
        <h2 className="font-heading text-4xl font-extrabold uppercase leading-none tracking-tight text-ink sm:text-5xl">
          Taste the <span className="font-serif font-normal normal-case italic text-maroon">difference</span>
        </h2>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button onClick={() => navigate('/shop')} className={BTN_PRIMARY}>Shop the coffee</button>
          <a href="/subscribe" className={BTN_OUTLINE}>Start a subscription</a>
        </div>
      </section>
    </main>
  );
}
