import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { doc, onSnapshot } from 'firebase/firestore'
import { auth, db } from '../firebase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [authError, setAuthError] = useState('')

  useEffect(() => onAuthStateChanged(auth, (user) => {
    setFirebaseUser(user)
    setAuthLoading(false)
    if (!user) setProfile(null)
  }), [])

  useEffect(() => {
    if (!firebaseUser) return undefined
    return onSnapshot(doc(db, 'users', firebaseUser.uid), (snapshot) => {
      const data = snapshot.data()
      if (!data || data.active === false) {
        setAuthError(data ? 'This account has been disabled. Contact an administrator.' : 'Account profile not found. Contact an administrator.')
        setProfile(null)
        signOut(auth)
        return
      }
      setProfile({ uid: firebaseUser.uid, ...data })
    }, () => setProfile(null))
  }, [firebaseUser])

  async function logout() {
    await signOut(auth)
  }

  const value = {
    user: firebaseUser,
    profile,
    loading: authLoading || (Boolean(firebaseUser) && !profile),
    authError,
    clearAuthError: () => setAuthError(''),
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components -- small context module, hook pairs with its provider
export function useAuth() {
  return useContext(AuthContext)
}
