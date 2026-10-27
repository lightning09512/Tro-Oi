import { useEffect, useRef, useState } from "react"
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

/** Custom dropdown field for selecting City, District, or Ward with soft rounded corners */
function CustomSelectField({
  label,
  placeholder,
  value,
  options,
  disabled = false,
  onChange,
}: {
  label: string
  placeholder: string
  value: string
  options: string[]
  disabled?: boolean
  onChange: (val: string) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const fieldRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return
    const onPointerDown = (e: PointerEvent) => {
      if (!fieldRef.current?.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("pointerdown", onPointerDown)
    return () => document.removeEventListener("pointerdown", onPointerDown)
  }, [isOpen])

  return (
    <div
      ref={fieldRef}
      className={`custom-select-field${disabled ? " is-disabled" : ""}${isOpen ? " is-active" : ""}`}
    >
      <button
        type="button"
        disabled={disabled}
        className="custom-select-trigger"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="custom-select-label">{label}</span>
        <div className="custom-select-value-row">
          <span className={`custom-select-value${!value ? " is-placeholder" : ""}`}>
            {value || placeholder}
          </span>
          <span className={`custom-select-arrow${isOpen ? " is-flipped" : ""}`} aria-hidden="true"><Icon name="chevronDown" size={14} /></span>
        </div>
      </button>

      {isOpen && !disabled && (
        <div className="custom-select-menu" role="listbox" aria-label={label}>
          <button
            type="button"
            className={`custom-select-option${!value ? " is-selected" : ""}`}
            onClick={() => {
              onChange("")
              setIsOpen(false)
            }}
          >
            <span>{placeholder}</span>
            {!value && <span className="custom-select-check">✓</span>}
          </button>
          {options.map((option) => {
            const isSelected = value === option
            return (
              <button
                key={option}
                type="button"
                className={`custom-select-option${isSelected ? " is-selected" : ""}`}
                onClick={() => {
                  onChange(option)
                  setIsOpen(false)
                }}
              >
                <span>{option}</span>
                {isSelected && <span className="custom-select-check">✓</span>}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
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
  const rootRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [city, setCity] = useState(() => parseLocation(value).city || cities[0])
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
    setCity(selection.city || cities[0])
    setDistrict(selection.district)
    setWard(selection.ward)
    setNearby(false)
  }, [open, value])

  useEffect(() => {
    if (!open) return
    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false)
    }
    document.addEventListener("pointerdown", closeOnOutsidePointer)
    window.addEventListener("keydown", closeOnEscape)
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer)
      window.removeEventListener("keydown", closeOnEscape)
    }
  }, [open])

  const applySelection = () => {
    if (nearby && onSearchNearby) {
      onSearchNearby(Number(radiusKm))
      setOpen(false)
      return
    }
    onChange(ward ? `${ward}, ${district}` : district ? `${district}, ${city}` : city)
    setOpen(false)
  }

  const clearSelection = () => {
    setCity(cities[0])
    setDistrict("")
    setWard("")
    setNearby(false)
    onChange("")
    setOpen(false)
  }

  return (
    <div ref={rootRef} className={`location-picker location-picker--${variant}${open ? " is-open" : ""}`}>
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
        <span className={`location-picker-chevron${open ? " is-flipped" : ""}`} aria-hidden="true"><Icon name="chevronDown" size={15} /></span>
      </button>

      {open && (
        <section
          className="location-picker-dropdown"
          role="region"
          aria-label="Bảng chọn khu vực"
        >
          {/* Header */}
          <div className="location-picker-dropdown-header">
            <div className="location-picker-title-group">
              <span className="location-picker-icon-badge">
                <Icon name="pin" size={16} />
              </span>
              <div>
                <h4>Chọn khu vực</h4>
                <p>Tìm phòng theo tỉnh thành, quận huyện</p>
              </div>
            </div>
            <button
              type="button"
              className="location-picker-close-btn"
              onClick={() => setOpen(false)}
              aria-label="Đóng"
            >
              <Icon name="close" size={16} />
            </button>
          </div>

          {/* 3 Ô chọn Custom Dropdown bo tròn mềm mại */}
          <div className="location-custom-fields">
            {/* Ô 1: Tỉnh / thành phố */}
            <CustomSelectField
              label="Tỉnh / thành phố"
              placeholder="Tất cả khu vực"
              value={city}
              options={cities}
              onChange={(nextCity) => {
                setCity(nextCity)
                setDistrict("")
                setWard("")
              }}
            />

            {/* Ô 2: Quận / huyện */}
            <CustomSelectField
              label="Quận / huyện"
              placeholder="Tất cả quận, huyện"
              value={district}
              options={districts}
              disabled={!city}
              onChange={(nextDistrict) => {
                setDistrict(nextDistrict)
                setWard("")
              }}
            />

            {/* Ô 3: Phường / xã */}
            <CustomSelectField
              label="Phường / xã"
              placeholder="Tất cả phường, xã"
              value={ward}
              options={wards}
              disabled={!district || wards.length === 0}
              onChange={(nextWard) => {
                setWard(nextWard)
              }}
            />
          </div>

          {/* Tìm kiếm gần tôi nếu có */}
          {showNearby && onSearchNearby && (
            <div className={`location-picker-nearby${nearby ? " is-enabled" : ""}`}>
              <label className="location-picker-nearby-toggle">
                <input
                  type="checkbox"
                  checked={nearby}
                  onChange={(event) => setNearby(event.target.checked)}
                />
                <span className="location-picker-nearby-icon">
                  <Icon name="pin" size={17} />
                </span>
                <span className="location-picker-nearby-copy">
                  <strong>Tìm phòng gần tôi</strong>
                  <small>Dùng định vị GPS thiết bị</small>
                </span>
              </label>
              <div className="location-picker-radius-pills">
                {nearbyRadii.map((item) => (
                  <button
                    key={item}
                    type="button"
                    disabled={!nearby}
                    className={`location-radius-pill${radiusKm === item ? " is-active" : ""}`}
                    onClick={() => setRadiusKm(item)}
                  >
                    {item} km
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 2 Nút thao tác bo góc mềm mại */}
          <div className="location-picker-footer">
            <button
              type="button"
              className="location-btn-reset"
              onClick={clearSelection}
            >
              Xóa lọc
            </button>
            <button
              type="button"
              className="location-btn-apply"
              onClick={applySelection}
            >
              Áp dụng
            </button>
          </div>
        </section>
      )}
    </div>
  )
}
