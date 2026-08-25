export const today = () => new Date().toISOString().slice(0, 10)

export function addOneYear(date) {
  if (!date) return ''
  const endDate = new Date(`${date}T12:00:00`)
  endDate.setFullYear(endDate.getFullYear() + 1)
  return endDate.toISOString().slice(0, 10)
}

export function currentMonth() {
  return new Date().toISOString().slice(0, 7)
}

export function monthLabel(month) {
  if (!month) return ''
  const [year, monthNumber] = month.split('-')
  const date = new Date(Number(year), Number(monthNumber) - 1, 1)
  return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
}
