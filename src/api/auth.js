
import api from './axios'

export const sendOtp = (mobile, dial='+91') => api.post('/api/auth/send-otp', { mobile, dial })
export const verifyOtp = (mobile, otp) => api.post('/api/auth/verify-mixture', { mobile, otp })
export const loginWithPin = (mobile, pin) =>
  api.post('/api/auth/user/login', { mobile, pin }, { withCredentials: false })
