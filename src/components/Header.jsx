
import React from 'react'
import { useLocation } from 'react-router-dom'

export default function Header({ onMenu }){
  const { pathname } = useLocation()
  const titleMap = {
    '/':'Homescreen',
    '/jobs':'Jobs',
    '/payments':'Payments',
    '/profile':'Profile'
  }
  return (
    <div className='header card'>
      <button onClick={onMenu} className='btn' style={{padding:'8px 12px', width: 'auto', maxWidth: 'none', height: 'auto'}}>☰</button>
      <div className='brand'>
        {/* <img src='/logo.svg' alt='logo'/> */}
        <div className='brand-title'>JK Tyre PWA</div>
      </div>
      {/* <div style={{marginLeft:'auto', color:'#6b7280'}} className='text-field'>{titleMap[pathname] || ''}</div> */}
    </div>
  )
}
