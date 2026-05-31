import { useState, useEffect } from 'react'
import LandingPage from './pages/LandingPage'
import SubscribeWizard from './pages/SubscribeWizard'
import Portal from './pages/Portal'
import './App.css'

export default function App() {
  const [page, setPage] = useState('home')

  useEffect(() => {
    const path = window.location.pathname
    if (path === '/portal' || path.startsWith('/portal')) {
      setPage('portal')
    }
  }, [])

  return (
    <div className="app">
      {page === 'home' && <LandingPage onSubscribe={() => setPage('subscribe')} />}
      {page === 'subscribe' && <SubscribeWizard onBack={() => setPage('home')} />}
      {page === 'portal' && <Portal />}
    </div>
  )
}
