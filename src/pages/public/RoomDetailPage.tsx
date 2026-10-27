import { lazy, Suspense, useEffect, useMemo, useState, type FormEvent } from "react"
import { Link, useNavigate, useParams } from "react-router"
import { Button, Icon, RoomCard } from "@/components/common/legacy"
import { useFavorites } from "@/contexts/FavoritesContext"
import { usePlatform, type RoomReview } from "@/contexts/PlatformContext"
import ReportDialog from "@/components/common/ReportDialog"
import { useToast } from "@/contexts/ToastContext"
import useAuth from "@/hooks/useAuth"
import { isApiMode } from "@/services/apiClient"
import { resolveLocationCoordinates } from "@/utils/mapCoordinates"

const RoomMap = lazy(() => import("@/components/maps/RoomMap"))

export default function RoomDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { user } = useAuth()
  const { listings, users, reviews, saveReview, deleteReview, incrementListingViews, incrementListingContacts, startConversation } = usePlatform()
  const { isFavorite, toggleFavorite } = useFavorites()
  const { toast } = useToast()
  const [showPhone, setShowPhone] = useState(false)
  const [contactPhone, setContactPhone] = useState("")
  const [reportOpen, setReportOpen] = useState(false)
  const [galleryIndex, setGalleryIndex] = useState(0)
  const [text, setText] = useState("")
  const [stars, setStars] = useState(5)
  const [editingReview, setEditingReview] = useState<RoomReview | null>(null)
  const [expanded, setExpanded] = useState(false)
  const normalizedId = id ? decodeURIComponent(id).trim() : ""
  const room = listings.find((item) => {
    const isMatch = item.id === id || item.id === normalizedId || (normalizedId && item.id === normalizedId.replace(/\s+/g, "-"))
    return isMatch && (
      item.status === "active" ||
      (item.status === "rented" && user?.role === "renter" && item.currentTenantId === user.id)
    )
  })
  const mapInfo = useMemo(() => {
    if (!room) return null
    return resolveLocationCoordinates(room.location, room.latitude, room.longitude)
  }, [room])
  const similarListings = useMemo(() => {
    if (!room) return []

    const roomLocation = room.location.split(",").map((part) => part.trim().toLocaleLowerCase("vi-VN")).filter(Boolean)
    const roomDistrict = roomLocation.length > 1 ? roomLocation[roomLocation.length - 2] : ""
    const roomCity = roomLocation[roomLocation.length - 1] ?? ""

    return listings
      .filter((listing) => listing.status === "active" && listing.id !== room.id)
      .map((listing, index) => {
        const listingLocation = listing.location.split(",").map((part) => part.trim().toLocaleLowerCase("vi-VN")).filter(Boolean)
        const listingDistrict = listingLocation.length > 1 ? listingLocation[listingLocation.length - 2] : ""
        const listingCity = listingLocation[listingLocation.length - 1] ?? ""
        let score = 0

        if (roomDistrict && listingDistrict === roomDistrict) score += 5
        if (roomCity && listingCity === roomCity) score += 2
        if (room.type.toLocaleLowerCase("vi-VN") === listing.type.toLocaleLowerCase("vi-VN")) score += 3
        if (room.priceValue > 0 && listing.priceValue > 0 && Math.abs(room.priceValue - listing.priceValue) / room.priceValue <= 0.25) score += 1

        return { listing, score, index }
      })
      .sort((left, right) => right.score - left.score || left.index - right.index)
      .slice(0, 4)
      .map(({ listing }) => listing)
  }, [listings, room])
  const roomReviews = useMemo(() => reviews.filter((review) => review.listingId === id), [reviews, id])
  const galleryPhotos = room ? [...new Set([room.image, ...(room.gallery ?? [])])].slice(0, 6) : []
  const activeGalleryPhoto = galleryPhotos[galleryIndex] ?? galleryPhotos[0]

  useEffect(() => { if (id && room) incrementListingViews(room.id) }, [id])
  useEffect(() => { setGalleryIndex(0) }, [id])
  if (!room) return <main className="workspace-page"><div className="container workspace-container"><section className="empty-state"><span className="placeholder-icon"><Icon name="building"/></span><h1>Phòng này không còn hiển thị</h1><p>Có thể tin đã được cho thuê hoặc chủ trọ đã tạm ẩn.</p><Button onClick={() => navigate("/tim-phong")}>Tìm phòng khác</Button></section></div></main>

  const saved = isFavorite(room.id)
  const ownerDisplayName = room.ownerName || "Chủ phòng"
  const landlordAvatarUrl = room.ownerAvatarUrl || users?.find((u) => u.id === room.ownerId)?.avatarUrl
  const average = roomReviews.length ? roomReviews.reduce((sum, item) => sum + item.stars, 0) / roomReviews.length : 0
  const myReview = roomReviews.find((review) => review.authorId === user?.id)
  const canReview = user?.role === "renter" && room.currentTenantId === user.id
  const contact = async () => {
    if (!user) { navigate("/dang-nhap", { state: { from: `/phong/${room.id}` } }); return }
    const conversation = await startConversation({ accountId: user.id, name: room.ownerName, avatar: room.ownerName.split(" ").map((part) => part[0]).slice(-2).join(""), avatarUrl: landlordAvatarUrl || room.ownerAvatarUrl, userId: room.ownerId, roomId: room.id })
    if (!conversation) return
    incrementListingContacts(room.id)
    navigate(`/tin-nhan?conversation=${conversation}`)
  }
  const submitReview = async (event: FormEvent) => {
    event.preventDefault()
    if (!canReview) {
      if (!user) navigate("/dang-nhap", { state: { from: `/phong/${room.id}` } })
      return
    }
    if (!text.trim()) return
    const previousReview = editingReview ?? myReview
    try {
      await saveReview({ id: previousReview?.id ?? `review-${Date.now()}`, listingId: room.id, authorId: user.id, author: user.name, initials: user.initials, stars, text: text.trim(), createdAt: previousReview?.createdAt ?? "Vừa xong" })
      setText("")
      setEditingReview(null)
    } catch {
      // Shared API status banner reports remote validation failures.
    }
  }

  return (
    <main className="page-bg detail-page"><div className="container workspace-container">
      <div className="breadcrumbs">
        <Link to="/">Trang chủ</Link>
        <span>/</span>
        <Link to="/tim-phong">Tìm phòng</Link>
        <span>/</span>
        <span>{room.location}</span>
      </div>
      <div className="room-detail-showcase">
        <div className="room-detail-main-column">
          {activeGalleryPhoto && <section className="room-gallery-carousel" aria-label={`Thư viện ảnh của ${room.title}`}>
            <div className="room-gallery-stage">
              <img className="room-gallery-main" src={activeGalleryPhoto} alt={`${room.title} — ảnh ${galleryIndex + 1}`}/>
              <span className="room-gallery-count">{galleryIndex + 1}/{galleryPhotos.length}</span>
              {galleryPhotos.length > 1 && <>
                <button className="room-gallery-arrow room-gallery-previous" type="button" aria-label="Ảnh trước" onClick={() => setGalleryIndex((index) => (index - 1 + galleryPhotos.length) % galleryPhotos.length)}><Icon name="chevron" size={24}/></button>
                <button className="room-gallery-arrow room-gallery-next" type="button" aria-label="Ảnh tiếp theo" onClick={() => setGalleryIndex((index) => (index + 1) % galleryPhotos.length)}><Icon name="chevron" size={24}/></button>
              </>}
            </div>
            {galleryPhotos.length > 1 && <div className="room-gallery-thumbnails" aria-label="Chọn ảnh phòng">{galleryPhotos.map((photo, index) => <button className={index === galleryIndex ? "room-gallery-thumb active" : "room-gallery-thumb"} type="button" key={photo} aria-label={`Xem ảnh ${index + 1}`} aria-pressed={index === galleryIndex} onClick={() => setGalleryIndex(index)}><img src={photo} alt=""/></button>)}</div>}
          </section>}
          <header className="room-detail-summary room-detail-summary-primary">
            <div className="room-detail-summary-top">
              <span className={`verified ${room.type === "Chuyển nhượng" ? "badge-transfer-detail" : ""}`}>
                {room.type === "Chuyển nhượng" ? "🔄 Tin chuyển nhượng phòng trọ" : room.status === "rented" ? "Đã cho thuê · Người thuê có thể đánh giá" : room.badge}
              </span>
              {user?.role !== "admin" && room.status === "active" && (
                <button
                  className={saved ? "save-big saved" : "save-big"}
                  aria-pressed={saved}
                  onClick={() => {
                    if (!user) {
                      navigate("/dang-nhap", { state: { from: "/phong/" + room.id } })
                      return
                    }
                    toggleFavorite(room.id)
                  }}
                >
                  <Icon name="heart" />{saved ? "Đã lưu" : "Lưu tin"}
                </button>
              )}
            </div>
            <h1>{room.title}</h1>
            <p className="room-detail-address-line"><Icon name="pin" size={18} />{room.location}</p>
            <div className="room-detail-quickfacts">
              <div className="room-detail-price-fact"><small>Giá thuê</small><strong>{room.price}<em>/tháng</em></strong></div>
              <div><small>Diện tích</small><strong>{room.area || "Chưa cập nhật"}</strong></div>
              <div><small>Tiền cọc</small><strong>{room.deposit || "Trao đổi khi liên hệ"}</strong></div>
              <div><small>Loại phòng</small><strong>{room.type}</strong></div>
            </div>
          </header>
        </div>
        <aside className="landlord-card room-contact-card">
          <div className="landlord-top">
            {landlordAvatarUrl ? <img className="avatar large landlord-avatar-image" src={landlordAvatarUrl} alt={`Ảnh đại diện ${ownerDisplayName}`} /> : room.ownerId ? <Link className="profile-avatar-link" to={"/nguoi-dung/" + room.ownerId} aria-label={"Xem hồ sơ " + room.ownerName}><span className="avatar large">{room.ownerName.split(" ").map((part) => part[0]).slice(-2).join("")}</span></Link> : <span className="avatar large">CT</span>}
            <div><small>{room.type === "Chuyển nhượng" ? "Người pass phòng (Người thuê)" : "Chủ trọ"}</small>{room.ownerId ? <Link className="landlord-profile-name" to={"/nguoi-dung/" + room.ownerId}><h3>{room.ownerName}</h3></Link> : <h3>{ownerDisplayName}</h3>}<span>{room.ownerId ? "● Đang hoạt động" : "Thông tin liên hệ đang cập nhật"}</span></div>
          </div>
          <div className="landlord-stats">
            <span><b>{room.views}</b>Lượt xem</span>
            <span><b>{room.ownerId ? room.contacts : galleryPhotos.length}</b>{room.ownerId ? "Lượt liên hệ" : "Ảnh phòng"}</span>
            <span><b>{roomReviews.length ? average.toFixed(1) : "—"}</b>Đánh giá</span>
          </div>
          {room.ownerId && room.status === "active" && user?.role !== "admin" && <Button icon="chat" onClick={contact}>{room.type === "Chuyển nhượng" ? "Nhắn tin hỏi pass phòng" : "Nhắn tin hỏi phòng"}</Button>}
          {room.ownerId && room.status === "active" && <Button variant="outline" icon="phone" onClick={async () => { if (!showPhone) { const phone = isApiMode ? await incrementListingContacts(room.id) : room.phone; setContactPhone(phone ?? ""); setShowPhone(true) } }}>{showPhone ? contactPhone || "Chưa có số liên hệ" : "Hiện số điện thoại"}</Button>}
          {!room.ownerId && room.status === "active" && <p><Icon name="shield" size={17}/>Thông tin liên hệ của tin này đang được cập nhật trên Trọ Ơi.</p>}
          {room.ownerId && <p><Icon name="shield" size={17}/>{room.status === "rented" ? "Thông tin phòng được giữ lại để người thuê hiện tại gửi đánh giá." : "Kiểm tra giấy tờ và chi phí trước khi đặt cọc."}</p>}
          {room.status === "active" && user?.role !== "admin" && <button className="report" onClick={() => setReportOpen(true)}>Báo cáo tin đăng</button>}
        </aside>
      </div>
      <div className="detail-layout room-detail-body-layout">
        <article className="detail-content room-detail-content">
          <section className="room-detail-panel room-location-panel">
            <div className="room-detail-panel-heading">
              <div><h2>Vị trí và khu vực</h2></div>
              <span className="room-detail-heading-icon"><Icon name="pin" size={20} /></span>
            </div>
            <p className="room-detail-full-address"><Icon name="pin" size={17} />{room.location}</p>
            <div className="room-detail-map-wrap">
              {mapInfo ? (
                <Suspense fallback={<div className="room-detail-map map-loading">Đang tải bản đồ…</div>}>
                  <RoomMap
                    className="room-detail-map"
                    listings={[{
                      id: room.id,
                      title: room.title,
                      price: room.price,
                      area: room.area,
                      location: room.location,
                      latitude: mapInfo.center[0],
                      longitude: mapInfo.center[1],
                    }]}
                    center={mapInfo.center}
                    zoom={mapInfo.isExact ? 15 : 14}
                    note={mapInfo.isExact
                      ? "Vị trí hiển thị gần đúng theo địa chỉ tin đăng. Xác nhận địa chỉ trước khi hẹn xem."
                      : `Vị trí hiển thị ước tính theo khu vực ${room.location}. Hãy liên hệ người đăng để xác nhận địa chỉ cụ thể.`
                    }
                  />
                </Suspense>
              ) : (
                <div className="room-location-unavailable">
                  <Icon name="pin" size={20} />
                  <div>
                    <strong>Chưa có vị trí bản đồ cho phòng này</strong>
                    <span>Hãy nhắn người đăng để xác nhận địa chỉ cụ thể trước khi đi xem.</span>
                  </div>
                </div>
              )}
            </div>
          </section>

          <section className="room-detail-panel room-features-panel">
            <div className="room-detail-panel-heading"><div><h2>Đặc điểm phòng</h2></div></div>
            <dl className="room-detail-attributes">
              <div><dt><Icon name="building" size={16} />Loại hình</dt><dd>{room.type}</dd></div>
              <div><dt><Icon name="map" size={16} />Diện tích</dt><dd>{room.area || "Chưa cập nhật"}</dd></div>
              <div><dt><Icon name="shield" size={16} />Tiền cọc</dt><dd>{room.deposit || "Trao đổi khi liên hệ"}</dd></div>
              <div><dt><Icon name="home" size={16} />Tình trạng</dt><dd>{room.status === "rented" ? "Đã cho thuê" : "Đang hiển thị"}</dd></div>
            </dl>
            <div className="room-amenities-block">
              <h3>Tiện ích</h3>
              {room.amenities.length ? <div className="room-amenities-list">{room.amenities.map((item) => <span key={item}><i aria-hidden="true"><Icon name="check" size={14}/></i>{item}</span>)}</div> : <p className="room-detail-muted">Người đăng chưa cập nhật tiện ích.</p>}
            </div>
          </section>

          <section className="room-detail-panel room-description-panel">
            <div className="room-detail-panel-heading"><div><h2>Mô tả chi tiết</h2></div></div>
            <p className={expanded ? "room-description-copy expanded" : "room-description-copy"}>{room.description || "Người đăng chưa bổ sung mô tả cho phòng này."}</p>
            {room.description.length > 240 && <button className="text-link room-description-toggle" type="button" aria-expanded={expanded} onClick={() => setExpanded((value) => !value)}>{expanded ? "Thu gọn" : "Xem thêm"}</button>}
          </section>
        <section className="detail-section reviews">
          <div className="review-head">
            <div className="review-heading-copy">
              <h2>Đánh giá từ người thuê</h2>
              <small>{roomReviews.length ? `${roomReviews.length} nhận xét` : "Chưa có đánh giá"}</small>
            </div>
            {roomReviews.length > 0 && (
              <div className="review-rating-summary" aria-label={`Điểm trung bình ${average.toFixed(1)} trên 5`}>
                <strong>{average.toFixed(1)}</strong>
                <div>
                  <span className="review-average-stars" aria-hidden="true">★★★★★</span>
                  <small>Điểm trung bình</small>
                </div>
              </div>
            )}
          </div>
          {roomReviews.map((review) => (
            <article className="comment review-card" key={review.id}>
              <Link className="avatar peach profile-avatar-link" to={`/nguoi-dung/${review.authorId}`} aria-label={`Xem hồ sơ ${review.author}`}>
                {users?.find((u) => u.id === review.authorId)?.avatarUrl ? <img className="user-avatar-image" src={users.find((u) => u.id === review.authorId)?.avatarUrl} alt="" /> : review.initials}
              </Link>
              <div className="review-copy">
                <div className="review-meta">
                  <Link className="review-author-link" to={`/nguoi-dung/${review.authorId}`}>{review.author}</Link>
                  <span className="stars" aria-label={`${review.stars} sao`}>{"★".repeat(review.stars)}{"☆".repeat(5 - review.stars)}</span>
                  <small>{review.createdAt}</small>
                </div>
                <p>{review.text}</p>
              </div>
              {review.authorId === user?.id && (
                <div className="review-actions">
                  <button type="button" onClick={() => { setEditingReview(review); setText(review.text); setStars(review.stars) }}>Sửa</button>
                  <button type="button" onClick={() => { if (window.confirm("Xóa đánh giá này?")) { deleteReview(review.id); toast("Đã xóa đánh giá.", "info"); } }}>Xóa</button>
                </div>
              )}
            </article>
          ))}
          {canReview ? (
            <form className="review-form" onSubmit={submitReview}>
              <label className="form-field">
                <span>{myReview ? "Cập nhật đánh giá của bạn" : "Chia sẻ trải nghiệm thuê phòng"}</span>
                <div className="star-picker" role="radiogroup" aria-label="Số sao">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button type="button" aria-label={`${value} sao`} aria-pressed={stars === value} key={value} onClick={() => setStars(value)}>{value <= stars ? "★" : "☆"}</button>
                  ))}
                </div>
                <textarea rows={3} value={text} onChange={(event) => setText(event.target.value)} placeholder="Phòng có đúng như mô tả không? Chủ trọ phản hồi thế nào?" />
              </label>
              <Button icon="send">{editingReview || myReview ? "Lưu đánh giá" : "Gửi đánh giá"}</Button>
            </form>
          ) : (
            <p className="review-login-hint">{!user ? "Đăng nhập bằng tài khoản người thuê được ghi nhận cho phòng để gửi đánh giá." : user.role !== "renter" ? "Chỉ người thuê mới có thể đánh giá phòng." : "Chủ trọ cần ghi nhận bạn là người thuê hiện tại của phòng này trước khi gửi đánh giá."}</p>
          )}
        </section>
      </article>
      </div>
      <section className="similar-listings-section" aria-labelledby="similar-listings-title">
        <div className="similar-listings-heading">
          <div><h2 id="similar-listings-title">Tin đăng tương tự</h2><p>Các phòng đang hiển thị có khu vực, loại phòng hoặc mức giá gần với tin này.</p></div>
          <Link to="/tim-phong">Xem tất cả phòng <Icon name="chevron" size={16}/></Link>
        </div>
        {similarListings.length ? (
          <div className="similar-listings-grid">
            {similarListings.map((listing) => <RoomCard key={listing.id} room={listing} onClick={() => navigate("/phong/" + listing.id)} />)}
          </div>
        ) : (
          <div className="similar-listings-empty"><Icon name="building" size={22}/><span>Chưa có tin đang hiển thị để gợi ý. Hãy xem tất cả phòng để khám phá thêm.</span><Link to="/tim-phong">Tìm phòng</Link></div>
        )}
      </section>
      {reportOpen && <ReportDialog targetType="Tin phòng" targetId={room.id} targetTitle={room.title} onClose={() => setReportOpen(false)}/>}
    </div></main>
  )
}
