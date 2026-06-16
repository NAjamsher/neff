import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import useAuthStore from './store/authStore'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import OnboardingPage from './pages/OnboardingPage'
import DashboardPage from './pages/DashboardPage'
import WorkoutPage from './pages/WorkoutPage'
import CoachPage from './pages/CoachPage'
import AppLayout from './components/layout/AppLayout'
import ProgressPage from './pages/ProgressPage'
import RecoveryPage from './pages/RecoveryPage'
import WeeklyReviewPage from './pages/WeeklyReviewPage'
import NutritionPage from './pages/NutritionPage'

function PrivateRoute({ children }) {
  const token = useAuthStore((s) => s.token)
  return token ? children : <Navigate to="/login" replace />
}

function PublicRoute({ children }) {
  const token = useAuthStore((s) => s.token)
  return !token ? children : <Navigate to="/dashboard" replace />
}

export default function App() {
  const { token, fetchProfile } = useAuthStore()

  useEffect(() => {
    if (token) fetchProfile()
  }, [token])

  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

        {/* Onboarding */}
        <Route path="/onboarding" element={<PrivateRoute><OnboardingPage /></PrivateRoute>} />

        {/* App */}
        <Route path="/" element={<PrivateRoute><AppLayout /></PrivateRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="workout" element={<WorkoutPage />} />
          <Route path="progress" element={<ProgressPage />} />
          <Route path="recovery" element={<RecoveryPage />} />
          <Route path="nutrition" element={<NutritionPage />} />
          <Route path="weekly-review" element={<WeeklyReviewPage />} />
          <Route path="coach" element={<CoachPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}