import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Zap } from 'lucide-react'
import useAuthStore from '../store/authStore'

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const { register, isLoading, error, clearError } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    clearError()
    const result = await register(form.name, form.email, form.password)
    if (result.success) navigate('/onboarding')
  }

  return (
    <div className="min-h-screen bg-neff-dark flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-8 justify-center">
          <Zap className="text-neff-green" size={28} />
          <h1 className="text-white font-bold text-2xl">NEFF</h1>
        </div>

        <div className="neff-card">
          <h2 className="text-white font-semibold text-xl mb-1">Create account</h2>
          <p className="text-neff-muted text-sm mb-6">Start your transformation today</p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { label: 'Full Name', key: 'name', type: 'text', placeholder: 'Jamsher NA' },
              { label: 'Email', key: 'email', type: 'email', placeholder: 'you@example.com' },
              { label: 'Password', key: 'password', type: 'password', placeholder: '••••••••' },
            ].map(({ label, key, type, placeholder }) => (
              <div key={key}>
                <label className="text-neff-muted text-sm mb-1.5 block">{label}</label>
                <input className="neff-input" type={type} placeholder={placeholder}
                  value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} required />
              </div>
            ))}
            <button type="submit" disabled={isLoading} className="neff-btn w-full mt-2 disabled:opacity-50">
              {isLoading ? 'Creating account...' : 'Get Started'}
            </button>
          </form>

          <p className="text-neff-muted text-sm text-center mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-neff-green hover:underline">Login</Link>
          </p>
        </div>
      </div>
    </div>
  )
}