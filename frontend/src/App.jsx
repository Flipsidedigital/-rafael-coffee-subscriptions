import { useState } from 'react'
import LandingPage from './pages/LandingPage'
import SubscribeWizard from './pages/SubscribeWizard'
import './App.css'

export default function App() {
  const [page, setPage] = useState('home')

  return (
    <div className="app">
      {page === 'home' && <LandingPage onSubscribe={() => setPage('subscribe')} />}
      {page === 'subscribe' && <SubscribeWizard onBack={() => setPage('home')} />}
    </div>
  )
}
