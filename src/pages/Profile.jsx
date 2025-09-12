import React, { useState } from 'react'

export default function Profile(){
  const [profileImage, setProfileImage] = useState(null)
  
  // Dummy data - will be replaced with API data later
  const profileData = {
    user: {
      id: '12345678',
      name: 'JK MSFA Shop',
      ownerName: 'Jatin Kumar',
      mobile: '+91 123456789',
      rating: 4.5,
      profileImage: null
    },
    shop: {
      address: '12, Prabhas Market, Lal Chauk, Gurugram, Haryana',
      availability: {
        days: 'Mon,Tue,Wed,Thu,Fri,Sat,Sun',
        time: '9:00 AM - 6:00 PM'
      },
      capabilities: ['Tyre Fitting', 'Puncture', 'Wheel Assembly', 'Air Pressure Check']
    },
    documents: {
      kycStatus: 'Completed',
      loiForm: 'LOI/KYC Form'
    },
    payment: {
      upiId: 'hellojk@okaxis'
    }
  }

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
              ) : (
                <span className='bold-text' style={{color: 'white', fontSize: '24px'}}>JK</span>
              )}
            </div>
            
            {/* Rating Badge */}
            <div style={{
              position: 'absolute',
              bottom: -5,
              left: -5,
              background: '#fbbf24',
              color: 'white',
              borderRadius: '12px',
              padding: '4px 8px',
              fontSize: '12px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <span>⭐</span>
              <span>{profileData.user.rating}</span>
            </div>
          </div>

          {/* User Details */}
          <div className='stack' style={{flex: 1, gap: 4}}>
            <div className='caption-text'>User ID: {profileData.user.id}</div>
            <div className='bold-text' style={{color: 'var(--brand)', fontSize: '18px'}}>{profileData.user.name}</div>
            <div className='text-field'>Owner Name: {profileData.user.ownerName}</div>
            <div className='text-field'>Mobile No.: {profileData.user.mobile}</div>
          </div>
        </div>
      </div>

      {/* Shop Details */}
      <div className='card' style={{padding: 16, marginBottom: 16}}>
        <h3 className='bold-text' style={{fontSize: '18px', marginBottom: 16}}>Shop Details</h3>
        
        <div className='stack' style={{gap: 12}}>
          <div>
            <div className='text-field' style={{marginBottom: 4}}>Address:</div>
            <div className='caption-text'>{profileData.shop.address}</div>
          </div>
          
          <div>
            <div className='text-field' style={{marginBottom: 4}}>Availability:</div>
            <div className='stack' style={{gap: 4}}>
              <div className='caption-text'>Days: {profileData.shop.availability.days}</div>
              <div className='caption-text'>Time: {profileData.shop.availability.time}</div>
            </div>
          </div>
          
          <div>
            <div className='text-field' style={{marginBottom: 8}}>Capabilities:</div>
            <div style={{display: 'flex', flexWrap: 'wrap', gap: 8}}>
              {profileData.shop.capabilities.map((capability, index) => (
                <span 
                  key={index}
                  style={{
                    background: 'var(--brand)',
                    color: 'white',
                    padding: '4px 12px',
                    borderRadius: '16px',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}
                >
                  {capability}
                </span>
              ))}
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
                {profileData.documents.kycStatus}
              </div>
            </div>
          </div>
          
          <div className='row' style={{justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer'}}>
            <div className='text-field'>{profileData.documents.loiForm}</div>
            <button style={{background: 'none', border: 'none', color: 'var(--brand)', cursor: 'pointer'}}>
              <span style={{fontSize: '18px'}}>⬇️</span>
            </button>
          </div>
        </div>
      </div>

      {/* Payment Info */}
      <div className='card' style={{padding: 16, marginBottom: 16}}>
        <h3 className='bold-text' style={{fontSize: '18px', marginBottom: 16}}>Payment Info</h3>
        
        <div className='row' style={{justifyContent: 'space-between', alignItems: 'center'}}>
          <div>
            <div className='text-field' style={{marginBottom: 4}}>UPI ID:</div>
            <div className='caption-text'>{profileData.payment.upiId}</div>
          </div>
          <button style={{background: 'none', border: 'none', color: 'var(--brand)', cursor: 'pointer'}}>
            <span style={{fontSize: '16px'}}>✏️</span>
          </button>
        </div>
      </div>

      {/* Password */}
      <div className='card' style={{padding: 16, marginBottom: 16}}>
        <h3 className='bold-text' style={{fontSize: '18px', marginBottom: 16}}>Password</h3>
        
        <div className='row' style={{justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer'}}>
          <div className='text-field'>Change PIN</div>
          <span style={{color: 'var(--brand)', fontSize: '18px'}}>→</span>
        </div>
      </div>
    </div>
  )
}