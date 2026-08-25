import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { collection, orderBy, query, where } from 'firebase/firestore'
import { db } from '../../firebase'
import { usePaginatedQuery } from '../../hooks/usePaginatedQuery'
import LoadMore from '../../components/LoadMore'

const PAGE_SIZE = 20
// The constant below holds a single private-use codepoint (U+F8FF) that sorts after
// virtually every real string. Appending it to the search term turns a >= comparison into
// a "starts with" range query — the standard Firestore prefix-search trick.
const PREFIX_UPPER_BOUND_SUFFIX = ''

export default function Companies() {
  const [search, setSearch] = useState('')
  const trimmedSearch = search.trim()

  // Firestore can't do the old free-text/multi-field substring search server-side, so a
  // search term switches to a case-sensitive prefix match on companyName instead.
  const baseQuery = useMemo(() => {
    const companiesRef = collection(db, 'companies')
    if (trimmedSearch) {
      return query(
        companiesRef,
        where('companyName', '>=', trimmedSearch),
        where('companyName', '<=', trimmedSearch + PREFIX_UPPER_BOUND_SUFFIX),
        orderBy('companyName'),
      )
    }
    return query(companiesRef, orderBy('companyName'))
  }, [trimmedSearch])

  const { items: companies, loading, error, hasMore, loadMore, loadingMore, totalCount } = usePaginatedQuery(baseQuery, PAGE_SIZE)

  return (
    <section className="card" aria-labelledby="companies-title">
      <div className="list-heading">
        <div><h2 id="companies-title">Companies</h2><p>All company records.</p></div>
        <Link className="primary" to="/admin/companies/new">Add company</Link>
      </div>
      {error && <p className="notice error" role="alert">{error}</p>}
      <div className="list-tools">
        <label className="search-field"><span className="sr-only">Search companies</span><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by company name..." /></label>
        <p>{loading ? 'Loading…' : `${companies.length}${typeof totalCount === 'number' ? ` of ${totalCount}` : ''} companies`}</p>
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Company</th><th>Type</th><th>Owner</th><th>City</th><th>Company #</th><th><span className="sr-only">Actions</span></th></tr></thead>
          <tbody>
            {loading && <tr><td colSpan="6" className="empty-state">Loading companies…</td></tr>}
            {!loading && companies.length === 0 && <tr><td colSpan="6" className="empty-state">{trimmedSearch ? 'No matches.' : 'No companies yet.'}</td></tr>}
            {companies.map((company) => (
              <tr key={company.id}>
                <td data-label="Company" className="company-name">{company.companyName}</td>
                <td data-label="Type">{company.type || '—'}</td>
                <td data-label="Owner">{company.ownerName || '—'}</td>
                <td data-label="City">{company.city || '—'}</td>
                <td data-label="Company #">{company.companyNumber || '—'}</td>
                <td data-label="Actions" className="action-cell"><Link className="edit" to={`/admin/companies/${company.id}/edit`}>Edit</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <LoadMore hasMore={hasMore} loading={loadingMore} onLoadMore={loadMore} loadedCount={companies.length} totalCount={totalCount} />
    </section>
  )
}
