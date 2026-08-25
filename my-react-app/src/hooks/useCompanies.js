import { useEffect, useState } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'

export function useCompanies() {
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => onSnapshot(collection(db, 'companies'), (snapshot) => {
    setCompanies(snapshot.docs.map((company) => ({ id: company.id, ...company.data() })))
    setLoading(false)
  }, (snapshotError) => {
    setError(`Could not load companies: ${snapshotError.message}`)
    setLoading(false)
  }), [])

  return { companies, loading, error }
}
