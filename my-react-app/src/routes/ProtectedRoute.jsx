import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function ProtectedRoute() {
  const { user, profile, loading } = useAuth()

  if (loading) return <div className="full-page-loading">Loading…</div>
  if (!user || !profile) return <Navigate to="/login" replace />

  return <Outlet />
}
