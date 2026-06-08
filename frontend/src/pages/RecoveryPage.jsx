import { useState, useEffect } from 'react'
import { Moon, Zap, Activity, Brain } from 'lucide-react'
import api from '../services/api'

function ScoreRing({ score }) {
  const color = score >= 80 ? '#00FF85' : score >= 60 ? '#3B82F6' : score >= 40 ? '#F59E0B' : '#EF4444'
  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative w-32 h-32">
        <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="50" fill="none" stroke="#1E1E1E" strokeWidth="10" />
          <circle cx="60" cy="60" r="50" fill="none" stroke={color} strokeWidth="10"
            strokeDasharray={`${(score / 100) * 314} 314`}
            strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-white font-bold text-3xl">{score}</span>
          <span className="text-neff-muted text-xs">/ 100</span>
        </div>
      </div>
    </div>
  )
}

export default function RecoveryPage() {
  const [form, setForm] = useState({
    sleep_hours: 7,
    soreness_level: 5,
    energy_level: 7,
    stress_level: 4,
    notes: '',
  })
  const [result, setResult] = useState(null)
  const [todayLog, setTodayLog] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    api.get('/recovery/today')
      .then(r => {
        if (r.data.logged_today) setTodayLog(r.data)
      })
      .catch(() => {})
  }, [])

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const handleSubmit = async () => {
    setIsLoading(true)
    try {
      const res = await api.post('/recovery/log', form)
      setResult(res.data)
      setTodayLog(res.data)
    } catch {
      alert('Failed to log recovery')
    } finally {
      setIsLoading(false)
    }
  }

  const sliders = [
    { key: 'sleep_hours', icon: Moon, label: 'Sleep Hours', min: 3, max: 12, step: 0.5, unit: 'hrs', color: 'text-blue-400' },
    { key: 'energy_level', icon: Zap, label: 'Energy Level', min: 1, max: 10, step: 1, unit: '/10', color: 'text-yellow-400' },
    { key: 'soreness_level', icon: Activity, label: 'Soreness Level', min: 1, max: 10, step: 1, unit: '/10', color: 'text-red-400' },
    { key: 'stress_level', icon: Brain, label: 'Stress Level', min: 1, max: 10, step: 1, unit: '/10', color: 'text-purple-400' },
  ]

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-white text-2xl font-bold">Recovery</h1>
        <p className="text-neff-muted mt-1">Track your daily recovery to train smarter</p>
      </div>

      {/* Today's Score */}
      {todayLog && (
        <div className="neff-card mb-6">
          <h2 className="text-white font-semibold mb-4">Today's Recovery</h2>
          <div className="flex items-center gap-8">
            <ScoreRing score={todayLog.recovery_score} />
            <div>
              <p className={`font-bold text-xl capitalize
                ${todayLog.status === 'excellent' ? 'text-neff-green' :
                  todayLog.status === 'good' ? 'text-blue-400' :
                  todayLog.status === 'moderate' ? 'text-yellow-400' : 'text-red-400'}`}>
                {todayLog.status}
              </p>
              <p className="text-white text-sm mt-2 max-w-xs">{todayLog.recommendation}</p>
            </div>
          </div>
        </div>
      )}

      {/* Log Form */}
      <div className="neff-card">
        <h2 className="text-white font-semibold mb-6">
          {todayLog ? 'Update Today\'s Recovery' : 'Log Today\'s Recovery'}
        </h2>

        <div className="space-y-6">
          {sliders.map(({ key, icon: Icon, label, min, max, step, unit, color }) => (
            <div key={key}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Icon size={16} className={color} />
                  <label className="text-white text-sm font-medium">{label}</label>
                </div>
                <span className="text-neff-green font-bold">
                  {form[key]}{unit}
                </span>
              </div>
              <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={form[key]}
                onChange={e => set(key, parseFloat(e.target.value))}
                className="w-full accent-neff-green"
              />
              <div className="flex justify-between text-neff-muted text-xs mt-1">
                <span>{min}</span>
                <span>{max}</span>
              </div>
            </div>
          ))}

          <div>
            <label className="text-white text-sm font-medium mb-2 block">Notes (optional)</label>
            <input
              className="neff-input"
              placeholder="How are you feeling today?"
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="neff-btn w-full disabled:opacity-50"
          >
            {isLoading ? 'Logging...' : 'Log Recovery'}
          </button>
        </div>
      </div>

      {/* Result */}
      {result && (
        <div className="neff-card mt-4 border border-neff-green/30">
          <div className="flex items-center gap-4">
            <ScoreRing score={result.recovery_score} />
            <div>
              <p className="text-neff-muted text-sm">Recovery Score</p>
              <p className={`font-bold text-xl capitalize
                ${result.status === 'excellent' ? 'text-neff-green' :
                  result.status === 'good' ? 'text-blue-400' :
                  result.status === 'moderate' ? 'text-yellow-400' : 'text-red-400'}`}>
                {result.status}
              </p>
              <p className="text-white text-sm mt-1">{result.recommendation}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}