import { create } from 'zustand'
import api from '../services/api'

const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('neff_token') || null,
  isLoading: false,
  error: null,

  register: async (name, email, password) => {
    set({ isLoading: true, error: null })
    try {
      const res = await api.post('/auth/register', { name, email, password })
      const { access_token, user } = res.data
      localStorage.setItem('neff_token', access_token)
      set({ token: access_token, user, isLoading: false })
      return { success: true }
    } catch (err) {
      const msg = err.response?.data?.detail || 'Registration failed'
      set({ error: msg, isLoading: false })
      return { success: false, error: msg }
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null })
    try {
      const res = await api.post('/auth/login', { email, password })
      const { access_token, user } = res.data
      localStorage.setItem('neff_token', access_token)
      set({ token: access_token, user, isLoading: false })
      return { success: true }
    } catch (err) {
      const msg = err.response?.data?.detail || 'Login failed'
      set({ error: msg, isLoading: false })
      return { success: false, error: msg }
    }
  },

  fetchProfile: async () => {
    try {
      const res = await api.get('/users/me')
      set({ user: res.data })
    } catch {}
  },

  logout: () => {
    localStorage.removeItem('neff_token')
    set({ user: null, token: null })
  },

  clearError: () => set({ error: null }),
}))

export default useAuthStore