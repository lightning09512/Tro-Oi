import useDialogFocus from "@/hooks/useDialogFocus"
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react"
import { Link, useNavigate, useParams } from "react-router"
import { Button, Icon } from "@/components/common/legacy"
import ReportDialog from "@/components/common/ReportDialog"
import {
  usePlatform,
  type ForumPost,
  type PostComment,
} from "@/contexts/PlatformContext"
import { useToast } from "@/contexts/ToastContext"
import useAuth from "@/hooks/useAuth"
import { apiRequest, isApiMode } from "@/services/apiClient"
import { formatRelativeTime } from "@/utils/formatTime"
import { stripLeadingBracketTag } from "@/utils/forumPost"

function isPlaceholderAvatar(url?: string): boolean {
  if (!url || !url.trim()) return true
  const normalized = url.trim().toLowerCase()
  return (
    normalized.includes("default-brand-avatar") ||
    normalized.includes("default-avatar")
  )
}

function getVietnameseGivenName(name?: string): string {
  if (!name || !name.trim()) return "Bạn"
  const parts = name.trim().split(/\s+/).filter(Boolean)
  return parts[parts.length - 1] || "Bạn"
}

function deriveCleanInitials(name?: string, fallbackInitials?: string): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/).filter(Boolean)
    if (parts.length >= 2) {
      return `${parts[parts.length - 2][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase()
    }
    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase()
    }
  }
  if (
    fallbackInitials &&
    fallbackInitials.trim() &&
    fallbackInitials.trim() !== "?"
  ) {
    return fallbackInitials.trim().slice(0, 2).toUpperCase()
  }
  return ""
}

async function uploadForumImageFile(file: File): Promise<string> {
  if (file.size > 3_000_000 || !file.type.startsWith("image/")) {
    throw new Error("Chọn một ảnh JPG, PNG hoặc WebP nhỏ hơn 3 MB.")
  }

  if (isApiMode) {
    const body = new FormData()
    body.append("file", file)
    const result = await apiRequest<{ url: string }>("uploads/image", {
      method: "POST",
      body,
    })
    return result.url
  }

  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error("Không thể đọc ảnh."))
    reader.readAsDataURL(file)
  })
}

function ProfileAvatar({
  name,
  initials,
  avatarUrl,
  className = "",
  isGuest = false,
}: {
  name?: string
  initials?: string
  avatarUrl?: string
  className?: string
  isGuest?: boolean
}) {
  const [imgFailed, setImgFailed] = useState(false)

  useEffect(() => {
    setImgFailed(false)
  }, [avatarUrl])

  const hasValidPhoto =
    !isGuest && !isPlaceholderAvatar(avatarUrl) && !imgFailed
  const cleanInitials = !isGuest ? deriveCleanInitials(name, initials) : ""

  return (
    <span
      className={`avatar ${
        isGuest || (!hasValidPhoto && !cleanInitials) ? "is-guest-avatar" : ""
      } ${className}`.trim()}
    >
      {hasValidPhoto ? (
        <img
          className="user-avatar-image"
          src={avatarUrl}
          alt=""
          decoding="async"
          onError={() => setImgFailed(true)}
        />
      ) : cleanInitials ? (
        <span className="avatar-initials-text">{cleanInitials}</span>
      ) : (
        <svg
          aria-hidden="true"
          className="avatar-guest-svg"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12 12c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5Zm0 2c-3.34 0-10 1.68-10 5v2h20v-2c0-3.32-6.66-5-10-5Z" />
        </svg>
      )}
    </span>
  )
}

function PostCard({
  post,
  onLogin,
  isDetail = false,
  eagerImage = false,
}: {
  post: ForumPost
  onLogin: () => void
  isDetail?: boolean
  eagerImage?: boolean
}) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toast } = useToast()
  const {
    users,
    listings,
    togglePostLike,
    addComment,
    deleteComment,
    editComment,
    savePost,
    deletePost,
    startConversation,
  } = usePlatform()

  const [menuOpen, setMenuOpen] = useState(false)
  const [commentsOpen, setCommentsOpen] = useState(isDetail)
  const [comment, setComment] = useState("")
  const [replyingTo, setReplyingTo] = useState<{
    id: string
    author: string
  } | null>(null)
  const [busyAction, setBusyAction] = useState("")
  const [actionError, setActionError] = useState("")
  const commentInputRef = useRef<HTMLInputElement | null>(null)
  const menuWrapRef = useRef<HTMLDivElement | null>(null)

  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(post.content)
  const [editImage, setEditImage] = useState(post.image || "")
  const [editUploading, setEditUploading] = useState(false)
  const [editError, setEditError] = useState("")
  const editFileInputRef = useRef<HTMLInputElement>(null)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  const [reportOpen, setReportOpen] = useState(false)
  const [reportedComment, setReportedComment] = useState<{
    id: string
    text: string
  } | null>(null)
  const [editingComment, setEditingComment] = useState("")
  const [commentDraft, setCommentDraft] = useState("")
  const [copied, setCopied] = useState(false)
  const [imageFailed, setImageFailed] = useState(false)

  const editDialogRef = useRef<HTMLElement>(null)
  const lightboxRef = useRef<HTMLElement>(null)
  const closeEditDialog = () => {
    if (busyAction === "edit" || editUploading) return
    setEditing(false)
    setEditError("")
  }
  useDialogFocus(editDialogRef, closeEditDialog, editing)
  useDialogFocus(lightboxRef, () => setLightboxOpen(false), lightboxOpen)

  useEffect(() => {
    setImageFailed(false)
  }, [post.image])

  useEffect(() => {
    if (isDetail) {
      setExpanded(true)
      setCommentsOpen(true)
    }
  }, [isDetail])

  useEffect(() => {
    if (!menuOpen) return
    const handlePointerDown = (event: PointerEvent) => {
      if (
        menuWrapRef.current &&
        !menuWrapRef.current.contains(event.target as Node)
      ) {
        setMenuOpen(false)
      }
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false)
    }
    document.addEventListener("pointerdown", handlePointerDown)
    window.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown)
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [menuOpen])

  const isOwner = user?.id === post.authorId
  const liked = user ? post.likedBy.includes(user.id) : false
  const author = users.find((item) => item.id === post.authorId)
  const isKnownLandlord =
    author?.role === "landlord" ||
    post.authorId.includes("landlord") ||
    listings.some((listing) => listing.ownerId === post.authorId)
  const roleBadgeLabel =
    author?.role === "admin"
      ? "Quản trị viên"
      : isKnownLandlord
        ? "Chủ trọ"
        : ""

  const authorAvatarUrl = post.avatarUrl || author?.avatarUrl || ""
  const currentUserAvatarUrl =
    user?.avatarUrl ||
    users.find((item) => item.id === user?.id)?.avatarUrl ||
    ""

  const compactCollapsedContent = useMemo(
    () => post.content.replace(/\n\s*\n+/g, "\n"),
    [post.content],
  )
  const isLong =
    post.content.length > 220 || compactCollapsedContent.split("\n").length > 4
  const [expanded, setExpanded] = useState(isDetail)

  const { rootComments, replyMap } = useMemo(() => {
    const roots: PostComment[] = []
    const replies: Record<string, PostComment[]> = {}
    const idMap = new Set(post.comments.map((c) => c.id))

    for (const c of post.comments) {
      if (c.parentId && idMap.has(c.parentId)) {
        if (!replies[c.parentId]) replies[c.parentId] = []
        replies[c.parentId].push(c)
      } else {
        roots.push(c)
      }
    }

    return { rootComments: roots, replyMap: replies }
  }, [post.comments])

  const startReply = (parentId: string, authorName: string) => {
    if (!user) return onLogin()
    setReplyingTo({ id: parentId, author: authorName })
    setComment(`@${authorName} `)
    setCommentsOpen(true)
    setTimeout(() => {
      commentInputRef.current?.focus()
    }, 50)
  }

  const cancelReply = () => {
    setReplyingTo(null)
    setComment("")
  }

  const submitComment = async (event: FormEvent) => {
    event.preventDefault()
    if (!user) return onLogin()
    if (!comment.trim() || busyAction) return

    setBusyAction("comment")
    setActionError("")

    try {
      await addComment(post.id, user, comment.trim(), replyingTo?.id)
      setComment("")
      setReplyingTo(null)
      setCommentsOpen(true)
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "Không thể gửi bình luận. Hãy thử lại.",
      )
    } finally {
      setBusyAction("")
    }
  }

  const handleEditImageFile = async (file: File) => {
    setEditUploading(true)
    setEditError("")
    try {
      const url = await uploadForumImageFile(file)
      setEditImage(url)
    } catch (err) {
      setEditError(
        err instanceof Error ? err.message : "Không thể tải ảnh. Hãy thử lại.",
      )
    } finally {
      setEditUploading(false)
    }
  }

  const submitEdit = async (event: FormEvent) => {
    event.preventDefault()
    if (busyAction || editUploading) return
    if (draft.trim().length < 2) {
      setEditError("Nội dung bài viết cần tối thiểu 2 ký tự.")
      return
    }

    setBusyAction("edit")
    setEditError("")
    setActionError("")

    try {
      await savePost({
        ...post,
        content: draft.trim(),
        image: editImage,
      })
      setEditing(false)
      toast("Đã cập nhật bài viết.", "success")
    } catch (error) {
      setEditError(
        error instanceof Error
          ? error.message
          : "Không thể lưu bài viết. Hãy thử lại.",
      )
    } finally {
      setBusyAction("")
    }
  }

  const messageAuthor = async () => {
    if (!user) return onLogin()

    try {
      const conversation = await startConversation({
        accountId: user.id,
        name: post.name,
        avatar: post.initials,
        avatarUrl: authorAvatarUrl || undefined,
        userId: post.authorId,
        roomId: "",
      })

      if (conversation) navigate(`/tin-nhan?conversation=${conversation}`)
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "Không thể mở cuộc trò chuyện.",
      )
    }
  }

  const saveEditedComment = async (commentId: string) => {
    if (!commentDraft.trim() || busyAction) return
    setBusyAction("edit-comment")
    setActionError("")
    try {
      await editComment(post.id, commentId, commentDraft.trim())
      setEditingComment("")
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Không thể lưu bình luận.",
      )
    } finally {
      setBusyAction("")
    }
  }

  const renderComment = (
    item: PostComment,
    isReply = false,
    rootId?: string,
  ) => {
    const isPostAuthor = item.authorId === post.authorId
    const isOwnComment = item.authorId === user?.id
    const commentUser = users.find((member) => member.id === item.authorId)
    const commentAvatar = item.avatarUrl || commentUser?.avatarUrl || ""
    const isEditingThis = editingComment === item.id

    return (
      <div
        className={`fb-comment-item ${isReply ? "is-reply" : ""}`}
        key={item.id}
      >
        <Link
          className="profile-avatar-link fb-comment-avatar-link"
          to={`/nguoi-dung/${item.authorId}`}
          aria-label={`Xem hồ sơ ${item.author}`}
        >
          <ProfileAvatar
            className={isReply ? "fb-avatar-xs" : "fb-avatar-sm"}
            name={item.author}
            initials={item.initials}
            avatarUrl={commentAvatar}
          />
        </Link>

        <div className="fb-comment-content-wrap">
          <div
            className={`fb-comment-bubble${isEditingThis ? " is-editing" : ""}`}
          >
            <div className="fb-bubble-header">
              <Link
                className="fb-comment-author"
                to={`/nguoi-dung/${item.authorId}`}
              >
                {item.author}
              </Link>

              {isPostAuthor && <span className="fb-author-badge">Tác giả</span>}
            </div>

            {isEditingThis ? (
              <form
                className="fb-comment-edit-form"
                onSubmit={(event) => {
                  event.preventDefault()
                  void saveEditedComment(item.id)
                }}
              >
                <textarea
                  rows={2}
                  maxLength={3000}
                  value={commentDraft}
                  onChange={(event) => setCommentDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Escape") {
                      event.stopPropagation()
                      setEditingComment("")
                    } else if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault()
                      void saveEditedComment(item.id)
                    }
                  }}
                  autoFocus
                  spellCheck={false}
                />

                <div className="fb-edit-actions">
                  <button
                    type="button"
                    className="fb-edit-cancel"
                    onClick={() => setEditingComment("")}
                  >
                    Hủy
                  </button>

                  <button
                    type="submit"
                    className="fb-edit-save"
                    disabled={!commentDraft.trim() || Boolean(busyAction)}
                  >
                    {busyAction === "edit-comment" ? "Đang lưu…" : "Lưu"}
                  </button>
                </div>
              </form>
            ) : (
              <p className="fb-comment-text">{item.text}</p>
            )}
          </div>

          <div className="fb-comment-actions">
            <span className="fb-comment-time">
              {formatRelativeTime(item.createdAt)}
            </span>

            <button
              type="button"
              className="fb-action-btn"
              onClick={() => startReply(rootId || item.id, item.author)}
            >
              Trả lời
            </button>

            {isOwnComment ? (
              <>
                <button
                  type="button"
                  className="fb-action-btn fb-action-subtle"
                  onClick={() => {
                    setEditingComment(item.id)
                    setCommentDraft(item.text)
                  }}
                >
                  Sửa
                </button>

                <button
                  type="button"
                  className="fb-action-btn fb-action-danger"
                  onClick={async () => {
                    if (!window.confirm("Xóa bình luận này?")) return
                    try {
                      await deleteComment(post.id, item.id)
                      toast("Đã xóa bình luận.", "info")
                    } catch (error) {
                      setActionError(
                        error instanceof Error
                          ? error.message
                          : "Không thể xóa bình luận.",
                      )
                    }
                  }}
                >
                  Xóa
                </button>
              </>
            ) : (
              <button
                type="button"
                className="fb-action-btn fb-action-report"
                onClick={() =>
                  setReportedComment({ id: item.id, text: item.text })
                }
                title="Báo cáo bình luận"
              >
                Báo cáo
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  const hasImage = Boolean(post.image && !imageFailed)
  const hasStats = post.likes > 0 || post.commentsCount > 0
  const renderedPostText =
    !expanded && isLong && !isDetail ? compactCollapsedContent : post.content

  return (
    <article className="post-card">
      {actionError && (
        <p className="form-message error post-card-alert" role="alert">
          {actionError}
        </p>
      )}

      <div className="post-head">
        <div className="fb-post-avatar-wrapper">
          <Link
            className="profile-avatar-link"
            to={`/nguoi-dung/${post.authorId}`}
            aria-label={`Xem hồ sơ ${post.name}`}
          >
            <ProfileAvatar
              name={post.name}
              initials={post.initials}
              avatarUrl={authorAvatarUrl}
            />
          </Link>
        </div>

        <div className="post-author-wrap">
          <div className="post-author">
            <Link
              className="post-author-name"
              to={`/nguoi-dung/${post.authorId}`}
            >
              {post.name}
            </Link>

            {roleBadgeLabel && (
              <span className="role-badge">{roleBadgeLabel}</span>
            )}
          </div>

          <div className="post-meta-sub">
            <Link
              to={`/bai-viet/${post.id}`}
              className="post-relative-time"
              title="Xem bài viết"
            >
              {formatRelativeTime(post.createdAt || post.time)}
            </Link>

            <span className="post-meta-dot" aria-hidden="true">
              ·
            </span>

            <span className="post-privacy-icon" title="Công khai">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
            </span>
          </div>
        </div>

        {!isOwner && (
          <button
            type="button"
            className="post-message-action"
            onClick={messageAuthor}
          >
            <Icon name="chat" size={15} />
            <span>Nhắn tin</span>
          </button>
        )}

        <div className="post-menu-wrap" ref={menuWrapRef}>
          <button
            type="button"
            aria-label="Tùy chọn bài viết"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((value) => !value)}
          >
            <Icon name="more" size={18} />
          </button>
          {menuOpen && (
            <div className="post-menu">
              {isOwner ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setDraft(post.content)
                      setEditImage(post.image || "")
                      setEditError("")
                      setEditing(true)
                      setMenuOpen(false)
                    }}
                  >
                    <Icon name="edit" size={16} />
                    Sửa bài viết
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      setMenuOpen(false)
                      if (!window.confirm("Xóa bài viết này?")) return
                      try {
                        await deletePost(post.id)
                        toast("Đã xóa bài viết.", "info")
                        if (isDetail) navigate("/dien-dan")
                      } catch (error) {
                        setActionError(
                          error instanceof Error
                            ? error.message
                            : "Không thể xóa bài viết.",
                        )
                      }
                    }}
                  >
                    <Icon name="trash" size={16} />
                    Xóa bài viết
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setReportOpen(true)
                    setMenuOpen(false)
                  }}
                >
                  <Icon name="flag" size={16} />
                  Báo cáo bài viết
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {post.content && (
        <div className="post-copy-wrapper">
          <p
            className={`post-copy${
              !expanded && isLong && !isDetail ? " is-collapsed" : ""
            }`}
          >
            {renderedPostText}
          </p>

          {isLong && !isDetail && (
            <button
              type="button"
              className="post-expand-btn"
              onClick={() => setExpanded((prev) => !prev)}
              aria-expanded={expanded}
            >
              {expanded ? "Ẩn bớt" : "Xem thêm"}
            </button>
          )}
        </div>
      )}

      {hasImage && (
        <div className={`post-media-frame${isDetail ? " is-detail" : ""}`}>
          <button
            type="button"
            className="post-media-trigger"
            onClick={() => setLightboxOpen(true)}
            aria-label={`Phóng to ảnh bài viết của ${post.name}`}
          >
            <img
              className="post-image"
              src={post.image}
              alt={`Ảnh bài viết của ${post.name}`}
              loading={eagerImage ? "eager" : "lazy"}
              decoding="async"
              onError={() => setImageFailed(true)}
            />
          </button>
        </div>
      )}

      {hasStats && (
        <div className="reaction-count">
          {post.likes > 0 ? (
            <span
              className="post-like-count"
              aria-label={`${post.likes} lượt yêu thích`}
            >
              <span className="fb-like-badge-icon" aria-hidden="true">
                <svg
                  viewBox="0 0 24 24"
                  width="11"
                  height="11"
                  fill="currentColor"
                >
                  <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5a5.5 5.5 0 0 0 1-8.9Z" />
                </svg>
              </span>
              <span>{post.likes}</span>
            </span>
          ) : (
            <span />
          )}

          {post.commentsCount > 0 && (
            <button
              type="button"
              className="reaction-comments-toggle"
              aria-expanded={commentsOpen}
              onClick={() => setCommentsOpen((value) => !value)}
            >
              {post.commentsCount} bình luận
            </button>
          )}
        </div>
      )}

      <div
        className={`reaction-bar${!hasStats && hasImage ? " after-media" : ""}`}
      >
        <button
          type="button"
          className={liked ? "liked" : ""}
          onClick={async () => {
            if (!user) return onLogin()
            try {
              await togglePostLike(post.id, user)
            } catch (error) {
              setActionError(
                error instanceof Error
                  ? error.message
                  : "Không thể cập nhật lượt yêu thích.",
              )
            }
          }}
        >
          {liked ? (
            <svg
              aria-hidden="true"
              className="icon"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5a5.5 5.5 0 0 0 1-8.9Z" />
            </svg>
          ) : (
            <Icon name="heart" size={18} />
          )}
          <span>Yêu thích</span>
        </button>

        <button
          type="button"
          aria-expanded={commentsOpen}
          onClick={() => setCommentsOpen((value) => !value)}
        >
          <Icon name="chat" size={18} />
          <span>Bình luận</span>
        </button>

        <button
          type="button"
          onClick={async () => {
            try {
              if (!navigator.clipboard)
                throw new Error(
                  "Trình duyệt chưa cho phép sao chép. Hãy sao chép địa chỉ bài viết trên thanh địa chỉ.",
                )
              await navigator.clipboard.writeText(
                `${window.location.origin}/bai-viet/${post.id}`,
              )
              setCopied(true)
              toast("Đã sao chép liên kết bài viết.", "success")
              window.setTimeout(() => setCopied(false), 1600)
            } catch (error) {
              setActionError(
                error instanceof Error
                  ? error.message
                  : "Không thể sao chép liên kết.",
              )
            }
          }}
        >
          <Icon name="share" size={18} />
          <span>{copied ? "Đã sao chép" : "Chia sẻ"}</span>
        </button>
      </div>

      {commentsOpen && (
        <div className="post-comments fb-comments-section">
          <form className="fb-comment-compose-box" onSubmit={submitComment}>
            {user ? (
              <Link
                className="profile-avatar-link"
                to={`/nguoi-dung/${user.id}`}
                aria-label="Mở hồ sơ của bạn"
              >
                <ProfileAvatar
                  className="fb-avatar-sm"
                  name={user.name}
                  initials={user.initials}
                  avatarUrl={currentUserAvatarUrl}
                />
              </Link>
            ) : (
              <ProfileAvatar className="fb-avatar-sm" isGuest />
            )}

            <div className="fb-compose-input-wrapper">
              {replyingTo && (
                <div className="fb-replying-banner">
                  <span>
                    Đang trả lời <b>{replyingTo.author}</b>
                  </span>

                  <button
                    type="button"
                    onClick={cancelReply}
                    className="fb-reply-cancel-btn"
                    title="Hủy trả lời"
                    aria-label="Hủy trả lời"
                  >
                    <Icon name="close" size={13} />
                  </button>
                </div>
              )}

              <div className="fb-input-row">
                {user ? (
                  <>
                    <input
                      ref={commentInputRef}
                      aria-label="Nội dung bình luận"
                      value={comment}
                      onChange={(event) => setComment(event.target.value)}
                      placeholder={
                        replyingTo
                          ? `Trả lời ${replyingTo.author}...`
                          : "Viết bình luận công khai..."
                      }
                      autoComplete="off"
                      spellCheck={false}
                    />

                    <button
                      type="submit"
                      className="fb-send-btn"
                      aria-label="Gửi bình luận"
                      disabled={!comment.trim() || Boolean(busyAction)}
                      title="Gửi bình luận"
                    >
                      <Icon name="send" size={14} />
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className="fb-guest-comment-btn"
                    onClick={onLogin}
                  >
                    <span>Đăng nhập để bình luận...</span>
                    <span
                      className="fb-send-btn is-guest-hint"
                      aria-hidden="true"
                    >
                      <Icon name="send" size={14} />
                    </span>
                  </button>
                )}
              </div>
            </div>
          </form>

          {rootComments.length > 0 && (
            <div className="fb-comments-tree">
              {rootComments.map((root) => {
                const replies = replyMap[root.id] || []

                return (
                  <div className="fb-comment-thread" key={root.id}>
                    {renderComment(root, false, root.id)}

                    {replies.length > 0 && (
                      <div className="fb-replies-list">
                        {replies.map((reply) =>
                          renderComment(reply, true, root.id),
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {lightboxOpen && hasImage && (
        <div
          className="dialog-backdrop fb-lightbox-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setLightboxOpen(false)
          }}
        >
          <section
            ref={lightboxRef}
            className="fb-lightbox-dialog"
            role="dialog"
            aria-modal="true"
            aria-label={`Ảnh bài viết của ${post.name}`}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="fb-lightbox-close"
              aria-label="Đóng ảnh"
              onClick={() => setLightboxOpen(false)}
            >
              <Icon name="close" size={20} />
            </button>
            <img
              src={post.image}
              alt={`Ảnh bài viết của ${post.name}`}
              className="fb-lightbox-img"
            />
          </section>
        </div>
      )}

      {editing && (
        <div
          className="dialog-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeEditDialog()
          }}
        >
          <section
            className="action-dialog fb-post-create-dialog"
            ref={editDialogRef}
            role="dialog"
            aria-modal="true"
            aria-label="Chỉnh sửa bài viết"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="fb-post-create-head">
              <h2>Chỉnh sửa bài viết</h2>
              <button
                type="button"
                className="dialog-close"
                aria-label="Đóng"
                onClick={closeEditDialog}
              >
                <Icon name="close" size={18} />
              </button>
            </div>

            <div className="fb-create-author-row">
              <div className="fb-composer-avatar-wrap">
                <ProfileAvatar
                  name={post.name}
                  initials={post.initials}
                  avatarUrl={authorAvatarUrl}
                />
              </div>
              <div className="fb-create-author-meta">
                <strong>{post.name}</strong>
                <div className="fb-audience-pill">
                  <Icon name="users" size={12} />
                  <span>Công khai</span>
                </div>
              </div>
            </div>

            <form className="fb-post-create-form" onSubmit={submitEdit}>
              <div className="fb-composer-input-area">
                <textarea
                  rows={editImage ? 4 : 5}
                  maxLength={5000}
                  value={draft}
                  onChange={(event) => {
                    setDraft(event.target.value)
                    if (editError) setEditError("")
                  }}
                  placeholder="Nhập nội dung bài viết..."
                  className="fb-composer-textarea is-edit-mode"
                  autoFocus
                />
              </div>

              {editImage && (
                <div className="fb-create-image-preview">
                  <img src={editImage} alt="Ảnh bài viết" />
                  <button
                    type="button"
                    className="fb-remove-img-btn"
                    onClick={() => {
                      setEditImage("")
                      if (editFileInputRef.current)
                        editFileInputRef.current.value = ""
                    }}
                    title="Gỡ ảnh"
                    aria-label="Gỡ ảnh"
                  >
                    <Icon name="close" size={14} />
                  </button>
                </div>
              )}

              {editUploading && (
                <div className="fb-uploading-card">
                  <div className="fb-uploading-spinner" />
                  <span>Đang tải ảnh lên...</span>
                </div>
              )}

              <input
                ref={editFileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                disabled={editUploading || Boolean(busyAction)}
                style={{ display: "none" }}
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (file) void handleEditImageFile(file)
                }}
              />

              <div className="fb-create-attachment-bar">
                <span className="fb-attach-label">
                  Thêm vào bài viết của bạn
                </span>
                <div className="fb-attachment-actions">
                  <button
                    type="button"
                    className={`fb-attach-action-btn ${
                      editImage ? "active" : ""
                    }`}
                    onClick={() => editFileInputRef.current?.click()}
                    title={editImage ? "Đổi ảnh" : "Thêm ảnh"}
                  >
                    <span className="fb-attach-icon-circle green">
                      <Icon name="image" size={18} />
                    </span>
                    <span>{editImage ? "Đổi ảnh" : "Ảnh"}</span>
                  </button>
                </div>
              </div>

              {editError && (
                <p className="form-message error" role="alert">
                  {editError}
                </p>
              )}

              <button
                type="submit"
                className="fb-post-submit-btn"
                disabled={
                  draft.trim().length < 2 ||
                  Boolean(busyAction) ||
                  editUploading
                }
              >
                {busyAction === "edit" ? "Đang lưu…" : "Lưu thay đổi"}
              </button>
            </form>
          </section>
        </div>
      )}

      {reportOpen && (
        <ReportDialog
          targetType="Bài viết"
          targetId={post.id}
          targetTitle={post.content.slice(0, 100)}
          onClose={() => setReportOpen(false)}
        />
      )}

      {reportedComment && (
        <ReportDialog
          targetType="Bình luận"
          targetId={reportedComment.id}
          targetTitle={reportedComment.text.slice(0, 100)}
          onClose={() => setReportedComment(null)}
        />
      )}
    </article>
  )
}

const SPONSORED_ADS = [
  {
    id: "cellphones",
    title: "CellphoneS - Hệ thống bán lẻ di động toàn quốc",
    domain: "cellphones.com.vn",
    image: "/images/ads/ad-cellphones.png",
    url: "https://cellphones.com.vn",
  },
  {
    id: "shopee",
    title: "Đi Chợ Online | Giao Nhanh Hỏa Tốc",
    domain: "shopee.vn",
    image: "/images/ads/ad-shopee.png",
    url: "https://shopee.vn",
  },
]

export default function ForumPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { id } = useParams()
  const { user } = useAuth()
  const { posts, users, savePost, connectionState } = usePlatform()

  const [query] = useState("")
  const [composerOpen, setComposerOpen] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [draft, setDraft] = useState("")
  const [image, setImage] = useState("")
  const [uploadingImage, setUploadingImage] = useState(false)
  const [showDropzone, setShowDropzone] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const composerRef = useRef<HTMLElement>(null)
  const [error, setError] = useState("")

  const closeComposerDialog = () => {
    if (publishing || uploadingImage) return
    setComposerOpen(false)
    setShowDropzone(false)
    setError("")
  }

  useDialogFocus(composerRef, closeComposerDialog, composerOpen)

  const handleImageFile = async (file: File) => {
    setUploadingImage(true)
    setError("")

    try {
      const url = await uploadForumImageFile(file)
      setImage(url)
      setShowDropzone(false)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Không thể tải ảnh. Hãy thử lại.",
      )
    } finally {
      setUploadingImage(false)
    }
  }

  const publicPosts = useMemo(
    () =>
      posts
        .filter((post) => post.status === "active" && (!id || post.id === id))
        .filter(
          (post) =>
            !query ||
            `${post.content} ${post.name}`
              .toLocaleLowerCase("vi")
              .includes(query.toLocaleLowerCase("vi")),
        ),
    [posts, id, query],
  )

  const trendingPosts = useMemo(
    () =>
      [...posts]
        .filter((post) => post.status === "active")
        .sort((a, b) => b.likes + b.commentsCount - (a.likes + a.commentsCount))
        .slice(0, 3),
    [posts],
  )

  const login = () =>
    navigate("/dang-nhap", { state: { from: window.location.pathname } })

  const currentUserAvatarUrl =
    user?.avatarUrl ||
    users.find((item) => item.id === user?.id)?.avatarUrl ||
    ""

  const PAGE_SIZE = 5
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [query, id])

  const displayedPosts = useMemo(
    () => publicPosts.slice(0, visibleCount),
    [publicPosts, visibleCount],
  )

  const hasMore = visibleCount < publicPosts.length

  useEffect(() => {
    if (!hasMore || isLoadingMore) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isLoadingMore) {
          setIsLoadingMore(true)
          setTimeout(() => {
            setVisibleCount((prev) => prev + PAGE_SIZE)
            setIsLoadingMore(false)
          }, 300)
        }
      },
      { rootMargin: "250px" },
    )

    const el = sentinelRef.current
    if (el) observer.observe(el)

    return () => {
      if (el) observer.unobserve(el)
    }
  }, [hasMore, isLoadingMore])

  const publish = async (event: FormEvent) => {
    event.preventDefault()

    if (!user) return login()
    if (publishing || uploadingImage) return

    if (draft.trim().length < 2) {
      setError("Hãy viết nội dung tối thiểu 2 ký tự trước khi đăng bài.")
      return
    }

    setPublishing(true)
    setError("")

    try {
      await savePost({
        id: `post-${Date.now()}`,
        authorId: user.id,
        name: user.name,
        initials: user.initials,
        avatarUrl: currentUserAvatarUrl || undefined,
        time: "Vừa xong",
        content: draft.trim(),
        image,
        likes: 0,
        likedBy: [],
        commentsCount: 0,
        comments: [],
        status: "active",
        createdAt: new Date().toISOString(),
      })

      setDraft("")
      setImage("")
      setShowDropzone(false)
      setComposerOpen(false)
      setError("")
      toast("Đã đăng bài viết mới.", "success")
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Không thể đăng bài viết.",
      )
    } finally {
      setPublishing(false)
    }
  }

  const isInitialLoading =
    connectionState === "loading" && publicPosts.length === 0
  const givenName = getVietnameseGivenName(user?.name)

  return (
    <main className="page-bg forum-page">
      <div className="container forum-layout">
        <aside className="forum-left">
          <h3>Diễn đàn</h3>

          <nav className="forum-left-nav" aria-label="Lối tắt diễn đàn">
            <button
              type="button"
              className={!id ? "active" : ""}
              onClick={() => navigate("/dien-dan")}
            >
              <span className="forum-nav-icon">
                <Icon name="home" size={18} />
              </span>
              <span>Bảng tin</span>
            </button>

            <button type="button" onClick={() => navigate("/tim-ban-be")}>
              <span className="forum-nav-icon">
                <Icon name="users" size={18} />
              </span>
              <span>Bạn bè</span>
            </button>

            <button
              type="button"
              onClick={() => (user ? navigate("/trang-ca-nhan") : login())}
            >
              <span className="forum-nav-icon">
                <Icon name="user" size={18} />
              </span>
              <span>Trang cá nhân</span>
            </button>

            <button
              type="button"
              onClick={() => (user ? navigate("/tin-nhan") : login())}
            >
              <span className="forum-nav-icon">
                <Icon name="chat" size={18} />
              </span>
              <span>Tin nhắn</span>
            </button>
          </nav>

          <div className="forum-left-divider" />

          <div className="forum-banner">
            <div className="forum-banner-head">
              <Icon name="shield" size={15} />
              <strong>Giữ thông tin riêng tư</strong>
            </div>
            <p>
              Chia sẻ khu vực và tầm giá là đủ. Nếu gặp nội dung vi phạm, bạn có
              thể gửi báo cáo để quản trị viên xem xét.
            </p>
            <button
              type="button"
              onClick={() => (user ? navigate("/bao-cao-cua-toi") : login())}
            >
              Báo cáo của tôi
            </button>
          </div>
        </aside>

        <section className="feed">
          {id ? (
            <button
              type="button"
              className="forum-back-btn"
              onClick={() => navigate("/dien-dan")}
            >
              <Icon name="chevron" size={16} />
              <span>Quay lại bảng tin</span>
            </button>
          ) : (
            <div className="fb-feed-composer">
              <div className="fb-composer-top-row">
                <div className="fb-composer-avatar-wrap">
                  <ProfileAvatar
                    name={user?.name}
                    initials={user?.initials}
                    avatarUrl={currentUserAvatarUrl}
                    isGuest={!user}
                  />
                </div>

                <button
                  type="button"
                  className="fb-composer-input-pill"
                  onClick={() => {
                    if (!user) return login()
                    setError("")
                    setComposerOpen(true)
                  }}
                >
                  {user
                    ? `${givenName} ơi, bạn đang nghĩ gì thế?`
                    : "Đăng nhập để chia sẻ với cộng đồng..."}
                </button>
              </div>

              <div className="fb-composer-divider" />

              <div className="fb-composer-action-bar">
                <button
                  type="button"
                  className="fb-composer-action-btn"
                  onClick={() => {
                    if (!user) return login()
                    setError("")
                    setShowDropzone(false)
                    setComposerOpen(true)
                  }}
                >
                  <Icon name="edit" size={17} />
                  <span>Viết bài chia sẻ</span>
                </button>

                <button
                  type="button"
                  className="fb-composer-action-btn"
                  onClick={() => {
                    if (!user) return login()
                    setError("")
                    setShowDropzone(true)
                    setComposerOpen(true)
                    setTimeout(() => fileInputRef.current?.click(), 120)
                  }}
                >
                  <Icon name="image" size={17} />
                  <span>Đính kèm ảnh</span>
                </button>
              </div>
            </div>
          )}

          {composerOpen && (
            <div
              className="dialog-backdrop"
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  closeComposerDialog()
                }
              }}
            >
              <section
                className="action-dialog fb-post-create-dialog"
                ref={composerRef}
                aria-label="Tạo bài viết"
                role="dialog"
                aria-modal="true"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="fb-post-create-head">
                  <h2>Tạo bài viết</h2>
                  <button
                    type="button"
                    className="dialog-close"
                    onClick={closeComposerDialog}
                    aria-label="Đóng"
                  >
                    <Icon name="close" size={18} />
                  </button>
                </div>

                <div className="fb-create-author-row">
                  <div className="fb-composer-avatar-wrap">
                    <ProfileAvatar
                      name={user?.name}
                      initials={user?.initials}
                      avatarUrl={currentUserAvatarUrl}
                      isGuest={!user}
                    />
                  </div>
                  <div className="fb-create-author-meta">
                    <strong>{user?.name}</strong>
                    <div className="fb-audience-pill">
                      <Icon name="users" size={12} />
                      <span>Công khai</span>
                    </div>
                  </div>
                </div>

                <form className="fb-post-create-form" onSubmit={publish}>
                  <div className="fb-composer-input-area">
                    <textarea
                      autoFocus
                      rows={image || showDropzone ? 3 : 4}
                      maxLength={5000}
                      value={draft}
                      onChange={(event) => {
                        setDraft(event.target.value)
                        if (error) setError("")
                      }}
                      placeholder={
                        image
                          ? "Thêm mô tả ngắn cho bức ảnh này..."
                          : `${givenName} ơi, bạn đang nghĩ gì thế?`
                      }
                      className="fb-composer-textarea"
                    />
                  </div>

                  {image && (
                    <div className="fb-create-image-preview">
                      <img src={image} alt="Ảnh đính kèm" />
                      <button
                        type="button"
                        className="fb-remove-img-btn"
                        onClick={() => {
                          setImage("")
                          setShowDropzone(false)
                          if (fileInputRef.current)
                            fileInputRef.current.value = ""
                        }}
                        title="Gỡ ảnh"
                        aria-label="Gỡ ảnh"
                      >
                        <Icon name="close" size={14} />
                      </button>
                    </div>
                  )}

                  {uploadingImage && (
                    <div className="fb-uploading-card">
                      <div className="fb-uploading-spinner" />
                      <span>Đang tải ảnh lên...</span>
                    </div>
                  )}

                  {!image && !uploadingImage && showDropzone && (
                    <div
                      className="fb-dropzone-box"
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault()
                        const file = e.dataTransfer.files?.[0]
                        if (file) void handleImageFile(file)
                      }}
                    >
                      <button
                        type="button"
                        className="fb-dropzone-close"
                        onClick={(e) => {
                          e.stopPropagation()
                          setShowDropzone(false)
                        }}
                        title="Hủy thêm ảnh"
                        aria-label="Hủy thêm ảnh"
                      >
                        <Icon name="close" size={14} />
                      </button>
                      <div className="fb-dropzone-icon">
                        <Icon name="image" size={24} />
                      </div>
                      <strong>Thêm ảnh vào bài viết</strong>
                      <span>Bấm hoặc kéo thả ảnh (JPG, PNG tối đa 3 MB)</span>
                    </div>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/avif"
                    disabled={uploadingImage || publishing}
                    style={{ display: "none" }}
                    onChange={(event) => {
                      const file = event.target.files?.[0]
                      if (file) void handleImageFile(file)
                    }}
                  />

                  <div className="fb-create-attachment-bar">
                    <span className="fb-attach-label">
                      Thêm vào bài viết của bạn
                    </span>
                    <div className="fb-attachment-actions">
                      <button
                        type="button"
                        className={`fb-attach-action-btn ${
                          image || showDropzone ? "active" : ""
                        }`}
                        onClick={() => {
                          if (!image) setShowDropzone(true)
                          fileInputRef.current?.click()
                        }}
                        title={image ? "Đổi ảnh" : "Thêm ảnh"}
                      >
                        <span className="fb-attach-icon-circle green">
                          <Icon name="image" size={18} />
                        </span>
                        <span>{image ? "Đổi ảnh" : "Ảnh"}</span>
                      </button>
                    </div>
                  </div>

                  {image && draft.trim().length < 2 && !error && (
                    <p className="fb-composer-hint">
                      Nhập thêm đôi dòng mô tả (tối thiểu 2 ký tự) để đăng bài
                      viết.
                    </p>
                  )}

                  {error && (
                    <p className="form-message error" role="alert">
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    className="fb-post-submit-btn"
                    disabled={
                      draft.trim().length < 2 || publishing || uploadingImage
                    }
                  >
                    {publishing ? "Đang đăng bài viết…" : "Đăng bài viết"}
                  </button>
                </form>
              </section>
            </div>
          )}

          {isInitialLoading && (
            <div
              className="forum-skeleton-list"
              aria-busy="true"
              aria-label="Đang tải bảng tin"
            >
              {[0, 1].map((idx) => (
                <div className="forum-skeleton-card" key={idx}>
                  <div className="forum-skeleton-head">
                    <div className="forum-skeleton-avatar" />
                    <div className="forum-skeleton-meta">
                      <div className="forum-skeleton-line w-36" />
                      <div className="forum-skeleton-line w-20" />
                    </div>
                  </div>
                  <div className="forum-skeleton-body">
                    <div className="forum-skeleton-line w-full" />
                    <div className="forum-skeleton-line w-4-5" />
                  </div>
                  <div className="forum-skeleton-media" />
                </div>
              ))}
            </div>
          )}

          {displayedPosts.map((post, index) => (
            <PostCard
              key={post.id}
              post={post}
              onLogin={login}
              isDetail={Boolean(id && id === post.id)}
              eagerImage={index < 2}
            />
          ))}

          {hasMore && (
            <div ref={sentinelRef} className="forum-lazy-loader" role="status">
              <div className="forum-lazy-spinner" aria-hidden="true" />
              <span>Đang tải thêm bài viết...</span>
              <button
                type="button"
                className="forum-btn-load-more"
                onClick={() => {
                  setIsLoadingMore(true)
                  setTimeout(() => {
                    setVisibleCount((prev) => prev + PAGE_SIZE)
                    setIsLoadingMore(false)
                  }, 200)
                }}
              >
                Xem thêm ({publicPosts.length - visibleCount} bài còn lại)
              </button>
            </div>
          )}

          {!hasMore && publicPosts.length > PAGE_SIZE && (
            <div className="forum-end-of-feed">
              <Icon name="check" size={16} />
              <span>
                Bạn đã xem hết tất cả {publicPosts.length} bài viết trên diễn
                đàn
              </span>
            </div>
          )}

          {!isInitialLoading && !publicPosts.length && (
            <section className="empty-state forum-empty-state">
              <span className="placeholder-icon">
                <Icon name="search" size={26} />
              </span>
              <h2>Chưa có bài viết phù hợp</h2>
              <p>
                {id
                  ? "Bài viết này không còn hiển thị hoặc đã bị gỡ khỏi bảng tin."
                  : "Hãy viết bài mới để mở đầu cuộc thảo luận trong cộng đồng."}
              </p>
              {id ? (
                <Button onClick={() => navigate("/dien-dan")}>
                  Quay lại bảng tin
                </Button>
              ) : (
                <Button
                  onClick={() => (user ? setComposerOpen(true) : login())}
                >
                  Viết bài ngay
                </Button>
              )}
            </section>
          )}
        </section>

        <aside className="forum-right">
          <div className="side-card">
            <div className="side-title">
              <h3>Bài viết được quan tâm</h3>
            </div>

            <div className="trending-posts-list">
              {trendingPosts.map((post, index) => {
                const firstLine = post.content.split("\n")[0].trim()
                const cleanLine = stripLeadingBracketTag(firstLine)
                const titleText =
                  cleanLine.length > 90
                    ? cleanLine.slice(0, 90).trim() + "..."
                    : cleanLine

                return (
                  <Link
                    to={`/bai-viet/${post.id}`}
                    className={`trending-post${
                      id === post.id ? " is-current" : ""
                    }`}
                    key={post.id}
                  >
                    <span className="trending-rank">
                      {String(index + 1).padStart(2, "0")}
                    </span>

                    <div className="trending-post-body">
                      <strong>{titleText}</strong>

                      <small>
                        <span>{post.name}</span>
                        <span aria-hidden="true">·</span>
                        <span>{post.likes + post.commentsCount} tương tác</span>
                      </small>
                    </div>
                  </Link>
                )
              })}
            </div>

            {!trendingPosts.length && !isInitialLoading && (
              <p className="forum-side-empty">Chưa có bài viết nổi bật.</p>
            )}
          </div>

          <div className="side-card sponsored-side-card">
            <div className="side-title">
              <h3>Được tài trợ</h3>
            </div>

            <div className="sponsored-ads-list">
              {SPONSORED_ADS.map((ad) => (
                <a
                  key={ad.id}
                  href={ad.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="sponsored-ad-item"
                >
                  <div className="sponsored-ad-thumb">
                    <img src={ad.image} alt={ad.title} loading="lazy" />
                  </div>

                  <div className="sponsored-ad-content">
                    <h4 className="sponsored-ad-title">{ad.title}</h4>
                    <span className="sponsored-ad-domain">{ad.domain}</span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </main>
  )
}
