import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Zap } from 'lucide-react'
import api from '../services/api'
import useAuthStore from '../store/authStore'

const GOALS = [
  { value: 'build_muscle', label: 'Build Muscle', emoji: '💪' },
  { value: 'lose_fat', label: 'Lose Fat', emoji: '🔥' },
  { value: 'recomposition', label: 'Recomposition', emoji: '⚖️' },
  { value: 'general_fitness', label: 'General Fitness', emoji: '🏃' },
  { value: 'strength', label: 'Strength', emoji: '🏋️' },
]

const EXPERIENCE = [
  { value: 'beginner', label: 'Beginner', desc: 'Less than 1 year' },
  { value: 'intermediate', label: 'Intermediate', desc: '1-3 years' },
  { value: 'advanced', label: 'Advanced', desc: '3+ years' },
]

const EQUIPMENT = [
  { value: 'full_gym', label: 'Full Gym', emoji: '🏋️' },
  { value: 'home_gym', label: 'Home Gym', emoji: '🏠' },
  { value: 'dumbbells_only', label: 'Dumbbells Only', emoji: '🎯' },
  { value: 'bodyweight', label: 'Bodyweight Only', emoji: '🤸' },
]

const STEPS = ['Personal', 'Goals', 'Equipment', 'Schedule']

export default function OnboardingPage() {
  const navigate = useNavigate()
  const { fetchProfile } = useAuthStore()
  const [step, setStep] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    age: '', gender: 'male', height_cm: '', weight_kg: '',
    goal: '', experience_level: '', equipment: '',
    training_days_per_week: 4, sleep_hours: 7, injuries: '',
  })

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }))

  const handleSubmit = async () => {
    setIsLoading(true)
    setError('')
    try {
      await api.post('/users/onboarding', {
        ...form,
        age: parseInt(form.age),
        height_cm: parseFloat(form.height_cm),
        weight_kg: parseFloat(form.weight_kg),
        training_days_per_week: parseInt(form.training_days_per_week),
        sleep_hours: parseFloat(form.sleep_hours),
      })
      await api.post('/ai/generate-plan')
      await fetchProfile()
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-neff-dark flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2 mb-6 justify-center">
          <Zap className="text-neff-green" size={24} />
          <span className="text-white font-bold text-xl">NEFF</span>
        </div>

        <div className="flex gap-2 mb-6">
          {STEPS.map((s, i) => (
            <div key={s} className="flex-1">
              <div className={`h-1 rounded-full ${i <= step ? 'bg-neff-green' : 'bg-neff-border'}`} />
              <p className={`text-xs mt-1 text-center ${i === step ? 'text-neff-green' : 'text-neff-muted'}`}>{s}</p>
            </div>
          ))}
        </div>

        <div className="neff-card">
          {step === 0 && (
            <div className="space-y-4">
              <h2 className="text-white font-semibold text-lg">Tell us about yourself</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-neff-muted text-sm mb-1.5 block">Age</label>
                  <input className="neff-input" type="number" placeholder="22"
                    value={form.age} onChange={e => set('age', e.target.value)} />
                </div>
                <div>
                  <label className="text-neff-muted text-sm mb-1.5 block">Gender</label>
                  <select className="neff-input" value={form.gender} onChange={e => set('gender', e.target.value)}>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-neff-muted text-sm mb-1.5 block">Height (cm)</label>
                  <input className="neff-input" type="number" placeholder="175"
                    value={form.height_cm} onChange={e => set('height_cm', e.target.value)} />
                </div>
                <div>
                  <label className="text-neff-muted text-sm mb-1.5 block">Weight (kg)</label>
                  <input className="neff-input" type="number" placeholder="70"
                    value={form.weight_kg} onChange={e => set('weight_kg', e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-white font-semibold text-lg">What is your primary goal?</h2>
              <div className="space-y-2">
                {GOALS.map(g => (
                  <button key={g.value} onClick={() => set('goal', g.value)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border text-left transition-colors
                      ${form.goal === g.value ? 'border-neff-green bg-neff-green/10 text-white' : 'border-neff-border text-neff-muted'}`}>
                    <span>{g.emoji}</span><span className="font-medium">{g.label}</span>
                  </button>
                ))}
              </div>
              <div>
                <p className="text-neff-muted text-sm mb-2">Experience Level</p>
                <div className="grid grid-cols-3 gap-2">
                  {EXPERIENCE.map(e => (
                    <button key={e.value} onClick={() => set('experience_level', e.value)}
                      className={`px-3 py-2 rounded-lg border text-sm text-center transition-colors
                        ${form.experience_level === e.value ? 'border-neff-green bg-neff-green/10 text-white' : 'border-neff-border text-neff-muted'}`}>
                      <div className="font-medium">{e.label}</div>
                      <div className="text-xs opacity-70">{e.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-white font-semibold text-lg">What equipment do you have?</h2>
              <div className="space-y-2">
                {EQUIPMENT.map(e => (
                  <button key={e.value} onClick={() => set('equipment', e.value)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border text-left transition-colors
                      ${form.equipment === e.value ? 'border-neff-green bg-neff-green/10 text-white' : 'border-neff-border text-neff-muted'}`}>
                    <span>{e.emoji}</span><span className="font-medium">{e.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <h2 className="text-white font-semibold text-lg">Your training schedule</h2>
              <div>
                <label className="text-neff-muted text-sm mb-3 block">Training days per week</label>
                <div className="flex gap-2">
                  {[2, 3, 4, 5, 6].map(d => (
                    <button key={d} onClick={() => set('training_days_per_week', d)}
                      className={`flex-1 py-3 rounded-lg border font-semibold text-lg transition-colors
                        ${form.training_days_per_week === d ? 'border-neff-green bg-neff-green text-black' : 'border-neff-border text-neff-muted'}`}>
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-neff-muted text-sm mb-1.5 block">Average sleep hours</label>
                <input className="neff-input" type="number" min="3" max="12" step="0.5"
                  value={form.sleep_hours} onChange={e => set('sleep_hours', e.target.value)} />
              </div>
              <div>
                <label className="text-neff-muted text-sm mb-1.5 block">Any injuries? (optional)</label>
                <input className="neff-input" type="text" placeholder="e.g. Lower back pain"
                  value={form.injuries} onChange={e => set('injuries', e.target.value)} />
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg mt-4">
              {error}
            </div>
          )}

          <div className="flex gap-3 mt-6">
            {step > 0 && (
              <button onClick={() => setStep(step - 1)} className="neff-btn px-4">
                Back
              </button>
            )}
            {step < STEPS.length - 1 ? (
              <button onClick={() => setStep(step + 1)} className="neff-btn flex-1">
                Next
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={isLoading} className="neff-btn flex-1 disabled:opacity-50">
                {isLoading ? 'Generating your plan...' : '🚀 Generate My Plan'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}