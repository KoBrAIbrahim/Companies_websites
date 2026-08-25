import { useEffect, useState } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../../firebase'
import { useAuth } from '../../contexts/AuthContext'
import { useOrders } from '../../hooks/useOrders'
import { computeMonthTotals } from '../../lib/salary'
import { currentMonth, monthLabel } from '../../lib/dates'

export default function Salary() {
  const { profile } = useAuth()
  const [month, setMonth] = useState(currentMonth())
  const { orders } = useOrders(profile.uid)
  const [payout, setPayout] = useState(null)

  useEffect(() => onSnapshot(doc(db, 'payouts', `${profile.uid}_${month}`), (snapshot) => setPayout(snapshot.data() || null)), [profile.uid, month])

  const totals = computeMonthTotals(orders, month, profile.percentage)
  const currency = (value) => Number(value || 0).toLocaleString(undefined, { style: 'currency', currency: 'USD' })
  const amountPaid = payout?.amountPaid || 0

  return (
    <section className="card" aria-labelledby="salary-title">
      <div className="list-heading"><div><h2 id="salary-title">My salary</h2><p>Your commission based on accepted orders.</p></div></div>
      <div className="field-grid single-field">
        <label>Month <input type="month" value={month} onChange={(event) => setMonth(event.target.value)} /></label>
      </div>
      <div className="analysis-grid" style={{ marginTop: 24 }}>
        <article className="analysis-stat"><span>Month</span><strong style={{ fontSize: '1.3rem' }}>{monthLabel(month)}</strong><small>Your percentage: {profile.percentage || 0}%</small></article>
        <article className="analysis-stat accept"><span>Accepted sales</span><strong>{currency(totals.totalSalesForMonth)}</strong><small>Total accepted order value</small></article>
        <article className="analysis-stat revenue"><span>Commission owed</span><strong>{currency(totals.amountOwed)}</strong><small>Based on your percentage</small></article>
        <article className="analysis-stat"><span>Paid so far</span><strong>{currency(amountPaid)}</strong><small>Still owed: {currency(totals.amountOwed - amountPaid)}</small></article>
      </div>
    </section>
  )
}
