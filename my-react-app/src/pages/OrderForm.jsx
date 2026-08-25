import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { addDoc, collection, doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import { useCompanies } from '../hooks/useCompanies'
import { useOrders } from '../hooks/useOrders'
import { useUsers } from '../hooks/useUsers'
import CompanyPicker from '../components/CompanyPicker'
import { addOneYear, today } from '../lib/dates'

// Wrapper: waits for the existing order to load (edit mode) before mounting the form, so
// the form's local state can be initialized directly from real data on its one mount.
export default function OrderForm() {
  const { id } = useParams()
  const isEditing = Boolean(id)
  const { profile } = useAuth()
  const isAdmin = profile.role === 'admin'
  const { orders, loading: ordersLoading } = useOrders(isAdmin ? undefined : profile.uid)
  const existingOrder = isEditing ? orders.find((order) => order.id === id) : null

  if (isEditing && ordersLoading) return <p>Loading…</p>
  if (isEditing && !existingOrder) return <p>Order not found.</p>

  return <OrderFormFields key={id || 'new'} existingOrder={existingOrder} isAdmin={isAdmin} />
}

function OrderFormFields({ existingOrder, isAdmin }) {
  const isEditing = Boolean(existingOrder)
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { companies } = useCompanies()
  const { users } = useUsers()

  const [company, setCompany] = useState(() => (existingOrder ? { companyId: existingOrder.companyId, newCompany: null } : { companyId: null, newCompany: null }))
  const [userId, setUserId] = useState(() => existingOrder?.userId || (isAdmin ? '' : profile.uid))
  const [status, setStatus] = useState(() => existingOrder?.status || 'pending')
  const [price, setPrice] = useState(() => existingOrder?.price ?? '')
  const [startDate, setStartDate] = useState(() => existingOrder?.startDate || today())
  const [manualEndDate, setManualEndDate] = useState(() => existingOrder?.endDate || '')
  const [endDateTouched, setEndDateTouched] = useState(() => isEditing)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const endDate = endDateTouched ? manualEndDate : addOneYear(startDate)
  const backTo = isAdmin ? '/admin/orders' : '/sales/orders'

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    if (!company.companyId && !company.newCompany) { setError('Choose or create a company.'); return }
    if (isAdmin && !userId) { setError('Choose which user this order belongs to.'); return }
    setSaving(true)
    try {
      let companyId = company.companyId
      if (!companyId && company.newCompany) {
        const companyDoc = await addDoc(collection(db, 'companies'), {
          ...company.newCompany, createdAt: serverTimestamp(), createdBy: profile.uid,
        })
        companyId = companyDoc.id
      }
      const record = { companyId, userId: isAdmin ? userId : profile.uid, status, price: Number(price), startDate, endDate }
      if (isEditing) {
        await updateDoc(doc(db, 'orders', existingOrder.id), { ...record, updatedAt: serverTimestamp() })
      } else {
        await addDoc(collection(db, 'orders'), { ...record, createdAt: serverTimestamp() })
      }
      navigate(backTo)
    } catch (submitError) {
      setError(`Could not save order: ${submitError.message}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="card form-card" aria-labelledby="order-form-title">
      <div className="form-intro">
        <span className="form-kicker">{isEditing ? 'Edit order' : 'New order'}</span>
        <h2 id="order-form-title">{isEditing ? 'Edit order' : 'Add order'}</h2>
      </div>
      {error && <p className="notice error" role="alert">{error}</p>}
      <form onSubmit={handleSubmit}>
        <fieldset className="form-section">
          <legend><span>01</span><div><strong>Company</strong><small>Find an existing company or add a new one.</small></div></legend>
          <CompanyPicker companies={companies} value={company} onChange={setCompany} />
        </fieldset>
        <fieldset className="form-section">
          <legend><span>02</span><div><strong>Order details</strong><small>Status, yearly price and order date.</small></div></legend>
          <div className="field-grid">
            {isAdmin && (
              <label>Sales user
                <select value={userId} onChange={(event) => setUserId(event.target.value)} required>
                  <option value="">Choose a user</option>
                  {users.map((user) => <option key={user.id} value={user.id}>{user.name} ({user.role})</option>)}
                </select>
              </label>
            )}
            <label>Status
              <select value={status} onChange={(event) => setStatus(event.target.value)}>
                <option value="pending">Pending</option>
                <option value="accept">Accept</option>
                <option value="reject">Reject</option>
              </select>
            </label>
            <label>Yearly price <input type="number" min="0" step="0.01" value={price} onChange={(event) => setPrice(event.target.value)} required placeholder="0.00" /></label>
            <label>Start date <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} required /></label>
            <label>End date <input type="date" value={endDate} onChange={(event) => { setManualEndDate(event.target.value); setEndDateTouched(true) }} required /><small>Defaults to one year after the start date — override if needed.</small></label>
          </div>
        </fieldset>
        <div className="form-actions">
          <button type="button" className="secondary" onClick={() => navigate(backTo)}>Cancel</button>
          <button type="submit" className="primary" disabled={saving}>{saving ? 'Saving…' : isEditing ? 'Save changes' : 'Save order'}</button>
        </div>
      </form>
    </section>
  )
}
