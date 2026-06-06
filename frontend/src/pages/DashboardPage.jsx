import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Flame, Dumbbell, Target, TrendingUp } from 'lucide-react'
import useAuthStore from '../store/authStore'
import api from '../services/api'

function StatCard({ icon: Icon, label, value, sub, color = 'text-neff-green' }) {
  return (
    <div className="neff-card flex items-center gap-4">
      <div className={`${color} bg-neff-border p-3 rounded-lg`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-neff-muted text-xs">{label}</p>
        <p className="text-white font-bold text-xl">{value}</p>
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

  useEffect(() => {
    api.get('/workouts/plan').then(r => setPlan(r.data)).catch(() => {})
    api.get('/workouts/stats').then(r => setStats(r.data)).catch(() => {})
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
      <div className="mb-8">
        <h1 className="text-white text-2xl font-bold">
          {greeting()}, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-neff-muted mt-1">Let's crush your goals today.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Flame} label="This Week" value={stats?.workouts_this_week || 0} sub="workouts" color="text-orange-400" />
        <StatCard icon={Dumbbell} label="Total Workouts" value={stats?.total_workouts || 0} sub="all time" />
        <StatCard icon={Target} label="Goal Calories" value={profile?.goal_calories || '—'} sub="kcal / day" color="text-blue-400" />
        <StatCard icon={TrendingUp} label="Protein Target" value={profile ? `${profile.protein_target_g}g` : '—'} sub="per day" color="text-purple-400" />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="neff-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-neff-muted text-sm">Today's Workout</p>
              <h2 className="text-white font-semibold text-lg">
                {todayWorkout?.day_name || 'No plan yet'}
              </h2>
            </div>
            <button onClick={() => navigate('/workout')} className="neff-btn text-sm">
              Start
            </button>
          </div>

          {todayWorkout?.exercises?.slice(0, 5).map((ex, i) => (
            <div key={i} className="flex justify-between py-2 border-b border-neff-border last:border-0">
              <div>
                <p className="text-white text-sm font-medium">{ex.name}</p>
                <p className="text-neff-muted text-xs capitalize">{ex.muscle_group}</p>
              </div>
              <div className="text-right">
                <p className="text-neff-green text-sm">{ex.sets} × {ex.reps}</p>
                {ex.weight_kg && <p className="text-neff-muted text-xs">{ex.weight_kg}kg</p>}
              </div>
            </div>
          ))}

          {!plan && (
            <div className="text-center py-4">
              <p className="text-neff-muted text-sm mb-3">No workout plan found</p>
              <button onClick={() => navigate('/onboarding')} className="neff-btn text-sm">
                Generate Plan
              </button>
            </div>
          )}
        </div>

        <div className="neff-card">
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
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between py-1.5 border-b border-neff-border last:border-0">
                  <span className="text-neff-muted text-sm">{label}</span>
                  <span className="text-white text-sm font-medium capitalize">{value}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-neff-muted text-sm">Complete onboarding to see your profile.</p>
          )}
        </div>
      </div>
    </div>
  )
}