import { Router } from "express"
import { pool } from "../config/db.js"
import { requireAuth } from "../middleware/auth.js"

const router = Router()

router.get("/", requireAuth, async (req, res) => {
  const q = String(req.query.q || "").trim()
  const role = String(req.query.role || "").trim()

  // Bảo vệ quyền riêng tư: Không hiển thị danh sách nếu không nhập thông tin tìm kiếm
  if (!q) {
    return res.json({ items: [] })
  }

  const filters = ["u.status='active'", "u.role IN ('renter','landlord')"]
  const params = []

  if (role === "renter" || role === "landlord") {
    params.push(role)
    filters.push(`u.role = $${params.length}`)
  }

  const cleanPhone = q.replace(/[\s\.\-]+/g, "")
  params.push(`%${q}%`)
  const paramIdx = params.length
  params.push(`%${cleanPhone}%`)
  const phoneIdx = params.length
  filters.push(`(unaccent(u.name) ILIKE unaccent($${paramIdx}) OR regexp_replace(u.phone, '[[:space:]\\.\\-]', '', 'g') ILIKE $${phoneIdx})`)

  const query = `
    SELECT 
      u.id, 
      u.name, 
      u.phone, 
      u.role, 
      u.status, 
      u.avatar_url, 
      u.created_at,
      COUNT(DISTINCT l.id) AS listings_count,
      COUNT(DISTINCT p.id) AS posts_count
    FROM users u
    LEFT JOIN listings l ON l.owner_id = u.id AND l.status = 'active'
    LEFT JOIN forum_posts p ON p.author_id = u.id AND p.status = 'active'
    WHERE ${filters.join(" AND ")}
    GROUP BY u.id
    ORDER BY u.created_at DESC
    LIMIT 20
  `

  const { rows } = await pool.query(query, params)

  res.json({
    items: rows.map((row) => ({
      id: row.id,
      name: row.name,
      phone: row.phone ?? "",
      role: row.role,
      status: row.status,
      avatarUrl: row.avatar_url ?? undefined,
      initials: row.name.trim().split(/\s+/).slice(-2).map((part) => part[0]).join("").toUpperCase() || "TV",
      createdAt: row.created_at,
      listingsCount: Number(row.listings_count) || 0,
      postsCount: Number(row.posts_count) || 0,
    })),
  })
})

export default router
