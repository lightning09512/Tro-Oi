import { Router } from "express"
import multer from "multer"
import { randomUUID } from "node:crypto"
import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { v2 as cloudinary } from "cloudinary"
import { requireAuth, requireRole } from "../middleware/auth.js"

const router = Router()
const localUploadsDir = fileURLToPath(new URL("../uploads/", import.meta.url))
const extensionByMimeType = new Map([["image/jpeg", "jpg"], ["image/png", "png"], ["image/webp", "webp"], ["image/avif", "avif"]])
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 3 * 1024 * 1024, files: 1 }, fileFilter: (_req, file, done) => {
  if (!extensionByMimeType.has(file.mimetype)) return done(new Error("Chỉ nhận ảnh JPG, PNG, WebP hoặc AVIF."))
  done(null, true)
} })

router.post("/image", requireAuth, requireRole("renter", "landlord"), upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Vui lòng chọn một ảnh." })
  const hasCloudinary = Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET)
  if (!hasCloudinary) {
    if (process.env.NODE_ENV === "production") return res.status(503).json({ error: "Cần cấu hình Cloudinary để lưu ảnh trên máy chủ production.", code: "UPLOAD_NOT_CONFIGURED" })
    const extension = extensionByMimeType.get(req.file.mimetype)
    const filename = `${randomUUID()}.${extension}`
    await mkdir(localUploadsDir, { recursive: true })
    await writeFile(path.join(localUploadsDir, filename), req.file.buffer, { flag: "wx" })
    return res.status(201).json({ url: `/uploads/${filename}`, storage: "local" })
  }
  cloudinary.config({ cloud_name: process.env.CLOUDINARY_CLOUD_NAME, api_key: process.env.CLOUDINARY_API_KEY, api_secret: process.env.CLOUDINARY_API_SECRET })
  const result = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder: "tro-oi", resource_type: "image", allowed_formats: ["jpg", "jpeg", "png", "webp", "avif"] }, (error, value) => error ? reject(error) : resolve(value))
    stream.end(req.file.buffer)
  })
  res.status(201).json({ url: result.secure_url, publicId: result.public_id })
})
export default router
