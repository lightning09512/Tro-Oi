import { Router } from "express"
import { z } from "zod"
import { asListing, searchListings } from "./listings.js"

const router = Router()
const AI_URL = process.env.AI_SERVICE_URL || "http://127.0.0.1:8000"

const searchInput = z.object({
  query: z.string().trim().min(1).max(1000),
})

const toPriceInMillions = (value) => {
  const number = Number(value)
  if (!Number.isFinite(number) || number < 0) return undefined
  return number > 500 ? number / 1_000_000 : number
}

const firstValue = (source, ...keys) => keys.map((key) => source?.[key]).find((value) => value !== undefined && value !== null)

const extractFilters = (parsed) => {
  const source = parsed?.filters && typeof parsed.filters === "object" ? parsed.filters : parsed
  const amenityNames = {
    air_conditioner: "Máy lạnh",
    loft: "Gác lửng",
    balcony: "Ban công",
    washing_machine: "Máy giặt",
  }
  const amenities = firstValue(source, "amenities", "required_amenities", "requiredAmenities")
  const district = firstValue(source, "district", "location")
  const normalizedAmenities = Array.isArray(amenities)
    ? amenities.map((value) => amenityNames[value] ?? value).filter((value) => typeof value === "string")
    : []
  const filters = {
    q: typeof firstValue(source, "q", "keyword", "search") === "string" ? firstValue(source, "q", "keyword", "search") : undefined,
    location: typeof district === "string" ? district : undefined,
    type: typeof firstValue(source, "type", "room_type", "roomType") === "string" ? firstValue(source, "type", "room_type", "roomType") : undefined,
    minPrice: toPriceInMillions(firstValue(source, "minPrice", "min_price")),
    maxPrice: toPriceInMillions(firstValue(source, "maxPrice", "max_price")),
    minArea: Number(firstValue(source, "minArea", "min_area")) || undefined,
    maxArea: Number(firstValue(source, "maxArea", "max_area")) || undefined,
    amenities: normalizedAmenities.slice(0, 40).join(",") || undefined,
    sort: "newest",
    page: 1,
    limit: 60,
  }
  return Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== undefined))
}

const localFallbackParse = (query) => {
  const text = query.toLowerCase()
  const districts = ["bình thạnh", "thủ đức", "gò vấp", "tân bình", "quận 1", "quận 7", "quận 3", "quận 10", "quận 12", "phú nhuận", "tân phú", "bình tân", "hóc môn", "nhà bè"]
  let district = undefined
  for (const d of districts) {
    if (text.includes(d)) { district = d; break; }
  }
  const priceMatch = text.match(/(?:dưới|tối đa|không quá|tầm|khoảng)\s*(\d+(?:[.,]\d+)?)\s*(?:triệu|tr)/i)
  const maxPrice = priceMatch ? Number(priceMatch[1].replace(",", ".")) : undefined
  
  const amenities = []
  if (/máy lạnh|điều hòa/i.test(text)) amenities.push("Máy lạnh")
  if (/gác/i.test(text)) amenities.push("Gác lửng")
  if (/ban công/i.test(text)) amenities.push("Ban công")
  if (/máy giặt/i.test(text)) amenities.push("Máy giặt")

  return {
    query,
    filters: {
      district,
      max_price: maxPrice ? maxPrice * 1_000_000 : undefined,
      amenities,
    }
  }
}

const parseSearch = async (query) => {
  try {
    const response = await fetch(`${AI_URL}/parse-search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
      signal: AbortSignal.timeout(3000),
    })
    if (response.ok) return await response.json()
  } catch (err) {
    // AI service not available, fallback to local rule-based parsing
  }
  return localFallbackParse(query)
}

const rankListings = async (query, rows) => {
  try {
    const response = await fetch(`${AI_URL}/rank`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query,
        descriptions: rows.map((row) => [row.title, row.description, row.location, row.room_type, ...(row.amenities ?? [])].filter(Boolean).join(" | ")),
      }),
      signal: AbortSignal.timeout(5000),
    })
    if (response.ok) return await response.json()
  } catch (err) {
    // Ranking service unavailable, return null to maintain database query ordering
  }
  return null
}

const rankIds = (ranked) => {
  const values = ranked?.ranked_ids ?? ranked?.rankedIds ?? ranked?.ids
  if (Array.isArray(values)) return values.map(String)
  if (Array.isArray(ranked?.items)) return ranked.items.map((item) => String(item.id ?? item.listing_id)).filter(Boolean)
  if (Array.isArray(ranked?.results)) return ranked.results.map((item) => item.index).filter((index) => Number.isInteger(index)).map(String)
  return []
}

router.post("/parse-search", async (req, res) => {
  try {
    const { query } = searchInput.parse(req.body)
    res.json(await parseSearch(query))
  } catch (error) {
    console.error(error)
    res.status(error.name === "ZodError" ? 400 : 502).json({ error: "Không thể phân tích yêu cầu tìm kiếm" })
  }
})

router.post("/search", async (req, res) => {
  try {
    const { query } = searchInput.parse(req.body)
    const parsed = await parseSearch(query)
    const filtered = await searchListings(extractFilters(parsed))
    const ranked = filtered.rows.length ? await rankListings(query, filtered.rows) : null
    const rankedIndexes = Array.isArray(ranked?.results)
      ? ranked.results.map((item) => item.index).filter((index) => Number.isInteger(index) && index >= 0 && index < filtered.rows.length)
      : null
    const ids = rankIds(ranked)
    const byId = new Map(filtered.rows.map((row) => [String(row.id), row]))
    const ordered = rankedIndexes
      ? [...rankedIndexes.map((index) => filtered.rows[index]), ...filtered.rows.filter((_, index) => !rankedIndexes.includes(index))]
      : [...ids.map((id) => byId.get(id)).filter(Boolean), ...filtered.rows.filter((row) => !ids.includes(String(row.id)))]
    res.json({ items: ordered.map(asListing), page: 1, limit: filtered.limit, total: filtered.total, filters: extractFilters(parsed) })
  } catch (error) {
    console.error(error)
    res.status(error.name === "ZodError" ? 400 : 502).json({ error: "Không thể thực hiện tìm kiếm AI" })
  }
})

export default router
