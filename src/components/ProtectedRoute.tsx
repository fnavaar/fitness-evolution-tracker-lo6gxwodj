import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

/**
 * Wraps protected routes. Redirects unauthenticated users to /login
 * and shows a loader while the auth state is being resolved.
 * Must be rendered inside an AuthProvider.
 */
export default function ProtectedRoute() {
  const { user, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0B0B10] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 rounded-full border-4 border-[#A3E635] border-t-transparent animate-spin" />
          <p className="text-slate-400 text-sm font-medium animate-pulse">
            Carregando EvolutFit...
          </p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}
