import { useMemo } from "react"
import { useNavigate } from "react-router"
import { Button, Icon } from "@/components/common/legacy"
import { usePlatform } from "@/contexts/PlatformContext"
import useAuth from "@/hooks/useAuth"

export default function LandlordStatsPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { listings, connectionState, connectionError } = usePlatform()
  const mine = useMemo(() => listings.filter((item) => item.ownerId === user?.id), [listings, user?.id])
  const totalViews = mine.reduce((total, item) => total + item.views, 0)
  const totalContacts = mine.reduce((total, item) => total + item.contacts, 0)
  const active = mine.filter((item) => item.status === "active").length
  const maxViews = Math.max(1, ...mine.map((item) => item.views))

  return (
    <main className="workspace-page management-page management-stats">
      <div className="container workspace-container">
        <div className="page-heading-row"><div><h1>Hiệu quả tin đăng</h1><p>Số liệu được tính từ hoạt động của các tin trong tài khoản này.</p></div><Button variant="outline" onClick={() => navigate("/chu-tro/quan-ly-tin")}>Quản lý tin</Button></div>
        {connectionState === "loading" && <p className="management-feedback" role="status">Đang tải thống kê…</p>}
        {connectionState === "error" && <p className="form-message error" role="alert">{connectionError}</p>}
        <section className="metric-grid">
          {[["Lượt xem", totalViews, "eye"], ["Lượt liên hệ", totalContacts, "chat"], ["Tin đang hiển thị", active, "building"], ["Tổng số tin", mine.length, "chart"]].map(([label, value, icon]) => <article className="metric-card" key={label}><span><Icon name={String(icon)} /></span><div><small>{label}</small><strong>{connectionState === "loading" || connectionState === "error" ? "—" : Number(value).toLocaleString("vi-VN")}</strong></div></article>)}
        </section>
        {connectionState === "loading" || connectionState === "error" ? null : mine.length ? (
          <section className="editor-card performance-card">
            <div className="editor-section-title"><div><h2>Lượt xem theo phòng</h2><p>So sánh lượt xem và số lần liên hệ của từng tin.</p></div></div>
            <div className="performance-list">
              {mine.map((item) => (
                <div className="performance-row" key={item.id}>
                  <div><strong>{item.title}</strong><small>{item.location} · {item.contacts} lượt liên hệ</small></div>
                  <span className="performance-track"><i style={{ width: `${Math.max(0, (item.views / maxViews) * 100)}%` }} /></span>
                  <b>{item.views}</b>
                </div>
              ))}
            </div>
          </section>
        ) : (
          <section className="empty-state">
            <span className="placeholder-icon"><Icon name="chart" size={28} /></span>
            <h2>Chưa có dữ liệu thống kê</h2>
            <p>Bạn chưa đăng phòng nào. Hãy đăng tin đầu tiên để theo dõi lượt xem và liên hệ từ người thuê.</p>
            <Button onClick={() => navigate("/chu-tro/dang-tin")}>Đăng phòng mới</Button>
          </section>
        )}
      </div>
    </main>
  )
}
