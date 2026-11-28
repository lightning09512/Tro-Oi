import { useState, type FormEvent } from "react"
import { NavLink, useLocation, useNavigate } from "react-router"
import { Button, Icon } from "@/components/common/legacy"
import AuthShell from "@/pages/auth/AuthShell"
import useAuth from "@/hooks/useAuth"
import type { UserRole } from "@/types/auth"


function resolvePostLoginPath(role: UserRole, requested?: string): string {
  // Khi đăng nhập tài khoản Admin, trang mặc định luôn là trang Tổng quan (/admin)
  if (role === "admin") {
    return "/admin"
  }
  if (requested) {
    if (requested.startsWith("/admin")) {
      return role === "landlord" ? "/chu-tro/thong-ke" : "/tim-phong"
    }
    if (role === "renter" && requested.startsWith("/chu-tro")) {
      return "/tim-phong"
    }
    if (
      requested !== "/tai-khoan/ho-so" &&
      requested !== "/tai-khoan/doi-mat-khau" &&
      requested !== "/dang-nhap"
    ) {
      return requested
    }
  }
  return "/tim-phong"
}

export default function LoginPage({ admin = false }: { admin?: boolean }) {
  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [remember, setRemember] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()


  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (loading) return
    setError("")
    if (!identifier.trim() || password.length < 6) {
      setError("Vui lòng nhập tài khoản và mật khẩu có ít nhất 6 ký tự.")
      return
    }
    setLoading(true)
    try {
      const user = await login({
        identifier,
        password,
        remember,
        role: admin ? "admin" : undefined,
      })
      const requested = (location.state as { from?: string } | null)?.from
      navigate(resolvePostLoginPath(user.role, requested), { replace: true })
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Không thể đăng nhập. Vui lòng thử lại.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      eyebrow={admin ? "Khu vực quản trị" : "Chào mừng trở lại"}
      title={admin ? "Đăng nhập quản trị" : "Đăng nhập"}
      description={
        admin
          ? "Dành riêng cho quản trị viên hệ thống."
          : "Tiếp tục hành trình tìm nơi ở phù hợp với bạn."
      }
    >
      <form className="auth-form" onSubmit={submit} noValidate>
        <label className="form-field">
          <span>
            Email hoặc số điện thoại <b>*</b>
          </span>
          <input
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
            autoComplete="username"
            placeholder="vidu@email.com hoặc số điện thoại"
          />
          <small>Dùng thông tin bạn đã đăng ký.</small>
        </label>
        <label className="form-field">
          <span>
            Mật khẩu <b>*</b>
          </span>
          <div className="password-input">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              placeholder="Ít nhất 6 ký tự"
            />
            <button
              type="button"
              onClick={() => setShowPassword((show) => !show)}
              aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            >
              <Icon name="eye" size={18} />
            </button>
          </div>
        </label>
        <div className="form-options">
          <label className="inline-check">
            <input
              type="checkbox"
              checked={remember}
              onChange={(event) => setRemember(event.target.checked)}
            />{" "}
            Ghi nhớ đăng nhập
          </label>
          {!admin && <NavLink to="/quen-mat-khau">Quên mật khẩu?</NavLink>}
        </div>
        {error && (
          <p className="form-message error" role="alert">
            {error}
          </p>
        )}
        <Button type="submit" disabled={loading}>
          {loading ? "Đang đăng nhập..." : "Đăng nhập"}
        </Button>

        {!admin && (
          <p className="auth-switch">
            Chưa có tài khoản? <NavLink to="/dang-ky">Đăng ký ngay</NavLink>
          </p>
        )}

      </form>
    </AuthShell>
  )
}
