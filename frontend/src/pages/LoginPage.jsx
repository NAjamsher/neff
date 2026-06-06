import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Zap } from 'lucide-react'
import useAuthStore from '../store/authStore'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { login, isLoading, error, clearError } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    clearError()
    const result = await login(email, password)
    if (result.success) navigate('/dashboard')
  }

  return (
    <div className="min-h-screen bg-neff-dark flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-8 justify-center">
          <Zap className="text-neff-green" size={28} />
          <h1 className="text-white font-bold text-2xl">NEFF</h1>
        </div>

        <div className="neff-card">
          <h2 className="text-white font-semibold text-xl mb-1">Welcome back</h2>
          <p className="text-neff-muted text-sm mb-6">Login to continue your journey</p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-neff-muted text-sm mb-1.5 block">Email</label>
              <input className="neff-input" type="email" placeholder="you@example.com"
                value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <label className="text-neff-muted text-sm mb-1.5 block">Password</label>
              <input className="neff-input" type="password" placeholder="••••••••"
                value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <button type="submit" disabled={isLoading} className="neff-btn w-full mt-2 disabled:opacity-50">
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <p className="text-neff-muted text-sm text-center mt-5">
            No account?{' '}
            <Link to="/register" className="text-neff-green hover:underline">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  )
}