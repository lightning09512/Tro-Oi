import "dotenv/config"
import http from "node:http"
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from "node:url"
import express from "express"
import cors from "cors"
import helmet from "helmet"
import { rateLimit } from "express-rate-limit"
import { Server as SocketServer } from "socket.io"
import jwt from "jsonwebtoken"
import { pool, connectMongo, databaseStatus, requirePostgres, requireMongo } from "./config/db.js"
import Conversation from "./models/Conversation.js"
import { notFound, errorHandler } from "./middleware/errors.js"
import authRoutes from "./routes/auth.js"
import listingRoutes from "./routes/listings.js"
import favoriteRoutes from "./routes/favorites.js"
import forumRoutes from "./routes/forum.js"
import messageRoutes from "./routes/messages.js"
import reportRoutes from "./routes/reports.js"
import notificationRoutes from "./routes/notifications.js"
import adminRoutes from "./routes/admin.js"
import categoryRoutes from "./routes/categories.js"
import uploadRoutes from "./routes/uploads.js"
import memberRoutes from "./routes/members.js"
import reviewRoutes from "./routes/reviews.js"
import friendRoutes from "./routes/friends.js"
import { requireAuth } from "./middleware/auth.js"
import { flushNotificationOutbox } from "./services/notificationService.js"

const app = express()
app.set("trust proxy", 1)
const server = http.createServer(app)
const serverDirectory = path.dirname(fileURLToPath(import.meta.url))
const configuredOrigins = (process.env.WEB_ORIGIN || "http://localhost:8443").split(",").map((value) => value.trim())
const io = new SocketServer(server, { cors: { origin: configuredOrigins, credentials: true }, maxHttpBufferSize: 1e6 })
app.set("io", io)
app.disable("x-powered-by")
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }))
app.use(cors({ origin(origin, done) {
  if (!origin || configuredOrigins.includes(origin)) return done(null, true)
  done(new Error("Origin không được phép."))
}, credentials: true }))
if (process.env.NODE_ENV !== "production") {
  app.use("/uploads", express.static(path.join(serverDirectory, "uploads"), { immutable: true, maxAge: "30d", fallthrough: false }))
}
app.use(express.json({ limit: "1mb" }))
app.use(express.urlencoded({ extended: false, limit: "1mb" }))

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 60, standardHeaders: "draft-8", legacyHeaders: false, message: { error: "Bạn thao tác quá nhiều lần. Vui lòng thử lại sau." } })
const apiLimiter = rateLimit({ windowMs: 60_000, limit: 180, standardHeaders: "draft-8", legacyHeaders: false, message: { error: "Bạn gửi quá nhiều yêu cầu. Vui lòng thử lại sau." } })
const emailCodeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  validate: { keyGeneratorIpFallback: false, xForwardedForHeader: false },
  keyGenerator: (req) => {
    const target = req.body?.email || req.body?.identifier || ""
    return target ? `${req.ip}_${target}` : req.ip
  },
  message: { error: "Bạn đã yêu cầu quá nhiều mã. Vui lòng đợi 15 phút trước khi thử lại." },
})
app.use("/api", apiLimiter)
app.get("/api/health", async (_req, res) => {
  const databases = await databaseStatus()
  const configured = Boolean(process.env.JWT_SECRET && process.env.JWT_SECRET.length >= 32)
  const ready = databases.postgres === "connected" && databases.mongo === "connected" && configured
  const cloudinaryConfigured = Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET)
  res.status(ready ? 200 : 503).json({ status: ready ? "ready" : "configuration_required", databases, authConfigured: configured, emailConfigured: Boolean(process.env.SMTP_HOST && process.env.SMTP_FROM), uploadsConfigured: cloudinaryConfigured || process.env.NODE_ENV !== "production", uploadStorage: cloudinaryConfigured ? "cloudinary" : process.env.NODE_ENV === "production" ? "unconfigured" : "local" })
})

app.use("/api/auth", authLimiter, (req, res, next) => ["/password-reset/request", "/register/request-code"].includes(req.path) ? emailCodeLimiter(req, res, next) : next(), requirePostgres, authRoutes)
app.use("/api/listings", requirePostgres, listingRoutes)
app.use("/api/favorites", requirePostgres, favoriteRoutes)
app.use("/api/forum", requirePostgres, (req, res, next) => { if (req.get("authorization")) return requireAuth(req, res, next); next() }, forumRoutes)
app.use("/api/messages", requirePostgres, requireMongo, messageRoutes)
app.use("/api/reports", requirePostgres, reportRoutes)
app.use("/api/notifications", requirePostgres, requireMongo, notificationRoutes)
app.use("/api/admin", requirePostgres, adminRoutes)
app.use("/api/categories", requirePostgres, categoryRoutes)
app.use("/api/uploads", requirePostgres, uploadRoutes)
app.use("/api/members", requirePostgres, memberRoutes)
app.use("/api/reviews", requirePostgres, reviewRoutes)
app.use("/api/friends", requirePostgres, friendRoutes)
const distPath = path.resolve(serverDirectory, '../dist')
if (process.env.NODE_ENV === 'production' && fs.existsSync(distPath)) {
  app.use(express.static(distPath))
  app.get(/^(?!\/api|\/socket\.io|\/uploads).*/, (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'))
  })
}

app.use(notFound)
app.use(errorHandler)

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token
    if (!token || !process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) return next(new Error("unauthorized"))
    const claims = jwt.verify(token, process.env.JWT_SECRET)
    if (!pool) return next(new Error("database_unavailable"))
    const { rows } = await pool.query("SELECT id,role,status FROM users WHERE id=$1", [claims.sub])
    if (!rows[0] || rows[0].status !== "active" || !["renter", "landlord"].includes(rows[0].role)) return next(new Error("unauthorized"))
    socket.data.user = { id: rows[0].id, role: rows[0].role }
    next()
  } catch { next(new Error("unauthorized")) }
})
io.on("connection", (socket) => {
  socket.on("conversation:join", async (conversationId, acknowledge) => {
    try {
      const conversation = await Conversation.findById(conversationId).select("participants")
      if (!conversation || !conversation.participants.includes(socket.data.user.id)) return acknowledge?.({ ok: false, error: "forbidden" })
      socket.join(`conversation:${conversation.id}`)
      acknowledge?.({ ok: true })
    } catch { acknowledge?.({ ok: false, error: "not_found" }) }
  })
  socket.on("conversation:leave", (conversationId) => socket.leave(`conversation:${conversationId}`))
})

const port = Number(process.env.PORT || 3001)
server.listen(port, "0.0.0.0", () => console.log(`Tro Oi API listening on ${port}`))
if (pool) pool.query("SELECT 1").catch((error) => console.warn(`PostgreSQL unavailable: ${error.message}`))
connectMongo()
  .then(() => flushNotificationOutbox().catch((error) => console.warn(`Notification outbox unavailable: ${error.message}`)))
  .catch((error) => console.warn(`MongoDB unavailable: ${error.message}`))

async function shutdown() {
  io.close()
  server.close()
  if (pool) await pool.end()
  process.exit(0)
}
process.on("SIGINT", shutdown)
process.on("SIGTERM", shutdown)
