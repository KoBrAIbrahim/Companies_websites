import { useCallback, useEffect, useRef, useState } from 'react'
import { getCountFromServer, getDocs, limit, query, startAfter } from 'firebase/firestore'

// Cursor-based Firestore pagination: fetches one page at a time instead of the whole
// collection. `baseQuery` must be memoized by the caller (where/orderBy, no limit) so its
// identity only changes when the actual filters change — that's what triggers a reset to
// page one here. Also runs a lightweight aggregate count query for the "X results" label,
// which is far cheaper than fetching every document just to count them.
export function usePaginatedQuery(baseQuery, pageSize = 20) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')
  const [hasMore, setHasMore] = useState(false)
  const [totalCount, setTotalCount] = useState(null)
  const cursorRef = useRef(null)
  const requestIdRef = useRef(0)

  useEffect(() => {
    let cancelled = false
    const requestId = ++requestIdRef.current
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data-fetching effect: enter the loading state the moment the query (filters/search) changes, not after the fetch resolves
    setLoading(true)
    setError('')
    cursorRef.current = null

    getDocs(query(baseQuery, limit(pageSize)))
      .then((snapshot) => {
        if (cancelled || requestId !== requestIdRef.current) return
        setItems(snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() })))
        cursorRef.current = snapshot.docs[snapshot.docs.length - 1] || null
        setHasMore(snapshot.docs.length === pageSize)
        setLoading(false)
      })
      .catch((fetchError) => {
        if (cancelled || requestId !== requestIdRef.current) return
        setError(`Could not load data: ${fetchError.message}`)
        setLoading(false)
      })

    setTotalCount(null)
    getCountFromServer(baseQuery)
      .then((snapshot) => { if (!cancelled && requestId === requestIdRef.current) setTotalCount(snapshot.data().count) })
      .catch(() => { if (!cancelled && requestId === requestIdRef.current) setTotalCount(null) })

    return () => { cancelled = true }
  }, [baseQuery, pageSize])

  const loadMore = useCallback(() => {
    if (!cursorRef.current || loadingMore) return
    const requestId = requestIdRef.current
    setLoadingMore(true)
    getDocs(query(baseQuery, startAfter(cursorRef.current), limit(pageSize)))
      .then((snapshot) => {
        if (requestId !== requestIdRef.current) return
        setItems((current) => [...current, ...snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))])
        cursorRef.current = snapshot.docs[snapshot.docs.length - 1] || null
        setHasMore(snapshot.docs.length === pageSize)
      })
      .catch((fetchError) => { if (requestId === requestIdRef.current) setError(`Could not load more: ${fetchError.message}`) })
      .finally(() => { if (requestId === requestIdRef.current) setLoadingMore(false) })
  }, [baseQuery, pageSize, loadingMore])

  // Optimistic local patch for an already-loaded row (e.g. after a toggle/update write) —
  // pagination is a one-time fetch per page rather than a live listener, so callers apply
  // known-good writes locally instead of waiting on a snapshot that will never arrive.
  const patchItem = useCallback((id, patch) => {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)))
  }, [])

  return { items, loading, loadingMore, error, hasMore, loadMore, totalCount, patchItem }
}
