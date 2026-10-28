import { useState, useRef, useEffect, type FormEvent } from "react"
import { Link } from "react-router"
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
  const myListings = listings.filter((item) => item.ownerId === user?.id)
  const currentRental = listings.find((item) => item.status === "rented" && item.currentTenantId === user?.id)
  const [name, setName] = useState(user?.name ?? "")
  const [phone, setPhone] = useState(user?.phone ?? "")
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(user?.avatarUrl)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [showAvatarModal, setShowAvatarModal] = useState(false)
  const [avatarFeedback, setAvatarFeedback] = useState<{ message: string; type: "success" | "error" } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const avatarDialogRef = useRef<HTMLDivElement>(null)
  useDialogFocus(avatarDialogRef, () => setShowAvatarModal(false), showAvatarModal)

  useEffect(() => {
    setName(user?.name ?? "")
    setPhone(user?.phone ?? "")
    setAvatarUrl(user?.avatarUrl)
  }, [user])

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [status, setStatus] =
    useState<"idle" | "loading" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState("")

  const handleAvatarFileSelect = async (files?: FileList | null) => {
    if (!files || !files[0]) return
    const file = files[0]
    if (!file.type.startsWith("image/")) {
      setAvatarFeedback({ message: "Vui lòng chỉ chọn tệp hình ảnh (JPG, PNG, WebP, AVIF).", type: "error" })
      return
    }
    const maxFileSize = isApiMode ? 3_000_000 : 1_000_000
    if (file.size > maxFileSize) {
      setAvatarFeedback({ message: isApiMode ? "Ảnh đại diện cần nhỏ hơn 3 MB." : "Ảnh cần nhỏ hơn 1 MB.", type: "error" })
      return
    }

    setUploadingAvatar(true)
    setAvatarFeedback(null)
    setErrorMessage("")
    try {
      let url: string
      if (isApiMode) {
        const body = new FormData()
        body.append("file", file)
        const result = await apiRequest<{ url: string }>("uploads/image", { method: "POST", body })
        url = result.url
      } else {
        url = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => (typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Không thể đọc ảnh.")))
          reader.onerror = () => reject(new Error("Lỗi khi đọc tệp ảnh."))
          reader.readAsDataURL(file)
        })
      }

      setAvatarUrl(url)
      if (user) {
        await updateUser({ ...user, avatarUrl: url })
      }
      setAvatarFeedback({ message: "Đã tải lên và cập nhật ảnh đại diện mới thành công!", type: "success" })
    } catch (caught) {
      setAvatarFeedback({ message: caught instanceof Error ? caught.message : "Không thể tải ảnh lên.", type: "error" })
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
        setAvatarFeedback({ message: "Đã gỡ ảnh đại diện, chuyển về chữ cái viết tắt mặc định.", type: "success" })
        window.setTimeout(() => setAvatarFeedback(null), 3000)
      } catch (caught) {
        setAvatarFeedback({ message: caught instanceof Error ? caught.message : "Lỗi khi gỡ ảnh.", type: "error" })
      }
    }
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (status === "loading" || uploadingAvatar) return
    setErrorMessage("")
    if (
      passwordMode
        ? !currentPassword || newPassword.length < 8 || newPassword !== confirm
        : !name.trim() || !phone.trim()
    ) {
      setStatus("error")
      return
    }
    setStatus("loading")
    try {
      if (passwordMode && user) {
        await authService.changePassword(user.id, currentPassword, newPassword)
      } else if (user) {
        const initials = name.trim().split(" ").slice(-2).map((part) => part[0]).join("").toUpperCase()
        await updateUser({
          ...user,
          name: name.trim(),
          phone: phone.trim(),
          initials,
          avatarUrl: avatarUrl || undefined,
        })
      }
      setStatus("success")
    } catch (caught) {
      setStatus("error")
      setErrorMessage(caught instanceof Error ? caught.message : "Không thể lưu thay đổi.")
    }
  }
  const shortcuts = user?.role === "renter"
    ? [
        ...(currentRental ? [{ to: `/phong/${currentRental.id}`, title: "Đánh giá phòng đang thuê", detail: currentRental.title, icon: "star" }] : []),
        { to: "/yeu-thich", title: "Tin yêu thích", detail: `${favoriteIds.length} phòng đã lưu`, icon: "heart" },
        { to: "/tin-nhan", title: "Tin nhắn", detail: "Trao đổi với chủ trọ và người thuê", icon: "chat" },
        { to: "/dien-dan", title: "Diễn đàn", detail: "Đọc và chia sẻ kinh nghiệm thuê trọ", icon: "users" },
        { to: "/bao-cao-cua-toi", title: "Báo cáo của tôi", detail: "Theo dõi nội dung đã gửi báo cáo", icon: "shield" },
      ]
    : user?.role === "landlord"
      ? [
          { to: "/chu-tro/quan-ly-tin", title: "Tin cho thuê của tôi", detail: `${myListings.length} tin đã đăng`, icon: "building" },
          { to: "/chu-tro/dang-tin", title: "Đăng tin cho thuê", detail: "Tạo tin mới để tìm người thuê", icon: "plus" },
          { to: "/chu-tro/thong-ke", title: "Hiệu quả tin đăng", detail: "Theo dõi lượt xem và liên hệ", icon: "chart" },
          { to: "/yeu-thich", title: "Tin yêu thích", detail: `${favoriteIds.length} phòng đã lưu`, icon: "heart" },
          { to: "/tin-nhan", title: "Tin nhắn", detail: "Trao đổi với người đang tìm phòng", icon: "chat" },
        ]
      : [
          { to: "/admin", title: "Tổng quan quản trị", detail: "Xem các việc cần xử lý", icon: "chart" },
          { to: "/admin/nguoi-dung", title: "Người dùng", detail: "Quản lý tài khoản và vai trò", icon: "users" },
          { to: "/admin/bao-cao", title: "Báo cáo vi phạm", detail: "Xem và xử lý báo cáo", icon: "shield" },
          { to: "/admin/thong-ke", title: "Thống kê", detail: "Xem và xuất báo cáo hệ thống", icon: "download" },
        ]
  return (
    <main className="page-bg account-page">
      <div className="container account-layout">
        <aside className="account-summary">
          <div
            className="account-avatar-wrapper"
            onClick={() => setShowAvatarModal(true)}
            role="button"
            tabIndex={0}
            title="Bấm để đổi ảnh đại diện"
            aria-label="Đổi ảnh đại diện"
            onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setShowAvatarModal(true) } }}
          >
            <span className="avatar xlarge account-avatar-display">
              {avatarUrl ? <img className="user-avatar-image" src={avatarUrl} alt="" /> : user?.initials}
            </span>
          </div>
          <h2>{user?.name}</h2>
          <p>{user?.email}</p>
          <div className="account-summary-badge-wrap">
            <span className="role-badge">
              {user?.role === "admin" ? "Quản trị viên" : user?.role === "landlord" ? "Chủ trọ" : "Người thuê"}
            </span>
          </div>
          <button
            type="button"
            className="account-edit-avatar-pill"
            onClick={() => setShowAvatarModal(true)}
          >
            <Icon name="camera" size={14} /> Đổi ảnh đại diện
          </button>

          <Link
            to="/trang-ca-nhan"
            className="account-view-profile-link"
            title="Xem giao diện trang cá nhân của bạn"
          >
            <Icon name="users" size={15} />
            <span>Xem trang cá nhân</span>
          </Link>
        </aside>
        <section className="account-card">
          <div className="account-heading">
            
            <h1>{passwordMode ? "Đổi mật khẩu" : "Cài đặt thông tin tài khoản"}</h1>
            <p>
              {passwordMode
                ? "Cập nhật mật khẩu định kỳ để bảo vệ tài khoản."
                : "Chỉnh sửa họ tên, số điện thoại và ảnh đại diện hiển thị của bạn trên hệ thống."}
            </p>
          </div>

          <form className="auth-form" onSubmit={submit} noValidate>
            {!passwordMode ? (
              <>
                <label className="form-field">
                  <span>
                    Họ và tên <b>*</b>
                  </span>
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                  />
                </label>
                <label className="form-field">
                  <span>Email</span>
                  <input value={user?.email ?? ""} disabled />
                  <small>Email đăng nhập hiện chưa thể thay đổi.</small>
                </label>
                <label className="form-field">
                  <span>
                    Số điện thoại <b>*</b>
                  </span>
                  <input
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                  />
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
                    value={currentPassword}
                    onChange={(event) => setCurrentPassword(event.target.value)}
                  />
                </label>
                <label className="form-field">
                  <span>
                    Mật khẩu mới <b>*</b>
                  </span>
                  <div className="password-input">
                    <input
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((show) => !show)}
                      aria-label="Hiện hoặc ẩn mật khẩu"
                    >
                      <Icon name="eye" size={18} />
                    </button>
                  </div>
                  <small>Tối thiểu 8 ký tự.</small>
                </label>
                <label className="form-field">
                  <span>
                    Xác nhận mật khẩu mới <b>*</b>
                  </span>
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={confirm}
                    onChange={(event) => setConfirm(event.target.value)}
                  />
                </label>
              </>
            )}
            {status === "error" && (
              <p className="form-message error" role="alert">
                {errorMessage || "Vui lòng kiểm tra lại các trường bắt buộc."}
              </p>
            )}
            {status === "success" && (
              <p className="form-message success" role="status">
                Cập nhật thông tin thành công.
              </p>
            )}
            <Button disabled={status === "loading"}>
              {status === "loading" ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </form>
          {!passwordMode && <section className="account-shortcuts"><span className="eyebrow">Lối tắt theo vai trò</span><div>{shortcuts.map((item) => <Link className="favorites-shortcut" to={item.to} key={item.to}><span className="favorites-shortcut-icon"><Icon name={item.icon}/></span><span><strong>{item.title}</strong><small>{item.detail}</small></span><Icon name="chevron"/></Link>)}</div></section>}
        </section>
      </div>

      {showAvatarModal && (
        <div className="avatar-modal-backdrop" onClick={() => setShowAvatarModal(false)}>
          <div className="avatar-modal" ref={avatarDialogRef} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="avatar-modal-title">
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
                    {avatarUrl ? <img className="user-avatar-image" src={avatarUrl} alt={user?.name ?? ""} /> : user?.initials}
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
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click() }}
              >
                <div className="avatar-modal-dropzone-icon">
                  <Icon name="upload" size={24} />
                </div>
                <div>
                  <strong>{uploadingAvatar ? "Đang tải ảnh lên..." : "Tải ảnh mới từ thiết bị"}</strong>
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
    </main>
  )
}
