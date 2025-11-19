import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { changePin } from '../api/auth'
import { toast } from 'react-hot-toast'

export default function ChangePIN() {
  const navigate = useNavigate()
  const [currentPin, setCurrentPin] = useState('')
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [loading, setLoading] = useState(false)

  const API_BASE = (import.meta?.env?.VITE_API_BASE) || ''

  const validatePin = (pin) => {
    // PIN should be 4-6 digits
    const pinRegex = /^\d{4,6}$/
    return pinRegex.test(pin)
  }

  const handleChangePin = async () => {
    // Validation
    if (!currentPin) return toast.error('Please enter current PIN')
    if (!newPin) return toast.error('Please enter new PIN')
    if (!confirmPin) return toast.error('Please confirm new PIN')
    
    if (!validatePin(currentPin)) return toast.error('Current PIN must be 4-6 digits')
    if (!validatePin(newPin)) return toast.error('New PIN must be 4-6 digits')
    if (!validatePin(confirmPin)) return toast.error('Confirm PIN must be 4-6 digits')
    
    if (newPin !== confirmPin) return toast.error('New PIN and confirm PIN do not match')
    if (currentPin === newPin) return toast.error('New PIN must be different from current PIN')

    try {
      setLoading(true)
      
      // Get the auth token from localStorage
      const token = localStorage.getItem('access_token')
      console.log('Access token:', token ? 'Present' : 'Missing')
      
      if (!token) {
        throw new Error('No access token found. Please login again.')
      }
      
      // Option 1: Using fetch with manual token handling
      const response = await fetch(`${API_BASE || ''}/api/auth/user/change-pin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ currentPin, newPin })
      })
      
      // Option 2: Using axios (uncomment to use instead of fetch)
      // const response = await changePin(currentPin, newPin)
      
      console.log('Response status:', response.status)
      console.log('Response headers:', response.headers)
      
      // Parse the JSON response
      const data = await response.json()
      console.log('Response data:', data)
      
      // Check if the API call was successful
      if (response.ok && data.success) {
        toast.success(data.message || 'PIN changed successfully')
        navigate('/profile')
      } else if (response.status === 401) {
        // Unauthorized - token might be invalid
        localStorage.removeItem('access_token')
        localStorage.removeItem('user')
        toast.error('Session expired. Please login again.')
        navigate('/login')
      } else if (response.status === 403) {
        // Forbidden - insufficient permissions
        throw new Error('You do not have permission to change PIN')
      } else {
        throw new Error(data.message || `Failed to change PIN (Status: ${response.status})`)
      }

    } catch (error) {
      console.error('Change PIN Error:', error)
      const errorMessage = error?.message || 'Failed to change PIN'
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='container'>
      <div className='card' style={{padding: 20, marginBottom: 16}}>
        <h2 className='bold-text' style={{fontSize: '24px', marginBottom: 20}}>Change PIN</h2>
        <p className='caption-text' style={{marginBottom: 24}}>
          Enter your current PIN and set a new PIN for your account
        </p>

        <div className='stack' style={{gap: 16}}>
          {/* Current PIN */}
          <div className='stack'>
            <label className='text-field' style={{marginBottom: 8}}>Current PIN</label>
            <input 
              type='password' 
              className='input' 
              placeholder='Enter current PIN' 
              value={currentPin} 
              onChange={e => setCurrentPin(e.target.value)}
              disabled={loading}
              maxLength={6}
            />
          </div>

          {/* New PIN */}
          <div className='stack'>
            <label className='text-field' style={{marginBottom: 8}}>New PIN</label>
            <input 
              type='password' 
              className='input' 
              placeholder='Enter new PIN' 
              value={newPin} 
              onChange={e => setNewPin(e.target.value)}
              disabled={loading}
              maxLength={6}
            />
          </div>

          {/* Confirm PIN */}
          <div className='stack'>
            <label className='text-field' style={{marginBottom: 8}}>Confirm New PIN</label>
            <input 
              type='password' 
              className='input' 
              placeholder='Confirm new PIN' 
              value={confirmPin} 
              onChange={e => setConfirmPin(e.target.value)}
              disabled={loading}
              maxLength={6}
            />
          </div>

          {/* PIN Requirements */}
          <div style={{
            background: '#f8fafc',
            padding: 12,
            borderRadius: 8,
            border: '1px solid #e5e7eb'
          }}>
            <p className='caption-text' style={{margin: 0, fontWeight: 600, marginBottom: 4}}>
              PIN Requirements:
            </p>
            <ul style={{margin: 0, paddingLeft: 16, fontSize: '12px', color: '#6b7280'}}>
              <li>Must be 4-6 digits</li>
              <li>Cannot be the same as current PIN</li>
              <li>Use numbers only</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className='row' style={{gap: 12, marginTop: 8}}>
            <button 
              className='btn-secondary'
              onClick={() => navigate('/profile')}
              disabled={loading}
              style={{flex: 1}}
            >
              Cancel
            </button>
            <button 
              className={`btn ${loading ? 'btn-loading' : ''}`}
              onClick={handleChangePin}
              disabled={loading || !currentPin || !newPin || !confirmPin}
              style={{flex: 1}}
            >
              {loading ? 'Changing PIN...' : 'Change PIN'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
