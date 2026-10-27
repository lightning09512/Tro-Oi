import { useState, type FormEvent } from "react"
import { NavLink, useLocation, useNavigate } from "react-router"
import { Button, Icon } from "@/components/common/legacy"
import AuthShell from "@/pages/auth/AuthShell"
import useAuth from "@/hooks/useAuth"
import type { UserRole } from "@/types/auth"
import { authService } from "@/services/authService"

export default function LoginPage({ admin = false }: { admin?: boolean }) {
  const [identifier, setIdentifier] = useState(
    admin ? "admin@phongtroplus.vn" : "",
  )
  const [password, setPassword] = useState("")
  const [remember, setRemember] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [role, setRole] = useState<UserRole>(admin ? "admin" : "renter")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const fillDemo = (demoEmail: string, demoRole: UserRole) => {
    setIdentifier(demoEmail)
    setPassword(authService.demoPassword)
    setRole(demoRole)
    setError("")
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
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
      navigate(
        requested ??
          (user.role === "admin"
            ? "/admin"
            : user.role === "landlord"
              ? "/chu-tro/thong-ke"
              : "/"),
        { replace: true },
      )
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
        {!admin && (
          <fieldset className="role-picker">
            <legend>
              Đăng nhập tài khoản <span>*</span>
            </legend>
            <label>
              <input
                type="radio"
                name="login-role"
                checked={role === "renter"}
                onChange={() => setRole("renter")}
              />{" "}
              Người thuê
            </label>
            <label>
              <input
                type="radio"
                name="login-role"
                checked={role === "landlord"}
                onChange={() => setRole("landlord")}
              />{" "}
              Chủ trọ
            </label>
            <label>
              <input
                type="radio"
                name="login-role"
                checked={role === "admin"}
                onChange={() => setRole("admin")}
              />{" "}
              Quản trị viên
            </label>
          </fieldset>
        )}
        <label className="form-field">
          <span>
            Email hoặc số điện thoại <b>*</b>
          </span>
          <input
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
            autoComplete="username"
            placeholder="vidu@email.com"
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
        <Button disabled={loading}>{loading ? "Đang đăng nhập..." : "Đăng nhập"}</Button>
        <div className="demo-credentials">
          <div className="demo-credentials-header">
            <strong>Tài khoản thử nghiệm</strong>
            <small>Bấm vào tài khoản bên dưới để tự động điền nhanh:</small>
          </div>
          {admin ? (
            <div className="demo-cred-buttons">
              <button
                type="button"
                className={`demo-cred-btn ${identifier === "admin@phongtroplus.vn" ? "active" : ""}`}
                onClick={() => fillDemo("admin@phongtroplus.vn", "admin")}
                title="Bấm để điền tài khoản quản trị"
              >
                <span className="demo-cred-badge admin">Quản trị viên</span>
                <span className="demo-cred-email">admin@phongtroplus.vn</span>
              </button>
            </div>
          ) : (
            <div className="demo-cred-buttons">
              <button
                type="button"
                className={`demo-cred-btn ${identifier === "trang.nguyen@example.com" ? "active" : ""}`}
                onClick={() => fillDemo("trang.nguyen@example.com", "renter")}
                title="Bấm để điền tài khoản người thuê"
              >
                <span className="demo-cred-badge renter">Người thuê</span>
                <span className="demo-cred-email">trang.nguyen@example.com</span>
              </button>
              <button
                type="button"
                className={`demo-cred-btn ${identifier === "minhngoc@example.com" ? "active" : ""}`}
                onClick={() => fillDemo("minhngoc@example.com", "landlord")}
                title="Bấm để điền tài khoản chủ trọ"
              >
                <span className="demo-cred-badge landlord">Chủ trọ</span>
                <span className="demo-cred-email">minhngoc@example.com</span>
              </button>
              <button
                type="button"
                className={`demo-cred-btn ${identifier === "admin@phongtroplus.vn" ? "active" : ""}`}
                onClick={() => fillDemo("admin@phongtroplus.vn", "admin")}
                title="Bấm để điền tài khoản quản trị"
              >
                <span className="demo-cred-badge admin">Quản trị viên</span>
                <span className="demo-cred-email">admin@phongtroplus.vn</span>
              </button>
            </div>
          )}
          <div className="demo-cred-footer">
            <span>Mật khẩu: <code>{authService.demoPassword}</code></span>
            {!admin ? (
              <NavLink to="/admin/dang-nhap" className="demo-admin-link">
                Cổng đăng nhập quản trị riêng &rarr;
              </NavLink>
            ) : (
              <NavLink to="/dang-nhap" className="demo-admin-link">
                &larr; Về trang đăng nhập thành viên
              </NavLink>
            )}
          </div>
        </div>
        {!admin && (
          <p className="auth-switch">
            Chưa có tài khoản? <NavLink to="/dang-ky">Đăng ký ngay</NavLink>
          </p>
        )}
      </form>
    </AuthShell>
  )
}
