import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Flame, Dumbbell, Target, TrendingUp } from 'lucide-react'
import useAuthStore from '../store/authStore'
import api from '../services/api'

// Animated number that counts up from 0 to value
function AnimatedNumber({ value, suffix = '' }) {
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    const numericValue = parseFloat(value) || 0
    if (numericValue === 0) {
      setDisplay(0)
      return
    }
    let current = 0
    const step = numericValue / 30
    const interval = setInterval(() => {
      current += step
      if (current >= numericValue) {
        current = numericValue
        clearInterval(interval)
      }
      setDisplay(current)
    }, 25)
    return () => clearInterval(interval)
  }, [value])

  const isInt = Number.isInteger(parseFloat(value))
  return <>{isInt ? Math.round(display) : display.toFixed(1)}{suffix}</>
}

function StatCard({ icon: Icon, label, value, sub, color = 'text-neff-green', delay = 0 }) {
  return (
    <div
      className="neff-card flex items-center gap-4 transition-all duration-300 hover:-translate-y-1 hover:border-neff-green/40 hover:shadow-lg hover:shadow-neff-green/5 animate-fade-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={`${color} bg-neff-border p-3 rounded-lg transition-transform duration-300 group-hover:scale-110`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-neff-muted text-xs">{label}</p>
        <p className="text-white font-bold text-xl">
          <AnimatedNumber value={value} />
        </p>
        {sub && <p className="text-neff-muted text-xs">{sub}</p>}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [plan, setPlan] = useState(null)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [planRes, statsRes] = await Promise.all([
          api.get('/workouts/plan').catch(() => null),
          api.get('/workouts/stats').catch(() => null),
        ])
        if (planRes) setPlan(planRes.data)
        if (statsRes) setStats(statsRes.data)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const profile = user?.profile
  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good Morning'
    if (h < 18) return 'Good Afternoon'
    return 'Good Evening'
  }

  const todayWorkout = plan?.workout_days?.[0]

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8 animate-fade-up">
        <h1 className="text-white text-2xl font-bold">
          {greeting()}, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-neff-muted mt-1">Let's crush your goals today.</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Flame} label="Training Streak" value={stats?.workouts_this_week || 0} sub="This week" color="text-orange-400" delay={0} />
        <StatCard icon={Dumbbell} label="Total Workouts" value={stats?.total_workouts || 0} sub="All time" delay={60} />
        <StatCard icon={Target} label="Goal Calories" value={profile?.goal_calories || 0} sub="kcal / day" color="text-blue-400" delay={120} />
        <StatCard icon={TrendingUp} label="Protein Target" value={profile?.protein_target_g || 0} suffix="g" sub="per day" color="text-purple-400" delay={180} />
      </div>

      {/* Today's Workout */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="neff-card transition-all duration-300 hover:border-neff-green/30 animate-fade-up" style={{ animationDelay: '240ms' }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-neff-muted text-sm">Today's Workout</p>
              <h2 className="text-white font-semibold text-lg">
                {loading ? 'Loading...' : todayWorkout?.day_name || 'Rest Day'}
              </h2>
            </div>
            <button
              onClick={() => navigate('/workout')}
              className="neff-btn-primary text-sm transition-transform duration-200 hover:scale-105"
            >
              Start Workout
            </button>
          </div>

          {todayWorkout?.exercises?.length > 0 && (
            <div className="space-y-2">
              {todayWorkout.exercises.slice(0, 5).map((ex, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-2 border-b border-neff-border last:border-0 transition-colors duration-200 hover:bg-neff-border/30 rounded-lg px-2 -mx-2 animate-fade-up"
                  style={{ animationDelay: `${300 + i * 40}ms` }}
                >
                  <div>
                    <p className="text-white text-sm font-medium">{ex.name}</p>
                    <p className="text-neff-muted text-xs capitalize">{ex.muscle_group}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-neff-green text-sm font-medium">{ex.sets} × {ex.reps}</p>
                    {ex.weight_kg && <p className="text-neff-muted text-xs">{ex.weight_kg}kg</p>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && !plan && (
            <div className="text-center py-6">
           
              <p className="text-neff-muted text-sm mb-3">No workout plan found</p>
              <button onClick={() => navigate('/onboarding')} className="neff-btn-primary text-sm">
                Generate Plan
              </button>
            </div>
          )}
        </div>

        {/* Profile Summary */}
        <div className="neff-card transition-all duration-300 hover:border-neff-green/30 animate-fade-up" style={{ animationDelay: '300ms' }}>
          <h2 className="text-white font-semibold mb-4">Your Profile</h2>
          {profile ? (
            <div className="space-y-3">
              {[
                ['Goal', profile.goal?.replace(/_/g, ' ')],
                ['Experience', profile.experience_level],
                ['Equipment', profile.equipment?.replace(/_/g, ' ')],
                ['Training Days', `${profile.training_days_per_week} days / week`],
                ['BMI', profile.bmi],
                ['Maintenance Calories', `${profile.maintenance_calories} kcal`],
              ].map(([label, value], i) => (
                <div
                  key={label}
                  className="flex justify-between items-center py-1.5 border-b border-neff-border last:border-0 transition-colors duration-200 hover:bg-neff-border/30 rounded-lg px-2 -mx-2 animate-fade-up"
                  style={{ animationDelay: `${360 + i * 30}ms` }}
                >
                  <span className="text-neff-muted text-sm capitalize">{label}</span>
                  <span className="text-white text-sm font-medium capitalize">{value}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
    
              <p className="text-neff-muted text-sm">Complete onboarding to see your profile.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}