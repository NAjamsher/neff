import axios from 'axios'

const api = axios.create({
  // Tries Vercel's environment variable first, falls back to local dev URL
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

// Attach token to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('neff_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// If token expired redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('neff_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api