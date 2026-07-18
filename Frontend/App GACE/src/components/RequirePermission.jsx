import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

/**
 * Guards a route (or group of nested routes) behind a specific permission.
 * Must be used INSIDE <ProtectedRoute> (assumes the user is already logged in).
 *
 * Usage:
 *   <Route element={<RequirePermission permission="voir-utilisateurs" />}>
 *     <Route path="users" element={<Users />} />
 *   </Route>
 */
export default function RequirePermission({ permission }) {
  const { can } = useAuth()

  if (!can(permission)) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
