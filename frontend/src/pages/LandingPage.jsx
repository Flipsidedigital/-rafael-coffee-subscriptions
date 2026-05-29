import './LandingPage.css'

const features = [
  { icon: '☕', title: 'Freshly Roasted', desc: 'Every bag roasted to order in Lancefield and dispatched within 48 hours.' },
  { icon: '🔄', title: 'Flexible Deliveries', desc: 'Weekly, fortnightly, or monthly — pause, skip or swap anytime.' },
  { icon: '🌱', title: 'Single Origin', desc: 'Traceable beans from small farms. Know exactly where your coffee comes from.' },
]

const testimonials = [
  { quote: 'The best coffee I\'ve ever had delivered to my door. Rafael\'s roasting is exceptional.', name: 'Sarah M.', suburb: 'Woodend' },
  { quote: 'Being able to pause when we travel is a game changer. Love the flexibility.', name: 'James T.', suburb: 'Kyneton' },
]

export default function LandingPage({ onSubscribe }) {
  return (
    <div className="landing">

      {/* Nav */}
      <nav className="landing-nav">
        <div className="nav-logo">
          <span className="logo-mark">RC</span>
          <span className="logo-text">Rafael's Coffee</span>
        </div>
        <button className="btn-primary" onClick={onSubscribe}>Subscribe Now</button>
      </nav>

      {/* Hero */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-eyebrow">Lancefield, Victoria · Est. 2018</div>
          <h1 className="hero-title">
            Coffee worth<br />
            <em>looking forward to</em>
          </h1>
          <p className="hero-subtitle">
            A weekly ritual. Freshly roasted single-origin beans, delivered to your door on your schedule. Cancel anytime.
          </p>
          <div className="hero-actions">
            <button className="btn-primary hero-cta" onClick={onSubscribe}>
              Start Your Subscription →
            </button>
            <span className="hero-note">From $18 / delivery · No lock-in</span>
          </div>
        </div>
        <div className="hero-visual">
          <div className="hero-card">
            <div className="hero-card-inner">
              <div className="bean-graphic">
                <div className="bean b1" />
                <div className="bean b2" />
                <div className="bean b3" />
              </div>
              <div className="hero-card-label">
                <span className="card-roast">Medium Roast</span>
                <span className="card-origin">Ethiopia Yirgacheffe</span>
                <span className="card-notes">Blueberry · Jasmine · Dark Chocolate</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features">
        <div className="features-inner">
          {features.map(f => (
            <div className="feature-card" key={f.title}>
              <span className="feature-icon">{f.icon}</span>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="how-it-works">
        <div className="section-inner">
          <h2 className="section-title">How it works</h2>
          <div className="steps">
            {[
              { n: '01', title: 'Choose your coffee', desc: 'Browse our single-origin range and pick your roast.' },
              { n: '02', title: 'Set your frequency', desc: 'Weekly, fortnightly, or monthly — whatever suits you.' },
              { n: '03', title: 'We roast & deliver', desc: 'Fresh beans dispatched straight to your door.' },
            ].map(s => (
              <div className="step" key={s.n}>
                <span className="step-number">{s.n}</span>
                <h4 className="step-title">{s.title}</h4>
                <p className="step-desc">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="testimonials">
        <div className="section-inner">
          <h2 className="section-title">What our subscribers say</h2>
          <div className="testimonial-grid">
            {testimonials.map(t => (
              <div className="testimonial" key={t.name}>
                <p className="testimonial-quote">"{t.quote}"</p>
                <div className="testimonial-author">
                  <span className="author-name">{t.name}</span>
                  <span className="author-suburb">{t.suburb}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bottom-cta">
        <div className="section-inner cta-inner">
          <h2 className="cta-title">Ready to start your ritual?</h2>
          <p className="cta-subtitle">Join subscribers across Central Victoria getting fresh coffee every delivery.</p>
          <button className="btn-primary" onClick={onSubscribe}>Subscribe Now →</button>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-inner">
          <span>© 2026 Rafael's Coffee · Lancefield, VIC</span>
          <span>rafaelscoffee.com.au</span>
        </div>
      </footer>

    </div>
  )
}
