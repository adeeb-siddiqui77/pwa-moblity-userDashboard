
import React, { useEffect } from 'react'

export default function OTPInput({ value, onChange, length=6, disabled=false, error=false }){
  const refs = Array.from({length}, ()=>React.createRef())
  const values = value || Array.from({length}, ()=>'')

  const handle = (i, v) => {
    const copy = [...values]
    copy[i] = v.replace(/\D/g,'').slice(-1)
    onChange(copy)
    if (copy[i] && refs[i+1]) refs[i+1].current?.focus()
  }

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !values[i] && refs[i-1]) {
      refs[i-1].current?.focus()
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g,'').slice(0, length)
    const newValues = Array.from({length}, (_, i) => pastedData[i] || '')
    onChange(newValues)
    
    // Focus on the last filled input or first empty input
    const lastFilledIndex = newValues.findIndex(val => !val) - 1
    const focusIndex = lastFilledIndex >= 0 ? lastFilledIndex : Math.min(pastedData.length - 1, length - 1)
    if (refs[focusIndex]) {
      refs[focusIndex].current?.focus()
    }
  }

  // Auto-focus first input when component mounts
  useEffect(() => {
    if (refs[0] && !disabled) {
      refs[0].current?.focus()
    }
  }, [disabled])

  return (
    <div className='otp-container'>
      <div className='otp-inputs'>
        {values.map((d,i)=>(
          <input 
            key={i} 
            ref={refs[i]} 
            className={`otp-input ${error ? 'error' : ''}`}
            value={d} 
            onChange={e=>handle(i,e.target.value)}
            onKeyDown={e=>handleKeyDown(i,e)}
            onPaste={handlePaste}
            disabled={disabled}
            maxLength={1}
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="one-time-code"
          />
        ))}
      </div>
    </div>
  )
}
