import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../firebase'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
  const { user, profile, loading, authError, clearAuthError } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!loading && user && profile) {
      navigate(profile.role === 'admin' ? '/admin' : '/sales', { replace: true })
    }
  }, [loading, user, profile, navigate])

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    clearAuthError()
    setSubmitting(true)
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password)
    } catch {
      setError('Invalid email or password.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="login-shell">
      <section className="card login-card" aria-labelledby="login-title">
        <div className="login-brand"><img src="/favicon.svg" alt="" width="30" height="30" /><span>Companies</span></div>
        <p className="eyebrow">Company management</p>
        <h1 id="login-title">Sign in</h1>
        {(error || authError) && <p className="notice error" role="alert">{error || authError}</p>}
        <form onSubmit={handleSubmit}>
          <label>Email <input type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} autoFocus placeholder="you@example.com" /></label>
          <label>Password <input type="password" required autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" /></label>
          <button type="submit" className="primary" disabled={submitting}>{submitting ? 'Signing in…' : 'Sign in'}</button>
        </form>
      </section>
    </main>
  )
}
