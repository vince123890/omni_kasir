import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react'
import { getAccessToken, clearTokens } from '../api/client'
import type { AuthUser } from '../api/types'

interface AuthContextType {
  user: AuthUser | null
  setUser: (user: AuthUser | null) => void
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  setUser: () => {},
  logout: () => {},
  isAuthenticated: false,
})

const USER_KEY = 'omni_user'

function loadUser(): AuthUser | null {
  const token = getAccessToken()
  if (!token) { localStorage.removeItem(USER_KEY); return null }
  try {
    const stored = localStorage.getItem(USER_KEY)
    return stored ? (JSON.parse(stored) as AuthUser) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<AuthUser | null>(() => loadUser())
  // Track whether we've already fetched /auth/me for this session
  const fetchedForId = useRef<number | null>(null)

  const setUser = (u: AuthUser | null) => {
    setUserState(u)
    if (u) localStorage.setItem(USER_KEY, JSON.stringify(u))
    else { localStorage.removeItem(USER_KEY); fetchedForId.current = null }
  }

  // Fetch /auth/me once per user id to enrich with tenantName/storeName
  useEffect(() => {
    if (!user) return
    if (fetchedForId.current === user.id) return  // already fetched for this user
    // Mark as fetched immediately to prevent double fetch
    fetchedForId.current = user.id
    // Only enrich if 'tenantName' key is not yet in the stored object
    if ('tenantName' in user) return
    import('../api').then(({ authApi }) =>
      authApi.me().then(profile => {
        setUserState(prev => {
          if (!prev || prev.id !== profile.id) return prev
          const merged = { ...prev, ...profile }
          localStorage.setItem(USER_KEY, JSON.stringify(merged))
          return merged
        })
      }).catch(() => {})
    )
  }, [user?.id])

  const logout = () => {
    clearTokens()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, setUser, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
