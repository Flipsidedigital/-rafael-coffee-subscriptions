import { useState, useEffect } from 'react'
import './Portal.css'

const API_URL = "https://rafael-coffee-subscriptions-production.up.railway.app"

const PRODUCTS = [
  { id: 'onesto', name: 'The Onesto', sub: '100% Arabica' },
  { id: 'ipanema', name: 'The Ipanema', sub: '100% Arabica' },
  { id: 'llaneros', name: 'The Llaneros', sub: '85% Arabica · 15% Robusta' },
  { id: 'calabrian', name: 'The Calabrian', sub: '80% Arabica · 20% Robusta' },
  { id: 'equinox', name: 'Old Man Winter', sub: '100% Arabica · Winter blend' },
  { id: 'guatemala', name: 'Guatemala Antigua', sub: 'Single Origin' },
  { id: 'peru', name: 'Peru Aprocassi Organic', sub: 'Single Origin · Organic' },
  { id: 'decaf', name: 'Mexico Swiss Water® Process Organic Decaf', sub: 'Organic Decaf' },
]

// ── Magic Link Request Page ───────────────────────────────────────────────────
function RequestLinkPage({ onSent }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await fetch(`${API_URL}/api/portal/request-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      onSent(email)
    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="portal-auth">
      <img src="/Rafaels_Coffee_logo-with-ESB.png" alt="Rafael's Coffee" className="portal-logo" />
      <h1 className="portal-auth-title">Subscription Portal</h1>
      <p className="portal-auth-desc">Enter your email address and we'll send you a secure link to access your subscription.</p>
      <form className="portal-auth-form" onSubmit={handleSubmit}>
        <div className="form-field">
          <label>Email address</label>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
        </div>
        {error && <div className="portal-error">{error}</div>}
        <button className="btn-primary" type="submit" disabled={loading}>
          {loading ? 'Sending...' : 'Send My Link →'}
        </button>
      </form>
      <p className="portal-auth-note">The link will expire in 30 minutes. Check your spam folder if you don't see it.</p>
    </div>
  )
}

// ── Link Sent Confirmation ────────────────────────────────────────────────────
function LinkSentPage({ email, onBack }) {
  return (
    <div className="portal-auth">
      <img src="/Rafaels_Coffee_logo-with-ESB.png" alt="Rafael's Coffee" className="portal-logo" />
      <div className="link-sent-icon">✉️</div>
      <h1 className="portal-auth-title">Check your email</h1>
      <p className="portal-auth-desc">We've sent a secure login link to <strong>{email}</strong>. Click the link in the email to access your portal.</p>
      <p className="portal-auth-note">The link expires in 30 minutes. Can't find it? Check your spam folder.</p>
      <button className="btn-ghost" onClick={onBack}>← Try a different email</button>
    </div>
  )
}

// ── Subscription Card ─────────────────────────────────────────────────────────
function SubscriptionCard({ sub, onAction, actionLoading }) {
  const [showPauseDate, setShowPauseDate] = useState(false)
  const [pauseUntil, setPauseUntil] = useState('')
  const [showSwap, setShowSwap] = useState(false)
  const [showCancel, setShowCancel] = useState(false)
  const [showAddress, setShowAddress] = useState(false)
  const [address, setAddress] = useState({
    shipping_address_1: sub.shipping_address_1 || '',
    shipping_suburb: sub.shipping_suburb || '',
    shipping_state: sub.shipping_state || 'VIC',
    shipping_postcode: sub.shipping_postcode || '',
  })

  const statusColour = sub.status === 'active' ? '#276749' : sub.status === 'paused' ? '#C05621' : '#555'

  return (
    <div className="sub-card">
      <div className="sub-card-header">
        <div>
          <div className="sub-product-name">{sub.product_name || sub.product_id}</div>
          <div className="sub-details">{sub.quantity_grams}g · {sub.frequency}</div>
        </div>
        <div className="sub-status" style={{ color: statusColour }}>
          {sub.status.charAt(0).toUpperCase() + sub.status.slice(1)}
        </div>
      </div>

      <div className="sub-address">
        <span className="sub-address-label">Delivering to</span>
        <span>{sub.shipping_address_1}, {sub.shipping_suburb} {sub.shipping_state} {sub.shipping_postcode}</span>
      </div>

      {sub.status === 'paused' && sub.pause_until && (
        <div className="sub-paused-notice">
          ⏸ Paused until {new Date(sub.pause_until).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      )}

      <div className="sub-actions">
        {sub.status === 'active' && (
          <>
            {!showPauseDate ? (
              <button className="sub-action-btn" onClick={() => setShowPauseDate(true)}>Pause</button>
            ) : (
              <div className="sub-action-inline">
                <input type="date" value={pauseUntil} onChange={e => setPauseUntil(e.target.value)} min={new Date().toISOString().split('T')[0]} />
                <button className="btn-primary btn-sm" disabled={!pauseUntil || actionLoading} onClick={() => onAction('pause', { subscription_id: sub.id, pause_until: pauseUntil })}>Confirm Pause</button>
                <button className="btn-ghost" onClick={() => setShowPauseDate(false)}>Cancel</button>
              </div>
            )}
            <button className="sub-action-btn" onClick={() => onAction('skip', { subscription_id: sub.id })}>Skip Next</button>
          </>
        )}

        {sub.status === 'paused' && (
          <button className="sub-action-btn primary" onClick={() => onAction('resume', { subscription_id: sub.id })}>Resume</button>
        )}

        <button className="sub-action-btn" onClick={() => setShowSwap(!showSwap)}>Swap Coffee</button>
        <button className="sub-action-btn" onClick={() => setShowAddress(!showAddress)}>Update Address</button>

        {sub.status !== 'cancelled' && (
          <button className="sub-action-btn danger" onClick={() => setShowCancel(true)}>Cancel</button>
        )}
      </div>

      {showSwap && (
        <div className="sub-swap">
          <h4 className="sub-swap-title">Choose your new coffee</h4>
          <div className="swap-grid">
            {PRODUCTS.map(p => (
              <button
                key={p.id}
                className={`swap-option ${sub.product_name === p.name ? 'current' : ''}`}
                onClick={() => { onAction('coffee', { subscription_id: sub.id, product_id: p.id }); setShowSwap(false) }}
                disabled={actionLoading}
              >
                <span className="swap-name">{p.name}</span>
                <span className="swap-sub">{p.sub}</span>
                {sub.product_name === p.name && <span className="swap-current">Current</span>}
              </button>
            ))}
          </div>
          <button className="btn-ghost" onClick={() => setShowSwap(false)}>Cancel</button>
        </div>
      )}

      {showAddress && (
        <div className="sub-address-form">
          <h4 className="sub-swap-title">Update delivery address</h4>
          <div className="form-grid">
            <div className="form-field">
              <label>Street address</label>
              <input type="text" value={address.shipping_address_1} onChange={e => setAddress(a => ({ ...a, shipping_address_1: e.target.value }))} />
            </div>
            <div className="form-row">
              <div className="form-field">
                <label>Suburb</label>
                <input type="text" value={address.shipping_suburb} onChange={e => setAddress(a => ({ ...a, shipping_suburb: e.target.value }))} />
              </div>
              <div className="form-field form-field-sm">
                <label>State</label>
                <select value={address.shipping_state} onChange={e => setAddress(a => ({ ...a, shipping_state: e.target.value }))}>
                  {['VIC','NSW','QLD','SA','WA','TAS','ACT','NT'].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-field form-field-sm">
                <label>Postcode</label>
                <input type="text" maxLength={4} value={address.shipping_postcode} onChange={e => setAddress(a => ({ ...a, shipping_postcode: e.target.value }))} />
              </div>
            </div>
          </div>
          <div className="step-actions">
            <button className="btn-primary btn-sm" disabled={actionLoading} onClick={() => { onAction('address', { subscription_id: sub.id, ...address }); setShowAddress(false) }}>Save Address</button>
            <button className="btn-ghost" onClick={() => setShowAddress(false)}>Cancel</button>
          </div>
        </div>
      )}

      {showCancel && (
        <div className="sub-cancel-confirm">
          <p>Are you sure you want to cancel? This will stop all future deliveries.</p>
          <div className="step-actions">
            <button className="btn-primary btn-sm danger" disabled={actionLoading} onClick={() => { onAction('cancel', { subscription_id: sub.id }); setShowCancel(false) }}>Yes, Cancel Subscription</button>
            <button className="btn-ghost" onClick={() => setShowCancel(false)}>Keep My Subscription</button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
function Dashboard({ token, customer, onLogout }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [actionSuccess, setActionSuccess] = useState(null)
  const [shopOrders, setShopOrders] = useState([])

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const res = await fetch(`${API_URL}/api/portal/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Failed to load')
      const json = await res.json()
      setData(json)
      try {
        const so = await fetch(`${API_URL}/api/portal/shop-orders`, { headers: { 'Authorization': `Bearer ${token}` } })
        if (so.ok) setShopOrders(await so.json())
      } catch { /* non-fatal */ }
    } catch (err) {
      setError('Failed to load your subscription details.')
    } finally {
      setLoading(false)
    }
  }

  async function handleAction(action, body) {
    setActionLoading(true)
    setActionSuccess(null)
    try {
      const method = action === 'address' || action === 'coffee' ? 'PATCH' : 'POST'
      const endpoint = action === 'address' || action === 'coffee' ? action : action
      const res = await fetch(`${API_URL}/api/portal/${endpoint}`, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Action failed')
      }
      setActionSuccess('Changes saved successfully.')
      await fetchData()
    } catch (err) {
      setError(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="portal-dashboard">
      <div className="portal-nav">
        <img src="/Rafaels_Coffee_logo-with-ESB.png" alt="Rafael's Coffee" className="portal-nav-logo" />
        <div className="portal-nav-right">
          <span className="portal-welcome">Hi, {customer.first_name}</span>
          <button className="btn-ghost" onClick={onLogout}>Sign out</button>
        </div>
      </div>

      <div className="portal-body">
        <div className="portal-section">
          <h2 className="portal-section-title">YOUR SUBSCRIPTION</h2>

          {loading && <div className="portal-loading">Loading your subscription...</div>}
          {error && <div className="portal-error">{error}</div>}
          {actionSuccess && <div className="portal-success">{actionSuccess}</div>}

          {data && data.subscriptions.length === 0 && (
            <div className="portal-empty">
              <p>No active subscriptions found.</p>
              <a href="/" className="btn-primary">Start a Subscription</a>
            </div>
          )}

          {data && data.subscriptions.map(sub => (
            <SubscriptionCard
              key={sub.id}
              sub={sub}
              onAction={handleAction}
              actionLoading={actionLoading}
            />
          ))}
        </div>

        {data && data.orders.length > 0 && (
          <div className="portal-section">
            <h2 className="portal-section-title">ORDER HISTORY</h2>
            <div className="orders-list">
              {data.orders.map(order => (
                <div className="order-row" key={order.id}>
                  <div className="order-info">
                    <span className="order-product">{order.product_name}</span>
                    <span className="order-date">{new Date(order.created_at).toLocaleDateString('en-AU')}</span>
                  </div>
                  <div className="order-right">
                    <span className={`order-status order-status-${order.status}`}>{order.status}</span>
                    {order.tracking_number && (
                      <span className="order-tracking">Tracking: {order.tracking_number}</span>
                    )}
                    <span className="order-amount">${(order.amount_cents / 100).toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {shopOrders.length > 0 && (
          <div className="portal-section">
            <h2 className="portal-section-title">YOUR ORDERS</h2>
            <div style={{ display: 'grid', gap: 12 }}>
              {shopOrders.map(o => (
                <div key={o.id} style={{ border: '1px solid rgba(64,32,32,0.12)', borderRadius: 10, padding: 16, background: '#fff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <strong style={{ fontFamily: 'var(--font-heading)', letterSpacing: '0.05em' }}>#{o.order_number}</strong>
                    <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', padding: '3px 8px', borderRadius: 999, background: 'rgba(64,32,32,0.08)', color: 'var(--red)', fontWeight: 600 }}>{o.status}</span>
                  </div>
                  <div style={{ color: 'var(--dark)', fontSize: 14 }}>{(o.items || []).map(i => `${i.qty}× ${i.name}`).join(', ')}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, color: 'var(--mid)', fontSize: 13 }}>
                    <span>{new Date(o.created_at).toLocaleDateString('en-AU')}</span>
                    <span style={{ fontWeight: 700, color: 'var(--red)' }}>${(o.amount_cents / 100).toFixed(2)}</span>
                  </div>
                  {o.tracking_number && <div style={{ marginTop: 8, fontSize: 13, color: 'var(--dark)' }}>📦 Tracking: {o.tracking_number}{o.tracking_carrier ? ` · ${o.tracking_carrier}` : ''}</div>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main Portal Component ─────────────────────────────────────────────────────
export default function Portal() {
  const [view, setView] = useState('request') // request | sent | dashboard
  const [sentEmail, setSentEmail] = useState('')
  const [auth, setAuth] = useState(null)

  // Check for magic link token in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    if (token) verifyToken(token)

    // Check for stored session
    const stored = localStorage.getItem('portal_auth')
    if (stored) {
      try {
        setAuth(JSON.parse(stored))
        setView('dashboard')
      } catch (e) {
        localStorage.removeItem('portal_auth')
      }
    }
  }, [])

  async function verifyToken(token) {
    try {
      const res = await fetch(`${API_URL}/api/portal/verify-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      const data = await res.json()
      if (data.token) {
        const authData = { token: data.token, customer: data.customer }
        localStorage.setItem('portal_auth', JSON.stringify(authData))
        setAuth(authData)
        setView('dashboard')
        window.history.replaceState({}, '', '/portal')
      } else {
        setView('request')
      }
    } catch (err) {
      setView('request')
    }
  }

  function handleLogout() {
    localStorage.removeItem('portal_auth')
    setAuth(null)
    setView('request')
  }

  return (
    <div className="portal">
      {view === 'request' && (
        <RequestLinkPage onSent={(email) => { setSentEmail(email); setView('sent') }} />
      )}
      {view === 'sent' && (
        <LinkSentPage email={sentEmail} onBack={() => setView('request')} />
      )}
      {view === 'dashboard' && auth && (
        <Dashboard token={auth.token} customer={auth.customer} onLogout={handleLogout} />
      )}
    </div>
  )
}
