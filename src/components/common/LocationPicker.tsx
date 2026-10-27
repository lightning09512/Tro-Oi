import { useEffect, useState } from "react"
import { Icon } from "@/components/common/legacy"

const cityAreas: Record<string, Record<string, string[]>> = {
  "TP. Hồ Chí Minh": {
    "Bình Thạnh": ["Phường 25", "Phường Bình Lợi Trung"],
    "Gò Vấp": ["Phường 5", "Phường 7", "Phường 14"],
    "Quận 6": ["Phường 2"],
    "Quận 7": ["Phường Tân Hưng"],
    "Quận 8": ["Phường 6"],
    "Quận 10": ["Phường 12"],
    "Tân Bình": ["Phường 4"],
  },
  "Hà Nội": {
    "Bắc Từ Liêm": ["Phường Đông Ngạc"],
    "Cầu Giấy": ["Phường Yên Hòa"],
    "Nam Từ Liêm": ["Phường Tây Mỗ"],
    "Tây Hồ": ["Phường Tây Hồ"],
  },
  "Đà Nẵng": {
    "Ngũ Hành Sơn": ["Phường Ngũ Hành Sơn"],
  },
}

const cities = Object.keys(cityAreas)
const nearbyRadii = ["5", "10", "20", "30"]

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("vi")
}

function parseLocation(value: string) {
  const normalized = normalize(value)
  const city = cities.find((item) => normalized.includes(normalize(item))) ?? (value ? cities[0] : "")
  const districts = Object.keys(cityAreas[city] ?? {}).sort((first, second) => second.length - first.length)
  const district = districts.find((item) => normalized.includes(normalize(item))) ?? ""
  const wards = cityAreas[city]?.[district] ?? []
  const ward = wards.find((item) => normalized.includes(normalize(item))) ?? ""
  return { city, district, ward }
}

type LocationPickerProps = {
  value: string
  onChange: (value: string) => void
  variant?: "hero" | "filter"
  showNearby?: boolean
  onSearchNearby?: (radiusKm: number) => void
}

export default function LocationPicker({
  value,
  onChange,
  variant = "hero",
  showNearby = false,
  onSearchNearby,
}: LocationPickerProps) {
  const [open, setOpen] = useState(false)
  const [city, setCity] = useState(() => parseLocation(value).city)
  const [district, setDistrict] = useState(() => parseLocation(value).district)
  const [ward, setWard] = useState(() => parseLocation(value).ward)
  const [nearby, setNearby] = useState(false)
  const [radiusKm, setRadiusKm] = useState("20")
  const districts = Object.keys(cityAreas[city] ?? {})
  const wards = cityAreas[city]?.[district] ?? []
  const displayValue = value || "Tất cả khu vực"

  useEffect(() => {
    if (!open) return
    const selection = parseLocation(value)
    setCity(selection.city)
    setDistrict(selection.district)
    setWard(selection.ward)
    setNearby(false)
  }, [open, value])

  useEffect(() => {
    if (!open) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false)
    }
    window.addEventListener("keydown", closeOnEscape)
    return () => window.removeEventListener("keydown", closeOnEscape)
  }, [open])

  const applySelection = () => {
    if (nearby && onSearchNearby) {
      onSearchNearby(Number(radiusKm))
      setOpen(false)
      return
    }
    onChange(ward ? `${ward}, ${district}` : district || city)
    setOpen(false)
  }

  const clearSelection = () => {
    setCity("")
    setDistrict("")
    setWard("")
    setNearby(false)
    onChange("")
    setOpen(false)
  }

  return (
    <div className={`location-picker location-picker--${variant}${open ? " is-open" : ""}`}>
      <button
        type="button"
        className="location-picker-trigger"
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`Chọn khu vực, hiện tại: ${displayValue}`}
      >
        <Icon name="pin" size={variant === "hero" ? 18 : 17} />
        <span>{displayValue}</span>
        <span className="location-picker-chevron" aria-hidden="true">⌄</span>
      </button>
      {open && (
        <>
          <button
            type="button"
            className="location-picker-backdrop"
            aria-label="Đóng bộ chọn khu vực"
            onClick={() => setOpen(false)}
          />
          <section className="location-picker-popover" role="dialog" aria-label="Chọn khu vực">
            <h3>Khu vực</h3>
            <label className="location-picker-select">
              <span>Tỉnh / thành phố</span>
              <select
                value={city}
                onChange={(event) => {
                  setCity(event.target.value)
                  setDistrict("")
                  setWard("")
                }}
              >
                <option value="">Tất cả khu vực</option>
                {cities.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
            <label className="location-picker-select">
              <span>Quận / huyện</span>
              <select
                value={district}
                disabled={!city}
                onChange={(event) => {
                  setDistrict(event.target.value)
                  setWard("")
                }}
              >
                <option value="">Tất cả quận, huyện</option>
                {districts.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
            <label className="location-picker-select">
              <span>Phường / xã</span>
              <select value={ward} disabled={!district} onChange={(event) => setWard(event.target.value)}>
                <option value="">Tất cả phường, xã</option>
                {wards.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
            {showNearby && onSearchNearby && (
              <div className="location-picker-nearby">
                <label>
                  <input type="checkbox" checked={nearby} onChange={(event) => setNearby(event.target.checked)} />
                  <Icon name="pin" size={18} />
                  <strong>Tìm phòng gần tôi</strong>
                </label>
                <select aria-label="Bán kính tìm kiếm" value={radiusKm} disabled={!nearby} onChange={(event) => setRadiusKm(event.target.value)}>
                  {nearbyRadii.map((item) => <option key={item} value={item}>Trong bán kính {item} km</option>)}
                </select>
              </div>
            )}
            <div className="location-picker-actions">
              <button type="button" onClick={clearSelection}>Xóa lọc</button>
              <button type="button" onClick={applySelection}>Áp dụng</button>
            </div>
          </section>
        </>
      )}
    </div>
  )
}
