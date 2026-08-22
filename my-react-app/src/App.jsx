import { useEffect, useState } from 'react'
import { addDoc, collection, deleteDoc, doc, onSnapshot, serverTimestamp, updateDoc } from 'firebase/firestore'
import { db } from './firebase'
import './App.css'

const today = new Date().toISOString().slice(0, 10)
const initialForm = {
  staffName: '', companyName: '', ownerName: '', dateAdded: today, status: 'pending',
  startDate: '', description: '', city: '', address: '', mobile: '', price: '',
}

function addOneYear(date) {
  if (!date) return ''
  const endDate = new Date(`${date}T12:00:00`)
  endDate.setFullYear(endDate.getFullYear() + 1)
  return endDate.toISOString().slice(0, 10)
}

function App() {
  const [screen, setScreen] = useState('companies')
  const [companies, setCompanies] = useState([])
  const [form, setForm] = useState(initialForm)
  const [selectedCompany, setSelectedCompany] = useState(null)
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [priceMin, setPriceMin] = useState('')
  const [priceMax, setPriceMax] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const endDate = addOneYear(form.startDate)
  const isEditing = screen === 'edit'
  const visibleCompanies = companies.filter((company) => {
    const matchesSearch = Object.values(company).some((value) => String(value ?? '').toLowerCase().includes(search.trim().toLowerCase()))
    const matchesDateFrom = !dateFrom || (company.dateAdded && company.dateAdded >= dateFrom)
    const matchesDateTo = !dateTo || (company.dateAdded && company.dateAdded <= dateTo)
    const companyPrice = Number(company.price)
    const matchesPriceMin = priceMin === '' || (!Number.isNaN(companyPrice) && companyPrice >= Number(priceMin))
    const matchesPriceMax = priceMax === '' || (!Number.isNaN(companyPrice) && companyPrice <= Number(priceMax))
    return matchesSearch && matchesDateFrom && matchesDateTo && matchesPriceMin && matchesPriceMax
  })
  const hasFilters = search || dateFrom || dateTo || priceMin || priceMax

  useEffect(() => onSnapshot(collection(db, 'companies'), (snapshot) => {
    const companyList = snapshot.docs.map((company) => ({ id: company.id, ...company.data() }))
    companyList.sort((first, second) => (first.dateAdded || '').localeCompare(second.dateAdded || ''))
    setCompanies(companyList)
    setLoading(false)
  }, (snapshotError) => {
    setError(`Could not load companies: ${snapshotError.message}`)
    setLoading(false)
  }), [])

  function updateField(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  function openAdd() {
    setForm({ ...initialForm, dateAdded: new Date().toISOString().slice(0, 10) })
    setSelectedCompany(null)
    setScreen('add')
  }

  function openEdit(company) {
    setForm({ ...initialForm, ...company, price: company.price ?? '', dateAdded: company.dateAdded || today })
    setSelectedCompany(company)
    setScreen('edit')
  }

  function clearFilters() {
    setSearch('')
    setDateFrom('')
    setDateTo('')
    setPriceMin('')
    setPriceMax('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setMessage('')
    setSaving(true)
    try {
      const record = {
        staffName: form.staffName.trim(), companyName: form.companyName.trim(), ownerName: form.ownerName.trim(),
        dateAdded: form.dateAdded, status: form.status, startDate: form.startDate,
        endDate, description: form.description.trim(), city: form.city.trim(),
        address: form.address.trim(), mobile: form.mobile.trim(), price: Number(form.price),
      }
      if (isEditing && selectedCompany) {
        await updateDoc(doc(db, 'companies', selectedCompany.id), record)
      } else {
        await addDoc(collection(db, 'companies'), { ...record, createdAt: serverTimestamp() })
      }
      setForm({ ...initialForm, dateAdded: new Date().toISOString().slice(0, 10) })
      setSelectedCompany(null)
      setMessage(isEditing ? 'Company record updated successfully.' : 'Company record saved successfully.')
      setScreen('companies')
    } catch (submitError) {
      setError(`Could not save company: ${submitError.message}`)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(company) {
    if (!window.confirm(`Delete ${company.companyName || company.name}? This cannot be undone.`)) return
    setError('')
    setMessage('')
    setDeletingId(company.id)
    try {
      await deleteDoc(doc(db, 'companies', company.id))
      setMessage(`${company.companyName || company.name} was deleted.`)
    } catch (deleteError) {
      setError(`Could not delete company: ${deleteError.message}`)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <div><p className="eyebrow">Company directory</p><h1>Companies</h1></div>
        <nav className="tabs" aria-label="Company pages">
          <button className={screen === 'companies' ? 'active' : ''} onClick={() => setScreen('companies')} type="button">All companies</button>
          <button className={screen === 'add' || screen === 'edit' ? 'active' : ''} onClick={openAdd} type="button">Add company</button>
        </nav>
      </header>
      {error && <p className="notice error" role="alert">{error}</p>}
      {message && <p className="notice success" role="status">{message}</p>}
      {(screen === 'add' || screen === 'edit') ? (
        <section className="card form-card" aria-labelledby="add-company-title">
          <div className="form-intro"><span className="form-kicker">{isEditing ? 'Edit record' : 'New record'}</span><h2 id="add-company-title">{isEditing ? 'Edit company' : 'Add company'}</h2><p>Enter the company details below. Required fields are marked with an asterisk.</p></div>
          <form onSubmit={handleSubmit}>
            <fieldset className="form-section">
              <legend><span>01</span><div><strong>Staff information</strong><small>Details of the staff member managing this account.</small></div></legend>
              <div className="field-grid single-field"><label>Staff name <span aria-hidden="true">*</span><input name="staffName" value={form.staffName} onChange={updateField} required autoFocus placeholder="Enter staff member name" /></label></div>
            </fieldset>
            <fieldset className="form-section">
              <legend><span>02</span><div><strong>Company information</strong><small>Core business details and agreement information.</small></div></legend>
              <div className="field-grid"><label>Company name <span aria-hidden="true">*</span><input name="companyName" value={form.companyName} onChange={updateField} required placeholder="Enter company name" /></label><label>Company owner <span aria-hidden="true">*</span><input name="ownerName" value={form.ownerName} onChange={updateField} required placeholder="Enter owner name" /></label><label>Date added <span aria-hidden="true">*</span><input name="dateAdded" type="date" value={form.dateAdded} onChange={updateField} required /></label><label>Status <span aria-hidden="true">*</span><select name="status" value={form.status} onChange={updateField}><option value="pending">Pending</option><option value="accept">Accept</option><option value="reject">Reject</option></select></label><label>Start date <span aria-hidden="true">*</span><input name="startDate" type="date" value={form.startDate} onChange={updateField} required /></label><label>End date <span aria-hidden="true">*</span><input type="date" value={endDate} readOnly required aria-describedby="end-date-help" /><small id="end-date-help">Automatically calculated from the start date.</small></label><label>Price <span aria-hidden="true">*</span><input name="price" type="number" min="0" step="0.01" value={form.price} onChange={updateField} placeholder="0.00" required /></label><label className="field-spacer" aria-hidden="true" /></div>
              <div className="field-grid"><label className="full-width">Notes <span className="optional">(optional)</span><textarea name="description" value={form.description} onChange={updateField} rows="4" placeholder="Add any relevant notes or context" /></label></div>
            </fieldset>
            <fieldset className="form-section">
              <legend><span>03</span><div><strong>Company address</strong><small>Primary location and contact information for the company.</small></div></legend>
              <div className="field-grid"><label>City <span aria-hidden="true">*</span><input name="city" value={form.city} onChange={updateField} required placeholder="Enter city" /></label><label>Company mobile <span aria-hidden="true">*</span><input name="mobile" type="tel" value={form.mobile} onChange={updateField} placeholder="+1 555 000 0000" required /></label><label className="full-width">Street address <span aria-hidden="true">*</span><input name="address" value={form.address} onChange={updateField} required placeholder="Building, street, and area" /></label></div>
            </fieldset>
            <div className="form-actions"><button type="button" className="secondary" onClick={() => setScreen('companies')}>Cancel</button><button type="submit" className="primary" disabled={saving}>{saving ? 'Saving…' : isEditing ? 'Save changes' : 'Save company'}</button></div>
          </form>
        </section>
      ) : screen === 'view' && selectedCompany ? (
        <section className="card detail-card" aria-labelledby="company-detail-title">
          <div className="detail-header"><div><span className="form-kicker">Company record</span><h2 id="company-detail-title">{selectedCompany.companyName || selectedCompany.name}</h2><p>Full company record and account details.</p></div><span className={`status ${selectedCompany.status || 'pending'}`}>{selectedCompany.status || 'pending'}</span></div>
          <div className="detail-sections">
            <div className="detail-section"><h3>Staff information</h3><dl><div><dt>Staff name</dt><dd>{selectedCompany.staffName || '—'}</dd></div></dl></div>
            <div className="detail-section"><h3>Company information</h3><dl><div><dt>Company owner</dt><dd>{selectedCompany.ownerName || '—'}</dd></div><div><dt>Date added</dt><dd>{selectedCompany.dateAdded || '—'}</dd></div><div><dt>Start date</dt><dd>{selectedCompany.startDate || '—'}</dd></div><div><dt>End date</dt><dd>{selectedCompany.endDate || '—'}</dd></div><div><dt>Price</dt><dd>{typeof selectedCompany.price === 'number' ? selectedCompany.price.toLocaleString(undefined, { style: 'currency', currency: 'USD' }) : '—'}</dd></div><div className="detail-wide"><dt>Notes</dt><dd>{selectedCompany.description || 'No notes added.'}</dd></div></dl></div>
            <div className="detail-section"><h3>Company address</h3><dl><div><dt>City</dt><dd>{selectedCompany.city || '—'}</dd></div><div><dt>Mobile</dt><dd>{selectedCompany.mobile || '—'}</dd></div><div className="detail-wide"><dt>Street address</dt><dd>{selectedCompany.address || '—'}</dd></div></dl></div>
          </div>
          <div className="form-actions"><button type="button" className="secondary" onClick={() => setScreen('companies')}>Back to companies</button><button type="button" className="primary" onClick={() => openEdit(selectedCompany)}>Edit company</button></div>
        </section>
      ) : (
        <section className="card" aria-labelledby="company-list-title">
          <div className="list-heading"><div><h2 id="company-list-title">All company records</h2><p>Search or filter across all saved company information.</p></div><button className="primary" type="button" onClick={openAdd}>Add company</button></div>
          <div className="list-tools"><label className="search-field"><span className="sr-only">Search companies</span><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search companies, staff, mobile, status..." /></label><p>{loading ? 'Loading records…' : `${visibleCompanies.length} of ${companies.length} records`}</p></div>
          <div className="filter-panel" aria-label="Filter company records"><div className="filter-heading"><strong>Filter records</strong><button type="button" className="clear-filters" onClick={clearFilters} disabled={!hasFilters}>Clear filters</button></div><div className="filter-fields"><label>Date added from<input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} max={dateTo || undefined} /></label><label>Date added to<input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} min={dateFrom || undefined} /></label><label>Minimum price<input type="number" min="0" step="0.01" value={priceMin} onChange={(event) => setPriceMin(event.target.value)} placeholder="0.00" /></label><label>Maximum price<input type="number" min="0" step="0.01" value={priceMax} onChange={(event) => setPriceMax(event.target.value)} placeholder="No limit" /></label></div></div>
          <div className="table-wrap"><table><thead><tr><th>Staff</th><th>Company</th><th>Owner</th><th>Status</th><th>Mobile</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>
            {loading && <tr><td colSpan="6" className="empty-state">Loading companies…</td></tr>}
            {!loading && companies.length === 0 && <tr><td colSpan="6" className="empty-state">No company records yet. Add your first one.</td></tr>}
            {!loading && companies.length > 0 && visibleCompanies.length === 0 && <tr><td colSpan="6" className="empty-state">No records match your search.</td></tr>}
            {visibleCompanies.map((company) => <tr key={company.id}><td data-label="Staff" className="company-name">{company.staffName || '—'}</td><td data-label="Company">{company.companyName || company.name || '—'}</td><td data-label="Owner">{company.ownerName || '—'}</td><td data-label="Status"><span className={`status ${company.status || 'pending'}`}>{company.status || 'pending'}</span></td><td data-label="Mobile">{company.mobile || '—'}</td><td data-label="Actions" className="action-cell"><button type="button" className="view" onClick={() => { setSelectedCompany(company); setScreen('view') }}>View</button><button type="button" className="edit" onClick={() => openEdit(company)}>Edit</button><button type="button" className="delete" onClick={() => handleDelete(company)} disabled={deletingId === company.id}>{deletingId === company.id ? 'Deleting…' : 'Delete'}</button></td></tr>)}
          </tbody></table></div>
        </section>
      )}
    </main>
  )
}

export default App
