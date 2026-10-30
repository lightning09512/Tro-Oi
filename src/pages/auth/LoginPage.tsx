import { useState, type FormEvent } from "react"
import { NavLink, useLocation, useNavigate } from "react-router"
import { Button, Icon } from "@/components/common/legacy"
import AuthShell from "@/pages/auth/AuthShell"
import useAuth from "@/hooks/useAuth"
import { useToast } from "@/contexts/ToastContext"
import type { UserRole } from "@/types/auth"
import { authService } from "@/services/authService"

interface DemoAccount {
  role: UserRole
  roleLabel: string
  name: string
  email: string
  phone: string
  password: string
  roleBadgeClass: string
  purpose: string
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    role: "renter",
    roleLabel: "Người thuê",
    name: "Hoàng Trang",
    email: "trang.nguyen@example.com",
    phone: "0901 234 567",
    password: authService.demoPassword,
    roleBadgeClass: "demo-role-renter",
    purpose: "Tìm phòng, lưu tin, nhắn tin",
  },
  {
    role: "landlord",
    roleLabel: "Chủ trọ",
    name: "Minh Ngọc",
    email: "minhngoc@example.com",
    phone: "0987 654 321",
    password: authService.demoPassword,
    roleBadgeClass: "demo-role-landlord",
    purpose: "Đăng tin cho thuê, quản lý phòng",
  },
  {
    role: "admin",
    roleLabel: "Quản trị viên",
    name: "Quản trị viên",
    email: "admin@phongtroplus.vn",
    phone: "0909 000 001",
    password: authService.demoPassword,
    roleBadgeClass: "demo-role-admin",
    purpose: "Quản trị hệ thống, duyệt tin",
  },
]

function resolvePostLoginPath(role: UserRole, requested?: string): string {
  if (role === "admin") {
    if (
      requested &&
      requested.startsWith("/admin") &&
      requested !== "/admin/ho-so" &&
      requested !== "/admin/doi-mat-khau" &&
      requested !== "/admin/dang-nhap"
    ) {
      return requested
    }
    return "/admin"
  }
  if (requested) {
    if (requested.startsWith("/admin")) {
      return role === "landlord" ? "/chu-tro/thong-ke" : "/"
    }
    if (role === "renter" && requested.startsWith("/chu-tro")) {
      return "/"
    }
    if (
      requested !== "/tai-khoan/ho-so" &&
      requested !== "/tai-khoan/doi-mat-khau" &&
      requested !== "/dang-nhap"
    ) {
      return requested
    }
  }
  return role === "landlord" ? "/chu-tro/thong-ke" : "/"
}

export default function LoginPage({ admin = false }: { admin?: boolean }) {
  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [remember, setRemember] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()

  const handleSelectDemo = (acc: DemoAccount) => {
    setIdentifier(acc.email)
    setPassword(acc.password)
    setError("")
    toast(`Đã điền tài khoản: ${acc.name} (${acc.roleLabel})`, "success")
  }

  const handleCopyPassword = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard?.writeText(authService.demoPassword)
    toast(`Đã sao chép mật khẩu: ${authService.demoPassword}`, "success")
  }

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
          <small>Dùng thông tin bạn đã đăng ký hoặc chọn tài khoản mẫu bên dưới.</small>
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

        {!admin && (
          <p className="auth-switch">
            Chưa có tài khoản? <NavLink to="/dang-ky">Đăng ký ngay</NavLink>
          </p>
        )}

        {/* BẢNG TÀI KHOẢN MẪU BÊN DƯỚI ĐĂNG NHẬP */}
        <div className="demo-accounts-table-card">
          <div className="demo-table-header">
            <div className="demo-table-title-wrap">
              <span className="demo-table-badge">Dành cho trải nghiệm</span>
              <h3 className="demo-table-title">Bảng tài khoản mẫu</h3>
            </div>
            <p className="demo-table-desc">
              Bấm vào bất kỳ dòng nào hoặc nút <b>Điền nhanh</b> để tự động nhập tài khoản & mật khẩu:
            </p>
          </div>

          <div className="demo-table-responsive">
            <table className="demo-accounts-table">
              <thead>
                <tr>
                  <th style={{ width: "28%" }}>Vai trò</th>
                  <th style={{ width: "40%" }}>Tài khoản (Email / SĐT)</th>
                  <th style={{ width: "17%" }}>Mật khẩu</th>
                  <th style={{ width: "15%", textAlign: "right" }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {DEMO_ACCOUNTS.map((acc) => {
                  const isSelected = identifier === acc.email || identifier === acc.phone
                  const isHighlighted = admin ? acc.role === "admin" : isSelected
                  return (
                    <tr
                      key={acc.email}
                      className={`demo-account-row ${isSelected ? "is-selected" : ""} ${isHighlighted ? "is-highlighted" : ""}`}
                      onClick={() => handleSelectDemo(acc)}
                      title={`Bấm để chọn tài khoản ${acc.roleLabel}`}
                    >
                      <td>
                        <div className="demo-role-cell">
                          <span className={`demo-role-badge ${acc.roleBadgeClass}`}>
                            {acc.roleLabel}
                          </span>
                          <span className="demo-user-name">{acc.name}</span>
                        </div>
                      </td>
                      <td>
                        <div className="demo-cred-cell">
                          <span className="demo-user-email">{acc.email}</span>
                          <span className="demo-user-phone">{acc.phone}</span>
                        </div>
                      </td>
                      <td>
                        <div className="demo-password-cell">
                          <code className="demo-code-text">{acc.password}</code>
                        </div>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <button
                          type="button"
                          className={`demo-fill-btn ${isSelected ? "is-active" : ""}`}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleSelectDemo(acc)
                          }}
                        >
                          {isSelected ? "Đã điền ✓" : "Điền nhanh"}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="demo-table-footer">
            <div className="demo-footer-info">
              <span>Mật khẩu: <code className="demo-code-inline">{authService.demoPassword}</code></span>
              <button
                type="button"
                className="demo-copy-pwd-btn"
                onClick={handleCopyPassword}
                title="Sao chép mật khẩu"
              >
                <Icon name="copy" size={13} />
                <span>Sao chép</span>
              </button>
            </div>
            <div className="demo-footer-link">
              {!admin ? (
                <NavLink to="/admin/dang-nhap" className="demo-admin-switch">
                  Cổng đăng nhập Quản trị &rarr;
                </NavLink>
              ) : (
                <NavLink to="/dang-nhap" className="demo-admin-switch">
                  &larr; Về đăng nhập thành viên
                </NavLink>
              )}
            </div>
          </div>
        </div>
      </form>
    </AuthShell>
  )
}
