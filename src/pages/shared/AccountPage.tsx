import { useState, useRef, useEffect, type FormEvent, type ReactNode } from "react"
import { Link, NavLink, useLocation } from "react-router"
import { Button, Icon } from "@/components/common/legacy"
import useAuth from "@/hooks/useAuth"
import useDialogFocus from "@/hooks/useDialogFocus"
import { authService } from "@/services/authService"
import { useFavorites } from "@/contexts/FavoritesContext"
import { usePlatform } from "@/contexts/PlatformContext"
import { apiRequest, isApiMode } from "@/services/apiClient"

type ExpandableSection = "name" | "phone" | "password"

type ProfileIconName =
  | "camera"
  | "user"
  | "phone"
  | "mail"
  | "lock"
  | "chevronDown"
  | "chevronUp"
  | "eye"
  | "eyeOff"
  | "check"

/** Crisp vector icon helper aligned to Slate & Emerald UI sizing. */
function ProfileIcon({
  name,
  className = "w-4 h-4",
}: {
  name: ProfileIconName
  className?: string
}) {
  const paths: Record<ProfileIconName, ReactNode> = {
    camera: (
      <>
        <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
        <circle cx="12" cy="13" r="3" />
      </>
    ),
    user: (
      <>
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </>
    ),
    phone: (
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    ),
    mail: (
      <>
        <rect width="20" height="16" x="2" y="4" rx="2" />
        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
      </>
    ),
    lock: (
      <>
        <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </>
    ),
    chevronDown: <path d="m6 9 6 6 6-6" />,
    chevronUp: <path d="m18 15-6-6-6 6" />,
    eye: (
      <>
        <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ),
    eyeOff: (
      <>
        <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
        <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
        <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
        <line x1="2" x2="22" y1="2" y2="22" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
  }

  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  )
}

const ROW_ACTION_BASE_CLASS =
  "w-full sm:w-40 h-9 px-3 rounded-lg inline-flex items-center justify-center gap-1.5 text-xs font-semibold transition-colors whitespace-nowrap"

/** Shared 3-column Google-Account-inspired row inside the unified Admin card. */
function ExpandableRowCard({
  icon,
  title,
  description,
  value,
  isOpen = false,
  onToggle,
  onRowClick,
  closedActionLabel = "Chỉnh sửa",
  rightStaticNode,
  panelId,
  children,
}: {
  icon: "camera" | "user" | "phone" | "mail" | "lock"
  title: string
  description: string
  value: ReactNode
  isOpen?: boolean
  onToggle?: () => void
  onRowClick?: () => void
  closedActionLabel?: string
  rightStaticNode?: ReactNode
  panelId?: string
  children?: ReactNode
}) {
  const rowHandler = onToggle ?? onRowClick

  return (
    <section className="bg-white transition-colors">
      <div
        className={`grid grid-cols-[1fr_auto] sm:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)_160px] items-center px-6 sm:px-8 py-5 gap-y-3 gap-x-4 sm:gap-x-10 lg:gap-x-14${
          rowHandler ? " cursor-pointer hover:bg-slate-50/70 transition-colors" : ""
        }`}
        onClick={
          rowHandler
            ? (event) => {
                if (!(event.target as HTMLElement).closest("button")) {
                  rowHandler()
                }
              }
            : undefined
        }
      >
        <div className="col-span-2 sm:col-span-1 flex items-center gap-3.5 min-w-0">
          <span
            className="w-9 h-9 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center shrink-0"
            aria-hidden="true"
          >
            <ProfileIcon name={icon} className="w-4 h-4" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-900">{title}</p>
            <p className="text-xs text-slate-500">{description}</p>
          </div>
        </div>

        <div className="min-w-0">{value}</div>

        <div className="flex justify-end">
          {rightStaticNode ?? (
            <button
              type="button"
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={(event) => {
                event.stopPropagation()
                onToggle?.()
              }}
              className={`${ROW_ACTION_BASE_CLASS} border cursor-pointer ${
                isOpen
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              <span>{isOpen ? "Đang mở" : closedActionLabel}</span>
              <ProfileIcon
                name={isOpen ? "chevronUp" : "chevronDown"}
                className="w-3.5 h-3.5"
              />
            </button>
          )}
        </div>
      </div>

      {isOpen && children && (
        <div id={panelId} className="border-t border-slate-200 bg-slate-50/70 px-6 sm:px-8 py-4">
          {children}
        </div>
      )}
    </section>
  )
}

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

  // Admin Expandable Row State
  const [expandedSection, setExpandedSection] = useState<ExpandableSection | null>(
    passwordMode ? "password" : null,
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
    setExpandedSection(passwordMode ? "password" : null)
  }, [passwordMode])

  const toggleSection = (target: ExpandableSection) => {
    setExpandedSection((prev) => {
      const next = prev === target ? null : target
      if (prev === "name" && next !== "name") {
        setName(user?.name ?? "")
      }
      if (prev === "phone" && next !== "phone") {
        setPhone(user?.phone ?? "")
      }
      if (prev === "password" && next !== "password") {
        setCurrentPassword("")
        setNewPassword("")
        setConfirm("")
        setShowPassword(false)
      }
      setProfileError("")
      setPasswordError("")
      if (profileStatus === "error") setProfileStatus("idle")
      if (passwordStatus === "error") setPasswordStatus("idle")
      return next
    })
  }

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
      if (isAdmin) setExpandedSection(null)
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
        setShowPassword(false)
      }
      setPasswordStatus("success")
      if (isAdmin) setExpandedSection(null)
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

  const avatarModalNode = showAvatarModal ? (
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
                <img
                  className="user-avatar-image"
                  src={avatarUrl || "/images/avatars/default-brand-avatar.png"}
                  alt={user?.name ?? ""}
                />
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
  ) : null

  if (isAdmin) {
    return (
      <div className="saas-admin-profile-page px-4 pt-2 pb-10 sm:px-6 sm:pt-3 sm:pb-12 bg-slate-50">
        <div className="max-w-[1060px] mx-auto w-full space-y-5">
          <header>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {passwordMode ? "Đổi mật khẩu" : "Hồ sơ & Bảo mật"}
            </h1>
          </header>

          {(profileStatus === "success" || passwordStatus === "success") && (
            <div
              className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-medium text-emerald-800"
              role="status"
            >
              <ProfileIcon name="check" className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                {passwordStatus === "success"
                  ? "Đã cập nhật mật khẩu mới thành công."
                  : "Cập nhật thông tin tài khoản thành công."}
              </span>
            </div>
          )}

          {/* Thẻ hợp nhất trung tâm theo phong cách Thông tin cá nhân của Google */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden divide-y divide-slate-200">
            {/* DÒNG 1: Ảnh đại diện */}
            <ExpandableRowCard
              icon="camera"
              title="Ảnh đại diện"
              description="Ảnh hiển thị trên thanh điều hướng và hoạt động quản trị"
              onRowClick={() => setShowAvatarModal(true)}
              value={
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={avatarUrl || "/images/avatars/default-brand-avatar.png"}
                    alt={user?.name || "Quản trị viên"}
                    onError={(event) => {
                      event.currentTarget.onerror = null
                      event.currentTarget.src = "/images/avatars/default-brand-avatar.png"
                    }}
                    className="w-11 h-11 rounded-full object-cover border border-slate-200 shrink-0 bg-slate-100"
                  />
                  <span className="text-xs text-slate-500 leading-snug">
                    JPG, PNG, WebP (tối đa 3 MB)
                  </span>
                </div>
              }
              rightStaticNode={
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation()
                    setShowAvatarModal(true)
                  }}
                  className={`${ROW_ACTION_BASE_CLASS} border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 cursor-pointer`}
                >
                  <ProfileIcon name="camera" className="w-3.5 h-3.5 text-slate-500" />
                  <span>Đổi ảnh đại diện</span>
                </button>
              }
            />

            {/* DÒNG 2: Họ và tên */}
            <ExpandableRowCard
              icon="user"
              title="Họ và tên"
              description="Tên hiển thị trên hồ sơ và hoạt động quản trị"
              value={
                <span className="text-sm font-bold text-slate-900">
                  {user?.name || "Chưa cập nhật"}
                </span>
              }
              isOpen={expandedSection === "name"}
              onToggle={() => toggleSection("name")}
              panelId="admin-profile-name-panel"
            >
              <form onSubmit={submitProfile} noValidate>
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div className="flex-1 min-w-[240px]">
                    <label
                      htmlFor="admin-name-input"
                      className="block text-xs font-semibold text-slate-700 mb-1.5"
                    >
                      Họ và tên hiển thị <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="admin-name-input"
                      value={name}
                      placeholder="Nhập họ và tên hiển thị"
                      autoComplete="name"
                      onChange={(event) => {
                        setName(event.target.value)
                        if (profileStatus !== "idle") setProfileStatus("idle")
                      }}
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      disabled={profileStatus === "loading"}
                      onClick={() => {
                        setName(user?.name ?? "")
                        setProfileStatus("idle")
                        setProfileError("")
                        setExpandedSection(null)
                      }}
                      className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      disabled={profileStatus === "loading" || uploadingAvatar}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {profileStatus === "loading" ? "Đang lưu..." : "Lưu thay đổi"}
                    </button>
                  </div>
                </div>
                {profileStatus === "error" && (
                  <p className="mt-2.5 text-xs font-medium text-rose-600" role="alert">
                    {profileError || "Vui lòng kiểm tra lại các trường bắt buộc."}
                  </p>
                )}
              </form>
            </ExpandableRowCard>

            {/* DÒNG 3: Số điện thoại */}
            <ExpandableRowCard
              icon="phone"
              title="Số điện thoại"
              description="Số điện thoại dùng để liên hệ và xác thực"
              value={
                <span className="text-sm font-bold text-slate-900">
                  {user?.phone || "Chưa cập nhật"}
                </span>
              }
              isOpen={expandedSection === "phone"}
              onToggle={() => toggleSection("phone")}
              panelId="admin-profile-phone-panel"
            >
              <form onSubmit={submitProfile} noValidate>
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div className="flex-1 min-w-[240px]">
                    <label
                      htmlFor="admin-phone-input"
                      className="block text-xs font-semibold text-slate-700 mb-1.5"
                    >
                      Số điện thoại liên hệ <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="admin-phone-input"
                      type="tel"
                      value={phone}
                      placeholder="Ví dụ: 0909000001"
                      autoComplete="tel"
                      onChange={(event) => {
                        setPhone(event.target.value)
                        if (profileStatus !== "idle") setProfileStatus("idle")
                      }}
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      disabled={profileStatus === "loading"}
                      onClick={() => {
                        setPhone(user?.phone ?? "")
                        setProfileStatus("idle")
                        setProfileError("")
                        setExpandedSection(null)
                      }}
                      className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      disabled={profileStatus === "loading" || uploadingAvatar}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {profileStatus === "loading" ? "Đang lưu..." : "Lưu thay đổi"}
                    </button>
                  </div>
                </div>
                {profileStatus === "error" && (
                  <p className="mt-2.5 text-xs font-medium text-rose-600" role="alert">
                    {profileError || "Vui lòng kiểm tra lại các trường bắt buộc."}
                  </p>
                )}
              </form>
            </ExpandableRowCard>

            {/* DÒNG 4: Email đăng nhập (Trường cố định - Không sổ form) */}
            <ExpandableRowCard
              icon="mail"
              title="Email đăng nhập"
              description="Email định danh tài khoản quản trị cố định"
              value={
                <span className="text-sm font-bold text-slate-900 break-all">
                  {user?.email ?? ""}
                </span>
              }
              rightStaticNode={
                <span
                  className={`${ROW_ACTION_BASE_CLASS} bg-slate-100 border border-slate-200 font-medium text-slate-500`}
                >
                  <ProfileIcon name="lock" className="w-3 h-3" />
                  <span>Cố định</span>
                </span>
              }
            />

            {/* DÒNG 5: Bảo mật & Đổi mật khẩu */}
            <ExpandableRowCard
              icon="lock"
              title="Bảo mật & Đổi mật khẩu"
              description="Cập nhật mật khẩu định kỳ để bảo vệ tài khoản"
              value={
                <span className="text-sm font-bold tracking-widest text-slate-800">
                  ••••••••••••
                </span>
              }
              isOpen={expandedSection === "password"}
              onToggle={() => toggleSection("password")}
              closedActionLabel="Đổi mật khẩu"
              panelId="admin-profile-password-panel"
            >
              <form onSubmit={submitPassword} noValidate>
                <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_auto] items-end gap-3">
                  <div>
                    <label
                      htmlFor="admin-current-password-input"
                      className="block text-xs font-semibold text-slate-700 mb-1.5"
                    >
                      Mật khẩu hiện tại <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="admin-current-password-input"
                      type="password"
                      autoComplete="current-password"
                      placeholder="Nhập mật khẩu hiện tại"
                      value={currentPassword}
                      onChange={(event) => {
                        setCurrentPassword(event.target.value)
                        if (passwordStatus !== "idle") setPasswordStatus("idle")
                      }}
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="admin-new-password-input"
                      className="block text-xs font-semibold text-slate-700 mb-1.5"
                    >
                      Mật khẩu mới <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        id="admin-new-password-input"
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        placeholder="Tối thiểu 8 ký tự"
                        value={newPassword}
                        onChange={(event) => {
                          setNewPassword(event.target.value)
                          if (passwordStatus !== "idle") setPasswordStatus("idle")
                        }}
                        className="w-full pl-3.5 pr-9 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((show) => !show)}
                        aria-label="Hiện hoặc ẩn mật khẩu"
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        <ProfileIcon name={showPassword ? "eyeOff" : "eye"} className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="admin-confirm-password-input"
                      className="block text-xs font-semibold text-slate-700 mb-1.5"
                    >
                      Xác nhận mật khẩu mới <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="admin-confirm-password-input"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Nhập lại mật khẩu mới"
                      value={confirm}
                      onChange={(event) => {
                        setConfirm(event.target.value)
                        if (passwordStatus !== "idle") setPasswordStatus("idle")
                      }}
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-none"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={passwordStatus === "loading"}
                      className="w-full md:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow-2xs transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap"
                    >
                      {passwordStatus === "loading" ? "Đang cập nhật..." : "Cập nhật mật khẩu"}
                    </button>
                  </div>
                </div>

                {passwordStatus === "error" && (
                  <p className="mt-3 text-xs font-medium text-rose-600" role="alert">
                    {passwordError || "Vui lòng kiểm tra lại mật khẩu."}
                  </p>
                )}
              </form>
            </ExpandableRowCard>
          </div>
        </div>

        {avatarModalNode}
      </div>
    )
  }

  return (
    <main className="page-bg account-page">
      <div className="container account-layout">
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
              <img className="user-avatar-image" src={avatarUrl || "/images/avatars/default-brand-avatar.png"} alt="" />
            </span>
            <span className="account-avatar-camera-badge" aria-hidden="true">
              <Icon name="camera" size={14} />
            </span>
          </div>
          <h2>{user?.name}</h2>
          <p>{user?.email}</p>
          <div className="account-summary-badge-wrap">
            <span className="role-badge">
              {user?.role === "landlord" ? "Chủ trọ" : "Người thuê"}
            </span>
          </div>

          <button
            type="button"
            className="account-edit-avatar-pill"
            onClick={() => setShowAvatarModal(true)}
          >
            <Icon name="camera" size={14} /> Đổi ảnh đại diện
          </button>

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
        </aside>

        {/* Right Column: Member View Tabbed Layout */}
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
      </div>

      {avatarModalNode}
    </main>
  )
}
