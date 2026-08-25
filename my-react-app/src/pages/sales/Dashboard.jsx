import { useAuth } from '../../contexts/AuthContext'
import { useOrders } from '../../hooks/useOrders'
import { computeMonthTotals } from '../../lib/salary'
import { currentMonth } from '../../lib/dates'

export default function Dashboard() {
  const { profile } = useAuth()
  const { orders, loading } = useOrders(profile.uid)
  const totals = computeMonthTotals(orders, currentMonth(), profile.percentage)
  const currency = (value) => Number(value || 0).toLocaleString(undefined, { style: 'currency', currency: 'USD' })
  const accepted = orders.filter((order) => order.status === 'accept')

  return (
    <section className="card" aria-labelledby="dashboard-title">
      <div className="list-heading"><div><h2 id="dashboard-title">Dashboard</h2><p>Your orders and commission this month.</p></div></div>
      <div className="analysis-grid">
        <article className="analysis-stat"><span>Your orders</span><strong>{loading ? '…' : orders.length}</strong><small>All orders you created</small></article>
        <article className="analysis-stat accept"><span>Accepted</span><strong>{accepted.length}</strong><small>Currently active agreements</small></article>
        <article className="analysis-stat revenue"><span>This month's commission</span><strong>{currency(totals.amountOwed)}</strong><small>{totals.percentageApplied}% of accepted sales</small></article>
      </div>
    </section>
  )
}
