import { useState, type ReactNode } from "react"
import { useNavigate } from "react-router"
import { rooms } from "@/mocks/content"
import { useFavorites } from "@/contexts/FavoritesContext"
import { useToast } from "@/contexts/ToastContext"
import useAuth from "@/hooks/useAuth"

export function Icon({
  name,
  size = 20,
}: {
  name: string
  size?: number
}) {
  const paths: Record<string, ReactNode> = {
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),
    pin: (
      <>
        <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2.5" />
      </>
    ),
    heart: (
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5a5.5 5.5 0 0 0 1-8.9Z" />
    ),
    chat: (
      <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" />
    ),
    bell: (
      <>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
        <path d="M10 21h4" />
      </>
    ),
    plus: (
      <>
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </>
    ),
    home: (
      <>
        <path d="m3 11 9-8 9 8" />
        <path d="M5 10v11h14V10M9 21v-7h6v7" />
      </>
    ),
    user: (
      <>
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </>
    ),
    users: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.8M16 3.2a4 4 0 0 1 0 7.6" />
      </>
    ),
    building: (
      <>
        <rect x="4" y="3" width="16" height="18" rx="2" />
        <path d="M8 7h2M14 7h2M8 11h2M14 11h2M9 21v-5h6v5" />
      </>
    ),
    map: (
      <>
        <path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3Z" />
        <path d="M9 3v15M15 6v15" />
      </>
    ),
    grid: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
      </>
    ),
    filter: <path d="M4 5h16M7 12h10M10 19h4" />,
    star: (
      <path d="m12 2 3 6 6.5 1-4.7 4.6 1.1 6.4-5.9-3.1L6.1 20l1.1-6.4L2.5 9 9 8Z" />
    ),
    send: <path d="m22 2-7 20-4-9-9-4Z M22 2 11 13" />,
    upload: (
      <>
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
      </>
    ),
    smile: (
      <>
        <circle cx="12" cy="12" r="10" />
        <path d="M8 14s1.5 2 4 2 4-2 4-2" />
        <line x1="9" x2="9.01" y1="9" y2="9" strokeWidth="2" strokeLinecap="round" />
        <line x1="15" x2="15.01" y1="9" y2="9" strokeWidth="2" strokeLinecap="round" />
      </>
    ),
    chart: (
      <>
        <path d="M3 3v18h18" />
        <path d="m7 16 4-5 4 3 5-8" />
      </>
    ),
    menu: (
      <>
        <path d="M4 6h16M4 12h16M4 18h16" />
      </>
    ),
    chevron: <path d="m9 18 6-6-6-6" />,
    chevronDown: <path d="m6 9 6 6 6-6" />,
    "chevron-down": <path d="m6 9 6 6 6-6" />,
    shield: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />,
    image: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <path d="m21 15-5-5L5 21" />
      </>
    ),
    more: (
      <>
        <circle cx="5" cy="12" r="1" />
        <circle cx="12" cy="12" r="1" />
        <circle cx="19" cy="12" r="1" />
      </>
    ),
    thumbs: (
      <>
        <path d="M7 10v11H3V10h4Z" />
        <path d="M7 19c4 2 9 2 11 1l3-8c.4-1.5-.5-2-2-2h-5l1-5c0-2-3-3-4-1l-4 6" />
      </>
    ),
    eye: (
      <>
        <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ),
    facebook: (
      <path d="M14 8h3V4h-3c-3 0-5 2-5 5v3H6v4h3v6h4v-6h3l1-4h-4V9c0-.6.4-1 1-1Z" />
    ),
    youtube: (
      <>
        <path d="M21 8.2a2.8 2.8 0 0 0-2-2C17.2 5.7 12 5.7 12 5.7s-5.2 0-7 .5a2.8 2.8 0 0 0-2 2A29 29 0 0 0 2.5 12 29 29 0 0 0 3 15.8a2.8 2.8 0 0 0 2 2c1.8.5 7 .5 7 .5s5.2 0 7-.5a2.8 2.8 0 0 0 2-2 29 29 0 0 0 .5-3.8 29 29 0 0 0-.5-3.8Z" />
        <path d="m10 15 5-3-5-3Z" />
      </>
    ),
    linkedin: (
      <>
        <path d="M6 9v11M6 5v.01M10 20v-7a4 4 0 0 1 8 0v7M10 9v11" />
      </>
    ),
    down: <path d="m6 9 6 6 6-6" />,
    check: <path d="m5 12 4 4L19 6" />,
    close: <path d="m18 6-12 12M6 6l12 12" />,
    camera: (
      <>
        <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
        <circle cx="12" cy="13" r="3" />
      </>
    ),
    edit: (
      <>
        <path d="m15 5 4 4" />
        <path d="M4 20h4l11-11a2.8 2.8 0 0 0-4-4L4 16v4Z" />
      </>
    ),
    trash: (
      <>
        <path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6" />
        <path d="M10 11v5m4-5v5" />
      </>
    ),
    phone: (
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.4 19.4 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 3a2 2 0 0 1-.5 2.1L8 10.1a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c1 .3 2 .6 3 .7a2 2 0 0 1 1.6 1.9Z" />
    ),
    download: (
      <>
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <path d="m7 10 5 5 5-5M12 15V3" />
      </>
    ),
    share: (
      <>
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <path d="m8.6 10.5 6.8-4m-6.8 7 6.8 4" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </>
    ),
    flag: (
      <>
        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
        <line x1="4" y1="22" x2="4" y2="15" />
      </>
    ),
    copy: (
      <>
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
      </>
    ),
    info: (
      <>
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </>
    ),
  }
  return (
    <svg
      aria-hidden="true"
      className="icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  )
}

export function Button({
  children,
  variant = "primary",
  onClick,
  icon,
  type = "submit",
  disabled = false,
}: {
  children: ReactNode
  variant?: "primary" | "ghost" | "outline" | "orange"
  onClick?: () => void
  icon?: string
  type?: "button" | "submit"
  disabled?: boolean
}) {
  const variantClasses = {
    primary: "bg-[#245f3b] text-white hover:bg-[#1c4e30]",
    ghost: "bg-transparent text-[#315b3d] hover:bg-[#f0f6f1]",
    outline: "border border-[#cbd9cd] bg-white text-[#344b3a] hover:border-[#9fbea4] hover:bg-[#f6faf6]",
    orange: "bg-[#245f3b] text-white hover:bg-[#1c4e30]",
  }

  return (
    <button className={`btn inline-flex min-h-11 h-11 items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#34794a] disabled:cursor-not-allowed disabled:opacity-55 ${variantClasses[variant]}`} onClick={onClick} type={type} disabled={disabled}>
      {icon && <Icon name={icon} size={18} />}
      {children}
    </button>
  )
}
export function RoomCard({
  room,
  onClick,
}: {
  room: Omit<(typeof rooms)[number], "latitude" | "longitude" | "areaValue"> & { latitude?: number; longitude?: number; areaValue: number | null; ownerAvatarUrl?: string; ownerName?: string }
  onClick: () => void
}) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { isFavorite, toggleFavorite } = useFavorites()
  const { toast } = useToast()
  const saved = isFavorite(room.id)
  const [saving, setSaving] = useState(false)
  const isTransfer = room.type === "Chuyển nhượng"
  const sellerName = room.ownerName || "Chủ phòng"
  const initials = sellerName.split(/\s+/).slice(-2).map((part) => part[0]).join("").toUpperCase()
  return (
    <article
      className="room-card"
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.target === event.currentTarget && (event.key === "Enter" || event.key === " ")) {
          event.preventDefault()
          onClick()
        }
      }}
      role="link"
      tabIndex={0}
      aria-label={`Xem chi tiết ${room.title}`}
    >
      <div className="room-photo">
        <img src={room.image || "/images/room-placeholder.svg"} alt={room.title} loading="lazy" decoding="async" onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = "/images/room-placeholder.svg" }} />
        <span
          className={`photo-badge ${
            isTransfer
              ? "badge-transfer"
              : room.badge === "Mới đăng"
                ? "badge-new"
                : room.badge === "Chính chủ" || room.badge === "Xác thực"
                  ? "badge-verified"
                  : room.badge === "Giá tốt" || room.badge === "Nổi bật"
                    ? "badge-hot"
                    : "badge-default"
          }`}
          aria-label={isTransfer ? "Tin chuyển nhượng phòng" : `Trạng thái tin: ${room.badge}`}
        >
          {isTransfer ? "🔄 Chuyển nhượng" : room.badge}
        </span>
        {user?.role !== "admin" && <button
          className={saved ? "heart-btn saved" : "heart-btn"}
          aria-label={saved ? "Bỏ lưu tin" : "Lưu tin"}
          aria-pressed={saved}
          disabled={saving}
          onClick={async (event) => {
            event.stopPropagation()
            if (saving) return
            if (!user) {
              navigate("/dang-nhap", { state: { from: window.location.pathname } })
              return
            }
            setSaving(true)
            try {
              await toggleFavorite(room.id)
              toast(saved ? "Đã bỏ lưu phòng khỏi danh sách yêu thích" : "Đã lưu phòng vào danh sách yêu thích", "success")
            } catch (error) {
              toast(error instanceof Error ? error.message : "Chưa lưu được phòng. Hãy thử lại.", "error")
            } finally { setSaving(false) }
          }}
        >
          <Icon name="heart" size={19} />
        </button>}
      </div>
      <div className="room-info">
        <h3>{room.title}</h3>
        <div className="room-price">
          {room.price}
          <small>/tháng</small>
        </div>
        <div className="room-meta">
          <span className="room-area">
            <Icon name="building" size={14} />
            {room.area}
          </span>
          <span className="room-location">
            <Icon name="pin" size={15} />
            {room.location}
          </span>
        </div>
        <div className="seller">
          {room.ownerAvatarUrl ? <img className="mini-avatar seller-avatar-image" src={room.ownerAvatarUrl} alt="" /> : <span className="mini-avatar">{initials}</span>}
          <span>{sellerName} {isTransfer && <span className="seller-transfer-tag">Người pass</span>}</span>
          <button
            className="room-card-cta"
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              onClick()
            }}
          >
            Xem chi tiết
            <Icon name="chevron" size={15} />
          </button>
        </div>
      </div>
    </article>
  )
}

export function SectionTitle({
  title,
  action,
  onAction,
}: {
  eyebrow?: string
  title: string
  action?: string
  onAction?: () => void
}) {
  return (
    <div className="section-title">
      <div>
        <h2>{title}</h2>
      </div>
      {action && (
        <button onClick={onAction}>
          {action}
          <Icon name="chevron" size={16} />
        </button>
      )}
    </div>
  )
}
