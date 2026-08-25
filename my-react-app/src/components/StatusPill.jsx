export default function StatusPill({ status }) {
  const value = status || 'pending'
  return <span className={`status ${value}`}>{value}</span>
}
