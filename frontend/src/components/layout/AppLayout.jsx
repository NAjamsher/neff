import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import useAuthStore from '../../store/authStore'
import { 
  LayoutDashboard, 
  Dumbbell, 
  MessageCircle, 
  LogOut, 
  Zap, 
  TrendingUp, 
  Heart, 
  Sparkles, 
  Apple, 
  Menu, 
  X 
} from 'lucide-react'

const navItems = [
  { to: '/dashboard',     icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/workout',       icon: Dumbbell,        label: 'Workout' },
  { to: '/progress',      icon: TrendingUp,      label: 'Progress' },
  { to: '/recovery',      icon: Heart,           label: 'Recovery' },
  { to: '/nutrition',     icon: Apple,           label: 'Nutrition' },
  { to: '/weekly-review', icon: Sparkles,        label: 'Weekly Review' },
  { to: '/coach',         icon: MessageCircle,   label: 'AI Coach' },
]

export default function AppLayout() {
  const { logout, user } = useAuthStore()
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-neff-dark overflow-hidden relative">
      
      {/* 📱 MOBILE TOP NAVIGATION BAR */}
      <div className="flex md:hidden items-center justify-between w-full h-16 bg-neff-card px-4 border-b border-neff-border absolute top-0 left-0 z-30">
        <div className="flex items-center gap-2">
          <Zap className="text-neff-green" size={22} />
          <h1 className="text-white font-bold text-lg">NEFF</h1>
        </div>
        <button 
          onClick={() => setIsOpen(!isOpen)} 
          className="text-white p-1 hover:bg-neff-border rounded-lg transition-colors"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* 🌫️ MOBILE SIDEBAR BACKDROP DRAWER OVERLAY */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* 🗂️ RESPONSIVE SIDEBAR NAVIGATION */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-56 flex flex-col bg-neff-card border-r border-neff-border transform transition-transform duration-300 ease-in-out
        md:relative md:transform-none md:z-20
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Brand Header */}
        <div className="p-6 border-b border-neff-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="text-neff-green" size={22} />
            <div>
              <h1 className="text-white font-bold text-lg">NEFF</h1>
              <p className="text-neff-muted text-xs">No Excuse For Fitness</p>
            </div>
          </div>
          {/* Close icon inside menu visible only on mobile */}
          <button onClick={() => setIsOpen(false)} className="md:hidden text-neff-muted hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Navigation Elements */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setIsOpen(false)}
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

        {/* User Footer Context */}
        <div className="p-4 border-t border-neff-border bg-neff-card">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-neff-green flex items-center justify-center shrink-0">
              <span className="text-black font-bold text-sm">
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </span>
            </div>
            <p className="text-white text-sm font-medium truncate flex-1">{user?.name}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-neff-muted hover:text-white text-sm w-full px-3 py-2 rounded-lg hover:bg-neff-border transition-colors"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      {/* 🏋️‍♂️ MAIN SCREEN CONTENT CONTAINER */}
      <main className="flex-1 overflow-y-auto pt-16 md:pt-0 w-full min-w-0">
        <div className="p-4 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}