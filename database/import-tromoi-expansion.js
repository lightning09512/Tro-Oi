import "dotenv/config"
import { readdir } from "node:fs/promises"
import path from "node:path"
import pg from "pg"
import { tromoiExpansionListings } from "./tromoi-expansion-data.js"
import { withDemoEstimates } from "./tromoi-estimates.js"

if (!process.env.DATABASE_URL) throw new Error("Cần cấu hình DATABASE_URL trong .env trước khi nhập dữ liệu.")

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const client = await pool.connect()
let inserted = 0
let skipped = 0

try {
  await client.query("BEGIN")
  for (const listing of tromoiExpansionListings) {
    const prepared = withDemoEstimates(listing)
    const directory = path.join(process.cwd(), "public", "images", "tromoi", listing.folder)
    const names = (await readdir(directory)).filter((name) => /^anh-\d+\.webp$/i.test(name)).sort()
    if (names.length < 3) throw new Error(`${listing.id} chưa có đủ ảnh cục bộ; chạy downloader trước.`)
    const gallery = names.map((name) => `/images/tromoi/${listing.folder}/${name}`)
    const result = await client.query(
      `INSERT INTO listings(
         id,owner_id,title,description,price_vnd,deposit_text,area_m2,area_is_estimate,location,
         room_type,amenities,image_url,gallery,latitude,longitude,status,source_name,source_url,source_checked_at
       ) VALUES($1,NULL,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NULL,NULL,'active','Trọ Mới',$13,now())
       ON CONFLICT(id) DO NOTHING RETURNING id`,
      [prepared.id, prepared.title, prepared.description, prepared.price, prepared.deposit, prepared.area,
        prepared.areaIsEstimate, prepared.location, prepared.type, JSON.stringify(prepared.amenities), gallery[0], JSON.stringify(gallery), prepared.sourceUrl],
    )
    if (result.rowCount) inserted += 1
    else skipped += 1
  }
  await client.query("COMMIT")
} catch (error) {
  await client.query("ROLLBACK")
  throw error
} finally {
  client.release()
  await pool.end()
}

console.log(`Đã thêm ${inserted} tin mới; bỏ qua ${skipped} tin đã tồn tại. Tổng album mới: ${tromoiExpansionListings.reduce((sum, listing) => sum + listing.photoLimit, 0)} ảnh dự kiến.`)
