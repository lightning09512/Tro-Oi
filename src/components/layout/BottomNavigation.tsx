import { NavLink } from "react-router"
import { Icon } from "@/components/common/legacy"
import useAuth from "@/hooks/useAuth"

export default function BottomNavigation() {
  const { user } = useAuth()
  return (
    <nav className="bottom-nav" aria-label="Điều hướng di động">
      <NavLink to="/" end>
        <Icon name="home" />
        <span>Trang chủ</span>
      </NavLink>
      <NavLink to="/tim-phong">
        <Icon name="search" />
        <span>Tìm phòng</span>
      </NavLink>
      <NavLink to="/dien-dan">
        <Icon name="users" />
        <span>Diễn đàn</span>
      </NavLink>
      <NavLink to={user?.role === "admin" ? "/admin" : user ? "/tin-nhan" : "/dang-nhap"}>
        <Icon name={user?.role === "admin" ? "chart" : "chat"} />
        <span>{user?.role === "admin" ? "Quản trị" : "Tin nhắn"}</span>
      </NavLink>
      <NavLink to={user?.role === "admin" ? "/admin/ho-so" : user ? "/trang-ca-nhan" : "/dang-nhap"}>
        {user ? (
          <span className="avatar">
            {user.avatarUrl ? <img className="user-avatar-image" src={user.avatarUrl} alt="" /> : user.initials}
          </span>
        ) : (
          <Icon name="users" />
        )}
        <span>Cá nhân</span>
      </NavLink>
    </nav>
  )
}
