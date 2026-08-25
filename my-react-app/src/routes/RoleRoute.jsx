import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function RoleRoute({ allow }) {
  const { profile } = useAuth()

  if (!allow.includes(profile.role)) {
    return <Navigate to={profile.role === 'admin' ? '/admin' : '/sales'} replace />
  }

  return <Outlet />
}
