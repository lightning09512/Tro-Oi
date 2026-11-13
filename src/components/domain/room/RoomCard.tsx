import { useState } from "react"
import { useNavigate } from "react-router"
import { Icon } from "@/components/common/legacy"
import { rooms } from "@/mocks/content"
import { useFavorites } from "@/contexts/FavoritesContext"
import { useToast } from "@/contexts/ToastContext"
import useAuth from "@/hooks/useAuth"

export interface RoomCardProps {
  room: Omit<(typeof rooms)[number], "latitude" | "longitude" | "areaValue"> & {
    latitude?: number
    longitude?: number
    areaValue: number | null
    ownerAvatarUrl?: string
    ownerName?: string
  }
  onClick: () => void
}

export function RoomCard({ room, onClick }: RoomCardProps) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { isFavorite, toggleFavorite } = useFavorites()
  const { toast } = useToast()
  const saved = isFavorite(room.id)
  const [saving, setSaving] = useState(false)
  const isTransfer = room.type === "Chuyển nhượng"
  const sellerName = room.ownerName || "Chủ phòng"
  const initials = sellerName
    .split(/\s+/)
    .slice(-2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()

  return (
    <article
      className="room-card"
      onClick={onClick}
      onKeyDown={(event) => {
        if (
          event.target === event.currentTarget &&
          (event.key === "Enter" || event.key === " ")
        ) {
          event.preventDefault()
          onClick()
        }
      }}
      role="link"
      tabIndex={0}
      aria-label={`Xem chi tiết ${room.title}`}
    >
      <div className="room-photo">
        <img
          src={room.image || "/images/room-placeholder.svg"}
          alt={room.title}
          loading="lazy"
          decoding="async"
          onError={(event) => {
            event.currentTarget.onerror = null
            event.currentTarget.src = "/images/room-placeholder.svg"
          }}
        />
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
          aria-label={
            isTransfer ? "Tin chuyển nhượng phòng" : `Trạng thái tin: ${room.badge}`
          }
        >
          {isTransfer ? "Chuyển nhượng" : room.badge}
        </span>
        {user?.role !== "admin" && (
          <button
            type="button"
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
                toast(
                  saved
                    ? "Đã bỏ lưu phòng khỏi danh sách yêu thích"
                    : "Đã lưu phòng vào danh sách yêu thích",
                  "success"
                )
              } catch (error) {
                toast(
                  error instanceof Error
                    ? error.message
                    : "Chưa lưu được phòng. Hãy thử lại.",
                  "error"
                )
              } finally {
                setSaving(false)
              }
            }}
          >
            <Icon name="heart" size={19} />
          </button>
        )}
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
          <img
            className="mini-avatar seller-avatar-image"
            src={room.ownerAvatarUrl || "/images/avatars/default-brand-avatar.png"}
            alt=""
            loading="lazy"
            onError={(e) => {
              e.currentTarget.onerror = null
              e.currentTarget.src = "/images/avatars/default-brand-avatar.png"
            }}
          />
          <span>
            {sellerName}{" "}
            {isTransfer && <span className="seller-transfer-tag">Người pass</span>}
          </span>
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

export default RoomCard
