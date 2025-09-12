import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loginWithPin } from '../api/auth'
import axios from 'axios'
import { toast } from 'react-hot-toast'

export default function Login(){
  const nav = useNavigate()
  const [mobile, setMobile] = useState('')
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)

  const onPinLogin = async () => {
    if (!mobile) return toast.error('Enter mobile')
    if (!pin) return toast.error('Enter pin')
    try {
      setLoading(true)
      const res = await loginWithPin(mobile, pin)
      const { success, message, token, user } = res?.data || {}

      if (!success || !token || !user) {
        throw new Error(message || 'Invalid login response')
      }

      // Persist auth & user
      localStorage.setItem('access_token', token)
      localStorage.setItem('user', JSON.stringify(user))

      toast.success('Login successful')
      // Notify app & redirect
      window.dispatchEvent(new Event('auth-updated'))
      if (user?.isFirstLogin) {
        window.location.replace('/')
      } else {
        window.location.replace('/')
      }
    } catch(e) {
      toast.error(e?.response?.data?.message || e?.message || 'PIN login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='login-screen'>
      <div className='login-hero'>
        <div style={{textAlign:'center', color:'#fff'}}>
          <img alt='logo' src='/jk.png' />
          <h1 className='bold-text' style={{marginTop:16, color:'#fff'}}>PWA</h1>
        </div>
      </div>

      <div className='login-panel'>
        <div className='panel-body'>
          <h2 className='login-welcome'>Welcome User!</h2>
          <small className='login-follow'>Complete The Following Details to Create Account</small>

          <div className='login-form'>
            <div className='stack'>
              <label className='login-mobile-label'>User's Mobile No.</label>
              <div className='row'>
                <select className='input' style={{maxWidth:84}} defaultValue='+91'>
                  <option value='+91'>+91</option>
                  <option value='+1'>+1</option>
                </select>
                <input className='input' placeholder='Enter mobile number' value={mobile} onChange={e=>setMobile(e.target.value)} />
              </div>
            </div>

            <div className='stack'>
              <label className='login-pin-label'>Enter Pin</label>
              <input type='password' className='input' placeholder='Enter Pin' value={pin} onChange={e=>setPin(e.target.value)} />
            </div>

            <button className='login-continue-btn' onClick={onPinLogin} disabled={loading}>Continue</button>
          </div>
        </div>
      </div>
    </div>
  )
}
