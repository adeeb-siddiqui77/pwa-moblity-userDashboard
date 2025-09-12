
import React, { useEffect, useState } from 'react'
import AppRoutes from './routes'
import Header from './components/Header'
import BottomNav from './components/BottomNav'
import Sidebar from './components/Sidebar'
import { Toaster } from 'react-hot-toast'

export default function App(){
  const [authed, setAuthed] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  

  useEffect(()=>{
    const token = localStorage.getItem('access_token')
    setAuthed(!!token)
  },[])

  return (
    <div className='mobile-shell'>
      {authed && <Header onMenu={()=>setDrawerOpen(true)} />}
      <AppRoutes authed={authed} />
      {authed && <BottomNav />}
      <Sidebar open={drawerOpen} onClose={()=>setDrawerOpen(false)} />
      {/* Toasts */}
      <Toaster position='top-center' toastOptions={{ duration: 2500 }} />
    </div>
  )
}
