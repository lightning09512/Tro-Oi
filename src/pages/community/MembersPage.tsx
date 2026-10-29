import { useState, useEffect, type FormEvent, useMemo } from "react"
import { Link, useNavigate, useSearchParams } from "react-router"
import { Icon } from "@/components/common/legacy"
import { useToast } from "@/contexts/ToastContext"
import useAuth from "@/hooks/useAuth"
import { apiRequest, isApiMode } from "@/services/apiClient"
import { usePlatform } from "@/contexts/PlatformContext"

interface FriendUser {
  id: string
  name: string
  phone: string
  role: "renter" | "landlord"
  status?: string
  avatarUrl?: string
  initials: string
  listingsCount?: number
  postsCount?: number
  createdAt?: string
  connectedAt?: string
  connectionId?: string
}

interface FriendRequestItem extends FriendUser {
  senderId: string
  receiverId: string
}

type TabKey = "requests" | "suggestions" | "friends" | "search"

export default function MembersPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { user } = useAuth()
  const { toast } = useToast()
  const { users: platformUsers, listings, posts, startConversation } = usePlatform()

  const tabParam = searchParams.get("tab") as TabKey | null
  const [activeTab, setActiveTab] = useState<TabKey>(tabParam || "requests")

  // State lists
  const [requests, setRequests] = useState<FriendRequestItem[]>([])
  const [suggestions, setSuggestions] = useState<FriendUser[]>([])
  const [friends, setFriends] = useState<FriendUser[]>([])
  const [loading, setLoading] = useState(true)

  // Sent requests tracker (to update UI instantly on suggestions/search)
  const [sentRequestIds, setSentRequestIds] = useState<Set<string>>(new Set())
  const [dismissedSuggestionIds, setDismissedSuggestionIds] = useState<Set<string>>(new Set())

  // Search by phone state
  const [searchPhone, setSearchPhone] = useState("")
  const [searchLoading, setSearchLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [searchResults, setSearchResults] = useState<FriendUser[]>([])

  // Friend filter keyword
  const [friendFilter, setFriendFilter] = useState("")

  // Loading chat state
  const [startingChatId, setStartingChatId] = useState<string | null>(null)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)

  // Keep URL in sync with activeTab
  const switchTab = (tab: TabKey) => {
    setActiveTab(tab)
    setSearchParams({ tab }, { replace: true })
  }

  // Fetch initial data
  const fetchData = async () => {
    if (!user) return
    setLoading(true)
    try {
      if (isApiMode) {
        // Fetch requests, suggestions, and friends concurrently
        const [reqRes, sugRes, frRes] = await Promise.allSettled([
          apiRequest<{ items: FriendRequestItem[] }>("friends/requests"),
          apiRequest<{ items: FriendUser[] }>("friends/suggestions"),
          apiRequest<{ items: FriendUser[] }>("friends"),
        ])

        if (reqRes.status === "fulfilled") setRequests(reqRes.value.items || [])
        if (sugRes.status === "fulfilled") setSuggestions(sugRes.value.items || [])
        if (frRes.status === "fulfilled") setFriends(frRes.value.items || [])
      } else {
        // Fallback for mock mode
        const otherUsers = platformUsers.filter((u) => u.id !== user.id && u.role !== "admin")
        
        // Mock incoming requests (first 2)
        const mockRequests: FriendRequestItem[] = otherUsers.slice(0, 2).map((u) => ({
          id: `req-${u.id}`,
          senderId: u.id,
          receiverId: user.id,
          name: u.name,
          phone: u.phone || "",
          role: u.role as "renter" | "landlord",
          avatarUrl: u.avatarUrl,
          initials: u.initials,
          listingsCount: listings.filter((l) => l.ownerId === u.id).length,
          postsCount: posts.filter((p) => p.authorId === u.id).length,
        }))
        setRequests(mockRequests)

        // Mock suggestions
        const mockSuggestions: FriendUser[] = otherUsers.slice(2).map((u) => ({
          id: u.id,
          name: u.name,
          phone: u.phone || "",
          role: u.role as "renter" | "landlord",
          avatarUrl: u.avatarUrl,
          initials: u.initials,
          listingsCount: listings.filter((l) => l.ownerId === u.id).length,
          postsCount: posts.filter((p) => p.authorId === u.id).length,
        }))
        setSuggestions(mockSuggestions)
      }
    } catch {
      // Graceful fallback
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [user])

  // Accept friend request
  const handleAcceptRequest = async (item: FriendRequestItem) => {
    setActionLoadingId(item.id)
    try {
      if (isApiMode) {
        await apiRequest(`friends/requests/${item.id}`, {
          method: "PATCH",
          body: JSON.stringify({ status: "accepted" }),
        })
      }
      setRequests((prev) => prev.filter((r) => r.id !== item.id))
      setFriends((prev) => [
        {
          id: item.senderId || item.id,
          name: item.name,
          phone: item.phone,
          role: item.role,
          avatarUrl: item.avatarUrl,
          initials: item.initials,
          listingsCount: item.listingsCount,
          postsCount: item.postsCount,
        },
        ...prev,
      ])
      toast(`Đã đồng ý kết bạn với ${item.name}!`, "success")
    } catch {
      toast("Không thể chấp nhận lời mời kết bạn lúc này.", "error")
    } finally {
      setActionLoadingId(null)
    }
  }

  // Reject friend request
  const handleRejectRequest = async (item: FriendRequestItem) => {
    setActionLoadingId(item.id)
    try {
      if (isApiMode) {
        await apiRequest(`friends/requests/${item.id}`, {
          method: "PATCH",
          body: JSON.stringify({ status: "rejected" }),
        })
      }
      setRequests((prev) => prev.filter((r) => r.id !== item.id))
      toast(`Đã gỡ lời mời kết bạn của ${item.name}.`, "info")
    } catch {
      toast("Không thể từ chối lời mời lúc này.", "error")
    } finally {
      setActionLoadingId(null)
    }
  }

  // Send friend request
  const handleSendRequest = async (targetUser: FriendUser) => {
    setActionLoadingId(targetUser.id)
    try {
      if (isApiMode) {
        await apiRequest("friends/requests", {
          method: "POST",
          body: JSON.stringify({ receiverId: targetUser.id }),
        })
      }
      setSentRequestIds((prev) => new Set([...prev, targetUser.id]))
      toast(`Đã gửi lời mời kết bạn đến ${targetUser.name}!`, "success")
    } catch {
      toast("Không thể gửi lời mời kết bạn lúc này.", "error")
    } finally {
      setActionLoadingId(null)
    }
  }

  // Unfriend
  const handleUnfriend = async (friend: FriendUser) => {
    if (!window.confirm(`Bạn có chắc muốn hủy kết bạn với ${friend.name}?`)) return
    setActionLoadingId(friend.id)
    try {
      if (isApiMode) {
        await apiRequest(`friends/${friend.id}`, { method: "DELETE" })
      }
      setFriends((prev) => prev.filter((f) => f.id !== friend.id))
      toast(`Đã hủy kết bạn với ${friend.name}.`, "info")
    } catch {
      toast("Không thể hủy kết bạn lúc này.", "error")
    } finally {
      setActionLoadingId(null)
    }
  }

  // Start chat with user
  const handleMessage = async (target: FriendUser) => {
    if (!user) {
      navigate("/dang-nhap", { state: { from: window.location.pathname } })
      return
    }
    setStartingChatId(target.id)
    try {
      const room = listings.find((l) => l.ownerId === target.id && l.status === "active")
      const conversation = await startConversation({
        accountId: user.id,
        name: target.name,
        avatar: target.initials,
        avatarUrl: target.avatarUrl,
        userId: target.id,
        roomId: room?.id ?? "",
      })
      if (conversation) {
        navigate(`/tin-nhan?conversation=${conversation}`)
      }
    } catch {
      toast("Không thể mở cuộc trò chuyện lúc này.", "error")
    } finally {
      setStartingChatId(null)
    }
  }

  // Search by phone handler
  const handleSearchPhone = async (e?: FormEvent) => {
    if (e) e.preventDefault()
    const q = searchPhone.trim()
    if (!q) {
      toast("Vui lòng nhập số điện thoại để tra cứu.", "info")
      return
    }
    setSearchLoading(true)
    setHasSearched(true)
    try {
      if (isApiMode) {
        const result = await apiRequest<{ items: FriendUser[] }>(`members?q=${encodeURIComponent(q)}`)
        setSearchResults((result.items || []).filter((item) => item.id !== user?.id))
      } else {
        const clean = q.replace(/[\s\.\-]+/g, "").toLowerCase()
        const filtered = platformUsers.filter((u) => {
          if (u.id === user?.id || u.status !== "active" || u.role === "admin") return false
          const uPhone = (u.phone || "").replace(/[\s\.\-]+/g, "")
          return uPhone.includes(clean) || u.name.toLowerCase().includes(q.toLowerCase())
        }).map((u) => ({
          id: u.id,
          name: u.name,
          phone: u.phone || "",
          role: u.role as "renter" | "landlord",
          avatarUrl: u.avatarUrl,
          initials: u.initials,
          listingsCount: listings.filter((l) => l.ownerId === u.id).length,
          postsCount: posts.filter((p) => p.authorId === u.id).length,
        }))
        setSearchResults(filtered)
      }
    } catch {
      setSearchResults([])
    } finally {
      setSearchLoading(false)
    }
  }

  const copyPhone = (phone: string, name: string) => {
    if (!phone) return
    navigator.clipboard?.writeText(phone)
    toast(`Đã sao chép số điện thoại của ${name}: ${phone}`, "success")
  }

  // Filtered friends
  const filteredFriends = useMemo(() => {
    if (!friendFilter.trim()) return friends
    const kw = friendFilter.toLowerCase()
    return friends.filter(
      (f) => f.name.toLowerCase().includes(kw) || f.phone.includes(kw)
    )
  }, [friends, friendFilter])

  // Filtered suggestions
  const visibleSuggestions = useMemo(() => {
    const friendIdSet = new Set(friends.map((f) => f.id))
    const requestIdSet = new Set(requests.map((r) => r.senderId || r.id))
    return suggestions.filter(
      (s) =>
        !friendIdSet.has(s.id) &&
        !requestIdSet.has(s.id) &&
        !dismissedSuggestionIds.has(s.id)
    )
  }, [suggestions, friends, requests, dismissedSuggestionIds])

  if (!user) {
    return (
      <main className="page-bg fb-friends-hub-page">
        <div className="container" style={{ maxWidth: "600px", padding: "80px 16px", textAlign: "center" }}>
          <div className="members-auth-guard" style={{ background: "#ffffff", padding: "48px 24px", borderRadius: "24px", border: "1px solid #e3ede6", boxShadow: "0 10px 30px rgba(0,0,0,0.04)" }}>
            <span className="phone-empty-circle" style={{ margin: "0 auto 16px", background: "#edf5ee", color: "#245f3b", width: "64px", height: "64px", borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name="users" size={32} />
            </span>
            <h2 style={{ fontSize: "24px", fontWeight: "800", marginBottom: "8px", color: "#1e382b" }}>Bạn bè & Kết nối</h2>
            <p style={{ color: "#62746a", fontSize: "14px", marginBottom: "28px", lineHeight: "1.6" }}>
              Đăng nhập để xem lời mời kết bạn, kết nối với người thuê và chủ trọ, cùng nhắn tin thảo luận tìm phòng!
            </p>
            <button
              type="button"
              className="fb-btn-confirm"
              style={{ padding: "12px 28px", fontSize: "15px", borderRadius: "999px", margin: "0 auto" }}
              onClick={() => navigate("/dang-nhap", { state: { from: window.location.pathname } })}
            >
              Đăng nhập ngay
            </button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="page-bg fb-friends-hub-page">
      <div className="container fb-friends-layout">
        {/* Facebook Style Friends Sidebar */}
        <aside className="fb-friends-sidebar" aria-label="Menu Bạn bè">
          <div className="fb-friends-sidebar-header">
            <div className="fb-friends-header-row">
              <h1 className="fb-friends-title">Bạn bè</h1>
              <span className="fb-friends-header-icon" title="Bạn bè & Kết nối">
                <Icon name="users" size={18} />
              </span>
            </div>
            <p className="fb-friends-subtitle">
              Kết nối người thuê và chủ nhà
            </p>
          </div>

          <nav className="fb-friends-nav-list" aria-label="Danh mục bạn bè">
            <button
              type="button"
              className={`fb-friends-nav-item ${activeTab === "requests" ? "active" : ""}`}
              onClick={() => switchTab("requests")}
            >
              <span className="fb-item-icon-circle">
                <Icon name="chat" size={18} />
              </span>
              <span className="fb-item-label">Lời mời kết bạn</span>
              {requests.length > 0 && (
                <span className="fb-nav-badge">{requests.length}</span>
              )}
              <span className="fb-item-arrow"><Icon name="chevron" size={15} /></span>
            </button>

            <button
              type="button"
              className={`fb-friends-nav-item ${activeTab === "suggestions" ? "active" : ""}`}
              onClick={() => switchTab("suggestions")}
            >
              <span className="fb-item-icon-circle">
                <Icon name="users" size={18} />
              </span>
              <span className="fb-item-label">Gợi ý</span>
              {visibleSuggestions.length > 0 && (
                <span className="fb-nav-badge subtle">{visibleSuggestions.length}</span>
              )}
              <span className="fb-item-arrow"><Icon name="chevron" size={15} /></span>
            </button>

            <button
              type="button"
              className={`fb-friends-nav-item ${activeTab === "friends" ? "active" : ""}`}
              onClick={() => switchTab("friends")}
            >
              <span className="fb-item-icon-circle">
                <Icon name="check" size={18} />
              </span>
              <span className="fb-item-label">Tất cả bạn bè</span>
              <span className="fb-nav-badge subtle">{friends.length}</span>
              <span className="fb-item-arrow"><Icon name="chevron" size={15} /></span>
            </button>

            <button
              type="button"
              className={`fb-friends-nav-item ${activeTab === "search" ? "active" : ""}`}
              onClick={() => switchTab("search")}
            >
              <span className="fb-item-icon-circle">
                <Icon name="phone" size={18} />
              </span>
              <span className="fb-item-label">Tìm qua số điện thoại</span>
              <span className="fb-item-arrow"><Icon name="chevron" size={15} /></span>
            </button>
          </nav>

          <div className="fb-friends-sidebar-footer">
            <button
              type="button"
              className="fb-back-forum-btn"
              onClick={() => navigate("/dien-dan")}
            >
              <Icon name="home" size={16} />
              <span>Vào diễn đàn thảo luận</span>
            </button>
          </div>
        </aside>

        {/* Content Area Based on Active Tab */}
        <div className="fb-friends-main-content">
          {/* ================= TAB 1: LỜI MỜI KẾT BẠN ================= */}
          {activeTab === "requests" && (
            <section className="fb-tab-section">
              <div className="fb-tab-header">
                <div>
                  <h2 className="fb-section-title">
                    Lời mời kết bạn
                    {requests.length > 0 && (
                      <span className="fb-count-chip">{requests.length}</span>
                    )}
                  </h2>
                  <p className="fb-section-desc">
                    {requests.length > 0
                      ? `Bạn có ${requests.length} lời mời kết bạn mới đang chờ phản hồi.`
                      : "Hiện tại không có lời mời kết bạn nào đang chờ."}
                  </p>
                </div>
                {requests.length > 0 && (
                  <button
                    type="button"
                    className="fb-quick-link-btn"
                    onClick={() => switchTab("suggestions")}
                  >
                    Xem thêm gợi ý →
                  </button>
                )}
              </div>

              {loading ? (
                <div className="fb-empty-state">
                  <div className="forum-lazy-spinner" />
                  <p>Đang tải danh sách lời mời...</p>
                </div>
              ) : requests.length > 0 ? (
                <div className="fb-cards-grid">
                  {requests.map((item) => (
                    <article className="fb-user-card" key={item.id}>
                      {/* Cover Pattern */}
                      <div className="fb-user-cover" />

                      {/* Overlapping Avatar */}
                      <div className="fb-user-avatar-wrap">
                        {item.avatarUrl ? (
                          <img src={item.avatarUrl} alt={item.name} className="fb-user-avatar-img" />
                        ) : (
                          <span className="fb-user-avatar-initials">{item.initials}</span>
                        )}
                        
                      </div>

                      {/* Card Info */}
                      <div className="fb-user-body">
                        <Link to={`/nguoi-dung/${item.senderId || item.id}`} className="fb-user-name">
                          {item.name}
                        </Link>
                        <span className={`fb-user-role ${item.role}`}>
                          {item.role === "landlord" ? "🏠 Chủ nhà trọ" : "👤 Người tìm phòng"}
                        </span>

                        <div className="fb-user-meta">
                          {item.role === "landlord" ? (
                            <span>🏠 {item.listingsCount || 1} phòng trọ cho thuê</span>
                          ) : (
                            <span>💬 {item.postsCount || 1} bài viết cộng đồng</span>
                          )}
                        </div>

                        {/* Action Buttons: Confirm or Delete */}
                        <div className="fb-user-actions">
                          <button
                            type="button"
                            className="fb-btn-confirm"
                            disabled={actionLoadingId === item.id}
                            onClick={() => handleAcceptRequest(item)}
                          >
                            <Icon name="check" size={16} />
                            <span>{actionLoadingId === item.id ? "Đang xử lý..." : "Xác nhận"}</span>
                          </button>
                          <button
                            type="button"
                            className="fb-btn-delete"
                            disabled={actionLoadingId === item.id}
                            onClick={() => handleRejectRequest(item)}
                          >
                            <span>Xóa</span>
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="fb-empty-state">
                  <div className="fb-empty-icon">
                    <Icon name="chat" size={40} />
                  </div>
                  <h3>Không có lời mời kết bạn nào</h3>
                  <p>Khi có người gửi lời mời kết bạn, danh sách sẽ hiển thị ở đây để bạn dễ dàng xác nhận.</p>
                  <button
                    type="button"
                    className="fb-btn-confirm"
                    style={{ marginTop: "16px", borderRadius: "999px" }}
                    onClick={() => switchTab("suggestions")}
                  >
                    Khám phá người bạn có thể biết
                  </button>
                </div>
              )}
            </section>
          )}

          {/* ================= TAB 2: GỢI Ý KẾT BẠN ================= */}
          {activeTab === "suggestions" && (
            <section className="fb-tab-section">
              <div className="fb-tab-header">
                <div>
                  <h2 className="fb-section-title">Những người bạn có thể biết</h2>
                  <p className="fb-section-desc">Gợi ý người thuê phòng và chủ trọ trong khu vực của bạn.</p>
                </div>
              </div>

              {loading ? (
                <div className="fb-empty-state">
                  <div className="forum-lazy-spinner" />
                  <p>Đang tải gợi ý bạn bè...</p>
                </div>
              ) : visibleSuggestions.length > 0 ? (
                <div className="fb-cards-grid">
                  {visibleSuggestions.map((item) => {
                    const isSent = sentRequestIds.has(item.id)
                    return (
                      <article className="fb-user-card" key={item.id}>
                        <div className="fb-user-cover suggestions" />
                        <div className="fb-user-avatar-wrap">
                          {item.avatarUrl ? (
                            <img src={item.avatarUrl} alt={item.name} className="fb-user-avatar-img" />
                          ) : (
                            <span className="fb-user-avatar-initials">{item.initials}</span>
                          )}
                        </div>

                        <div className="fb-user-body">
                          <Link to={`/nguoi-dung/${item.id}`} className="fb-user-name">
                            {item.name}
                          </Link>
                          <span className={`fb-user-role ${item.role}`}>
                            {item.role === "landlord" ? "🏠 Chủ nhà trọ" : "👤 Người tìm phòng"}
                          </span>

                          <div className="fb-user-meta">
                            {item.role === "landlord" ? (
                              <span>🏠 {item.listingsCount || 1} phòng trọ đăng</span>
                            ) : (
                              <span>💬 {item.postsCount || 1} bài viết thảo luận</span>
                            )}
                          </div>

                          <div className="fb-user-actions">
                            {isSent ? (
                              <button type="button" className="fb-btn-sent" disabled>
                                <Icon name="check" size={16} />
                                <span>Đã gửi lời mời</span>
                              </button>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  className="fb-btn-confirm"
                                  disabled={actionLoadingId === item.id}
                                  onClick={() => handleSendRequest(item)}
                                >
                                  <Icon name="plus" size={16} />
                                  <span>Thêm bạn bè</span>
                                </button>
                                <button
                                  type="button"
                                  className="fb-btn-delete"
                                  onClick={() =>
                                    setDismissedSuggestionIds((prev) => new Set([...prev, item.id]))
                                  }
                                >
                                  <span>Gỡ</span>
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </article>
                    )
                  })}
                </div>
              ) : (
                <div className="fb-empty-state">
                  <div className="fb-empty-icon">
                    <Icon name="users" size={40} />
                  </div>
                  <h3>Chưa có thêm gợi ý mới</h3>
                  <p>Bạn đã kết nối hoặc xem hết các gợi ý hiện tại. Hãy thử tìm kiếm bạn bè qua số điện thoại!</p>
                  <button
                    type="button"
                    className="fb-btn-confirm"
                    style={{ marginTop: "16px", borderRadius: "999px" }}
                    onClick={() => switchTab("search")}
                  >
                    Tìm qua số điện thoại
                  </button>
                </div>
              )}
            </section>
          )}

          {/* ================= TAB 3: TẤT CẢ BẠN BÈ ================= */}
          {activeTab === "friends" && (
            <section className="fb-tab-section">
              <div className="fb-tab-header">
                <div>
                  <h2 className="fb-section-title">
                    Tất cả bạn bè
                    <span className="fb-count-chip">{friends.length}</span>
                  </h2>
                  <p className="fb-section-desc">Danh sách bạn bè đã kết nối trên mạng xã hội Trọ Ơi.</p>
                </div>

                {friends.length > 0 && (
                  <div className="fb-friends-filter-bar">
                    <Icon name="search" size={16} />
                    <input
                      type="text"
                      placeholder="Tìm trong danh sách bạn bè..."
                      value={friendFilter}
                      onChange={(e) => setFriendFilter(e.target.value)}
                    />
                    {friendFilter && (
                      <button type="button" onClick={() => setFriendFilter("")}>
                        <Icon name="close" size={14} />
                      </button>
                    )}
                  </div>
                )}
              </div>

              {loading ? (
                <div className="fb-empty-state">
                  <div className="forum-lazy-spinner" />
                  <p>Đang tải danh sách bạn bè...</p>
                </div>
              ) : filteredFriends.length > 0 ? (
                <div className="fb-cards-grid">
                  {filteredFriends.map((friend) => (
                    <article className="fb-user-card" key={friend.id}>
                      <div className="fb-user-cover friends" />
                      <div className="fb-user-avatar-wrap">
                        {friend.avatarUrl ? (
                          <img src={friend.avatarUrl} alt={friend.name} className="fb-user-avatar-img" />
                        ) : (
                          <span className="fb-user-avatar-initials">{friend.initials}</span>
                        )}
                        
                      </div>

                      <div className="fb-user-body">
                        <Link to={`/nguoi-dung/${friend.id}`} className="fb-user-name">
                          {friend.name}
                        </Link>
                        <span className={`fb-user-role ${friend.role}`}>
                          {friend.role === "landlord" ? "🏠 Chủ nhà trọ" : "👤 Người tìm phòng"}
                        </span>

                        {friend.phone && (
                          <div className="fb-friend-phone-row">
                            <span>📞 {friend.phone}</span>
                            <button
                              type="button"
                              className="fb-phone-copy-btn"
                              onClick={() => copyPhone(friend.phone, friend.name)}
                              title="Sao chép SĐT"
                            >
                              <Icon name="copy" size={13} />
                            </button>
                          </div>
                        )}

                        <div className="fb-user-actions" style={{ marginTop: "auto" }}>
                          <button
                            type="button"
                            className="fb-btn-confirm"
                            disabled={startingChatId === friend.id}
                            onClick={() => handleMessage(friend)}
                          >
                            <Icon name="chat" size={16} />
                            <span>{startingChatId === friend.id ? "Đang mở..." : "Nhắn tin"}</span>
                          </button>
                          <button
                            type="button"
                            className="fb-btn-delete"
                            title="Hủy kết bạn"
                            disabled={actionLoadingId === friend.id}
                            onClick={() => handleUnfriend(friend)}
                          >
                            <span>Hủy kết bạn</span>
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : friends.length > 0 ? (
                <div className="fb-empty-state">
                  <p>Không tìm thấy bạn bè nào khớp với từ khóa "{friendFilter}".</p>
                </div>
              ) : (
                <div className="fb-empty-state">
                  <div className="fb-empty-icon">
                    <Icon name="users" size={40} />
                  </div>
                  <h3>Bạn chưa có bạn bè nào</h3>
                  <p>Hãy kết nối với người thuê hoặc chủ nhà trọ từ danh sách gợi ý để trò chuyện dễ dàng hơn!</p>
                  <button
                    type="button"
                    className="fb-btn-confirm"
                    style={{ marginTop: "16px", borderRadius: "999px" }}
                    onClick={() => switchTab("suggestions")}
                  >
                    Xem gợi ý kết bạn ngay
                  </button>
                </div>
              )}
            </section>
          )}

          {/* ================= TAB 4: TÌM QUA SỐ ĐIỆN THOẠI ================= */}
          {activeTab === "search" && (
            <section className="fb-tab-section">
              <div className="fb-tab-header">
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px", flexWrap: "wrap" }}>
                    <h2 className="fb-section-title" style={{ margin: 0 }}>Tìm bạn qua số điện thoại</h2>
                    <span className="fb-phone-badge">
                      <Icon name="shield" size={13} />
                      <span>Tra cứu an toàn</span>
                    </span>
                  </div>
                  <p className="fb-section-desc">
                    Nhập chính xác số điện thoại để tìm kiếm người thuê hoặc chủ nhà trọ và kết nối trực tiếp.
                  </p>
                </div>
              </div>

              {/* Privacy alert banner */}
              <div className="fb-phone-privacy-banner">
                <Icon name="shield" size={16} />
                <span>
                  <b>Chính sách bảo mật:</b> Danh bạ không hiển thị công khai để bảo vệ quyền riêng tư. Bạn chỉ có thể tra cứu khi có số điện thoại của người cần tìm.
                </span>
              </div>

              {/* Search Form */}
              <form className="fb-phone-search-form" onSubmit={handleSearchPhone}>
                <div className="fb-phone-search-input-wrap">
                  <span className="fb-phone-search-icon" aria-hidden="true">
                    <Icon name="phone" size={18} />
                  </span>
                  <input
                    type="tel"
                    className="fb-phone-search-input"
                    placeholder="Nhập số điện thoại (ví dụ: 0912345678, 0395...)..."
                    value={searchPhone}
                    onChange={(e) => setSearchPhone(e.target.value)}
                    autoComplete="off"
                    spellCheck={false}
                    autoFocus
                  />
                  {searchPhone && (
                    <button
                      type="button"
                      className="fb-phone-clear-btn"
                      onClick={() => {
                        setSearchPhone("")
                        setSearchResults([])
                        setHasSearched(false)
                      }}
                      aria-label="Xóa tìm kiếm"
                    >
                      <Icon name="close" size={14} />
                    </button>
                  )}
                </div>
                <button
                  type="submit"
                  className="fb-phone-submit-btn"
                  disabled={!searchPhone.trim() || searchLoading}
                >
                  <Icon name="search" size={16} />
                  <span>{searchLoading ? "Đang tìm..." : "Tìm kiếm"}</span>
                </button>
              </form>

              {/* Search Results Display */}
              <div className="fb-search-results-area" style={{ maxWidth: "760px", margin: "0" }}>
                {!hasSearched ? (
                  <div className="fb-phone-guide-box">
                    <div className="fb-phone-guide-icon">
                      <Icon name="phone" size={24} />
                    </div>
                    <div className="fb-phone-guide-text">
                      <h3>Nhập số điện thoại để tra cứu</h3>
                      <p>Hệ thống sẽ tra cứu tài khoản chính xác theo số điện thoại đã đăng ký.</p>
                    </div>
                  </div>
                ) : searchLoading ? (
                  <div className="fb-empty-state" style={{ maxWidth: "760px", margin: "0" }}>
                    <div className="forum-lazy-spinner" />
                    <p style={{ marginTop: "14px", color: "#54685c" }}>Đang tìm kiếm thông tin người dùng...</p>
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="fb-phone-results-wrap">
                    <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#1e382b", marginBottom: "12px" }}>
                      Kết quả tìm kiếm ({searchResults.length})
                    </h3>
                    <div className="fb-cards-grid" style={{ gridTemplateColumns: "1fr" }}>
                      {searchResults.map((member) => {
                        const isFriend = friends.some((f) => f.id === member.id)
                        const isRequested = requests.some((r) => r.senderId === member.id)
                        const isSent = sentRequestIds.has(member.id)
                        return (
                          <article className="fb-user-card" key={member.id} style={{ flexDirection: "row", padding: "16px", alignItems: "center", gap: "20px" }}>
                            <div className="fb-user-avatar-wrap" style={{ margin: 0 }}>
                              {member.avatarUrl ? (
                                <img src={member.avatarUrl} alt={member.name} className="fb-user-avatar-img" style={{ width: "72px", height: "72px" }} />
                              ) : (
                                <span className="fb-user-avatar-initials" style={{ width: "72px", height: "72px", fontSize: "24px" }}>{member.initials}</span>
                              )}
                            </div>

                            <div className="fb-user-body" style={{ padding: 0, flex: 1 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                                <Link to={`/nguoi-dung/${member.id}`} className="fb-user-name" style={{ fontSize: "18px" }}>
                                  {member.name}
                                </Link>
                                <span className={`fb-user-role ${member.role}`}>
                                  {member.role === "landlord" ? "🏠 Chủ nhà trọ" : "👤 Người tìm phòng"}
                                </span>
                              </div>

                              {member.phone && (
                                <div className="fb-friend-phone-row" style={{ marginTop: "6px" }}>
                                  <span>📞 {member.phone}</span>
                                  <button
                                    type="button"
                                    className="fb-phone-copy-btn"
                                    onClick={() => copyPhone(member.phone, member.name)}
                                    title="Sao chép SĐT"
                                  >
                                    <Icon name="copy" size={13} />
                                  </button>
                                </div>
                              )}

                              <div className="fb-user-meta" style={{ marginTop: "6px" }}>
                                {member.role === "landlord" ? (
                                  <span>🏠 {member.listingsCount || 0} phòng cho thuê</span>
                                ) : (
                                  <span>💬 {member.postsCount || 0} bài viết diễn đàn</span>
                                )}
                              </div>
                            </div>

                            <div className="fb-search-card-actions" style={{ display: "flex", flexDirection: "column", gap: "8px", minWidth: "160px" }}>
                              {isFriend ? (
                                <button
                                  type="button"
                                  className="fb-btn-confirm"
                                  onClick={() => handleMessage(member)}
                                >
                                  <Icon name="chat" size={16} />
                                  <span>Nhắn tin</span>
                                </button>
                              ) : isRequested ? (
                                <button
                                  type="button"
                                  className="fb-btn-confirm"
                                  onClick={() => switchTab("requests")}
                                >
                                  <Icon name="check" size={16} />
                                  <span>Xem lời mời</span>
                                </button>
                              ) : isSent ? (
                                <button type="button" className="fb-btn-sent" disabled>
                                  <Icon name="check" size={16} />
                                  <span>Đã gửi lời mời</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  className="fb-btn-confirm"
                                  disabled={actionLoadingId === member.id}
                                  onClick={() => handleSendRequest(member)}
                                >
                                  <Icon name="plus" size={16} />
                                  <span>Thêm bạn bè</span>
                                </button>
                              )}

                              <button
                                type="button"
                                className="fb-btn-delete"
                                disabled={startingChatId === member.id}
                                onClick={() => handleMessage(member)}
                              >
                                <Icon name="chat" size={14} />
                                <span>Nhắn tin ngay</span>
                              </button>
                            </div>
                          </article>
                        )
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="fb-phone-guide-box fb-phone-not-found-box">
                    <div className="fb-phone-guide-icon" style={{ background: "#fef2f2", color: "#dc2626" }}>
                      <Icon name="close" size={24} />
                    </div>
                    <div className="fb-phone-guide-text">
                      <h3 style={{ color: "#991b1b" }}>Không tìm thấy người dùng</h3>
                      <p style={{ color: "#65766c", marginBottom: "4px" }}>
                        Không có tài khoản nào đăng ký số điện thoại <b>{searchPhone}</b> trên hệ thống Trọ Ơi.
                      </p>
                      <small style={{ color: "#8a9a90" }}>Vui lòng kiểm tra lại tính chính xác của số điện thoại và thử lại.</small>
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}
        </div>
      </div>
    </main>
  )
}
