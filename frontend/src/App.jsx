import { useState, useEffect } from 'react'
import LandingPage from './pages/LandingPage'
import SubscribeWizard from './pages/SubscribeWizard'
import Portal from './pages/Portal'
import Admin from './pages/Admin'
import Shop from './pages/Shop'
import './App.css'

export default function App() {
  // Shop is the homepage now. The original landing page is preserved at /about.
  const [page, setPage] = useState('shop')

  useEffect(() => {
    const path = window.location.pathname
    if (path.startsWith('/admin')) setPage('admin')
    else if (path.startsWith('/portal')) setPage('portal')
    else if (path.startsWith('/subscribe')) setPage('subscribe')
    else if (path.startsWith('/about')) setPage('home')
    else setPage('shop') // '/' and '/shop' → shop
  }, [])

  return (
    <div className="app">
      {page === 'home' && <LandingPage onSubscribe={() => setPage('subscribe')} />}
      {page === 'subscribe' && <SubscribeWizard onBack={() => (window.location.href = '/')} />}
      {page === 'portal' && <Portal />}
      {page === 'admin' && <Admin />}
      {page === 'shop' && <Shop />}
    </div>
  )
}
