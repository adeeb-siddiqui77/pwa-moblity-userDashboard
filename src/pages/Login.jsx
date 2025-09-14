import React, { useState } from 'react'
import { loginWithPin } from '../api/auth'
import { toast } from 'react-hot-toast'

export default function Login(){
  const [mobile, setMobile] = useState('')
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)

  const validateMobile = (mobile) => {
    const mobileRegex = /^[6-9]\d{9}$/
    return mobileRegex.test(mobile)
  }

  const onPinLogin = async () => {
    if (!mobile) return toast.error('Please enter mobile number')
    if (!validateMobile(mobile)) return toast.error('Please enter a valid 10-digit mobile number')
    if (!pin) return toast.error('Please enter PIN')
    
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
      window.location.replace('/')
    } catch(e) {
      const errorMessage = e?.response?.data?.message || e?.message || 'PIN login failed'
      if (errorMessage.includes('not found') || errorMessage.includes('invalid')) {
        toast.error('Driver not found. Please check your mobile number and PIN.')
      } else {
        toast.error(errorMessage)
      }
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
          <small className='login-follow'>Complete The Following Details to Login</small>

          <div className='login-form'>
            <div className='stack'>
              <label className='login-mobile-label'>Mobile Number</label>
              <div className='row'>
                <select className='input' style={{maxWidth:84}} defaultValue='+91'>
                  <option value='+91'>+91</option>
                  <option value='+1'>+1</option>
                </select>
                <input 
                  className='input' 
                  placeholder='Enter mobile number' 
                  value={mobile} 
                  onChange={e=>setMobile(e.target.value)}
                  maxLength={10}
                />
              </div>
            </div>

            <div className='stack'>
              <label className='login-pin-label'>Enter PIN</label>
              <input 
                type='password' 
                className='input' 
                placeholder='Enter PIN' 
                value={pin} 
                onChange={e=>setPin(e.target.value)}
                disabled={loading}
              />
            </div>

            <button 
              className={`login-continue-btn ${loading ? 'btn-loading' : ''}`}
              onClick={onPinLogin} 
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Continue'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
