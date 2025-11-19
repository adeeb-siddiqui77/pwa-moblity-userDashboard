import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'

const API_BASE = (import.meta?.env?.VITE_API_BASE) || ''

export default function StartJob(){
  const { id } = useParams()
  const nav = useNavigate()
  const [currentScreen, setCurrentScreen] = useState('workflow') // workflow, bill-preview, otp-verification, confirmation
  const [ticketData, setTicketData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [step, setStep] = useState(1)
  const [photos, setPhotos] = useState([])
  const [postRepairPhotos, setPostRepairPhotos] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [showCaptureModal, setShowCaptureModal] = useState(false)
  const [showPostRepairModal, setShowPostRepairModal] = useState(false)
  const [selectedTyreType, setSelectedTyreType] = useState('tubeless')
  const [selectedServices, setSelectedServices] = useState(['Tyre Fitting', 'Puncture', 'Wheel Assembly', 'Air Pressure Check', 'Other Services'])
  const [selectedPatchType, setSelectedPatchType] = useState('radial')
  const [patchNumber, setPatchNumber] = useState('20')
  const [tyreFittingOption, setTyreFittingOption] = useState('mount')
  const [wheelAssemblyOption, setWheelAssemblyOption] = useState('jack')
  const [otherServicesText, setOtherServicesText] = useState('')
  const [otp, setOtp] = useState(['', '', '', ''])
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState({})
  // Rate card pricing state
  const [rateLoading, setRateLoading] = useState(false)
  const [rateError, setRateError] = useState("")
  const [rateCostData, setRateCostData] = useState(null) // { totalCost, breakdown: [{service, cost}] }
  const [otpSendError, setOtpSendError] = useState("")
  const [otpVerifyError, setOtpVerifyError] = useState("")
  const [otpSendLoading, setOtpSendLoading] = useState(false)
  const [otpVerifyLoading, setOtpVerifyLoading] = useState(false)


  const API_BASE = (import.meta?.env?.VITE_API_BASE) || ''
  
  // Update Zoho ticket (local backend) when proceeding to OTP
  const submitZohoTicketUpdate = async () => {
    
    try {
      // Build arrays of strings (filenames or empty)
      const prePhotos = [
        uploadedFiles.pre_0 ? (uploadedFiles.pre_0.name || "") : "",
        uploadedFiles.pre_1 ? (uploadedFiles.pre_1.name || "") : "",
      ].filter((v, idx, arr) => v || idx === 0) // keep at least one entry

      const postPhotos = [
        uploadedFiles.capture_0 ? (uploadedFiles.capture_0.name || "") : "",
        uploadedFiles.post_0 ? (uploadedFiles.post_0.name || "") : "",
        uploadedFiles.post_1 ? (uploadedFiles.post_1.name || "") : "",
      ].filter((v, idx, arr) => v || idx === 0) // keep at least one entry

      const payload = {
        preRepairPhotos: prePhotos,
        workDetails: {
          tyreType: selectedTyreType,
          services: selectedServices,
          patchType: selectedPatchType,
          patchNumber: patchNumber,
          tyreFittingOption: selectedServices.includes('Tyre Fitting') ? tyreFittingOption : null,
          wheelAssemblyOption: selectedServices.includes('Wheel Assembly') ? wheelAssemblyOption : null,
          otherServices: selectedServices.includes('Other Services') ? (otherServicesText || null) : null
        },
        postRepairPhotos: postPhotos
      }

      const zohoId = ticketData?.zohoTicketId || ''
      if (!zohoId) {
        console.warn('Zoho ticket id not available; skipping update call')
        return
      }

      const endpoint = `${API_BASE}/api/zoho/tickets/update/${zohoId}`
      console.log('Calling Zoho Update →', endpoint, payload)
      await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(err => console.warn('Zoho update call failed (dev server likely not running):', err?.message))
    } catch (err) {
      console.error('Failed to update Zoho ticket:', err)
    }
  }

  // Verify OTP: mark Zoho ticket completed (local backend)
  const submitZohoVerifyCompleted = async () => {
    try {
      const accessToken = localStorage.getItem('access_token') || ''
      const payload = {
        tokenDetails: {
          accessToken,
          expiresAt: ''
        },
        data: {
          status: 'Completed'
        }
      }

      const zohoId = ticketData?.zohoTicketId || ''
      if (!zohoId) {
        console.warn('Zoho ticket id not available; skipping verify-completed call')
        return
      }

      const endpoint = `${API_BASE}/api/zoho/tickets/${zohoId}`
      console.log('Calling Zoho Verify Completed →', endpoint, payload)
      await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(err => console.warn('Zoho verify call failed (dev server likely not running):', err?.message))
    } catch (err) {
      console.error('Failed to mark Zoho ticket completed:', err)
    }
  }

  // Build FormData from payload (object-shaped photo fields)
  const buildFormDataFromPayload = (payload) => {
    const fd = new FormData()

    // Remove file objects from the JSON blob; attach them as files separately
    const jsonSafe = { ...payload }
    delete jsonSafe.preRepairPhotos
    delete jsonSafe.postRepairPhotos

    fd.append('payload', new Blob([JSON.stringify(jsonSafe)], { type: 'application/json' }))

    // Append files as individual fields that match your backend expectations
    if (payload.preRepairPhotos) {
      if (payload.preRepairPhotos.photo1) fd.append('preRepairPhotos.photo1', payload.preRepairPhotos.photo1)
      if (payload.preRepairPhotos.photo2) fd.append('preRepairPhotos.photo2', payload.preRepairPhotos.photo2)
    }
    if (payload.postRepairPhotos) {
      if (payload.postRepairPhotos.mainPhoto) fd.append('postRepairPhotos.mainPhoto', payload.postRepairPhotos.mainPhoto)
      if (payload.postRepairPhotos.additionalPhoto1) fd.append('postRepairPhotos.additionalPhoto1', payload.postRepairPhotos.additionalPhoto1)
      if (payload.postRepairPhotos.additionalPhoto2) fd.append('postRepairPhotos.additionalPhoto2', payload.postRepairPhotos.additionalPhoto2)
    }

    // Debug: log file names
    if (payload.preRepairPhotos) {
      console.log('preRepairPhotos.photo1 →', payload.preRepairPhotos.photo1?.name)
      console.log('preRepairPhotos.photo2 →', payload.preRepairPhotos.photo2?.name)
    }
    if (payload.postRepairPhotos) {
      console.log('postRepairPhotos.mainPhoto →', payload.postRepairPhotos.mainPhoto?.name)
      console.log('postRepairPhotos.additionalPhoto1 →', payload.postRepairPhotos.additionalPhoto1?.name)
      console.log('postRepairPhotos.additionalPhoto2 →', payload.postRepairPhotos.additionalPhoto2?.name)
    }

    return fd
  }

  // Build FormData using ARRAY fields for photos (preRepairPhotos[] / postRepairPhotos[])
  const buildFormDataFromArrays = (payload) => {
    const fd = new FormData()
    const jsonSafe = { ...payload }
    delete jsonSafe.preRepairPhotos
    delete jsonSafe.postRepairPhotos
    fd.append('payload', new Blob([JSON.stringify(jsonSafe)], { type: 'application/json' }))

    if (Array.isArray(payload.preRepairPhotos)) {
      payload.preRepairPhotos.forEach((file) => { if (file) fd.append('preRepairPhotos[]', file) })
    }
    if (Array.isArray(payload.postRepairPhotos)) {
      payload.postRepairPhotos.forEach((file) => { if (file) fd.append('postRepairPhotos[]', file) })
    }
    return fd
  }

  // Prepare payload variant with ARRAYS of File objects (for final OTP completion flow)
  const preparePayloadWithArrays = () => {
    const preArr = [uploadedFiles.pre_0, uploadedFiles.pre_1].filter(Boolean)
    const postArr = [uploadedFiles.capture_0, uploadedFiles.post_0, uploadedFiles.post_1].filter(Boolean)
    return {
      ...preparePayload(), // reuse same structure for fields
      preRepairPhotos: preArr,
      postRepairPhotos: postArr,
    }
  }

  // Final submit after OTP: send arrays of File in multipart as [] fields
  const submitFinalAfterOtp = async () => {
    try {
      const payload = preparePayloadWithArrays()
      const fd = buildFormDataFromArrays(payload)
      
      const endpoint = `${API_BASE || ''}/api/driver/verify-otp-mechanic?phone=${phone}&otp=${otp}`
      const res = await fetch(endpoint, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token') || ''}` },
        body: fd,
      })
      if (!res.ok) {
        const text = await res.text()
        console.warn('Final submit (OTP) failed:', res.status, text)
      }
    } catch (err) {
      console.error('Error in final submit (OTP):', err)
    }
  }

  // Submit pre-OTP job data to API (called after Post Repair uploads, before OTP)
  const submitJobPreOtp = async () => {
    try {
      const payload = preparePayload()
      console.log('=== JOB PAYLOAD (pre-OTP submission) ===')
      console.log('Full Payload:', payload)
      console.log('Files present:', {
        preCount: Array.isArray(payload.preRepairPhotos) ? payload.preRepairPhotos.length : 0,
        postCount: Array.isArray(payload.postRepairPhotos) ? payload.postRepairPhotos.length : 0,
      })

      const fd = buildFormDataFromPayload(payload)

      // Log FormData keys for visibility
      console.log('FormData keys →', Array.from(fd.keys()))

      // Resolve endpoint (fallback to relative)
      const endpoint = `${API_BASE || ''}/api/jobs/complete`

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          // Note: do not set Content-Type for FormData; browser sets it with proper boundary
          'Authorization': `Bearer ${localStorage.getItem('access_token') || ''}`,
        },
        body: fd,
      })

      if (!res.ok) {
        const text = await res.text()
        console.warn('Pre-OTP submit failed:', res.status, text)
      } else {
        const data = await res.json().catch(() => ({}))
        console.log('Pre-OTP submit success:', data)
      }
    } catch (err) {
      console.error('Error during pre-OTP submission:', err)
    }
  }

  const handleServiceToggle = (service) => {
    setSelectedServices(prev => 
      prev.includes(service) 
        ? prev.filter(s => s !== service)
        : [...prev, service]
    )
  }

  const handleOtpChange = (index, value) => {
    if (value.length <= 1) {
      const newOtp = [...otp]
      newOtp[index] = value
      setOtp(newOtp)
      
      // Auto-focus next input
      if (value && index < 3) {
        const nextInput = document.getElementById(`otp-${index + 1}`)
        if (nextInput) nextInput.focus()
      }
    }
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`)
      if (prevInput) prevInput.focus()
    }
  }

  const handleFileUpload = (type, index) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = (e) => {
      const file = e.target.files[0]
      if (file) {
        const key = `${type}_${index}`
        console.log('File uploaded:', key, file.name)
        setUploadedFiles(prev => {
          const newFiles = {
            ...prev,
            [key]: file
          }
          console.log('Updated uploaded files:', newFiles)
          return newFiles
        })
      }
    }
    input.click()
  }

  // Call rate-card API to compute service costs
  const fetchRateCardCosts = async () => {
    try {
      setRateLoading(true)
      setRateError("")
      setRateCostData(null)

      const endpoint = `${API_BASE}/api/rate-card/get-services-cost`
      // Build payload exactly as requested
      const payloadForCost = preparePayload()
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payloadForCost)
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || `HTTP ${res.status}`)
      }

      const data = await res.json()
      console.log('Rate-card response:', data)
      setRateCostData({
        totalCost: data?.totalCost ?? 0,
        breakdown: Array.isArray(data?.breakdown) ? data.breakdown : []
      })
    } catch (err) {
      console.error('Failed to fetch rate-card costs:', err)
      setRateError(err?.message || 'Failed to fetch service costs')
    } finally {
      setRateLoading(false)
    }
  }

  // Send OTP to user's phone when moving to OTP screen
  const sendOtpToPhone = async () => {
    console.log("sendOtpToPhone invoked")
    try {
      setOtpSendError("")
      // Prefer explicit 'mobile' key if present
      let phone = (localStorage.getItem('mobile') || '').trim()

      // Fallback to JSON-parsed 'user' object
      if (!phone) {
        const raw = localStorage.getItem('user')
        if (raw) {
          try {
            const obj = JSON.parse(raw)
            if (obj && obj.mobile) phone = String(obj.mobile).trim()
          } catch (e) {
            console.warn('Failed to parse localStorage.user:', e?.message)
          }
        }
      }

      // Fallback to ticket phone
      if (!phone) phone = String(ticketData?.phone || '').trim()

      if (!phone) {
        setOtpSendError('Mobile number not found')
        return false
      }

      const base = API_BASE || 'https://pwa-connect-api.jktyre.co.in'
      const endpoint = `${base}/api/driver/send-otp-phone`
      console.log('Sending OTP →', endpoint, { phone })

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      })
      if (!res.ok) {
        const text = await res.text()
        setOtpSendError(text || 'Failed to send OTP')
        console.warn('sendOtpToPhone failed:', res.status, text)
        return false
      }
      console.log('sendOtpToPhone success')
      return true
    } catch (err) {
      setOtpSendError(err?.message || 'Failed to send OTP')
      console.error('sendOtpToPhone error:', err)
      return false
    }
  }

  // Verify OTP with phone and otp digits
  const verifyOtpWithServer = async () => {
    try {
      setOtpVerifyError("")
      // const phone = (localStorage.getItem('mobile') || '').trim() || (ticketData?.phone || '').trim()
      const p = localStorage.getItem('user')
      console.log('p', JSON.parse(p))
      const phone = JSON.parse(p)?.mobile || ''
      const otpCode = otp.join('').trim()
      console.log('phone', phone)
      console.log('otpCode', otpCode)

      if (!phone || !otpCode) {
        setOtpVerifyError('Enter OTP to continue')
        return false
      }
    
      const base = `${API_BASE}`
      const url = `${base}/api/driver/verify-otp-mechanic?phoneNo=${phone}&otp=${otpCode}`
      const res = await fetch(url, { method: 'GET' })
      console.log('OTP verification response status:', res.status)
      
      if (!res.ok) {
        const text = await res.text()
        console.log('OTP verification error response:', text)
        setOtpVerifyError(text || 'Invalid OTP')
        return false
      }

      // Parse the response body to check if OTP is valid
      const responseData = await res.json()
      console.log('OTP verification response data:', responseData)
      
      if (!responseData.valid) {
        setOtpVerifyError('Invalid OTP. Please check and try again.')
        return false
      }

      return true
    } catch (err) {
      console.error('OTP verification error:', err)
      setOtpVerifyError(err?.message || 'OTP verification failed')
      return false
    }
  }

  // Prepare payload for API submission (object-shaped photos)
  const preparePayload = () => {
    const payload = {
      jobId: id,
      timestamp: new Date().toISOString(),

      // Original Ticket Data
      originalTicket: ticketData ? {
        _id: ticketData._id,
        zohoTicketId: ticketData.zohoTicketId,
        subject: ticketData.subject,
        status: ticketData.status,
        priority: ticketData.priority ?? null,
        category: ticketData.category ?? null,
        phone: ticketData.phone,
        email: ticketData.email,
        createdAt: ticketData.createdAt,
        dueDate: ticketData.dueDate,
        assigneeId: ticketData.assigneeId
      } : null,

      // Step 1: Pre-repair Photos → object with fixed keys
      preRepairPhotos: {
        photo1: uploadedFiles.pre_0 || null,
        photo2: uploadedFiles.pre_1 || null
      },

      // Step 2: Work & Charges → match given schema
      workDetails: {
        tyreType: selectedTyreType,
        services: selectedServices,
        patchType: selectedPatchType,
        patchNumber: patchNumber,
        tyreFittingOption: selectedServices.includes('Tyre Fitting') ? tyreFittingOption : null,
        wheelAssemblyOption: selectedServices.includes('Wheel Assembly') ? wheelAssemblyOption : null,
        otherServices: selectedServices.includes('Other Services') ? (otherServicesText || null) : null
      },

      // Step 3: Post-repair Photos → object with fixed keys
      postRepairPhotos: {
        mainPhoto: uploadedFiles.capture_0 || null,
        additionalPhoto1: uploadedFiles.post_0 || null,
        additionalPhoto2: uploadedFiles.post_1 || null
      },

      // Bill Preview Data (use computed repairData fallback if ticket not loaded)
      billData: {
        shopName: repairData.shopName,
        vehicleNumber: repairData.vehicleNumber,
        date: repairData.date,
        customerMobile: repairData.customerMobile,
        fleetName: repairData.fleetName,
        stencilNo: repairData.stencilNo,
        tyreType: repairData.tyreType,
        services: repairData.services,
        totalCost: repairData.totalCost
      },

      // OTP Verification (otp value may be empty pre-OTP)
      otpVerification: {
        customerName: customerName,
        supportNumber: supportNumber,
        otpEntered: otp.join(''),
        verificationTime: new Date().toISOString()
      },

      // Status
      status: 'completed',
      completedAt: new Date().toISOString()
    }

    return payload
  }

  const services = ['Tyre Fitting', 'Puncture', 'Wheel Assembly', 'Air Pressure Check', 'Other Services']

  // Fetch ticket data on component mount
  useEffect(() => {
    const fetchTicketData = async () => {
      try {
        setLoading(true)
        
        // Get user ID from localStorage
        const stored = localStorage.getItem("user")
        let userId = ""
        try {
          userId = stored ? JSON.parse(stored).id : ""
        } catch {}
        
        if (!userId) {
          setError("No user ID found in local storage")
          setLoading(false)
          return
        }

        // Call the API to get all tickets
        const response = await fetch(`${API_BASE}/api/zoho/tickets/mechanic/${userId}`)
        
        if (!response.ok) {
          const text = await response.text()
          throw new Error(text || `HTTP ${response.status}`)
        }
        
        const data = await response.json()
        console.log('API Response for StartJob:', data)
        
        // Find the specific ticket by ID
        const ticket = data.tickets.find(t => t._id === id)
        
        if (!ticket) {
          setError("Ticket not found")
          setLoading(false)
          return
        }
        
        setTicketData(ticket)
        console.log('Found ticket:', ticket)
        
      } catch (err) {
        console.error('Error fetching ticket data:', err)
        setError(err.message || "Failed to fetch ticket data")
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchTicketData()
    }
  }, [id])

  // Dynamic data based on ticket
  const repairData = ticketData ? {
    shopName: 'MSFA Shop Name',
    vehicleNumber: ticketData.zohoTicketId,
    date: `${new Date(ticketData.createdAt).toLocaleDateString()} | ${new Date(ticketData.createdAt).toLocaleTimeString()}`,
    customerMobile: ticketData.phone || '+91 123456789',
    fleetName: 'Text Data',
    stencilNo: ticketData._id.slice(-10), // Use last 10 chars of ticket ID
    tyreType: 'Tubeless',
    services: [
      { name: 'Tyre Fitting', cost: '₹20,000' },
      { name: 'Puncture', cost: '₹200' },
      { name: 'Air Pressure Check', cost: '₹200' }
    ],
    totalCost: '₹20,400'
  } : {
    shopName: 'MSFA Shop Name',
    vehicleNumber: 'DL3C1278',
    date: '12/12/2024 | 10:30 AM',
    customerMobile: '+91 123456789',
    fleetName: 'Text Data',
    stencilNo: '1388676768',
    tyreType: 'Tubeless',
    services: [
      { name: 'Tyre Fitting', cost: '₹20,000' },
      { name: 'Puncture', cost: '₹200' },
      { name: 'Air Pressure Check', cost: '₹200' }
    ],
    totalCost: '₹20,400'
  }

  const customerName = ticketData ? (ticketData.subject || 'Customer') : 'Ankit Yadav'
  const supportNumber = ticketData ? (ticketData.phone || '+91123456789') : '+91123456789'

  // Loading state
  if (loading) {
    return (
      <div className='container'>
        <div className='card' style={{padding: 20, textAlign: 'center'}}>
          <div className='caption-text'>Loading ticket data...</div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className='container'>
        <div className='card' style={{padding: 20, textAlign: 'center'}}>
          <div style={{color: 'red'}} className='text-field'>{error}</div>
          <button className='btn' style={{marginTop: 16}} onClick={() => nav('/jobs')}>
            Back to Jobs
          </button>
        </div>
      </div>
    )
  }

  // Main workflow screen
  if (currentScreen === 'workflow') {
  return (
    <div className='container'>
      <div className='card' style={{padding:20}}>
        {/* Header */}
        <div className='row' style={{alignItems:'center', marginBottom:20}}>
            <button onClick={() => nav('/jobs')} className='btn' style={{background:'#f3f4f6', color:'#111', padding:'8px 12px', width: 'auto', maxWidth: 'none', height: 'auto'}}>←</button>
          <div style={{marginLeft:12}}>
              <h3 className='bold-text' style={{margin:0, color:'var(--brand)', fontSize: '18px'}}>
                {ticketData ? ticketData.zohoTicketId : 'DL3C132739'}
              </h3>
              <small className='caption-text'>
                {ticketData ? ticketData.subject : 'Tyre Location'}
              </small>
            </div>
        </div>

        {/* Step 1: Upload Pre-Repair Photo */}
        <div className='step-section'>
          <div className='row' style={{alignItems:'center', marginBottom:16}}>
              <span className='step-number caption-text'>Step 1:</span>
              <span className='step-title bold-text' style={{fontSize: '16px'}}>Upload Pre-Repair Photo</span>
            <div className='step-complete'>✓</div>
          </div>
          
          <div className='stack' style={{gap:16, marginBottom:24}}>
              <div 
                className={`file-upload-area ${uploadedFiles.pre_0 ? 'has-file' : ''}`}
                onClick={() => handleFileUpload('pre', 0)}
              >
                <img src='/Group.png' alt='upload' className='file-upload-icon' />
                <div className='file-upload-text'>Tap to upload</div>
                <div className='file-upload-subtext'>Camera or Gallery</div>
              </div>
              <div 
                className={`file-upload-area ${uploadedFiles.pre_1 ? 'has-file' : ''}`}
                onClick={() => handleFileUpload('pre', 1)}
              >
                <img src='/Group.png' alt='upload' className='file-upload-icon' />
                <div className='file-upload-text'>Tap to upload</div>
                <div className='file-upload-subtext'>Camera or Gallery</div>
            </div>
          </div>
        </div>

        {/* Step 2: Work & Charges */}
        <div className='step-section'>
          <div className='row' style={{alignItems:'center', marginBottom:16}}>
              <span className='step-number caption-text'>Step 2:</span>
              <span className='step-title bold-text' style={{fontSize: '16px'}}>Work & Charges</span>
          </div>
            <p className='caption-text' style={{marginBottom:24}}>Kindly Select Services Being done</p>

          {/* Select Tyre Type */}
            <div className='form-section'>
            <h4>Select Tyre Type</h4>
            <div className='segmented-control'>
              <button 
                className={`segmented-btn ${selectedTyreType === 'tubeless' ? 'active' : ''}`}
                onClick={() => setSelectedTyreType('tubeless')}
              >
                Tubeless
              </button>
              <button 
                className={`segmented-btn ${selectedTyreType === 'tube' ? 'active' : ''}`}
                onClick={() => setSelectedTyreType('tube')}
              >
                Tube Tyre
              </button>
            </div>
          </div>

          {/* Select Services */}
            <div className='form-section'>
            <h4>Select Services</h4>
            <div className='checkbox-list'>
              {services.map(service => (
                <label key={service} className='checkbox-item'>
                  <input 
                    type='checkbox' 
                    checked={selectedServices.includes(service)}
                    onChange={() => handleServiceToggle(service)}
                  />
                  <span>{service}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Conditional Sub-options */}
          {selectedServices.includes('Tyre Fitting') && (
              <div className='form-section'>
              <h4>Tyre Fitting</h4>
              <div className='radio-group'>
                <label className='radio-item'>
                  <input 
                    type='radio' 
                    name='tyreFitting' 
                    value='mount'
                    checked={tyreFittingOption === 'mount'}
                    onChange={(e) => setTyreFittingOption(e.target.value)}
                  />
                  <span>Mount</span>
                </label>
                <label className='radio-item'>
                  <input 
                    type='radio' 
                    name='tyreFitting' 
                    value='demount'
                    checked={tyreFittingOption === 'demount'}
                    onChange={(e) => setTyreFittingOption(e.target.value)}
                  />
                  <span>Demount</span>
                </label>
              </div>
            </div>
          )}

          {selectedServices.includes('Wheel Assembly') && (
              <div className='form-section'>
              <h4>Wheel Assembly</h4>
              <div className='radio-group'>
                <label className='radio-item'>
                  <input 
                    type='radio' 
                    name='wheelAssembly' 
                    value='jack'
                    checked={wheelAssemblyOption === 'jack'}
                    onChange={(e) => setWheelAssemblyOption(e.target.value)}
                  />
                  <span>Jack + Wheel Nuts</span>
                </label>
              </div>
            </div>
          )}

          {selectedServices.includes('Other Services') && (
              <div className='form-section'>
              <h4>Other Services</h4>
              <input 
                type='text' 
                className='input' 
                placeholder='Type Here' 
                value={otherServicesText}
                onChange={(e) => setOtherServicesText(e.target.value)}
              />
            </div>
          )}

          {/* Select Patch Type */}
            <div className='form-section'>
            <h4>Select Patch Type</h4>
            <div className='segmented-control'>
              <button 
                className={`segmented-btn ${selectedPatchType === 'nylon' ? 'active' : ''}`}
                onClick={() => setSelectedPatchType('nylon')}
              >
                Nylon Patch
              </button>
              <button 
                className={`segmented-btn ${selectedPatchType === 'radial' ? 'active' : ''}`}
                onClick={() => setSelectedPatchType('radial')}
              >
                Radial Patch
              </button>
            </div>
          </div>

          {/* Patch Number - Different options based on patch type */}
            <div className='form-section'>
            <h4>Patch no.:</h4>
            <div className='radio-group'>
              {selectedPatchType === 'nylon' ? (
                ['3', '4', '5', '6', '7', '8'].map(num => (
                  <label key={num} className='radio-item'>
                    <input 
                      type='radio' 
                      name='patchNumber' 
                      value={num}
                      checked={patchNumber === num}
                      onChange={(e) => setPatchNumber(e.target.value)}
                    />
                    <span>{num}</span>
                  </label>
                ))
              ) : (
                ['20', '24', '30', '33', '35', '37', '40', '42'].map(num => (
                  <label key={num} className='radio-item'>
                    <input 
                      type='radio' 
                      name='patchNumber' 
                      value={num}
                      checked={patchNumber === num}
                      onChange={(e) => setPatchNumber(e.target.value)}
                    />
                    <span>{num}</span>
                  </label>
                ))
              )}
            </div>
          </div>

          {/* Continue Button */}
            <div className='btn-center' style={{marginTop:24}}>
              <button className='btn' onClick={async () => { setShowCaptureModal(true) }}>
                Step 3 : Capture Image
          </button>
            </div>
        </div>
      </div>

      {/* Upload Photo Modal */}
      {showModal && (
        <div className='modal-backdrop' onClick={() => setShowModal(false)}>
          <div className='modal' onClick={e => e.stopPropagation()}>
            <div className='modal-header'>
                <h3 className='bold-text' style={{fontSize: '18px'}}>Upload Photo</h3>
              <button onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className='photo-preview'>
              <div>
                  <div className='caption-text'>Photo preview</div>
              </div>
            </div>
            <div className='modal-buttons'>
              <button className='modal-btn modal-btn-outline'>Retake</button>
              <button className='modal-btn-camera'>
                <img src='/Group.png' alt='camera' style={{width:24, height:24}} />
              </button>
              <button className='modal-btn modal-btn-solid'>Submit</button>
            </div>
          </div>
        </div>
      )}

      {/* Capture Post Repair Photo Modal */}
      {showCaptureModal && (
        <div className='modal-backdrop' onClick={() => setShowCaptureModal(false)}>
          <div className='modal' onClick={e => e.stopPropagation()}>
            <div className='modal-header'>
                <h3 className='bold-text' style={{fontSize: '18px'}}>Capture Post Repair Photo</h3>
              <button onClick={() => setShowCaptureModal(false)}>✕</button>
            </div>
            <div className='photo-preview'>
                <div 
                  className={`file-upload-area ${uploadedFiles.capture_0 ? 'has-file' : ''}`}
                  onClick={() => handleFileUpload('capture', 0)}
                  style={{height: 200, cursor: 'pointer'}}
                >
                  {uploadedFiles.capture_0 ? (
                    <div style={{textAlign: 'center', color: '#10b981'}}>
                      <div style={{fontSize: '48px', marginBottom: '12px'}}>✓</div>
                      <div className='file-upload-text'>Image Selected</div>
                      <div className='file-upload-subtext'>Click to change</div>
                    </div>
                  ) : (
                    <div style={{textAlign: 'center'}}>
                      <img src='/Group.png' alt='upload' style={{width:48, height:48, marginBottom:12, opacity: 0.7}} />
                      <div className='file-upload-text'>Post repair photo preview</div>
                      <div className='file-upload-subtext'>Tap to select from Camera or Gallery</div>
                    </div>
                  )}
                </div>
              </div>
              <div className='modal-buttons'>
                <button className='modal-btn modal-btn-outline' onClick={() => handleFileUpload('capture', 0)}>Retake</button>
                <button className='modal-btn-camera' onClick={() => handleFileUpload('capture', 0)}>
                  <img src='/Group.png' alt='camera' style={{width:24, height:24}} />
                </button>
                <button 
                  className='modal-btn modal-btn-solid' 
                  onClick={() => {
                    console.log('Submit clicked, uploaded files:', uploadedFiles)
                    console.log('capture_0 file:', uploadedFiles.capture_0)
                    setShowCaptureModal(false)
                    setShowPostRepairModal(true)
                  }}
                  disabled={!uploadedFiles.capture_0}
                  style={{opacity: uploadedFiles.capture_0 ? 1 : 0.5}}
                >
                  Submit {uploadedFiles.capture_0 ? '✓' : '✗'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Post Repair Upload Modal */}
        {showPostRepairModal && (
          <div className='modal-backdrop' onClick={() => setShowPostRepairModal(false)}>
            <div className='modal' onClick={e => e.stopPropagation()}>
              <div className='modal-header'>
                <h3 className='bold-text' style={{fontSize: '18px'}}>Upload Post Repair Images</h3>
                <button onClick={() => setShowPostRepairModal(false)}>✕</button>
              </div>
              <div className='photo-preview'>
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', height: 'auto', padding: '20px'}}>
                  <div 
                    className={`file-upload-area ${uploadedFiles.post_0 ? 'has-file' : ''}`}
                    onClick={() => handleFileUpload('post', 0)}
                    style={{height: 120, minHeight: 120}}
                  >
                    <img src='/Group.png' alt='upload' style={{width:32, height:32, marginBottom:8}} />
                    <div className='file-upload-text'>Upload Image 1</div>
                    <div className='file-upload-subtext'>Camera or Gallery</div>
                  </div>
                  <div 
                    className={`file-upload-area ${uploadedFiles.post_1 ? 'has-file' : ''}`}
                    onClick={() => handleFileUpload('post', 1)}
                    style={{height: 120, minHeight: 120}}
                  >
                    <img src='/Group.png' alt='upload' style={{width:32, height:32, marginBottom:8}} />
                    <div className='file-upload-text'>Upload Image 2</div>
                    <div className='file-upload-subtext'>Camera or Gallery</div>
                  </div>
              </div>
            </div>
            <div className='modal-buttons'>
                <button className='modal-btn modal-btn-outline' onClick={() => setShowPostRepairModal(false)}>Cancel</button>
                <button
                  className='modal-btn modal-btn-solid'
                  onClick={async () => {
                    // Close modal UI first
                    setShowPostRepairModal(false)

                    // Optional: submit pre-OTP payload (kept from earlier)
                    await submitJobPreOtp()

                    // Fetch service costs for selected services
                    await fetchRateCardCosts()

                    // Proceed to Bill Preview (next screen before OTP)
                    setCurrentScreen('bill-preview')
                  }}
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Bill Preview Screen
  if (currentScreen === 'bill-preview') {
    return (
      <div className='container'>
        <div className='card' style={{padding:20}}>
          {/* Header */}
          <div className='row' style={{alignItems:'center', marginBottom:20}}>
            <button onClick={() => setCurrentScreen('workflow')} className='btn' style={{background:'#f3f4f6', color:'#111', padding:'8px 12px', width: 'auto', maxWidth: 'none', height: 'auto'}}>←</button>
            <h3 className='bold-text' style={{margin:0, fontSize: '18px'}}>Bill Preview</h3>
          </div>

          {/* Repair Summary */}
          <div style={{marginBottom: 24}}>
            <h3 className='bold-text' style={{fontSize: '20px', marginBottom: 16}}>Repair Summary</h3>
            
            <div style={{background: '#fff', borderRadius: 12, padding: 16, border: '1px solid #e5e7eb'}}>
              <div className='row' style={{alignItems: 'center', marginBottom: 12}}>
                <span className='bold-text' style={{color: 'var(--brand)', fontSize: '16px'}}>{repairData.shopName}</span>
                <span className='text-field' style={{marginLeft: 8}}>{repairData.vehicleNumber}</span>
              </div>
              
              <div className='stack' style={{gap: 8}}>
                <div className='row' style={{justifyContent: 'space-between'}}>
                  <span className='text-field'>Date of Breakdown:</span>
                  <span className='text-field'>{repairData.date}</span>
                </div>
                <div className='row' style={{justifyContent: 'space-between'}}>
                  <span className='text-field'>Customer Mob no:</span>
                  <span className='text-field'>{repairData.customerMobile}</span>
                </div>
                {/* <div className='row' style={{justifyContent: 'space-between'}}>
                  <span className='text-field'>Fleet Name:</span>
                  <span className='text-field'>{repairData.fleetName}</span>
                </div> */}
                {/* <div className='row' style={{justifyContent: 'space-between'}}>
                  <span className='text-field'>Stencil No:</span>
                  <span className='text-field'>{repairData.stencilNo}</span>
                </div> */}
                <div className='row' style={{justifyContent: 'space-between'}}>
                  <span className='text-field'>Tyre Type:</span>
                  <span className='text-field'>{repairData.tyreType}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Performed Services */}
          <div style={{marginBottom: 24}}>
            <div className='row' style={{alignItems: 'center', marginBottom: 16}}>
              <h3 className='bold-text' style={{fontSize: '20px', margin: 0}}>Performed Services</h3>
              <button style={{background: 'none', border: 'none', color: 'var(--brand)', cursor: 'pointer', marginLeft: 8}}>
                <span style={{fontSize: '16px'}}>✏️</span>
              </button>
            </div>
            
            <div style={{background: '#fff', borderRadius: 12, padding: 16, border: '1px solid #e5e7eb'}}>
              {/* Loading/Error for rate card */}
              {rateLoading && (
                <div className='caption-text'>Calculating service costs...</div>
              )}
              {rateError && (
                <div className='text-field' style={{color:'red'}}>{rateError}</div>
              )}
              {!rateLoading && !rateError && (
                <div className='stack' style={{gap: 12}}>
                  {(rateCostData?.breakdown?.length ? rateCostData.breakdown : repairData.services).map((item, index) => (
                    <div key={index} className='row' style={{justifyContent: 'space-between'}}>
                      <span className='text-field'>{item.service || item.name}</span>
                      <span className='text-field'>₹ {item.cost}</span>
                    </div>
                  ))}
                  <hr style={{border: 'none', borderTop: '1px solid #e5e7eb', margin: '8px 0'}} />
                  <div className='row' style={{justifyContent: 'space-between'}}>
                    <span className='bold-text' style={{color: 'var(--brand)', fontSize: '16px'}}>Total Repair Cost:</span>
                    <span className='bold-text' style={{color: 'var(--brand)', fontSize: '16px'}}>
                      ₹ {rateCostData?.totalCost ?? repairData.totalCost}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Continue Button */}
          {otpSendError && (
            <div className='text-field' style={{ color: 'red', marginBottom: 12 }}>
              {otpSendError}
            </div>
          )}
          <div className='btn-center'>
            <button
              className={`btn ${otpSendLoading ? 'btn-loading' : ''}`}
              onClick={async () => {
                try {
                  setOtpSendLoading(true)
                  setOtpSendError("")
                  
                  // Ensure cost data fetched
                  if (!rateCostData) {
                    await fetchRateCardCosts()
                  }

                  // Attempt to send OTP before any further actions
                  const sent = await sendOtpToPhone()
                  if (!sent) {
                    // Do not proceed if OTP could not be sent
                    setOtpSendError('Failed to send OTP. Please try again.')
                    return
                  }

                  // Update Zoho ticket with array-of-strings photos
                  await submitZohoTicketUpdate()

                  // Save full payload pre-OTP (FormData route)
                  await submitJobPreOtp();

                  setCurrentScreen('otp-verification');
                } catch (error) {
                  console.error('Error proceeding to OTP:', error)
                  setOtpSendError('Failed to proceed to OTP verification. Please try again.')
                } finally {
                  setOtpSendLoading(false)
                }
              }}
              disabled={otpSendLoading}
            >
              {otpSendLoading ? 'Sending OTP...' : 'Continue to OTP Verification'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // OTP Verification Screen
  if (currentScreen === 'otp-verification') {
    return (
      <div className='container'>
        <div className='card' style={{padding:20}}>
          {/* Header */}
          <div className='row' style={{alignItems:'center', marginBottom:20}}>
            <button onClick={() => setCurrentScreen('bill-preview')} className='btn' style={{background:'#f3f4f6', color:'#111', padding:'8px 12px', width: 'auto', maxWidth: 'none', height: 'auto'}}>←</button>
            <h3 className='bold-text' style={{margin:0, fontSize: '18px'}}>Verify OTP</h3>
          </div>

          {/* OTP Verification */}
          <div style={{marginBottom: 32}}>
            <h3 className='bold-text' style={{fontSize: '20px', marginBottom: 16}}>OTP Verification</h3>
            
            <div style={{marginBottom: 24}}>
              <p className='caption-text' style={{marginBottom: 16}}>
                OTP Successfully Shared with <span style={{color: 'var(--brand)'}}>{customerName}</span>
              </p>
              
              <div className='stack' style={{gap: 8}}>
                <label className='text-field' style={{marginBottom: 8}}>Enter OTP</label>
                <div style={{display: 'flex', gap: 12, justifyContent: 'center'}}>
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      id={`otp-${index}`}
                      type='text'
                      inputMode='numeric'
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      style={{
                        width: '48px',
                        height: '48px',
                        border: '2px solid #e5e7eb',
                        borderRadius: '8px',
                        textAlign: 'center',
                        fontSize: '18px',
                        fontWeight: '600',
                        fontFamily: 'var(--font-family)'
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* OTP Verification Error */}
            {otpVerifyError && (
              <div className='text-field' style={{ color: 'red', marginBottom: 16, textAlign: 'center' }}>
                {otpVerifyError}
              </div>
            )}

            <div style={{textAlign: 'center', marginBottom: 32}}>
              <p className='caption-text'>
                Didn't Get The Code? <span 
                  style={{
                    color: 'var(--brand)', 
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                  onClick={async () => {
                    try {
                      setOtpSendLoading(true)
                      setOtpSendError("")
                      const sent = await sendOtpToPhone()
                      if (sent) {
                        toast.success('OTP resent successfully')
                      } else {
                        setOtpSendError('Failed to resend OTP. Please try again.')
                      }
                    } catch (error) {
                      console.error('Error resending OTP:', error)
                      setOtpSendError('Failed to resend OTP. Please try again.')
                    } finally {
                      setOtpSendLoading(false)
                    }
                  }}
                >
                  Resend Code
                </span>
              </p>
            </div>

            {/* Call Support */}
            <div style={{background: '#f8fafc', borderRadius: 12, padding: 16}}>
              <div className='row' style={{alignItems: 'center', justifyContent: 'center'}}>
                {/* <span className='text-field' style={{marginRight: 8}}>Call Support:</span>
                <span className='text-field' style={{marginRight: 8}}>{supportNumber}</span> */}
                {/* <button style={{background: 'var(--brand)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'}}>
                  <span style={{color: 'white', fontSize: '16px'}}>📞</span>
                </button> */}
              </div>
            </div>
          </div>

          {/* Verify Button */}
          <div className='btn-center'>
            <button 
              className={`btn ${otpVerifyLoading ? 'btn-loading' : ''}`}
              onClick={async () => {
                try {
                  setOtpVerifyLoading(true)
                  setOtpVerifyError("")
                  
                  // 1) Verify OTP first; only then mark Zoho ticket completed
                  const otpVerified = await verifyOtpWithServer()
                  console.log('otpVerified', otpVerified)
                  if (!otpVerified) {
                    setOtpVerifyError('OTP verification failed. Please try again.')
                    setOtp(['', '', '', '']) // Clear OTP input on error
                    return
                  }

                  // 2) Mark Zoho ticket completed via local API (best-effort; do not block UI if it fails)
                  await submitZohoVerifyCompleted()
                  
                  // 3) UI success & redirect to Home/Dashboard
                  setShowSuccessModal(true)
                } catch (error) {
                  console.error('Error verifying OTP:', error)
                  setOtpVerifyError('OTP verification failed. Please try again.')
                  setOtp(['', '', '', '']) // Clear OTP input on error
                } finally {
                  setOtpVerifyLoading(false)
                }
              }}
              disabled={otpVerifyLoading}
            >
              {otpVerifyLoading ? 'Verifying...' : 'Verify OTP'}
            </button>
          </div>
        </div>

        {/* Success Modal */}
        {showSuccessModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 20
          }}>
            <div style={{
              background: 'white',
              borderRadius: 16,
              padding: 24,
              textAlign: 'center',
              maxWidth: 300,
              width: '100%'
            }}>
              <div style={{
                width: 64,
                height: 64,
                background: '#10b981',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px'
              }}>
                <span style={{color: 'white', fontSize: '24px', fontWeight: 'bold'}}>✓</span>
              </div>
              <h3 className='bold-text' style={{fontSize: '18px', marginBottom: 8}}>OTP Verified, Ticket Closed</h3>
              <p className='caption-text' style={{marginBottom: 24}}>Your ticket Verification is Pending Payment</p>
              <button className='btn' style={{width: '100%'}} onClick={() => nav('/')}>
                Back to Home
              </button>
          </div>
        </div>
      )}
    </div>
  )
}

  // Confirmation Screen
  if (currentScreen === 'confirmation') {
    // Prepare and log payload when confirmation screen loads
    React.useEffect(() => {
      const payload = preparePayload()
      console.log('=== JOB COMPLETION PAYLOAD ===')
      console.log('Full Payload:', payload)
      console.log('================================')
      
      // TODO: Replace this with actual API call
      // Example API call structure:
      /*
      const submitJobData = async () => {
        try {
          const response = await fetch('/api/jobs/complete', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            },
            body: JSON.stringify(payload)
          })
          
          if (response.ok) {
            const result = await response.json()
            console.log('Job submitted successfully:', result)
          } else {
            console.error('Failed to submit job:', response.statusText)
          }
        } catch (error) {
          console.error('Error submitting job:', error)
        }
      }
      
      submitJobData()
      */
    }, [])

    return (
      <div className='container'>
        <div className='card' style={{padding:20, textAlign: 'center'}}>
          <div style={{
            width: 80,
            height: 80,
            background: '#10b981',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px'
          }}>
            <span style={{color: 'white', fontSize: '32px', fontWeight: 'bold'}}>✓</span>
          </div>
          
          <h2 className='bold-text' style={{fontSize: '24px', marginBottom: 16, color: 'var(--brand)'}}>Job Completed Successfully!</h2>
          <p className='text-field' style={{marginBottom: 32}}>Your repair job has been completed and verified. The customer has been notified.</p>
          
          <div style={{background: '#f8fafc', borderRadius: 12, padding: 16, marginBottom: 24}}>
            <div className='row' style={{justifyContent: 'space-between', marginBottom: 8}}>
              <span className='text-field'>Total Amount:</span>
              <span className='bold-text' style={{color: 'var(--brand)'}}>{repairData.totalCost}</span>
            </div>
            <div className='row' style={{justifyContent: 'space-between', marginBottom: 8}}>
              <span className='text-field'>Status:</span>
              <span className='caption-text' style={{color: '#10b981'}}>Completed</span>
            </div>
            <div className='row' style={{justifyContent: 'space-between'}}>
              <span className='text-field'>Job ID:</span>
              <span className='caption-text'>{id}</span>
            </div>
          </div>

          <div className='caption-text' style={{marginBottom: 16, fontSize: '11px', color: '#6b7280'}}>
            📋 All job data has been logged to console for API integration
          </div>

          <div className='btn-center'>
            <button className='btn' onClick={() => nav('/')}>
              Back to Home
            </button>
          </div>
        </div>
      </div>
    )
  }

  return null
}