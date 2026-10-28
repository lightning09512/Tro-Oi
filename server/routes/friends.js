import { Router } from "express"
import { z } from "zod"
import { pool } from "../config/db.js"
import { requireAuth } from "../middleware/auth.js"

const router = Router()

// 1. Danh sách lời mời kết bạn nhận được (Incoming Pending Friend Requests)
router.get("/requests", requireAuth, async (req, res) => {
  const query = `
    SELECT 
      fr.id,
      fr.sender_id,
      fr.receiver_id,
      fr.status,
      fr.created_at,
      u.name AS sender_name,
      u.avatar_url AS sender_avatar,
      u.phone AS sender_phone,
      u.role AS sender_role,
      COUNT(DISTINCT l.id) AS listings_count,
      COUNT(DISTINCT p.id) AS posts_count
    FROM friend_requests fr
    JOIN users u ON u.id = fr.sender_id
    LEFT JOIN listings l ON l.owner_id = u.id AND l.status = 'active'
    LEFT JOIN forum_posts p ON p.author_id = u.id AND p.status = 'active'
    WHERE fr.receiver_id = $1 AND fr.status = 'pending'
    GROUP BY fr.id, u.id
    ORDER BY fr.created_at DESC
  `
  const { rows } = await pool.query(query, [req.user.id])
  res.json({
    items: rows.map((r) => ({
      id: r.id,
      senderId: r.sender_id,
      receiverId: r.receiver_id,
      status: r.status,
      createdAt: r.created_at,
      name: r.sender_name,
      avatarUrl: r.sender_avatar ?? undefined,
      initials: r.sender_name.trim().split(/\s+/).slice(-2).map((p) => p[0]).join("").toUpperCase() || "TV",
      phone: r.sender_phone ?? "",
      role: r.sender_role,
      listingsCount: Number(r.listings_count) || 0,
      postsCount: Number(r.posts_count) || 0,
    })),
  })
})

// 2. Gửi lời mời kết bạn (Send Friend Request)
router.post("/requests", requireAuth, async (req, res) => {
  const input = z.object({ receiverId: z.string().trim().min(1) }).parse(req.body)
  if (input.receiverId === req.user.id) {
    return res.status(400).json({ error: "Không thể gửi lời mời kết bạn cho chính mình." })
  }

  const result = await pool.query(
    `INSERT INTO friend_requests (sender_id, receiver_id, status, updated_at)
     VALUES ($1, $2, 'pending', now())
     ON CONFLICT (sender_id, receiver_id) DO UPDATE SET status = 'pending', updated_at = now()
     RETURNING id, status, created_at`,
    [req.user.id, input.receiverId]
  )

  res.status(201).json({ item: result.rows[0], message: "Đã gửi lời mời kết bạn." })
})

// 3. Phản hồi lời mời kết bạn: Xác nhận ('accepted') hoặc Từ chối ('rejected')
router.patch("/requests/:id", requireAuth, async (req, res) => {
  const input = z.object({ status: z.enum(["accepted", "rejected"]) }).parse(req.body)

  const result = await pool.query(
    `UPDATE friend_requests SET status = $1, updated_at = now()
     WHERE id = $2 AND receiver_id = $3
     RETURNING id, status, sender_id, receiver_id`,
    [input.status, req.params.id, req.user.id]
  )

  if (!result.rowCount) {
    return res.status(404).json({ error: "Không tìm thấy lời mời kết bạn." })
  }

  res.json({
    item: result.rows[0],
    message: input.status === "accepted" ? "Đã trở thành bạn bè!" : "Đã từ chối lời mời kết bạn.",
  })
})

// 4. Danh sách bạn bè hiện tại (Accepted Friends)
router.get("/", requireAuth, async (req, res) => {
  const query = `
    SELECT 
      fr.id AS connection_id,
      fr.created_at AS connected_at,
      u.id,
      u.name,
      u.avatar_url,
      u.phone,
      u.role,
      COUNT(DISTINCT l.id) AS listings_count,
      COUNT(DISTINCT p.id) AS posts_count
    FROM friend_requests fr
    JOIN users u ON (u.id = CASE WHEN fr.sender_id = $1 THEN fr.receiver_id ELSE fr.sender_id END)
    LEFT JOIN listings l ON l.owner_id = u.id AND l.status = 'active'
    LEFT JOIN forum_posts p ON p.author_id = u.id AND p.status = 'active'
    WHERE (fr.sender_id = $1 OR fr.receiver_id = $1) AND fr.status = 'accepted'
    GROUP BY fr.id, u.id
    ORDER BY fr.updated_at DESC
  `
  const { rows } = await pool.query(query, [req.user.id])
  res.json({
    items: rows.map((r) => ({
      connectionId: r.connection_id,
      connectedAt: r.connected_at,
      id: r.id,
      name: r.name,
      avatarUrl: r.avatar_url ?? undefined,
      initials: r.name.trim().split(/\s+/).slice(-2).map((p) => p[0]).join("").toUpperCase() || "TV",
      phone: r.phone ?? "",
      role: r.role,
      listingsCount: Number(r.listings_count) || 0,
      postsCount: Number(r.posts_count) || 0,
    })),
  })
})

// 5. Gợi ý bạn bè (Suggestions / Những người bạn có thể biết)
router.get("/suggestions", requireAuth, async (req, res) => {
  const query = `
    SELECT 
      u.id,
      u.name,
      u.avatar_url,
      u.phone,
      u.role,
      COUNT(DISTINCT l.id) AS listings_count,
      COUNT(DISTINCT p.id) AS posts_count
    FROM users u
    LEFT JOIN listings l ON l.owner_id = u.id AND l.status = 'active'
    LEFT JOIN forum_posts p ON p.author_id = u.id AND p.status = 'active'
    WHERE u.id != $1 
      AND u.status = 'active' 
      AND u.role IN ('renter', 'landlord')
      AND u.id NOT IN (
        SELECT CASE WHEN sender_id = $1 THEN receiver_id ELSE sender_id END
        FROM friend_requests
        WHERE sender_id = $1 OR receiver_id = $1
      )
    GROUP BY u.id
    ORDER BY RANDOM()
    LIMIT 12
  `
  const { rows } = await pool.query(query, [req.user.id])
  res.json({
    items: rows.map((r) => ({
      id: r.id,
      name: r.name,
      avatarUrl: r.avatar_url ?? undefined,
      initials: r.name.trim().split(/\s+/).slice(-2).map((p) => p[0]).join("").toUpperCase() || "TV",
      phone: r.phone ?? "",
      role: r.role,
      listingsCount: Number(r.listings_count) || 0,
      postsCount: Number(r.posts_count) || 0,
    })),
  })
})


// 6. Trạng thái kết bạn với 1 user cụ thể
router.get("/status/:targetId", requireAuth, async (req, res) => {
  const query = `
    SELECT id, sender_id, receiver_id, status 
    FROM friend_requests
    WHERE (sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1)
    ORDER BY updated_at DESC LIMIT 1
  `
  const { rows } = await pool.query(query, [req.user.id, req.params.targetId])
  if (rows.length === 0) {
    return res.json({ status: "none" })
  }
  const row = rows[0]
  if (row.status === "accepted") {
    return res.json({ status: "accepted", requestId: row.id })
  }
  if (row.status === "pending") {
    if (row.sender_id === req.user.id) {
      return res.json({ status: "pending_sent", requestId: row.id })
    } else {
      return res.json({ status: "pending_received", requestId: row.id })
    }
  }
  return res.json({ status: "none" })
})

// 7. Hủy kết bạn (Unfriend)
router.delete("/:friendId", requireAuth, async (req, res) => {
  await pool.query(
    `DELETE FROM friend_requests 
     WHERE (sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1)`,
    [req.user.id, req.params.friendId]
  )
  res.json({ message: "Đã hủy kết bạn thành công." })
})

export default router
