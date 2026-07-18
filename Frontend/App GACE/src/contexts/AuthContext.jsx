import { createContext, useContext, useState, useEffect } from 'react'
import api from '../api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user')
    return stored ? JSON.parse(stored) : null
  })
  const [loading, setLoading] = useState(false)

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data.user))
    setUser(data.user)
    return data.user
  }

  const register = async (userData) => {
    const { data } = await api.post('/auth/register', userData)
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data.user))
    setUser(data.user)
    return data.user
  }

  const logout = async () => {
    try {
      await api.post('/auth/logout')
    } finally {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      setUser(null)
    }
  }

  const refreshUser = async () => {
    const { data } = await api.get('/auth/me')
    localStorage.setItem('user', JSON.stringify(data.user))
    setUser(data.user)
  }

  /**
   * Check if the current user has a given permission.
   * Mirrors the backend's Spatie permission names exactly
   * (e.g. 'voir-utilisateurs', 'creer-entreprises').
   */
  const can = (permission) => {
    if (!user || !Array.isArray(user.permissions)) return false
    return user.permissions.includes(permission)
  }

  /**
   * Check if the current user has a given role.
   * Prefer `can()` for access control — roles can change composition later.
   */
  const hasRole = (role) => user?.role === role

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser, can, hasRole }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}