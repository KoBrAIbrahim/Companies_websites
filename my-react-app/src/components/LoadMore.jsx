import { useEffect, useRef } from 'react'

// Doubles as the page-size affordance and the lazy-load trigger: it's a real button (works
// for keyboard/screen-reader users and as a fallback), and an IntersectionObserver on the
// same element fires loadMore() automatically once it scrolls into view.
export default function LoadMore({ hasMore, loading, onLoadMore, loadedCount, totalCount }) {
  const ref = useRef(null)

  useEffect(() => {
    if (!hasMore || loading) return undefined
    const node = ref.current
    if (!node || typeof IntersectionObserver === 'undefined') return undefined
    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) onLoadMore()
    }, { rootMargin: '200px' })
    observer.observe(node)
    return () => observer.disconnect()
  }, [hasMore, loading, onLoadMore])

  if (!hasMore) return null

  return (
    <div className="load-more">
      <button ref={ref} type="button" className="secondary" onClick={onLoadMore} disabled={loading}>
        {loading ? 'Loading…' : 'Load more'}
      </button>
      {typeof totalCount === 'number' && <small>{loadedCount} of {totalCount} loaded</small>}
    </div>
  )
}
