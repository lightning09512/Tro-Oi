import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent } from "react"
import { createPortal } from "react-dom"
import { Icon } from "@/components/common/legacy"
import useDialogFocus from "@/hooks/useDialogFocus"

// These are the location labels used by the current listing dataset.
const cityAreas: Record<string, Record<string, string[]>> = {
  "TP. Hồ Chí Minh": {
    "Bình Thạnh": ["Phường 25", "Bình Lợi Trung"],
    "Gò Vấp": ["Phường 5", "Phường 7", "Phường 14"],
    "Quận 6": ["Phường 2"], "Quận 7": ["Tân Hưng"], "Quận 8": ["Phường 6"],
    "Quận 10": ["Phường 12"], "Tân Bình": ["Phường 4", "Tân Sơn"],
    "Phú Nhuận": [], "Thủ Đức": ["Long Trường"],
  },
  "Hà Nội": {
    "Bắc Từ Liêm": ["Đông Ngạc"], "Cầu Giấy": ["Yên Hòa", "Dịch Vọng", "Nghĩa Đô"],
    "Nam Từ Liêm": ["Tây Mỗ", "Đại Mỗ"], "Tây Hồ": [], "Ba Đình": ["Cống Vị"],
    "Hoàng Mai": [], "Đống Đa": ["Ô Chợ Dừa"], "Hai Bà Trưng": ["Bạch Mai"],
  },
  "Đà Nẵng": {
    "Ngũ Hành Sơn": [], "Sơn Trà": ["An Hải", "Mân Thái"],
    "Liên Chiểu": ["Hòa Khánh"], "Hải Châu": ["Hòa Cường"],
  },
}
const cities = Object.keys(cityAreas)
function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/đ/g, "d")
}
function parseLocation(value: string) {
  const text = normalize(value)
  const city = cities.find((item) => text.includes(normalize(item))) ?? ""
  const districts = Object.keys(cityAreas[city] ?? {}).sort((a, b) => b.length - a.length)
  const district = districts.find((item) => text.includes(normalize(item))) ?? ""
  const ward = (cityAreas[city]?.[district] ?? []).find((item) => text.includes(normalize(item))) ?? ""
  return { city, district, ward }
}
function SelectField({ label, placeholder, value, options, disabled, onChange }: {
  label: string; placeholder: string; value: string; options: string[]; disabled?: boolean; onChange: (value: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const id = useId()
  const choices = ["", ...options]
  useEffect(() => {
    if (expanded) rootRef.current?.querySelector<HTMLElement>('[aria-selected="true"]')?.focus()
  }, [expanded])
  const select = (choice: string) => {
    onChange(choice)
    setExpanded(false)
    triggerRef.current?.focus()
  }
  const navigate = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.stopPropagation()
      event.preventDefault()
      setExpanded(false)
      triggerRef.current?.focus()
      return
    }
    const items = Array.from(rootRef.current?.querySelectorAll<HTMLElement>('[role="option"]') ?? [])
    const index = items.indexOf(document.activeElement as HTMLElement)
    let next = index
    if (event.key === "ArrowDown") next = (index + 1) % items.length
    else if (event.key === "ArrowUp") next = (index - 1 + items.length) % items.length
    else if (event.key === "Home") next = 0
    else if (event.key === "End") next = items.length - 1
    else return
    event.preventDefault()
    items[next]?.focus()
  }
  return <div ref={rootRef} className={`custom-select-field${disabled ? " is-disabled" : ""}${expanded ? " is-active" : ""}`} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setExpanded(false) }}>
    <button ref={triggerRef} type="button" disabled={disabled} className="custom-select-trigger" aria-haspopup="listbox" aria-expanded={expanded} aria-controls={id} onClick={() => setExpanded((current) => !current)} onKeyDown={(event) => { if (event.key === "ArrowDown" || event.key === "ArrowUp") { event.preventDefault(); setExpanded(true) } }}>
      <span className="custom-select-label">{label}</span>
      <span className="custom-select-value-row"><span className={`custom-select-value${!value ? " is-placeholder" : ""}`}>{value || placeholder}</span><Icon name="chevronDown" size={16} /></span>
    </button>
    {expanded && <div id={id} className="custom-select-menu" role="listbox" aria-label={label} onKeyDown={navigate}>
      {choices.map((choice) => <button key={choice} type="button" role="option" tabIndex={-1} aria-selected={value === choice} className={`custom-select-option${value === choice ? " is-selected" : ""}`} onClick={() => select(choice)}><span>{choice || placeholder}</span>{value === choice && <Icon name="check" size={16} />}</button>)}
    </div>}
  </div>
}

type LocationPickerProps = { value: string; onChange: (value: string) => void; variant?: "hero" | "filter" }
export default function LocationPicker({ value, onChange, variant = "hero" }: LocationPickerProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const dialogRef = useRef<HTMLElement>(null)
  const [open, setOpen] = useState(false)
  const [city, setCity] = useState(() => parseLocation(value).city)
  const [district, setDistrict] = useState(() => parseLocation(value).district)
  const [ward, setWard] = useState(() => parseLocation(value).ward)
  const [position, setPosition] = useState({ left: 16, top: 88, width: 380 })
  const titleId = useId()
  useDialogFocus(dialogRef, () => setOpen(false), open)
  useEffect(() => {
    if (!open) return
    const next = parseLocation(value)
    setCity(next.city); setDistrict(next.district); setWard(next.ward)
  }, [open, value])
  useLayoutEffect(() => {
    if (!open) return
    const updatePosition = () => {
      const bounds = rootRef.current?.getBoundingClientRect()
      if (!bounds) return
      const width = Math.min(380, window.innerWidth - 32)
      const height = Math.min(dialogRef.current?.offsetHeight ?? 400, window.innerHeight - 32)
      setPosition({
        width,
        left: Math.max(16, Math.min(bounds.left, window.innerWidth - width - 16)),
        top: Math.max(16, Math.min(bounds.bottom + 12, window.innerHeight - height - 16)),
      })
    }
    updatePosition()
    window.addEventListener("resize", updatePosition)
    window.addEventListener("scroll", updatePosition, true)
    return () => {
      window.removeEventListener("resize", updatePosition)
      window.removeEventListener("scroll", updatePosition, true)
    }
  }, [open])
  const apply = () => {
    onChange([ward, district, city].filter(Boolean).join(", "))
    setOpen(false)
  }
  return <div ref={rootRef} className={`location-picker location-picker--${variant}${open ? " is-open" : ""}`}>
    <button type="button" className="location-picker-trigger" onClick={() => setOpen((current) => !current)} aria-haspopup="dialog" aria-expanded={open} aria-label={`Chọn khu vực, hiện tại: ${value || "Tất cả khu vực"}`}>
      <Icon name="pin" size={18} /><span>{value || "Tất cả khu vực"}</span><span className="location-picker-chevron" aria-hidden="true"><Icon name="chevronDown" size={15} /></span>
    </button>
    {open && createPortal(<div className="location-picker-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false) }}>
      <section ref={dialogRef} className="location-picker-dropdown" style={position} role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div className="location-picker-dropdown-header"><div><h2 id={titleId}>Chọn khu vực</h2><p>Thu hẹp nơi bạn muốn tìm phòng.</p></div><button className="location-picker-close-btn" type="button" aria-label="Đóng bộ lọc khu vực" onClick={() => setOpen(false)}><Icon name="close" size={18} /></button></div>
        <div className="location-custom-fields">
          <SelectField label="Tỉnh / thành phố" placeholder="Tất cả khu vực" value={city} options={cities} onChange={(next) => { setCity(next); setDistrict(""); setWard("") }} />
          <SelectField label="Quận / huyện" placeholder="Tất cả quận, huyện" value={district} options={Object.keys(cityAreas[city] ?? {})} disabled={!city} onChange={(next) => { setDistrict(next); setWard("") }} />
          <SelectField label="Phường / xã" placeholder="Tất cả phường, xã" value={ward} options={cityAreas[city]?.[district] ?? []} disabled={!district || !(cityAreas[city]?.[district]?.length)} onChange={setWard} />
        </div>
        <div className="location-picker-footer"><button className="location-btn-reset" type="button" onClick={() => { onChange(""); setOpen(false) }}>Xóa lọc</button><button className="location-btn-apply" type="button" onClick={apply}>Áp dụng</button></div>
      </section>
    </div>, document.body)}
  </div>
}
