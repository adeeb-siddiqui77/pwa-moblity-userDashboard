
import React, { useEffect, useState } from 'react'
import AppRoutes from './routes'
import Header from './components/Header'
import BottomNav from './components/BottomNav'
import Sidebar from './components/Sidebar'
import { Toaster } from 'react-hot-toast'
import MechanicSocket from "./components/MechanicSocket"
import MechanicAlertModal from './components/MechanicAlertModal';
import MechanicAlertsCenter from './components/MechanicAlertsCenter'
import MechanicRequestsCarousel from './components/MechanicRequestsCarousel'


export default function App() {
  const [authed, setAuthed] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    const user = JSON.parse(localStorage.getItem('user'));

    console.log("user", user?.id)
    setAuthed(!!token)
  }, [])

  return (
    <div className='mobile-shell'>
      {authed && <Header onMenu={() => setDrawerOpen(true)} />}
      <AppRoutes authed={authed} />
      {authed && <BottomNav />}
      <Sidebar open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      {/* {authed && user?.id && (
        <MechanicAlertModal mechanicId={user.id} serverUrl={import.meta.env.VITE_SOCKET_URL} />
      )} */}

      {/* {authed && user?.id && (
        <MechanicAlertsCenter mechanicId={user.id} serverUrl={import.meta.env.VITE_SOCKET_URL}} />
      )} */}
      
      {authed && user?.id && (
        <MechanicRequestsCarousel mechanicId={user.id} serverUrl={import.meta.env.VITE_SOCKET_URL}
      />
      )}


      {/* Toasts */}
      <Toaster position='top-center' toastOptions={{ duration: 2500 }} />
    </div>
  )
}
