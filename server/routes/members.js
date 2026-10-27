import { Router } from "express"
import { pool } from "../config/db.js"

const router = Router()
router.get("/", async (_req, res) => {
  const { rows } = await pool.query("SELECT id,name,role,status,avatar_url,created_at FROM users WHERE status='active' AND role IN ('renter','landlord') ORDER BY created_at DESC LIMIT 100")
  res.json({ items: rows.map((row) => ({ id: row.id, name: row.name, role: row.role, status: row.status, avatarUrl: row.avatar_url ?? undefined, email: "", phone: "", initials: row.name.trim().split(/\s+/).slice(-2).map((part) => part[0]).join("").toUpperCase(), createdAt: row.created_at })) })
})
router.get("/:id", async (req, res) => {
  const { rows } = await pool.query(
    "SELECT id,name,phone,role,status,avatar_url,created_at FROM users WHERE id=$1 AND status='active' AND role IN ('renter','landlord')",
    [req.params.id],
  )
  const member = rows[0]
  if (!member) return res.status(404).json({ error: "Hồ sơ này không tồn tại hoặc tài khoản không còn hoạt động." })
  res.json({ item: {
    id: member.id,
    name: member.name,
    phone: member.phone ?? "",
    role: member.role,
    status: member.status,
    avatarUrl: member.avatar_url ?? undefined,
    createdAt: member.created_at,
    initials: member.name.trim().split(/\s+/).slice(-2).map((part) => part[0]).join("").toUpperCase(),
  } })
})
export default router
