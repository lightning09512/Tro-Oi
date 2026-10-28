import { useState, type FormEvent } from "react"
import { Link, useNavigate } from "react-router"
import { Button, Icon } from "@/components/common/legacy"
import { useToast } from "@/contexts/ToastContext"
import useAuth from "@/hooks/useAuth"
import { apiRequest, isApiMode } from "@/services/apiClient"
import { usePlatform } from "@/contexts/PlatformContext"

interface MemberItem {
  id: string
  name: string
  phone: string
  role: "renter" | "landlord"
  status: string
  avatarUrl?: string
  initials: string
  createdAt?: string
  listingsCount?: number
  postsCount?: number
}

function MemberAvatar({ initials, avatarUrl }: { initials: string; avatarUrl?: string }) {
  return (
    <span className="avatar members-card-avatar">
      {avatarUrl ? <img className="user-avatar-image" src={avatarUrl} alt="" /> : initials}
    </span>
  )
}

export default function MembersPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toast } = useToast()
  const { users: platformUsers, listings, posts, startConversation } = usePlatform()

  const [searchPhone, setSearchPhone] = useState("")
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [members, setMembers] = useState<MemberItem[]>([])
  const [startingChatId, setStartingChatId] = useState<string | null>(null)

  const handleSearch = async (e?: FormEvent) => {
    if (e) e.preventDefault()
    const q = searchPhone.trim()
    if (!q) {
      toast("Vui lòng nhập số điện thoại để tìm kiếm.", "info")
      return
    }

    setLoading(true)
    setHasSearched(true)
    try {
      if (isApiMode) {
        const result = await apiRequest<{ items: MemberItem[] }>(`members?q=${encodeURIComponent(q)}`)
        setMembers((result.items || []).filter((item) => item.id !== user?.id))
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
          status: u.status,
          avatarUrl: u.avatarUrl,
          initials: u.initials,
          listingsCount: listings.filter((l) => l.ownerId === u.id).length,
          postsCount: posts.filter((p) => p.authorId === u.id).length,
        }))
        setMembers(filtered)
      }
    } catch {
      setMembers([])
    } finally {
      setLoading(false)
    }
  }

  const handleMessage = async (member: MemberItem) => {
    if (!user) {
      navigate("/dang-nhap", { state: { from: window.location.pathname } })
      return
    }
    setStartingChatId(member.id)
    try {
      const room = listings.find((l) => l.ownerId === member.id && l.status === "active")
      const conversation = await startConversation({
        accountId: user.id,
        name: member.name,
        avatar: member.initials,
        avatarUrl: member.avatarUrl,
        userId: member.id,
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

  const copyPhone = (phone: string, name: string) => {
    if (!phone) return
    navigator.clipboard?.writeText(phone)
    toast(`Đã sao chép số điện thoại của ${name}: ${phone}`, "success")
  }

  if (!user) {
    return (
      <main className="page-bg members-directory-page">
        <div className="container" style={{ maxWidth: "600px", padding: "60px 16px", textAlign: "center" }}>
          <div className="members-auth-guard" style={{ background: "#ffffff", padding: "40px 24px", borderRadius: "20px", border: "1px solid #e3ede6" }}>
            <span className="zalo-empty-circle" style={{ margin: "0 auto 16px" }}><Icon name="phone" size={36} /></span>
            <h2 style={{ fontSize: "22px", marginBottom: "8px", color: "#1e382b" }}>Tìm bạn qua số điện thoại</h2>
            <p style={{ color: "#62746a", fontSize: "14px", marginBottom: "24px" }}>
              Vui lòng đăng nhập để sử dụng tính năng tra cứu và kết nối qua số điện thoại theo chính sách bảo mật của Trọ Ơi.
            </p>
            <Button onClick={() => navigate("/dang-nhap", { state: { from: window.location.pathname } })}>
              Đăng nhập ngay
            </Button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="page-bg members-directory-page">
      <div className="container" style={{ maxWidth: "800px" }}>
        {/* Header */}
        <header className="members-hero" style={{ padding: "40px 16px 28px" }}>
          <div className="members-hero-badge">
            <Icon name="phone" size={16} />
            <span>Tra cứu an toàn & bảo mật</span>
          </div>
          <h1>Tìm bạn qua số điện thoại</h1>
          <p>
            Nhập chính xác số điện thoại để tìm kiếm người thuê hoặc chủ trọ và bắt đầu nhắn tin trao đổi trực tiếp (giống Zalo).
          </p>

          {/* Privacy Note */}
          <div className="zalo-privacy-box">
            <Icon name="shield" size={18} />
            <span>
              <b>Chính sách bảo mật:</b> Danh bạ thành viên không hiển thị công khai để bảo vệ quyền riêng tư. Bạn chỉ có thể tra cứu khi có số điện thoại của người cần tìm.
            </span>
          </div>

          {/* Search Form */}
          <form className="members-search-wrapper" onSubmit={handleSearch}>
            <div className="members-search-bar">
              <span className="search-icon"><Icon name="phone" size={20} /></span>
              <input
                type="text"
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
                  className="search-clear-btn"
                  onClick={() => {
                    setSearchPhone("")
                    setMembers([])
                    setHasSearched(false)
                  }}
                  aria-label="Xóa tìm kiếm"
                >
                  <Icon name="close" size={16} />
                </button>
              )}
            </div>
            <button type="submit" className="members-search-btn" disabled={!searchPhone.trim() || loading}>
              {loading ? "Đang tìm..." : "Tìm kiếm"}
            </button>
          </form>
        </header>

        {/* Results Area */}
        <section className="members-section" style={{ paddingTop: "12px", paddingBottom: "60px" }}>
          {!hasSearched ? (
            <div className="zalo-page-empty">
              <div className="zalo-empty-circle">
                <Icon name="phone" size={38} />
              </div>
              <h3 style={{ fontSize: "18px", color: "#243a2d", marginBottom: "6px" }}>Nhập số điện thoại để bắt đầu</h3>
              <p style={{ color: "#65766c", fontSize: "14px", margin: 0 }}>Hệ thống sẽ tra cứu tài khoản chính xác theo số điện thoại đã đăng ký.</p>
            </div>
          ) : loading ? (
            <div className="zalo-page-empty">
              <div className="forum-lazy-spinner" />
              <p style={{ marginTop: "16px", color: "#54685c" }}>Đang tìm kiếm thông tin người dùng...</p>
            </div>
          ) : members.length > 0 ? (
            <div className="members-grid" style={{ gridTemplateColumns: "1fr", gap: "16px" }}>
              {members.map((member) => {
                const roleText = member.role === "landlord" ? "Chủ nhà trọ" : "Người tìm phòng"
                return (
                  <article className="member-card" key={member.id} style={{ padding: "20px" }}>
                    <div className="member-card-header">
                      <MemberAvatar initials={member.initials} avatarUrl={member.avatarUrl} />
                      <div className="member-info">
                        <div className="member-name-row">
                          <Link to={`/nguoi-dung/${member.id}`} className="member-name-link">
                            <h2 style={{ fontSize: "18px" }}>{member.name}</h2>
                          </Link>
                          <span className={`member-role-badge ${member.role}`}>
                            {member.role === "landlord" ? "🏠 " : "👤 "}
                            {roleText}
                          </span>
                        </div>

                        {member.phone && (
                          <div className="member-phone-row" style={{ marginTop: "6px" }}>
                            <span className="member-phone-val">📞 {member.phone}</span>
                            <button
                              type="button"
                              className="copy-phone-btn"
                              onClick={() => copyPhone(member.phone, member.name)}
                              title="Sao chép số điện thoại"
                            >
                              <Icon name="copy" size={14} />
                              <span>Sao chép</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="member-stats-row" style={{ margin: "14px 0" }}>
                      {member.role === "landlord" ? (
                        <span className="member-stat-item">
                          🏠 <b>{member.listingsCount || 0}</b> tin phòng đăng
                        </span>
                      ) : (
                        <span className="member-stat-item">
                          💬 <b>{member.postsCount || 0}</b> bài viết diễn đàn
                        </span>
                      )}
                    </div>

                    <div className="member-card-actions">
                      <button
                        type="button"
                        className="member-btn-chat"
                        disabled={startingChatId === member.id}
                        onClick={() => handleMessage(member)}
                      >
                        <Icon name="chat" size={16} />
                        <span>{startingChatId === member.id ? "Đang mở chat..." : "Nhắn tin ngay"}</span>
                      </button>
                      <Link to={`/nguoi-dung/${member.id}`} className="member-btn-profile">
                        Xem trang cá nhân
                      </Link>
                    </div>
                  </article>
                )
              })}
            </div>
          ) : (
            <div className="zalo-page-empty">
              <div className="zalo-empty-circle" style={{ background: "#fef2f2", color: "#dc2626" }}>
                <Icon name="close" size={38} />
              </div>
              <h3 style={{ fontSize: "18px", color: "#243a2d", marginBottom: "6px" }}>Không tìm thấy người dùng</h3>
              <p style={{ color: "#65766c", fontSize: "14px", marginBottom: "4px" }}>
                Không có tài khoản nào đăng ký số điện thoại <b>{searchPhone}</b> trên hệ thống Trọ Ơi.
              </p>
              <small style={{ color: "#8a9a90" }}>Vui lòng kiểm tra lại tính chính xác của số điện thoại và thử lại.</small>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
