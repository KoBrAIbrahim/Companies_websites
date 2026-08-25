export function ordersInMonth(orders, month) {
  return orders.filter((order) => (order.startDate || '').slice(0, 7) === month)
}

export function computeMonthTotals(orders, month, percentage) {
  const monthOrders = ordersInMonth(orders, month).filter((order) => order.status === 'accept')
  const totalSalesForMonth = monthOrders.reduce((sum, order) => sum + (Number(order.price) || 0), 0)
  const percentageApplied = Number(percentage) || 0
  const amountOwed = Math.round(totalSalesForMonth * (percentageApplied / 100) * 100) / 100
  return { totalSalesForMonth, percentageApplied, amountOwed }
}
