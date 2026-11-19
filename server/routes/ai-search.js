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

const DISTRICT_PATTERNS = [
  { key: "Thủ Đức", patterns: ["thủ đức", "thu duc", "tp thủ đức", "tp. thủ đức", "thành phố thủ đức", "quận 9", "quan 9", "quận 2", "quan 2", "long trường", "linh chiểu", "linh trung", "đặng văn bi", "võ văn ngân", "làng đại học", "khu công nghệ cao", "spkt", "hcmute"] },
  { key: "Bình Thạnh", patterns: ["bình thạnh", "binh thanh", "ung văn khiêm", "nơ trang long", "d2", "nguyễn gia trí"] },
  { key: "Gò Vấp", patterns: ["gò vấp", "go vap", "quang trung", "nguyễn văn nghi", "huỳnh khương an"] },
  { key: "Tân Bình", patterns: ["tân bình", "tan binh", "nguyễn thái bình", "huỳnh văn nghệ"] },
  { key: "Tân Phú", patterns: ["tân phú", "tan phu", "huit", "hufi", "tây thạnh"] },
  { key: "Quận 1", patterns: ["quận 1", "quan 1"] },
  { key: "Quận 3", patterns: ["quận 3", "quan 3"] },
  { key: "Quận 6", patterns: ["quận 6", "quan 6", "hồng bàng"] },
  { key: "Quận 7", patterns: ["quận 7", "quan 7", "lê văn lương", "tân hưng"] },
  { key: "Quận 8", patterns: ["quận 8", "quan 8", "bùi minh trực"] },
  { key: "Quận 10", patterns: ["quận 10", "quan 10", "trần thiện chánh"] },
  { key: "Phú Nhuận", patterns: ["phú nhuận", "phu nhuan", "nguyễn văn trỗi"] },
  { key: "Cầu Giấy", patterns: ["cầu giấy", "cau giay", "nguyễn khánh toàn", "trần thái tông"] },
  { key: "Bắc Từ Liêm", patterns: ["bắc từ liêm", "bac tu liem", "đông ngạc", "hoàng tăng bí"] },
  { key: "Nam Từ Liêm", patterns: ["nam từ liêm", "nam tu liem", "tây mỗ", "đại mỗ", "smart city"] },
  { key: "Tây Hồ", patterns: ["tây hồ", "tay ho", "âu cơ", "tô ngọc vân"] },
  { key: "Đống Đa", patterns: ["đống đa", "dong da", "tôn đức thắng"] },
  { key: "Hai Bà Trưng", patterns: ["hai bà trưng", "hai ba trung", "hồng mai"] },
  { key: "Hoàng Mai", patterns: ["hoàng mai", "hoang mai"] },
  { key: "Ba Đình", patterns: ["ba đình", "ba dinh", "phan kế bính"] },
  { key: "Liên Chiểu", patterns: ["liên chiểu", "lien chieu", "trần nguyên đán", "mia plaza", "hòa khánh"] },
  { key: "Sơn Trà", patterns: ["sơn trà", "son tra", "chính hữu", "mân thái", "phước mỹ"] },
  { key: "Hải Châu", patterns: ["hải châu", "hai chau", "tạ hiện", "hòa cường"] },
  { key: "Ngũ Hành Sơn", patterns: ["ngũ hành sơn", "ngu hanh son", "đoàn khuê", "sun cosmo", "fpt city"] },
  { key: "Đà Nẵng", patterns: ["đà nẵng", "da nang"] },
  { key: "Hà Nội", patterns: ["hà nội", "ha noi"] },
  { key: "TP. Hồ Chí Minh", patterns: ["hồ chí minh", "hcm", "tphcm", "sài gòn", "tp.hcm"] }
]

const AMENITY_RULES = [
  { name: "Hồ bơi", pattern: /(?:hồ bơi|bể bơi|bơi)/i },
  { name: "Sân xe", pattern: /(?:sân xe|bãi xe|bãi để xe|chỗ để xe|khu để xe|chỗ đỗ ô tô|chỗ để ô tô|giữ xe)/i },
  { name: "Máy nước nóng", pattern: /(?:máy nước nóng|nước nóng|nóng lạnh|bình nóng lạnh)/i },
  { name: "Máy lạnh", pattern: /(?:máy lạnh|điều hòa|máy điều hòa|ac)/i },
  { name: "Máy giặt", pattern: /(?:máy giặt|máy sấy)/i },
  { name: "Tủ lạnh", pattern: /(?:tủ lạnh)/i },
  { name: "Nội thất đầy đủ", pattern: /(?:nội thất|full đồ|đầy đủ đồ|full nội thất)/i },
  { name: "Gác lửng", pattern: /(?:gác|gác lửng|gác xép|gác suốt)/i },
  { name: "Ban công", pattern: /(?:ban công)/i },
  { name: "Cửa sổ", pattern: /(?:cửa sổ|thoáng đãng)/i },
  { name: "Thang máy", pattern: /(?:thang máy)/i },
  { name: "Khóa vân tay", pattern: /(?:khóa vân tay|khóa từ|vân tay)/i },
  { name: "WC riêng", pattern: /(?:wc riêng|vệ sinh riêng|khép kín|toilet riêng|nhà vệ sinh riêng)/i },
  { name: "Khu bếp riêng", pattern: /(?:bếp|nấu ăn|kệ bếp|bếp riêng)/i },
  { name: "Wi-Fi", pattern: /(?:wifi|wi-fi|internet|mạng)/i },
  { name: "Camera an ninh", pattern: /(?:camera|bảo vệ|an ninh)/i },
  { name: "Giờ giấc tự do", pattern: /(?:tự do|không chung chủ|giờ giấc tự do)/i },
  { name: "Sân phơi", pattern: /(?:sân phơi|phơi đồ|khu phơi đồ)/i },
  { name: "Phòng gym", pattern: /(?:gym|phòng gym|tập gym)/i }
]

export const localFallbackParse = (query) => {
  const text = query.toLowerCase()

  let district = undefined
  for (const item of DISTRICT_PATTERNS) {
    if (item.patterns.some((p) => text.includes(p))) {
      district = item.key
      break
    }
  }

  let minPrice = undefined
  let maxPrice = undefined

  const rangeMatch = text.match(/(?:từ\s*)?(\d+(?:[.,]\d+)?)\s*(?:đến|-)\s*(\d+(?:[.,]\d+)?)\s*(?:triệu|tr)/i)
  if (rangeMatch) {
    minPrice = Number(rangeMatch[1].replace(",", "."))
    maxPrice = Number(rangeMatch[2].replace(",", "."))
  } else {
    const underMatch = text.match(/(?:dưới|tối đa|không quá|<=?|<|nhỏ hơn)\s*(\d+(?:[.,]\d+)?)\s*(?:triệu|tr)/i)
    const approxMatch = text.match(/(?:tầm|khoảng|cỡ|quanh|giá|phòng)\s*(\d+(?:[.,]\d+)?)\s*(?:triệu|tr)/i)
    const exactMatch = text.match(/(\d+(?:[.,]\d+)?)\s*(?:triệu|tr)\b/i)

    if (underMatch) {
      maxPrice = Number(underMatch[1].replace(",", "."))
    } else if (approxMatch) {
      maxPrice = Number(approxMatch[1].replace(",", "."))
    } else if (exactMatch) {
      maxPrice = Number(exactMatch[1].replace(",", "."))
    }
  }

  const amenities = []
  for (const rule of AMENITY_RULES) {
    if (rule.pattern.test(text)) {
      amenities.push(rule.name)
    }
  }

  let roomType = undefined
  if (/ký túc xá|ktx/i.test(text)) roomType = "Ký túc xá"
  else if (/ở ghép/i.test(text)) roomType = "Ở ghép"
  else if (/căn hộ|chung cư|studio/i.test(text)) roomType = "Căn hộ"
  else if (/nhà nguyên căn|nguyên căn/i.test(text)) roomType = "Nhà nguyên căn"

  return {
    query,
    filters: {
      district,
      min_price: minPrice ? minPrice * 1_000_000 : undefined,
      max_price: maxPrice ? maxPrice * 1_000_000 : undefined,
      room_type: roomType,
      amenities,
    }
  }
}

export const extractFilters = (parsed) => {
  const source = parsed?.filters && typeof parsed.filters === "object" ? parsed.filters : parsed
  const amenityNames = {
    air_conditioner: "Máy lạnh",
    loft: "Gác lửng",
    balcony: "Ban công",
    washing_machine: "Máy giặt",
    swimming_pool: "Hồ bơi",
    water_heater: "Máy nước nóng",
    parking: "Sân xe",
    refrigerator: "Tủ lạnh",
    elevator: "Thang máy",
    private_wc: "WC riêng",
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

export const parseSearch = async (query) => {
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

export async function executeAiSearch(query) {
  const parsed = await parseSearch(query)
  const filters = extractFilters(parsed)
  let filtered = await searchListings(filters)
  let fallbackNote = null

  // Smart fallback: if 0 results found
  if (filtered.rows.length === 0) {
    // Fallback 1: If location + amenities returned 0, search across all locations with the amenities
    if (filters.location && filters.amenities) {
      const fallbackResult = await searchListings({
        ...filters,
        location: undefined,
      })
      if (fallbackResult.rows.length > 0) {
        filtered = fallbackResult
        fallbackNote = `Hiện tại khu vực ${filters.location} chưa có phòng có tiện ích này, nhưng hệ thống có phòng ở khu vực khác đáp ứng đúng yêu cầu:`
      }
    }

    // Fallback 2: If price threshold returned 0, try relaxing price by +25%
    if (filtered.rows.length === 0 && filters.maxPrice) {
      const fallbackResult = await searchListings({
        ...filters,
        maxPrice: Number((filters.maxPrice * 1.25).toFixed(1)),
      })
      if (fallbackResult.rows.length > 0) {
        filtered = fallbackResult
        fallbackNote = `Không tìm thấy phòng ở mức giá dưới ${filters.maxPrice} triệu, nhưng có phòng ở mức giá gần kề:`
      }
    }
  }

  const ranked = filtered.rows.length ? await rankListings(query, filtered.rows) : null
  const rankedIndexes = Array.isArray(ranked?.results)
    ? ranked.results.map((item) => item.index).filter((index) => Number.isInteger(index) && index >= 0 && index < filtered.rows.length)
    : null
  const ids = rankIds(ranked)
  const byId = new Map(filtered.rows.map((row) => [String(row.id), row]))
  const ordered = rankedIndexes
    ? [...rankedIndexes.map((index) => filtered.rows[index]), ...filtered.rows.filter((_, index) => !rankedIndexes.includes(index))]
    : [...ids.map((id) => byId.get(id)).filter(Boolean), ...filtered.rows.filter((row) => !ids.includes(String(row.id)))]

  return {
    items: ordered.map(asListing),
    page: 1,
    limit: filtered.limit,
    total: filtered.total,
    filters,
    fallbackNote,
  }
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
    const result = await executeAiSearch(query)
    res.json(result)
  } catch (error) {
    console.error(error)
    res.status(error.name === "ZodError" ? 400 : 502).json({ error: "Không thể thực hiện tìm kiếm AI" })
  }
})

export default router
