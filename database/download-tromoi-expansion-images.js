import { mkdir, readdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { tromoiExpansionListings } from "./tromoi-expansion-data.js"

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const imageRoot = path.join(projectRoot, "public", "images", "tromoi")
const queue = [...tromoiExpansionListings]
let completed = 0
const failures = []

async function downloadListing(listing) {
  const page = await fetch(listing.sourceUrl, {
    headers: { "user-agent": "Tro-Oi-Development-Demo/1.0" },
  })
  if (!page.ok) throw new Error(`Tin nguồn trả về HTTP ${page.status}: ${listing.sourceUrl}`)
  const html = await page.text()
  const sourceImages = []

  for (const [, anchor] of html.matchAll(/(<a\b[^>]*>)/gi)) {
    if (!/data-fancybox=["']gallery["']/i.test(anchor)) continue
    const href = anchor.match(/href=["']([^"']+\.(?:webp|jpe?g|png)(?:\?[^"']*)?)["']/i)?.[1]
    if (!href) continue
    const imageUrl = new URL(href, listing.sourceUrl)
    if (imageUrl.hostname !== "tromoi.com") continue
    if (!sourceImages.includes(imageUrl.href)) sourceImages.push(imageUrl.href)
  }

  const selectedImages = sourceImages.slice(0, listing.photoLimit)
  if (selectedImages.length < 3) {
    throw new Error(`Album có ít hơn 3 ảnh dùng được (${selectedImages.length}): ${listing.sourceUrl}`)
  }

  const folder = path.join(imageRoot, listing.folder)
  await mkdir(folder, { recursive: true })
  const existing = new Set(await readdir(folder))
  for (let index = 0; index < selectedImages.length; index += 1) {
    const filename = `anh-${String(index + 1).padStart(2, "0")}.webp`
    if (existing.has(filename)) continue
    const response = await fetch(selectedImages[index], {
      headers: { referer: listing.sourceUrl, "user-agent": "Tro-Oi-Development-Demo/1.0" },
    })
    if (!response.ok || !response.headers.get("content-type")?.startsWith("image/")) {
      throw new Error(`Không tải được ảnh ${index + 1} của ${listing.id}: HTTP ${response.status}`)
    }
    await writeFile(path.join(folder, filename), Buffer.from(await response.arrayBuffer()))
  }

  completed += selectedImages.length
  console.log(`${listing.id}: ${selectedImages.length} ảnh`)
}

async function worker() {
  while (queue.length) {
    const listing = queue.shift()
    try {
      await downloadListing(listing)
    } catch (error) {
      failures.push(`${listing.id}: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
}

await Promise.all(Array.from({ length: 3 }, worker))
if (failures.length) throw new AggregateError(failures.map((message) => new Error(message)), failures.join("\n"))
console.log(`Đã kiểm tra và lưu ${completed} ảnh thuộc ${tromoiExpansionListings.length} album Trọ Mới.`)
