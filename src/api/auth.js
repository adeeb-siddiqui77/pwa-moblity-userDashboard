
import api from './axios'

export const sendOtp = (mobile, dial='+91') => api.post('/api/auth/send-otp', { mobile, dial })
export const verifyOtp = (mobile, otp) => api.post('/api/auth/verify-mixture', { mobile, otp })
export const loginWithPin = (mobile, pin) =>
  api.post('/api/auth/user/login', { mobile, pin }, { withCredentials: false })

// Change PIN API
export const changePin = (currentPin, newPin) => {
  return api.post('/api/auth/user/change-pin', { currentPin, newPin })
}

// Get User Profile API
export const getUserProfile = () => {
  return api.get('/api/auth/user/profile')
}

