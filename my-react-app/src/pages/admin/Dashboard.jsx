import { useCompanies } from '../../hooks/useCompanies'
import { useOrders } from '../../hooks/useOrders'
import { useUsers } from '../../hooks/useUsers'

export default function Dashboard() {
  const { companies, loading: companiesLoading } = useCompanies()
  const { orders, loading: ordersLoading } = useOrders()
  const { users } = useUsers()
  const salesUsers = users.filter((user) => user.role === 'sales')

  const acceptedOrders = orders.filter((order) => order.status === 'accept')
  const totalIncome = acceptedOrders.reduce((sum, order) => sum + (Number(order.price) || 0), 0)
  const currency = (value) => Number(value || 0).toLocaleString(undefined, { style: 'currency', currency: 'USD' })

  const performance = salesUsers.map((user) => {
    const userOrders = acceptedOrders.filter((order) => order.userId === user.id)
    return { user, total: userOrders.reduce((sum, order) => sum + (Number(order.price) || 0), 0), count: userOrders.length }
  }).sort((first, second) => second.total - first.total)

  return (
    <section className="card" aria-labelledby="dashboard-title">
      <div className="list-heading"><div><h2 id="dashboard-title">Dashboard</h2><p>Overview across all companies and sales.</p></div></div>
      <div className="analysis-grid">
        <article className="analysis-stat"><span>Companies</span><strong>{companiesLoading ? '…' : companies.length}</strong><small>Total companies on file</small></article>
        <article className="analysis-stat"><span>Orders</span><strong>{ordersLoading ? '…' : orders.length}</strong><small>All orders ever created</small></article>
        <article className="analysis-stat accept"><span>Accepted orders</span><strong>{acceptedOrders.length}</strong><small>Currently active agreements</small></article>
        <article className="analysis-stat revenue"><span>Income</span><strong>{currency(totalIncome)}</strong><small>Total value of accepted orders</small></article>
      </div>
      <div className="form-intro" style={{ marginTop: 32, paddingBottom: 16 }}><h2>Sales performance</h2><p>Accepted order value by sales employee.</p></div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Sales employee</th><th>Accepted orders</th><th>Total value</th></tr></thead>
          <tbody>
            {performance.length === 0 && <tr><td colSpan="3" className="empty-state">No sales users yet.</td></tr>}
            {performance.map(({ user, total, count }) => (
              <tr key={user.id}>
                <td data-label="Sales employee" className="company-name">{user.name}</td>
                <td data-label="Accepted orders">{count}</td>
                <td data-label="Total value">{currency(total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
