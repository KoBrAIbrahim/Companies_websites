import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { doc, updateDoc } from 'firebase/firestore'
import { sendPasswordResetEmail } from 'firebase/auth'
import { auth, db } from '../../firebase'
import { useUsers } from '../../hooks/useUsers'
import { useAuth } from '../../contexts/AuthContext'
import { createUserAsAdmin } from '../../lib/createUser'

const emptyForm = { email: '', password: '', name: '', phone: '', city: '', role: 'sales', percentage: '', share: '' }

function buildForm(existingUser) {
  if (!existingUser) return emptyForm
  return { ...emptyForm, ...existingUser, password: '', percentage: existingUser.percentage ?? '', share: existingUser.share ?? '' }
}

// Wrapper: waits for the existing user to load (edit mode) before mounting the form, so
// the form's local state can be initialized directly from real data on its one mount —
// no effect needed to sync it in later.
export default function UserForm() {
  const { id } = useParams()
  const isEditing = Boolean(id)
  const { users, loading } = useUsers()
  const existingUser = isEditing ? users.find((user) => user.id === id) : null

  if (isEditing && loading) return <p>Loading…</p>
  if (isEditing && !existingUser) return <p>User not found.</p>

  return <UserFormFields key={id || 'new'} existingUser={existingUser} />
}

function UserFormFields({ existingUser }) {
  const isEditing = Boolean(existingUser)
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [form, setForm] = useState(() => buildForm(existingUser))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  function updateField(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setMessage('')
    setSaving(true)
    try {
      if (isEditing) {
        await updateDoc(doc(db, 'users', existingUser.id), {
          name: form.name.trim(),
          phone: form.phone.trim(),
          city: form.city.trim(),
          role: form.role,
          percentage: form.role === 'sales' ? Number(form.percentage) || 0 : null,
          share: form.role === 'sales' ? form.share.trim() : null,
        })
        setMessage('User updated successfully.')
      } else {
        await createUserAsAdmin({
          email: form.email.trim(), password: form.password, name: form.name.trim(), phone: form.phone.trim(),
          city: form.city.trim(), role: form.role, percentage: form.percentage, share: form.share.trim(),
          currentAdminUid: profile.uid,
        })
        navigate('/admin/users')
        return
      }
    } catch (submitError) {
      setError(`Could not save user: ${submitError.message}`)
    } finally {
      setSaving(false)
    }
  }

  async function handleResetPassword() {
    setError('')
    setMessage('')
    try {
      await sendPasswordResetEmail(auth, existingUser.email)
      setMessage(`Password reset email sent to ${existingUser.email}.`)
    } catch (resetError) {
      setError(`Could not send reset email: ${resetError.message}`)
    }
  }

  return (
    <section className="card form-card" aria-labelledby="user-form-title">
      <div className="form-intro">
        <span className="form-kicker">{isEditing ? 'Edit user' : 'New user'}</span>
        <h2 id="user-form-title">{isEditing ? 'Edit user' : 'Add user'}</h2>
      </div>
      {error && <p className="notice error" role="alert">{error}</p>}
      {message && <p className="notice success" role="status">{message}</p>}
      <form onSubmit={handleSubmit}>
        <div className="field-grid">
          <label>Name <input name="name" value={form.name} onChange={updateField} required placeholder="Full name" /></label>
          <label>Role
            <select name="role" value={form.role} onChange={updateField}>
              <option value="sales">Sales</option>
              <option value="admin">Admin</option>
            </select>
          </label>
          <label>Email <input name="email" type="email" value={form.email} onChange={updateField} required disabled={isEditing} placeholder="you@example.com" /></label>
          {!isEditing && <label>Password <input name="password" type="password" value={form.password} onChange={updateField} required minLength={6} placeholder="At least 6 characters" /></label>}
          <label>Phone number <input name="phone" type="tel" value={form.phone} onChange={updateField} placeholder="+1 555 000 0000" /></label>
          <label>City <input name="city" value={form.city} onChange={updateField} placeholder="Enter city" /></label>
          {form.role === 'sales' && <label>Percentage of sales <input name="percentage" type="number" min="0" max="100" step="0.1" value={form.percentage} onChange={updateField} placeholder="e.g. 10" /></label>}
          {form.role === 'sales' && <label>Share <input name="share" value={form.share} onChange={updateField} placeholder="Optional label" /></label>}
        </div>
        <div className="form-actions">
          <button type="button" className="secondary" onClick={() => navigate('/admin/users')}>Cancel</button>
          {isEditing && <button type="button" className="secondary" onClick={handleResetPassword}>Send password reset</button>}
          <button type="submit" className="primary" disabled={saving}>{saving ? 'Saving…' : isEditing ? 'Save changes' : 'Create user'}</button>
        </div>
      </form>
    </section>
  )
}
