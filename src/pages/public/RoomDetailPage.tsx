import {
  lazy,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react"

import { Link, useNavigate, useParams } from "react-router"

import { Button, Icon, RoomCard } from "@/components/common/legacy"

import { useFavorites } from "@/contexts/FavoritesContext"

import { usePlatform, type RoomReview } from "@/contexts/PlatformContext"

import ReportDialog from "@/components/common/ReportDialog"

import { useToast } from "@/contexts/ToastContext"

import useAuth from "@/hooks/useAuth"

import { isApiMode } from "@/services/apiClient"

import { formatRelativeTime } from "@/utils/formatTime"

import useDialogFocus from "@/hooks/useDialogFocus"

import { resolveLocationCoordinates } from "@/utils/mapCoordinates"

const RoomMap = lazy(() => import("@/components/maps/RoomMap"))


function NhaTotListingCard({
  item,
  index,
  saved,
  onToggleFavorite,
  onClick,
}: {
  item: any
  index: number
  saved: boolean
  onToggleFavorite: (id: string, e: React.MouseEvent) => void
  onClick: () => void
}) {
  const timeLabels = [
    "8 ngày trước",
    "15 giờ trước",
    "21 giờ trước",
    "Hôm qua",
    "2 ngày trước",
    "3 ngày trước",
  ]
  const timeLabel =
    item.badge === "Nổi bật" || item.badge === "Giá tốt"
      ? "Tin nổi bật"
      : timeLabels[index % timeLabels.length]
  const isHot = timeLabel === "Tin nổi bật"
  const photoCount = item.gallery?.length ? item.gallery.length + 1 : 6
  const isPartner =
    item.badge === "Đối Tác" ||
    item.badge === "Chính chủ" ||
    item.badge === "Xác thực"

  const specs =
    item.type === "Chung cư"
      ? "1 PN · Chung cư"
      : item.type === "Căn hộ dịch vụ"
        ? "1 PN · Căn hộ dịch vụ"
        : item.type === "Chuyển nhượng"
          ? "Phòng trọ · Chuyển nhượng"
          : "1 PN · Phòng trọ"

  const locParts = item.location.split(",").map((s: string) => s.trim())
  const shortLoc =
    locParts.length > 2
      ? `${locParts[locParts.length - 2]}`
      : item.location

  return (
    <article className="nhatot-listing-card" onClick={onClick}>
      <div className="nhatot-card-thumb-wrap">
        <img
          src={item.image || "/images/room-placeholder.svg"}
          alt={item.title}
          className="nhatot-card-thumb-img"
          loading="lazy"
          onError={(e) => {
            e.currentTarget.onerror = null
            e.currentTarget.src = "/images/room-placeholder.svg"
          }}
        />
        <span className={`nhatot-card-badge-time ${isHot ? "is-hot" : ""}`}>
          {timeLabel}
        </span>
        <span className="nhatot-card-badge-photos">
          <Icon name="camera" size={11} /> {photoCount}
        </span>
        <button
          type="button"
          className={`nhatot-card-heart-btn ${saved ? "is-saved" : ""}`}
          aria-label={saved ? "Bỏ lưu tin" : "Lưu tin"}
          onClick={(e) => onToggleFavorite(item.id, e)}
        >
          <Icon name="heart" size={16} />
        </button>
      </div>

      <div className="nhatot-card-content">
        <h3 className="nhatot-card-title">
          {isPartner && (
            <span className="nhatot-partner-tag">
              <Icon name="shield" size={10} /> Đối Tác
            </span>
          )}
          {item.title}
        </h3>
        <div className="nhatot-card-specs">{specs}</div>
        <div className="nhatot-card-price-area">
          <strong className="nhatot-card-price">{item.price}/tháng</strong>
          <span className="nhatot-card-area">{item.area || "35 m²"}</span>
        </div>
        <div className="nhatot-card-location">
          <Icon name="pin" size={12} />
          <span>{shortLoc}</span>
        </div>
      </div>
    </article>
  )
}

function NhaTotListingSlider({
  items,
  isFavorite,
  onToggleFavorite,
  onSelect,
}: {
  items: any[]
  isFavorite: (id: string) => boolean
  onToggleFavorite: (id: string, e: React.MouseEvent) => void
  onSelect: (id: string) => void
}) {
  const trackRef = useRef<HTMLDivElement>(null)

  const scroll = (direction: "left" | "right") => {
    if (!trackRef.current) return
    const offset = direction === "left" ? -460 : 460
    trackRef.current.scrollBy({ left: offset, behavior: "smooth" })
  }

  return (
    <div className="nhatot-carousel-wrap">
      <button
        type="button"
        className="nhatot-carousel-nav-btn prev"
        onClick={() => scroll("left")}
        aria-label="Xem tin trước"
      >
        <Icon name="chevron" size={16} style={{ transform: "rotate(180deg)" }} />
      </button>

      <div className="nhatot-carousel-track" ref={trackRef}>
        {items.map((item, idx) => (
          <NhaTotListingCard
            key={item.id}
            item={item}
            index={idx}
            saved={isFavorite(item.id)}
            onToggleFavorite={onToggleFavorite}
            onClick={() => onSelect(item.id)}
          />
        ))}
      </div>

      <button
        type="button"
        className="nhatot-carousel-nav-btn next"
        onClick={() => scroll("right")}
        aria-label="Xem tin tiếp theo"
      >
        <Icon name="chevron" size={16} />
      </button>
    </div>
  )
}

export default function RoomDetailPage() {
  const navigate = useNavigate()

  const { id } = useParams()

  const { user } = useAuth()

  const {
    listings,
    users,
    reviews,
    connectionState,
    saveReview,
    deleteReview,
    incrementListingViews,
    incrementListingContacts,
    startConversation,
  } = usePlatform()

  const { isFavorite, toggleFavorite } = useFavorites()

  const { toast } = useToast()

  const [showPhone, setShowPhone] = useState(false)

  const [contactPhone, setContactPhone] = useState("")

  const [ownerAvatarFailed, setOwnerAvatarFailed] = useState(false)

  const [reportOpen, setReportOpen] = useState(false)

  const [galleryIndex, setGalleryIndex] = useState(0)

  const [text, setText] = useState("")

  const [stars, setStars] = useState(5)

  const [editingReview, setEditingReview] = useState<RoomReview | null>(null)

  const [expanded, setExpanded] = useState(false)

  const [lightboxOpen, setLightboxOpen] = useState(false)

  const [pendingAction, setPendingAction] = useState("")

  const [actionError, setActionError] = useState("")

  const lightboxRef = useRef<HTMLDivElement>(null)

  useDialogFocus(lightboxRef, () => setLightboxOpen(false), lightboxOpen)

  const normalizedId = (() => {
    try {
      return id ? decodeURIComponent(id).trim() : ""
    } catch {
      return id ?? ""
    }
  })()

  const room = listings.find((item) => {
    const isMatch =
      item.id === id ||
      item.id === normalizedId ||
      (normalizedId && item.id === normalizedId.replace(/\s+/g, "-"))

    return (
      isMatch &&
      (item.status === "active" ||
        (item.status === "rented" &&
          user?.role === "renter" &&
          item.currentTenantId === user.id))
    )
  })

  const mapInfo = useMemo(() => {
    if (!room) return null

    return resolveLocationCoordinates(
      room.location,
      room.latitude,
      room.longitude,
    )
  }, [room])

  const similarListings = useMemo(() => {
    if (!room) return []

    const roomLocation = room.location
      .split(",")
      .map((part) => part.trim().toLocaleLowerCase("vi-VN"))
      .filter(Boolean)

    const roomDistrict =
      roomLocation.length > 1 ? roomLocation[roomLocation.length - 2] : ""

    const roomCity = roomLocation[roomLocation.length - 1] ?? ""

    return listings

      .filter(
        (listing) => listing.status === "active" && listing.id !== room.id,
      )

      .map((listing, index) => {
        const listingLocation = listing.location
          .split(",")
          .map((part) => part.trim().toLocaleLowerCase("vi-VN"))
          .filter(Boolean)

        const listingDistrict =
          listingLocation.length > 1
            ? listingLocation[listingLocation.length - 2]
            : ""

        const listingCity = listingLocation[listingLocation.length - 1] ?? ""

        let score = 0

        if (roomDistrict && listingDistrict === roomDistrict) score += 5

        if (roomCity && listingCity === roomCity) score += 2

        if (
          room.type.toLocaleLowerCase("vi-VN") ===
          listing.type.toLocaleLowerCase("vi-VN")
        )
          score += 3

        if (
          room.priceValue > 0 &&
          listing.priceValue > 0 &&
          Math.abs(room.priceValue - listing.priceValue) / room.priceValue <=
            0.25
        )
          score += 1

        return { listing, score, index }
      })

      .sort(
        (left, right) => right.score - left.score || left.index - right.index,
      )

      .slice(0, 10)

      .map(({ listing }) => listing)
  }, [listings, room])

  const roomReviews = useMemo(
    () => reviews.filter((review) => review.listingId === room?.id),
    [reviews, room?.id],
  )

  const galleryPhotos = room
    ? [...new Set([room.image, ...(room.gallery ?? [])].filter(Boolean))].slice(
        0,
        6,
      )
    : []

  const activeGalleryPhoto = galleryPhotos[galleryIndex] ?? galleryPhotos[0]

  const rawLocationParts = room ? room.location.split(",").map((p) => p.trim()) : []
  const displayDistrict = rawLocationParts.length > 1 ? rawLocationParts[rawLocationParts.length - 2] : "khu vực"

  const ownerOtherListings = useMemo(() => {
    if (!room) return []
    const fromOwner = listings.filter(
      (l) =>
        l.status === "active" &&
        l.id !== room.id &&
        ((room.ownerId && l.ownerId === room.ownerId) ||
          (room.ownerName && l.ownerName === room.ownerName)),
    )
    if (fromOwner.length >= 3) return fromOwner.slice(0, 10)
    const others = listings.filter(
      (l) =>
        l.status === "active" &&
        l.id !== room.id &&
        !fromOwner.some((o) => o.id === l.id),
    )
    return [...fromOwner, ...others].slice(0, 10)
  }, [listings, room])

  const topBrokers = useMemo(() => {
    if (!room) return []
    const map = new Map<string, { id: string; name: string; avatarUrl?: string; count: number }>()
    listings.filter((l) => l.status === "active").forEach((l) => {
      const ownerKey = l.ownerId || l.ownerName || "Chủ phòng"
      const existing = map.get(ownerKey)
      const avatar = l.ownerAvatarUrl || users?.find((u) => u.id === l.ownerId)?.avatarUrl
      if (existing) {
        existing.count += 1
      } else {
        map.set(ownerKey, {
          id: l.ownerId || "",
          name: l.ownerName || "Chủ phòng uy tín",
          avatarUrl: avatar,
          count: 1,
        })
      }
    })

    const list = Array.from(map.values()).sort((a, b) => b.count - a.count)
    const seedDefaults = [
      { id: "user-broker-01", name: "Hồ Phan Huy Châu", avatarUrl: "/images/avatars/demo-broker-01.jpg", count: 17 },
      { id: "user-broker-02", name: "BĐS Kim Ngọc", avatarUrl: "/images/avatars/demo-broker-02.jpg", count: 3 },
      { id: "user-broker-03", name: "Nguyễn Trọng Tuấn", avatarUrl: "/images/avatars/demo-tenant-01.jpg", count: 1 },
    ]
    const merged = [...list, ...seedDefaults.filter((d) => !list.some((item) => item.name === d.name))]
    return merged.slice(0, 4)
  }, [listings, users, room])

  const handleToggleFavorite = async (listingId: string, event: React.MouseEvent) => {
    event.stopPropagation()
    if (!user) {
      navigate("/dang-nhap", { state: { from: window.location.pathname } })
      return
    }
    try {
      await toggleFavorite(listingId)
      toast(isFavorite(listingId) ? "Đã bỏ lưu phòng" : "Đã lưu phòng", "success")
    } catch {
      toast("Không thể cập nhật danh sách yêu thích", "error")
    }
  }

  useEffect(() => {
    if (room?.id) void incrementListingViews(room.id).catch(() => undefined)
  }, [room?.id])

  useEffect(() => {
    setGalleryIndex(0)
    setOwnerAvatarFailed(false)
    setShowPhone(false)
    setContactPhone("")
    setLightboxOpen(false)
    setExpanded(false)
    setText("")
    setEditingReview(null)
    setActionError("")
  }, [id])

  useEffect(() => {
    if (!lightboxOpen || !galleryPhotos.length) return

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault()

        setGalleryIndex(
          (index) =>
            (index +
              (event.key === "ArrowRight" ? 1 : -1) +
              galleryPhotos.length) %
            galleryPhotos.length,
        )
      }
    }

    window.addEventListener("keydown", onKey)

    return () => window.removeEventListener("keydown", onKey)
  }, [lightboxOpen, galleryPhotos.length])

  if (!room && connectionState === "loading")
    return (
      <main className="page-bg detail-page">
        <div
          className="container public-empty-state"
          role="status"
          aria-busy="true"
        >
          <Icon name="building" size={28} />
          <h1>Đang tải thông tin phòng…</h1>
          <p>Ảnh và thông tin phòng sẽ xuất hiện trong giây lát.</p>
        </div>
      </main>
    )

  if (!room)
    return (
      <main className="workspace-page detail-page">
        <div className="container workspace-container">
          <section className="empty-state">
            <span className="placeholder-icon">
              <Icon name="building" />
            </span>
            <h1>
              {connectionState === "error"
                ? "Chưa tải được thông tin phòng"
                : "Phòng này không còn hiển thị"}
            </h1>
            <p>
              {connectionState === "error"
                ? "Hãy kiểm tra kết nối và thử tải lại trang."
                : "Có thể tin đã được cho thuê hoặc chủ trọ đã tạm ẩn."}
            </p>
            <Button onClick={() => navigate("/tim-phong")}>
              Tìm phòng khác
            </Button>
          </section>
        </div>
      </main>
    )

  const saved = isFavorite(room.id)

  const ownerDisplayName = room.ownerName || "Chủ phòng"

  const landlordAvatarUrl =
    room.ownerAvatarUrl || users?.find((u) => u.id === room.ownerId)?.avatarUrl

  const average = roomReviews.length
    ? roomReviews.reduce((sum, item) => sum + item.stars, 0) /
      roomReviews.length
    : 0

  const myReview = roomReviews.find((review) => review.authorId === user?.id)

  const canReview = user?.role === "renter" && room.currentTenantId === user.id

  const contact = async () => {
    if (!user) {
      navigate("/dang-nhap", { state: { from: `/phong/${room.id}` } })
      return
    }

    if (pendingAction) return

    setPendingAction("contact")

    setActionError("")

    try {
      const conversation = await startConversation({
        accountId: user.id,
        name: ownerDisplayName,
        avatar: ownerDisplayName
          .split(" ")
          .map((part) => part[0])
          .slice(-2)
          .join(""),
        avatarUrl: landlordAvatarUrl,
        userId: room.ownerId,
        roomId: room.id,
      })

      if (conversation) navigate(`/tin-nhan?conversation=${conversation}`)
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "Chưa mở được cuộc trò chuyện. Hãy thử lại.",
      )
    } finally {
      setPendingAction("")
    }
  }

  const submitReview = async (event: FormEvent) => {
    event.preventDefault()

    if (!canReview) {
      if (!user)
        navigate("/dang-nhap", { state: { from: `/phong/${room.id}` } })

      return
    }

    if (!text.trim() || pendingAction) return

    setPendingAction("review")

    setActionError("")

    const previousReview = editingReview ?? myReview

    try {
      await saveReview({
        id: previousReview?.id ?? `review-${Date.now()}`,
        listingId: room.id,
        authorId: user.id,
        author: user.name,
        initials: user.initials,
        stars,
        text: text.trim(),
        createdAt: previousReview?.createdAt ?? "Vừa xong",
      })

      setText("")

      setEditingReview(null)
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "Chưa lưu được đánh giá. Hãy thử lại.",
      )
    } finally {
      setPendingAction("")
    }
  }

  return (
    <main className="page-bg detail-page">
      <div className="container workspace-container">
        <div className="breadcrumbs">
          <Link to="/">Trang chủ</Link>
          <span>/</span>
          <Link to="/tim-phong">Tìm phòng</Link>
          <span>/</span>
          <span>{room.location}</span>
        </div>

        <div className="room-detail-layout">
          <div className="room-detail-main-column">
            {activeGalleryPhoto && (
              <section
                className="room-gallery-carousel"
                aria-label={`Thư viện ảnh của ${room.title}`}
              >
                <div className="room-gallery-stage">
                  <button
                    type="button"
                    className="room-gallery-open"
                    onClick={() => setLightboxOpen(true)}
                    aria-label={`Mở ảnh ${galleryIndex + 1} ở kích thước lớn`}
                  >
                    <img
                      className="room-gallery-main"
                      src={activeGalleryPhoto}
                      alt={`${room.title} — ảnh ${galleryIndex + 1}`}
                      onError={(event) => {
                        event.currentTarget.onerror = null
                        event.currentTarget.src = "/tro-oi-icon.svg"
                        event.currentTarget.alt = "Ảnh phòng chưa tải được"
                      }}
                    />
                    <span className="room-gallery-expand">
                      <Icon name="image" size={15} />
                      Xem ảnh lớn
                    </span>
                  </button>
                  <span className="room-gallery-count">
                    {galleryIndex + 1}/{galleryPhotos.length}
                  </span>
                  {galleryPhotos.length > 1 && (
                    <>
                      <button
                        className="room-gallery-arrow room-gallery-previous"
                        type="button"
                        aria-label="Ảnh trước"
                        onClick={() =>
                          setGalleryIndex(
                            (index) =>
                              (index - 1 + galleryPhotos.length) %
                              galleryPhotos.length,
                          )
                        }
                      >
                        <Icon name="chevron" size={20} />
                      </button>
                      <button
                        className="room-gallery-arrow room-gallery-next"
                        type="button"
                        aria-label="Ảnh tiếp theo"
                        onClick={() =>
                          setGalleryIndex(
                            (index) => (index + 1) % galleryPhotos.length,
                          )
                        }
                      >
                        <Icon name="chevron" size={20} />
                      </button>
                    </>
                  )}
                </div>
                {galleryPhotos.length > 1 && (
                  <div
                    className="room-gallery-thumbnails"
                    aria-label="Chọn ảnh phòng"
                  >
                    {galleryPhotos.map((photo, index) => (
                      <button
                        className={
                          index === galleryIndex
                            ? "room-gallery-thumb active"
                            : "room-gallery-thumb"
                        }
                        type="button"
                        key={photo}
                        aria-label={`Xem ảnh ${index + 1}`}
                        aria-pressed={index === galleryIndex}
                        onClick={() => setGalleryIndex(index)}
                      >
                        <img src={photo} alt="" />
                      </button>
                    ))}
                  </div>
                )}
              </section>
            )}

            <header className="room-detail-summary room-detail-summary-primary">
              <div className="room-detail-summary-top">
                <span className="verified">
                  {room.status === "rented" ? "Đã cho thuê" : "Đang cho thuê"}
                </span>
                {user?.role !== "admin" && room.status === "active" && (
                  <button
                    className={saved ? "save-big saved" : "save-big"}
                    aria-pressed={saved}
                    disabled={Boolean(pendingAction)}
                    onClick={async () => {
                      if (!user) {
                        navigate("/dang-nhap", {
                          state: { from: "/phong/" + room.id },
                        })

                        return
                      }

                      setPendingAction("favorite")

                      setActionError("")

                      try {
                        await toggleFavorite(room.id)
                      } catch (error) {
                        setActionError(
                          error instanceof Error
                            ? error.message
                            : "Chưa lưu được tin phòng.",
                        )
                      } finally {
                        setPendingAction("")
                      }
                    }}
                  >
                    <Icon name="heart" />
                    {saved ? "Đã lưu" : "Lưu tin"}
                  </button>
                )}
              </div>
              <h1>{room.title}</h1>
              <p className="room-detail-address-line">
                <Icon name="pin" size={15} />
                {room.location}
              </p>
              <div className="room-detail-quickfacts">
                <div className="room-detail-price-fact">
                  <small>Giá thuê</small>
                  <strong title={`${room.price}/tháng`}>
                    {room.price}
                    <em>/tháng</em>
                  </strong>
                </div>
                <div>
                  <small>Diện tích</small>
                  <strong title={room.area || "Chưa cập nhật"}>
                    {room.area || "Chưa cập nhật"}
                  </strong>
                </div>
                <div>
                  <small>Tiền cọc</small>
                  <strong title={room.deposit || "Trao đổi khi liên hệ"}>
                    {room.deposit || "Trao đổi khi liên hệ"}
                  </strong>
                </div>
                <div>
                  <small>Loại phòng</small>
                  <strong title={room.type}>{room.type}</strong>
                </div>
              </div>
            </header>

            <section className="room-detail-panel room-features-panel">
              <div className="room-detail-panel-heading">
                <div>
                  <h2>Tiện ích phòng</h2>
                </div>
              </div>
              <div className="room-amenities-block" style={{ borderTop: "none", marginTop: 0, paddingTop: 0 }}>
                {room.amenities.length ? (
                  <div className="room-amenities-list">
                    {room.amenities.map((item) => (
                      <span key={item}>
                        <i aria-hidden="true">
                          <Icon name="check" size={13} />
                        </i>
                        {item}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="room-detail-muted">
                    Người đăng chưa cập nhật tiện ích.
                  </p>
                )}
              </div>
            </section>

            <section className="room-detail-panel room-description-panel">
              <div className="room-detail-panel-heading">
                <div>
                  <h2>Mô tả chi tiết</h2>
                </div>
              </div>
              <p
                className={
                  expanded
                    ? "room-description-copy expanded"
                    : "room-description-copy"
                }
              >
                {room.description ||
                  "Người đăng chưa bổ sung mô tả cho phòng này."}
              </p>
              {(room.description?.length ?? 0) > 240 && (
                <button
                  className="text-link room-description-toggle"
                  type="button"
                  aria-expanded={expanded}
                  onClick={() => setExpanded((value) => !value)}
                >
                  {expanded ? "Thu gọn" : "Xem thêm"}
                </button>
              )}
            </section>

            <section className="room-detail-panel room-location-panel">
              <div className="room-detail-panel-heading">
                <div>
                  <h2>Vị trí và khu vực</h2>
                </div>
                <span className="room-detail-heading-icon">
                  <Icon name="pin" size={17} />
                </span>
              </div>
              <p className="room-detail-full-address">
                <Icon name="pin" size={14} />
                {room.location}
              </p>
              <div className="room-detail-map-wrap">
                {mapInfo ? (
                  <Suspense
                    fallback={
                      <div className="room-detail-map map-loading">
                        Đang tải bản đồ…
                      </div>
                    }
                  >
                    <RoomMap
                      className="room-detail-map"
                      listings={[
                        {
                          id: room.id,

                          title: room.title,

                          price: room.price,

                          area: room.area,

                          location: room.location,

                          latitude: mapInfo.center[0],

                          longitude: mapInfo.center[1],
                        },
                      ]}
                      center={mapInfo.center}
                      zoom={mapInfo.isExact ? 15 : 14}
                      note={
                        mapInfo.isExact
                          ? "Vị trí hiển thị gần đúng theo địa chỉ tin đăng. Xác nhận địa chỉ trước khi hẹn xem."
                          : `Vị trí hiển thị ước tính theo khu vực ${room.location}. Hãy liên hệ người đăng để xác nhận địa chỉ cụ thể.`
                      }
                    />
                  </Suspense>
                ) : (
                  <div className="room-location-unavailable">
                    <Icon name="pin" size={17} />
                    <div>
                      <strong>Chưa có vị trí bản đồ cho phòng này</strong>
                      <span>
                        Hãy nhắn người đăng để xác nhận địa chỉ cụ thể trước khi
                        đi xem.
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </section>

            <section className="room-detail-panel room-reviews-panel reviews">
              <div className="review-head">
                <div className="review-heading-copy">
                  <h2>Đánh giá từ người thuê</h2>
                  <small>
                    {roomReviews.length
                      ? `${roomReviews.length} nhận xét`
                      : "Chưa có đánh giá"}
                  </small>
                </div>
                {roomReviews.length > 0 && (
                  <div
                    className="review-rating-summary"
                    aria-label={`Điểm trung bình ${average.toFixed(1)} trên 5`}
                  >
                    <strong>{average.toFixed(1)}</strong>
                    <div>
                      <span className="review-average-stars" aria-hidden="true">
                        {[1, 2, 3, 4, 5].map((value) => (
                          <Icon key={value} name="star" size={13} />
                        ))}
                      </span>
                      <small>Điểm trung bình</small>
                    </div>
                  </div>
                )}
              </div>
              {roomReviews.map((review) => (
                <article className="comment review-card" key={review.id}>
                  <Link
                    className="avatar peach profile-avatar-link"
                    to={`/nguoi-dung/${review.authorId}`}
                    aria-label={`Xem hồ sơ ${review.author}`}
                  >
                    <img
                      className="user-avatar-image"
                      src={
                        users?.find((u) => u.id === review.authorId)?.avatarUrl ||
                        "/images/avatars/default-brand-avatar.png"
                      }
                      alt=""
                      onError={(e) => {
                        e.currentTarget.onerror = null
                        e.currentTarget.src = "/images/avatars/default-brand-avatar.png"
                      }}
                    />
                  </Link>
                  <div className="review-copy">
                    <div className="review-meta">
                      <Link
                        className="review-author-link"
                        to={`/nguoi-dung/${review.authorId}`}
                      >
                        {review.author}
                      </Link>
                      <span
                        className="stars"
                        aria-label={`${review.stars} sao`}
                      >
                        {[1, 2, 3, 4, 5].map((value) => (
                          <span
                            className={
                              value <= review.stars ? "star-filled" : ""
                            }
                            key={value}
                          >
                            <Icon name="star" size={13} />
                          </span>
                        ))}
                      </span>
                      <small>{formatRelativeTime(review.createdAt)}</small>
                    </div>
                    <p>{review.text}</p>
                  </div>
                  {review.authorId === user?.id && (
                    <div className="review-actions">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingReview(review)
                          setText(review.text)
                          setStars(review.stars)
                        }}
                      >
                        Sửa
                      </button>
                      <button
                        type="button"
                        disabled={Boolean(pendingAction)}
                        onClick={async () => {
                          if (!window.confirm("Xóa đánh giá này?")) return
                          setPendingAction("delete-review")
                          setActionError("")
                          try {
                            await deleteReview(review.id)
                            toast("Đã xóa đánh giá.", "info")
                          } catch (error) {
                            setActionError(
                              error instanceof Error
                                ? error.message
                                : "Chưa xóa được đánh giá.",
                            )
                          } finally {
                            setPendingAction("")
                          }
                        }}
                      >
                        Xóa
                      </button>
                    </div>
                  )}
                </article>
              ))}
              {canReview ? (
                <form className="review-form" onSubmit={submitReview}>
                  <label className="form-field">
                    <span>
                      {myReview
                        ? "Cập nhật đánh giá của bạn"
                        : "Chia sẻ trải nghiệm thuê phòng"}
                    </span>
                    <div
                      className="star-picker"
                      role="group"
                      aria-label="Số sao"
                    >
                      {[1, 2, 3, 4, 5].map((value) => (
                        <button
                          type="button"
                          aria-label={`${value} sao`}
                          aria-pressed={stars === value}
                          key={value}
                          onClick={() => setStars(value)}
                        >
                          <span className={value <= stars ? "star-filled" : ""}>
                            <Icon name="star" size={20} />
                          </span>
                        </button>
                      ))}
                    </div>
                    <textarea
                      required
                      minLength={5}
                      maxLength={2000}
                      rows={3}
                      value={text}
                      onChange={(event) => setText(event.target.value)}
                      placeholder="Phòng có đúng như mô tả không? Chủ trọ phản hồi thế nào?"
                    />
                  </label>
                  <Button icon="send" disabled={Boolean(pendingAction)}>
                    {pendingAction === "review"
                      ? "Đang lưu…"
                      : editingReview || myReview
                        ? "Lưu đánh giá"
                        : "Gửi đánh giá"}
                  </Button>
                </form>
              ) : (
                <p className="review-login-hint">
                  {!user
                    ? "Đăng nhập bằng tài khoản người thuê được ghi nhận cho phòng để gửi đánh giá."
                    : user.role !== "renter"
                      ? "Chỉ người thuê mới có thể đánh giá phòng."
                      : "Chủ trọ cần ghi nhận bạn là người thuê hiện tại của phòng này trước khi gửi đánh giá."}
                </p>
              )}
            </section>
          </div>

          <aside className="room-detail-side-column">
            <div className="landlord-card room-contact-card">
              <div className="landlord-top">
                {landlordAvatarUrl && !ownerAvatarFailed ? (
                  <img
                    className="avatar large landlord-avatar-image"
                    src={landlordAvatarUrl}
                    onError={() => setOwnerAvatarFailed(true)}
                    alt={`Ảnh đại diện ${ownerDisplayName}`}
                  />
                ) : room.ownerId ? (
                  <Link
                    className="profile-avatar-link"
                    to={"/nguoi-dung/" + room.ownerId}
                    aria-label={"Xem hồ sơ " + room.ownerName}
                  >
                    <span className="avatar large">
                      {room.ownerName
                        .split(" ")
                        .map((part) => part[0])
                        .slice(-2)
                        .join("")}
                    </span>
                  </Link>
                ) : (
                  <span className="avatar large">CT</span>
                )}
                <div>
                  <small>Chủ trọ</small>
                  {room.ownerId ? (
                    <Link
                      className="landlord-profile-name"
                      to={"/nguoi-dung/" + room.ownerId}
                    >
                      <h3>{room.ownerName}</h3>
                    </Link>
                  ) : (
                    <h3>{ownerDisplayName}</h3>
                  )}
                  <span>
                    {room.ownerId
                      ? "Người đăng trên Trọ Ơi"
                      : "Thông tin liên hệ đang cập nhật"}
                  </span>
                </div>
              </div>
              <div className="landlord-stats">
                <span>
                  <b>{room.views}</b>Lượt xem
                </span>
                <span>
                  <b>{room.ownerId ? room.contacts : galleryPhotos.length}</b>
                  {room.ownerId ? "Lượt liên hệ" : "Ảnh phòng"}
                </span>
                <span>
                  <b>{roomReviews.length ? average.toFixed(1) : "—"}</b>Đánh giá
                </span>
              </div>
              {room.ownerId &&
                room.ownerId !== user?.id &&
                room.status === "active" &&
                user?.role !== "admin" && (
                  <Button
                    icon="chat"
                    disabled={Boolean(pendingAction)}
                    onClick={contact}
                  >
                    {pendingAction === "contact"
                      ? "Đang mở cuộc trò chuyện…"
                      : "Nhắn tin hỏi phòng"}
                  </Button>
                )}
              {room.ownerId && room.status === "active" && (
                <Button
                  variant="outline"
                  icon="phone"
                  disabled={Boolean(pendingAction)}
                  onClick={async () => {
                    if (!showPhone) {
                      setPendingAction("phone")
                      setActionError("")
                      try {
                        const phone = isApiMode
                          ? await incrementListingContacts(room.id)
                          : room.phone
                        setContactPhone(phone ?? "")
                        setShowPhone(true)
                      } catch (error) {
                        setActionError(
                          error instanceof Error
                            ? error.message
                            : "Chưa tải được số điện thoại.",
                        )
                      } finally {
                        setPendingAction("")
                      }
                    }
                  }}
                >
                  {showPhone
                    ? contactPhone || "Chưa có số liên hệ"
                    : "Hiện số điện thoại"}
                </Button>
              )}
              {actionError && (
                <p className="public-action-error" role="alert">
                  {actionError}
                </p>
              )}
              {!room.ownerId && room.status === "active" && (
                <p>
                  <Icon name="shield" size={15} />
                  Thông tin liên hệ của tin này đang được cập nhật trên Trọ Ơi.
                </p>
              )}
              {room.ownerId && (
                <p>
                  <Icon name="shield" size={15} />
                  {room.status === "rented"
                    ? "Thông tin phòng được giữ lại để người thuê hiện tại gửi đánh giá."
                    : "Kiểm tra giấy tờ và chi phí trước khi đặt cọc."}
                </p>
              )}
              {room.status === "active" && user?.role !== "admin" && (
                <button className="report" onClick={() => setReportOpen(true)}>
                  Báo cáo tin đăng
                </button>
              )}
            </div>

            <div className="room-safety-tips-card">
              <h4>
                <Icon name="shield" size={15} />
                Lưu ý người thuê
              </h4>
              <ul>
                <li>
                  Không chuyển khoản đặt cọc khi chưa xem phòng trực tiếp.
                </li>
                <li>
                  Kiểm tra kỹ hợp đồng thuê và các chi phí phát sinh (điện,
                  nước, rác).
                </li>
                <li>
                  Báo cáo tin đăng nếu phát hiện thông tin không đúng thực tế.
                </li>
              </ul>
            </div>
          </aside>
        </div>
        {/* SECTION 1: Tin đăng tương tự */}
        <section className="nhatot-detail-section" aria-labelledby="similar-listings-title">
          <h2 id="similar-listings-title" className="nhatot-detail-section-title">
            Tin đăng tương tự
          </h2>
          <NhaTotListingSlider
            items={similarListings}
            isFavorite={isFavorite}
            onToggleFavorite={handleToggleFavorite}
            onSelect={(selectedId) => navigate(`/phong/${selectedId}`)}
          />
          <div className="nhatot-view-more-container">
            <Link to="/tim-phong" className="nhatot-view-more-btn">
              Xem thêm
            </Link>
          </div>
        </section>

        {/* SECTION 2: Tin rao khác của người đăng */}
        <section className="nhatot-detail-section" aria-labelledby="owner-listings-title">
          <h2 id="owner-listings-title" className="nhatot-detail-section-title">
            Tin rao khác của {ownerDisplayName}
          </h2>
          <NhaTotListingSlider
            items={ownerOtherListings}
            isFavorite={isFavorite}
            onToggleFavorite={handleToggleFavorite}
            onSelect={(selectedId) => navigate(`/phong/${selectedId}`)}
          />
          <div className="nhatot-view-more-container">
            <Link
              to={`/tim-phong${room.ownerId ? `?owner=${room.ownerId}` : ""}`}
              className="nhatot-view-more-btn"
            >
              Xem thêm
            </Link>
          </div>
        </section>

        {/* SECTION 3: Top môi giới hoạt động tại khu vực */}
        <section className="nhatot-detail-section" aria-labelledby="top-brokers-title">
          <div className="nhatot-top-brokers-head">
            <span className="nhatot-trophy-icon" aria-hidden="true">
              <svg viewBox="0 0 36 36" fill="none" className="size-full">
                <path d="M10 6H26V15C26 19.4183 22.4183 23 18 23C13.5817 23 10 19.4183 10 15V6Z" fill="#FACC15" stroke="#CA8A04" strokeWidth="2" strokeLinejoin="round"/>
                <path d="M10 9H5C4.44772 9 4 9.44772 4 10C4 13.3137 6.68629 16 10 16V9Z" fill="#FEF08A" stroke="#CA8A04" strokeWidth="2" strokeLinejoin="round"/>
                <path d="M26 9H31C31.5523 9 32 9.44772 32 10C32 13.3137 29.3137 16 26 16V9Z" fill="#FEF08A" stroke="#CA8A04" strokeWidth="2" strokeLinejoin="round"/>
                <path d="M18 23V29" stroke="#CA8A04" strokeWidth="2.5" strokeLinecap="round"/>
                <path d="M12 31H24" stroke="#CA8A04" strokeWidth="3" strokeLinecap="round"/>
                <circle cx="18" cy="13" r="3" fill="#EAB308"/>
              </svg>
            </span>
            <div>
              <h2 id="top-brokers-title">Top môi giới hoạt động tại {displayDistrict}</h2>
              <p>Kết nối với môi giới có tin đăng phù hợp với bạn</p>
            </div>
          </div>

          <div className="nhatot-brokers-list">
            {topBrokers.map((broker) => (
              <Link
                key={broker.id + broker.name}
                to={broker.id ? `/nguoi-dung/${broker.id}` : "/tim-phong"}
                className="nhatot-broker-item"
              >
                <img
                  className="nhatot-broker-avatar"
                  src={broker.avatarUrl || "/images/avatars/default-brand-avatar.png"}
                  alt={broker.name}
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.onerror = null
                    e.currentTarget.src = "/images/avatars/default-brand-avatar.png"
                  }}
                />
                <div>
                  <strong className="nhatot-broker-name">{broker.name}</strong>
                  <span className="nhatot-broker-count">{broker.count} tin đăng phù hợp</span>
                </div>
              </Link>
            ))}
          </div>

          <div className="nhatot-view-more-container">
            <Link to="/tim-phong" className="nhatot-view-more-btn">
              Xem thêm
            </Link>
          </div>
        </section>
        {lightboxOpen && (
          <div
            className="room-photo-dialog-backdrop"
            onClick={() => setLightboxOpen(false)}
          >
            <div
              ref={lightboxRef}
              className="room-photo-dialog"
              role="dialog"
              aria-modal="true"
              aria-label={`Ảnh phòng ${room.title}`}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="room-photo-dialog-toolbar">
                <span>
                  Ảnh {galleryIndex + 1} / {galleryPhotos.length}
                </span>
                <button
                  type="button"
                  aria-label="Đóng ảnh lớn"
                  onClick={() => setLightboxOpen(false)}
                >
                  <Icon name="close" size={22} />
                </button>
              </div>
              <img
                src={activeGalleryPhoto}
                alt={`${room.title} — ảnh ${galleryIndex + 1}`}
              />
              {galleryPhotos.length > 1 && (
                <div className="room-photo-dialog-navigation">
                  <button
                    type="button"
                    onClick={() =>
                      setGalleryIndex(
                        (index) =>
                          (index - 1 + galleryPhotos.length) %
                          galleryPhotos.length,
                      )
                    }
                  >
                    <Icon name="chevron" size={18} />
                    Ảnh trước
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setGalleryIndex(
                        (index) => (index + 1) % galleryPhotos.length,
                      )
                    }
                  >
                    Ảnh sau
                    <Icon name="chevron" size={18} />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
        {reportOpen && (
          <ReportDialog
            targetType="Tin phòng"
            targetId={room.id}
            targetTitle={room.title}
            onClose={() => setReportOpen(false)}
          />
        )}
      </div>
    </main>
  )
}
