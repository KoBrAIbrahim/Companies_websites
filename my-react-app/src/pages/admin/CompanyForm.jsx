import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { addDoc, collection, doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { db } from '../../firebase'
import { useCompanies } from '../../hooks/useCompanies'
import { useAuth } from '../../contexts/AuthContext'

const emptyForm = { companyName: '', companyNumber: '', ownerName: '', ownerNumber: '', city: '', address: '', socialMediaLink: '', type: 'online menu' }

export default function CompanyForm() {
  const { id } = useParams()
  const isEditing = Boolean(id)
  const { companies, loading } = useCompanies()
  const existingCompany = isEditing ? companies.find((company) => company.id === id) : null

  if (isEditing && loading) return <p>Loading…</p>
  if (isEditing && !existingCompany) return <p>Company not found.</p>

  return <CompanyFormFields key={id || 'new'} existingCompany={existingCompany} />
}

function CompanyFormFields({ existingCompany }) {
  const isEditing = Boolean(existingCompany)
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [form, setForm] = useState(() => ({ ...emptyForm, ...existingCompany }))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function updateField(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSaving(true)
    try {
      const record = {
        companyName: form.companyName.trim(), companyNumber: form.companyNumber.trim(),
        ownerName: form.ownerName.trim(), ownerNumber: form.ownerNumber.trim(),
        city: form.city.trim(), address: form.address.trim(), socialMediaLink: form.socialMediaLink.trim(),
        type: form.type,
      }
      if (isEditing) {
        await updateDoc(doc(db, 'companies', existingCompany.id), record)
      } else {
        await addDoc(collection(db, 'companies'), { ...record, createdAt: serverTimestamp(), createdBy: profile.uid })
      }
      navigate('/admin/companies')
    } catch (submitError) {
      setError(`Could not save company: ${submitError.message}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="card form-card" aria-labelledby="company-form-title">
      <div className="form-intro">
        <span className="form-kicker">{isEditing ? 'Edit company' : 'New company'}</span>
        <h2 id="company-form-title">{isEditing ? 'Edit company' : 'Add company'}</h2>
      </div>
      {error && <p className="notice error" role="alert">{error}</p>}
      <form onSubmit={handleSubmit}>
        <div className="field-grid">
          <label>Company name <input name="companyName" value={form.companyName} onChange={updateField} required placeholder="Enter company name" /></label>
          <label>Type <select name="type" value={form.type} onChange={updateField} required>
            <option value="online menu">Online menu</option>
            <option value="online shop">Online shop</option>
          </select></label>
          <label>Company number <input name="companyNumber" value={form.companyNumber} onChange={updateField} placeholder="Company phone number" /></label>
          <label>Owner name <input name="ownerName" value={form.ownerName} onChange={updateField} placeholder="Enter owner name" /></label>
          <label>Owner number <input name="ownerNumber" value={form.ownerNumber} onChange={updateField} placeholder="Owner phone number" /></label>
          <label>City <input name="city" value={form.city} onChange={updateField} placeholder="Enter city" /></label>
          <label className="full-width">Address <input name="address" value={form.address} onChange={updateField} placeholder="Building, street, and area" /></label>
          <label className="full-width">Social media link <span className="optional">(optional)</span><input name="socialMediaLink" type="url" value={form.socialMediaLink} onChange={updateField} placeholder="https://..." /></label>
        </div>
        <div className="form-actions">
          <button type="button" className="secondary" onClick={() => navigate('/admin/companies')}>Cancel</button>
          <button type="submit" className="primary" disabled={saving}>{saving ? 'Saving…' : isEditing ? 'Save changes' : 'Save company'}</button>
        </div>
      </form>
    </section>
  )
}
