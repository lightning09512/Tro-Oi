import type { PlatformUser } from "@/contexts/PlatformContext"

export interface ParsedForumPost {
  title: string
  compactTitle: string
  excerpt: string
  category: string
  fullContent: string
  bodyContent: string
}

/** Định dạng ngày đăng bài viết cộng đồng theo chuẩn DD/MM/YYYY (bỏ phần giờ:phút:giây). */
export function formatForumPostDate(createdAt?: string, fallbackTime?: string): string {
  if (createdAt) {
    const parsed = new Date(createdAt)
    if (!Number.isNaN(parsed.getTime())) {
      const dd = String(parsed.getDate()).padStart(2, "0")
      const mm = String(parsed.getMonth() + 1).padStart(2, "0")
      return `${dd}/${mm}/${parsed.getFullYear()}`
    }
  }
  if (fallbackTime) {
    const match = fallbackTime.match(/\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/)
    if (match) {
      return `${match[1].padStart(2, "0")}/${match[2].padStart(2, "0")}/${match[3]}`
    }
    const strippedTime = fallbackTime.replace(/\b\d{1,2}:\d{2}(?::\d{2})?\b\s*/g, "").trim()
    return strippedTime || fallbackTime
  }
  return "Chưa rõ"
}

/** Định dạng thời gian bình luận theo chuẩn HH:mm DD/MM/YYYY. */
export function formatForumCommentTime(createdAt?: string): string {
  if (!createdAt) return ""
  const parsed = new Date(createdAt)
  if (Number.isNaN(parsed.getTime())) return ""
  const hh = String(parsed.getHours()).padStart(2, "0")
  const min = String(parsed.getMinutes()).padStart(2, "0")
  const dd = String(parsed.getDate()).padStart(2, "0")
  const mm = String(parsed.getMonth() + 1).padStart(2, "0")
  return `${hh}:${min} ${dd}/${mm}/${parsed.getFullYear()}`
}

/** Rút gọn tiền tố đóng ngoặc vuông ở đầu tiêu đề (ví dụ `[PASS PHÒNG...]`). */
export function stripLeadingBracketTag(title: string): string {
  const trimmed = title.trim()
  const withoutPrefix = trimmed.replace(/^\[[^\]]+\]\s*/, "").trim()
  if (withoutPrefix) return withoutPrefix
  const unwrapped = trimmed.replace(/^\[([^\]]+)\]$/, "$1").trim()
  return unwrapped || trimmed
}

/** Tách tiêu đề chính, mô tả ngắn, nội dung thân bài và danh mục từ nội dung thô của bài đăng diễn đàn. */
export function parseForumPostContent(rawContent: string): ParsedForumPost {
  const content = (rawContent || "").trim()
  const lines = content.split("\n").map((line) => line.trim()).filter(Boolean)
  let title = lines[0] || "Bài viết cộng đồng"
  let excerpt = lines.slice(1).join(" ").trim()
  let bodyContent = content

  if (lines.length > 1) {
    // Giữ nguyên ngắt đoạn của phần nội dung và loại bỏ dòng đầu tiên nếu trùng với tiêu đề
    const rawLines = content.split(/\r?\n/)
    const firstNonEmptyIdx = rawLines.findIndex((line) => line.trim().length > 0)
    if (firstNonEmptyIdx !== -1 && rawLines[firstNonEmptyIdx].trim() === title) {
      const rest = rawLines.slice(firstNonEmptyIdx + 1).join("\n").trim()
      if (rest) {
        bodyContent = rest
      }
    }
  } else if (lines.length === 1) {
    const bracketMatch = content.match(/^(\[[^\]]+\]\s*[^.\n]+)(?:[.\n]|$)/)
    if (bracketMatch) {
      title = bracketMatch[1]
      const rest = content.slice(title.length).replace(/^[.\s]+/, "").trim()
      excerpt = rest || content
      bodyContent = rest || content
    } else {
      const dotIndex = content.indexOf(". ")
      if (dotIndex > 10 && dotIndex < 70) {
        title = content.slice(0, dotIndex).trim()
        const rest = content.slice(dotIndex + 2).trim()
        excerpt = rest || content
        bodyContent = rest || content
      } else {
        const colonIndex = content.indexOf(": ")
        if (colonIndex > 20 && colonIndex < 85 && content.length - (colonIndex + 2) >= 40) {
          title = content.slice(0, colonIndex).trim()
          const rest = content.slice(colonIndex + 2).trim()
          excerpt = rest || content
          bodyContent = rest || content
        } else {
          const leadInMatch = content.match(/^(.{15,85}?(?:!|\?|👋|⚠️))\s+(.{40,})$/u)
          if (leadInMatch) {
            title = leadInMatch[1].trim()
            const rest = leadInMatch[2].trim()
            excerpt = rest || content
            bodyContent = rest || content
          } else {
            excerpt = content
          }
        }
      }
    }
  }

  let category = "Bài viết"
  const lower = content.toLowerCase()
  if (
    lower.includes("pass phòng") ||
    lower.includes("chuyển nhượng") ||
    lower.includes("sang nhượng")
  ) {
    category = "Pass phòng"
  } else if (lower.includes("ở ghép") || lower.includes("tìm bạn")) {
    category = "Tìm ở ghép"
  } else if (lower.includes("review") || lower.includes("đánh giá")) {
    category = "Review khu trọ"
  } else if (
    lower.includes("kinh nghiệm") ||
    lower.includes("mẹo") ||
    lower.includes("chia sẻ") ||
    lower.includes("hợp đồng")
  ) {
    category = "Kinh nghiệm"
  }

  return {
    title,
    compactTitle: stripLeadingBracketTag(title),
    excerpt: excerpt || content,
    category,
    fullContent: content,
    bodyContent,
  }
}

/** Tra cứu ảnh đại diện của thành viên từ bài viết/bình luận hoặc danh sách người dùng. */
export function resolveMemberAvatar(
  users: Pick<PlatformUser, "id" | "name" | "avatarUrl">[],
  authorId?: string,
  authorName?: string,
  explicitAvatarUrl?: string,
): string | undefined {
  if (explicitAvatarUrl?.trim()) return explicitAvatarUrl.trim()
  const matched = users.find(
    (u) =>
      (authorId && u.id === authorId) ||
      (authorName && u.name.toLowerCase() === authorName.toLowerCase()),
  )
  return matched?.avatarUrl?.trim() || undefined
}
