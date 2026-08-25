import { useMemo, useState } from 'react'

function emptyCompanyDraft() {
  return {
    companyName: '', companyNumber: '', ownerName: '', ownerNumber: '', city: '', address: '', socialMediaLink: '', type: 'online menu',
  }
}

// Lets the caller either reuse an existing company (searched by name/number) or fill in
// a brand-new one inline. Reports back { companyId, newCompany } — exactly one is set.
export default function CompanyPicker({ companies, value, onChange }) {
  const [search, setSearch] = useState('')
  const [creatingNew, setCreatingNew] = useState(false)

  const selectedCompany = companies.find((company) => company.id === value.companyId) || null

  const matches = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return []
    return companies.filter((company) => `${company.companyName} ${company.companyNumber}`.toLowerCase().includes(term)).slice(0, 8)
  }, [companies, search])

  function selectExisting(company) {
    onChange({ companyId: company.id, newCompany: null })
    setSearch('')
    setCreatingNew(false)
  }

  function startNewCompany() {
    onChange({ companyId: null, newCompany: emptyCompanyDraft() })
    setCreatingNew(true)
    setSearch('')
  }

  function clearSelection() {
    onChange({ companyId: null, newCompany: null })
    setCreatingNew(false)
  }

  function updateDraftField(event) {
    const { name, value: fieldValue } = event.target
    onChange({ companyId: null, newCompany: { ...value.newCompany, [name]: fieldValue } })
  }

  if (selectedCompany) {
    return (
      <div className="company-picker">
        <div className="company-picker-selected">
          <div><strong>{selectedCompany.companyName}</strong><small>{selectedCompany.ownerName} · {selectedCompany.city} · {selectedCompany.type}</small></div>
          <button type="button" className="secondary" onClick={clearSelection}>Change</button>
        </div>
      </div>
    )
  }

  if (creatingNew) {
    const draft = value.newCompany || emptyCompanyDraft()
    return (
      <div className="company-picker">
        <div className="company-picker-heading"><strong>New company</strong><button type="button" className="clear-filters" onClick={clearSelection}>Cancel</button></div>
        <div className="field-grid">
          <label>Company name <input name="companyName" value={draft.companyName} onChange={updateDraftField} placeholder="Enter company name" /></label>
          <label>Type <select name="type" value={draft.type} onChange={updateDraftField} required>
            <option value="online menu">Online menu</option>
            <option value="online shop">Online shop</option>
          </select></label>
          <label>Company number <input name="companyNumber" value={draft.companyNumber} onChange={updateDraftField} placeholder="Company phone number" /></label>
          <label>Owner name <input name="ownerName" value={draft.ownerName} onChange={updateDraftField} placeholder="Enter owner name" /></label>
          <label>Owner number <input name="ownerNumber" value={draft.ownerNumber} onChange={updateDraftField} placeholder="Owner phone number" /></label>
          <label>City <input name="city" value={draft.city} onChange={updateDraftField} placeholder="Enter city" /></label>
          <label className="full-width">Address <input name="address" value={draft.address} onChange={updateDraftField} placeholder="Building, street, and area" /></label>
          <label className="full-width">Social media link <span className="optional">(optional)</span><input name="socialMediaLink" type="url" value={draft.socialMediaLink} onChange={updateDraftField} placeholder="https://..." /></label>
        </div>
      </div>
    )
  }

  return (
    <div className="company-picker">
      <label className="search-field full-width">
        Search company
        <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by company name or number..." />
      </label>
      {search.trim() && (
        <div className="company-picker-results">
          {matches.length === 0 && <p className="empty-state">No matches. You can create a new company below.</p>}
          {matches.map((company) => (
            <button type="button" key={company.id} className="company-picker-result" onClick={() => selectExisting(company)}>
              <strong>{company.companyName}</strong><small>{company.ownerName} · {company.city}</small>
            </button>
          ))}
        </div>
      )}
      <button type="button" className="secondary" onClick={startNewCompany}>+ Create new company</button>
    </div>
  )
}
