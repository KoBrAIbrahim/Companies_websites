import { useEffect, useMemo, useState } from 'react'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '../../firebase'
import { useOrders } from '../../hooks/useOrders'
import { useUsers } from '../../hooks/useUsers'
import { ordersInMonth } from '../../lib/salary'
import { currentMonth, monthLabel } from '../../lib/dates'

export default function Analysis() {
  const { orders, loading: ordersLoading } = useOrders()
  const { users } = useUsers()
  const [month, setMonth] = useState(currentMonth())
  const [payouts, setPayouts] = useState([])
  const [payoutsLoading, setPayoutsLoading] = useState(true)
  const [payoutsError, setPayoutsError] = useState('')

  useEffect(() => {
    let cancelled = false
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data-fetching effect: enter the loading state the moment the selected month changes
    setPayoutsLoading(true)
    setPayoutsError('')
    getDocs(query(collection(db, 'payouts'), where('month', '==', month)))
      .then((snapshot) => { if (!cancelled) setPayouts(snapshot.docs.map((docSnap) => docSnap.data())) })
      .catch((fetchError) => { if (!cancelled) setPayoutsError(`Could not load payouts: ${fetchError.message}`) })
      .finally(() => { if (!cancelled) setPayoutsLoading(false) })
    return () => { cancelled = true }
  }, [month])

  const currency = (value) => Number(value || 0).toLocaleString(undefined, { style: 'currency', currency: 'USD' })
  const salesUsers = useMemo(() => users.filter((user) => user.role === 'sales'), [users])
  const acceptedOrders = useMemo(() => ordersInMonth(orders, month).filter((order) => order.status === 'accept'), [orders, month])

  const income = acceptedOrders.reduce((sum, order) => sum + (Number(order.price) || 0), 0)
  const outcome = payouts.reduce((sum, payout) => sum + (Number(payout.amountPaid) || 0), 0)
  const net = income - outcome
  const loading = ordersLoading || payoutsLoading

  const rows = useMemo(() => salesUsers
    .map((user) => {
      const userOrders = acceptedOrders.filter((order) => order.userId === user.id)
      const userIncome = userOrders.reduce((sum, order) => sum + (Number(order.price) || 0), 0)
      const userOutcome = payouts.find((payout) => payout.userId === user.id)?.amountPaid || 0
      return { user, income: userIncome, outcome: userOutcome, orderCount: userOrders.length }
    })
    .filter((row) => row.income > 0 || row.outcome > 0)
    .sort((first, second) => second.income - first.income), [salesUsers, acceptedOrders, payouts])

  return (
    <section className="card" aria-labelledby="analysis-title">
      <div className="analysis-heading">
        <div><h2 id="analysis-title">Analysis</h2><p>Income vs. sales salary paid, by month.</p></div>
        <label>Month <input type="month" value={month} onChange={(event) => setMonth(event.target.value)} /></label>
      </div>
      {payoutsError && <p className="notice error" role="alert">{payoutsError}</p>}
      <div className="analysis-grid">
        <article className="analysis-stat"><span>Month</span><strong style={{ fontSize: '1.3rem' }}>{monthLabel(month)}</strong><small>{loading ? '…' : `${acceptedOrders.length} accepted orders`}</small></article>
        <article className="analysis-stat accept"><span>Income</span><strong>{loading ? '…' : currency(income)}</strong><small>Accepted order value this month</small></article>
        <article className="analysis-stat reject"><span>Outcome</span><strong>{loading ? '…' : currency(outcome)}</strong><small>Salary paid to sales this month</small></article>
        <article className="analysis-stat revenue"><span>Net</span><strong>{loading ? '…' : currency(net)}</strong><small>Income minus outcome</small></article>
      </div>
      <div className="form-intro" style={{ marginTop: 32, paddingBottom: 16 }}><h2>By sales employee</h2><p>Income contributed and salary paid this month.</p></div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Sales employee</th><th>Accepted orders</th><th>Income</th><th>Outcome (paid)</th></tr></thead>
          <tbody>
            {loading && <tr><td colSpan="4" className="empty-state">Loading…</td></tr>}
            {!loading && rows.length === 0 && <tr><td colSpan="4" className="empty-state">No income or payouts recorded for this month.</td></tr>}
            {rows.map(({ user, income: userIncome, outcome: userOutcome, orderCount }) => (
              <tr key={user.id}>
                <td data-label="Sales employee" className="company-name">{user.name}</td>
                <td data-label="Accepted orders">{orderCount}</td>
                <td data-label="Income">{currency(userIncome)}</td>
                <td data-label="Outcome (paid)">{currency(userOutcome)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
