
import React from 'react'
import { Link, useNavigate } from 'react-router-dom'

export default function Sidebar({ open, onClose }){
  const navigate = useNavigate()
  
  const handleViewProfile = () => {
    onClose() // Close the sidebar first
    navigate('/profile') // Navigate to profile page
  }
  
  if (!open) return null
  return (
    <div className='drawer-backdrop' onClick={onClose}>
      <aside className='drawer card' onClick={e=>e.stopPropagation()}>
        <div style={{display:'flex', alignItems:'center', gap:12}}>
          <div style={{width:44,height:44,borderRadius:999,background:'#fde68a',display:'grid',placeItems:'center',fontWeight:700}}>AY</div>
          <div style={{flex:1}}>
            <div style={{fontWeight:700}}>Good Morning</div>
            <small>User</small>
          </div>
          <button onClick={onClose} className='btn' style={{padding:'8px 12px', background:'#f3f4f6', color:'#111'}}>✕</button>
        </div>

        <button className='btn' style={{width:'100%', marginTop:12}} onClick={handleViewProfile}>View Profile →</button>

        <div className='menu-section'>
          <div className='menu-section-title'>Quick Menu</div>
          <div className='stack'>
            <Link to='/rate-card' className='menu-item'>
              <div style={{display:'flex', alignItems:'center'}}>
                <img src='/performance.png' alt='rate card' className='menu-item-icon' />
                Rate Card
              </div>
              <small>›</small>
            </Link>
            <Link to='/invoice-history' className='menu-item'>
              <div style={{display:'flex', alignItems:'center'}}>
                <img src='/Invoice.png' alt='invoice history' className='menu-item-icon' />
                Invoice History
              </div>
              <small>›</small>
            </Link>
            <Link to='/payments' className='menu-item'>
              <div style={{display:'flex', alignItems:'center'}}>
                <img src='/Invoice.png' alt='payment method' className='menu-item-icon' />
                Payment Method
              </div>
              <small>›</small>
            </Link>
            <Link to='/kyc' className='menu-item'>
              <div style={{display:'flex', alignItems:'center'}}>
                <img src='/Invoice.png' alt='kyc documents' className='menu-item-icon' />
                KYC & Documents
              </div>
              <small>›</small>
            </Link>
          </div>
        </div>

        <div className='menu-section'>
          <div className='menu-section-title'>Training</div>
          <div className='stack'>
            <Link to='/training' className='menu-item'>
              <div style={{display:'flex', alignItems:'center'}}>
                <img src='/performance.png' alt='training' className='menu-item-icon' />
                Training & SOPs
              </div>
              <small>›</small>
            </Link>
          </div>
        </div>

        <div className='menu-section'>
          <div className='menu-section-title'>Support & Help</div>
          <div className='stack'>
            <Link to='/support' className='menu-item'>
              <div style={{display:'flex', alignItems:'center'}}>
                <img src='/performance.png' alt='support' className='menu-item-icon' />
                Support Tickets
              </div>
              <small>›</small>
            </Link>
          </div>
        </div>

        <hr className='sep'/>
        <button className='logout-btn' onClick={()=>{ localStorage.removeItem('access_token'); window.location.replace('/login') }}>Log out</button>
      </aside>
    </div>
  )
}
