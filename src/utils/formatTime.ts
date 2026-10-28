export function formatRelativeTime(input?: string | number | Date | null): string {
  if (!input) return ""
  const date = new Date(input)
  if (isNaN(date.getTime())) return String(input)

  const now = new Date()
  const diffInMs = now.getTime() - date.getTime()
  const diffInSec = Math.floor(diffInMs / 1000)

  if (diffInSec < 45) return "Vừa xong"
  if (diffInSec < 3600) {
    const mins = Math.max(1, Math.floor(diffInSec / 60))
    return `${mins} phút`
  }
  if (diffInSec < 86400) {
    const hours = Math.floor(diffInSec / 3600)
    return `${hours} giờ`
  }
  if (diffInSec < 86400 * 7) {
    const days = Math.floor(diffInSec / 86400)
    return `${days} ngày`
  }
  if (diffInSec < 86400 * 30) {
    const weeks = Math.floor(diffInSec / (86400 * 7))
    return `${weeks} tuần`
  }
  const day = date.getDate().toString().padStart(2, "0")
  const month = (date.getMonth() + 1).toString().padStart(2, "0")
  const year = date.getFullYear()
  if (year === now.getFullYear()) {
    return `${day} thg ${month}`
  }
  return `${day}/${month}/${year}`
}
