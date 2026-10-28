import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react"
import { Link, useSearchParams } from "react-router"
import { Button, Icon, RoomCard } from "@/components/common/legacy"
import { usePlatform, type RentalListing } from "@/contexts/PlatformContext"
import type { ChangeEvent } from "react"
import { useNavigate } from "react-router"
import { apiRequest, isApiMode } from "@/services/apiClient"
import useDialogFocus from "@/hooks/useDialogFocus"
import LocationPicker from "@/components/common/LocationPicker"
import { isValidMapPosition } from "@/utils/mapCoordinates"
import { RoomCardSkeletonGrid } from "@/components/common/Skeletons"

const RoomMap = lazy(() => import("@/components/maps/RoomMap"))

type SearchFilters = {
  location: string
  minPrice: string
  maxPrice: string
  areaRange: string
  roomType: string
  amenities: string[]
}

const defaultFilters: SearchFilters = {
  location: "TP. Hồ Chí Minh",
  minPrice: "",
  maxPrice: "",
  areaRange: "all",
  roomType: "all",
  amenities: [],
}

function readFilters(params: URLSearchParams): SearchFilters {
  return {
    location: params.get("location") ?? ((params.has("type") || params.has("q")) ? "" : defaultFilters.location),
    minPrice: params.get("minPrice") ?? "",
    maxPrice: params.get("maxPrice") ?? "",
    areaRange: params.get("areaRange") ?? "all",
    roomType: params.get("type") ?? "all",
    amenities: params.get("amenities")?.split(",").filter(Boolean) ?? [],
  }
}

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d").replace(/Đ/g, "D")
    .toLocaleLowerCase("vi")
    .trim()
}

function matchesArea(area: number | null, range: string) {
  if (range === "all") return true
  if (area === null) return false
  if (range === "under20") return area < 20
  if (range === "20-30") return area >= 20 && area <= 30
  if (range === "30-50") return area > 30 && area <= 50
  if (range === "over50") return area > 50
  return true
}

function distanceInKm(lat1: number, lng1: number, lat2?: number, lng2?: number) {
  if (typeof lat2 !== "number" || typeof lng2 !== "number" || ![lat1, lng1, lat2, lng2].every((value) => Number.isFinite(value))) return Number.POSITIVE_INFINITY
  const toRadians = (value: number) => (value * Math.PI) / 180
  const latitudeDelta = toRadians(lat2 - lat1)
  const longitudeDelta = toRadians(lng2 - lng1)
  const arc =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(longitudeDelta / 2) ** 2
  return 6371 * 2 * Math.atan2(Math.sqrt(arc), Math.sqrt(1 - arc))
}

function Filters({
  filters,
  onChange,
  onApply,
  onReset,
  roomTypes,
  amenities,
  hideApplyButton = false,
  idPrefix = "desktop",
}: {
  filters: SearchFilters
  onChange: (next: Partial<SearchFilters>) => void
  onApply: () => void
  onReset: () => void
  roomTypes: string[]
  amenities: string[]
  hideApplyButton?: boolean
  idPrefix?: string
}) {
  const updatePrice =
    (key: "minPrice" | "maxPrice") =>
    (event: ChangeEvent<HTMLInputElement>) => {
      onChange({ [key]: event.target.value })
    }

  const toggleAmenity = (amenity: string, checked: boolean) => {
    const next = checked
      ? [...filters.amenities, amenity]
      : filters.amenities.filter((value) => value !== amenity)
    onChange({ amenities: next })
  }

  return (
    <aside className="filters">
      <div className="filter-head">
        <h3>Bộ lọc tìm kiếm</h3>
        <button type="button" onClick={onReset}>
          Đặt lại
        </button>
      </div>
      <div className="filter-group">
        <span className="filter-label">Khu vực</span>
        <LocationPicker variant="filter" value={filters.location} onChange={(location) => onChange({ location })} />
      </div>
      <div className="filter-group">
        <label>Khoảng giá (triệu đồng/tháng)</label>
        <div className="price-range-fields">
          <input
            type="number"
            min="0"
            step="0.5"
            value={filters.minPrice}
            onChange={updatePrice("minPrice")}
            aria-label="Giá thấp nhất, triệu đồng"
            placeholder="Từ"
            autoComplete="off"
          />
          <span>đến</span>
          <input
            type="number"
            min="0"
            step="0.5"
            value={filters.maxPrice}
            onChange={updatePrice("maxPrice")}
            aria-label="Giá cao nhất, triệu đồng"
            placeholder="Đến"
            autoComplete="off"
          />
        </div>
      </div>
      <div className="filter-group">
        <label htmlFor={`${idPrefix}-filter-area`}>Diện tích</label>
        <select
          id={`${idPrefix}-filter-area`}
          className="filter-select"
          value={filters.areaRange}
          onChange={(event) => onChange({ areaRange: event.target.value })}
        >
          <option value="all">Tất cả diện tích</option>
          <option value="under20">Dưới 20 m²</option>
          <option value="20-30">20–30 m²</option>
          <option value="30-50">Trên 30–50 m²</option>
          <option value="over50">Trên 50 m²</option>
        </select>
      </div>
      <div className="filter-group">
        <label htmlFor={`${idPrefix}-filter-type`}>Loại phòng</label>
        <select
          id={`${idPrefix}-filter-type`}
          className="filter-select"
          value={filters.roomType}
          onChange={(event) => onChange({ roomType: event.target.value })}
        >
          <option value="all">Tất cả loại phòng</option>
          {roomTypes.map((type) => <option value={type} key={type}>{type}</option>)}
        </select>
      </div>
      <div className="filter-group">
        <label>Tiện ích</label>
        {amenities.map((amenity) => (
          <label className="check" key={amenity}>
            <input
              type="checkbox"
              checked={filters.amenities.includes(amenity)}
              onChange={(event) => toggleAmenity(amenity, event.target.checked)}
            />
            <span>{amenity}</span>
          </label>
        ))}
      </div>
      {!hideApplyButton && <Button onClick={onApply}>Áp dụng bộ lọc</Button>}
    </aside>
  )
}

export default function SearchPage() {
  const { listings, categories } = usePlatform()
  const roomTypes = categories
    .filter((item) => item.type === "Loại phòng" && item.status === "active" && item.name !== "Chuyển nhượng")
    .map((item) => item.name)
  const amenities = categories.filter((item) => item.type === "Tiện ích" && item.status === "active").map((item) => item.name)
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const queryString = searchParams.toString()
  const initialFilters = readFilters(searchParams)
  const [draftFilters, setDraftFilters] = useState(initialFilters)
  const [appliedFilters, setAppliedFilters] = useState(initialFilters)
  const [sort, setSort] = useState(searchParams.get("sort") ?? "newest")
  const [map, setMap] = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)
  const filterDialogRef = useRef<HTMLDivElement>(null)
  useDialogFocus(filterDialogRef, () => setFilterOpen(false), filterOpen)
  const [remoteRooms, setRemoteRooms] = useState<RentalListing[]>([])
  const [remoteTotal, setRemoteTotal] = useState(0)
  const [remotePage, setRemotePage] = useState(1)
  const [loadingRooms, setLoadingRooms] = useState(isApiMode)
  const [requestError, setRequestError] = useState("")
  const [filterError, setFilterError] = useState("")
  const [requestVersion, setRequestVersion] = useState(0)
  const keyword = searchParams.get("q")?.trim() ?? ""
  const latitude = Number(searchParams.get("lat"))
  const longitude = Number(searchParams.get("lng"))
  const requestedRadiusKm = Number(searchParams.get("radiusKm"))
  const radiusKm = Number.isFinite(requestedRadiusKm) && requestedRadiusKm >= 1 && requestedRadiusKm <= 100 ? requestedRadiusKm : 20
  const isNearSearch =
    searchParams.has("lat") &&
    searchParams.has("lng") &&
    isValidMapPosition(latitude, longitude)

  useEffect(() => {
    if (!isApiMode) return
    let current = true
    const params = new URLSearchParams({ page: String(remotePage), limit: "24" })
    if (appliedFilters.location) params.set("location", appliedFilters.location.replace(/^TP\.\s*/i, ""))
    if (keyword) params.set("q", keyword)
    if (appliedFilters.minPrice) params.set("minPrice", appliedFilters.minPrice)
    if (appliedFilters.maxPrice) params.set("maxPrice", appliedFilters.maxPrice)
    if (appliedFilters.roomType !== "all") params.set("type", appliedFilters.roomType)
    if (appliedFilters.amenities.length) params.set("amenities", appliedFilters.amenities.join(","))
    if (appliedFilters.areaRange === "under20") params.set("maxArea", "19.99")
    if (appliedFilters.areaRange === "20-30") { params.set("minArea", "20"); params.set("maxArea", "30") }
    if (appliedFilters.areaRange === "30-50") { params.set("minArea", "30.01"); params.set("maxArea", "50") }
    if (appliedFilters.areaRange === "over50") params.set("minArea", "50.01")
    if (isNearSearch) { params.set("lat", String(latitude)); params.set("lng", String(longitude)); params.set("radiusKm", String(radiusKm)) }
    params.set("sort", isNearSearch ? "nearby" : sort === "price-low" ? "price_asc" : sort === "price-high" ? "price_desc" : "newest")
    setLoadingRooms(true)
    setRequestError("")
    if (remotePage === 1) { setRemoteRooms([]); setRemoteTotal(0) }
    apiRequest<{ items: RentalListing[]; total: number }>(`listings?${params.toString()}`)
      .then((result) => {
        if (!current) return
        setRemoteRooms((items) => remotePage === 1 ? result.items : [...items, ...result.items])
        setRemoteTotal(result.total)
      })
      .catch((error) => { if (current) setRequestError(error instanceof Error ? error.message : "Không thể tải danh sách phòng.") })
      .finally(() => { if (current) setLoadingRooms(false) })
    return () => { current = false }
  }, [appliedFilters, sort, isNearSearch, latitude, longitude, radiusKm, remotePage, keyword, requestVersion])

  useEffect(() => {
    const params = new URLSearchParams(queryString)
    const nextFilters = readFilters(params)
    setDraftFilters(nextFilters)
    setAppliedFilters(nextFilters)
    setSort(params.get("sort") ?? "newest")
    setRemotePage(1)
  }, [queryString])

  const matchingRooms = useMemo(() => {
    const location = normalize(appliedFilters.location)
    const cityLocation = location.replace(/^tp\.\s*/i, "")
    const minPrice = Number(appliedFilters.minPrice)
    const maxPrice = Number(appliedFilters.maxPrice)
    return (isApiMode ? remoteRooms : listings)
      .filter((room) => room.status === "active" && room.type !== "Chuyển nhượng")
      .filter((room) => !isNearSearch || (Number.isFinite(room.latitude) && Number.isFinite(room.longitude)))
      .filter((room) => !isNearSearch || distanceInKm(latitude, longitude, room.latitude, room.longitude) <= radiusKm)
      .filter((room) => {
        const matchesLocation =
          !location ||
          isApiMode ||
          normalize(room.location).includes(cityLocation)
        const matchesMinPrice =
          !appliedFilters.minPrice || room.priceValue >= minPrice
        const matchesMaxPrice =
          !appliedFilters.maxPrice || room.priceValue <= maxPrice
        const matchesAmenities = appliedFilters.amenities.every((amenity) =>
          room.amenities.includes(amenity),
        )
        const matchesType =
          appliedFilters.roomType === "all" ||
          room.type === appliedFilters.roomType
        return (
          matchesLocation &&
          (!keyword || isApiMode || normalize(`${room.title} ${room.location} ${room.amenities.join(" ")}`).includes(normalize(keyword))) &&
          matchesMinPrice &&
          matchesMaxPrice &&
          matchesArea(room.areaValue, appliedFilters.areaRange) &&
          matchesAmenities &&
          matchesType
        )
      })
      .sort((a, b) => {
        if (isNearSearch) {
          return (
            distanceInKm(latitude, longitude, a.latitude, a.longitude) -
            distanceInKm(latitude, longitude, b.latitude, b.longitude)
          )
        }
        if (sort === "price-low") return a.priceValue - b.priceValue
        if (sort === "price-high") return b.priceValue - a.priceValue
        return 0
      })
  }, [appliedFilters, isNearSearch, latitude, longitude, radiusKm, sort, listings, remoteRooms, keyword])
  const locatedRooms = matchingRooms.filter((room): room is RentalListing & { latitude: number; longitude: number } => isValidMapPosition(room.latitude, room.longitude))

  const updateDraft = (next: Partial<SearchFilters>) => {
    setDraftFilters((current) => ({ ...current, ...next }))
  }

  const applyFilters = () => {
    const minimum = Number(draftFilters.minPrice)
    const maximum = Number(draftFilters.maxPrice)
    if (minimum < 0 || maximum < 0 || (draftFilters.minPrice && !Number.isFinite(minimum)) || (draftFilters.maxPrice && !Number.isFinite(maximum)) || (draftFilters.minPrice && draftFilters.maxPrice && minimum > maximum)) {
      setFilterError("Giá thấp nhất phải nhỏ hơn hoặc bằng giá cao nhất và không được âm.")
      return
    }
    setFilterError("")
    setRemotePage(1)
    const params = new URLSearchParams()
    if (keyword) params.set("q", keyword)
    if (draftFilters.location) params.set("location", draftFilters.location)
    if (draftFilters.minPrice) params.set("minPrice", draftFilters.minPrice)
    if (draftFilters.maxPrice) params.set("maxPrice", draftFilters.maxPrice)
    if (draftFilters.areaRange !== "all")
      params.set("areaRange", draftFilters.areaRange)
    if (draftFilters.roomType !== "all")
      params.set("type", draftFilters.roomType)
    if (draftFilters.amenities.length)
      params.set("amenities", draftFilters.amenities.join(","))
    if (isNearSearch) {
      params.set("lat", String(latitude))
      params.set("lng", String(longitude))
      params.set("radiusKm", String(radiusKm))
    }
    if (sort !== "newest") params.set("sort", sort)
    setSearchParams(params)
    setAppliedFilters(draftFilters)
    setFilterOpen(false)
  }

  const resetFilters = () => {
    setFilterError("")
    setRemotePage(1)
    setDraftFilters(defaultFilters)
    setAppliedFilters(defaultFilters)
    setSort("newest")
    setSearchParams({ location: defaultFilters.location })
  }

  const locationLabel = appliedFilters.location || "toàn quốc"

  return (
    <main className="page-bg public-search">
      <div className="container search-page">
        <div className="breadcrumbs">
          <Link to="/">Trang chủ</Link> <span>/</span> Tìm phòng tại {locationLabel}
        </div>
        <div className="mobile-filter-row">
          <Button
            variant="outline"
            icon="filter"
            onClick={() => setFilterOpen((open) => !open)}
          >
            Bộ lọc
          </Button>
          <span>{isApiMode ? remoteTotal : matchingRooms.length} kết quả</span>
        </div>
        <div className="search-layout">
          {filterOpen && (
          <div className="filter-sheet-backdrop" onClick={() => setFilterOpen(false)}>
            <div ref={filterDialogRef} className="filter-sheet" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-label="Bộ lọc tìm kiếm">
              <div className="filter-sheet-header">
                <h3>Bộ lọc tìm kiếm</h3>
                <button
                  type="button"
                  className="filter-sheet-close"
                  onClick={() => setFilterOpen(false)}
                  aria-label="Đóng bộ lọc"
                >
                  <Icon name="close" size={18} />
                </button>
              </div>
              <div className="filter-sheet-body">
                <Filters
                  filters={draftFilters}
                  onChange={updateDraft}
                  onApply={applyFilters}
                  onReset={resetFilters}
                  roomTypes={roomTypes}
                  amenities={amenities}
                  idPrefix="mobile"
                  hideApplyButton
                />
              </div>
              {filterError && <p className="public-filter-error" role="alert">{filterError}</p>}
              <div className="filter-sheet-footer">
                <Button variant="outline" onClick={resetFilters}>
                  Đặt lại
                </Button>
                <Button onClick={applyFilters}>
                  Áp dụng bộ lọc
                </Button>
              </div>
            </div>
          </div>
        )}
          <div className="desktop-filter">
            <Filters
              filters={draftFilters}
              onChange={updateDraft}
              onApply={applyFilters}
              onReset={resetFilters}
              roomTypes={roomTypes}
              amenities={amenities}
            />
          </div>
          <section className="results" aria-busy={loadingRooms}>
            {filterError && !filterOpen && <p className="public-filter-error" role="alert">{filterError}</p>}
            {keyword && <div className="public-search-term">Kết quả cho <strong>“{keyword}”</strong><button type="button" aria-label="Xóa từ khóa tìm kiếm" onClick={() => { const next = new URLSearchParams(searchParams); next.delete("q"); setSearchParams(next) }}><Icon name="close" size={16}/></button></div>}
            <div className="results-head">
              <div>
                <h1>Phòng trọ tại {locationLabel}</h1>
                <p>
                  {isNearSearch ? `Trong bán kính ${radiusKm} km · ` : "Tìm thấy "}
                  <strong>{isApiMode ? remoteTotal : matchingRooms.length}</strong> phòng phù hợp
                </p>
              </div>
              <div className="view-actions">
                <select
                  aria-label="Sắp xếp kết quả"
                  value={sort}
                  onChange={(event) => { setRemotePage(1); setSort(event.target.value); const next = new URLSearchParams(searchParams); next.set("sort", event.target.value); setSearchParams(next) }}
                >
                  <option value="newest">Mới nhất</option>
                  <option value="price-low">Giá thấp nhất</option>
                  <option value="price-high">Giá cao nhất</option>
                </select>
                <button
                  className={!map ? "active" : ""}
                  onClick={() => setMap(false)}
                  aria-label="Xem dạng danh sách"
                  aria-pressed={!map}
                >
                  <Icon name="grid" size={17} />
                </button>
                <button
                  className={map ? "active" : ""}
                  onClick={() => setMap(true)}
                  aria-label="Xem vị trí phòng trên bản đồ"
                  aria-pressed={map}
                >
                  <Icon name="map" />
                </button>
              </div>
            </div>
            {requestError ? <section className="public-empty-state" role="alert"><Icon name="shield" size={26}/><h2>Chưa tải được danh sách phòng</h2><p>{requestError}</p><Button variant="outline" onClick={() => setRequestVersion((version) => version + 1)}>Thử lại</Button></section> : matchingRooms.length ? (
              map ? (
                locatedRooms.length ? <Suspense fallback={<div className="map-view map-loading">Đang tải bản đồ…</div>}><RoomMap listings={locatedRooms} center={isNearSearch ? [latitude, longitude] : [locatedRooms[0].latitude, locatedRooms[0].longitude]} zoom={isNearSearch ? 13 : 11} note="Vị trí do người đăng cung cấp; hãy xác nhận địa chỉ trước khi đi xem." /></Suspense> : <div className="public-empty-state"><Icon name="map" size={28}/><h2>Chưa có vị trí bản đồ cho các phòng này</h2><p>Bạn vẫn có thể xem ảnh và liên hệ người đăng từ danh sách.</p><Button variant="outline" onClick={() => setMap(false)}>Xem danh sách phòng</Button></div>
              ) : (
                <div className={matchingRooms.length === 4 ? "result-grid result-grid--balanced" : "result-grid"}>
                  {matchingRooms.map((room) => (
                    <RoomCard
                      key={room.id}
                      room={room}
                      onClick={() => navigate(`/phong/${room.id}`)}
                    />
                  ))}
                </div>
              )
            ) : loadingRooms ? <RoomCardSkeletonGrid count={6} /> : (
              <section className="empty-state search-empty-state">
                <span className="placeholder-icon">
                  <Icon name="search" size={28} />
                </span>
                <h2>Chưa tìm thấy phòng phù hợp</h2>
                <p>Thử mở rộng khu vực hoặc điều chỉnh khoảng giá và các tiện ích đã chọn để xem nhiều lựa chọn hơn.</p>
                <div style={{ display: "flex", gap: "10px", marginTop: "16px", flexWrap: "wrap", justifyContent: "center" }}>
                  <Button variant="outline" onClick={resetFilters}>
                    Xóa bộ lọc
                  </Button>
                  <Button onClick={() => {
                    setDraftFilters(defaultFilters);
                    setAppliedFilters(defaultFilters);
                    navigate("/tim-phong?location=");
                  }}>
                    Xem tất cả phòng trọ
                  </Button>
                </div>
              </section>
            )}
            {loadingRooms && matchingRooms.length > 0 && <p className="result-count-note">Đang tải thêm tin phòng…</p>}
            {isApiMode && remoteRooms.length < remoteTotal && !loadingRooms && <div className="search-load-more"><Button variant="outline" onClick={() => setRemotePage((page) => page + 1)}>Xem thêm phòng</Button></div>}
          </section>
        </div>
      </div>
    </main>
  )
}
