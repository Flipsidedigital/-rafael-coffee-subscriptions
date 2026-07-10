import { useState, useEffect, Fragment } from 'react'
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

function MetricCard({ icon, iconBg, label, value, sub }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e4e7ec', borderRadius: 14, padding: 20 }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{icon}</div>
      <div style={{ marginTop: 16, fontFamily: 'var(--font-heading)', textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: 12, color: 'var(--mid)' }}>{label}</div>
      <div style={{ marginTop: 4, fontFamily: 'var(--font-heading)', fontSize: 28, fontWeight: 800, color: 'var(--dark)', lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ marginTop: 4, fontSize: 12, color: 'var(--mid)' }}>{sub}</div>}
    </div>
  )
}

function BreakdownRow({ colour, label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0' }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'var(--dark)' }}>
        <span style={{ width: 9, height: 9, borderRadius: 999, background: colour }} />{label}
      </span>
      <strong style={{ fontFamily: 'var(--font-heading)', fontSize: 16, color: 'var(--dark)' }}>{value}</strong>
    </div>
  )
}

function MiniBarChart({ data }) {
  const max = Math.max(1, ...data.map(d => d.cents))
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, height: 150, marginTop: 16 }}>
        {data.map(d => {
          const h = Math.round((d.cents / max) * 100)
          return (
            <div key={d.day} title={`${d.day}: $${(d.cents / 100).toFixed(2)}`} style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
              <div style={{ height: `${Math.max(h, 2)}%`, background: 'var(--red)', opacity: d.cents ? 1 : 0.15, borderRadius: '4px 4px 0 0' }} />
            </div>
          )
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 11, color: 'var(--mid)' }}>
        <span>{data[0] ? data[0].day.slice(5) : ''}</span>
        <span>Peak ${(max / 100).toFixed(0)}</span>
        <span>{data.length ? data[data.length - 1].day.slice(5) : ''}</span>
      </div>
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
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [promoCodes, setPromoCodes] = useState([])
  const [newPromo, setNewPromo] = useState({ code: '', kind: 'percent', value: '', min_subtotal_cents: '', max_uses: '' })
  const [classSessions, setClassSessions] = useState([])
  const [newClass, setNewClass] = useState({ title: 'Coffee Masterclass', starts_at: '', duration_mins: 120, capacity: 8, price: '99', description: '' })
  const [attendees, setAttendees] = useState({}) // sessionId -> bookings[]
  const [catalog, setCatalog] = useState([])
  const [editing, setEditing] = useState(null) // product being added/edited (null = closed)
  const [settings, setSettings] = useState({})
  const [uploading, setUploading] = useState(false)
  const [productCats, setProductCats] = useState([])
  const [newCat, setNewCat] = useState('')

  const headers = { 'Authorization': `Bearer ${auth.token}`, 'Content-Type': 'application/json' }

  useEffect(() => { fetchAll() }, [view])

  async function fetchAll() {
    setLoading(true)
    const paths = ['dashboard', 'subscriptions', 'orders', 'shop-orders', 'promo-codes', 'class-sessions', 'shop-products', 'site-settings', 'categories']
    const responses = await Promise.all(paths.map(p => fetch(`${API_URL}/api/admin/${p}`, { headers }).catch(() => null)))
    if (responses.some(r => r && (r.status === 401 || r.status === 403))) {
      onLogout() // token expired / invalid — back to login
      return
    }
    // Parse each feed independently so one flaky endpoint can't break the admin.
    const get = async (r, fb) => { try { return r && r.ok ? await r.json() : fb } catch { return fb } }
    const [dash, subs, ords, shop, promos, classes, cat, sett, cats] = await Promise.all([
      get(responses[0], null), get(responses[1], []), get(responses[2], []), get(responses[3], []),
      get(responses[4], []), get(responses[5], []), get(responses[6], []), get(responses[7], {}), get(responses[8], []),
    ])
    if (dash) setDashData(dash)
    setSubscriptions(Array.isArray(subs) ? subs : [])
    setOrders(Array.isArray(ords) ? ords : [])
    setShopOrders(Array.isArray(shop) ? shop : [])
    setPromoCodes(Array.isArray(promos) ? promos : [])
    setClassSessions(Array.isArray(classes) ? classes : [])
    setCatalog(Array.isArray(cat) ? cat : [])
    setSettings(sett && typeof sett === 'object' ? sett : {})
    setProductCats(Array.isArray(cats) ? cats : [])
    if (responses.every(r => !r || !r.ok)) setError('Failed to load data')
    else setError(null)
    setLoading(false)
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

  async function createPromo() {
    if (!newPromo.code || !newPromo.value) return
    try {
      const res = await fetch(`${API_URL}/api/admin/promo-codes`, {
        method: 'POST', headers,
        body: JSON.stringify({
          code: newPromo.code,
          kind: newPromo.kind,
          value: parseInt(newPromo.value, 10),
          min_subtotal_cents: newPromo.min_subtotal_cents ? Math.round(parseFloat(newPromo.min_subtotal_cents) * 100) : 0,
          max_uses: newPromo.max_uses || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to create code'); return }
      setActionMsg('Promo code created')
      setNewPromo({ code: '', kind: 'percent', value: '', min_subtotal_cents: '', max_uses: '' })
      fetchAll()
    } catch (err) {
      setError('Failed to create code')
    }
  }

  async function togglePromo(id, active) {
    try {
      await fetch(`${API_URL}/api/admin/promo-codes/${id}`, {
        method: 'PATCH', headers, body: JSON.stringify({ active }),
      })
      fetchAll()
    } catch (err) {
      setError('Failed to update code')
    }
  }

  async function createClass() {
    if (!newClass.title || !newClass.starts_at || !newClass.price) return
    try {
      const res = await fetch(`${API_URL}/api/admin/class-sessions`, {
        method: 'POST', headers,
        body: JSON.stringify({
          title: newClass.title,
          description: newClass.description,
          starts_at: new Date(newClass.starts_at).toISOString(),
          duration_mins: parseInt(newClass.duration_mins, 10) || 120,
          capacity: parseInt(newClass.capacity, 10) || 8,
          price_cents: Math.round(parseFloat(newClass.price) * 100),
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to create class'); return }
      setActionMsg('Class created')
      setNewClass({ title: 'Coffee Masterclass', starts_at: '', duration_mins: 120, capacity: 8, price: '99', description: '' })
      fetchAll()
    } catch (err) {
      setError('Failed to create class')
    }
  }

  async function toggleClass(id, active) {
    try {
      await fetch(`${API_URL}/api/admin/class-sessions/${id}`, { method: 'PATCH', headers, body: JSON.stringify({ active }) })
      fetchAll()
    } catch (err) { setError('Failed to update class') }
  }

  async function loadAttendees(id) {
    if (attendees[id]) { setAttendees(a => { const n = { ...a }; delete n[id]; return n }); return }
    try {
      const res = await fetch(`${API_URL}/api/admin/class-sessions/${id}/bookings`, { headers })
      const data = await res.json()
      setAttendees(a => ({ ...a, [id]: Array.isArray(data) ? data : [] }))
    } catch (err) { setError('Failed to load attendees') }
  }

  async function saveProduct() {
    const p = editing
    const body = {
      id: p.id, category: p.category || 'coffee', name: p.name, sub: p.sub || null,
      weight: p.weight || null, price_cents: Math.round(parseFloat(p.price || 0) * 100),
      image: p.image || null, fit: p.fit || 'contain', blurb: p.blurb || null,
      origin: p.origin || null, roast: p.roast || null,
      notes: p.notes ? String(p.notes).split(',').map(s => s.trim()).filter(Boolean) : null,
      rating: p.rating ? parseFloat(p.rating) : null, reviews: p.reviews ? parseInt(p.reviews, 10) : null,
      active: p.active !== false,
    }
    if (!body.name || !body.price_cents) { setError('Name and price are required'); return }
    try {
      const url = p._new ? `${API_URL}/api/admin/shop-products` : `${API_URL}/api/admin/shop-products/${p._id}`
      const res = await fetch(url, { method: p._new ? 'POST' : 'PATCH', headers, body: JSON.stringify(body) })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to save product'); return }
      setActionMsg('Product saved')
      setEditing(null)
      fetchAll()
    } catch (err) { setError('Failed to save product') }
  }

  async function deleteProduct(id) {
    if (!window.confirm('Delete this product?')) return
    try {
      await fetch(`${API_URL}/api/admin/shop-products/${id}`, { method: 'DELETE', headers })
      setActionMsg('Product deleted')
      fetchAll()
    } catch (err) { setError('Failed to delete product') }
  }

  function openEdit(p) {
    setEditing({ ...p, _id: p.id, _new: false, price: (p.price_cents / 100).toFixed(2), notes: Array.isArray(p.notes) ? p.notes.join(', ') : '' })
  }
  function openNew() {
    setEditing({ _new: true, category: 'coffee', fit: 'contain', active: true, price: '', name: '' })
  }

  async function saveSettings() {
    try {
      await fetch(`${API_URL}/api/admin/site-settings`, { method: 'PATCH', headers, body: JSON.stringify({ announcement: settings.announcement || '' }) })
      setActionMsg('Marketing settings saved')
    } catch (err) { setError('Failed to save settings') }
  }

  async function uploadImage(file) {
    if (!file) return
    setUploading(true)
    setError(null)
    try {
      const res = await fetch(`${API_URL}/api/admin/upload?filename=${encodeURIComponent(file.name)}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${auth.token}`, 'Content-Type': file.type || 'application/octet-stream' },
        body: file,
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Upload failed'); return }
      setEditing(x => ({ ...x, image: data.url, fit: x?.fit || 'cover' }))
    } catch (err) { setError('Upload failed') } finally { setUploading(false) }
  }

  async function createCategory() {
    if (!newCat.trim()) return
    try {
      const res = await fetch(`${API_URL}/api/admin/categories`, { method: 'POST', headers, body: JSON.stringify({ label: newCat.trim(), sort: productCats.length }) })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to add category'); return }
      setActionMsg('Category added')
      setNewCat('')
      fetchAll()
    } catch (err) { setError('Failed to add category') }
  }

  async function deleteCategory(id) {
    if (!window.confirm(`Delete the "${id}" category? Products keep their category label but it won't show as a filter.`)) return
    try {
      await fetch(`${API_URL}/api/admin/categories/${id}`, { method: 'DELETE', headers })
      fetchAll()
    } catch (err) { setError('Failed to delete category') }
  }

  async function toggleFeatured(p) {
    try {
      await fetch(`${API_URL}/api/admin/shop-products/${p.id}`, { method: 'PATCH', headers, body: JSON.stringify({ featured: !p.featured }) })
      fetchAll()
    } catch (err) { setError('Failed to update product') }
  }

  const filteredSubs = subFilter === 'all' ? subscriptions : subscriptions.filter(s => s.status === subFilter)

  // Unify subscription-delivery orders and one-off shop orders into one list.
  // Subscription orders get a synthesised single line item so the shared table
  // + detail modal render uniformly.
  const allOrders = [
    ...shopOrders.map(o => ({ ...o, _type: 'shop' })),
    ...orders.map(o => ({
      ...o,
      _type: 'subscription',
      order_number: `SUB-${String(o.id || '').slice(0, 6).toUpperCase()}`,
      items: [{ name: `${o.product_name} · ${o.quantity_grams}g · ${o.frequency}`, qty: 1, unit_cents: o.amount_cents }],
      subtotal_cents: o.amount_cents,
      shipping_cents: 0,
    })),
  ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

  // Re-derive from the latest fetch so the modal reflects status/tracking updates.
  const activeOrder = selectedOrder ? (allOrders.find(o => o.id === selectedOrder.id) || selectedOrder) : null

  async function shipOrder(order, number, carrier) {
    if (!number) return
    const url = order._type === 'shop'
      ? `${API_URL}/api/admin/shop-orders/${order.id}`
      : `${API_URL}/api/admin/orders/${order.id}/tracking`
    const body = order._type === 'shop'
      ? { tracking_number: number, tracking_carrier: carrier, status: 'shipped' }
      : { tracking_number: number, tracking_carrier: carrier }
    try {
      await fetch(url, { method: 'PATCH', headers, body: JSON.stringify(body) })
      setActionMsg('Order updated')
      fetchAll()
    } catch (err) {
      setError('Failed to update order')
    }
  }

  return (
    <div className="admin">
      {/* Nav */}
      <div className="admin-nav">
        <img src="/Rafaels_Coffee_logo-with-ESB.png" alt="Rafael's Coffee" className="admin-nav-logo" />
        <div className="admin-nav-tabs">
          {[['dashboard','Overview','📊'], ['orders','Orders','🧾'], ['logistics','Logistics','🚚'], ['products','Products','☕'], ['subscriptions','Subscriptions','🔁'], ['classes','Classes','🎓'], ['marketing','Marketing','📣'], ['promos','Promo Codes','🏷️']].map(([v, l, icon]) => (
            <button key={v} className={`admin-tab ${view === v ? 'active' : ''}`} onClick={() => setView(v)}><span className="admin-tab-icon">{icon}</span>{l}</button>
          ))}
        </div>
        <button className="btn-ghost admin-logout" onClick={onLogout}>Sign out</button>
      </div>

      <div className="admin-body">
        {error && <div className="admin-error">{error}</div>}
        {actionMsg && <div className="admin-success" onClick={() => setActionMsg(null)}>{actionMsg} ✕</div>}
        {loading && <div className="admin-loading">Loading...</div>}

        {/* Overview / Dashboard */}
        {view === 'dashboard' && dashData && dashData.stats && (
          <div className="admin-section">
            <h2 className="admin-section-title">DASHBOARD</h2>

            {/* KPI cards */}
            <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))' }}>
              <MetricCard icon="💰" iconBg="rgba(64,32,32,0.1)" label="Revenue · 30 days" value={`$${(dashData.stats.revenue_30_days / 100).toFixed(2)}`} sub="Subs + shop + classes" />
              <MetricCard icon="♻️" iconBg="rgba(39,103,73,0.12)" label="Active subscriptions" value={dashData.stats.active_subscriptions} sub={`${dashData.stats.paused_subscriptions} paused`} />
              <MetricCard icon="🛍️" iconBg="rgba(43,108,176,0.12)" label="Shop orders" value={dashData.stats.shop_orders_total} sub={`$${(dashData.stats.shop_revenue_30_days / 100).toFixed(2)} in 30 days`} />
              <MetricCard icon="🎓" iconBg="rgba(192,86,33,0.12)" label="Class seats booked" value={dashData.stats.class_seats_booked} sub={`${dashData.stats.upcoming_classes} upcoming`} />
            </div>

            {/* chart + breakdown */}
            <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', marginTop: 16 }}>
              <div style={{ gridColumn: 'span 2', minWidth: 280, background: '#fff', border: '1px solid #e4e7ec', borderRadius: 14, padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <h3 style={{ fontFamily: 'var(--font-heading)', textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: 13, color: 'var(--dark)' }}>Revenue · last 14 days</h3>
                  <span style={{ fontSize: 12, color: 'var(--mid)' }}>AUD</span>
                </div>
                <MiniBarChart data={dashData.revenue_series || []} />
              </div>
              <div style={{ background: '#fff', border: '1px solid #e4e7ec', borderRadius: 14, padding: 20 }}>
                <h3 style={{ fontFamily: 'var(--font-heading)', textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: 13, color: 'var(--dark)', marginBottom: 14 }}>Subscriptions</h3>
                <BreakdownRow colour="#2f855a" label="Active" value={dashData.stats.active_subscriptions} />
                <BreakdownRow colour="#c05621" label="Paused" value={dashData.stats.paused_subscriptions} />
                <BreakdownRow colour="#a0aec0" label="Cancelled" value={dashData.stats.cancelled_subscriptions} />
                <div style={{ borderTop: '1px solid #eee', marginTop: 12, paddingTop: 12 }}>
                  <BreakdownRow colour="var(--red)" label="Active promo codes" value={dashData.stats.active_promos} />
                </div>
              </div>
            </div>

            {/* recent orders */}
            <div style={{ background: '#fff', border: '1px solid #e4e7ec', borderRadius: 14, padding: 20, marginTop: 16 }}>
              <h3 style={{ fontFamily: 'var(--font-heading)', textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: 13, color: 'var(--dark)', marginBottom: 12 }}>Recent orders</h3>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead><tr><th>Order</th><th>Type</th><th>Customer</th><th>Total</th><th>Status</th><th>Date</th></tr></thead>
                  <tbody>
                    {allOrders.slice(0, 6).map(o => (
                      <tr key={`${o._type}-${o.id}`} onClick={() => setSelectedOrder(o)} style={{ cursor: 'pointer' }}>
                        <td className="td-name">{o.order_number}</td>
                        <td><span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '3px 9px', borderRadius: 999, fontWeight: 600, background: o._type === 'subscription' ? 'rgba(176,137,91,0.16)' : 'rgba(64,32,32,0.08)', color: o._type === 'subscription' ? '#8a6033' : 'var(--red)' }}>{o._type === 'subscription' ? 'Subscription' : 'Shop'}</span></td>
                        <td><div className="td-name">{o.first_name} {o.last_name}</div><div className="td-email">{o.email}</div></td>
                        <td>${(o.amount_cents / 100).toFixed(2)}</td>
                        <td><span className={`status-badge status-${o.status}`}>{o.status}</span></td>
                        <td>{new Date(o.created_at).toLocaleDateString('en-AU')}</td>
                      </tr>
                    ))}
                    {allOrders.length === 0 && <tr><td colSpan={6} className="admin-empty-row">No orders yet</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
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

        {/* Orders — subscription deliveries + one-off shop orders, unified */}
        {view === 'orders' && (
          <div className="admin-section">
            <h2 className="admin-section-title">ORDERS</h2>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Type</th>
                    <th>Customer</th>
                    <th>Summary</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {allOrders.map(o => (
                    <tr key={`${o._type}-${o.id}`} onClick={() => setSelectedOrder(o)} style={{ cursor: 'pointer' }}>
                      <td className="td-name">{o.order_number}</td>
                      <td>
                        <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '3px 9px', borderRadius: 999, fontWeight: 600, whiteSpace: 'nowrap', background: o._type === 'subscription' ? 'rgba(176,137,91,0.16)' : 'rgba(64,32,32,0.08)', color: o._type === 'subscription' ? '#8a6033' : 'var(--red)' }}>
                          {o._type === 'subscription' ? 'Subscription' : 'Shop'}
                        </span>
                      </td>
                      <td><div className="td-name">{o.first_name} {o.last_name}</div><div className="td-email">{o.email}</div></td>
                      <td>{(o.items || []).map(i => `${i.qty}× ${i.name}`).join(', ')}</td>
                      <td>${(o.amount_cents / 100).toFixed(2)}</td>
                      <td><span className={`status-badge status-${o.status}`}>{o.status}</span></td>
                      <td>{new Date(o.created_at).toLocaleDateString('en-AU')}</td>
                    </tr>
                  ))}
                  {allOrders.length === 0 && (
                    <tr><td colSpan={7} className="admin-empty-row">No orders yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Logistics — fulfilment queue */}
        {view === 'logistics' && (() => {
          const toFulfil = allOrders.filter(o => !o.tracking_number && !['shipped', 'delivered', 'cancelled'].includes(o.status))
          const shipped = allOrders.filter(o => o.tracking_number || ['shipped', 'delivered'].includes(o.status))
          return (
            <div className="admin-section">
              <h2 className="admin-section-title">LOGISTICS</h2>
              <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                <MetricCard icon="📦" iconBg="rgba(181,71,8,0.12)" label="To fulfil" value={toFulfil.length} sub="awaiting dispatch" />
                <MetricCard icon="✅" iconBg="rgba(2,122,72,0.12)" label="Shipped" value={shipped.length} sub="with tracking" />
              </div>

              <h3 className="admin-sub-title">To fulfil</h3>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead><tr><th>Order</th><th>Type</th><th>Customer</th><th>Items</th><th>Address</th><th>Ship</th></tr></thead>
                  <tbody>
                    {toFulfil.map(o => (
                      <tr key={`${o._type}-${o.id}`}>
                        <td className="td-name" style={{ cursor: 'pointer' }} onClick={() => setSelectedOrder(o)}>{o.order_number}</td>
                        <td><span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '3px 9px', borderRadius: 999, fontWeight: 600, background: o._type === 'subscription' ? 'rgba(70,95,255,0.12)' : 'rgba(29,41,57,0.08)', color: o._type === 'subscription' ? '#465fff' : '#1d2939' }}>{o._type === 'subscription' ? 'Subscription' : 'Shop'}</span></td>
                        <td><div className="td-name">{o.first_name} {o.last_name}</div><div className="td-email">{o.email}</div></td>
                        <td style={{ maxWidth: 200 }}>{(o.items || []).map(i => `${i.qty}× ${i.name}`).join(', ')}</td>
                        <td><div className="td-address">{o.shipping_address_1}<br />{o.shipping_suburb} {o.shipping_state} {o.shipping_postcode}</div></td>
                        <td>
                          <div className="tracking-input-group">
                            <input type="text" placeholder="Tracking #" className="tracking-input" value={shopTracking[o.id]?.number || ''} onChange={e => setShopTracking(t => ({ ...t, [o.id]: { ...t[o.id], number: e.target.value } }))} />
                            <input type="text" placeholder="Carrier" className="tracking-input carrier" value={shopTracking[o.id]?.carrier || ''} onChange={e => setShopTracking(t => ({ ...t, [o.id]: { ...t[o.id], carrier: e.target.value } }))} />
                            <button className="admin-action-btn" disabled={!shopTracking[o.id]?.number} onClick={() => shipOrder(o, shopTracking[o.id]?.number, shopTracking[o.id]?.carrier)}>Ship</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {toFulfil.length === 0 && <tr><td colSpan={6} className="admin-empty-row">Nothing to fulfil — all caught up 🎉</td></tr>}
                  </tbody>
                </table>
              </div>

              <h3 className="admin-sub-title">Recently shipped</h3>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead><tr><th>Order</th><th>Customer</th><th>Tracking</th><th>Carrier</th><th>Date</th></tr></thead>
                  <tbody>
                    {shipped.slice(0, 15).map(o => (
                      <tr key={`${o._type}-${o.id}`} onClick={() => setSelectedOrder(o)} style={{ cursor: 'pointer' }}>
                        <td className="td-name">{o.order_number}</td>
                        <td><div className="td-name">{o.first_name} {o.last_name}</div></td>
                        <td>{o.tracking_number || '—'}</td>
                        <td>{o.tracking_carrier || '—'}</td>
                        <td>{o.shipped_at ? new Date(o.shipped_at).toLocaleDateString('en-AU') : new Date(o.created_at).toLocaleDateString('en-AU')}</td>
                      </tr>
                    ))}
                    {shipped.length === 0 && <tr><td colSpan={5} className="admin-empty-row">No shipped orders yet</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )
        })()}

        {/* Products (catalogue) */}
        {view === 'products' && (
          <div className="admin-section">
            <div className="admin-section-header">
              <h2 className="admin-section-title">PRODUCTS</h2>
              <button className="admin-action-btn" onClick={openNew}>+ Add product</button>
            </div>

            <div style={{ background: '#fff', border: '1px solid #e4e7ec', borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--dark)', marginBottom: 10 }}>Categories</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                {productCats.map(c => (
                  <span key={c.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 10px', background: '#f2f4f7', borderRadius: 999, fontSize: 13, color: 'var(--dark)' }}>
                    {c.label}
                    <button onClick={() => deleteCategory(c.id)} title="Delete category" style={{ background: 'none', border: 'none', color: 'var(--mid)', cursor: 'pointer', fontSize: 15, lineHeight: 1 }}>×</button>
                  </span>
                ))}
                <input className="tracking-input" placeholder="New category" value={newCat} onChange={e => setNewCat(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); createCategory() } }} />
                <button className="admin-action-btn" onClick={createCategory} disabled={!newCat.trim()}>Add</button>
              </div>
            </div>

            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead><tr><th></th><th>Product</th><th>Category</th><th>Price</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {catalog.map(p => (
                    <tr key={p.id}>
                      <td style={{ width: 52 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 8, background: '#fff', border: '1px solid #eee', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {p.image && <img src={p.image} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: p.fit === 'cover' ? 'cover' : 'contain' }} />}
                        </div>
                      </td>
                      <td><div className="td-name">{p.name}</div><div className="td-email">{p.sub || ''}</div></td>
                      <td style={{ textTransform: 'capitalize' }}>{p.category}</td>
                      <td>${(p.price_cents / 100).toFixed(2)}</td>
                      <td><span className={`status-badge status-${p.active ? 'active' : 'cancelled'}`}>{p.active ? 'active' : 'hidden'}</span></td>
                      <td>
                        <div className="admin-row-actions">
                          <button className="admin-action-btn" onClick={() => openEdit(p)}>Edit</button>
                          <button className="admin-action-btn danger" onClick={() => deleteProduct(p.id)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {catalog.length === 0 && <tr><td colSpan={6} className="admin-empty-row">No products yet</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Classes (E3) */}
        {view === 'classes' && (
          <div className="admin-section">
            <h2 className="admin-section-title">CLASSES</h2>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'flex-end', marginBottom: 20, padding: 16, border: '1px solid rgba(64,32,32,0.12)', borderRadius: 10, background: '#fff' }}>
              <label style={{ display: 'flex', flexDirection: 'column', fontSize: 12, color: 'var(--mid)', gap: 4 }}>Title
                <input className="tracking-input" style={{ minWidth: 180 }} value={newClass.title} onChange={e => setNewClass(c => ({ ...c, title: e.target.value }))} />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', fontSize: 12, color: 'var(--mid)', gap: 4 }}>Date &amp; time
                <input className="tracking-input" type="datetime-local" value={newClass.starts_at} onChange={e => setNewClass(c => ({ ...c, starts_at: e.target.value }))} />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', fontSize: 12, color: 'var(--mid)', gap: 4 }}>Mins
                <input className="tracking-input" type="number" style={{ width: 70 }} value={newClass.duration_mins} onChange={e => setNewClass(c => ({ ...c, duration_mins: e.target.value }))} />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', fontSize: 12, color: 'var(--mid)', gap: 4 }}>Capacity
                <input className="tracking-input" type="number" style={{ width: 80 }} value={newClass.capacity} onChange={e => setNewClass(c => ({ ...c, capacity: e.target.value }))} />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', fontSize: 12, color: 'var(--mid)', gap: 4 }}>Price ($)
                <input className="tracking-input" type="number" style={{ width: 80 }} value={newClass.price} onChange={e => setNewClass(c => ({ ...c, price: e.target.value }))} />
              </label>
              <button className="admin-action-btn" onClick={createClass} disabled={!newClass.title || !newClass.starts_at || !newClass.price}>Add class</button>
            </div>

            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr><th>Class</th><th>When</th><th>Booked</th><th>Price</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {classSessions.map(s => (
                    <Fragment key={s.id}>
                      <tr>
                        <td className="td-name">{s.title}</td>
                        <td>{new Date(s.starts_at).toLocaleString('en-AU', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}</td>
                        <td>{s.booked} / {s.capacity}</td>
                        <td>${(s.price_cents / 100).toFixed(2)}</td>
                        <td><span className={`status-badge status-${s.active ? 'active' : 'cancelled'}`}>{s.active ? 'active' : 'inactive'}</span></td>
                        <td>
                          <div className="admin-row-actions">
                            <button className="admin-action-btn" onClick={() => loadAttendees(s.id)}>{attendees[s.id] ? 'Hide' : `Attendees (${s.bookings_count})`}</button>
                            <button className="admin-action-btn" onClick={() => toggleClass(s.id, !s.active)}>{s.active ? 'Deactivate' : 'Activate'}</button>
                          </div>
                        </td>
                      </tr>
                      {attendees[s.id] && (
                        <tr>
                          <td colSpan={6} style={{ background: '#faf7f2' }}>
                            {attendees[s.id].length === 0 ? (
                              <span className="td-email">No bookings yet</span>
                            ) : (
                              <div style={{ display: 'grid', gap: 6, padding: '4px 0' }}>
                                {attendees[s.id].map(b => (
                                  <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                                    <span><strong>{b.name}</strong> · {b.email}{b.phone ? ` · ${b.phone}` : ''}</span>
                                    <span className="td-email">{b.seats} seat{b.seats > 1 ? 's' : ''} · ${(b.amount_cents / 100).toFixed(2)}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                  {classSessions.length === 0 && (
                    <tr><td colSpan={6} className="admin-empty-row">No classes yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Marketing */}
        {view === 'marketing' && (
          <div className="admin-section">
            <h2 className="admin-section-title">MARKETING</h2>

            <div style={{ background: '#fff', border: '1px solid #e4e7ec', borderRadius: 12, padding: 20 }}>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 700, color: 'var(--dark)' }}>Announcement banner</h3>
              <p style={{ fontSize: 13, color: 'var(--mid)', margin: '4px 0 12px' }}>Shown across the top of the shop.</p>
              <textarea className="tracking-input" style={{ width: '100%' }} rows={2} value={settings.announcement || ''} onChange={e => setSettings(s => ({ ...s, announcement: e.target.value }))} />
              <button className="admin-action-btn" style={{ background: 'var(--red)', color: '#fff', marginTop: 12 }} onClick={saveSettings}>Save banner</button>
            </div>

            <div style={{ background: '#fff', border: '1px solid #e4e7ec', borderRadius: 12, padding: 20 }}>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 700, color: 'var(--dark)' }}>Featured on the homepage</h3>
              <p style={{ fontSize: 13, color: 'var(--mid)', margin: '4px 0 12px' }}>Pick products to fan out in the hero. If fewer than 3 are featured, the first coffees are shown.</p>
              <div style={{ display: 'grid', gap: 8 }}>
                {catalog.map(p => (
                  <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: 'var(--dark)' }}>
                    <input type="checkbox" checked={!!p.featured} onChange={() => toggleFeatured(p)} />
                    <span>{p.name}</span>
                    <span className="td-email" style={{ marginLeft: 'auto', textTransform: 'capitalize' }}>{p.category}</span>
                  </label>
                ))}
                {catalog.length === 0 && <span className="td-email">No products yet</span>}
              </div>
            </div>

            <div style={{ background: '#fff', border: '1px solid #e4e7ec', borderRadius: 12, padding: 20 }}>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 700, color: 'var(--dark)' }}>Promo codes</h3>
              <p style={{ fontSize: 13, color: 'var(--mid)', margin: '4px 0 12px' }}>Create and manage discount codes.</p>
              <button className="admin-action-btn" onClick={() => setView('promos')}>Go to Promo Codes →</button>
            </div>
          </div>
        )}

        {/* Promo Codes (E5) */}
        {view === 'promos' && (
          <div className="admin-section">
            <h2 className="admin-section-title">PROMO CODES</h2>

            {/* create form */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'flex-end', marginBottom: 20, padding: 16, border: '1px solid rgba(64,32,32,0.12)', borderRadius: 10, background: '#fff' }}>
              <label style={{ display: 'flex', flexDirection: 'column', fontSize: 12, color: 'var(--mid)', gap: 4 }}>Code
                <input className="tracking-input" style={{ textTransform: 'uppercase' }} value={newPromo.code} onChange={e => setNewPromo(p => ({ ...p, code: e.target.value }))} placeholder="WELCOME10" />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', fontSize: 12, color: 'var(--mid)', gap: 4 }}>Type
                <select className="tracking-input" value={newPromo.kind} onChange={e => setNewPromo(p => ({ ...p, kind: e.target.value }))}>
                  <option value="percent">Percent %</option>
                  <option value="fixed">Fixed $</option>
                </select>
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', fontSize: 12, color: 'var(--mid)', gap: 4 }}>{newPromo.kind === 'percent' ? 'Value (%)' : 'Value ($)'}
                <input className="tracking-input" type="number" value={newPromo.value} onChange={e => setNewPromo(p => ({ ...p, value: e.target.value }))} placeholder={newPromo.kind === 'percent' ? '10' : '5'} />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', fontSize: 12, color: 'var(--mid)', gap: 4 }}>Min spend ($)
                <input className="tracking-input" type="number" value={newPromo.min_subtotal_cents} onChange={e => setNewPromo(p => ({ ...p, min_subtotal_cents: e.target.value }))} placeholder="0" />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', fontSize: 12, color: 'var(--mid)', gap: 4 }}>Max uses
                <input className="tracking-input" type="number" value={newPromo.max_uses} onChange={e => setNewPromo(p => ({ ...p, max_uses: e.target.value }))} placeholder="∞" />
              </label>
              <button className="admin-action-btn" onClick={createPromo} disabled={!newPromo.code || !newPromo.value}>Create code</button>
            </div>

            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr><th>Code</th><th>Discount</th><th>Min spend</th><th>Uses</th><th>Status</th><th>Action</th></tr>
                </thead>
                <tbody>
                  {promoCodes.map(p => (
                    <tr key={p.id}>
                      <td className="td-name">{p.code}</td>
                      <td>{p.kind === 'percent' ? `${p.value}%` : `$${(p.value / 100).toFixed(2)}`}</td>
                      <td>{p.min_subtotal_cents ? `$${(p.min_subtotal_cents / 100).toFixed(2)}` : '—'}</td>
                      <td>{p.uses}{p.max_uses ? ` / ${p.max_uses}` : ''}</td>
                      <td><span className={`status-badge status-${p.active ? 'active' : 'cancelled'}`}>{p.active ? 'active' : 'inactive'}</span></td>
                      <td><button className="admin-action-btn" onClick={() => togglePromo(p.id, !p.active)}>{p.active ? 'Deactivate' : 'Activate'}</button></td>
                    </tr>
                  ))}
                  {promoCodes.length === 0 && (
                    <tr><td colSpan={6} className="admin-empty-row">No promo codes yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Order detail modal */}
      {activeOrder && (
        <div
          onClick={() => setSelectedOrder(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(20,10,10,0.5)', zIndex: 200, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '48px 16px', overflowY: 'auto' }}
        >
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 760, boxShadow: '0 24px 70px rgba(0,0,0,0.3)' }}>
            {/* header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '22px 26px', borderBottom: '1px solid #eee' }}>
              <div>
                <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 22, letterSpacing: '0.03em', color: 'var(--red)' }}>Order #{activeOrder.order_number}</div>
                <div style={{ color: 'var(--mid)', fontSize: 13, marginTop: 2 }}>{new Date(activeOrder.created_at).toLocaleString('en-AU')}</div>
              </div>
              <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                <span className={`status-badge status-${activeOrder.status}`}>{activeOrder.status}</span>
                <button onClick={() => setSelectedOrder(null)} aria-label="Close" style={{ background: 'none', border: 'none', fontSize: 22, lineHeight: 1, color: 'var(--mid)', cursor: 'pointer' }}>✕</button>
              </div>
            </div>

            <div style={{ display: 'grid', gap: 26, padding: 26, gridTemplateColumns: '1fr' }}>
              {/* line items */}
              <div>
                <h4 style={{ fontFamily: 'var(--font-heading)', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: 12, color: 'var(--mid)', marginBottom: 10 }}>Items</h4>
                <table className="admin-table" style={{ width: '100%' }}>
                  <thead><tr><th>Product</th><th>Qty</th><th>Unit</th><th style={{ textAlign: 'right' }}>Total</th></tr></thead>
                  <tbody>
                    {(activeOrder.items || []).map((i, idx) => (
                      <tr key={idx}>
                        <td>{i.name}</td>
                        <td>{i.qty}</td>
                        <td>${((i.unit_cents || 0) / 100).toFixed(2)}</td>
                        <td style={{ textAlign: 'right' }}>${(((i.unit_cents || 0) * i.qty) / 100).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ marginTop: 14, marginLeft: 'auto', maxWidth: 260 }}>
                  <Row2 label="Subtotal" value={`$${((activeOrder.subtotal_cents || 0) / 100).toFixed(2)}`} />
                  <Row2 label="Shipping" value={activeOrder.shipping_cents ? `$${(activeOrder.shipping_cents / 100).toFixed(2)}` : 'Free'} />
                  {activeOrder.discount_cents > 0 && <Row2 label="Discount" value={`− $${(activeOrder.discount_cents / 100).toFixed(2)}`} />}
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #eee', paddingTop: 8, marginTop: 8, fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--red)', fontSize: 18 }}>
                    <span>Total</span><span>${((activeOrder.amount_cents || 0) / 100).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* details grid */}
              <div style={{ display: 'grid', gap: 20, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                <DetailBlock title="Customer">
                  <div>{activeOrder.first_name} {activeOrder.last_name}</div>
                  <div style={{ color: 'var(--mid)' }}>{activeOrder.email}</div>
                  {activeOrder.phone && <div style={{ color: 'var(--mid)' }}>{activeOrder.phone}</div>}
                </DetailBlock>
                <DetailBlock title="Shipping address">
                  <div>{activeOrder.shipping_address_1}</div>
                  <div>{activeOrder.shipping_suburb} {activeOrder.shipping_state} {activeOrder.shipping_postcode}</div>
                </DetailBlock>
                <DetailBlock title="Payment">
                  <div>Square</div>
                  <div style={{ color: 'var(--mid)', fontSize: 12, wordBreak: 'break-all' }}>{activeOrder.square_payment_id || '—'}</div>
                </DetailBlock>
                <DetailBlock title="Fulfilment">
                  {activeOrder.tracking_number ? (
                    <>
                      <div>{activeOrder.tracking_number}</div>
                      {activeOrder.tracking_carrier && <div style={{ color: 'var(--mid)' }}>{activeOrder.tracking_carrier}</div>}
                      {activeOrder.shipped_at && <div style={{ color: 'var(--mid)', fontSize: 12 }}>Shipped {new Date(activeOrder.shipped_at).toLocaleDateString('en-AU')}</div>}
                    </>
                  ) : (
                    <div className="tracking-input-group" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 6 }}>
                      <input type="text" placeholder="Tracking #" className="tracking-input"
                        value={shopTracking[activeOrder.id]?.number || ''}
                        onChange={e => setShopTracking(t => ({ ...t, [activeOrder.id]: { ...t[activeOrder.id], number: e.target.value } }))} />
                      <input type="text" placeholder="Carrier" className="tracking-input carrier"
                        value={shopTracking[activeOrder.id]?.carrier || ''}
                        onChange={e => setShopTracking(t => ({ ...t, [activeOrder.id]: { ...t[activeOrder.id], carrier: e.target.value } }))} />
                      <button className="admin-action-btn" disabled={!shopTracking[activeOrder.id]?.number}
                        onClick={() => shipOrder(activeOrder, shopTracking[activeOrder.id]?.number, shopTracking[activeOrder.id]?.carrier)}>
                        Mark shipped
                      </button>
                    </div>
                  )}
                </DetailBlock>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add / edit product modal */}
      {editing && (
        <div onClick={() => setEditing(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(20,10,10,0.5)', zIndex: 200, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '40px 16px', overflowY: 'auto' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 620, boxShadow: '0 24px 70px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #eee' }}>
              <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 20, color: 'var(--red)' }}>{editing._new ? 'Add product' : 'Edit product'}</div>
              <button onClick={() => setEditing(null)} style={{ background: 'none', border: 'none', fontSize: 22, color: 'var(--mid)', cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ padding: 24, display: 'grid', gap: 14, gridTemplateColumns: '1fr 1fr' }}>
              <Field label="Name" span2 value={editing.name} onChange={v => setEditing(e => ({ ...e, name: v }))} />
              <SelectField label="Category" value={editing.category} options={productCats.length ? productCats.map(c => ({ value: c.id, label: c.label })) : ['coffee', 'accessories', 'classes']} onChange={v => setEditing(e => ({ ...e, category: v }))} />
              <Field label="Price ($)" type="number" value={editing.price} onChange={v => setEditing(e => ({ ...e, price: v }))} />
              <Field label="Subtitle (blend / tagline)" span2 value={editing.sub} onChange={v => setEditing(e => ({ ...e, sub: v }))} />
              <Field label="Weight (e.g. 250g)" value={editing.weight} onChange={v => setEditing(e => ({ ...e, weight: v }))} />
              <SelectField label="Image fit" value={editing.fit} options={['contain', 'cover']} onChange={v => setEditing(e => ({ ...e, fit: v }))} />
              <Field label="Image URL / path" span2 value={editing.image} onChange={v => setEditing(e => ({ ...e, image: v }))} placeholder="/products/onesto.png or https://…" />
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: 'var(--mid)', gridColumn: '1 / -1' }}>
                Or upload an image{uploading && <span style={{ color: 'var(--red)' }}> · uploading…</span>}
                <input type="file" accept="image/*" onChange={e => uploadImage(e.target.files?.[0])} />
                {editing.image && <img src={editing.image} alt="" style={{ marginTop: 4, height: 64, width: 64, objectFit: 'contain', border: '1px solid #e4e7ec', borderRadius: 8, background: '#fff' }} />}
              </label>
              <Field label="Origin" value={editing.origin} onChange={v => setEditing(e => ({ ...e, origin: v }))} />
              <Field label="Roast" value={editing.roast} onChange={v => setEditing(e => ({ ...e, roast: v }))} />
              <Field label="Blurb" span2 textarea value={editing.blurb} onChange={v => setEditing(e => ({ ...e, blurb: v }))} />
              <Field label="Tasting notes (comma separated)" span2 value={editing.notes} onChange={v => setEditing(e => ({ ...e, notes: v }))} />
              <Field label="Rating (0–5)" type="number" value={editing.rating} onChange={v => setEditing(e => ({ ...e, rating: v }))} />
              <Field label="Reviews" type="number" value={editing.reviews} onChange={v => setEditing(e => ({ ...e, reviews: v }))} />
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'var(--dark)' }}>
                <input type="checkbox" checked={editing.active !== false} onChange={e => setEditing(x => ({ ...x, active: e.target.checked }))} /> Visible in shop
              </label>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '0 24px 24px' }}>
              <button className="admin-action-btn" onClick={() => setEditing(null)}>Cancel</button>
              <button className="admin-action-btn" style={{ background: 'var(--red)', color: '#fff' }} onClick={saveProduct}>{editing._new ? 'Create product' : 'Save changes'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Field({ label, value, onChange, type = 'text', span2, textarea, placeholder }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: 'var(--mid)', gridColumn: span2 ? '1 / -1' : 'auto' }}>
      {label}
      {textarea
        ? <textarea className="tracking-input" rows={2} value={value || ''} placeholder={placeholder} onChange={e => onChange(e.target.value)} />
        : <input className="tracking-input" type={type} value={value ?? ''} placeholder={placeholder} onChange={e => onChange(e.target.value)} />}
    </label>
  )
}

function SelectField({ label, value, options, onChange }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: 'var(--mid)' }}>
      {label}
      <select className="tracking-input" value={value} onChange={e => onChange(e.target.value)}>
        {options.map(o => {
          const val = typeof o === 'string' ? o : o.value
          const lbl = typeof o === 'string' ? o : o.label
          return <option key={val} value={val}>{lbl}</option>
        })}
      </select>
    </label>
  )
}

function Row2({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: 'var(--dark)', padding: '2px 0' }}>
      <span style={{ color: 'var(--mid)' }}>{label}</span><span>{value}</span>
    </div>
  )
}

function DetailBlock({ title, children }) {
  return (
    <div>
      <h4 style={{ fontFamily: 'var(--font-heading)', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: 11, color: 'var(--mid)', marginBottom: 6 }}>{title}</h4>
      <div style={{ fontSize: 14, color: 'var(--dark)', lineHeight: 1.5 }}>{children}</div>
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
