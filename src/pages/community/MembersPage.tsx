import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router"
import { Icon } from "@/components/common/legacy"
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

export default function MembersPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toast } = useToast()
  const { users: platformUsers, listings, feedPosts } = usePlatform()

  const [members, setMembers] = useState<MemberItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState<"all" | "landlord" | "renter">("all")

  // Load members from API or fallback to platform context
  useEffect(() => {
    let alive = true

    const fetchMembers = async () => {
      setLoading(true)
      try {
        if (isApiMode) {
          const queryParams = new URLSearchParams()
          if (search.trim()) queryParams.set("q", search.trim())
          if (roleFilter !== "all") queryParams.set("role", roleFilter)

          const queryString = queryParams.toString() ? `?${queryParams.toString()}` : ""
          const result = await apiRequest<{ items: MemberItem[] }>(`members${queryString}`)
          if (alive) {
            setMembers(result.items || [])
            setLoading(false)
          }
          return
        }

        // Mock mode fallback
        const filtered = platformUsers.filter((u) => {
          if (u.role === "admin" || u.status !== "active") return false
          if (roleFilter !== "all" && u.role !== roleFilter) return false
          if (search.trim()) {
            const term = search.trim().toLowerCase()
            const matchName = u.name.toLowerCase().includes(term)
            const matchPhone = (u.phone || "").replace(/\s+/g, "").includes(term.replace(/\s+/g, ""))
            return matchName || matchPhone
          }
          return true
        }).map((u) => ({
          id: u.id,
          name: u.name,
          phone: u.phone || "",
          role: u.role as "renter" | "landlord",
          status: u.status,
          avatarUrl: u.avatarUrl,
          initials: u.initials,
          listingsCount: listings.filter((l) => l.ownerId === u.id).length,
          postsCount: feedPosts.filter((p) => p.authorId === u.id).length,
        }))

        if (alive) {
          setMembers(filtered)
          setLoading(false)
        }
      } catch {
        if (alive) {
          setMembers([])
          setLoading(false)
        }
      }
    }

    const timer = setTimeout(fetchMembers, 200)
    return () => {
      alive = false
      clearTimeout(timer)
    }
  }, [search, roleFilter, platformUsers, listings, feedPosts])

  const stats = useMemo(() => {
    const total = members.length
    const landlords = members.filter((m) => m.role === "landlord").length
    const renters = members.filter((m) => m.role === "renter").length
    return { total, landlords, renters }
  }, [members])

  const copyPhone = (phone: string, name: string) => {
    if (!phone) return
    navigator.clipboard?.writeText(phone)
    toast(`Đã sao chép số điện thoại của ${name}: ${phone}`, "success")
  }

  return (
    <main className="page-bg members-directory-page">
      <div className="container">
        {/* Hero Header */}
        <header className="members-hero">
          <div className="members-hero-badge">
            <Icon name="users" size={16} />
            <span>Mạng xã hội người thuê & chủ nhà</span>
          </div>
          <h1>Cộng đồng Thành viên Trọ Ơi</h1>
          <p>
            Tìm kiếm bạn cùng phòng, kết nối trực tiếp với chủ trọ uy tín hoặc tra cứu thành viên qua số điện thoại và họ tên.
          </p>

          {/* Search Box */}
          <div className="members-search-wrapper">
            <div className="members-search-bar">
              <span className="search-icon"><Icon name="search" size={20} /></span>
              <input
                type="text"
                placeholder="Tìm theo tên hoặc số điện thoại (ví dụ: 0395..., Hoàng Trang, Minh Ngọc)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoComplete="off"
              />
              {search && (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={() => setSearch("")}
                  aria-label="Xóa tìm kiếm"
                >
                  <Icon name="close" size={16} />
                </button>
              )}
            </div>

            {/* Role Filter Tabs */}
            <div className="members-role-tabs">
              <button
                type="button"
                className={`role-tab-btn ${roleFilter === "all" ? "active" : ""}`}
                onClick={() => setRoleFilter("all")}
              >
                Tất cả thành viên
              </button>
              <button
                type="button"
                className={`role-tab-btn ${roleFilter === "landlord" ? "active" : ""}`}
                onClick={() => setRoleFilter("landlord")}
              >
                🏠 Chủ nhà trọ
              </button>
              <button
                type="button"
                className={`role-tab-btn ${roleFilter === "renter" ? "active" : ""}`}
                onClick={() => setRoleFilter("renter")}
              >
                👤 Người tìm phòng
              </button>
            </div>
          </div>
        </header>

        {/* Members Grid Section */}
        <section className="members-section">
          <div className="members-count-strip">
            <span>
              {loading
                ? "Đang tìm kiếm..."
                : `Tìm thấy ${members.length} thành viên phù hợp`}
            </span>
          </div>

          {loading ? (
            <div className="members-loading-grid">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="member-card skeleton-card">
                  <div className="skeleton-avatar" />
                  <div className="skeleton-line title" />
                  <div className="skeleton-line pill" />
                  <div className="skeleton-line details" />
                </div>
              ))}
            </div>
          ) : members.length === 0 ? (
            <div className="members-empty-box">
              <span className="empty-icon"><Icon name="users" size={40} /></span>
              <h3>Không tìm thấy thành viên phù hợp</h3>
              <p>
                {search
                  ? `Không có kết quả nào khớp với "${search}". Vui lòng thử tìm với số điện thoại hoặc từ khóa khác.`
                  : "Chưa có thành viên nào trong danh mục này."}
              </p>
              {search && (
                <button type="button" className="btn-reset-search" onClick={() => setSearch("")}>
                  Xem tất cả thành viên
                </button>
              )}
            </div>
          ) : (
            <div className="members-grid">
              {members.map((member) => {
                const isMe = user?.id === member.id
                return (
                  <article key={member.id} className="member-social-card">
                    <div className="member-card-header">
                      <Link to={`/nguoi-dung/${member.id}`} className="member-avatar-wrap">
                        {member.avatarUrl ? (
                          <img src={member.avatarUrl} alt={member.name} className="member-avatar-img" />
                        ) : (
                          <span className="member-avatar-placeholder">{member.initials}</span>
                        )}
                        <span className="member-status-dot" title="Tài khoản đang hoạt động" />
                      </Link>

                      <div className="member-meta-block">
                        <Link to={`/nguoi-dung/${member.id}`} className="member-name-link">
                          <strong>{member.name}</strong>
                          {isMe && <span className="me-badge">Bạn</span>}
                        </Link>
                        <span className={`member-role-tag ${member.role === "landlord" ? "tag-landlord" : "tag-renter"}`}>
                          {member.role === "landlord" ? "🏠 Chủ trọ chính chủ" : "👤 Người tìm phòng"}
                        </span>
                      </div>
                    </div>

                    <div className="member-info-body">
                      {member.phone ? (
                        <div
                          className="member-info-row clickable-phone"
                          onClick={() => copyPhone(member.phone, member.name)}
                          title="Bấm để sao chép số điện thoại"
                        >
                          <span className="info-icon">📞</span>
                          <span className="phone-number">{member.phone}</span>
                          <span className="copy-label">Sao chép</span>
                        </div>
                      ) : (
                        <div className="member-info-row">
                          <span className="info-icon">🔒</span>
                          <span className="text-muted">Chưa công khai SĐT</span>
                        </div>
                      )}

                      <div className="member-stats-row">
                        {member.role === "landlord" ? (
                          <span className="stat-item">
                            <Icon name="building" size={14} />
                            <b>{member.listingsCount || 0}</b> tin phòng
                          </span>
                        ) : (
                          <span className="stat-item">
                            <Icon name="chat" size={14} />
                            <b>{member.postsCount || 0}</b> bài viết
                          </span>
                        )}
                        <span className="stat-badge-trust">
                          <Icon name="shield" size={13} /> Đã xác thực
                        </span>
                      </div>
                    </div>

                    <div className="member-card-actions">
                      <Link to={`/nguoi-dung/${member.id}`} className="btn-view-profile">
                        Xem trang cá nhân
                      </Link>
                      {!isMe && (
                        <button
                          type="button"
                          className="btn-chat-member"
                          onClick={() => navigate(`/tin-nhan?conversation=&newContact=${member.id}`)}
                          title={`Nhắn tin với ${member.name}`}
                        >
                          <Icon name="chat" size={16} />
                          <span>Nhắn tin</span>
                        </button>
                      )}
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
