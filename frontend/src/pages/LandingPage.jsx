import './LandingPage.css'

const blends = [
  { id: 'onesto', name: 'The Onesto', sub: '100% Arabica', desc: 'Colombia · Mexico · Ethiopia · India Arabica', type: 'blend' },
  { id: 'ipanema', name: 'The Ipanema', sub: '100% Arabica', desc: 'Brazil · Mexico · Sumatra', type: 'blend' },
  { id: 'llaneros', name: 'The Llaneros', sub: '85% Arabica · 15% Robusta', desc: 'Colombia · Brazil · PNG · India Robusta', type: 'blend' },
  { id: 'calabrian', name: 'The Calabrian', sub: '80% Arabica · 20% Robusta', desc: 'Brazil · India Arabica · India Robusta', type: 'blend' },
  { id: 'equinox', name: 'The Equinox', sub: '100% Arabica', desc: 'Seasonal autumn blend', type: 'blend' },
  { id: 'decaf', name: 'Mexico Decaf', sub: 'Swiss Water Process · Organic', desc: 'Full flavour without the caffeine', type: 'decaf' },
]

const singles = [
  { id: 'guatemala', name: 'Guatemala Antigua', sub: 'Single Origin', desc: 'Seasonal — rotating every ~3 months', type: 'single' },
  { id: 'peru', name: 'Peru Aprocassi', sub: 'Single Origin · Organic', desc: 'Seasonal — rotating every ~3 months', type: 'single' },
]

export default function LandingPage({ onSubscribe }) {
  return (
    <div className="landing">

      {/* Announcement bar */}
      <div className="announce-bar">
        We roast to order Thursdays. For guaranteed dispatch/delivery COB Friday, please order by Wednesday 5pm.
      </div>

      {/* Nav */}
      <nav className="landing-nav">
        <div className="nav-logo">
          <img src="/Rafaels_Coffee_logo-with-ESB.png" alt="Rafael's Coffee" className="logo-img" />
        </div>
        <div className="nav-center">
          <span className="nav-tagline">Artisan Coffee of the Macedon Ranges</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <a href="/shop" className="btn-ghost">Shop</a>
          <button className="btn-primary" onClick={onSubscribe}>Subscribe</button>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-eyebrow">Established 2012 · Lancefield, Victoria</div>
          <h1 className="hero-title">
            SPECIALTY<br />
            GRADE BEANS<br />
            <em>delivered fresh</em>
          </h1>
          <p className="hero-subtitle">
            Small batch, freshly roasted to order. Subscribe and receive Rafael's Coffee on your schedule — fortnightly, three-weekly or monthly.
          </p>
          <div className="hero-actions">
            <button className="btn-primary hero-cta" onClick={onSubscribe}>Start Your Subscription</button>
            <span className="hero-note">From $18 · No lock-in · Pause anytime</span>
          </div>
        </div>
        <div className="hero-visual">
          <img src="/Rafaels_Coffee_logo-rnd.png" alt="Rafael's Coffee" className="hero-round-logo" />
        </div>
      </section>

      {/* Why subscribe */}
      <section className="why">
        <div className="why-inner">
          {[
            { icon: '☕', title: 'Roasted to Order', desc: 'Every batch roasted Thursdays and dispatched Friday — as fresh as it gets.' },
            { icon: '🔄', title: 'Flexible Schedule', desc: 'Fortnightly, three-weekly, or monthly. Pause, skip or cancel anytime.' },
            { icon: '🏆', title: 'Award Winning', desc: 'Winner — Macedon Ranges Business Excellence Awards 2024.' },
          ].map(f => (
            <div className="why-card" key={f.title}>
              <span className="why-icon">{f.icon}</span>
              <h3 className="why-title">{f.title}</h3>
              <p className="why-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Blends */}
      <section className="products">
        <div className="products-inner">
          <div className="section-label">Our Blends</div>
          <h2 className="section-heading">SUBSCRIBE TO YOUR BLEND</h2>
          <p className="section-sub">All blends from $18 / 250g · $30 / 500g · $55 / 1kg</p>
          <div className="product-grid">
            {blends.map(p => (
              <div className="product-card" key={p.id}>
                <div className="product-bag">
                  <div className="bag-label">
                    <img src="/Rafaels_Coffee_logo-rnd.png" alt="" className="bag-logo" />
                    <span className="bag-name">{p.name.toUpperCase()}</span>
                  </div>
                </div>
                <div className="product-info">
                  <div className="product-type">{p.type === 'decaf' ? 'Decaf' : 'Blend'}</div>
                  <div className="product-name">{p.name}</div>
                  <div className="product-sub">{p.sub}</div>
                  <div className="product-desc">{p.desc}</div>
                  <div className="product-price">
                    {p.type === 'decaf' ? 'From $20' : 'From $18'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Single Origins */}
      <section className="singles">
        <div className="products-inner">
          <div className="section-label">Seasonal</div>
          <h2 className="section-heading">SINGLE ORIGINS</h2>
          <p className="section-sub">Rotating seasonal selections · From $20 / 250g · $35 / 500g · $60 / 1kg</p>
          <div className="singles-grid">
            {singles.map(p => (
              <div className="single-card" key={p.id}>
                <div className="single-name">{p.name}</div>
                <div className="single-sub">{p.sub}</div>
                <div className="single-desc">{p.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="how">
        <div className="how-inner">
          <div className="section-label light">Simple</div>
          <h2 className="section-heading light">HOW IT WORKS</h2>
          <div className="steps">
            {[
              { n: '01', title: 'Choose Your Coffee', desc: 'Pick your blend or single origin, your bag size, and how often you want it.' },
              { n: '02', title: 'We Roast Thursday', desc: 'Your order is freshly roasted to order every Thursday in Lancefield.' },
              { n: '03', title: 'Delivered Friday', desc: 'Dispatched COB Friday, arriving at your door ready to brew.' },
            ].map(s => (
              <div className="step" key={s.n}>
                <span className="step-n">{s.n}</span>
                <h4 className="step-title">{s.title}</h4>
                <p className="step-desc">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="cta-inner">
          <div className="section-label">Start Today</div>
          <h2 className="cta-heading">FRESH COFFEE.<br />YOUR SCHEDULE.</h2>
          <button className="btn-primary cta-btn" onClick={onSubscribe}>Subscribe Now</button>
          <p className="cta-note">No lock-in contract · Pause or cancel anytime · Roasted to order</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-inner">
          <img src="/Rafaels_Coffee_logo-rnd.png" alt="Rafael's Coffee" className="footer-logo" />
          <div className="footer-links">
            <a href="https://rafaelscoffee.com.au" target="_blank" rel="noreferrer">rafaelscoffee.com.au</a>
            <span>·</span>
            <span>Lancefield, VIC</span>
            <span>·</span>
            <span>Est. 2012</span>
          </div>
          <span className="footer-copy">© 2026 Rafael's Coffee</span>
        </div>
      </footer>

    </div>
  )
}
