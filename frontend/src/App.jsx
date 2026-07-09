import { useState, useEffect } from 'react'
import SubscribeWizard from './pages/SubscribeWizard'
import Portal from './pages/Portal'
import Admin from './pages/Admin'
import Shop from './pages/Shop'
import './App.css'

export default function App() {
  // Shop is the homepage. It also renders /about, /shop/* and /shop/checkout etc.
  const [page, setPage] = useState('shop')

  useEffect(() => {
    const path = window.location.pathname
    if (path.startsWith('/admin')) setPage('admin')
    else if (path.startsWith('/portal')) setPage('portal')
    else if (path.startsWith('/subscribe')) setPage('subscribe')
    else setPage('shop') // '/', '/shop*', '/about' → shop chrome
  }, [])

  return (
    <div className="app">
      {page === 'subscribe' && <SubscribeWizard onBack={() => (window.location.href = '/')} />}
      {page === 'portal' && <Portal />}
      {page === 'admin' && <Admin />}
      {page === 'shop' && <Shop />}
    </div>
  )
}
