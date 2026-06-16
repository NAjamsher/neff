import { useEffect, useState } from 'react'
import { CheckCircle, ArrowUp, RotateCcw, Minus, Zap, X } from 'lucide-react'
import api from '../services/api'

function StatusBadge({ status }) {
  if (status === 'increase') return (
    <span className="flex items-center gap-1 text-neff-green text-xs font-medium">
      <ArrowUp size={12} /> Increase Weight
    </span>
  )
  if (status === 'retry') return (
    <span className="flex items-center gap-1 text-red-400 text-xs font-medium">
      <RotateCcw size={12} /> Retry Same Weight
    </span>
  )
  return (
    <span className="flex items-center gap-1 text-blue-400 text-xs font-medium">
      <Minus size={12} /> Maintain Weight
    </span>
  )
}

// Pre-workout briefing modal
function BriefingModal({ dayName, onClose, onStart }) {
  const [briefing, setBriefing] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/ai/pre-workout-briefing/${encodeURIComponent(dayName)}`)
      .then(r => setBriefing(r.data))
      .catch(() => setBriefing({ briefing: "Let's get it. Train hard today.", recovery_score: null }))
      .finally(() => setLoading(false))
  }, [dayName])

  const scoreColor = !briefing?.recovery_score ? 'text-neff-muted'
    : briefing.recovery_score >= 80 ? 'text-neff-green'
    : briefing.recovery_score >= 60 ? 'text-blue-400'
    : briefing.recovery_score >= 40 ? 'text-yellow-400'
    : 'text-red-400'

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-neff-card border border-neff-border rounded-2xl p-6 w-full max-w-md">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-neff-green flex items-center justify-center">
              <Zap size={16} className="text-black" />
            </div>
            <div>
              <p className="text-white font-semibold">Pre-Workout Briefing</p>
              <p className="text-neff-muted text-xs">{dayName}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-neff-muted hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Recovery Score */}
        {briefing?.recovery_score && (
          <div className="flex items-center gap-3 bg-neff-border rounded-xl p-3 mb-4">
            <div className="text-center">
              <p className={`font-bold text-2xl ${scoreColor}`}>
                {briefing.recovery_score}
              </p>
              <p className="text-neff-muted text-xs">Recovery</p>
            </div>
            <div className="w-px h-10 bg-neff-border" />
            <div>
              <p className={`font-medium capitalize text-sm ${scoreColor}`}>
                {briefing.recovery_status}
              </p>
              <p className="text-neff-muted text-xs">Today's status</p>
            </div>
            {briefing.current_streak > 0 && (
              <>
                <div className="w-px h-10 bg-neff-border" />
                <div className="text-center">
                  <p className="text-orange-400 font-bold text-2xl">
                    {briefing.current_streak}
                  </p>
                  <p className="text-neff-muted text-xs">Day streak 🔥</p>
                </div>
              </>
            )}
          </div>
        )}

        {/* AI Briefing Text */}
        <div className="bg-neff-border rounded-xl p-4 mb-5 min-h-24">
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {[0,1,2].map(i => (
                  <div key={i} className="w-2 h-2 bg-neff-green rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
              <p className="text-neff-muted text-sm">Analyzing your data...</p>
            </div>
          ) : (
            <>
              <p className="text-neff-green text-xs font-medium mb-2 font-mono">
                AI COACH
              </p>
              <p className="text-white text-sm leading-relaxed">
                {briefing?.briefing}
              </p>
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-neff-border text-neff-muted py-2.5 rounded-lg text-sm hover:text-white transition-colors"
          >
            Back
          </button>
          <button
            onClick={onStart}
            disabled={loading}
            className="flex-1 bg-neff-green text-black font-semibold py-2.5 rounded-lg text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? 'Loading...' : "Let's Go 💪"}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function WorkoutPage() {
  const [plan, setPlan] = useState(null)
  const [selectedDay, setSelectedDay] = useState(0)
  const [setLogs, setSetLogs] = useState({})
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [analysis, setAnalysis] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [showBriefing, setShowBriefing] = useState(false)
  const [workoutStarted, setWorkoutStarted] = useState(false)

  useEffect(() => {
    api.get('/workouts/plan')
      .then(r => setPlan(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const day = plan?.workout_days?.[selectedDay]

  const updateSet = (exIdx, setIdx, field, value) => {
    const key = `${exIdx}-${setIdx}`
    setSetLogs(prev => ({ ...prev, [key]: { ...prev[key], [field]: value } }))
  }

  const handleLogWorkout = async () => {
    if (!day) return
    const exercises = day.exercises.map((ex, exIdx) => ({
      exercise_name: ex.name,
      muscle_group: ex.muscle_group,
      sets: Array.from({ length: ex.sets }, (_, setIdx) => {
        const log = setLogs[`${exIdx}-${setIdx}`] || {}
        return {
          set_number: setIdx + 1,
          weight_kg: parseFloat(log.weight) || ex.weight_kg || 0,
          reps_completed: parseInt(log.reps) || parseInt(ex.reps?.split('-')[0]) || 0,
        }
      })
    }))

    try {
      await api.post('/workouts/log', {
        workout_day_name: day.day_name,
        exercises
      })
      setSaved(true)
      setAnalyzing(true)
      const res = await api.get('/overload/latest')
      setAnalysis(res.data)
      setAnalyzing(false)
    } catch {
      alert('Failed to log workout')
      setAnalyzing(false)
    }
  }

  if (loading) return <div className="p-6 text-neff-muted">Loading...</div>
  if (!plan) return (
    <div className="p-6 text-center">
      <p className="text-neff-muted mb-4">No workout plan found.</p>
    </div>
  )

  return (
    <div className="p-6 max-w-3xl mx-auto">

      {/* Briefing Modal */}
      {showBriefing && day && (
        <BriefingModal
          dayName={day.day_name}
          onClose={() => setShowBriefing(false)}
          onStart={() => {
            setShowBriefing(false)
            setWorkoutStarted(true)
          }}
        />
      )}

      <h1 className="text-white text-2xl font-bold mb-2">Workout</h1>
      <p className="text-neff-muted mb-6">Select a day and log your sets</p>

      {/* Day Selector */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {plan.workout_days.map((d, i) => (
          <button key={i}
            onClick={() => {
              setSelectedDay(i)
              setAnalysis(null)
              setSaved(false)
              setWorkoutStarted(false)
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
              ${selectedDay === i
                ? 'bg-neff-green text-black'
                : 'bg-neff-card border border-neff-border text-neff-muted hover:text-white'}`}>
            {d.day_name}
          </button>
        ))}
      </div>

      {/* Start Workout Button — shows briefing first */}
      {day && !workoutStarted && !analysis && (
        <div className="neff-card text-center py-8 mb-4">
          <div className="w-12 h-12 rounded-full bg-neff-green/10 border border-neff-green/30 flex items-center justify-center mx-auto mb-4">
            <Zap size={22} className="text-neff-green" />
          </div>
          <h2 className="text-white font-semibold text-lg mb-2">{day.day_name}</h2>
          <p className="text-neff-muted text-sm mb-5">
            {day.exercises.length} exercises · Ready to start?
          </p>
          <button
            onClick={() => setShowBriefing(true)}
            className="bg-neff-green text-black font-semibold px-8 py-3 rounded-lg hover:opacity-90 transition-opacity"
          >
            Get My Briefing →
          </button>
        </div>
      )}

      {/* Exercise List — only after briefing */}
      {day && workoutStarted && !analysis && (
        <div className="space-y-4">
          {day.exercises.map((ex, exIdx) => (
            <div key={exIdx} className="neff-card">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-white font-semibold">{ex.name}</h3>
                  <p className="text-neff-muted text-sm capitalize">
                    {ex.muscle_group} · Rest {ex.rest_seconds}s
                  </p>
                </div>
                <span className="text-neff-green text-sm font-medium">
                  {ex.sets} × {ex.reps}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs text-neff-muted mb-2">
                <span>Set</span><span>Weight (kg)</span><span>Reps</span>
              </div>

              {Array.from({ length: ex.sets }, (_, setIdx) => {
                const log = setLogs[`${exIdx}-${setIdx}`] || {}
                return (
                  <div key={setIdx} className="grid grid-cols-3 gap-2 items-center mb-2">
                    <span className="text-neff-muted text-sm">Set {setIdx + 1}</span>
                    <input className="neff-input text-sm py-2" type="number"
                      placeholder={ex.weight_kg || '0'} value={log.weight || ''}
                      onChange={e => updateSet(exIdx, setIdx, 'weight', e.target.value)} />
                    <input className="neff-input text-sm py-2" type="number"
                      placeholder={ex.reps?.split('-')[0] || '8'} value={log.reps || ''}
                      onChange={e => updateSet(exIdx, setIdx, 'reps', e.target.value)} />
                  </div>
                )
              })}

              {ex.notes && (
                <p className="text-neff-muted text-xs mt-2 italic">💡 {ex.notes}</p>
              )}
            </div>
          ))}

          <button onClick={handleLogWorkout}
            className="bg-neff-green text-black font-semibold w-full flex items-center justify-center gap-2 py-3 rounded-lg hover:opacity-90 transition-opacity">
            {saved ? <><CheckCircle size={18} /> Logged!</> : 'Complete Workout'}
          </button>
        </div>
      )}

      {/* Analyzing */}
      {analyzing && (
        <div className="neff-card text-center py-8">
          <div className="flex justify-center gap-1 mb-3">
            {[0,1,2].map(i => (
              <div key={i} className="w-2 h-2 bg-neff-green rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
          <p className="text-white font-medium">Analyzing your performance...</p>
          <p className="text-neff-muted text-sm mt-1">Calculating next session weights</p>
        </div>
      )}

      {/* Analysis Results */}
      {analysis && (
        <div className="space-y-4">
          <div className="neff-card flex items-center gap-4">
            <div className="bg-neff-green p-3 rounded-lg">
              <ArrowUp size={20} className="text-black" />
            </div>
            <div>
              <p className="text-neff-muted text-sm">Session Rating</p>
              <p className="text-white font-bold text-xl capitalize">{analysis.session_rating}</p>
              <p className="text-neff-muted text-xs">
                {analysis.exercises_to_increase} exercises ready to increase weight
              </p>
            </div>
          </div>

          <h2 className="text-white font-semibold text-lg">Next Session Plan</h2>

          {analysis.recommendations.map((rec, i) => (
            <div key={i} className="neff-card">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-white font-medium">{rec.exercise_name}</h3>
                  <p className="text-neff-muted text-xs capitalize">{rec.muscle_group}</p>
                </div>
                <StatusBadge status={rec.status} />
              </div>

              <div className="grid grid-cols-3 gap-3 mt-3">
                <div className="bg-neff-border rounded-lg p-3 text-center">
                  <p className="text-neff-muted text-xs">Today</p>
                  <p className="text-white font-semibold">{rec.avg_weight_used}kg</p>
                  <p className="text-neff-muted text-xs">{rec.avg_reps_completed} reps avg</p>
                </div>
                <div className="flex items-center justify-center">
                  <span className="text-neff-muted text-xl">→</span>
                </div>
                <div className={`rounded-lg p-3 text-center
                  ${rec.status === 'increase' ? 'bg-neff-green/10 border border-neff-green' : 'bg-neff-border'}`}>
                  <p className="text-neff-muted text-xs">Next Session</p>
                  <p className={`font-semibold ${rec.status === 'increase' ? 'text-neff-green' : 'text-white'}`}>
                    {rec.next_weight_kg}kg
                  </p>
                  <p className="text-neff-muted text-xs">{rec.target_reps} reps</p>
                </div>
              </div>

              <p className="text-neff-muted text-sm mt-3 italic">💡 {rec.recommendation}</p>
            </div>
          ))}

          <button
            onClick={() => { setAnalysis(null); setSaved(false); setSetLogs({}); setWorkoutStarted(false) }}
            className="bg-neff-green text-black font-semibold w-full py-3 rounded-lg hover:opacity-90 transition-opacity">
            Start Another Workout
          </button>
        </div>
      )}
    </div>
  )
}