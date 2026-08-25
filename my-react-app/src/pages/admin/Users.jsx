import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { collection, doc, orderBy, query, updateDoc } from 'firebase/firestore'
import { db } from '../../firebase'
import { usePaginatedQuery } from '../../hooks/usePaginatedQuery'
import LoadMore from '../../components/LoadMore'

const PAGE_SIZE = 20

export default function Users() {
  const baseQuery = useMemo(() => query(collection(db, 'users'), orderBy('name')), [])
  const { items: users, loading, error, hasMore, loadMore, loadingMore, totalCount, patchItem } = usePaginatedQuery(baseQuery, PAGE_SIZE)
  const [togglingId, setTogglingId] = useState(null)
  const [toggleError, setToggleError] = useState('')

  async function toggleActive(user) {
    setTogglingId(user.id)
    setToggleError('')
    try {
      const nextActive = !(user.active !== false)
      await updateDoc(doc(db, 'users', user.id), { active: nextActive })
      patchItem(user.id, { active: nextActive })
    } catch (toggleErr) {
      setToggleError(`Could not update ${user.name}: ${toggleErr.message}`)
    } finally {
      setTogglingId(null)
    }
  }

  return (
    <section className="card" aria-labelledby="users-title">
      <div className="list-heading">
        <div><h2 id="users-title">Users</h2><p>Manage admin and sales accounts.</p></div>
        <Link className="primary" to="/admin/users/new">Add user</Link>
      </div>
      {(error || toggleError) && <p className="notice error" role="alert">{error || toggleError}</p>}
      <div className="list-tools">
        <p>{loading ? 'Loading…' : `${users.length}${typeof totalCount === 'number' ? ` of ${totalCount}` : ''} users`}</p>
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>City</th><th>Status</th><th><span className="sr-only">Actions</span></th></tr></thead>
          <tbody>
            {loading && <tr><td colSpan="6" className="empty-state">Loading users…</td></tr>}
            {!loading && users.length === 0 && <tr><td colSpan="6" className="empty-state">No users yet.</td></tr>}
            {users.map((user) => {
              const active = user.active !== false
              return (
                <tr key={user.id}>
                  <td data-label="Name" className="company-name">{user.name || '—'}</td>
                  <td data-label="Email">{user.email}</td>
                  <td data-label="Role"><span className={`status ${user.role === 'admin' ? 'accept' : 'pending'}`}>{user.role}</span></td>
                  <td data-label="City">{user.city || '—'}</td>
                  <td data-label="Status"><span className={`status ${active ? 'accept' : 'reject'}`}>{active ? 'active' : 'disabled'}</span></td>
                  <td data-label="Actions" className="action-cell">
                    <Link className="edit" to={`/admin/users/${user.id}/edit`}>Edit</Link>
                    <button type="button" className={active ? 'delete' : 'view'} onClick={() => toggleActive(user)} disabled={togglingId === user.id}>
                      {togglingId === user.id ? 'Saving…' : active ? 'Disable' : 'Enable'}
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <LoadMore hasMore={hasMore} loading={loadingMore} onLoadMore={loadMore} loadedCount={users.length} totalCount={totalCount} />
    </section>
  )
}
