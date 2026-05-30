import { useState, useEffect, useRef } from 'react'
import './SubscribeWizard.css'

const API_URL = import.meta.env.VITE_API_URL || 'https://rafael-coffee-subscriptions-production.up.railway.app'
const SQUARE_APP_ID = import.meta.env.VITE_SQUARE_APPLICATION_ID || ''
const SQUARE_LOCATION_ID = import.meta.env.VITE_SQUARE_LOCATION_ID || ''

const PRODUCTS = [
  { id: 'onesto', name: 'The Onesto', sub: '100% Arabica', desc: 'Colombia · Mexico · Ethiopia · India Arabica', type: 'blend', price250: 18, price500: 30, price1kg: 55 },
  { id: 'ipanema', name: 'The Ipanema', sub: '100% Arabica', desc: 'Brazil · Mexico · Sumatra', type: 'blend', price250: 18, price500: 30, price1kg: 55 },
  { id: 'llaneros', name: 'The Llaneros', sub: '85% Arabica · 15% Robusta', desc: 'Colombia · Brazil · PNG · India Robusta', type: 'blend', price250: 18, price500: 30, price1kg: 55 },
  { id: 'calabrian', name: 'The Calabrian', sub: '80% Arabica · 20% Robusta', desc: 'Brazil · India Arabica · India Robusta', type: 'blend', price250: 18, price500: 30, price1kg: 55 },
  { id: 'equinox', name: 'The Equinox', sub: '100% Arabica', desc: 'Seasonal autumn blend', type: 'blend', price250: 18, price500: 30, price1kg: 55 },
  { id: 'guatemala', name: 'Guatemala Antigua', sub: 'Single Origin', desc: 'Seasonal · rotating every ~3 months', type: 'single', price250: 20, price500: 35, price1kg: 60 },
  { id: 'peru', name: 'Peru Aprocassi Organic', sub: 'Single Origin · Organic', desc: 'Seasonal · rotating every ~3 months', type: 'single', price250: 20, price500: 35, price1kg: 60 },
  { id: 'decaf', name: 'Mexico Decaf', sub: 'Swiss Water Process · Organic', desc: 'Full flavour without the caffeine', type: 'decaf', price250: 20, price500: 35, price1kg: 60 },
]

const FREQUENCIES = [
  { id: 'fortnightly', label: 'Fortnightly', desc: 'Every two weeks', badge: 'Most popular' },
  { id: 'three-weekly', label: 'Three Weekly', desc: 'Every three weeks', badge: null },
  { id: 'monthly', label: 'Monthly', desc: 'Once a month', badge: 'Best value' },
]

const SIZES = [
  { id: '250', label: '250g', desc: '~2–3 weeks for 1 person' },
  { id: '500', label: '500g', desc: 'Great for couples' },
  { id: '1000', label: '1kg', desc: 'For the serious drinker' },
]

const TYPE_LABELS = { blend: 'Blend', single: 'Single Origin', decaf: 'Decaf' }

function loadSquareScript() {
  return new Promise((resolve, reject) => {
    if (window.Square) return resolve()
    const script = document.createElement('script')
    script.src = 'https://sandbox.web.squarecdn.com/v1/square.js'
    script.onload = resolve
    script.onerror = reject
    document.head.appendChild(script)
  })
}

function SquareCardForm({ tokenizeRef, submitting }) {
  const cardInstanceRef = useRef(null)
  const [cardReady, setCardReady] = useState(false)
  const [cardError, setCardError] = useState(null)

  useEffect(() => {
    async function initSquare() {
      try {
        await loadSquareScript()
        if (!window.Square) throw new Error('Square SDK not loaded')
        const payments = window.Square.payments(SQUARE_APP_ID, SQUARE_LOCATION_ID)
        const card = await payments.card({
          style: {
            input: { fontFamily: '"Barlow", sans-serif', fontSize: '15px', color: '#262626' },
            '.input-container': { borderColor: 'rgba(38,38,38,0.15)', borderRadius: '2px' },
            '.input-container.is-focus': { borderColor: '#402020' },
            '.input-container.is-error': { borderColor: '#c0392b' },
          }
        })
        await card.attach('#square-card-element')
        cardInstanceRef.current = card
        setCardReady(true)

        // Expose tokenize to parent
        tokenizeRef.current = async () => {
          const result = await card.tokenize()
          if (result.status === 'OK') return result.token
          throw new Error(result.errors?.map(e => e.message).join(', ') || 'Card error')
        }
      } catch (err) {
        console.error('Square init error:', err)
        setCardError('Unable to load payment form. Please refresh and try again.')
      }
    }
    initSquare()
    return () => { cardInstanceRef.current?.destroy().catch(console.error) }
  }, [])

  return (
    <div className="square-card-wrapper">
      {cardError && <div className="form-error">{cardError}</div>}
      <div id="square-card-element" className="square-card-element" />
      {!cardReady && !cardError && <div className="card-loading">Loading secure payment form...</div>}
    </div>
  )
}

export default function SubscribeWizard({ onBack }) {
  const [step, setStep] = useState(1)
  const [selection, setSelection] = useState({ product: null, frequency: null, size: '250' })
  const [details, setDetails] = useState({ firstName: '', lastName: '', email: '', phone: '', address1: '', suburb: '', state: 'VIC', postcode: '' })
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all')
  const tokenizeRef = useRef(null)

  const selectedProduct = PRODUCTS.find(p => p.id === selection.product)
  const priceKey = selection.size === '1000' ? 'price1kg' : selection.size === '500' ? 'price500' : 'price250'
  const price = selectedProduct ? selectedProduct[priceKey] : null
  const filteredProducts = filter === 'all' ? PRODUCTS : PRODUCTS.filter(p => p.type === filter)
  const canProceedStep1 = selection.product && selection.frequency && selection.size
  const canProceedStep2 = details.firstName && details.lastName && details.email && details.address1 && details.suburb && details.postcode

  async function handleSubmit() {
    setSubmitting(true)
    setError(null)
    try {
      if (!tokenizeRef.current) throw new Error('Payment form not ready. Please wait a moment.')
      const cardToken = await tokenizeRef.current()

      // Register customer
      const registerRes = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: details.email,
          password: crypto.randomUUID(),
          first_name: details.firstName,
          last_name: details.lastName,
          phone: details.phone || null,
        })
      })
      const authData = await registerRes.json()
      if (!authData.token) throw new Error(authData.error || 'Account creation failed')

      // Create subscription
      const subRes = await fetch(`${API_URL}/api/subscriptions/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authData.token}` },
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
        })
      })
      if (!subRes.ok) {
        const err = await subRes.json()
        throw new Error(err.error || 'Subscription creation failed')
      }
      setSuccess(true)
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="wizard">
        <div className="wizard-success">
          <img src="/Rafaels_Coffee_logo-with-ESB.png" alt="Rafael's Coffee" className="success-logo" />
          <h2 className="success-title">YOU'RE SUBSCRIBED!</h2>
          <p className="success-msg">Welcome to the Rafael's Coffee family. Your first bag of <strong>{selectedProduct?.name}</strong> will be freshly roasted and dispatched this Thursday.</p>
          <p className="success-sub">Check your email for confirmation and account details.</p>
          <button className="btn-primary" onClick={onBack}>Back to Home</button>
        </div>
      </div>
    )
  }

  return (
    <div className="wizard">
      <div className="wizard-header">
        <button className="btn-ghost" onClick={onBack}>← Back</button>
        <img src="/Rafaels_Coffee_logo-with-ESB.png" alt="Rafael's Coffee" className="wizard-logo-img" />
        <div className="wizard-steps-indicator">
          {[1,2,3].map(s => <div key={s} className={`step-dot ${step === s ? 'active' : step > s ? 'done' : ''}`} />)}
        </div>
      </div>

      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${((step-1)/2)*100}%` }} />
      </div>

      <div className="wizard-body">

        {step === 1 && (
          <div className="wizard-step">
            <div className="step-header">
              <span className="step-label">Step 1 of 3</span>
              <h2 className="step-title">CHOOSE YOUR COFFEE</h2>
              <p className="step-desc">All beans roasted to order in Lancefield, Victoria.</p>
            </div>
            <div className="filter-tabs">
              {[['all','All'], ['blend','Blends'], ['single','Single Origins'], ['decaf','Decaf']].map(([val, label]) => (
                <button key={val} className={`filter-tab ${filter === val ? 'active' : ''}`} onClick={() => setFilter(val)}>{label}</button>
              ))}
            </div>
            <div className="product-grid-wizard">
              {filteredProducts.map(p => (
                <button key={p.id} className={`product-card-wizard ${selection.product === p.id ? 'selected' : ''}`} onClick={() => setSelection(s => ({ ...s, product: p.id }))}>
                  <div className="pcw-type">{TYPE_LABELS[p.type]}</div>
                  <div className="pcw-name">{p.name}</div>
                  <div className="pcw-sub">{p.sub}</div>
                  <div className="pcw-desc">{p.desc}</div>
                  <div className="pcw-price">From ${p.price250}</div>
                  {selection.product === p.id && <div className="pcw-check">✓</div>}
                </button>
              ))}
            </div>
            <div className="option-group">
              <h3 className="option-label">Bag Size</h3>
              <div className="option-pills">
                {SIZES.map(s => (
                  <button key={s.id} className={`option-pill ${selection.size === s.id ? 'selected' : ''}`} onClick={() => setSelection(sel => ({ ...sel, size: s.id }))}>
                    <span className="pill-label">{s.label}</span>
                    <span className="pill-desc">{s.desc}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="option-group">
              <h3 className="option-label">Delivery Frequency</h3>
              <div className="frequency-options">
                {FREQUENCIES.map(f => (
                  <button key={f.id} className={`freq-card ${selection.frequency === f.id ? 'selected' : ''}`} onClick={() => setSelection(s => ({ ...s, frequency: f.id }))}>
                    <div className="freq-left">
                      <span className="freq-label">{f.label}</span>
                      <span className="freq-desc">{f.desc}</span>
                    </div>
                    {f.badge && <span className="freq-badge">{f.badge}</span>}
                    {selection.frequency === f.id && <span className="freq-check">✓</span>}
                  </button>
                ))}
              </div>
            </div>
            {price && (
              <div className="price-summary">
                <span>{selectedProduct?.name} · {selection.size}g · {selection.frequency}</span>
                <span className="price-amount">${price} / delivery</span>
              </div>
            )}
            <div className="step-actions">
              <button className="btn-primary" disabled={!canProceedStep1} onClick={() => setStep(2)}>Continue to Your Details →</button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="wizard-step">
            <div className="step-header">
              <span className="step-label">Step 2 of 3</span>
              <h2 className="step-title">YOUR DETAILS</h2>
              <p className="step-desc">Where should we deliver your coffee?</p>
            </div>
            <div className="form-grid">
              <div className="form-row">
                <div className="form-field"><label>First name</label><input type="text" placeholder="First name" value={details.firstName} onChange={e => setDetails(d => ({ ...d, firstName: e.target.value }))} /></div>
                <div className="form-field"><label>Last name</label><input type="text" placeholder="Last name" value={details.lastName} onChange={e => setDetails(d => ({ ...d, lastName: e.target.value }))} /></div>
              </div>
              <div className="form-field"><label>Email address</label><input type="email" placeholder="you@example.com" value={details.email} onChange={e => setDetails(d => ({ ...d, email: e.target.value }))} /></div>
              <div className="form-field"><label>Phone <span className="optional">(optional)</span></label><input type="tel" placeholder="04xx xxx xxx" value={details.phone} onChange={e => setDetails(d => ({ ...d, phone: e.target.value }))} /></div>
              <div className="form-field"><label>Street address</label><input type="text" placeholder="123 Main Street" value={details.address1} onChange={e => setDetails(d => ({ ...d, address1: e.target.value }))} /></div>
              <div className="form-row">
                <div className="form-field"><label>Suburb</label><input type="text" placeholder="Suburb" value={details.suburb} onChange={e => setDetails(d => ({ ...d, suburb: e.target.value }))} /></div>
                <div className="form-field form-field-sm"><label>State</label><select value={details.state} onChange={e => setDetails(d => ({ ...d, state: e.target.value }))}>{['VIC','NSW','QLD','SA','WA','TAS','ACT','NT'].map(st => <option key={st}>{st}</option>)}</select></div>
                <div className="form-field form-field-sm"><label>Postcode</label><input type="text" placeholder="3435" maxLength={4} value={details.postcode} onChange={e => setDetails(d => ({ ...d, postcode: e.target.value }))} /></div>
              </div>
            </div>
            <div className="step-actions">
              <button className="btn-secondary" onClick={() => setStep(1)}>← Back</button>
              <button className="btn-primary" disabled={!canProceedStep2} onClick={() => setStep(3)}>Continue to Payment →</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="wizard-step">
            <div className="step-header">
              <span className="step-label">Step 3 of 3</span>
              <h2 className="step-title">REVIEW & PAY</h2>
              <p className="step-desc">Confirm your subscription and enter your payment details.</p>
            </div>
            <div className="review-card">
              <div className="review-section">
                <h4 className="review-heading">Your Subscription</h4>
                <div className="review-row"><span>Coffee</span><strong>{selectedProduct?.name}</strong></div>
                <div className="review-row"><span>Type</span><strong>{TYPE_LABELS[selectedProduct?.type]}</strong></div>
                <div className="review-row"><span>Size</span><strong>{selection.size}g</strong></div>
                <div className="review-row"><span>Frequency</span><strong>{selection.frequency}</strong></div>
                <div className="review-row review-total"><span>Per delivery</span><strong>${price}</strong></div>
              </div>
              <div className="review-divider" />
              <div className="review-section">
                <h4 className="review-heading">Delivery Address</h4>
                <div className="review-address">
                  <span>{details.firstName} {details.lastName}</span>
                  <span>{details.address1}</span>
                  <span>{details.suburb} {details.state} {details.postcode}</span>
                </div>
              </div>
            </div>
            <div className="roast-notice">☕ We roast to order every Thursday. Your first delivery will be dispatched COB Friday.</div>
            <div className="payment-section">
              <h4 className="payment-heading">Card Details</h4>
              <SquareCardForm tokenizeRef={tokenizeRef} submitting={submitting} />
              <p className="payment-secure">🔒 Secured by Square · PCI compliant · Card details never stored on our servers</p>
            </div>
            {error && <div className="form-error">{error}</div>}
            <div className="step-actions">
              <button className="btn-secondary" onClick={() => setStep(2)} disabled={submitting}>← Back</button>
              <button className="btn-primary" onClick={handleSubmit} disabled={submitting}>
                {submitting ? 'Processing...' : `Start Subscription · $${price}`}
              </button>
            </div>
            <p className="payment-note">Your card will be charged ${price} on each {selection.frequency} delivery. Cancel or pause anytime from your account.</p>
          </div>
        )}

      </div>
    </div>
  )
}
