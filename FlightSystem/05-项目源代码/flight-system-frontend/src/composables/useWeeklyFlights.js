export function addDays(dateStr, days) {
  const date = new Date(`${dateStr}T00:00:00`)
  date.setDate(date.getDate() + days)
  return formatDate(date)
}

export function getWeekRange(centerDate) {
  const dates = []
  const base = new Date(`${centerDate}T00:00:00`)
  for (let i = -3; i <= 3; i++) {
    const d = new Date(base)
    d.setDate(base.getDate() + i)
    dates.push(formatDate(d))
  }
  return dates
}

export function markLowestPrice(items) {
  let minPrice = Infinity
  let hasPrice = false
  for (const item of items) {
    if (item.price !== null && item.price !== undefined && item.price < minPrice) {
      minPrice = item.price
      hasPrice = true
    }
  }
  return items.map(item => ({
    ...item,
    isLowest: hasPrice && item.price === minPrice
  }))
}

function formatDate(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
