import { useEffect, useState } from 'react'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { db } from '../firebase'

export function useOrders(userId) {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const ordersQuery = userId
      ? query(collection(db, 'orders'), where('userId', '==', userId))
      : collection(db, 'orders')
    return onSnapshot(ordersQuery, (snapshot) => {
      const list = snapshot.docs.map((order) => ({ id: order.id, ...order.data() }))
      list.sort((first, second) => (second.startDate || '').localeCompare(first.startDate || ''))
      setOrders(list)
      setLoading(false)
    }, (snapshotError) => {
      setError(`Could not load orders: ${snapshotError.message}`)
      setLoading(false)
    })
  }, [userId])

  return { orders, loading, error }
}
