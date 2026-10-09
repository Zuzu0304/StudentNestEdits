import { useEffect, useState } from 'react'
import Navbar from './components/Navbar.jsx'
import Hero from './components/Hero.jsx'
import FeatureSection from './components/FeatureSection.jsx'
import HowItWorks from './components/HowItWorks.jsx'
import AccommodationPreview from './components/AccommodationPreview.jsx'
import ProviderCTA from './components/ProviderCTA.jsx'
import Footer from './components/Footer.jsx'
import AuthPage from './components/AuthPage.jsx'
import Accommodation from './components/Accommodation.jsx'
import AccommodationDetails from './components/AccommodationDetails.jsx'
import StudentHub from './components/StudentHub.jsx'
import ProviderHub from './components/ProviderHub.jsx'
import InspectionHub from './components/InspectionHub.jsx'
import AdminHub from './components/AdminHub.jsx'
import StudentPayments from './components/StudentPayments.jsx'
import ProviderProfile from './components/ProviderProfile.jsx'
import Marketplace from './components/Marketplace.jsx'
import InspectorDraftProperty from './components/InspectorDraftProperty.jsx'
import { getStoredUser,  clearAuth, logout } from './lib_auth.js'
import { getToken } from './lib_api.js'
import './phase5.css'
import BackButton from './components/BackButton.jsx'

function getPageFromHash() {
  const hash = window.location.hash.replace('#', '')
  if (hash === 'login' || hash === 'signup') return hash
  if (hash === 'accommodation') return 'accommodation'
  if (hash === 'student-dashboard' || hash === 'roommates' || hash === 'takeovers' || hash === 'favourites' || hash === 'inquiries' || hash === 'reviews') return 'student-dashboard'
  if (hash === 'student-payments' || hash.startsWith('student-payments-')) return 'student-payments'
  if (hash === 'shop') return 'shop'
  if (hash === 'agent-dashboard' || hash === 'agent-properties' || hash === 'agent-inquiries' || hash === 'agent-verification' || hash === 'agent-profile') return 'agent-dashboard'
  if (hash === 'provider-dashboard') return 'provider-dashboard'
  if (hash === 'inspection-dashboard' || hash === 'inspection-queue') return 'inspection-dashboard'
  if (hash === 'admin-dashboard' || hash === 'admin-properties' || hash === 'admin-users' || hash === 'admin-verification' || hash === 'admin-reports' || hash === 'admin-analytics') return 'admin-dashboard'
  if (hash.startsWith('provider-')) return hash
  if (hash.startsWith('accommodation-')) return hash
  if (hash.startsWith('inspection-property-')) return hash
  return 'home'
}

function App() {
  const [page, setPage] = useState(getPageFromHash)

  useEffect(() => {
    const handleHashChange = () => setPage(getPageFromHash())
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  if (page === 'provider-dashboard') {
    const user = getStoredUser()
    if (!getToken() || user?.role !== 'provider') { window.location.hash='login'; return null }
    return <><BackButton /><Navbar /><ProviderHub /></>
  }

  if (page.startsWith('provider-')) {
    const id = page.replace('provider-', '')
    return (<><BackButton /><Navbar /><ProviderProfile id={id} /></>)
  }

  if (page.startsWith('inspection-property-')) {
    const id = page.replace('inspection-property-', '')
    return <><InspectorDraftProperty id={id} /></>
  }

  if (page.startsWith('accommodation-')) {
    const id = page.replace('accommodation-', '')
    return (
      <>
        <BackButton />
        <Navbar />
        <AccommodationDetails id={id} />
      </>
    )
  }

  if (page === 'admin-dashboard') {
    let user = null
    try { user = JSON.parse(localStorage.getItem('studentnest_user') || 'null') } catch { user = null }
    if (user?.role !== 'admin' || !localStorage.getItem('studentnest_token')) {
      window.location.hash = 'home'
      return null
    }
    return <><BackButton /><AdminHub /></>
  }

  if (page === 'agent-dashboard') {
    const user = getStoredUser()
    if (!getToken()) { window.location.hash = 'login'; return null }
    if (user?.role === 'inspector') return <InspectionHub />
    if (user?.role === 'provider') return (<><BackButton /><Navbar /><ProviderHub /></>)
    window.location.hash = 'login'; return null
  }

  if (page === 'inspection-dashboard') {
    const user = getStoredUser()
    if (!getToken() || user?.role !== 'inspector') { window.location.hash = 'login'; return null }
    return <><BackButton /><InspectionHub /></>
  }

  if (page === 'shop') {
    const user = getStoredUser()
    if (!getToken() || user?.role !== 'student') { window.location.hash = 'login'; return null }
    return (<><BackButton /><Navbar /><Marketplace /></>)
  }

  if (page === 'student-payments') {
    const user = getStoredUser()
    if (!getToken() || user?.role !== 'student') { window.location.hash = 'login'; return null }
    const propertyId = window.location.hash.startsWith('#student-payments-') ? window.location.hash.replace('#student-payments-', '') : null
    return (<><BackButton /><Navbar /><StudentPayments initialPropertyId={propertyId} /></>)
  }

  if (page === 'student-dashboard') {
    const user = getStoredUser()
    if (!getToken() || user?.role !== 'student') { window.location.hash = 'login'; return null }
    return (<><BackButton /><Navbar /><StudentHub /></>)
  }

  if (page === 'accommodation') {
    return (
      <>
        <BackButton />
        <Navbar />
        <Accommodation />
      </>
    )
  }

  if (page === 'login' || page === 'signup') {
    return (
      <>
        <BackButton />
        <Navbar />
        <AuthPage initialMode={page} />
      </>
    )
  }

  return (
    <>
      <BackButton />
      <Navbar />
      <main>
        <Hero />
        <FeatureSection />
        <HowItWorks />
        <AccommodationPreview />
        <ProviderCTA />
      </main>
      <Footer />
    </>
  )
}

export default App
