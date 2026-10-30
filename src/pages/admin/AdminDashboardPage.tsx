import { useMemo } from "react"
import { useNavigate } from "react-router"
import { Button, Icon } from "@/components/common/legacy"
import { usePlatform } from "@/contexts/PlatformContext"

export default function AdminDashboardPage() {
  const navigate = useNavigate()
  const { users, listings, posts, reports, connectionState, connectionError } = usePlatform()

  // Computed metrics
  const activeRooms = useMemo(() => listings.filter((item) => item.status === "active"), [listings])
  const pendingRooms = useMemo(() => listings.filter((item) => item.status === "pending"), [listings])
  const rentedRooms = useMemo(() => listings.filter((item) => item.status === "rented"), [listings])
  const totalViews = useMemo(() => listings.reduce((sum, item) => sum + (item.views || 0), 0), [listings])
  const totalContacts = useMemo(() => listings.reduce((sum, item) => sum + (item.contacts || 0), 0), [listings])

  const renters = useMemo(() => users.filter((u) => u.role === "renter"), [users])
  const landlords = useMemo(() => users.filter((u) => u.role === "landlord"), [users])

  const activePosts = useMemo(() => posts.filter((p) => p.status === "active"), [posts])
  const pendingPosts = useMemo(() => posts.filter((p) => p.status === "pending"), [posts])
  const totalLikes = useMemo(() => posts.reduce((sum, p) => sum + (p.likes || 0), 0), [posts])
  const totalComments = useMemo(() => posts.reduce((sum, p) => sum + (p.commentsCount || 0), 0), [posts])

  const pendingReports = useMemo(() => reports.filter((r) => r.status === "pending"), [reports])
  const pendingTasksCount = pendingRooms.length + pendingPosts.length + pendingReports.length

  // High priority pending queue items
  const tasks = useMemo(() => {
    return [
      ...pendingRooms.map((item) => ({
        type: "Tin phòng",
        title: item.title,
        detail: `${item.ownerName} · ${item.location}`,
        link: "/admin/tin-cho-thue",
      })),
      ...pendingPosts.map((item) => ({
        type: "Bài viết",
        title: item.content,
        detail: item.name,
        link: "/admin/dien-dan",
      })),
      ...pendingReports.map((item) => ({
        type: "Báo cáo",
        title: item.targetTitle,
        detail: `${item.reason} · ${item.reporter}`,
        link: "/admin/bao-cao",
      })),
    ].slice(0, 4)
  }, [pendingRooms, pendingPosts, pendingReports])

  // Top 5 listings by view count or recent
  const topListings = useMemo(() => {
    return [...listings]
      .sort((a, b) => (b.views || 0) - (a.views || 0))
      .slice(0, 5)
  }, [listings])

  // Latest 4 community posts
  const recentPosts = useMemo(() => {
    return [...posts].slice(0, 4)
  }, [posts])

  return (
    <main className="admin-resource-page management-page management-admin admin-dashboard-pro">
      {/* 1. Header Bar */}
      <div className="dashboard-pro-header">
        <div className="dashboard-header-main">
          <div className="dashboard-header-title-row">
            <h1>Bảng điều khiển vận hành</h1>
            <span
              className={`dashboard-status-pill ${
                pendingTasksCount > 0 ? "is-warning" : "is-healthy"
              }`}
            >
              <span className="dashboard-status-pulse" />
              {pendingTasksCount > 0
                ? `${pendingTasksCount} mục cần kiểm duyệt`
                : "Hệ thống vận hành ổn định"}
            </span>
          </div>
          <p className="dashboard-header-sub">
            Theo dõi nguồn cung phòng trọ, lưu lượng tương tác và trạng thái cộng đồng theo thời gian thực.
          </p>
        </div>
        <div className="dashboard-header-actions">
          <Button variant="outline" icon="chart" onClick={() => navigate("/admin/thong-ke")}>
            Báo cáo & Thống kê
          </Button>
          <button
            type="button"
            className="dashboard-quick-cta"
            onClick={() => navigate("/admin/tin-cho-thue")}
          >
            <Icon name="building" size={17} />
            <span>Quản lý tin đăng</span>
          </button>
        </div>
      </div>

      {connectionState === "loading" && (
        <p className="management-feedback" role="status">
          Đang kết nối và tải số liệu thời gian thực…
        </p>
      )}
      {connectionState === "error" && (
        <p className="form-message error" role="alert">
          {connectionError}
        </p>
      )}

      {/* 2. Bento Metric Cards */}
      <section className="dashboard-kpi-grid">
        {/* Card 1: Thành viên */}
        <div
          className="dashboard-kpi-card kpi--users"
          onClick={() => navigate("/admin/nguoi-dung")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && navigate("/admin/nguoi-dung")}
        >
          <div className="kpi-top">
            <span className="kpi-icon-bubble">
              <Icon name="users" size={20} />
            </span>
            <span className="kpi-badge">+{users.length} tài khoản</span>
          </div>
          <div className="kpi-body">
            <span className="kpi-label">Thành viên hệ thống</span>
            <strong className="kpi-value">
              {connectionState === "loading" ? "—" : users.length.toLocaleString("vi-VN")}
            </strong>
          </div>
          <div className="kpi-progress-bar">
            <div
              className="kpi-progress-fill"
              style={{
                width: `${Math.min(
                  100,
                  Math.max(10, Math.round((renters.length / (users.length || 1)) * 100)),
                )}%`,
              }}
            />
          </div>
          <div className="kpi-footer">
            <span>
              <b>{renters.length}</b> người thuê
            </span>
            <span>
              <b>{landlords.length}</b> chủ trọ
            </span>
          </div>
        </div>

        {/* Card 2: Nguồn cung phòng trọ */}
        <div
          className="dashboard-kpi-card kpi--listings"
          onClick={() => navigate("/admin/tin-cho-thue")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && navigate("/admin/tin-cho-thue")}
        >
          <div className="kpi-top">
            <span className="kpi-icon-bubble">
              <Icon name="building" size={20} />
            </span>
            <span className="kpi-badge kpi-badge--emerald">{activeRooms.length} đang mở</span>
          </div>
          <div className="kpi-body">
            <span className="kpi-label">Nguồn cung phòng trọ</span>
            <strong className="kpi-value">
              {connectionState === "loading" ? "—" : listings.length.toLocaleString("vi-VN")}
            </strong>
          </div>
          <div className="kpi-progress-bar">
            <div
              className="kpi-progress-fill is-emerald"
              style={{
                width: `${Math.min(
                  100,
                  Math.max(10, Math.round((activeRooms.length / (listings.length || 1)) * 100)),
                )}%`,
              }}
            />
          </div>
          <div className="kpi-footer">
            <span>
              <b>{activeRooms.length}</b> đang hiển thị
            </span>
            <span>
              <b>{pendingRooms.length}</b> chờ duyệt
            </span>
          </div>
        </div>

        {/* Card 3: Cộng đồng diễn đàn */}
        <div
          className="dashboard-kpi-card kpi--forum"
          onClick={() => navigate("/admin/dien-dan")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && navigate("/admin/dien-dan")}
        >
          <div className="kpi-top">
            <span className="kpi-icon-bubble">
              <Icon name="chat" size={20} />
            </span>
            <span className="kpi-badge kpi-badge--purple">{totalLikes} lượt thích</span>
          </div>
          <div className="kpi-body">
            <span className="kpi-label">Thảo luận cộng đồng</span>
            <strong className="kpi-value">
              {connectionState === "loading" ? "—" : posts.length.toLocaleString("vi-VN")}
            </strong>
          </div>
          <div className="kpi-progress-bar">
            <div
              className="kpi-progress-fill is-purple"
              style={{
                width: `${Math.min(
                  100,
                  Math.max(15, Math.round((activePosts.length / (posts.length || 1)) * 100)),
                )}%`,
              }}
            />
          </div>
          <div className="kpi-footer">
            <span>
              <b>{activePosts.length}</b> bài hiển thị
            </span>
            <span>
              <b>{totalComments}</b> bình luận
            </span>
          </div>
        </div>

        {/* Card 4: Kiểm duyệt & Báo cáo */}
        <div
          className="dashboard-kpi-card kpi--safety"
          onClick={() => navigate("/admin/bao-cao")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && navigate("/admin/bao-cao")}
        >
          <div className="kpi-top">
            <span className="kpi-icon-bubble">
              <Icon name="shield" size={20} />
            </span>
            <span
              className={`kpi-badge ${
                pendingReports.length > 0 ? "kpi-badge--danger" : "kpi-badge--success"
              }`}
            >
              {pendingReports.length > 0 ? `${pendingReports.length} cần xem` : "Đã sạch"}
            </span>
          </div>
          <div className="kpi-body">
            <span className="kpi-label">Hàng đợi kiểm duyệt</span>
            <strong className="kpi-value">
              {connectionState === "loading" ? "—" : pendingReports.length}
            </strong>
          </div>
          <div className="kpi-progress-bar">
            <div
              className={`kpi-progress-fill ${
                pendingReports.length > 0 ? "is-danger" : "is-teal"
              }`}
              style={{ width: pendingReports.length > 0 ? "75%" : "100%" }}
            />
          </div>
          <div className="kpi-footer">
            <span>
              <b>{pendingReports.length}</b> báo cáo vi phạm
            </span>
            <span>
              <b>{reports.length}</b> tổng phản ánh
            </span>
          </div>
        </div>
      </section>

      {/* 3. Main Dashboard Grid (65% Left / 35% Right) */}
      <div className="dashboard-main-grid">
        {/* LEFT COLUMN: ~65% */}
        <div className="dashboard-col-main">
          {/* Priority Task Queue or Clean Banner */}
          {tasks.length > 0 ? (
            <section className="dashboard-card dashboard-pending-box">
              <div className="dashboard-card-header">
                <div>
                  <h3>Việc cần xử lý ngay ({tasks.length})</h3>
                  <p>Tin đăng, bài viết và báo cáo vi phạm đang chờ quản trị viên phê duyệt.</p>
                </div>
                <span className="dashboard-pending-count-pill">{tasks.length} mục</span>
              </div>
              <div className="dashboard-task-list">
                {tasks.map((task, idx) => (
                  <div
                    key={`${task.type}-${idx}`}
                    className="dashboard-task-item"
                    onClick={() => navigate(task.link)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && navigate(task.link)}
                  >
                    <span className="task-type-badge">{task.type}</span>
                    <div className="task-text-col">
                      <strong>{task.title}</strong>
                      <span>{task.detail}</span>
                    </div>
                    <button type="button" className="task-action-btn">
                      <span>Xử lý</span>
                      <Icon name="chevron" size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          ) : (
            <div className="dashboard-healthy-banner">
              <div className="healthy-icon-box">
                <Icon name="check" size={20} />
              </div>
              <div className="healthy-content">
                <h4>Hàng đợi kiểm duyệt sạch 100%</h4>
                <p>
                  Tất cả tin phòng trọ, bài thảo luận diễn đàn và báo cáo người dùng đều đã được kiểm tra và xử lý hoàn tất.
                </p>
              </div>
            </div>
          )}

          {/* Top / Recent Listings Live Table */}
          <section className="dashboard-card dashboard-listings-card">
            <div className="dashboard-card-header">
              <div>
                <h3>Tin cho thuê mới & thu hút nhất</h3>
                <p>Danh sách các phòng trọ có lượt quan tâm cao và tin mới đăng trên sàn.</p>
              </div>
              <button
                type="button"
                className="dashboard-link-btn"
                onClick={() => navigate("/admin/tin-cho-thue")}
              >
                Quản lý tất cả ({listings.length}) <Icon name="chevron" size={14} />
              </button>
            </div>

            <div className="dashboard-table-wrapper">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Phòng trọ</th>
                    <th>Giá thuê</th>
                    <th>Chủ nhà trọ</th>
                    <th>Lượt xem</th>
                    <th>Trạng thái</th>
                    <th className="text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {topListings.map((room) => (
                    <tr key={room.id}>
                      <td>
                        <div className="room-cell">
                          <img
                            src={
                              room.image ||
                              "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=160&auto=format&fit=crop&q=80"
                            }
                            alt={room.title}
                            className="room-thumb"
                            onError={(e) => {
                              ;(e.currentTarget as HTMLImageElement).src =
                                "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=160&auto=format&fit=crop&q=80"
                            }}
                          />
                          <div className="room-info">
                            <strong className="room-title" title={room.title}>
                              {room.title}
                            </strong>
                            <span className="room-location">{room.location}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="room-price-tag">
                          {room.price || `${room.priceValue?.toLocaleString("vi-VN")} đ`}
                        </span>
                      </td>
                      <td>
                        <span className="room-owner">{room.ownerName}</span>
                      </td>
                      <td>
                        <div className="room-views-col">
                          <strong>{(room.views || 0).toLocaleString("vi-VN")}</strong>
                          <small>{room.contacts || 0} liên hệ</small>
                        </div>
                      </td>
                      <td>
                        <span className={`room-status-badge is-${room.status}`}>
                          {room.status === "active"
                            ? "Đang mở"
                            : room.status === "pending"
                              ? "Chờ duyệt"
                              : room.status === "rented"
                                ? "Đã thuê"
                                : "Đang ẩn"}
                        </span>
                      </td>
                      <td className="text-right">
                        <button
                          type="button"
                          className="room-detail-btn"
                          onClick={() => navigate("/admin/tin-cho-thue")}
                          title="Xem và chỉnh sửa tin"
                        >
                          Chi tiết
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN: ~35% */}
        <div className="dashboard-col-side">
          {/* Operational Breakdown / Telemetry */}
          <section className="dashboard-card dashboard-telemetry-card">
            <div className="dashboard-card-header">
              <div>
                <h3>Cơ cấu nguồn cung & Lưu lượng</h3>
                <p>Tỷ lệ phân bổ trạng thái và hoạt động</p>
              </div>
            </div>

            <div className="telemetry-section">
              <span className="telemetry-label">
                Trạng thái tin cho thuê ({listings.length} tin)
              </span>
              <div className="telemetry-bar-stacked">
                <span
                  className="bar-slice is-emerald"
                  style={{
                    width: `${Math.round(
                      (activeRooms.length / (listings.length || 1)) * 100,
                    )}%`,
                  }}
                  title={`Đang mở: ${activeRooms.length}`}
                />
                <span
                  className="bar-slice is-amber"
                  style={{
                    width: `${Math.round(
                      (pendingRooms.length / (listings.length || 1)) * 100,
                    )}%`,
                  }}
                  title={`Chờ duyệt: ${pendingRooms.length}`}
                />
                <span
                  className="bar-slice is-gray"
                  style={{
                    width: `${Math.round(
                      (rentedRooms.length / (listings.length || 1)) * 100,
                    )}%`,
                  }}
                  title={`Đã thuê: ${rentedRooms.length}`}
                />
              </div>
              <div className="telemetry-legend">
                <span>
                  <i className="legend-dot is-emerald" /> Đang mở: <b>{activeRooms.length}</b>
                </span>
                <span>
                  <i className="legend-dot is-amber" /> Chờ duyệt: <b>{pendingRooms.length}</b>
                </span>
                <span>
                  <i className="legend-dot is-gray" /> Đã thuê: <b>{rentedRooms.length}</b>
                </span>
              </div>
            </div>

            <div className="telemetry-divider" />

            <div className="telemetry-stats-row">
              <div className="telemetry-stat-box">
                <small>Tổng lượt xem tin</small>
                <strong>{totalViews.toLocaleString("vi-VN")}</strong>
                <span>Trên toàn hệ thống</span>
              </div>
              <div className="telemetry-stat-box">
                <small>Lượt liên hệ chủ trọ</small>
                <strong>{totalContacts.toLocaleString("vi-VN")}</strong>
                <span>Kết nối thành công</span>
              </div>
            </div>

            <div className="telemetry-divider" />

            <div className="telemetry-section">
              <span className="telemetry-label">
                Cơ cấu vai trò người dùng ({users.length} tài khoản)
              </span>
              <div className="telemetry-bar-stacked">
                <span
                  className="bar-slice is-blue"
                  style={{
                    width: `${Math.round((renters.length / (users.length || 1)) * 100)}%`,
                  }}
                  title={`Người thuê: ${renters.length}`}
                />
                <span
                  className="bar-slice is-teal"
                  style={{
                    width: `${Math.round((landlords.length / (users.length || 1)) * 100)}%`,
                  }}
                  title={`Chủ trọ: ${landlords.length}`}
                />
              </div>
              <div className="telemetry-legend">
                <span>
                  <i className="legend-dot is-blue" /> Người thuê: <b>{renters.length}</b> (
                  {Math.round((renters.length / (users.length || 1)) * 100)}%)
                </span>
                <span>
                  <i className="legend-dot is-teal" /> Chủ trọ: <b>{landlords.length}</b> (
                  {Math.round((landlords.length / (users.length || 1)) * 100)}%)
                </span>
              </div>
            </div>
          </section>

          {/* Recent Forum Discussions */}
          <section className="dashboard-card dashboard-forum-recent-card">
            <div className="dashboard-card-header">
              <div>
                <h3>Thảo luận cộng đồng mới nhất</h3>
                <p>Bài viết và tương tác gần đây trên diễn đàn</p>
              </div>
              <button
                type="button"
                className="dashboard-link-btn"
                onClick={() => navigate("/admin/dien-dan")}
              >
                Quản lý <Icon name="chevron" size={14} />
              </button>
            </div>

            <div className="recent-posts-list">
              {recentPosts.map((post) => (
                <div
                  key={post.id}
                  className="recent-post-row"
                  onClick={() => navigate("/admin/dien-dan")}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && navigate("/admin/dien-dan")}
                >
                  <div className="post-author-avatar">
                    {post.avatarUrl ? (
                      <img src={post.avatarUrl} alt={post.name} />
                    ) : (
                      <span>{post.initials || post.name?.slice(0, 2).toUpperCase() || "TV"}</span>
                    )}
                  </div>
                  <div className="post-content-meta">
                    <div className="post-author-line">
                      <strong>{post.name}</strong>
                      <time>{post.time || "Vừa xong"}</time>
                    </div>
                    <p className="post-snippet">{post.content}</p>
                    <div className="post-stats-pill">
                      <span>
                        <Icon name="heart" size={12} /> {post.likes || 0}
                      </span>
                      <span>
                        <Icon name="chat" size={12} /> {post.commentsCount || 0}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
