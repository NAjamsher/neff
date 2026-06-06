import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import useAuthStore from '../../store/authStore'
import { LayoutDashboard, Dumbbell, MessageCircle, LogOut, Zap, TrendingUp } from 'lucide-react'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/workout',   icon: Dumbbell,        label: 'Workout' },
  { to: '/progress',  icon: TrendingUp,      label: 'Progress' },
  { to: '/coach',     icon: MessageCircle,   label: 'AI Coach' },
]

export default function AppLayout() {
  const { logout, user } = useAuthStore()
  const navigate = useNavigate()

  return (
    <div className="flex h-screen bg-neff-dark overflow-hidden">
      <aside className="w-56 flex flex-col bg-neff-card border-r border-neff-border">
        <div className="p-6 border-b border-neff-border">
          <div className="flex items-center gap-2">
            <Zap className="text-neff-green" size={22} />
            <div>
              <h1 className="text-white font-bold text-lg">NEFF</h1>
              <p className="text-neff-muted text-xs">No Excuse For Fitness</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                 ${isActive ? 'bg-neff-green text-black' : 'text-neff-muted hover:text-white hover:bg-neff-border'}`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-neff-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-neff-green flex items-center justify-center">
              <span className="text-black font-bold text-sm">
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </span>
            </div>
            <p className="text-white text-sm font-medium">{user?.name}</p>
          </div>
          <button
            onClick={() => { logout(); navigate('/login') }}
            className="flex items-center gap-2 text-neff-muted hover:text-white text-sm w-full px-3 py-2 rounded-lg hover:bg-neff-border transition-colors"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}