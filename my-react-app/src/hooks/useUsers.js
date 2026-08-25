import { useEffect, useState } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'

export function useUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => onSnapshot(collection(db, 'users'), (snapshot) => {
    setUsers(snapshot.docs.map((user) => ({ id: user.id, ...user.data() })))
    setLoading(false)
  }, (snapshotError) => {
    setError(`Could not load users: ${snapshotError.message}`)
    setLoading(false)
  }), [])

  return { users, loading, error }
}
