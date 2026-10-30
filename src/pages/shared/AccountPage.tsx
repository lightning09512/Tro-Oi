import { useState, useRef, useEffect, type FormEvent } from "react"
import { Link, NavLink, useLocation } from "react-router"
import { Button, Icon } from "@/components/common/legacy"
import useAuth from "@/hooks/useAuth"
import useDialogFocus from "@/hooks/useDialogFocus"
import { authService } from "@/services/authService"
import { useFavorites } from "@/contexts/FavoritesContext"
import { usePlatform } from "@/contexts/PlatformContext"
import { apiRequest, isApiMode } from "@/services/apiClient"

export default function AccountPage({
  passwordMode = false,
}: {
  passwordMode?: boolean
}) {
  const { user, updateUser } = useAuth()
  const { favoriteIds } = useFavorites()
  const { listings } = usePlatform()
  const { pathname } = useLocation()
  const isAdmin = user?.role === "admin" || pathname.startsWith("/admin")
  const profilePath = isAdmin ? "/admin/ho-so" : "/tai-khoan/ho-so"
  const passwordPath = isAdmin ? "/admin/doi-mat-khau" : "/tai-khoan/doi-mat-khau"

  const myListings = listings.filter((item) => item.ownerId === user?.id)
  const currentRental = listings.find(
    (item) => item.status === "rented" && item.currentTenantId === user?.id,
  )

  // Profile Form State
  const [name, setName] = useState(user?.name ?? "")
  const [phone, setPhone] = useState(user?.phone ?? "")
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(user?.avatarUrl)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [showAvatarModal, setShowAvatarModal] = useState(false)
  const [avatarFeedback, setAvatarFeedback] = useState<{
    message: string
    type: "success" | "error"
  } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const avatarDialogRef = useRef<HTMLDivElement>(null)
  useDialogFocus(avatarDialogRef, () => setShowAvatarModal(false), showAvatarModal)

  const [profileStatus, setProfileStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [profileError, setProfileError] = useState("")

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [passwordStatus, setPasswordStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [passwordError, setPasswordError] = useState("")

  useEffect(() => {
    setName(user?.name ?? "")
    setPhone(user?.phone ?? "")
    setAvatarUrl(user?.avatarUrl)
  }, [user])

  useEffect(() => {
    setProfileStatus("idle")
    setProfileError("")
    setPasswordStatus("idle")
    setPasswordError("")
  }, [passwordMode])

  const isProfileDirty =
    name.trim() !== (user?.name ?? "").trim() ||
    phone.trim() !== (user?.phone ?? "").trim()

  const handleAvatarFileSelect = async (files?: FileList | null) => {
    if (!files || !files[0]) return
    const file = files[0]
    if (!file.type.startsWith("image/")) {
      setAvatarFeedback({
        message: "Vui lòng chỉ chọn tệp hình ảnh (JPG, PNG, WebP, AVIF).",
        type: "error",
      })
      return
    }
    const maxFileSize = isApiMode ? 3_000_000 : 1_000_000
    if (file.size > maxFileSize) {
      setAvatarFeedback({
        message: isApiMode ? "Ảnh đại diện cần nhỏ hơn 3 MB." : "Ảnh cần nhỏ hơn 1 MB.",
        type: "error",
      })
      return
    }

    setUploadingAvatar(true)
    setAvatarFeedback(null)
    setProfileError("")
    try {
      let url: string
      if (isApiMode) {
        const body = new FormData()
        body.append("file", file)
        const result = await apiRequest<{ url: string }>("uploads/image", {
          method: "POST",
          body,
        })
        url = result.url
      } else {
        url = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () =>
            typeof reader.result === "string"
              ? resolve(reader.result)
              : reject(new Error("Không thể đọc ảnh."))
          reader.onerror = () => reject(new Error("Lỗi khi đọc tệp ảnh."))
          reader.readAsDataURL(file)
        })
      }

      setAvatarUrl(url)
      if (user) {
        await updateUser({ ...user, avatarUrl: url })
      }
      setAvatarFeedback({
        message: "Đã tải lên và cập nhật ảnh đại diện mới thành công!",
        type: "success",
      })
    } catch (caught) {
      setAvatarFeedback({
        message: caught instanceof Error ? caught.message : "Không thể tải ảnh lên.",
        type: "error",
      })
    } finally {
      setUploadingAvatar(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
      window.setTimeout(() => setAvatarFeedback(null), 4000)
    }
  }

  const handleRemoveAvatar = async () => {
    setAvatarUrl(undefined)
    setAvatarFeedback(null)
    if (user) {
      try {
        await updateUser({ ...user, avatarUrl: undefined })
        setAvatarFeedback({
          message: "Đã gỡ ảnh đại diện, chuyển về chữ cái viết tắt mặc định.",
          type: "success",
        })
        window.setTimeout(() => setAvatarFeedback(null), 3000)
      } catch (caught) {
        setAvatarFeedback({
          message: caught instanceof Error ? caught.message : "Lỗi khi gỡ ảnh.",
          type: "error",
        })
      }
    }
  }

  const submitProfile = async (event: FormEvent) => {
    event.preventDefault()
    if (profileStatus === "loading" || uploadingAvatar) return
    setProfileError("")
    if (!name.trim() || !phone.trim()) {
      setProfileStatus("error")
      setProfileError("Họ tên và số điện thoại không được để trống.")
      return
    }
    setProfileStatus("loading")
    try {
      if (user) {
        const initials = name
          .trim()
          .split(" ")
          .slice(-2)
          .map((part) => part[0])
          .join("")
          .toUpperCase()
        await updateUser({
          ...user,
          name: name.trim(),
          phone: phone.trim(),
          initials,
          avatarUrl: avatarUrl || undefined,
        })
      }
      setProfileStatus("success")
      window.setTimeout(() => setProfileStatus("idle"), 4000)
    } catch (caught) {
      setProfileStatus("error")
      setProfileError(caught instanceof Error ? caught.message : "Không thể lưu thông tin hồ sơ.")
    }
  }

  const submitPassword = async (event: FormEvent) => {
    event.preventDefault()
    if (passwordStatus === "loading") return
    setPasswordError("")
    if (!currentPassword) {
      setPasswordStatus("error")
      setPasswordError("Vui lòng nhập mật khẩu hiện tại.")
      return
    }
    if (newPassword.length < 8) {
      setPasswordStatus("error")
      setPasswordError("Mật khẩu mới cần tối thiểu 8 ký tự.")
      return
    }
    if (newPassword !== confirm) {
      setPasswordStatus("error")
      setPasswordError("Xác nhận mật khẩu chưa trùng khớp với mật khẩu mới.")
      return
    }
    setPasswordStatus("loading")
    try {
      if (user) {
        await authService.changePassword(user.id, currentPassword, newPassword)
        setCurrentPassword("")
        setNewPassword("")
        setConfirm("")
      }
      setPasswordStatus("success")
      window.setTimeout(() => setPasswordStatus("idle"), 4000)
    } catch (caught) {
      setPasswordStatus("error")
      setPasswordError(caught instanceof Error ? caught.message : "Không thể cập nhật mật khẩu.")
    }
  }

  const shortcuts: Array<{
    to: string
    title: string
    detail: string
    icon: string
  }> =
    user?.role === "renter"
      ? [
          ...(currentRental
            ? [
                {
                  to: `/phong/${currentRental.id}`,
                  title: "Đánh giá phòng đang thuê",
                  detail: currentRental.title,
                  icon: "star",
                },
              ]
            : []),
          {
            to: "/yeu-thich",
            title: "Tin yêu thích",
            detail: `${favoriteIds.length} phòng đã lưu`,
            icon: "heart",
          },
          {
            to: "/tin-nhan",
            title: "Tin nhắn",
            detail: "Trao đổi với chủ trọ và người thuê",
            icon: "chat",
          },
          {
            to: "/dien-dan",
            title: "Diễn đàn",
            detail: "Đọc và chia sẻ kinh nghiệm thuê trọ",
            icon: "users",
          },
          {
            to: "/bao-cao-cua-toi",
            title: "Báo cáo của tôi",
            detail: "Theo dõi nội dung đã gửi báo cáo",
            icon: "shield",
          },
        ]
      : user?.role === "landlord"
        ? [
            {
              to: "/chu-tro/quan-ly-tin",
              title: "Tin cho thuê của tôi",
              detail: `${myListings.length} tin đã đăng`,
              icon: "building",
            },
            {
              to: "/chu-tro/dang-tin",
              title: "Đăng tin cho thuê",
              detail: "Tạo tin mới để tìm người thuê",
              icon: "plus",
            },
            {
              to: "/chu-tro/thong-ke",
              title: "Hiệu quả tin đăng",
              detail: "Theo dõi lượt xem và liên hệ",
              icon: "chart",
            },
            {
              to: "/yeu-thich",
              title: "Tin yêu thích",
              detail: `${favoriteIds.length} phòng đã lưu`,
              icon: "heart",
            },
            {
              to: "/tin-nhan",
              title: "Tin nhắn",
              detail: "Trao đổi với người đang tìm phòng",
              icon: "chat",
            },
          ]
        : []

  const RootTag = isAdmin ? "div" : "main"

  return (
    <RootTag className={`page-bg account-page${isAdmin ? " account-page--admin" : ""}`}>
      <div
        className={`${isAdmin ? "" : "container "}account-layout${isAdmin ? " account-layout--admin" : ""}`}
      >
        {/* Left Column */}
        <aside className="account-summary">
          <div
            className="account-avatar-wrapper"
            onClick={() => setShowAvatarModal(true)}
            role="button"
            tabIndex={0}
            title="Bấm để đổi ảnh đại diện"
            aria-label="Đổi ảnh đại diện"
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault()
                setShowAvatarModal(true)
              }
            }}
          >
            <span className="avatar xlarge account-avatar-display">
              {avatarUrl ? (
                <img className="user-avatar-image" src={avatarUrl} alt="" />
              ) : (
                user?.initials
              )}
            </span>
            <span className="account-avatar-camera-badge" aria-hidden="true">
              <Icon name="camera" size={14} />
            </span>
          </div>
          <h2>{user?.name}</h2>
          <p>{user?.email}</p>
          <div className="account-summary-badge-wrap">
            <span className="role-badge">
              {isAdmin ? "Quản trị viên" : user?.role === "landlord" ? "Chủ trọ" : "Người thuê"}
            </span>
          </div>

          <button
            type="button"
            className="account-edit-avatar-pill"
            onClick={() => setShowAvatarModal(true)}
          >
            <Icon name="camera" size={14} /> Đổi ảnh đại diện
          </button>

          {!isAdmin && (
            <div className="account-summary-actions" style={{ marginTop: 12 }}>
              <Link
                to="/trang-ca-nhan"
                className="account-view-profile-link account-view-profile-link--secondary"
                title="Xem giao diện trang cá nhân của bạn"
              >
                <Icon name="users" size={15} />
                <span>Xem trang cá nhân</span>
              </Link>
            </div>
          )}

          {/* Admin Security & Session Checklist */}
          {isAdmin ? (
            <div className="admin-profile-security-box">
              <div className="admin-security-box-header">
                <Icon name="shield" size={15} />
                <span>Thông tin quản trị & an toàn</span>
              </div>
              <dl className="admin-security-dl">
                <div>
                  <dt>Số điện thoại</dt>
                  <dd>{user?.phone || "0909000001"}</dd>
                </div>
                <div>
                  <dt>Trạng thái</dt>
                  <dd className="status-active-text">
                    <span className="status-dot" aria-hidden="true" /> Đang hoạt động
                  </dd>
                </div>
                <div>
                  <dt>Cấp quyền</dt>
                  <dd>Toàn quyền hệ thống</dd>
                </div>
                <div>
                  <dt>Xác thực phiên</dt>
                  <dd>JWT Token (Đạt chuẩn)</dd>
                </div>
                <div>
                  <dt>Mã hóa dữ liệu</dt>
                  <dd>Bcrypt Salt 10</dd>
                </div>
                <div>
                  <dt>Phiên làm việc</dt>
                  <dd>Thiết bị hiện tại</dd>
                </div>
              </dl>
              <div className="admin-security-checklist">
                <div className="checklist-item">
                  <span className="check-icon">✓</span>
                  <span>Tài khoản đã xác thực thông tin định danh</span>
                </div>
                <div className="checklist-item">
                  <span className="check-icon">✓</span>
                  <span>Quyền kiểm duyệt tin đăng, diễn đàn & báo cáo</span>
                </div>
                <div className="checklist-item">
                  <span className="check-icon">✓</span>
                  <span>Mật khẩu được lưu trữ an toàn chống xâm nhập</span>
                </div>
              </div>
            </div>
          ) : (
            <dl className="account-summary-meta" style={{ marginTop: 16 }}>
              <div>
                <dt>Số điện thoại</dt>
                <dd>{user?.phone || "Chưa cập nhật"}</dd>
              </div>
              <div>
                <dt>Trạng thái</dt>
                <dd className="account-meta-status">
                  <span className="account-status-dot" aria-hidden="true" /> Đang hoạt động
                </dd>
              </div>
              <div>
                <dt>Phạm vi quyền</dt>
                <dd>{user?.role === "landlord" ? "Đăng & quản lý phòng" : "Tìm phòng & kết nối"}</dd>
              </div>
            </dl>
          )}
        </aside>

        {/* Right Column */}
        {isAdmin ? (
          /* Admin View: Stack both Profile and Password settings seamlessly */
          <div className="account-admin-main-stack">
            {/* Card 1: Account Information */}
            <section id="admin-profile-card" className="account-card account-card--admin">
              <div className="account-heading">
                <div className="account-heading-tag">
                  <Icon name="user" size={14} />
                  <span>Hồ sơ định danh</span>
                </div>
                <h1>Cài đặt thông tin tài khoản</h1>
                <p>Chỉnh sửa họ tên, số điện thoại liên hệ và ảnh đại diện hiển thị của bạn trên hệ thống.</p>
              </div>

              <form className="auth-form account-form" onSubmit={submitProfile} noValidate>
                <div className="account-form-grid">
                  <label className="form-field">
                    <span>
                      Họ và tên <b>*</b>
                    </span>
                    <input
                      value={name}
                      placeholder="Nhập họ và tên hiển thị"
                      autoComplete="name"
                      onChange={(event) => {
                        setName(event.target.value)
                        if (profileStatus !== "idle") setProfileStatus("idle")
                      }}
                    />
                    <small>Tên hiển thị trên hồ sơ và các hoạt động quản trị.</small>
                  </label>
                  <label className="form-field">
                    <span>
                      Số điện thoại <b>*</b>
                    </span>
                    <input
                      type="tel"
                      value={phone}
                      placeholder="Ví dụ: 0909000001"
                      autoComplete="tel"
                      onChange={(event) => {
                        setPhone(event.target.value)
                        if (profileStatus !== "idle") setProfileStatus("idle")
                      }}
                    />
                    <small>Số điện thoại dùng để liên hệ và xác thực.</small>
                  </label>
                </div>

                <label className="form-field account-field-readonly">
                  <span className="account-field-label-row">
                    <span>Email đăng nhập</span>
                    <span className="account-locked-tag">
                      <Icon name="lock" size={12} /> Cố định
                    </span>
                  </span>
                  <input value={user?.email ?? ""} disabled readOnly />
                  <small>
                    Email được dùng làm định danh tài khoản quản trị cố định nên hiện chưa thể thay đổi.
                  </small>
                </label>

                {profileStatus === "error" && (
                  <p className="form-message error" role="alert">
                    {profileError || "Vui lòng kiểm tra lại các trường bắt buộc."}
                  </p>
                )}
                {profileStatus === "success" && (
                  <p className="form-message success" role="status">
                    Cập nhật thông tin tài khoản thành công.
                  </p>
                )}

                <div className="account-form-actions">
                  <Button disabled={profileStatus === "loading" || uploadingAvatar}>
                    {profileStatus === "loading" ? "Đang lưu..." : "Lưu thay đổi"}
                  </Button>
                  {isProfileDirty && (
                    <>
                      <button
                        type="button"
                        className="account-reset-btn"
                        disabled={profileStatus === "loading"}
                        onClick={() => {
                          setName(user?.name ?? "")
                          setPhone(user?.phone ?? "")
                          setProfileStatus("idle")
                          setProfileError("")
                        }}
                      >
                        Khôi phục
                      </button>
                      <span className="account-dirty-hint">Có thay đổi chưa lưu</span>
                    </>
                  )}
                </div>
              </form>
            </section>

            {/* Card 2: Security & Password */}
            <section id="admin-security-card" className="account-card account-card--admin">
              <div className="account-heading">
                <div className="account-heading-tag">
                  <Icon name="lock" size={14} />
                  <span>Bảo vệ quyền truy cập</span>
                </div>
                <h1>Bảo mật & Đổi mật khẩu</h1>
                <p>Cập nhật mật khẩu định kỳ để bảo vệ quyền quản trị viên của bạn trên hệ thống.</p>
              </div>

              <form className="auth-form account-form" onSubmit={submitPassword} noValidate>
                <label className="form-field">
                  <span>
                    Mật khẩu hiện tại <b>*</b>
                  </span>
                  <input
                    type="password"
                    autoComplete="current-password"
                    placeholder="Nhập mật khẩu đang sử dụng"
                    value={currentPassword}
                    onChange={(event) => {
                      setCurrentPassword(event.target.value)
                      if (passwordStatus !== "idle") setPasswordStatus("idle")
                    }}
                  />
                </label>
                <div className="account-form-grid">
                  <label className="form-field">
                    <span>
                      Mật khẩu mới <b>*</b>
                    </span>
                    <div className="password-input">
                      <input
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        placeholder="Tối thiểu 8 ký tự"
                        value={newPassword}
                        onChange={(event) => {
                          setNewPassword(event.target.value)
                          if (passwordStatus !== "idle") setPasswordStatus("idle")
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((show) => !show)}
                        aria-label="Hiện hoặc ẩn mật khẩu"
                      >
                        <Icon name="eye" size={18} />
                      </button>
                    </div>
                    <small>Sử dụng ít nhất 8 ký tự, nên kết hợp chữ và số.</small>
                  </label>
                  <label className="form-field">
                    <span>
                      Xác nhận mật khẩu mới <b>*</b>
                    </span>
                    <input
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Nhập lại mật khẩu mới"
                      value={confirm}
                      onChange={(event) => {
                        setConfirm(event.target.value)
                        if (passwordStatus !== "idle") setPasswordStatus("idle")
                      }}
                    />
                    <small>Nhập lại chính xác mật khẩu mới vừa tạo.</small>
                  </label>
                </div>

                {passwordStatus === "error" && (
                  <p className="form-message error" role="alert">
                    {passwordError || "Vui lòng kiểm tra lại mật khẩu."}
                  </p>
                )}
                {passwordStatus === "success" && (
                  <p className="form-message success" role="status">
                    Đã cập nhật mật khẩu mới thành công.
                  </p>
                )}

                <div className="account-form-actions">
                  <Button disabled={passwordStatus === "loading"}>
                    {passwordStatus === "loading" ? "Đang cập nhật..." : "Cập nhật mật khẩu"}
                  </Button>
                </div>
              </form>
            </section>
          </div>
        ) : (
          /* Member View: Tabbed Layout */
          <section className="account-card">
            <nav className="account-tabs" aria-label="Phân mục cài đặt tài khoản">
              <NavLink
                to={profilePath}
                end
                className={({ isActive }) =>
                  `account-tab${isActive && !passwordMode ? " is-active" : ""}`
                }
              >
                <Icon name="user" size={16} />
                <span>Thông tin tài khoản</span>
              </NavLink>
              <NavLink
                to={passwordPath}
                end
                className={({ isActive }) =>
                  `account-tab${isActive || passwordMode ? " is-active" : ""}`
                }
              >
                <Icon name="lock" size={16} />
                <span>Đổi mật khẩu & bảo mật</span>
              </NavLink>
            </nav>

            <div className="account-heading">
              <h1>{passwordMode ? "Đổi mật khẩu đăng nhập" : "Cài đặt thông tin tài khoản"}</h1>
              <p>
                {passwordMode
                  ? "Cập nhật mật khẩu định kỳ để bảo vệ an toàn cho tài khoản của bạn trên hệ thống."
                  : "Chỉnh sửa họ tên, số điện thoại liên hệ và ảnh đại diện hiển thị của bạn trên hệ thống."}
              </p>
            </div>

            <form
              className="auth-form account-form"
              onSubmit={passwordMode ? submitPassword : submitProfile}
              noValidate
            >
              {!passwordMode ? (
                <>
                  <div className="account-form-grid">
                    <label className="form-field">
                      <span>
                        Họ và tên <b>*</b>
                      </span>
                      <input
                        value={name}
                        placeholder="Nhập họ và tên hiển thị"
                        autoComplete="name"
                        onChange={(event) => {
                          setName(event.target.value)
                          if (profileStatus !== "idle") setProfileStatus("idle")
                        }}
                      />
                      <small>Tên hiển thị trên hồ sơ và các hoạt động của bạn.</small>
                    </label>
                    <label className="form-field">
                      <span>
                        Số điện thoại <b>*</b>
                      </span>
                      <input
                        type="tel"
                        value={phone}
                        placeholder="Ví dụ: 0909000001"
                        autoComplete="tel"
                        onChange={(event) => {
                          setPhone(event.target.value)
                          if (profileStatus !== "idle") setProfileStatus("idle")
                        }}
                      />
                      <small>Số điện thoại dùng để liên hệ và xác thực.</small>
                    </label>
                  </div>

                  <label className="form-field account-field-readonly">
                    <span className="account-field-label-row">
                      <span>Email đăng nhập</span>
                      <span className="account-locked-tag">
                        <Icon name="lock" size={12} /> Cố định
                      </span>
                    </span>
                    <input value={user?.email ?? ""} disabled readOnly />
                    <small>
                      Email được dùng làm định danh tài khoản cố định nên hiện chưa thể thay đổi.
                    </small>
                  </label>
                </>
              ) : (
                <>
                  <label className="form-field">
                    <span>
                      Mật khẩu hiện tại <b>*</b>
                    </span>
                    <input
                      type="password"
                      autoComplete="current-password"
                      placeholder="Nhập mật khẩu đang sử dụng"
                      value={currentPassword}
                      onChange={(event) => {
                        setCurrentPassword(event.target.value)
                        if (passwordStatus !== "idle") setPasswordStatus("idle")
                      }}
                    />
                  </label>
                  <div className="account-form-grid">
                    <label className="form-field">
                      <span>
                        Mật khẩu mới <b>*</b>
                      </span>
                      <div className="password-input">
                        <input
                          type={showPassword ? "text" : "password"}
                          autoComplete="new-password"
                          placeholder="Tối thiểu 8 ký tự"
                          value={newPassword}
                          onChange={(event) => {
                            setNewPassword(event.target.value)
                            if (passwordStatus !== "idle") setPasswordStatus("idle")
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((show) => !show)}
                          aria-label="Hiện hoặc ẩn mật khẩu"
                        >
                          <Icon name="eye" size={18} />
                        </button>
                      </div>
                      <small>Sử dụng ít nhất 8 ký tự, nên kết hợp chữ và số.</small>
                    </label>
                    <label className="form-field">
                      <span>
                        Xác nhận mật khẩu mới <b>*</b>
                      </span>
                      <input
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        placeholder="Nhập lại mật khẩu mới"
                        value={confirm}
                        onChange={(event) => {
                          setConfirm(event.target.value)
                          if (passwordStatus !== "idle") setPasswordStatus("idle")
                        }}
                      />
                      <small>Nhập lại chính xác mật khẩu mới vừa tạo.</small>
                    </label>
                  </div>
                </>
              )}

              {(passwordMode ? passwordStatus : profileStatus) === "error" && (
                <p className="form-message error" role="alert">
                  {(passwordMode ? passwordError : profileError) || "Vui lòng kiểm tra lại các trường bắt buộc."}
                </p>
              )}
              {(passwordMode ? passwordStatus : profileStatus) === "success" && (
                <p className="form-message success" role="status">
                  {passwordMode
                    ? "Đã cập nhật mật khẩu mới thành công."
                    : "Cập nhật thông tin tài khoản thành công."}
                </p>
              )}

              <div className="account-form-actions">
                <Button disabled={(passwordMode ? passwordStatus : profileStatus) === "loading" || uploadingAvatar}>
                  {(passwordMode ? passwordStatus : profileStatus) === "loading"
                    ? "Đang lưu..."
                    : passwordMode
                      ? "Cập nhật mật khẩu"
                      : "Lưu thay đổi"}
                </Button>
                {!passwordMode && isProfileDirty && (
                  <>
                    <button
                      type="button"
                      className="account-reset-btn"
                      disabled={profileStatus === "loading"}
                      onClick={() => {
                        setName(user?.name ?? "")
                        setPhone(user?.phone ?? "")
                        setProfileStatus("idle")
                        setProfileError("")
                      }}
                    >
                      Khôi phục
                    </button>
                    <span className="account-dirty-hint">Có thay đổi chưa lưu</span>
                  </>
                )}
              </div>
            </form>

            {!passwordMode && shortcuts.length > 0 && (
              <section className="account-shortcuts">
                <div className="account-shortcuts-head">
                  <h3>Lối tắt theo vai trò</h3>
                  <p>Truy cập nhanh các tính năng thường dùng theo tài khoản của bạn.</p>
                </div>
                <div className="account-shortcuts-grid">
                  {shortcuts.map((item) => (
                    <Link className="favorites-shortcut" to={item.to} key={item.to}>
                      <span className="favorites-shortcut-icon">
                        <Icon name={item.icon} />
                      </span>
                      <span className="favorites-shortcut-copy">
                        <strong>{item.title}</strong>
                        <small>{item.detail}</small>
                      </span>
                      <Icon name="chevron" />
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </section>
        )}
      </div>

      {showAvatarModal && (
        <div className="avatar-modal-backdrop" onClick={() => setShowAvatarModal(false)}>
          <div
            className="avatar-modal"
            ref={avatarDialogRef}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="avatar-modal-title"
          >
            <div className="avatar-modal-header">
              <div>
                <h3 id="avatar-modal-title">Cập nhật ảnh đại diện</h3>
                <p>Tải ảnh từ thiết bị của bạn</p>
              </div>
              <button
                type="button"
                className="avatar-modal-close-btn"
                onClick={() => setShowAvatarModal(false)}
                aria-label="Đóng"
              >
                <Icon name="close" size={18} />
              </button>
            </div>

            <div className="avatar-modal-body">
              <div className="avatar-modal-current-wrap">
                <div className="avatar-modal-preview">
                  <span className="avatar xlarge account-avatar-display avatar-modal-img">
                    {avatarUrl ? (
                      <img className="user-avatar-image" src={avatarUrl} alt={user?.name ?? ""} />
                    ) : (
                      user?.initials
                    )}
                  </span>
                  {uploadingAvatar && (
                    <div className="avatar-modal-spinner" role="status">
                      <span className="upload-spinner" />
                    </div>
                  )}
                </div>
                {avatarUrl && (
                  <button
                    type="button"
                    className="avatar-modal-remove-link"
                    onClick={() => void handleRemoveAvatar()}
                    disabled={uploadingAvatar}
                  >
                    <Icon name="trash" size={13} /> Gỡ ảnh đại diện (dùng chữ cái mặc định)
                  </button>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                style={{ display: "none" }}
                onChange={(e) => void handleAvatarFileSelect(e.target.files)}
              />

              <div
                className={`avatar-modal-dropzone${uploadingAvatar ? " is-uploading" : ""}`}
                onClick={() => !uploadingAvatar && fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click()
                }}
              >
                <div className="avatar-modal-dropzone-icon">
                  <Icon name="upload" size={24} />
                </div>
                <div>
                  <strong>
                    {uploadingAvatar ? "Đang tải ảnh lên..." : "Tải ảnh mới từ thiết bị"}
                  </strong>
                  <small>Hỗ trợ định dạng JPG, PNG, WebP (tối đa 3 MB)</small>
                </div>
              </div>

              {avatarFeedback && (
                <p className={`form-message ${avatarFeedback.type} avatar-modal-feedback`} role="status">
                  {avatarFeedback.message}
                </p>
              )}
            </div>

            <div className="avatar-modal-footer">
              <button
                type="button"
                className="btn btn-outline avatar-modal-done-btn"
                onClick={() => setShowAvatarModal(false)}
              >
                Hoàn tất
              </button>
            </div>
          </div>
        </div>
      )}
    </RootTag>
  )
}
