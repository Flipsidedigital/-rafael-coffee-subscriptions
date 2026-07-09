import { useState, useEffect } from 'react'
import './Admin.css'

const API_URL = "https://rafael-coffee-subscriptions-production.up.railway.app"

// ── Login ─────────────────────────────────────────────────────────────────────
function AdminLogin({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_URL}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!data.token) throw new Error(data.error || 'Login failed')
      localStorage.setItem('admin_auth', JSON.stringify(data))
      onLogin(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="admin-login">
      <div className="admin-login-box">
        <img src="/Rafaels_Coffee_logo-with-ESB.png" alt="Rafael's Coffee" className="admin-logo" />
        <h1 className="admin-login-title">Admin Dashboard</h1>
        <form className="admin-login-form" onSubmit={handleSubmit}>
          <div className="form-field">
            <label>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@rafaelscoffee.com.au" required />
          </div>
          <div className="form-field">
            <label>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
          </div>
          {error && <div className="admin-error">{error}</div>}
          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, colour }) {
  return (
    <div className="stat-card">
      <div className="stat-value" style={{ color: colour || 'var(--dark)' }}>{value}</div>
      <div className="stat-label">{label}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  )
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
function AdminDashboard({ auth, onLogout }) {
  const [view, setView] = useState('dashboard')
  const [dashData, setDashData] = useState(null)
  const [subscriptions, setSubscriptions] = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [trackingInput, setTrackingInput] = useState({})
  const [actionMsg, setActionMsg] = useState(null)
  const [subFilter, setSubFilter] = useState('all')
  const [shopOrders, setShopOrders] = useState([])
  const [shopTracking, setShopTracking] = useState({})

  const headers = { 'Authorization': `Bearer ${auth.token}`, 'Content-Type': 'application/json' }

  useEffect(() => { fetchAll() }, [view])

  async function fetchAll() {
    setLoading(true)
    try {
      const [dash, subs, ords, shop] = await Promise.all([
        fetch(`${API_URL}/api/admin/dashboard`, { headers }).then(r => r.json()),
        fetch(`${API_URL}/api/admin/subscriptions`, { headers }).then(r => r.json()),
        fetch(`${API_URL}/api/admin/orders`, { headers }).then(r => r.json()),
        fetch(`${API_URL}/api/admin/shop-orders`, { headers }).then(r => r.json()),
      ])
      setDashData(dash)
      setSubscriptions(Array.isArray(subs) ? subs : [])
      setOrders(Array.isArray(ords) ? ords : [])
      setShopOrders(Array.isArray(shop) ? shop : [])
    } catch (err) {
      setError('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  async function updateTracking(orderId) {
    const { number, carrier } = trackingInput[orderId] || {}
    if (!number) return
    try {
      await fetch(`${API_URL}/api/admin/orders/${orderId}/tracking`, {
        method: 'PATCH', headers,
        body: JSON.stringify({ tracking_number: number, tracking_carrier: carrier }),
      })
      setActionMsg('Tracking updated successfully')
      fetchAll()
    } catch (err) {
      setError('Failed to update tracking')
    }
  }

  async function updateSubStatus(subId, status) {
    try {
      await fetch(`${API_URL}/api/admin/subscriptions/${subId}/status`, {
        method: 'PATCH', headers,
        body: JSON.stringify({ status }),
      })
      setActionMsg('Subscription updated')
      fetchAll()
    } catch (err) {
      setError('Failed to update subscription')
    }
  }

  async function updateShopOrder(orderId, body) {
    try {
      await fetch(`${API_URL}/api/admin/shop-orders/${orderId}`, {
        method: 'PATCH', headers, body: JSON.stringify(body),
      })
      setActionMsg('Order updated')
      fetchAll()
    } catch (err) {
      setError('Failed to update order')
    }
  }

  const filteredSubs = subFilter === 'all' ? subscriptions : subscriptions.filter(s => s.status === subFilter)

  return (
    <div className="admin">
      {/* Nav */}
      <div className="admin-nav">
        <img src="/Rafaels_Coffee_logo-with-ESB.png" alt="Rafael's Coffee" className="admin-nav-logo" />
        <div className="admin-nav-tabs">
          {[['dashboard','Overview'], ['subscriptions','Subscriptions'], ['orders','Orders'], ['shop-orders','Shop Orders']].map(([v, l]) => (
            <button key={v} className={`admin-tab ${view === v ? 'active' : ''}`} onClick={() => setView(v)}>{l}</button>
          ))}
        </div>
        <button className="btn-ghost admin-logout" onClick={onLogout}>Sign out</button>
      </div>

      <div className="admin-body">
        {error && <div className="admin-error">{error}</div>}
        {actionMsg && <div className="admin-success" onClick={() => setActionMsg(null)}>{actionMsg} ✕</div>}
        {loading && <div className="admin-loading">Loading...</div>}

        {/* Overview */}
        {view === 'dashboard' && dashData && (
          <div className="admin-section">
            <h2 className="admin-section-title">OVERVIEW</h2>
            <div className="stats-grid">
              <StatCard label="Active Subscriptions" value={dashData.stats.active_subscriptions} colour="#276749" />
              <StatCard label="Paused" value={dashData.stats.paused_subscriptions} colour="#C05621" />
              <StatCard label="Cancelled" value={dashData.stats.cancelled_subscriptions} colour="#888" />
              <StatCard label="Revenue (30 days)" value={`$${(dashData.stats.revenue_30_days / 100).toFixed(2)}`} sub="AUD" colour="var(--red)" />
            </div>

            {dashData.recent_orders.length > 0 && (
              <>
                <h3 className="admin-sub-title">RECENT ORDERS</h3>
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Customer</th>
                        <th>Coffee</th>
                        <th>Size</th>
                        <th>Address</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashData.recent_orders.map(o => (
                        <tr key={o.id}>
                          <td><div className="td-name">{o.first_name} {o.last_name}</div><div className="td-email">{o.email}</div></td>
                          <td>{o.product_name}</td>
                          <td>{o.quantity_grams}g</td>
                          <td><div className="td-address">{o.shipping_address_1}<br />{o.shipping_suburb} {o.shipping_state} {o.shipping_postcode}</div></td>
                          <td>${(o.amount_cents / 100).toFixed(2)}</td>
                          <td><span className={`status-badge status-${o.status}`}>{o.status}</span></td>
                          <td>{new Date(o.created_at).toLocaleDateString('en-AU')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}

        {/* Subscriptions */}
        {view === 'subscriptions' && (
          <div className="admin-section">
            <div className="admin-section-header">
              <h2 className="admin-section-title">SUBSCRIPTIONS</h2>
              <div className="filter-tabs">
                {[['all','All'], ['active','Active'], ['paused','Paused'], ['cancelled','Cancelled']].map(([v, l]) => (
                  <button key={v} className={`filter-tab ${subFilter === v ? 'active' : ''}`} onClick={() => setSubFilter(v)}>{l}</button>
                ))}
              </div>
            </div>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Coffee</th>
                    <th>Size</th>
                    <th>Frequency</th>
                    <th>Address</th>
                    <th>Status</th>
                    <th>Since</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubs.map(s => (
                    <tr key={s.id}>
                      <td><div className="td-name">{s.first_name} {s.last_name}</div><div className="td-email">{s.email}</div></td>
                      <td>{s.product_name}</td>
                      <td>{s.quantity_grams}g</td>
                      <td>{s.frequency}</td>
                      <td><div className="td-address">{s.shipping_address_1}<br />{s.shipping_suburb} {s.shipping_state} {s.shipping_postcode}</div></td>
                      <td><span className={`status-badge status-${s.status}`}>{s.status}</span></td>
                      <td>{new Date(s.created_at).toLocaleDateString('en-AU')}</td>
                      <td>
                        <div className="admin-row-actions">
                          {s.status === 'paused' && <button className="admin-action-btn" onClick={() => updateSubStatus(s.id, 'active')}>Resume</button>}
                          {s.status === 'active' && <button className="admin-action-btn" onClick={() => updateSubStatus(s.id, 'paused')}>Pause</button>}
                          {s.status !== 'cancelled' && <button className="admin-action-btn danger" onClick={() => updateSubStatus(s.id, 'cancelled')}>Cancel</button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Orders */}
        {view === 'orders' && (
          <div className="admin-section">
            <h2 className="admin-section-title">ORDERS</h2>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Coffee</th>
                    <th>Delivery Address</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Tracking</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(o => (
                    <tr key={o.id}>
                      <td><div className="td-name">{o.first_name} {o.last_name}</div><div className="td-email">{o.email}</div></td>
                      <td>{o.product_name}<br /><span className="td-email">{o.quantity_grams}g · {o.frequency}</span></td>
                      <td><div className="td-address">{o.shipping_address_1}<br />{o.shipping_suburb} {o.shipping_state} {o.shipping_postcode}</div></td>
                      <td>${(o.amount_cents / 100).toFixed(2)}</td>
                      <td><span className={`status-badge status-${o.status}`}>{o.status}</span></td>
                      <td>
                        {o.tracking_number ? (
                          <div className="tracking-display">
                            <span className="tracking-number">{o.tracking_number}</span>
                            {o.tracking_carrier && <span className="td-email">{o.tracking_carrier}</span>}
                          </div>
                        ) : (
                          <div className="tracking-input-group">
                            <input
                              type="text"
                              placeholder="Tracking #"
                              className="tracking-input"
                              value={trackingInput[o.id]?.number || ''}
                              onChange={e => setTrackingInput(t => ({ ...t, [o.id]: { ...t[o.id], number: e.target.value } }))}
                            />
                            <input
                              type="text"
                              placeholder="Carrier"
                              className="tracking-input carrier"
                              value={trackingInput[o.id]?.carrier || ''}
                              onChange={e => setTrackingInput(t => ({ ...t, [o.id]: { ...t[o.id], carrier: e.target.value } }))}
                            />
                            <button className="admin-action-btn" onClick={() => updateTracking(o.id)}>Save</button>
                          </div>
                        )}
                      </td>
                      <td>{new Date(o.created_at).toLocaleDateString('en-AU')}</td>
                    </tr>
                  ))}
                  {orders.length === 0 && (
                    <tr><td colSpan={7} className="admin-empty-row">No orders yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Shop Orders (one-off) */}
        {view === 'shop-orders' && (
          <div className="admin-section">
            <h2 className="admin-section-title">SHOP ORDERS</h2>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Customer</th>
                    <th>Items</th>
                    <th>Delivery Address</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Tracking</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {shopOrders.map(o => (
                    <tr key={o.id}>
                      <td className="td-name">{o.order_number}</td>
                      <td><div className="td-name">{o.first_name} {o.last_name}</div><div className="td-email">{o.email}</div></td>
                      <td>{(o.items || []).map(i => `${i.qty}× ${i.name}`).join(', ')}</td>
                      <td><div className="td-address">{o.shipping_address_1}<br />{o.shipping_suburb} {o.shipping_state} {o.shipping_postcode}</div></td>
                      <td>${(o.amount_cents / 100).toFixed(2)}</td>
                      <td><span className={`status-badge status-${o.status}`}>{o.status}</span></td>
                      <td>
                        {o.tracking_number ? (
                          <div className="tracking-display">
                            <span className="tracking-number">{o.tracking_number}</span>
                            {o.tracking_carrier && <span className="td-email">{o.tracking_carrier}</span>}
                          </div>
                        ) : (
                          <div className="tracking-input-group">
                            <input
                              type="text" placeholder="Tracking #" className="tracking-input"
                              value={shopTracking[o.id]?.number || ''}
                              onChange={e => setShopTracking(t => ({ ...t, [o.id]: { ...t[o.id], number: e.target.value } }))}
                            />
                            <input
                              type="text" placeholder="Carrier" className="tracking-input carrier"
                              value={shopTracking[o.id]?.carrier || ''}
                              onChange={e => setShopTracking(t => ({ ...t, [o.id]: { ...t[o.id], carrier: e.target.value } }))}
                            />
                            <button
                              className="admin-action-btn"
                              disabled={!shopTracking[o.id]?.number}
                              onClick={() => updateShopOrder(o.id, { tracking_number: shopTracking[o.id]?.number, tracking_carrier: shopTracking[o.id]?.carrier, status: 'shipped' })}
                            >Ship</button>
                          </div>
                        )}
                      </td>
                      <td>{new Date(o.created_at).toLocaleDateString('en-AU')}</td>
                    </tr>
                  ))}
                  {shopOrders.length === 0 && (
                    <tr><td colSpan={8} className="admin-empty-row">No shop orders yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main Admin Component ──────────────────────────────────────────────────────
export default function Admin() {
  const [auth, setAuth] = useState(null)

  useEffect(() => {
    const stored = localStorage.getItem('admin_auth')
    if (stored) {
      try { setAuth(JSON.parse(stored)) } catch { localStorage.removeItem('admin_auth') }
    }
  }, [])

  function handleLogin(data) { setAuth(data) }

  function handleLogout() {
    localStorage.removeItem('admin_auth')
    setAuth(null)
  }

  if (!auth) return <AdminLogin onLogin={handleLogin} />
  return <AdminDashboard auth={auth} onLogout={handleLogout} />
}
