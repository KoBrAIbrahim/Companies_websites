import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { collection, orderBy, query, where } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import { useCompanies } from '../hooks/useCompanies'
import { useUsers } from '../hooks/useUsers'
import { usePaginatedQuery } from '../hooks/usePaginatedQuery'
import StatusPill from '../components/StatusPill'
import LoadMore from '../components/LoadMore'

const PAGE_SIZE = 20

export default function Orders() {
  const { profile } = useAuth()
  const isAdmin = profile.role === 'admin'
  const { companies } = useCompanies()
  const { users } = useUsers()
  const [statusFilter, setStatusFilter] = useState('')
  const [userFilter, setUserFilter] = useState('')
  const [endDateFrom, setEndDateFrom] = useState('')
  const [endDateTo, setEndDateTo] = useState('')
  const dateFilterActive = Boolean(endDateFrom || endDateTo)

  // Filters map straight onto Firestore query constraints so pagination only ever fetches
  // matching rows. A date-range filter forces the sort to endDate — Firestore requires the
  // first orderBy field to match any inequality/range filter field in the same query.
  const baseQuery = useMemo(() => {
    const ordersRef = collection(db, 'orders')
    const constraints = []
    if (!isAdmin) constraints.push(where('userId', '==', profile.uid))
    else if (userFilter) constraints.push(where('userId', '==', userFilter))
    if (statusFilter) constraints.push(where('status', '==', statusFilter))
    if (dateFilterActive) {
      if (endDateFrom) constraints.push(where('endDate', '>=', endDateFrom))
      if (endDateTo) constraints.push(where('endDate', '<=', endDateTo))
      constraints.push(orderBy('endDate', 'asc'))
    } else {
      constraints.push(orderBy('createdAt', 'desc'))
    }
    return query(ordersRef, ...constraints)
  }, [isAdmin, profile.uid, userFilter, statusFilter, endDateFrom, endDateTo, dateFilterActive])

  const { items: orders, loading, error, hasMore, loadMore, loadingMore, totalCount } = usePaginatedQuery(baseQuery, PAGE_SIZE)

  const companyName = (companyId) => companies.find((company) => company.id === companyId)?.companyName || '—'
  const userName = (userId) => users.find((user) => user.id === userId)?.name || '—'
  const hasActiveFilters = Boolean(statusFilter || (isAdmin && userFilter) || endDateFrom || endDateTo)

  function clearFilters() {
    setStatusFilter('')
    setUserFilter('')
    setEndDateFrom('')
    setEndDateTo('')
  }

  const newOrderPath = isAdmin ? '/admin/orders/new' : '/sales/orders/new'
  const editPath = (orderId) => (isAdmin ? `/admin/orders/${orderId}/edit` : `/sales/orders/${orderId}/edit`)
  const columnCount = isAdmin ? 7 : 6

  return (
    <section className="card" aria-labelledby="orders-title">
      <div className="list-heading">
        <div><h2 id="orders-title">Orders</h2><p>{isAdmin ? 'All orders across every company.' : 'Orders you have created.'}</p></div>
        <Link className="primary" to={newOrderPath}>Add order</Link>
      </div>
      {error && <p className="notice error" role="alert">{error}</p>}
      <div className="list-tools">
        <div className="filters-row">
          <label>Status
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="accept">Accept</option>
              <option value="reject">Reject</option>
            </select>
          </label>
          {isAdmin && (
            <label>Added by
              <select value={userFilter} onChange={(event) => setUserFilter(event.target.value)}>
                <option value="">All users</option>
                {users.map((user) => <option key={user.id} value={user.id}>{user.name} ({user.role})</option>)}
              </select>
            </label>
          )}
          <label>End date from <input type="date" value={endDateFrom} onChange={(event) => setEndDateFrom(event.target.value)} /></label>
          <label>End date to <input type="date" value={endDateTo} onChange={(event) => setEndDateTo(event.target.value)} /></label>
          <button type="button" className="clear-filters" onClick={clearFilters} disabled={!hasActiveFilters}>Clear filters</button>
        </div>
        <p>{loading ? 'Loading…' : `${orders.length}${typeof totalCount === 'number' ? ` of ${totalCount}` : ''} orders`}</p>
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Company</th>{isAdmin && <th>Sales user</th>}<th>Status</th><th>Yearly price</th><th>Start date</th><th>End date</th><th><span className="sr-only">Actions</span></th></tr></thead>
          <tbody>
            {loading && <tr><td colSpan={columnCount} className="empty-state">Loading orders…</td></tr>}
            {!loading && orders.length === 0 && <tr><td colSpan={columnCount} className="empty-state">{hasActiveFilters ? 'No orders match this filter.' : 'No orders yet.'}</td></tr>}
            {orders.map((order) => (
              <tr key={order.id}>
                <td data-label="Company" className="company-name">{companyName(order.companyId)}</td>
                {isAdmin && <td data-label="Sales user">{userName(order.userId)}</td>}
                <td data-label="Status"><StatusPill status={order.status} /></td>
                <td data-label="Yearly price">{Number(order.price).toLocaleString(undefined, { style: 'currency', currency: 'USD' })}</td>
                <td data-label="Start date">{order.startDate || '—'}</td>
                <td data-label="End date">{order.endDate || '—'}</td>
                <td data-label="Actions" className="action-cell"><Link className="edit" to={editPath(order.id)}>Edit</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <LoadMore hasMore={hasMore} loading={loadingMore} onLoadMore={loadMore} loadedCount={orders.length} totalCount={totalCount} />
    </section>
  )
}
