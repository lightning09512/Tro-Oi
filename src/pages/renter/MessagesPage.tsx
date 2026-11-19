import ReportDialog from "@/components/common/ReportDialog"
import useDialogFocus from "@/hooks/useDialogFocus"
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react"
import { useSearchParams, useNavigate, Link } from "react-router"
import { Button, Icon } from "@/components/common/legacy"
import { usePlatform } from "@/contexts/PlatformContext"
import { useToast } from "@/contexts/ToastContext"
import useAuth from "@/hooks/useAuth"
import { io } from "socket.io-client"
import { getAccessToken, isApiMode, apiRequest } from "@/services/apiClient"

function PersonAvatar({
  initials,
  avatarUrl,
  active = false,
  className = "",
}: {
  initials: string
  avatarUrl?: string
  active?: boolean
  className?: string
}) {
  return (
    <span className={`avatar ${className}`.trim()}>
      <img
        className="user-avatar-image"
        src={avatarUrl || "/images/avatars/default-brand-avatar.png"}
        alt=""
        onError={(e) => {
          e.currentTarget.onerror = null
          e.currentTarget.src = "/images/avatars/default-brand-avatar.png"
        }}
      />
      {active && <i />}
    </span>
  )
}

interface FriendUser {
  id: string
  name: string
  initials: string
  avatarUrl?: string
  phone?: string
  role?: string
}

export default function MessagesPage() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const { user } = useAuth()
  const { toast } = useToast()
  const { messages, listings, users, reviews, sendMessage, startConversation, markConversationRead, toggleConversationMute, refreshMessages } = usePlatform()
  const [search, setSearch] = useState("")
  const [filterTab, setFilterTab] = useState<"all" | "unread" | "spam">("all")
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const [friends, setFriends] = useState<FriendUser[]>([])
  const [, setLoadingFriends] = useState(false)
  const [mobileChat, setMobileChat] = useState(false)
  const [message, setMessage] = useState("")
  const [messageError, setMessageError] = useState("")
  const [sending, setSending] = useState(false)
  const [scheduling, setScheduling] = useState(false)
  const [selectContact, setSelectContact] = useState(false)
  const [contactError, setContactError] = useState("")
  const [startingContactId, setStartingContactId] = useState<string | null>(null)
  const [phoneQuery, setPhoneQuery] = useState("")
  const [phoneSearching, setPhoneSearching] = useState(false)
  const [phoneResults, setPhoneResults] = useState<Array<{ id: string; name: string; initials: string; avatarUrl?: string; phone: string; role: string }>>([])
  const [phoneSearched, setPhoneSearched] = useState(false)
  const [showDetails, setShowDetails] = useState(true)
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false)
  const [scheduleDate, setScheduleDate] = useState("Ngày mai")
  const [scheduleTime, setScheduleTime] = useState("17:30")
  const [scheduleNote, setScheduleNote] = useState("")
  const [reportModalOpen, setReportModalOpen] = useState(false)

  const scheduleDialogRef = useRef<HTMLElement>(null)
  const contactDialogRef = useRef<HTMLElement>(null)
  useDialogFocus(scheduleDialogRef, () => setScheduleModalOpen(false), scheduleModalOpen)
  useDialogFocus(contactDialogRef, () => setSelectContact(false), selectContact)

  // Zalo-Style Attachments & Interactive Features
  const imageInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const toolbarEmojiRef = useRef<HTMLDivElement>(null)
  const toolbarQuickReplyRef = useRef<HTMLDivElement>(null)

  interface StagedAttachment {
    file?: File
    previewUrl: string
    type: "image" | "file" | "sticker" | "qr_deposit"
    fileName: string
    fileSize: string
  }

  const [stagedAttachment, setStagedAttachment] = useState<StagedAttachment | null>(null)
  const [uploadingAttachment, setUploadingAttachment] = useState(false)
  const [zoomImageUrl, setZoomImageUrl] = useState<string | null>(null)
  const [emojiOpen, setEmojiOpen] = useState(false)
  const [quickReplyOpen, setQuickReplyOpen] = useState(false)
  const [qrModalOpen, setQrModalOpen] = useState(false)
  const [searchInChat, setSearchInChat] = useState(false)
  const [inChatQuery, setInChatQuery] = useState("")
  const [callingState, setCallingState] = useState<{ type: "voice" | "video"; open: boolean } | null>(null)

  // VietQR deposit state (matches the MB VietQR card from reference)
  const [qrAmount, setQrAmount] = useState<number>(500000)
  const [qrBank, setQrBank] = useState<string>("MB")
  const [qrAccountNo, setQrAccountNo] = useState<string>("0395990338")
  const [qrAccountName, setQrAccountName] = useState<string>("PHAM MINH KHANH")
  const [qrNote, setQrNote] = useState<string>("TroOi Coc Phong")

  // Close 3-dots menu when clicking outside
  useEffect(() => {
    if (!menuOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [menuOpen])

  // Close emoji & quick reply popover when clicking outside
  useEffect(() => {
    if (!emojiOpen && !quickReplyOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (toolbarEmojiRef.current && !toolbarEmojiRef.current.contains(e.target as Node)) {
        setEmojiOpen(false)
      }
      if (toolbarQuickReplyRef.current && !toolbarQuickReplyRef.current.contains(e.target as Node)) {
        setQuickReplyOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [emojiOpen, quickReplyOpen])

  // Load friends from API or fallback to mock
  useEffect(() => {
    if (!user) return
    let active = true
    const loadFriends = async () => {
      setLoadingFriends(true)
      try {
        if (isApiMode) {
          const res = await apiRequest<{ items: FriendUser[] }>("friends")
          if (active) setFriends(res.items || [])
        } else {
          const otherUsers = users.filter((u) => u.id !== user.id && u.status === "active" && u.role !== "admin")
          if (active) {
            setFriends(
              otherUsers.slice(0, 3).map((u) => ({
                id: u.id,
                name: u.name,
                initials: u.initials,
                avatarUrl: u.avatarUrl,
                phone: u.phone,
                role: u.role,
              }))
            )
          }
        }
      } catch {
        if (active) {
          const otherUsers = users.filter((u) => u.id !== user.id && u.status === "active" && u.role !== "admin")
          setFriends(
            otherUsers.slice(0, 3).map((u) => ({
              id: u.id,
              name: u.name,
              initials: u.initials,
              avatarUrl: u.avatarUrl,
              phone: u.phone,
              role: u.role,
            }))
          )
        }
      } finally {
        if (active) setLoadingFriends(false)
      }
    }
    void loadFriends()
    return () => {
      active = false
    }
  }, [user, users])

  const selectedId = params.get("conversation") ?? ""
  const accountMessages = useMemo(() => messages.filter((item) => item.accountId === user?.id), [messages, user?.id])

  // Friends who do not yet have an active conversation
  const friendsWithoutConversation = useMemo(() => {
    return friends.filter((f) => !accountMessages.some((m) => m.userId === f.id))
  }, [friends, accountMessages])

  // Compute conversation & friend items for Chat sidebar
  const conversationItems = useMemo(() => {
    let list: Array<{
      id: string
      conversationId?: string
      userId: string
      name: string
      avatar: string
      avatarUrl?: string
      active?: boolean
      text: string
      time: string
      unread?: boolean
      phone?: string
      isFriend?: boolean
      friendData?: FriendUser
    }> = []

    if (filterTab === "all") {
      // 1. Existing conversations
      const convList = accountMessages.map((item) => ({
        id: item.id,
        conversationId: item.id,
        userId: item.userId,
        name: item.name,
        avatar: item.avatar,
        avatarUrl: item.avatarUrl ?? users.find((member) => member.id === item.userId)?.avatarUrl,
        active: item.active,
        text: item.text,
        time: item.time,
        unread: item.unread,
        phone: users.find((m) => m.id === item.userId)?.phone,
        isFriend: friends.some((f) => f.id === item.userId),
      }))

      // 2. Friends who do not have an existing conversation yet (ready to message)
      const friendList = friendsWithoutConversation.map((f) => ({
        id: `friend-${f.id}`,
        userId: f.id,
        name: f.name,
        avatar: f.initials,
        avatarUrl: f.avatarUrl ?? users.find((member) => member.id === f.id)?.avatarUrl,
        active: true,
        text: "Bạn bè · Nhấn để trò chuyện",
        time: "Bạn bè",
        unread: false,
        phone: f.phone,
        isFriend: true,
        friendData: f,
      }))

      list = [...convList, ...friendList]
    } else if (filterTab === "unread") {
      list = accountMessages
        .filter((item) => item.unread)
        .map((item) => ({
          id: item.id,
          conversationId: item.id,
          userId: item.userId,
          name: item.name,
          avatar: item.avatar,
          avatarUrl: item.avatarUrl ?? users.find((member) => member.id === item.userId)?.avatarUrl,
          active: item.active,
          text: item.text,
          time: item.time,
          unread: item.unread,
          phone: users.find((m) => m.id === item.userId)?.phone,
          isFriend: friends.some((f) => f.id === item.userId),
        }))
    } else if (filterTab === "spam") {
      list = accountMessages
        .filter((item) => item.muted)
        .map((item) => ({
          id: item.id,
          conversationId: item.id,
          userId: item.userId,
          name: item.name,
          avatar: item.avatar,
          avatarUrl: item.avatarUrl ?? users.find((member) => member.id === item.userId)?.avatarUrl,
          active: item.active,
          text: item.text,
          time: item.time,
          unread: item.unread,
          phone: users.find((m) => m.id === item.userId)?.phone,
          isFriend: friends.some((f) => f.id === item.userId),
        }))
    }

    // Filter by search when >= 3 characters (or if search has text)
    if (!search.trim() || search.trim().length < 3) return list
    const q = search.trim().toLowerCase()
    return list.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.text.toLowerCase().includes(q) ||
        (item.phone && item.phone.toLowerCase().includes(q))
    )
  }, [filterTab, accountMessages, friends, friendsWithoutConversation, users, search])

  const selected = accountMessages.find((item) => item.id === selectedId) ?? (selectedId ? undefined : accountMessages[0])
  const relatedRoom = listings.find((item) => item.id === selected?.roomId)
  const selectedContact = users.find((item) => item.id === selected?.userId)
  const availableContacts = users.filter((item) => item.status === "active" && item.id !== user?.id && item.role !== "admin")

  const displayedMessages = useMemo(() => {
    if (!selected) return []
    if (!searchInChat || !inChatQuery.trim()) return selected.messages
    const q = inChatQuery.trim().toLowerCase()
    return selected.messages.filter(
      (m) =>
        (m.text && m.text.toLowerCase().includes(q)) ||
        (m.fileName && m.fileName.toLowerCase().includes(q))
    )
  }, [selected, searchInChat, inChatQuery])

  const isPassRoom = relatedRoom?.type === "Chuyển nhượng"
  const contactListings = useMemo(() => listings.filter((l) => l.ownerId === selectedContact?.id && l.status === "active"), [listings, selectedContact?.id])
  const roomReviews = useMemo(() => (relatedRoom ? reviews.filter((r) => r.listingId === relatedRoom.id) : []), [reviews, relatedRoom])
  const averageRating = roomReviews.length ? roomReviews.reduce((sum, r) => sum + r.stars, 0) / roomReviews.length : 0
  const contactPhone = selectedContact?.phone || relatedRoom?.phone || ""
  const galleryPhotos = useMemo(() => (relatedRoom ? [...new Set([relatedRoom.image, ...(relatedRoom.gallery ?? [])])] : []), [relatedRoom])

  useEffect(() => {
    if (!selected || selected.id === selectedId) return
    setParams((current) => ({ ...Object.fromEntries(current), conversation: selected.id }), { replace: true })
  }, [selected?.id, selectedId, setParams])

  useEffect(() => {
    if (selected && user) void markConversationRead(selected.id, user.id).catch(() => {})
  }, [selected?.id, user?.id])

  useEffect(() => {
    const token = getAccessToken()
    if (!isApiMode || !token || !selected?.id) return
    const socket = io({ auth: { token }, transports: ["websocket", "polling"] })
    const join = () => socket.emit("conversation:join", selected.id)
    socket.on("connect", join)
    socket.on("message:new", () => { void refreshMessages().catch((error) => setMessageError(error instanceof Error ? error.message : "Không thể cập nhật tin nhắn mới.")) })
    if (socket.connected) join()
    return () => {
      socket.emit("conversation:leave", selected.id)
      socket.disconnect()
    }
  }, [selected?.id, refreshMessages])

  const changeMute = async () => {
    if (!selected || !user) return
    try {
      await toggleConversationMute(selected.id, user.id)
      toast(selected.muted ? "Đã bật thông báo cuộc trò chuyện." : "Đã tắt thông báo cuộc trò chuyện.", "info")
    } catch (error) { setMessageError(error instanceof Error ? error.message : "Không thể đổi thông báo.") }
  }
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const getFileTypeBadge = (fileName: string) => {
    const ext = (fileName.split(".").pop() || "").toLowerCase()
    if (["pdf"].includes(ext)) return { ext: "PDF", class: "pdf" }
    if (["doc", "docx"].includes(ext)) return { ext: "DOC", class: "word" }
    if (["xls", "xlsx", "csv"].includes(ext)) return { ext: "XLS", class: "excel" }
    if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) return { ext: "ZIP", class: "zip" }
    return { ext: ext.toUpperCase() || "FILE", class: "generic" }
  }

  const uploadFileAttachment = async (file: File): Promise<{ url: string; fileName: string; fileSize: string; type: "image" | "file" }> => {
    const isImage = file.type.startsWith("image/")
    const formattedSize = formatFileSize(file.size)

    if (isApiMode) {
      try {
        const formData = new FormData()
        formData.append("file", file)
        const res = await apiRequest<{ url: string; fileName?: string; fileSize?: string; fileType?: string }>(
          isImage ? "uploads/image" : "uploads/file",
          {
            method: "POST",
            body: formData,
          }
        )
        return {
          url: res.url,
          fileName: res.fileName || file.name,
          fileSize: res.fileSize || formattedSize,
          type: isImage ? "image" : "file",
        }
      } catch (e) {
        console.warn("API file upload failed, falling back to local base64/url:", e)
      }
    }

    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = () => {
        resolve({
          url: reader.result as string,
          fileName: file.name,
          fileSize: formattedSize,
          type: isImage ? "image" : "file",
        })
      }
      reader.onerror = () => {
        resolve({
          url: URL.createObjectURL(file),
          fileName: file.name,
          fileSize: formattedSize,
          type: isImage ? "image" : "file",
        })
      }
      reader.readAsDataURL(file)
    })
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 15 * 1024 * 1024) {
      toast("Kích thước ảnh tối đa là 15MB.", "error")
      return
    }
    const previewUrl = URL.createObjectURL(file)
    setStagedAttachment({
      file,
      previewUrl,
      type: "image",
      fileName: file.name,
      fileSize: formatFileSize(file.size),
    })
    e.target.value = ""
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 20 * 1024 * 1024) {
      toast("Kích thước tệp tối đa là 20MB.", "error")
      return
    }
    const previewUrl = URL.createObjectURL(file)
    setStagedAttachment({
      file,
      previewUrl,
      type: "file",
      fileName: file.name,
      fileSize: formatFileSize(file.size),
    })
    e.target.value = ""
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!selected || !user || sending || uploadingAttachment) return
    const text = message.trim()
    if (!text && !stagedAttachment) return

    setSending(true)
    setMessageError("")
    try {
      let attachmentPayload: { type: "image" | "file" | "sticker" | "qr_deposit"; fileUrl: string; fileName: string; fileSize: string } | undefined

      if (stagedAttachment) {
        if (stagedAttachment.file) {
          setUploadingAttachment(true)
          const uploaded = await uploadFileAttachment(stagedAttachment.file)
          attachmentPayload = {
            type: uploaded.type,
            fileUrl: uploaded.url,
            fileName: uploaded.fileName,
            fileSize: uploaded.fileSize,
          }
        } else {
          attachmentPayload = {
            type: stagedAttachment.type,
            fileUrl: stagedAttachment.previewUrl,
            fileName: stagedAttachment.fileName,
            fileSize: stagedAttachment.fileSize,
          }
        }
      }

      await sendMessage(selected.id, user.id, text, attachmentPayload)
      setMessage("")
      setStagedAttachment(null)
      setEmojiOpen(false)
      setQuickReplyOpen(false)
      setMobileChat(true)
    } catch (error) {
      setMessageError(error instanceof Error ? error.message : "Không gửi được tin nhắn.")
    } finally {
      setSending(false)
      setUploadingAttachment(false)
    }
  }

  const sendQuickLike = async () => {
    if (!selected || !user || sending) return
    setSending(true)
    try {
      await sendMessage(selected.id, user.id, "👍", { type: "sticker" })
      setMobileChat(true)
    } catch {
      toast("Không thể gửi nút thích, vui lòng thử lại.", "error")
    } finally {
      setSending(false)
    }
  }

  const shareRoomCard = async () => {
    if (!selected || !user || !relatedRoom) return
    const text = `[THÔNG TIN PHÒNG TRỌ] ${relatedRoom.title} - Giá: ${relatedRoom.price}/tháng - Địa chỉ: ${relatedRoom.location}`
    try {
      await sendMessage(selected.id, user.id, text, {
        type: "image",
        fileUrl: relatedRoom.image,
        fileName: relatedRoom.title,
        fileSize: "Thông tin phòng",
      })
      toast("Đã gửi thông tin phòng trọ vào cuộc trò chuyện!", "success")
    } catch {
      toast("Không thể chia sẻ tin phòng.", "error")
    }
  }

  const sendVietQrDeposit = async () => {
    if (!selected || !user || sending) return
    const noteEncoded = encodeURIComponent(qrNote.trim() || "TroOi Coc Phong")
    const qrUrl = `https://img.vietqr.io/image/${qrBank}-${qrAccountNo}-compact2.png?amount=${qrAmount}&addInfo=${noteEncoded}&accountName=${encodeURIComponent(qrAccountName)}`
    const text = `Em gửi mã VietQR đặt cọc giữ chỗ phòng ${(qrAmount).toLocaleString("vi-VN")}đ qua ${qrBank} (${qrAccountNo} - ${qrAccountName}) nha anh/chị ơi!`
    setSending(true)
    try {
      await sendMessage(selected.id, user.id, text, {
        type: "image",
        fileUrl: qrUrl,
        fileName: `vietqr-dat-coc-${qrAmount}.png`,
        fileSize: "VietQR 24/7",
      })
      setQrModalOpen(false)
      toast("Đã gửi mã VietQR đặt cọc thành công!", "success")
    } catch {
      toast("Không thể gửi mã QR.", "error")
    } finally {
      setSending(false)
    }
  }
  const startChat = async (contact: { name: string; initials: string; avatarUrl?: string; id: string; roomId: string }) => {
    setStartingContactId(contact.id)
    setContactError("")
    try {
      const conversation = await startConversation({ accountId: user?.id ?? "", name: contact.name, avatar: contact.initials, avatarUrl: contact.avatarUrl, userId: contact.id, roomId: contact.roomId })
      if (!conversation) return
      setParams({ conversation })
      setSelectContact(false)
      setMobileChat(true)
    } catch (error) {
      setContactError(error instanceof Error ? error.message : "Không thể mở cuộc trò chuyện. Vui lòng thử lại.")
    } finally {
      setStartingContactId(null)
    }
  }

  const handleSelectItem = async (item: typeof conversationItems[0]) => {
    if (item.conversationId) {
      setParams((current) => ({ ...Object.fromEntries(current), conversation: item.conversationId! }))
      setMobileChat(true)
      return
    }
    const friend = item.friendData || friends.find((f) => f.id === item.userId)
    if (!friend) return
    const room = listings.find((l) => l.ownerId === friend.id && l.status === "active")
    await startChat({
      name: friend.name,
      initials: friend.initials,
      avatarUrl: friend.avatarUrl,
      id: friend.id,
      roomId: room?.id ?? "",
    })
  }

  const handlePhoneSearch = async (event?: FormEvent) => {
    if (event) event.preventDefault()
    const q = phoneQuery.trim()
    if (!q) return
    setPhoneSearching(true)
    setContactError("")
    try {
      if (isApiMode) {
        const res = await apiRequest<{ items: Array<{ id: string; name: string; initials: string; avatarUrl?: string; phone: string; role: string }> }>(`members?q=${encodeURIComponent(q)}`)
        setPhoneResults((res.items || []).filter((item: { id: string }) => item.id !== user?.id))
      } else {
        const clean = q.replace(/[\s\.\-]+/g, "").toLowerCase()
        const found = users.filter((u) => {
          if (u.id === user?.id || u.status !== "active") return false
          const uPhone = (u.phone || "").replace(/[\s\.\-]+/g, "")
          return uPhone.includes(clean) || u.name.toLowerCase().includes(q.toLowerCase())
        })
        setPhoneResults(found.map((u) => ({ id: u.id, name: u.name, initials: u.initials, avatarUrl: u.avatarUrl, phone: u.phone || "", role: u.role })))
      }
    } catch (err) {
      setContactError(err instanceof Error ? err.message : "Không thể tìm kiếm lúc này.")
    } finally {
      setPhoneSearching(false)
      setPhoneSearched(true)
    }
  }

  const openPhoneSearch = () => {
    setSelectContact(true)
    setPhoneQuery("")
    setPhoneResults([])
    setPhoneSearched(false)
    setContactError("")
  }

  return (
    <main className="messages-page">
      <div className={`${selected ? "container messenger" : "container messenger is-empty"} ${selected && showDetails ? "has-details" : "no-details"}`}>
        <aside className={mobileChat ? "conversation-list hidden-mobile" : "conversation-list"}>
          {/* Header Title: Chat */}
          <div className="chat-sidebar-head">
            <h1 className="chat-sidebar-title">Chat</h1>

            {/* Search Input Row with 3 vertical dots */}
            <div className="chat-search-row">
              <div className="chat-search-box">
                <Icon name="search" size={17} />
                <input
                  className="chat-search-input"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Nhập 3 ký tự để bắt đầu tìm kiếm"
                  autoComplete="off"
                  spellCheck={false}
                />
                {search && (
                  <button
                    type="button"
                    className="chat-search-clear"
                    onClick={() => setSearch("")}
                    aria-label="Xóa tìm kiếm"
                  >
                    <Icon name="close" size={14} />
                  </button>
                )}
              </div>

              {/* 3-dots Menu Button */}
              <div className="chat-menu-wrapper" ref={menuRef}>
                <button
                  type="button"
                  className="chat-dots-btn"
                  onClick={() => setMenuOpen((v) => !v)}
                  aria-label="Tùy chọn khác"
                  title="Tùy chọn khác"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="5" r="2" />
                    <circle cx="12" cy="12" r="2" />
                    <circle cx="12" cy="19" r="2" />
                  </svg>
                </button>

                {menuOpen && (
                  <div className="chat-dropdown-menu">
                    <button
                      type="button"
                      className="chat-dropdown-item"
                      onClick={async () => {
                        setMenuOpen(false)
                        try {
                          await Promise.all(
                            accountMessages
                              .filter((m) => m.unread)
                              .map((m) => markConversationRead(m.id, user?.id ?? ""))
                          )
                          toast("Đã đánh dấu tất cả là đã đọc", "success")
                        } catch {
                          toast("Không thể cập nhật trạng thái.", "error")
                        }
                      }}
                    >
                      <Icon name="chat" size={15} />
                      <span>Đánh dấu tất cả đã đọc</span>
                    </button>
                    <button
                      type="button"
                      className="chat-dropdown-item"
                      onClick={() => {
                        setMenuOpen(false)
                        openPhoneSearch()
                      }}
                    >
                      <Icon name="phone" size={15} />
                      <span>Tìm bạn qua số điện thoại</span>
                    </button>
                    <Link
                      to="/ban-be"
                      className="chat-dropdown-item"
                      onClick={() => setMenuOpen(false)}
                    >
                      <Icon name="users" size={15} />
                      <span>Danh sách bạn bè</span>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="chat-header-divider" />

          {/* Filter Pills: Tất cả, Chưa đọc, Tin rác / Bỏ qua */}
          <div className="chat-filter-pills">
            <button
              type="button"
              className={`chat-pill ${filterTab === "all" ? "active" : ""}`}
              onClick={() => setFilterTab("all")}
            >
              Tất cả
            </button>
            <button
              type="button"
              className={`chat-pill ${filterTab === "unread" ? "active" : ""}`}
              onClick={() => setFilterTab("unread")}
            >
              Chưa đọc
            </button>
            <button
              type="button"
              className={`chat-pill ${filterTab === "spam" ? "active" : ""}`}
              onClick={() => setFilterTab("spam")}
            >
              Tin rác / Bỏ qua
            </button>
          </div>

          {/* Items List */}
          <div className="chat-items-list">
            {conversationItems.map((item) => {
              const isSelected = selected?.id === item.conversationId
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`chat-item-row ${isSelected ? "is-selected" : ""} ${item.unread ? "is-unread" : ""}`}
                  onClick={() => void handleSelectItem(item)}
                >
                  <div className="chat-avatar-wrap">
                    <PersonAvatar
                      initials={item.avatar}
                      avatarUrl={item.avatarUrl}
                      active={item.active}
                    />
                  </div>
                  <div className="chat-item-info">
                    <div className="chat-item-title-row">
                      <strong className="chat-item-name">{item.name}</strong>
                      <time className="chat-item-time">{item.time}</time>
                    </div>
                    <div className="chat-item-sub-row">
                      <span className="chat-item-snippet">{item.text}</span>
                      {item.unread && <span className="chat-unread-dot" />}
                    </div>
                  </div>
                </button>
              )
            })}

            {/* Empty State */}
            {conversationItems.length === 0 && (
              <div className="chat-empty-sidebar">
                <div className="chat-empty-sidebar-icon">
                  {search && search.trim().length >= 3 ? (
                    <Icon name="search" size={24} />
                  ) : filterTab === "unread" ? (
                    <Icon name="chat" size={24} />
                  ) : filterTab === "spam" ? (
                    <Icon name="bell" size={24} />
                  ) : (
                    <Icon name="chat" size={24} />
                  )}
                </div>
                <strong className="chat-empty-sidebar-title">
                  {search && search.trim().length >= 3
                    ? "Không tìm thấy kết quả"
                    : filterTab === "unread"
                    ? "Không có tin nhắn chưa đọc"
                    : filterTab === "spam"
                    ? "Không có tin rác / bỏ qua"
                    : "Chưa có cuộc trò chuyện"}
                </strong>
                <p className="chat-empty-sidebar-desc">
                  {search && search.trim().length >= 3
                    ? `Không tìm thấy cuộc trò chuyện nào khớp với "${search}".`
                    : filterTab === "unread"
                    ? "Tất cả cuộc trò chuyện của bạn đã được đọc."
                    : filterTab === "spam"
                    ? "Các cuộc trò chuyện bạn tắt thông báo hoặc bỏ qua sẽ xuất hiện ở đây."
                    : "Các cuộc trò chuyện và bạn bè của bạn sẽ xuất hiện tại đây."}
                </p>
                {search && search.trim().length >= 3 && (
                  <button
                    type="button"
                    className="chat-empty-action-btn"
                    onClick={() => setSearch("")}
                  >
                    Xóa tìm kiếm
                  </button>
                )}
              </div>
            )}
          </div>
        </aside>

        {selected ? (
          <section className={mobileChat ? "chat-window open-mobile" : "chat-window"}>
            <div className="chat-head">
              <button className="back-chat" aria-label="Quay lại danh sách" onClick={() => setMobileChat(false)}><Icon name="chevron" size={20}/></button>
              <Link className="profile-avatar-link" to={`/nguoi-dung/${selected.userId}`} aria-label={`Xem hồ sơ ${selected.name}`}>
                <PersonAvatar initials={selected.avatar} avatarUrl={selected.avatarUrl ?? selectedContact?.avatarUrl} active={selected.active} />
              </Link>
              <Link className="chat-contact" to={`/nguoi-dung/${selected.userId}`}>
                <strong>{selected.name}</strong>
                <span className="chat-contact-sub">
                  <span>{selected.active ? "Đang hoạt động" : "Truy cập 1 giờ trước"}</span>
                  <i className="zalo-lock-tag" title="Mã hóa đầu cuối"><Icon name="lock" size={11} /></i>
                </span>
              </Link>
              <div className="chat-head-actions">
                <button
                  type="button"
                  className="zalo-action-btn"
                  title="Cuộc gọi thoại"
                  aria-label="Cuộc gọi thoại"
                  onClick={() => setCallingState({ type: "voice", open: true })}
                >
                  <Icon name="phone" size={18} />
                </button>
                <button
                  type="button"
                  className="zalo-action-btn"
                  title="Cuộc gọi video"
                  aria-label="Cuộc gọi video"
                  onClick={() => setCallingState({ type: "video", open: true })}
                >
                  <Icon name="video" size={18} />
                </button>
                <button
                  type="button"
                  className={`zalo-action-btn ${searchInChat ? "active" : ""}`}
                  title="Tìm kiếm tin nhắn trong hội thoại"
                  aria-label="Tìm kiếm tin nhắn"
                  onClick={() => {
                    setSearchInChat(!searchInChat)
                    if (searchInChat) setInChatQuery("")
                  }}
                >
                  <Icon name="search" size={18} />
                </button>
                {relatedRoom && (
                  <button className="chat-listing-action" type="button" aria-label="Xem tin phòng" onClick={() => navigate(`/phong/${relatedRoom.id}`)}>
                    <Icon name="building" size={16} />
                    <span>Xem phòng</span>
                  </button>
                )}
                <button
                  className={selected.muted ? "zalo-action-btn active" : "zalo-action-btn"}
                  aria-label={selected.muted ? "Bật thông báo cuộc trò chuyện" : "Tắt thông báo cuộc trò chuyện"}
                  aria-pressed={Boolean(selected.muted)}
                  onClick={() => void changeMute()}
                  title={selected.muted ? "Bật thông báo" : "Tắt thông báo"}
                >
                  <Icon name="bell" size={18} />
                </button>
                <button
                  className={`zalo-action-btn ${showDetails ? "active" : ""}`}
                  type="button"
                  aria-label="Thông tin hội thoại"
                  title={showDetails ? "Ẩn bảng thông tin" : "Hiện bảng thông tin"}
                  onClick={() => setShowDetails((prev) => !prev)}
                >
                  <Icon name="panel" size={18} />
                </button>
              </div>
            </div>

            {searchInChat && (
              <div className="zalo-in-chat-search">
                <Icon name="search" size={16} />
                <input
                  placeholder="Tìm kiếm nội dung tin nhắn, tên tệp..."
                  value={inChatQuery}
                  onChange={(e) => setInChatQuery(e.target.value)}
                  autoFocus
                />
                {inChatQuery && (
                  <button type="button" className="zalo-tool-btn" onClick={() => setInChatQuery("")} title="Xóa tìm kiếm">
                    <Icon name="close" size={14} />
                  </button>
                )}
              </div>
            )}

            <div className="chat-body">
              {relatedRoom && (
                <div
                  className="chat-room-card"
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(`/phong/${relatedRoom.id}`)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault()
                      navigate(`/phong/${relatedRoom.id}`)
                    }
                  }}
                >
                  <img src={relatedRoom.image} alt={relatedRoom.title} />
                  <div>
                    <small>{(user?.role === "landlord" || (relatedRoom && relatedRoom.ownerId === user?.id)) ? "Khách đang hỏi về phòng của bạn" : "Bạn đang hỏi về phòng"}</small>
                    <strong>{relatedRoom.title}</strong>
                    <span>
                      <b>{relatedRoom.price}/tháng</b>
                      <i>·</i>
                      {relatedRoom.location}
                    </span>
                  </div>
                  <Icon name="chevron" size={17} />
                </div>
              )}
              <div className={displayedMessages.length ? "chat-history" : "chat-history empty"}>
                {displayedMessages.length ? (
                  <>
                    <span className="chat-date">Hôm nay</span>
                    {displayedMessages.map((item) => {
                      const isMe = item.from === "me"
                      const themAvatar = selected.avatarUrl ?? selectedContact?.avatarUrl
                      const isImage = item.type === "image" || (item.fileUrl && /\.(jpg|jpeg|png|webp|gif|avif)$/i.test(item.fileUrl))
                      const isFile = item.type === "file" || (item.fileUrl && !isImage)
                      const isSticker = item.type === "sticker" || item.text === "👍"

                      return (
                        <div className={`chat-msg-row ${isMe ? "sent-row" : "received-row"}`} key={item.id}>
                          <div style={{ display: "flex", alignItems: "flex-end", gap: "8px", maxWidth: "100%" }}>
                            {!isMe && (
                              <span className="chat-msg-avatar avatar mini-avatar" aria-hidden="true">
                                {themAvatar ? <img className="user-avatar-image" src={themAvatar} alt="" /> : selected.avatar}
                              </span>
                            )}
                            <div className={isMe ? "bubble sent" : "bubble received"}>
                              {isSticker && !item.fileUrl ? (
                                <span className="zalo-thumbs-sticker">{item.text}</span>
                              ) : isImage && item.fileUrl ? (
                                <div className="zalo-msg-img-card" onClick={() => setZoomImageUrl(item.fileUrl || null)}>
                                  <img src={item.fileUrl} alt={item.fileName || "Hình ảnh"} loading="lazy" />
                                  <div className="zalo-img-zoom-tag">
                                    <Icon name="eye" size={12} />
                                    <span>Xem ảnh</span>
                                  </div>
                                </div>
                              ) : isFile && item.fileUrl ? (
                                <a href={item.fileUrl} download={item.fileName || "tep-tin"} target="_blank" rel="noreferrer" className="zalo-msg-file-card">
                                  <div className={`zalo-file-badge ${getFileTypeBadge(item.fileName || "").class}`}>
                                    {getFileTypeBadge(item.fileName || "").ext}
                                  </div>
                                  <div className="zalo-file-info">
                                    <strong className="zalo-file-name" title={item.fileName}>{item.fileName || "Tệp đính kèm"}</strong>
                                    <span className="zalo-file-size">{item.fileSize || "Tài liệu"}</span>
                                  </div>
                                  <span className="zalo-file-download-icon" title="Tải xuống tệp">
                                    <Icon name="download" size={16} />
                                  </span>
                                </a>
                              ) : null}

                              {item.text && (!isSticker || item.fileUrl) && (
                                <span className={isImage || isFile ? "zalo-msg-caption" : ""}>{item.text}</span>
                              )}
                              <time className="bubble-time">{item.time}</time>
                            </div>
                          </div>

                          {isMe && (
                            <div className="zalo-delivery-pill">
                              <Icon name="doubleCheck" size={13} />
                              <span>{item.status === "read" ? "Đã xem" : "Đã nhận"}</span>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </>
                ) : (
                  <div className="chat-first-message">
                    <span className="placeholder-icon"><Icon name="chat" /></span>
                    <strong>{inChatQuery ? "Không tìm thấy tin nhắn" : "Chưa có tin nhắn"}</strong>
                    <p>{inChatQuery ? `Không có kết quả khớp với "${inChatQuery}"` : "Gửi tin nhắn hoặc hình ảnh để bắt đầu trao đổi."}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="chat-composer">
              {messageError && <p className="form-message error" role="alert" style={{ margin: "8px 16px" }}>{messageError}</p>}

              {/* Hidden file inputs */}
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleImageSelect}
              />
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar"
                style={{ display: "none" }}
                onChange={handleFileSelect}
              />

              {/* Zalo Action Toolbar */}
              <div className="zalo-chat-toolbar">
                <div ref={toolbarEmojiRef} style={{ position: "relative" }}>
                  <button
                    type="button"
                    className={`zalo-tool-btn ${emojiOpen ? "active" : ""}`}
                    title="Biểu cảm / Nhãn dán"
                    onClick={() => setEmojiOpen(!emojiOpen)}
                  >
                    <Icon name="smile" size={19} />
                  </button>
                  {emojiOpen && (
                    <div className="zalo-popover">
                      <div className="zalo-emoji-grid">
                        {["👍", "❤️", "😊", "😂", "🎉", "🔥", "🏠", "🔑", "✍️", "📞", "💯", "🤝", "👌", "🙏", "⭐", "📍", "💵", "✅"].map((e) => (
                          <button
                            key={e}
                            type="button"
                            className="zalo-emoji-item"
                            onClick={() => {
                              setMessage((prev) => `${prev}${e}`)
                              setEmojiOpen(false)
                              document.getElementById("message-entry")?.focus()
                            }}
                          >
                            {e}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  className="zalo-tool-btn"
                  title="Gửi hình ảnh"
                  onClick={() => imageInputRef.current?.click()}
                >
                  <Icon name="image" size={19} />
                </button>

                <button
                  type="button"
                  className="zalo-tool-btn"
                  title="Đính kèm tệp tài liệu (PDF, Word, Excel, ZIP...)"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Icon name="paperclip" size={19} />
                </button>

                {relatedRoom && (
                  <button
                    type="button"
                    className="zalo-tool-btn"
                    title="Chia sẻ tin phòng trọ này"
                    onClick={shareRoomCard}
                  >
                    <Icon name="idCard" size={19} />
                  </button>
                )}

                <button
                  type="button"
                  className="zalo-tool-btn"
                  title="Tạo mã VietQR đặt cọc / chuyển khoản"
                  onClick={() => setQrModalOpen(true)}
                >
                  <Icon name="qr" size={19} />
                </button>

                <button
                  type="button"
                  className="zalo-tool-btn"
                  title="In đậm chữ"
                  onClick={() => {
                    setMessage((m) => m ? `**${m}**` : "**Tin quan trọng:** ")
                    document.getElementById("message-entry")?.focus()
                  }}
                >
                  <Icon name="font" size={17} />
                </button>

                <div ref={toolbarQuickReplyRef} style={{ position: "relative" }}>
                  <button
                    type="button"
                    className={`zalo-tool-btn ${quickReplyOpen ? "active" : ""}`}
                    title="Tin nhắn nhanh"
                    onClick={() => setQuickReplyOpen(!quickReplyOpen)}
                  >
                    <Icon name="zap" size={17} />
                  </button>
                  {quickReplyOpen && (
                    <div className="zalo-popover" style={{ width: "320px" }}>
                      <div className="zalo-quick-replies-list">
                        {[
                          "Chào bạn! Phòng này còn trống không ạ?",
                          "Khi nào mình có thể qua xem phòng trực tiếp được ạ?",
                          "Giá thuê đã bao gồm tiền điện nước, internet chưa ạ?",
                          "Phòng có chỗ để xe máy an toàn không bạn?",
                          "Em muốn cọc giữ chỗ phòng, anh/chị gửi thông tin nhé!",
                          "Phòng lầu mấy, có ban công thoáng mát không ạ?",
                        ].map((reply) => (
                          <button
                            key={reply}
                            type="button"
                            className="zalo-quick-reply-btn"
                            onClick={() => {
                              setMessage(reply)
                              setQuickReplyOpen(false)
                              document.getElementById("message-entry")?.focus()
                            }}
                          >
                            {reply}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  className="zalo-tool-btn"
                  title="Hẹn lịch xem phòng"
                  onClick={() => setScheduleModalOpen(true)}
                >
                  <Icon name="calendar" size={18} />
                </button>
              </div>

              {/* Pre-send Staged Attachment Preview */}
              {stagedAttachment && (
                <div className="zalo-attachment-preview">
                  {stagedAttachment.type === "image" ? (
                    <img src={stagedAttachment.previewUrl} alt="Preview" className="zalo-preview-thumb" />
                  ) : (
                    <div className="zalo-preview-file-icon">
                      <Icon name="file" size={24} />
                    </div>
                  )}
                  <div className="zalo-preview-meta">
                    <strong>{stagedAttachment.fileName}</strong>
                    <span>{stagedAttachment.fileSize} {uploadingAttachment ? "· Đang tải lên máy chủ..." : ""}</span>
                  </div>
                  <button
                    type="button"
                    className="zalo-preview-remove"
                    onClick={() => setStagedAttachment(null)}
                    title="Hủy đính kèm"
                  >
                    <Icon name="close" size={16} />
                  </button>
                </div>
              )}

              {/* Input Bar Form */}
              <form className="zalo-chat-input-bar" onSubmit={submit}>
                <input
                  id="message-entry"
                  className="zalo-input-field"
                  aria-label="Viết tin nhắn"
                  maxLength={5000}
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder={`Nhập @, tin nhắn tới ${selected.name}`}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  disabled={sending || uploadingAttachment}
                />
                <div className="zalo-input-actions">
                  <button
                    type="button"
                    className="zalo-input-action-btn"
                    title="Chèn biểu tượng cảm xúc"
                    onClick={() => setEmojiOpen(!emojiOpen)}
                  >
                    <Icon name="smile" size={20} />
                  </button>
                  {!message.trim() && !stagedAttachment ? (
                    <button
                      type="button"
                      className="zalo-like-btn"
                      title="Gửi nút thích (Like)"
                      onClick={sendQuickLike}
                      disabled={sending}
                    >
                      <span className="zalo-thumb-emoji">👍</span>
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className="zalo-send-btn"
                      title="Gửi tin nhắn"
                      disabled={sending || uploadingAttachment}
                    >
                      <Icon name="send" size={17} />
                    </button>
                  )}
                </div>
              </form>
            </div>
          </section>
        ) : (
          <section className="chat-window chat-empty">
            <div className="chat-empty-content">
              <span className="placeholder-icon"><Icon name="chat" size={36} /></span>
              <h2>Tin nhắn của bạn</h2>
              <p>Chọn một người bạn hoặc cuộc trò chuyện ở danh sách bên trái để bắt đầu trao đổi tiện ích, giá cả hoặc hẹn xem phòng trọ.</p>
              <div className="chat-empty-actions" style={{ display: "flex", gap: "10px", justifyContent: "center", marginTop: "16px" }}>
                <button type="button" className="zalo-btn-primary" onClick={openPhoneSearch}>
                  <Icon name="phone" size={15} />
                  <span>Tìm bạn qua số điện thoại</span>
                </button>
                <Link to="/ban-be" className="zalo-btn-secondary">
                  <Icon name="users" size={15} />
                  <span>Xem danh sách bạn bè</span>
                </Link>
              </div>
            </div>
          </section>
        )}

        {selected && showDetails && (
          <aside className="chat-details-panel">
            <div className="chat-details-topbar">
              <span className="details-topbar-title">Thông tin liên hệ</span>
              <button
                className="details-close-btn"
                type="button"
                onClick={() => setShowDetails(false)}
                title="Thu gọn thông tin"
                aria-label="Đóng bảng thông tin"
              >
                <Icon name="close" size={16} />
              </button>
            </div>

            <div className="chat-details-scrollarea">
              {/* Profile Card */}
              <div className="chat-profile-card">
                <div className="chat-avatar-container">
                  <PersonAvatar
                    className="xlarge"
                    initials={selected.avatar}
                    avatarUrl={selected.avatarUrl ?? selectedContact?.avatarUrl}
                    active={selected.active}
                  />
                  {selected.active && <span className="online-indicator" title="Đang online">Online</span>}
                </div>

                <h3 className="profile-name">{selected.name}</h3>
                <span className={`profile-role-pill ${isPassRoom ? "role-transfer" : ""}`}>
                  {isPassRoom
                    ? "Người pass phòng"
                    : selectedContact?.role === "landlord"
                    ? "Chủ trọ"
                    : selectedContact?.role === "renter"
                    ? "Người tìm phòng"
                    : "Thành viên Trọ Ơi"}
                </span>

                <div className="profile-stats-row">
                  
                  <span className="stat-badge" title="Đánh giá phản hồi">
                    <Icon name="star" size={13} /> {roomReviews.length ? `${averageRating.toFixed(1)}/5` : "Chưa có đánh giá"}
                  </span>
                  <span className="stat-badge" title="Tin đăng hiện tại">
                    <Icon name="building" size={13} /> {contactListings.length} tin
                  </span>
                </div>

                {/* Quick Action Tools */}
                <div className="profile-quick-actions">
                  {contactPhone ? (
                    <button
                      type="button"
                      className="quick-action-btn"
                      onClick={async () => {
                        try { if (!navigator.clipboard) throw new Error("Trình duyệt chưa cho phép sao chép."); await navigator.clipboard.writeText(contactPhone); toast("Đã sao chép số điện thoại.", "success") }
                        catch (error) { setMessageError(error instanceof Error ? error.message : "Không thể sao chép số điện thoại.") }
                      }}
                      title={`Gọi hoặc sao chép: ${contactPhone}`}
                    >
                      <span className="action-icon-circle action-call"><Icon name="phone" size={16} /></span>
                      <span className="action-label">Gọi / SĐT</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="quick-action-btn"
                      onClick={() => toast("Chủ phòng chưa công khai số điện thoại trực tiếp.", "info")}
                      title="Chưa có SĐT"
                    >
                      <span className="action-icon-circle"><Icon name="phone" size={16} /></span>
                      <span className="action-label">SĐT ẩn</span>
                    </button>
                  )}

                  <button
                    type="button"
                    className="quick-action-btn"
                    onClick={() => setScheduleModalOpen(true)}
                    title="Hẹn lịch xem phòng trực tiếp"
                  >
                    <span className="action-icon-circle action-schedule"><Icon name="calendar" size={16} /></span>
                    <span className="action-label">Hẹn xem</span>
                  </button>

                  <button
                    type="button"
                    className={`quick-action-btn ${selected.muted ? "is-muted" : ""}`}
                    onClick={() => void changeMute()}
                    title={selected.muted ? "Bật thông báo" : "Tắt thông báo"}
                  >
                    <span className="action-icon-circle action-mute"><Icon name="bell" size={16} /></span>
                    <span className="action-label">{selected.muted ? "Bật chuông" : "Tắt chuông"}</span>
                  </button>

                  <Link
                    to={`/nguoi-dung/${selected.userId}`}
                    className="quick-action-btn"
                    title="Xem trang cá nhân đầy đủ"
                  >
                    <span className="action-icon-circle action-profile"><Icon name="users" size={16} /></span>
                    <span className="action-label">Hồ sơ</span>
                  </Link>
                </div>
              </div>

              {/* Room Spotlight (Phòng đang trao đổi) */}
              {relatedRoom && (
                <div className="chat-room-spotlight">
                  <div className="spotlight-header">
                    <span className="spotlight-title">Phòng đang trao đổi</span>
                    {relatedRoom.type === "Chuyển nhượng" ? (
                      <span className="spotlight-badge transfer">Chuyển nhượng</span>
                    ) : (
                      <span className="spotlight-badge standard">Đang cho thuê</span>
                    )}
                  </div>

                  <div className="spotlight-card">
                    <div className="spotlight-thumb-wrap" onClick={() => navigate(`/phong/${relatedRoom.id}`)}>
                      <img src={relatedRoom.image} alt={relatedRoom.title} />
                      <span className="spotlight-price-pill">{relatedRoom.price}<small>/tháng</small></span>
                    </div>

                    <div className="spotlight-content">
                      <h4 className="spotlight-room-name" onClick={() => navigate(`/phong/${relatedRoom.id}`)}>
                        {relatedRoom.title}
                      </h4>
                      <p className="spotlight-room-location">
                        <Icon name="pin" size={14} />
                        <span>{relatedRoom.location}</span>
                      </p>

                      <div className="spotlight-specs-row">
                        <span className="spec-tag"><Icon name="building" size={13} /> {relatedRoom.area || "Chưa cập nhật diện tích"}</span>
                        <span className="spec-tag"><Icon name="shield" size={13} /> {relatedRoom.deposit || "Cọc thỏa thuận"}</span>
                      </div>

                      {galleryPhotos.length > 1 && (
                        <div className="spotlight-gallery-strip">
                          {galleryPhotos.slice(0, 4).map((photo, i) => (
                            <img
                              key={i}
                              src={photo}
                              alt=""
                              onClick={() => navigate(`/phong/${relatedRoom.id}`)}
                              title="Xem thêm ảnh phòng"
                            />
                          ))}
                        </div>
                      )}

                      <div className="spotlight-cta-row">
                        <button
                          type="button"
                          className="spotlight-view-btn"
                          onClick={() => navigate(`/phong/${relatedRoom.id}`)}
                        >
                          <span>Xem chi tiết tin</span>
                          <Icon name="chevron" size={14} />
                        </button>
                        <button
                          type="button"
                          className="spotlight-share-btn"
                          onClick={() => {
                            const url = window.location.origin + `/phong/${relatedRoom.id}`
                            navigator.clipboard?.writeText(url)
                            toast("Đã sao chép link tin phòng!", "success")
                          }}
                          title="Sao chép link phòng"
                        >
                          <Icon name="share" size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Safety & Trust Box */}
              <div className="chat-safety-box">
                <div className="safety-box-title">
                  <Icon name="shield" size={16} />
                  <span>Mẹo giao dịch an toàn</span>
                </div>
                <ul className="safety-box-list">
                  <li>Không đặt cọc hoặc chuyển khoản trước khi đến tận nơi xem phòng thực tế.</li>
                  {isPassRoom ? (
                    <li>Với tin pass phòng: Hãy yêu cầu lập phụ lục hợp đồng sang tên cọc có chủ trọ xác nhận.</li>
                  ) : (
                    <li>Yêu cầu chủ phòng giải thích rõ ràng giá điện, nước, internet và phí dịch vụ.</li>
                  )}
                  <li>Hẹn xem phòng vào ban ngày hoặc đi cùng bạn bè để đảm bảo an toàn.</li>
                </ul>

                <button
                  type="button"
                  className="safety-report-trigger"
                  disabled={!relatedRoom}
                  title={relatedRoom ? "Báo cáo tin phòng liên quan" : "Mở tin phòng để gửi báo cáo nội dung"}
                  onClick={() => setReportModalOpen(true)}
                >
                  <Icon name="flag" size={13} />
                  <span>Báo cáo tin phòng liên quan</span>
                </button>
              </div>
            </div>
          </aside>
        )}

        {/* Schedule Modal (Hẹn lịch xem phòng) */}
        {scheduleModalOpen && (
          <div className="dialog-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setScheduleModalOpen(false) }}>
            <section className="action-dialog schedule-dialog" ref={scheduleDialogRef} role="dialog" aria-modal="true" aria-labelledby="schedule-modal-title">
              <button className="dialog-close" onClick={() => setScheduleModalOpen(false)} aria-label="Đóng"><Icon name="close" /></button>
              <div className="dialog-header-custom">
                <span className="dialog-badge-icon schedule-badge-icon"><Icon name="calendar" size={22} /></span>
                <div>
                  <h2 id="schedule-modal-title">Hẹn lịch xem phòng</h2>
                  <p className="dialog-subtitle">Gửi lời hẹn trực tiếp tới {selected.name}</p>
                </div>
              </div>

              <div className="schedule-form-body">
                {relatedRoom && (
                  <div className="schedule-room-preview">
                    <img src={relatedRoom.image} alt={relatedRoom.title} />
                    <div>
                      <strong>{relatedRoom.title}</strong>
                      <span>{relatedRoom.price}/tháng · {relatedRoom.location}</span>
                    </div>
                  </div>
                )}

                <div className="schedule-field-group">
                  <label className="schedule-label">Chọn ngày xem:</label>
                  <div className="schedule-pill-group">
                    {["Hôm nay", "Ngày mai", "Ngày kia"].map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        className={`schedule-pill ${scheduleDate === opt ? "active" : ""}`}
                        onClick={() => setScheduleDate(opt)}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="schedule-field-group">
                  <label className="schedule-label">Khung giờ dự kiến:</label>
                  <div className="schedule-time-grid">
                    {["09:30", "11:30", "14:30", "17:30", "18:30", "19:30"].map((t) => (
                      <button
                        key={t}
                        type="button"
                        className={`time-chip ${scheduleTime === t ? "active" : ""}`}
                        onClick={() => setScheduleTime(t)}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="schedule-field-group">
                  <label className="schedule-label" htmlFor="schedule-note">Ghi chú thêm (tùy chọn):</label>
                  <input
                    id="schedule-note"
                    className="schedule-note-input"
                    value={scheduleNote}
                    onChange={(e) => setScheduleNote(e.target.value)}
                    placeholder="VD: Em đi xe máy qua, tới nơi em alo trước 10 phút ạ..."
                    autoComplete="off"
                  />
                </div>

                <div className="schedule-preview-box">
                  <small>Xem trước nội dung tin nhắn:</small>
                  <p>
                    <b>[LỜI HẸN XEM PHÒNG]</b> Em muốn hẹn xem phòng vào lúc <b>{scheduleTime}</b> ({scheduleDate.toLowerCase()}){scheduleNote ? `. Ghi chú: ${scheduleNote}` : ""}. Anh/chị có tiện giờ này không ạ?
                  </p>
                </div>
              </div>

              <div className="dialog-actions-row">
                <button type="button" className="btn-cancel" onClick={() => setScheduleModalOpen(false)}>Hủy</button>
                <button
                  type="button"
                  className="btn-confirm-schedule"
                  disabled={scheduling}
                  onClick={async () => {
                    if (scheduling) return
                    setScheduling(true)
                    const formattedMsg = `[LỜI HẸN XEM PHÒNG] Em muốn hẹn xem phòng vào lúc ${scheduleTime} (${scheduleDate.toLowerCase()})${scheduleNote ? `. Ghi chú: ${scheduleNote}` : ""}. Anh/chị có tiện giờ này không ạ?`
                    try {
                      await sendMessage(selected.id, user?.id ?? "", formattedMsg)
                      setScheduleModalOpen(false)
                      setScheduleNote("")
                      toast("Đã gửi lời hẹn xem phòng thành công!", "success")
                    } catch {
                      toast("Không thể gửi tin nhắn hẹn, vui lòng thử lại.", "error")
                    } finally { setScheduling(false) }
                  }}
                >
                  {scheduling ? "Đang gửi…" : "Gửi lời hẹn"}
                </button>
              </div>
            </section>
          </div>
        )}

        {reportModalOpen && relatedRoom && <ReportDialog targetType="Tin phòng" targetId={relatedRoom.id} targetTitle={relatedRoom.title} onClose={() => setReportModalOpen(false)} />}

        {selectContact && (
          <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectContact(false) }}>
            <section className="action-dialog phone-contact-dialog" ref={contactDialogRef} role="dialog" aria-modal="true" aria-labelledby="contact-picker-title">
              <button className="dialog-close" onClick={() => setSelectContact(false)} aria-label="Đóng"><Icon name="close" /></button>
              
              <h2 id="contact-picker-title">Tìm bạn qua số điện thoại</h2>
              <p className="contact-picker-intro">Tìm thành viên bằng số điện thoại hoặc tên để bắt đầu cuộc trò chuyện.</p>

              <form className="phone-search-box" onSubmit={handlePhoneSearch}>
                <div className="phone-input-wrapper">
                  <Icon name="phone" size={18} />
                  <input
                    value={phoneQuery}
                    onChange={(e) => setPhoneQuery(e.target.value)}
                    placeholder="Nhập số điện thoại (ví dụ: 0912345678)..."
                    autoFocus
                    autoComplete="off"
                    spellCheck={false}
                  />
                  {phoneQuery && (
                    <button type="button" className="phone-clear-icon" onClick={() => { setPhoneQuery(""); setPhoneResults([]); setPhoneSearched(false); }}>
                      <Icon name="close" size={15} />
                    </button>
                  )}
                </div>
                <button type="submit" className="phone-search-btn" disabled={!phoneQuery.trim() || phoneSearching}>
                  {phoneSearching ? "Đang tìm..." : "Tìm kiếm"}
                </button>
              </form>

              {contactError && <p className="form-message error" role="alert">{contactError}</p>}

              <div className="phone-results-container">
                {!phoneSearched ? (
                  <div className="phone-empty-state">
                    <div className="phone-state-icon">
                      <Icon name="phone" size={32} />
                    </div>
                    <strong>Bảo mật danh bạ</strong>
                    <p>Nhập số điện thoại hoặc tên của thành viên bạn muốn liên hệ.</p>
                  </div>
                ) : phoneResults.length > 0 ? (
                  phoneResults.map((item) => {
                    const room = listings.find((listing) => listing.ownerId === item.id && listing.status === "active")
                    const role = item.role === "landlord" ? "Chủ trọ" : "Người thuê"
                    return (
                      <div className="phone-contact-card" key={item.id}>
                        <div className="phone-contact-header">
                          <PersonAvatar initials={item.initials} avatarUrl={item.avatarUrl} />
                          <div className="phone-contact-meta">
                            <div className="phone-name-row">
                              <strong>{item.name}</strong>
                              <span className="role-badge">{role}</span>
                            </div>
                            <span className="phone-contact-phone"><Icon name="phone" size={13}/> {item.phone || "Chưa công khai SĐT"}</span>
                            {room && <span className="contact-room-title">Phòng: {room.title}</span>}
                          </div>
                        </div>
                        <div className="phone-contact-actions">
                          <button
                            type="button"
                            className="phone-btn-chat"
                            disabled={startingContactId === item.id}
                            onClick={() => startChat({ name: item.name, initials: item.initials, avatarUrl: item.avatarUrl, id: item.id, roomId: room?.id ?? "" })}
                          >
                            <Icon name="chat" size={16} />
                            <span>{startingContactId === item.id ? "Đang mở..." : "Nhắn tin"}</span>
                          </button>
                          <Link
                            to={`/nguoi-dung/${item.id}`}
                            className="phone-btn-profile"
                            onClick={() => setSelectContact(false)}
                          >
                            Xem hồ sơ
                          </Link>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="phone-empty-state is-not-found">
                    <div className="phone-state-icon is-danger">
                      <Icon name="search" size={32} />
                    </div>
                    <strong>Không tìm thấy người dùng</strong>
                    <p>Không có tài khoản nào đăng ký số điện thoại <b>{phoneQuery}</b>. Vui lòng kiểm tra lại số điện thoại.</p>
                  </div>
                )}
              </div>
            </section>
          </div>
        )}
        {/* Fullscreen Image Lightbox Modal */}
        {zoomImageUrl && (
          <div className="zalo-lightbox-backdrop" onClick={() => setZoomImageUrl(null)}>
            <div className="zalo-lightbox-toolbar" onClick={(e) => e.stopPropagation()}>
              <a href={zoomImageUrl} download="hinh-anh-tro-oi" target="_blank" rel="noreferrer" className="zalo-lightbox-btn">
                <Icon name="download" size={16} />
                <span>Tải về</span>
              </a>
              <button type="button" className="zalo-lightbox-btn" onClick={() => setZoomImageUrl(null)}>
                <Icon name="close" size={16} />
                <span>Đóng</span>
              </button>
            </div>
            <img src={zoomImageUrl} alt="Chi tiết hình ảnh" className="zalo-lightbox-img" onClick={(e) => e.stopPropagation()} />
          </div>
        )}

        {/* VietQR Deposit Modal */}
        {qrModalOpen && (
          <div className="dialog-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setQrModalOpen(false) }}>
            <div className="action-dialog zalo-qr-dialog" role="dialog" aria-modal="true" style={{ maxWidth: "480px", borderRadius: "16px", overflow: "hidden", padding: 0 }}>
              <div className="zalo-qr-header" style={{ padding: "16px 20px", background: "linear-gradient(135deg, #1e3a8a, #0284c7)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <h3 style={{ margin: 0, fontSize: "16.5px", fontWeight: 700, color: "#fff" }}>Tạo mã VietQR đặt cọc giữ phòng</h3>
                <button type="button" className="zalo-action-btn" style={{ color: "#fff" }} onClick={() => setQrModalOpen(false)}>
                  <Icon name="close" size={18} />
                </button>
              </div>
              <div className="zalo-qr-body" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "14px" }}>
                <div className="zalo-qr-image-wrap" style={{ display: "flex", justifyContent: "center", background: "#f8fafc", padding: "14px", borderRadius: "12px", border: "1px dashed #cbd5e1" }}>
                  <img
                    src={`https://img.vietqr.io/image/${qrBank}-${qrAccountNo}-compact2.png?amount=${qrAmount}&addInfo=${encodeURIComponent(qrNote)}&accountName=${encodeURIComponent(qrAccountName)}`}
                    alt="Mã VietQR"
                    style={{ maxWidth: "230px", height: "auto", borderRadius: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px", color: "#334155" }}>Số tiền đặt cọc nhanh:</label>
                  <div className="zalo-qr-quick-amounts" style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    {[200000, 500000, 1000000, 2000000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        className={`zalo-amount-chip ${qrAmount === amt ? "active" : ""}`}
                        style={{
                          padding: "6px 12px",
                          borderRadius: "6px",
                          fontSize: "12.5px",
                          fontWeight: 600,
                          background: qrAmount === amt ? "#0284c7" : "#f1f5f9",
                          color: qrAmount === amt ? "#fff" : "#334155",
                          border: "1px solid #cbd5e1",
                          cursor: "pointer",
                        }}
                        onClick={() => setQrAmount(amt)}
                      >
                        {(amt / 1000).toLocaleString("vi-VN")}k VNĐ
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", color: "#64748b", marginBottom: "4px" }}>Ngân hàng:</label>
                    <select
                      style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13.5px" }}
                      value={qrBank}
                      onChange={(e) => setQrBank(e.target.value)}
                    >
                      <option value="MB">MB Bank (Quân Đội)</option>
                      <option value="VCB">Vietcombank</option>
                      <option value="TCB">Techcombank</option>
                      <option value="ACB">ACB</option>
                      <option value="VPB">VPBank</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", color: "#64748b", marginBottom: "4px" }}>Số tài khoản:</label>
                    <input
                      style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13.5px" }}
                      value={qrAccountNo}
                      onChange={(e) => setQrAccountNo(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", color: "#64748b", marginBottom: "4px" }}>Tên người thụ hưởng:</label>
                  <input
                    style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13.5px" }}
                    value={qrAccountName}
                    onChange={(e) => setQrAccountName(e.target.value)}
                  />
                </div>
                <div className="dialog-actions-row" style={{ marginTop: "10px" }}>
                  <button type="button" className="btn-cancel" onClick={() => setQrModalOpen(false)}>Hủy</button>
                  <button type="button" className="btn-confirm-schedule" onClick={sendVietQrDeposit} disabled={sending}>
                    {sending ? "Đang gửi..." : "Gửi mã VietQR vào chat"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Simulated Voice / Video Call Modal */}
        {callingState?.open && selected && (
          <div className="dialog-backdrop" role="presentation" onMouseDown={() => setCallingState(null)}>
            <div className="action-dialog zalo-calling-dialog" role="dialog" aria-modal="true">
              <img
                src={selected.avatarUrl || selectedContact?.avatarUrl || "/images/avatars/default-brand-avatar.png"}
                alt={selected.name}
                className="zalo-calling-avatar"
              />
              <h3 style={{ fontSize: "18px", fontWeight: 750, margin: "0 0 6px", color: "#111827" }}>{selected.name}</h3>
              <p style={{ color: "#64748b", fontSize: "14px", margin: 0 }}>
                {callingState.type === "video" ? "Đang kết nối cuộc gọi video chất lượng cao..." : "Đang đổ chuông cuộc gọi thoại qua internet..."}
              </p>
              <button type="button" className="zalo-end-call-btn" onClick={() => setCallingState(null)}>
                Kết thúc cuộc gọi
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
