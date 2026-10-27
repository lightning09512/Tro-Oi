import { Router } from "express"
import bcrypt from "bcryptjs"
import crypto from "node:crypto"
import nodemailer from "nodemailer"
import { z } from "zod"
import { pool } from "../config/db.js"
import { requireAuth } from "../middleware/auth.js"
import { createToken } from "../middleware/auth.js"
import { isEmailConfigured, sendRegistrationVerificationCode } from "../services/emailService.js"

const router = Router()
const registerSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.email().transform((value) => value.toLowerCase()),
  phone: z.string().trim().min(9).max(20),
  password: z.string().min(8).max(128),
  role: z.enum(["renter", "landlord"]),
  verificationCode: z.string().regex(/^\d{6}$/),
})
const publicUser = (row) => ({ id: row.id, name: row.name, email: row.email, phone: row.phone, role: row.role, initials: row.name.trim().split(/\s+/).slice(-2).map((part) => part[0]).join("").toUpperCase(), status: row.status, avatarUrl: row.avatar_url ?? undefined })
const session = (row) => ({ user: publicUser(row), token: createToken(row) })
const hashRegistrationCode = (email, salt, code) => crypto.createHmac("sha256", process.env.JWT_SECRET).update(salt + ":" + email + ":" + code).digest("hex")

router.post("/register/request-code", async (req, res) => {
  const input = z.object({ email: z.email().transform((value) => value.toLowerCase()) }).parse(req.body)
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) return res.status(503).json({ error: "JWT_SECRET chưa được cấu hình an toàn.", code: "AUTH_NOT_CONFIGURED" })
  if (!isEmailConfigured()) return res.status(503).json({ error: "Chưa cấu hình dịch vụ email để gửi mã xác minh.", code: "EMAIL_NOT_CONFIGURED" })
  const { rows: existingUsers } = await pool.query("SELECT 1 FROM users WHERE lower(email)=$1 LIMIT 1", [input.email])
  if (existingUsers[0]) return res.status(409).json({ error: "Email này đã được đăng ký. Hãy đăng nhập hoặc khôi phục mật khẩu." })

  const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, "0")
  const salt = crypto.randomBytes(16).toString("hex")
  const codeHash = hashRegistrationCode(input.email, salt, code)
  const client = await pool.connect()
  let verificationId
  try {
    await client.query("BEGIN")
    await client.query("DELETE FROM registration_email_verifications WHERE expires_at < now() - interval '1 day'")
    await client.query("UPDATE registration_email_verifications SET used_at=now() WHERE email=$1 AND used_at IS NULL", [input.email])
    const { rows } = await client.query(
      "INSERT INTO registration_email_verifications(email,code_salt,code_hash,expires_at) VALUES($1,$2,$3,now()+interval '15 minutes') RETURNING id",
      [input.email, salt, codeHash],
    )
    verificationId = rows[0].id
    await client.query("COMMIT")
  } catch (error) {
    await client.query("ROLLBACK")
    throw error
  } finally {
    client.release()
  }

  try {
    await sendRegistrationVerificationCode(input.email, code)
  } catch {
    await pool.query("UPDATE registration_email_verifications SET used_at=now() WHERE id=$1", [verificationId])
    return res.status(503).json({ error: "Không gửi được email xác minh. Hãy kiểm tra cấu hình SMTP và thử lại.", code: "EMAIL_DELIVERY_FAILED" })
  }
  res.json({ message: "Mã xác minh đã được gửi tới email của bạn. Mã có hiệu lực trong 15 phút." })
})

router.post("/register", async (req, res) => {
  const input = registerSchema.parse(req.body)
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) return res.status(503).json({ error: "JWT_SECRET chưa được cấu hình an toàn.", code: "AUTH_NOT_CONFIGURED" })
  const passwordHash = await bcrypt.hash(input.password, 12)
  const client = await pool.connect()
  try {
    await client.query("BEGIN")
    const { rows: existingUsers } = await client.query(
      "SELECT 1 FROM users WHERE lower(email)=$1 OR regexp_replace(phone, '[[:space:]]', '', 'g')=$2 LIMIT 1",
      [input.email, input.phone.replace(/\s/g, "")],
    )
    if (existingUsers[0]) {
      await client.query("ROLLBACK")
      return res.status(409).json({ error: "Email hoặc số điện thoại đã được đăng ký." })
    }
    const { rows: codes } = await client.query(
      "SELECT id,code_salt,code_hash FROM registration_email_verifications WHERE email=$1 AND used_at IS NULL AND expires_at>now() AND attempt_count<5 ORDER BY created_at DESC LIMIT 1 FOR UPDATE",
      [input.email],
    )
    const verification = codes[0]
    if (!verification) {
      await client.query("ROLLBACK")
      return res.status(400).json({ error: "Mã xác minh không hợp lệ hoặc đã hết hạn. Hãy yêu cầu mã mới." })
    }
    const expectedHash = Buffer.from(verification.code_hash, "hex")
    const suppliedHash = Buffer.from(hashRegistrationCode(input.email, verification.code_salt, input.verificationCode), "hex")
    if (expectedHash.length !== suppliedHash.length || !crypto.timingSafeEqual(expectedHash, suppliedHash)) {
      await client.query(
        "UPDATE registration_email_verifications SET attempt_count=attempt_count+1,used_at=CASE WHEN attempt_count+1>=5 THEN now() ELSE used_at END WHERE id=$1",
        [verification.id],
      )
      await client.query("COMMIT")
      return res.status(400).json({ error: "Mã xác minh không đúng hoặc đã hết lượt thử." })
    }
    const { rows } = await client.query(
      "INSERT INTO users(name,email,phone,password_hash,role,email_verified_at) VALUES($1,$2,$3,$4,$5,now()) RETURNING *",
      [input.name, input.email, input.phone.replace(/\s/g, ""), passwordHash, input.role],
    )
    await client.query("UPDATE registration_email_verifications SET used_at=now() WHERE id=$1", [verification.id])
    await client.query("COMMIT")
    res.status(201).json(session(rows[0]))
  } catch (error) {
    await client.query("ROLLBACK")
    if (error?.code === "23505") return res.status(409).json({ error: "Email hoặc số điện thoại đã được đăng ký." })
    throw error
  } finally {
    client.release()
  }
})

router.post("/login", async (req, res) => {
  const input = z.object({ identifier: z.string().trim().min(1), password: z.string().min(1), role: z.enum(["renter", "landlord", "admin"]).optional() }).parse(req.body)
  const identifier = input.identifier.toLowerCase()
  const { rows } = await pool.query("SELECT * FROM users WHERE lower(email)=$1 OR regexp_replace(phone, '[[:space:]]', '', 'g')=$2 LIMIT 1", [identifier, input.identifier.replace(/\s/g, "")])
  const account = rows[0]
  if (!account || !(await bcrypt.compare(input.password, account.password_hash)) || (input.role && input.role !== account.role)) return res.status(401).json({ error: "Thông tin đăng nhập chưa chính xác." })
  if (account.status === "locked") return res.status(403).json({ error: "Tài khoản đang bị khóa. Vui lòng liên hệ quản trị viên." })
  res.json(session(account))
})

router.get("/me", requireAuth, async (req, res) => {
  const { rows } = await pool.query("SELECT * FROM users WHERE id=$1", [req.user.id])
  if (!rows[0] || rows[0].status !== "active") return res.status(401).json({ error: "Tài khoản không hoạt động." })
  res.json({ user: publicUser(rows[0]) })
})

router.patch("/me", requireAuth, async (req, res) => {
  const input = z.object({ name: z.string().trim().min(2).max(120), email: z.email().transform((value) => value.toLowerCase()), phone: z.string().trim().min(9).max(20) }).parse(req.body)
  const { rows } = await pool.query("UPDATE users SET name=$2,email=$3,phone=$4,updated_at=now() WHERE id=$1 RETURNING *", [req.user.id, input.name, input.email, input.phone.replace(/\s/g, "")])
  if (!rows[0]) return res.status(404).json({ error: "Không tìm thấy tài khoản." })
  res.json({ user: publicUser(rows[0]) })
})

router.post("/change-password", requireAuth, async (req, res) => {
  const input = z.object({ currentPassword: z.string().min(1), newPassword: z.string().min(8).max(128) }).parse(req.body)
  const { rows } = await pool.query("SELECT password_hash FROM users WHERE id=$1", [req.user.id])
  if (!rows[0] || !(await bcrypt.compare(input.currentPassword, rows[0].password_hash))) return res.status(400).json({ error: "Mật khẩu hiện tại chưa chính xác." })
  const passwordHash = await bcrypt.hash(input.newPassword, 12)
  await pool.query("UPDATE users SET password_hash=$2,updated_at=now() WHERE id=$1", [req.user.id, passwordHash])
  res.json({ message: "Đổi mật khẩu thành công." })
})

router.post("/password-reset/request", async (req, res) => {
  const input = z.object({ identifier: z.string().trim().min(3) }).parse(req.body)
  if (!process.env.SMTP_HOST || !process.env.SMTP_FROM) return res.status(503).json({ error: "Chưa cấu hình dịch vụ email để gửi mã đặt lại mật khẩu.", code: "EMAIL_NOT_CONFIGURED" })
  const { rows } = await pool.query("SELECT id,email FROM users WHERE lower(email)=lower($1) OR regexp_replace(phone, '[[:space:]]', '', 'g')=$2 LIMIT 1", [input.identifier, input.identifier.replace(/\s/g, "")])
  if (!rows[0]) return res.json({ message: "Nếu thông tin khớp tài khoản, mã xác nhận sẽ được gửi qua email đã đăng ký." })
  const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, "0")
  const tokenHash = crypto.createHash("sha256").update(`${rows[0].id}:${code}`).digest("hex")
  const client = await pool.connect()
  try {
    await client.query("BEGIN")
    await client.query("UPDATE password_reset_tokens SET used_at=now() WHERE user_id=$1 AND used_at IS NULL", [rows[0].id])
    await client.query("INSERT INTO password_reset_tokens(user_id,token_hash,expires_at) VALUES($1,$2,now()+interval '15 minutes')", [rows[0].id, tokenHash])
    await client.query("COMMIT")
  } catch (error) {
    await client.query("ROLLBACK")
    throw error
  } finally {
    client.release()
  }
  const transporter = nodemailer.createTransport({ host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT || 587), secure: process.env.SMTP_SECURE === "true", auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } : undefined })
  try {
    await transporter.sendMail({ from: process.env.SMTP_FROM, to: rows[0].email, subject: "Mã đặt lại mật khẩu Trọ Ơi", text: `Mã xác nhận của bạn là ${code}. Mã có hiệu lực trong 15 phút.` })
  } catch {
    await pool.query("UPDATE password_reset_tokens SET used_at=now() WHERE token_hash=$1", [tokenHash])
    return res.status(503).json({ error: "Không gửi được email đặt lại mật khẩu. Vui lòng thử lại sau.", code: "EMAIL_DELIVERY_FAILED" })
  }
  res.json({ message: "Mã xác nhận đã được gửi đến email đã đăng ký." })
})

router.post("/password-reset/confirm", async (req, res) => {
  const input = z.object({ identifier: z.string().trim().min(3), code: z.string().regex(/^\d{6}$/), password: z.string().min(8).max(128) }).parse(req.body)
  const { rows } = await pool.query("SELECT id FROM users WHERE lower(email)=lower($1) OR regexp_replace(phone, '[[:space:]]', '', 'g')=$2 LIMIT 1", [input.identifier, input.identifier.replace(/\s/g, "")])
  const user = rows[0]
  if (!user) return res.status(400).json({ error: "Mã xác nhận không hợp lệ hoặc đã hết hạn." })
  const tokenHash = crypto.createHash("sha256").update(`${user.id}:${input.code}`).digest("hex")
  const passwordHash = await bcrypt.hash(input.password, 12)
  const client = await pool.connect()
  try {
    await client.query("BEGIN")
    const tokenResult = await client.query("UPDATE password_reset_tokens SET used_at=now() WHERE user_id=$1 AND token_hash=$2 AND used_at IS NULL AND expires_at>now() RETURNING id", [user.id, tokenHash])
    if (!tokenResult.rowCount) {
      await client.query("ROLLBACK")
      return res.status(400).json({ error: "Mã xác nhận không hợp lệ hoặc đã hết hạn." })
    }
    await client.query("UPDATE users SET password_hash=$2,updated_at=now() WHERE id=$1", [user.id, passwordHash])
    await client.query("COMMIT")
  } catch (error) {
    await client.query("ROLLBACK")
    throw error
  } finally {
    client.release()
  }
  res.json({ message: "Đặt lại mật khẩu thành công." })
})

export default router
