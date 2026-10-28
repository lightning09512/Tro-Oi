import { useEffect, useMemo, useState, type FormEvent } from "react"
import { useSearchParams, useNavigate, Link } from "react-router"
import { Button, Icon } from "@/components/common/legacy"
import { usePlatform } from "@/contexts/PlatformContext"
import { useToast } from "@/contexts/ToastContext"
import useAuth from "@/hooks/useAuth"
import { io } from "socket.io-client"
import { getAccessToken, isApiMode, apiRequest } from "@/services/apiClient"

function PersonAvatar({
  initials,
  avatarUrl,
  active = false,
  className = "",
}: {
  initials: string
  avatarUrl?: string
  active?: boolean
  className?: string
}) {
  return <span className={`avatar ${className}`.trim()}>{avatarUrl ? <img className="user-avatar-image" src={avatarUrl} alt="" /> : initials}{active && <i/>}</span>
}

export default function MessagesPage() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const { user } = useAuth()
  const { toast } = useToast()
  const { messages, listings, users, reviews, addReport, sendMessage, startConversation, markConversationRead, toggleConversationMute, refreshMessages } = usePlatform()
  const [search, setSearch] = useState("")
  const [onlyUnread, setOnlyUnread] = useState(false)
  const [mobileChat, setMobileChat] = useState(false)
  const [message, setMessage] = useState("")
  const [messageError, setMessageError] = useState("")
  const [selectContact, setSelectContact] = useState(false)
  const [contactError, setContactError] = useState("")
  const [startingContactId, setStartingContactId] = useState<string | null>(null)
  const [phoneQuery, setPhoneQuery] = useState("")
  const [phoneSearching, setPhoneSearching] = useState(false)
  const [phoneResults, setPhoneResults] = useState<Array<{ id: string; name: string; initials: string; avatarUrl?: string; phone: string; role: string }>>([])
  const [phoneSearched, setPhoneSearched] = useState(false)
  const [showDetails, setShowDetails] = useState(true)
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false)
  const [scheduleDate, setScheduleDate] = useState("Ngày mai")
  const [scheduleTime, setScheduleTime] = useState("17:30")
  const [scheduleNote, setScheduleNote] = useState("")
  const [reportModalOpen, setReportModalOpen] = useState(false)
  const [reportReason, setReportReason] = useState("Yêu cầu đặt cọc trước khi xem phòng / Có dấu hiệu lừa đảo")
  const [reportDescription, setReportDescription] = useState("")
  const [isSubmittingReport, setIsSubmittingReport] = useState(false)

  const selectedId = params.get("conversation") ?? ""
  const accountMessages = useMemo(() => messages.filter((item) => item.accountId === user?.id), [messages, user?.id])
  const visible = useMemo(() => accountMessages.filter((item) => (!search || `${item.name} ${item.text}`.toLocaleLowerCase("vi").includes(search.toLocaleLowerCase("vi"))) && (!onlyUnread || item.unread)), [accountMessages, search, onlyUnread])
  const selected = accountMessages.find((item) => item.id === selectedId) ?? visible[0]
  const relatedRoom = listings.find((item) => item.id === selected?.roomId)
  const selectedContact = users.find((item) => item.id === selected?.userId)
  const availableContacts = users.filter((item) => item.status === "active" && item.id !== user?.id && item.role !== "admin")

  const isPassRoom = relatedRoom?.type === "Chuyển nhượng"
  const contactListings = useMemo(() => listings.filter((l) => l.ownerId === selectedContact?.id && l.status === "active"), [listings, selectedContact?.id])
  const roomReviews = useMemo(() => (relatedRoom ? reviews.filter((r) => r.listingId === relatedRoom.id) : []), [reviews, relatedRoom])
  const averageRating = roomReviews.length ? roomReviews.reduce((sum, r) => sum + r.stars, 0) / roomReviews.length : 5.0
  const contactPhone = selectedContact?.phone || relatedRoom?.phone || ""
  const galleryPhotos = useMemo(() => (relatedRoom ? [...new Set([relatedRoom.image, ...(relatedRoom.gallery ?? [])])] : []), [relatedRoom])

  useEffect(() => {
    if (!selected || selected.id === selectedId) return
    setParams((current) => ({ ...Object.fromEntries(current), conversation: selected.id }), { replace: true })
  }, [selected?.id, selectedId, setParams])

  useEffect(() => {
    if (selected && user) markConversationRead(selected.id, user.id)
  }, [selected?.id, user?.id])

  useEffect(() => {
    const token = getAccessToken()
    if (!isApiMode || !token || !selected?.id) return
    const socket = io({ auth: { token }, transports: ["websocket", "polling"] })
    const join = () => socket.emit("conversation:join", selected.id)
    socket.on("connect", join)
    socket.on("message:new", () => { void refreshMessages() })
    if (socket.connected) join()
    return () => {
      socket.emit("conversation:leave", selected.id)
      socket.disconnect()
    }
  }, [selected?.id, refreshMessages])

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!selected || !user || !message.trim()) return
    setMessageError("")
    try {
      await sendMessage(selected.id, user.id, message.trim())
      setMessage("")
      setMobileChat(true)
    } catch (error) {
      setMessageError(error instanceof Error ? error.message : "Không gửi được tin nhắn.")
    }
  }
  const startChat = async (contact: { name: string; initials: string; avatarUrl?: string; id: string; roomId: string }) => {
    setStartingContactId(contact.id)
    setContactError("")
    try {
      const conversation = await startConversation({ accountId: user?.id ?? "", name: contact.name, avatar: contact.initials, avatarUrl: contact.avatarUrl, userId: contact.id, roomId: contact.roomId })
      if (!conversation) return
      setParams({ conversation })
      setSelectContact(false)
      setMobileChat(true)
    } catch (error) {
      setContactError(error instanceof Error ? error.message : "Không thể mở cuộc trò chuyện. Vui lòng thử lại.")
    } finally {
      setStartingContactId(null)
    }
  }

  const handlePhoneSearch = async (event?: FormEvent) => {
    if (event) event.preventDefault()
    const q = phoneQuery.trim()
    if (!q) return
    setPhoneSearching(true)
    setContactError("")
    try {
      if (isApiMode) {
        const res = await apiRequest<{ items: Array<{ id: string; name: string; initials: string; avatarUrl?: string; phone: string; role: string }> }>(`members?q=${encodeURIComponent(q)}`)
        setPhoneResults((res.items || []).filter((item: { id: string }) => item.id !== user?.id))
      } else {
        const clean = q.replace(/[\s\.\-]+/g, "").toLowerCase()
        const found = users.filter((u) => {
          if (u.id === user?.id || u.status !== "active") return false
          const uPhone = (u.phone || "").replace(/[\s\.\-]+/g, "")
          return uPhone.includes(clean) || u.name.toLowerCase().includes(q.toLowerCase())
        })
        setPhoneResults(found.map((u) => ({ id: u.id, name: u.name, initials: u.initials, avatarUrl: u.avatarUrl, phone: u.phone || "", role: u.role })))
      }
    } catch (err) {
      setContactError(err instanceof Error ? err.message : "Không thể tìm kiếm lúc này.")
    } finally {
      setPhoneSearching(false)
      setPhoneSearched(true)
    }
  }

  const openPhoneSearch = () => {
    setSelectContact(true)
    setPhoneQuery("")
    setPhoneResults([])
    setPhoneSearched(false)
    setContactError("")
  }

  return (
    <main className="messages-page">
      <div className={`${selected ? "container messenger" : "container messenger is-empty"} ${showDetails ? "has-details" : "no-details"}`}>
        <aside className={mobileChat ? "conversation-list hidden-mobile" : "conversation-list"}>
          <div className="message-title">
            <div>
              <span className="eyebrow">Trao đổi trực tiếp</span>
              <h1>Tin nhắn</h1>
            </div>
            <button aria-label="Tìm bạn qua số điện thoại" title="Tìm bạn qua số điện thoại" onClick={openPhoneSearch}>
              <Icon name="plus" />
            </button>
          </div>
          <button
            type="button"
            className="find-contact-quick-btn"
            onClick={openPhoneSearch}
          >
            <Icon name="phone" size={16} />
            <span>Tìm bạn qua số điện thoại</span>
          </button>
          <label className="message-search">
            <Icon name="search" />
            <input
              className="message-search-field"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm cuộc trò chuyện"
              autoComplete="off"
              spellCheck={false}
            />
            {search && <button type="button" aria-label="Xóa tìm kiếm" onClick={() => setSearch("")}>×</button>}
          </label>
          <div className="message-tabs">
            <button className={!onlyUnread ? "active" : ""} onClick={() => setOnlyUnread(false)}>Tất cả</button>
            <button className={onlyUnread ? "active" : ""} onClick={() => setOnlyUnread(true)}>Chưa đọc</button>
          </div>
          {visible.map((item) => (
            <button
              className={selected?.id === item.id ? "conversation active" : "conversation"}
              key={item.id}
              onClick={() => { setParams({ conversation: item.id }); setMobileChat(true) }}
            >
              <PersonAvatar initials={item.avatar} avatarUrl={item.avatarUrl ?? users.find((member) => member.id === item.userId)?.avatarUrl} active={item.active} />
              <div>
                <strong>{item.name}</strong>
                <span>{item.text}</span>
              </div>
              <small>{item.time}</small>
              {item.unread && <i className="message-unread-dot" />}
            </button>
          ))}
          {visible.length > 0 && accountMessages.length <= 2 && !search && !onlyUnread && (
            <div className="mx-2 mt-5 rounded-xl border border-line bg-page p-4">
              <strong className="block text-sm text-ink">Tiếp tục tìm phòng</strong>
              <p className="mt-1 text-sm leading-relaxed text-muted">Mở tin cho thuê để hỏi thêm về phòng và hẹn lịch xem.</p>
              <Link to="/tim-phong" className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-brand-dark hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">
                Xem tin cho thuê <Icon name="chevron" size={16} />
              </Link>
            </div>
          )}
          {!visible.length && (
            <div className="conversation-empty">
              <strong>{onlyUnread ? "Không có tin nhắn chưa đọc" : search ? "Không tìm thấy cuộc trò chuyện" : "Chưa có cuộc trò chuyện"}</strong>
              <p>{onlyUnread ? "Các cuộc trò chuyện mới sẽ xuất hiện ở đây." : search ? "Thử tìm bằng tên người liên hệ hoặc nội dung tin nhắn." : "Chọn một người để bắt đầu trao đổi về phòng trọ."}</p>
              {!onlyUnread && !search && <Button onClick={() => setSelectContact(true)}>Bắt đầu trò chuyện</Button>}
            </div>
          )}
        </aside>

        {selected ? (
          <section className={mobileChat ? "chat-window open-mobile" : "chat-window"}>
            <div className="chat-head">
              <button className="back-chat" aria-label="Quay lại danh sách" onClick={() => setMobileChat(false)}>‹</button>
              <Link className="profile-avatar-link" to={`/nguoi-dung/${selected.userId}`} aria-label={`Xem hồ sơ ${selected.name}`}>
                <PersonAvatar initials={selected.avatar} avatarUrl={selected.avatarUrl ?? selectedContact?.avatarUrl} active={selected.active} />
              </Link>
              <Link className="chat-contact" to={`/nguoi-dung/${selected.userId}`}>
                <strong>{selected.name}</strong>
                <span>{selected.active ? "Đang hoạt động" : "Có thể trả lời sau"}</span>
              </Link>
              <div className="chat-head-actions">
                {relatedRoom && (
                  <button className="chat-listing-action" type="button" aria-label="Xem tin phòng" onClick={() => navigate(`/phong/${relatedRoom.id}`)}>
                    <Icon name="building" size={17} />
                    <span>Xem tin phòng</span>
                  </button>
                )}
                <button
                  className={selected.muted ? "chat-mute muted" : "chat-mute"}
                  aria-label={selected.muted ? "Bật thông báo cuộc trò chuyện" : "Tắt thông báo cuộc trò chuyện"}
                  aria-pressed={Boolean(selected.muted)}
                  onClick={() => {
                    toggleConversationMute(selected.id, user?.id ?? "")
                    toast(selected.muted ? "Đã bật thông báo cuộc trò chuyện." : "Đã tắt thông báo cuộc trò chuyện.", "info")
                  }}
                  title={selected.muted ? "Bật thông báo" : "Tắt thông báo"}
                >
                  <Icon name="bell" />
                </button>
                <button
                  className={`chat-info-toggle ${showDetails ? "active" : ""}`}
                  type="button"
                  aria-label="Thông tin chi tiết"
                  title={showDetails ? "Ẩn thông tin bên phải" : "Hiện thông tin bên phải"}
                  onClick={() => setShowDetails((prev) => !prev)}
                >
                  <Icon name="info" size={18} />
                </button>
              </div>
            </div>

            <div className="chat-body">
              {relatedRoom && (
                <div
                  className="chat-room-card"
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(`/phong/${relatedRoom.id}`)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault()
                      navigate(`/phong/${relatedRoom.id}`)
                    }
                  }}
                >
                  <img src={relatedRoom.image} alt={relatedRoom.title} />
                  <div>
                    <small>{(user?.role === "landlord" || (relatedRoom && relatedRoom.ownerId === user?.id)) ? "Khách đang hỏi về phòng của bạn" : "Bạn đang hỏi về phòng"}</small>
                    <strong>{relatedRoom.title}</strong>
                    <span>
                      <b>{relatedRoom.price}/tháng</b>
                      <i>·</i>
                      {relatedRoom.location}
                    </span>
                  </div>
                  <Icon name="chevron" size={17} />
                </div>
              )}
              <div className={selected.messages.length ? "chat-history" : "chat-history empty"}>
                {selected.messages.length ? (
                  <>
                    <span className="chat-date">Tin nhắn gần đây</span>
                    {selected.messages.map((item) => {
                      const isMe = item.from === "me"
                      const themAvatar = selected.avatarUrl ?? selectedContact?.avatarUrl
                      return (
                        <div className={`chat-msg-row ${isMe ? "sent-row" : "received-row"}`} key={item.id}>
                          {!isMe && (
                            <span className="chat-msg-avatar avatar mini-avatar" aria-hidden="true">
                              {themAvatar ? <img className="user-avatar-image" src={themAvatar} alt="" /> : selected.avatar}
                            </span>
                          )}
                          <div className={isMe ? "bubble sent" : "bubble received"}>
                            <span>{item.text}</span>
                            <time className="bubble-time">{item.time}</time>
                          </div>
                        </div>
                      )
                    })}
                  </>
                ) : (
                  <div className="chat-first-message">
                    <span className="placeholder-icon"><Icon name="chat" /></span>
                    <strong>Chưa có tin nhắn</strong>
                    <p>Gửi câu hỏi để bắt đầu trao đổi{relatedRoom ? " về phòng này." : "."}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="chat-composer">
              {messageError && <p className="form-message error" role="alert">{messageError}</p>}
              {user?.role !== "landlord" && (!relatedRoom || relatedRoom.ownerId !== user?.id) && !message.trim() && (
                <div className="chat-quick-actions" aria-label="Gợi ý tin nhắn">
                  {(relatedRoom
                    ? [
                        "Dạ phòng này còn trống không ạ?",
                        "Chiều nay em qua xem phòng được không ạ?",
                        "Chi phí điện nước và gửi xe thế nào ạ?",
                      ]
                    : [
                        "Dạ em chào anh/chị ạ!",
                        "Cho mình xin thêm thông tin phòng với nhé!",
                        "Phòng này giờ giấc tự do không bạn?",
                      ]
                  ).map((reply) => (
                    <button type="button" key={reply} onClick={() => setMessage(reply)}>
                      {reply}
                    </button>
                  ))}
                </div>
              )}
              <form className="chat-input" onSubmit={submit}>
                <button className="chat-emoji-btn" type="button" aria-label="Chèn biểu tượng cảm xúc" onClick={() => setMessage((value) => `${value}🙂`)}>
                  <Icon name="smile" size={20} />
                </button>
                <div className="chat-text-entry">
                  <input
                    id="message-entry"
                    className="chat-entry-input"
                    aria-label="Viết tin nhắn"
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    placeholder="Viết tin nhắn..."
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                  />
                </div>
                <button className="send-btn" aria-label="Gửi tin nhắn" disabled={!message.trim()}>
                  <Icon name="send" size={18} />
                </button>
              </form>
            </div>
          </section>
        ) : (
          <section className="chat-window chat-empty">
            <span className="placeholder-icon"><Icon name="chat" size={32} /></span>
            <h2>Tin nhắn của bạn</h2>
            <p>Hỏi thêm về giá, tiện ích hoặc hẹn xem phòng với người đăng tin. Mọi cuộc trao đổi được lưu an toàn tại đây.</p>
            <Button onClick={() => setSelectContact(true)}>Bắt đầu trò chuyện</Button>
          </section>
        )}

        {selected && showDetails && (
          <aside className="chat-details-panel">
            <div className="chat-details-topbar">
              <span className="details-topbar-title">Thông tin liên hệ</span>
              <button
                className="details-close-btn"
                type="button"
                onClick={() => setShowDetails(false)}
                title="Thu gọn thông tin"
                aria-label="Đóng bảng thông tin"
              >
                <Icon name="close" size={16} />
              </button>
            </div>

            <div className="chat-details-scrollarea">
              {/* Profile Card */}
              <div className="chat-profile-card">
                <div className="chat-avatar-container">
                  <PersonAvatar
                    className="xlarge"
                    initials={selected.avatar}
                    avatarUrl={selected.avatarUrl ?? selectedContact?.avatarUrl}
                    active={selected.active}
                  />
                  {selected.active && <span className="online-indicator" title="Đang online">Online</span>}
                </div>

                <h3 className="profile-name">{selected.name}</h3>
                <span className={`profile-role-pill ${isPassRoom ? "role-transfer" : ""}`}>
                  {isPassRoom
                    ? "🔄 Người pass phòng"
                    : selectedContact?.role === "landlord"
                    ? "Chủ trọ chính chủ"
                    : selectedContact?.role === "renter"
                    ? "Người tìm phòng"
                    : "Thành viên Trọ Ơi"}
                </span>

                <div className="profile-stats-row">
                  <span className="stat-badge" title="Tài khoản đã xác minh">
                    <Icon name="shield" size={13} /> Xác thực
                  </span>
                  <span className="stat-badge" title="Đánh giá phản hồi">
                    <Icon name="star" size={13} /> {roomReviews.length ? `${averageRating.toFixed(1)}/5` : "5.0/5"}
                  </span>
                  <span className="stat-badge" title="Tin đăng hiện tại">
                    <Icon name="building" size={13} /> {contactListings.length || 1} tin
                  </span>
                </div>

                {/* Quick Action Tools */}
                <div className="profile-quick-actions">
                  {contactPhone ? (
                    <button
                      type="button"
                      className="quick-action-btn"
                      onClick={() => {
                        navigator.clipboard?.writeText(contactPhone)
                        toast(`Đã sao chép số điện thoại: ${contactPhone}`, "success")
                      }}
                      title={`Gọi hoặc sao chép: ${contactPhone}`}
                    >
                      <span className="action-icon-circle action-call"><Icon name="phone" size={16} /></span>
                      <span className="action-label">Gọi / SĐT</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="quick-action-btn"
                      onClick={() => toast("Chủ phòng chưa công khai số điện thoại trực tiếp.", "info")}
                      title="Chưa có SĐT"
                    >
                      <span className="action-icon-circle"><Icon name="phone" size={16} /></span>
                      <span className="action-label">SĐT ẩn</span>
                    </button>
                  )}

                  <button
                    type="button"
                    className="quick-action-btn"
                    onClick={() => setScheduleModalOpen(true)}
                    title="Hẹn lịch xem phòng trực tiếp"
                  >
                    <span className="action-icon-circle action-schedule"><Icon name="calendar" size={16} /></span>
                    <span className="action-label">Hẹn xem</span>
                  </button>

                  <button
                    type="button"
                    className={`quick-action-btn ${selected.muted ? "is-muted" : ""}`}
                    onClick={() => {
                      toggleConversationMute(selected.id, user?.id ?? "")
                      toast(selected.muted ? "Đã bật chuông cuộc trò chuyện." : "Đã tắt chuông cuộc trò chuyện.", "info")
                    }}
                    title={selected.muted ? "Bật thông báo" : "Tắt thông báo"}
                  >
                    <span className="action-icon-circle action-mute"><Icon name="bell" size={16} /></span>
                    <span className="action-label">{selected.muted ? "Bật chuông" : "Tắt chuông"}</span>
                  </button>

                  <Link
                    to={`/nguoi-dung/${selected.userId}`}
                    className="quick-action-btn"
                    title="Xem trang cá nhân đầy đủ"
                  >
                    <span className="action-icon-circle action-profile"><Icon name="users" size={16} /></span>
                    <span className="action-label">Hồ sơ</span>
                  </Link>
                </div>
              </div>

              {/* Room Spotlight (Phòng đang trao đổi) */}
              {relatedRoom && (
                <div className="chat-room-spotlight">
                  <div className="spotlight-header">
                    <span className="spotlight-title">Phòng đang trao đổi</span>
                    {relatedRoom.type === "Chuyển nhượng" ? (
                      <span className="spotlight-badge transfer">🔄 Chuyển nhượng</span>
                    ) : (
                      <span className="spotlight-badge standard">Đang cho thuê</span>
                    )}
                  </div>

                  <div className="spotlight-card">
                    <div className="spotlight-thumb-wrap" onClick={() => navigate(`/phong/${relatedRoom.id}`)}>
                      <img src={relatedRoom.image} alt={relatedRoom.title} />
                      <span className="spotlight-price-pill">{relatedRoom.price}<small>/tháng</small></span>
                    </div>

                    <div className="spotlight-content">
                      <h4 className="spotlight-room-name" onClick={() => navigate(`/phong/${relatedRoom.id}`)}>
                        {relatedRoom.title}
                      </h4>
                      <p className="spotlight-room-location">
                        <Icon name="pin" size={14} />
                        <span>{relatedRoom.location}</span>
                      </p>

                      <div className="spotlight-specs-row">
                        <span className="spec-tag"><Icon name="building" size={13} /> {relatedRoom.area || "25 m²"}</span>
                        <span className="spec-tag"><Icon name="shield" size={13} /> {relatedRoom.deposit || "Cọc thỏa thuận"}</span>
                      </div>

                      {galleryPhotos.length > 1 && (
                        <div className="spotlight-gallery-strip">
                          {galleryPhotos.slice(0, 4).map((photo, i) => (
                            <img
                              key={i}
                              src={photo}
                              alt=""
                              onClick={() => navigate(`/phong/${relatedRoom.id}`)}
                              title="Xem thêm ảnh phòng"
                            />
                          ))}
                        </div>
                      )}

                      <div className="spotlight-cta-row">
                        <button
                          type="button"
                          className="spotlight-view-btn"
                          onClick={() => navigate(`/phong/${relatedRoom.id}`)}
                        >
                          <span>Xem chi tiết tin</span>
                          <Icon name="chevron" size={14} />
                        </button>
                        <button
                          type="button"
                          className="spotlight-share-btn"
                          onClick={() => {
                            const url = window.location.origin + `/phong/${relatedRoom.id}`
                            navigator.clipboard?.writeText(url)
                            toast("Đã sao chép link tin phòng!", "success")
                          }}
                          title="Sao chép link phòng"
                        >
                          <Icon name="share" size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Safety & Trust Box */}
              <div className="chat-safety-box">
                <div className="safety-box-title">
                  <Icon name="shield" size={16} />
                  <span>Mẹo giao dịch an toàn</span>
                </div>
                <ul className="safety-box-list">
                  <li>Không đặt cọc hoặc chuyển khoản trước khi đến tận nơi xem phòng thực tế.</li>
                  {isPassRoom ? (
                    <li>Với tin pass phòng: Hãy yêu cầu lập phụ lục hợp đồng sang tên cọc có chủ trọ xác nhận.</li>
                  ) : (
                    <li>Yêu cầu chủ phòng giải thích rõ ràng giá điện, nước, internet và phí dịch vụ.</li>
                  )}
                  <li>Hẹn xem phòng vào ban ngày hoặc đi cùng bạn bè để đảm bảo an toàn.</li>
                </ul>

                <button
                  type="button"
                  className="safety-report-trigger"
                  onClick={() => setReportModalOpen(true)}
                >
                  <Icon name="flag" size={13} />
                  <span>Báo cáo cuộc trò chuyện này</span>
                </button>
              </div>
            </div>
          </aside>
        )}

        {/* Schedule Modal (Hẹn lịch xem phòng) */}
        {scheduleModalOpen && (
          <div className="dialog-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setScheduleModalOpen(false) }}>
            <section className="action-dialog schedule-dialog" role="dialog" aria-modal="true" aria-labelledby="schedule-modal-title">
              <button className="dialog-close" onClick={() => setScheduleModalOpen(false)} aria-label="Đóng"><Icon name="close" /></button>
              <div className="dialog-header-custom">
                <span className="dialog-badge-icon schedule-badge-icon"><Icon name="calendar" size={22} /></span>
                <div>
                  <h2 id="schedule-modal-title">Hẹn lịch xem phòng</h2>
                  <p className="dialog-subtitle">Gửi lời hẹn trực tiếp tới {selected.name}</p>
                </div>
              </div>

              <div className="schedule-form-body">
                {relatedRoom && (
                  <div className="schedule-room-preview">
                    <img src={relatedRoom.image} alt={relatedRoom.title} />
                    <div>
                      <strong>{relatedRoom.title}</strong>
                      <span>{relatedRoom.price}/tháng · {relatedRoom.location}</span>
                    </div>
                  </div>
                )}

                <div className="schedule-field-group">
                  <label className="schedule-label">Chọn ngày xem:</label>
                  <div className="schedule-pill-group">
                    {["Hôm nay", "Ngày mai", "Ngày kia"].map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        className={`schedule-pill ${scheduleDate === opt ? "active" : ""}`}
                        onClick={() => setScheduleDate(opt)}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="schedule-field-group">
                  <label className="schedule-label">Khung giờ dự kiến:</label>
                  <div className="schedule-time-grid">
                    {["09:30", "11:30", "14:30", "17:30", "18:30", "19:30"].map((t) => (
                      <button
                        key={t}
                        type="button"
                        className={`time-chip ${scheduleTime === t ? "active" : ""}`}
                        onClick={() => setScheduleTime(t)}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="schedule-field-group">
                  <label className="schedule-label" htmlFor="schedule-note">Ghi chú thêm (tùy chọn):</label>
                  <input
                    id="schedule-note"
                    className="schedule-note-input"
                    value={scheduleNote}
                    onChange={(e) => setScheduleNote(e.target.value)}
                    placeholder="VD: Em đi xe máy qua, tới nơi em alo trước 10 phút ạ..."
                    autoComplete="off"
                  />
                </div>

                <div className="schedule-preview-box">
                  <small>Xem trước nội dung tin nhắn:</small>
                  <p>
                    📅 <b>[LỜI HẸN XEM PHÒNG]</b> Em muốn hẹn xem phòng vào lúc <b>{scheduleTime}</b> ({scheduleDate.toLowerCase()}){scheduleNote ? `. Ghi chú: ${scheduleNote}` : ""}. Anh/chị có tiện giờ này không ạ?
                  </p>
                </div>
              </div>

              <div className="dialog-actions-row">
                <button type="button" className="btn-cancel" onClick={() => setScheduleModalOpen(false)}>Hủy</button>
                <button
                  type="button"
                  className="btn-confirm-schedule"
                  onClick={async () => {
                    const formattedMsg = `📅 [LỜI HẸN XEM PHÒNG] Em muốn hẹn xem phòng vào lúc ${scheduleTime} (${scheduleDate.toLowerCase()})${scheduleNote ? `. Ghi chú: ${scheduleNote}` : ""}. Anh/chị có tiện giờ này không ạ?`
                    try {
                      await sendMessage(selected.id, user?.id ?? "", formattedMsg)
                      setScheduleModalOpen(false)
                      setScheduleNote("")
                      toast("Đã gửi lời hẹn xem phòng thành công!", "success")
                    } catch {
                      toast("Không thể gửi tin nhắn hẹn, vui lòng thử lại.", "error")
                    }
                  }}
                >
                  Xác nhận gửi lời hẹn
                </button>
              </div>
            </section>
          </div>
        )}

        {/* Report Modal (Báo cáo cuộc trò chuyện) */}
        {reportModalOpen && (
          <div className="dialog-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setReportModalOpen(false) }}>
            <section className="action-dialog report-dialog" role="dialog" aria-modal="true" aria-labelledby="report-modal-title">
              <button className="dialog-close" onClick={() => setReportModalOpen(false)} aria-label="Đóng"><Icon name="close" /></button>
              <div className="dialog-header-custom">
                <span className="dialog-badge-icon report-badge-icon"><Icon name="flag" size={22} /></span>
                <div>
                  <h2 id="report-modal-title">Báo cáo cuộc trò chuyện</h2>
                  <p className="dialog-subtitle">Báo cáo hành vi vi phạm của {selected.name} để BQT kiểm duyệt</p>
                </div>
              </div>

              <div className="report-form-body">
                <div className="report-field-group">
                  <label className="schedule-label">Lý do báo cáo:</label>
                  <div className="report-radio-list">
                    {[
                      "Yêu cầu đặt cọc trước khi xem phòng / Có dấu hiệu lừa đảo",
                      "Thông tin phòng hoặc giá thuê sai lệch thực tế",
                      "Ngôn từ quấy rối, xúc phạm hoặc thái độ không phù hợp",
                      "Spam hoặc quảng cáo dịch vụ khác",
                      "Khác",
                    ].map((reason) => (
                      <label key={reason} className="report-radio-label">
                        <input
                          type="radio"
                          name="reportReason"
                          value={reason}
                          checked={reportReason === reason}
                          onChange={(e) => setReportReason(e.target.value)}
                        />
                        <span>{reason}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="report-field-group">
                  <label className="schedule-label" htmlFor="report-desc">Mô tả chi tiết vi phạm:</label>
                  <textarea
                    id="report-desc"
                    className="report-desc-input"
                    rows={3}
                    value={reportDescription}
                    onChange={(e) => setReportDescription(e.target.value)}
                    placeholder="Cung cấp thêm chi tiết hoặc bằng chứng để BQT xử lý nhanh hơn..."
                  />
                </div>
              </div>

              <div className="dialog-actions-row">
                <button type="button" className="btn-cancel" onClick={() => setReportModalOpen(false)}>Hủy</button>
                <button
                  type="button"
                  className="btn-confirm-report"
                  disabled={isSubmittingReport}
                  onClick={async () => {
                    if (!user) return
                    setIsSubmittingReport(true)
                    try {
                      await addReport({
                        reporterId: user.id,
                        reporter: user.name,
                        targetType: "Tin phòng",
                        targetId: relatedRoom?.id ?? selected.id,
                        targetTitle: relatedRoom?.title ?? `Cuộc trò chuyện với ${selected.name}`,
                        reason: reportReason,
                        description: reportDescription || `Người dùng ${user.name} báo cáo cuộc trò chuyện với ${selected.name}: ${reportReason}`,
                      })
                      setReportModalOpen(false)
                      setReportDescription("")
                      toast("Cảm ơn bạn! Đội ngũ kiểm duyệt Trọ Ơi đã tiếp nhận báo cáo và sẽ xác minh xử lý.", "success")
                    } catch {
                      toast("Có lỗi xảy ra khi gửi báo cáo.", "error")
                    } finally {
                      setIsSubmittingReport(false)
                    }
                  }}
                >
                  {isSubmittingReport ? "Đang gửi..." : "Gửi báo cáo"}
                </button>
              </div>
            </section>
          </div>
        )}

        {selectContact && (
          <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectContact(false) }}>
            <section className="action-dialog zalo-contact-dialog" role="dialog" aria-modal="true" aria-labelledby="contact-picker-title">
              <button className="dialog-close" onClick={() => setSelectContact(false)} aria-label="Đóng"><Icon name="close" /></button>
              <span className="eyebrow">Kết nối & Nhắn tin</span>
              <h2 id="contact-picker-title">Tìm bạn qua số điện thoại</h2>
              <p className="contact-picker-intro">Nhập chính xác số điện thoại của người thuê hoặc chủ trọ để bảo mật quyền riêng tư (giống Zalo).</p>

              <form className="zalo-search-box" onSubmit={handlePhoneSearch}>
                <div className="zalo-input-wrapper">
                  <Icon name="phone" size={18} />
                  <input
                    value={phoneQuery}
                    onChange={(e) => setPhoneQuery(e.target.value)}
                    placeholder="Nhập số điện thoại (ví dụ: 0912345678)..."
                    autoFocus
                    autoComplete="off"
                    spellCheck={false}
                  />
                  {phoneQuery && (
                    <button type="button" className="zalo-clear-icon" onClick={() => { setPhoneQuery(""); setPhoneResults([]); setPhoneSearched(false); }}>
                      <Icon name="close" size={15} />
                    </button>
                  )}
                </div>
                <button type="submit" className="zalo-search-btn" disabled={!phoneQuery.trim() || phoneSearching}>
                  {phoneSearching ? "Đang tìm..." : "Tìm kiếm"}
                </button>
              </form>

              {contactError && <p className="form-message error" role="alert">{contactError}</p>}

              <div className="zalo-results-container">
                {!phoneSearched ? (
                  <div className="zalo-empty-state">
                    <div className="zalo-state-icon">
                      <Icon name="phone" size={32} />
                    </div>
                    <strong>Bảo mật danh bạ</strong>
                    <p>Hệ thống không hiển thị công khai danh sách toàn bộ thành viên. Vui lòng nhập số điện thoại để tìm chính xác người cần liên hệ.</p>
                  </div>
                ) : phoneResults.length > 0 ? (
                  phoneResults.map((item) => {
                    const room = listings.find((listing) => listing.ownerId === item.id && listing.status === "active")
                    const role = item.role === "landlord" ? "Chủ trọ" : "Người thuê"
                    return (
                      <div className="zalo-contact-card" key={item.id}>
                        <div className="zalo-contact-header">
                          <PersonAvatar initials={item.initials} avatarUrl={item.avatarUrl} />
                          <div className="zalo-contact-meta">
                            <div className="zalo-name-row">
                              <strong>{item.name}</strong>
                              <span className="role-badge">{role}</span>
                            </div>
                            <span className="zalo-contact-phone">📞 {item.phone || "Chưa công khai SĐT"}</span>
                            {room && <span className="contact-room-title">Phòng: {room.title}</span>}
                          </div>
                        </div>
                        <div className="zalo-contact-actions">
                          <button
                            type="button"
                            className="zalo-btn-chat"
                            disabled={startingContactId === item.id}
                            onClick={() => startChat({ name: item.name, initials: item.initials, avatarUrl: item.avatarUrl, id: item.id, roomId: room?.id ?? "" })}
                          >
                            <Icon name="chat" size={16} />
                            <span>{startingContactId === item.id ? "Đang mở..." : "Nhắn tin"}</span>
                          </button>
                          <Link
                            to={`/nguoi-dung/${item.id}`}
                            className="zalo-btn-profile"
                            onClick={() => setSelectContact(false)}
                          >
                            Xem hồ sơ
                          </Link>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="zalo-empty-state is-not-found">
                    <div className="zalo-state-icon is-danger">
                      <Icon name="search" size={32} />
                    </div>
                    <strong>Không tìm thấy người dùng</strong>
                    <p>Không có tài khoản nào đăng ký số điện thoại <b>{phoneQuery}</b>. Vui lòng kiểm tra lại số điện thoại.</p>
                  </div>
                )}
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  )
}
