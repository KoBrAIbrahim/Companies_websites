import { useEffect, useState } from 'react'
import { doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '../../firebase'
import { useAuth } from '../../contexts/AuthContext'
import { useUsers } from '../../hooks/useUsers'
import { useOrders } from '../../hooks/useOrders'
import { computeMonthTotals } from '../../lib/salary'
import { currentMonth, monthLabel } from '../../lib/dates'

export default function Salary() {
  const { users, loading } = useUsers()
  const salesUsers = users.filter((user) => user.role === 'sales')

  if (loading) return <p>Loading…</p>

  return <SalaryBody salesUsers={salesUsers} />
}

function SalaryBody({ salesUsers }) {
  const { profile } = useAuth()
  const [userId, setUserId] = useState(() => salesUsers[0]?.id || '')
  const [month, setMonth] = useState(currentMonth())
  const { orders } = useOrders(userId || undefined)
  const [amountPaid, setAmountPaid] = useState('0')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!userId || !month) return undefined
    return onSnapshot(doc(db, 'payouts', `${userId}_${month}`), (snapshot) => {
      const data = snapshot.data()
      setAmountPaid(data ? String(data.amountPaid ?? 0) : '0')
    })
  }, [userId, month])

  const selectedUser = salesUsers.find((user) => user.id === userId)
  const totals = selectedUser ? computeMonthTotals(orders, month, selectedUser.percentage) : { totalSalesForMonth: 0, percentageApplied: 0, amountOwed: 0 }
  const currency = (value) => Number(value || 0).toLocaleString(undefined, { style: 'currency', currency: 'USD' })

  async function handleSave(event) {
    event.preventDefault()
    setSaving(true)
    setMessage('')
    try {
      await setDoc(doc(db, 'payouts', `${userId}_${month}`), {
        userId, month, totalSalesForMonth: totals.totalSalesForMonth, percentageApplied: totals.percentageApplied,
        amountOwed: totals.amountOwed, amountPaid: Number(amountPaid) || 0, adjustedBy: profile.uid, adjustedAt: serverTimestamp(),
      })
      setMessage('Payout saved.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="card" aria-labelledby="salary-title">
      <div className="list-heading"><div><h2 id="salary-title">Salary</h2><p>Review and adjust monthly commission payouts.</p></div></div>
      {message && <p className="notice success" role="status">{message}</p>}
      <div className="field-grid">
        <label>Sales user
          <select value={userId} onChange={(event) => setUserId(event.target.value)}>
            {salesUsers.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
          </select>
        </label>
        <label>Month <input type="month" value={month} onChange={(event) => setMonth(event.target.value)} /></label>
      </div>
      {selectedUser && (
        <>
          <div className="analysis-grid" style={{ marginTop: 24 }}>
            <article className="analysis-stat"><span>Month</span><strong style={{ fontSize: '1.3rem' }}>{monthLabel(month)}</strong><small>{selectedUser.name}</small></article>
            <article className="analysis-stat accept"><span>Accepted sales</span><strong>{currency(totals.totalSalesForMonth)}</strong><small>Total accepted order value</small></article>
            <article className="analysis-stat revenue"><span>Commission owed</span><strong>{currency(totals.amountOwed)}</strong><small>{totals.percentageApplied}% of accepted sales</small></article>
          </div>
          <form onSubmit={handleSave} style={{ marginTop: 24 }}>
            <div className="field-grid single-field">
              <label>Amount paid <input type="number" min="0" step="0.01" value={amountPaid} onChange={(event) => setAmountPaid(event.target.value)} /></label>
            </div>
            <div className="form-actions">
              <p style={{ marginRight: 'auto' }}>Still owed: <strong>{currency(totals.amountOwed - (Number(amountPaid) || 0))}</strong></p>
              <button type="submit" className="primary" disabled={saving}>{saving ? 'Saving…' : 'Save payout'}</button>
            </div>
          </form>
        </>
      )}
      {!salesUsers.length && <p className="empty-state">No sales users yet.</p>}
    </section>
  )
}
