import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'

export default function Profile(){
  const navigate = useNavigate()
  const [profileImage, setProfileImage] = useState(null)
  const [profileData, setProfileData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch user profile data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true)
        
       
        const token = localStorage.getItem('access_token')
        console.log('Access token:', token ? 'Present' : 'Missing')
        
        if (!token) {
          throw new Error('No access token found. Please login again.')
        }
        
        const response = await fetch('https://pwa-connect-api.jktyre.co.in/api/auth/user/profile', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        })
        
        console.log('Profile API Response Status:', response.status)
        
        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem('access_token')
            localStorage.removeItem('user')
            throw new Error('Session expired. Please login again.')
          }
          throw new Error(`Failed to fetch profile (Status: ${response.status})`)
        }
        
        const data = await response.json()
        console.log('Profile API Response Data:', data)
        
        if (data.success && data.user) {
          setProfileData(data.user)
          console.log('Profile data set:', data.user)
        } else {
          throw new Error('Invalid profile data received')
        }
      } catch (error) {
        console.error('Profile fetch error:', error)
        setError(error.message || 'Failed to load profile')
        toast.error('Failed to load profile data')
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [])

  const handleImageUpload = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = (e) => {
      const file = e.target.files[0]
      if (file) {
        setProfileImage(file)
      }
    }
    input.click()
  }

  // Loading state
  if (loading) {
    return (
      <div className='container'>
        <div className='card' style={{padding: 20, textAlign: 'center'}}>
          <div className='loading-spinner' style={{margin: '0 auto 16px'}}></div>
          <p className='caption-text'>Loading profile...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className='container'>
        <div className='card' style={{padding: 20, textAlign: 'center'}}>
          <p className='caption-text' style={{color: '#dc2626'}}>{error}</p>
          <button className='btn' onClick={() => window.location.reload()} style={{marginTop: 16}}>
            Retry
          </button>
        </div>
      </div>
    )
  }

  // No data state
  if (!profileData) {
    return (
      <div className='container'>
        <div className='card' style={{padding: 20, textAlign: 'center'}}>
          <p className='caption-text'>No profile data available</p>
        </div>
      </div>
    )
  }

  // Debug: Log profile data
  console.log('Rendering profile with data:', profileData)

  return (
    <div className='container'>
      {/* Profile Header */}
      <div className='card' style={{padding: 20, marginBottom: 16}}>
        <h2 className='bold-text' style={{fontSize: '24px', marginBottom: 20}}>My Profile</h2>
        
        <div className='row' style={{alignItems: 'flex-start', gap: 16}}>
          {/* Profile Picture */}
          <div style={{position: 'relative'}}>
            <div 
              className='profile-picture'
              onClick={handleImageUpload}
              style={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: 'var(--brand)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {profileImage ? (
                <img 
                  src={URL.createObjectURL(profileImage)} 
                  alt='Profile' 
                  style={{width: '100%', height: '100%', objectFit: 'cover'}}
                />
              ) : profileData.kycImage ? (
                <img 
                  src={`https://pwa-connect-api.jktyre.co.in/${profileData.kycImage}`} 
                  alt='Profile' 
                  style={{width: '100%', height: '100%', objectFit: 'cover'}}
                />
              ) : (
                <span className='bold-text' style={{color: 'white', fontSize: '24px'}}>
                  {profileData.fullName ? profileData.fullName.charAt(0).toUpperCase() : 'U'}
                </span>
              )}
            </div>
          </div>

          {/* User Details */}
          <div className='stack' style={{flex: 1, gap: 4}}>
            <div className='caption-text'>User ID: {profileData._id}</div>
            <div className='bold-text' style={{color: 'var(--brand)', fontSize: '18px'}}>{profileData.shopName}</div>
            <div className='text-field'>Owner Name: {profileData.fullName}</div>
            <div className='text-field'>Mobile No.: +91 {profileData.mobile}</div>
          </div>
        </div>
      </div>

      {/* Shop Details */}
      <div className='card' style={{padding: 16, marginBottom: 16}}>
        <h3 className='bold-text' style={{fontSize: '18px', marginBottom: 16}}>Shop Details</h3>
        
        <div className='stack' style={{gap: 12}}>
          <div>
            <div className='text-field' style={{marginBottom: 4}}>Address:</div>
            <div className='caption-text'>{profileData.address}</div>
          </div>
          
          <div>
            <div className='text-field' style={{marginBottom: 4}}>Availability:</div>
            <div className='stack' style={{gap: 4}}>
              <div className='caption-text'>Days: {profileData.businessDays.join(', ')}</div>
              <div className='caption-text'>Time: {profileData.timeFrom} - {profileData.timeTo}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Documents */}
      <div className='card' style={{padding: 16, marginBottom: 16}}>
        <h3 className='bold-text' style={{fontSize: '18px', marginBottom: 16}}>Documents</h3>
        
        <div className='stack' style={{gap: 12}}>
          <div className='row' style={{justifyContent: 'space-between', alignItems: 'center'}}>
            <div>
              <div className='text-field' style={{marginBottom: 4}}>KYC Status:</div>
              <div style={{color: '#10b981', fontWeight: '600', fontSize: '14px'}}>
                {profileData.kycImage ? 'Completed' : 'Pending'}
              </div>
            </div>
          </div>
          
          {profileData.adharCard && (
            <div className='row' style={{justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer'}}>
              <div className='text-field'>Aadhar Card</div>
              <button 
                style={{background: 'none', border: 'none', color: 'var(--brand)', cursor: 'pointer'}}
                onClick={() => window.open(`https://pwa-connect-api.jktyre.co.in/${profileData.adharCard}`, '_blank')}
              >
                <span style={{fontSize: '18px'}}>⬇️</span>
              </button>
            </div>
          )}
          
          {profileData.loiForm && (
            <div className='row' style={{justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer'}}>
              <div className='text-field'>LOI Form</div>
              <button 
                style={{background: 'none', border: 'none', color: 'var(--brand)', cursor: 'pointer'}}
                onClick={() => window.open(`https://pwa-connect-api.jktyre.co.in/${profileData.loiForm}`, '_blank')}
              >
                <span style={{fontSize: '18px'}}>⬇️</span>
              </button>
            </div>
          )}
          
          {profileData.qrCode && (
            <div className='row' style={{justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer'}}>
              <div className='text-field'>QR Code</div>
              <button 
                style={{background: 'none', border: 'none', color: 'var(--brand)', cursor: 'pointer'}}
                onClick={() => window.open(`https://pwa-connect-api.jktyre.co.in/${profileData.qrCode}`, '_blank')}
              >
                <span style={{fontSize: '18px'}}>⬇️</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Payment Info */}
      <div className='card' style={{padding: 16, marginBottom: 16}}>
        <h3 className='bold-text' style={{fontSize: '18px', marginBottom: 16}}>Payment Info</h3>
        
        <div className='row' style={{justifyContent: 'space-between', alignItems: 'center'}}>
          <div>
            <div className='text-field' style={{marginBottom: 4}}>UPI ID:</div>
            <div className='caption-text'>{profileData.upi}</div>
          </div>
          <button style={{background: 'none', border: 'none', color: 'var(--brand)', cursor: 'pointer'}}>
            <span style={{fontSize: '16px'}}>✏️</span>
          </button>
        </div>
      </div>

      {/* Password */}
      <div className='card' style={{padding: 16, marginBottom: 16}}>
        <h3 className='bold-text' style={{fontSize: '18px', marginBottom: 16}}>Password</h3>
        
        <div 
          className='row' 
          style={{justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer'}}
          onClick={() => navigate('/change-pin')}
        >
          <div className='text-field'>Change PIN</div>
          <span style={{color: 'var(--brand)', fontSize: '18px'}}>→</span>
        </div>
      </div>
    </div>
  )
}