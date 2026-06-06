import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import { TrendingUp, Dumbbell, Calendar, Award } from 'lucide-react'
import api from '../services/api'

function StatCard({ icon: Icon, label, value, color = 'text-neff-green' }) {
  return (
    <div className="neff-card flex items-center gap-4">
      <div className={`${color} bg-neff-border p-3 rounded-lg`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-neff-muted text-xs">{label}</p>
        <p className="text-white font-bold text-2xl">{value}</p>
      </div>
    </div>
  )
}

export default function ProgressPage() {
  const [logs, setLogs] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/workouts/logs').catch(() => null),
      api.get('/workouts/stats').catch(() => null),
    ]).then(([logsRes, statsRes]) => {
      if (logsRes) setLogs(logsRes.data.logs)
      if (statsRes) setStats(statsRes.data)
    }).finally(() => setLoading(false))
  }, [])

  // Build weekly chart data from logs
  const chartData = logs.slice(0, 7).reverse().map((log) => ({
    name: log.workout_day_name.split(' ')[0],
    exercises: log.exercises?.length || 0,
    sets: log.exercises?.reduce((acc, ex) => acc + (ex.sets?.length || 0), 0) || 0,
  }))

  // Calculate total sets across all logs
  const totalSets = logs.reduce((acc, log) => {
    return acc + (log.exercises?.reduce((a, ex) => a + (ex.sets?.length || 0), 0) || 0)
  }, 0)

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-white text-2xl font-bold">Progress</h1>
        <p className="text-neff-muted mt-1">Track your consistency and growth</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Dumbbell} label="Total Workouts" value={stats?.total_workouts || 0} />
        <StatCard icon={Calendar} label="This Week" value={stats?.workouts_this_week || 0} color="text-blue-400" />
        <StatCard icon={TrendingUp} label="Total Sets" value={totalSets} color="text-purple-400" />
        <StatCard icon={Award} label="Consistency" 
          value={stats?.total_workouts > 0 ? `${Math.min(100, stats.workouts_this_week * 25)}%` : '0%'} 
          color="text-orange-400" />
      </div>

      {/* Weekly Activity Chart */}
      {chartData.length > 0 && (
        <div className="neff-card mb-6">
          <h2 className="text-white font-semibold mb-4">Recent Activity</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <XAxis dataKey="name" stroke="#888" fontSize={12} />
              <YAxis stroke="#888" fontSize={12} />
              <Tooltip
                contentStyle={{
                  background: '#111',
                  border: '1px solid #1E1E1E',
                  borderRadius: 8
                }}
                labelStyle={{ color: '#fff' }}
                itemStyle={{ color: '#00FF85' }}
              />
              <Bar dataKey="sets" fill="#00FF85" radius={[4, 4, 0, 0]} name="Sets" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Sets Per Workout Line Chart */}
      {chartData.length > 1 && (
        <div className="neff-card mb-6">
          <h2 className="text-white font-semibold mb-4">Volume Trend</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <XAxis dataKey="name" stroke="#888" fontSize={12} />
              <YAxis stroke="#888" fontSize={12} />
              <Tooltip
                contentStyle={{
                  background: '#111',
                  border: '1px solid #1E1E1E',
                  borderRadius: 8
                }}
                labelStyle={{ color: '#fff' }}
                itemStyle={{ color: '#00FF85' }}
              />
              <Line
                type="monotone"
                dataKey="sets"
                stroke="#00FF85"
                strokeWidth={2}
                dot={{ fill: '#00FF85', r: 4 }}
                name="Total Sets"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Workout History */}
      <div className="neff-card">
        <h2 className="text-white font-semibold mb-4">Workout History</h2>
        {loading ? (
          <p className="text-neff-muted text-sm">Loading...</p>
        ) : logs.length === 0 ? (
          <p className="text-neff-muted text-sm">
            No workouts logged yet. Complete your first session!
          </p>
        ) : (
          <div className="space-y-3">
            {logs.map((log, i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b border-neff-border last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-neff-green/10 border border-neff-green/30 flex items-center justify-center">
                    <Dumbbell size={14} className="text-neff-green" />
                  </div>
                  <div>
                    <p className="text-white font-medium">{log.workout_day_name}</p>
                    <p className="text-neff-muted text-xs">
                      {log.exercises?.length || 0} exercises ·{' '}
                      {log.exercises?.reduce((a, ex) => a + (ex.sets?.length || 0), 0) || 0} sets
                    </p>
                  </div>
                </div>
                <p className="text-neff-muted text-xs">
                  {new Date(log.logged_at).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}