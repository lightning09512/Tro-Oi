import { Router } from "express"
import { pool } from "../config/db.js"

const router = Router()

router.get("/", async (req, res) => {
  const q = String(req.query.q || "").trim()
  const role = String(req.query.role || "").trim()

  const filters = ["u.status='active'", "u.role IN ('renter','landlord')"]
  const params = []

  if (role === "renter" || role === "landlord") {
    params.push(role)
    filters.push(`u.role = $${params.length}`)
  }

  if (q) {
    params.push(`%${q}%`)
    const paramIdx = params.length
    const cleanPhone = q.replace(/\s+/g, "")
    params.push(`%${cleanPhone}%`)
    const phoneIdx = params.length
    filters.push(`(unaccent(u.name) ILIKE unaccent($${paramIdx}) OR regexp_replace(u.phone, '[[:space:]]', '', 'g') ILIKE $${phoneIdx})`)
  }

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
    LIMIT 100
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

router.get("/:id", async (req, res) => {
  const { rows } = await pool.query(
    "SELECT id,name,phone,role,status,avatar_url,created_at FROM users WHERE id=$1 AND status='active' AND role IN ('renter','landlord')",
    [req.params.id],
  )
  const member = rows[0]
  if (!member) return res.status(404).json({ error: "Hồ sơ này không tồn tại hoặc tài khoản không còn hoạt động." })
  res.json({
    item: {
      id: member.id,
      name: member.name,
      phone: member.phone ?? "",
      role: member.role,
      status: member.status,
      avatarUrl: member.avatar_url ?? undefined,
      createdAt: member.created_at,
      initials: member.name.trim().split(/\s+/).slice(-2).map((part) => part[0]).join("").toUpperCase(),
    },
  })
})

export default router
