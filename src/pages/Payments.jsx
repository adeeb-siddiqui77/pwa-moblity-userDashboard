import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Payments(){
  const nav = useNavigate()
  const [activeTab, setActiveTab] = useState('pending')
  const [selectedPayment, setSelectedPayment] = useState(null)

  // Dummy payment data
  const paymentsData = {
    pending: [
      {
        id: '123456788',
        ticketId: '123456788',
        time: '10:30 AM',
        amount: '₹1,200',
        vehicleCode: 'DL3C132739',
        totalCost: '₹20,400',
        status: 'pending',
        date: '12/12/2024 | 10:30 AM',
        customerMobile: '+91 123456789',
        fleetName: 'Text Data',
        stencilNo: '1388676768',
        tyreType: 'Tubeless',
        services: [
          { name: 'Tyre Fitting', cost: '₹20,000' },
          { name: 'Puncture', cost: '₹200' },
          { name: 'Air Pressure Check', cost: '₹200' }
        ]
      },
      {
        id: '123456789',
        ticketId: '123456789',
        time: '11:15 AM',
        amount: '₹800',
        vehicleCode: 'DL3C132740',
        totalCost: '₹15,200',
        status: 'pending',
        date: '12/12/2024 | 11:15 AM',
        customerMobile: '+91 987654321',
        fleetName: 'Text Data',
        stencilNo: '1388676769',
        tyreType: 'Tubeless',
        services: [
          { name: 'Puncture', cost: '₹200' },
          { name: 'Wheel Assembly', cost: '₹600' }
        ]
      }
    ],
    completed: [
      {
        id: '123456790',
        ticketId: '123456790',
        time: '9:45 AM',
        amount: '₹1,500',
        vehicleCode: 'DL3C132741',
        totalCost: '₹18,500',
        status: 'completed',
        date: '11/12/2024 | 9:45 AM',
        customerMobile: '+91 456789123',
        fleetName: 'Text Data',
        stencilNo: '1388676770',
        tyreType: 'Tubeless',
        services: [
          { name: 'Tyre Fitting', cost: '₹15,000' },
          { name: 'Puncture', cost: '₹200' },
          { name: 'Air Pressure Check', cost: '₹200' },
          { name: 'Wheel Assembly', cost: '₹1,100' }
        ]
      },
      {
        id: '123456791',
        ticketId: '123456791',
        time: '2:30 PM',
        amount: '₹900',
        vehicleCode: 'DL3C132742',
        totalCost: '₹12,900',
        status: 'completed',
        date: '11/12/2024 | 2:30 PM',
        customerMobile: '+91 789123456',
        fleetName: 'Text Data',
        stencilNo: '1388676771',
        tyreType: 'Tubeless',
        services: [
          { name: 'Puncture', cost: '₹200' },
          { name: 'Air Pressure Check', cost: '₹200' },
          { name: 'Wheel Assembly', cost: '₹500' }
        ]
      }
    ]
  }

  const currentPayments = paymentsData[activeTab]

  // If a payment is selected, show detail view
  if (selectedPayment) {
    return (
      <div className='container'>
        <div className='card' style={{padding: 20}}>
          {/* Header */}
          <div className='row' style={{alignItems:'center', marginBottom:20, justifyContent: 'space-between'}}>
            <div className='row' style={{alignItems:'center', gap: 12}}>
              <button onClick={() => setSelectedPayment(null)} className='btn' style={{background:'#f3f4f6', color:'#111', padding:'8px 12px', width: 'auto', maxWidth: 'none', height: 'auto'}}>←</button>
              <h3 className='bold-text' style={{margin:0, fontSize: '18px'}}>Bill Preview</h3>
            </div>
            <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
              <button style={{background: 'none', border: 'none', color: 'var(--brand)', cursor: 'pointer'}}>
                <span style={{fontSize: '20px'}}>⬇️</span>
              </button>
              <div style={{
                padding: '4px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '600',
                fontFamily: 'var(--font-family)',
                background: selectedPayment.status === 'completed' ? '#10b981' : '#6b7280',
                color: 'white'
              }}>
                {selectedPayment.status === 'completed' ? 'Paid' : 'Pending'}
              </div>
            </div>
          </div>

          {/* Shop and Breakdown Information */}
          <div style={{marginBottom: 24}}>
            <div className='row' style={{alignItems: 'center', marginBottom: 12}}>
              <span className='bold-text' style={{color: 'var(--brand)', fontSize: '16px'}}>MSFA Shop Name</span>
              <span className='text-field' style={{marginLeft: 8}}>DL3C1278</span>
            </div>
            
            <div style={{background: '#fff', borderRadius: 12, padding: 16, border: '1px solid #e5e7eb'}}>
              <div className='stack' style={{gap: 8}}>
                <div className='row' style={{justifyContent: 'space-between'}}>
                  <span className='text-field'>Date of Breakdown:</span>
                  <span className='text-field'>{selectedPayment.date}</span>
                </div>
                <div className='row' style={{justifyContent: 'space-between'}}>
                  <span className='text-field'>Customer Mob no:</span>
                  <span className='text-field'>{selectedPayment.customerMobile}</span>
                </div>
                <div className='row' style={{justifyContent: 'space-between'}}>
                  <span className='text-field'>Fleet Name:</span>
                  <span className='text-field'>{selectedPayment.fleetName}</span>
                </div>
                <div className='row' style={{justifyContent: 'space-between'}}>
                  <span className='text-field'>Stencil No:</span>
                  <span className='text-field'>{selectedPayment.stencilNo}</span>
                </div>
                <div className='row' style={{justifyContent: 'space-between'}}>
                  <span className='text-field'>Tyre Type:</span>
                  <span className='text-field'>{selectedPayment.tyreType}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Performed Services */}
          <div style={{marginBottom: 24}}>
            <h3 className='bold-text' style={{fontSize: '20px', marginBottom: 16}}>Performed Services</h3>
            
            <div style={{background: '#fff', borderRadius: 12, padding: 16, border: '1px solid #e5e7eb'}}>
              <div className='stack' style={{gap: 12}}>
                {selectedPayment.services.map((service, index) => (
                  <div key={index} className='row' style={{justifyContent: 'space-between'}}>
                    <span className='text-field'>{service.name}:</span>
                    <span className='text-field'>{service.cost}</span>
                  </div>
                ))}
                <hr style={{border: 'none', borderTop: '1px solid #e5e7eb', margin: '8px 0'}} />
                <div className='row' style={{justifyContent: 'space-between'}}>
                  <span className='bold-text' style={{color: 'var(--brand)', fontSize: '16px'}}>Total Repair Cost:</span>
                  <span className='bold-text' style={{color: 'var(--brand)', fontSize: '16px'}}>{selectedPayment.totalCost}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Button */}
          {selectedPayment.status === 'pending' && (
            <div className='btn-center'>
              <button className='btn' onClick={() => {
                // TODO: Implement payment processing
                console.log('Processing payment for:', selectedPayment.id)
                alert('Payment processing functionality will be implemented with API integration')
              }}>
                Process Payment
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Main payments list view
  return (
    <div className='container'>
      <div className='card' style={{padding: 20}}>
        <h2 className='bold-text' style={{fontSize: '24px', marginBottom: 20}}>Payments</h2>
        
        {/* Tabs */}
        <div className='row' style={{gap: 8, marginBottom: 20}}>
          <button 
            className={`btn ${activeTab === 'pending' ? '' : 'btn-outline'}`}
            style={{
              background: activeTab === 'pending' ? 'var(--brand)' : '#f3f4f6',
              color: activeTab === 'pending' ? '#fff' : '#111',
              width: 'auto',
              maxWidth: 'none',
              padding: '8px 16px'
            }}
            onClick={() => setActiveTab('pending')}
          >
            Pending
          </button>
          <button 
            className={`btn ${activeTab === 'completed' ? '' : 'btn-outline'}`}
            style={{
              background: activeTab === 'completed' ? 'var(--brand)' : '#f3f4f6',
              color: activeTab === 'completed' ? '#fff' : '#111',
              width: 'auto',
              maxWidth: 'none',
              padding: '8px 16px'
            }}
            onClick={() => setActiveTab('completed')}
          >
            Completed
          </button>
        </div>

        {/* Payments List */}
        <div className='list'>
          {currentPayments.map(payment => (
            <div 
              key={payment.id} 
              className='card payment-card'
              style={{
                padding: 16,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onClick={() => setSelectedPayment(payment)}
            >
              <div className='row' style={{justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8}}>
                <div className='stack' style={{gap: 4}}>
                  <div className='text-field'>Ticket ID: #{payment.ticketId}</div>
                  <div className='caption-text'>Time: {payment.time}</div>
                </div>
                <div className='stack' style={{gap: 4, alignItems: 'flex-end'}}>
                  <div className='text-field'>{payment.amount}</div>
                  <div className='caption-text'>{payment.vehicleCode}</div>
                </div>
                <span style={{color: 'var(--brand)', fontSize: '18px'}}>→</span>
              </div>
              
              <div style={{
                background: 'var(--brand)',
                color: 'white',
                padding: '8px 12px',
                borderRadius: '8px',
                marginTop: 8
              }}>
                <div className='text-field' style={{color: 'white', margin: 0, textAlign: 'center'}}>
                  Total Repair Cost: {payment.totalCost}
                </div>
              </div>
            </div>
          ))}
          
          {currentPayments.length === 0 && (
            <div style={{textAlign: 'center', padding: '40px 20px'}}>
              <div className='caption-text'>No {activeTab} payments found</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}