import { useState, useEffect } from 'react'
import LandingPage from './pages/LandingPage'
import SubscribeWizard from './pages/SubscribeWizard'
import Portal from './pages/Portal'
import Admin from './pages/Admin'
import Shop from './pages/Shop'
import './App.css'

export default function App() {
  const [page, setPage] = useState('home')

  useEffect(() => {
    const path = window.location.pathname
    if (path.startsWith('/admin')) setPage('admin')
    else if (path.startsWith('/portal')) setPage('portal')
    else if (path.startsWith('/shop')) setPage('shop')
  }, [])

  return (
    <div className="app">
      {page === 'home' && <LandingPage onSubscribe={() => setPage('subscribe')} />}
      {page === 'subscribe' && <SubscribeWizard onBack={() => setPage('home')} />}
      {page === 'portal' && <Portal />}
      {page === 'admin' && <Admin />}
      {page === 'shop' && <Shop />}
    </div>
  )
}
