import useDialogFocus from "@/hooks/useDialogFocus"
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react"
import { Link, useNavigate, useParams } from "react-router"
import { Button, Icon } from "@/components/common/legacy"
import ReportDialog from "@/components/common/ReportDialog"
import { usePlatform, type ForumPost, type PostComment } from "@/contexts/PlatformContext"
import { useToast } from "@/contexts/ToastContext"
import useAuth from "@/hooks/useAuth"
import { apiRequest, isApiMode } from "@/services/apiClient"
import { formatRelativeTime } from "@/utils/formatTime"

function ProfileAvatar({ initials, avatarUrl, className = "" }: { initials: string; avatarUrl?: string; className?: string }) {
  return <span className={`avatar ${className}`.trim()}>{avatarUrl ? <img className="user-avatar-image" src={avatarUrl} alt="" loading="lazy" decoding="async" /> : initials}</span>
}

function PostCard({ post, onLogin, isDetail = false }: { post: ForumPost; onLogin: () => void; isDetail?: boolean }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toast } = useToast()
  const { users, togglePostLike, addComment, deleteComment, editComment, savePost, deletePost, startConversation } = usePlatform()
  const [menuOpen, setMenuOpen] = useState(false)
  const [commentsOpen, setCommentsOpen] = useState(false)
  const [comment, setComment] = useState("")
  const [replyingTo, setReplyingTo] = useState<{ id: string; author: string } | null>(null)
  const [busyAction, setBusyAction] = useState("")
  const [actionError, setActionError] = useState("")
  const commentInputRef = useRef<HTMLInputElement | null>(null)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(post.content)
  const [reportOpen, setReportOpen] = useState(false)
  const [reportedComment, setReportedComment] = useState<{ id: string; text: string } | null>(null)
  const [editingComment, setEditingComment] = useState("")
  const [commentDraft, setCommentDraft] = useState("")
  const [copied, setCopied] = useState(false)
  const editDialogRef = useRef<HTMLElement>(null)
  useDialogFocus(editDialogRef, () => setEditing(false), editing)
  const isOwner = user?.id === post.authorId
  const liked = user ? post.likedBy.includes(user.id) : false
  const author = users.find((item) => item.id === post.authorId)
  const role = author?.role
  const authorAvatarUrl = post.avatarUrl ?? author?.avatarUrl
  const currentUserAvatarUrl = user?.avatarUrl ?? users.find((item) => item.id === user?.id)?.avatarUrl

  const isLong = post.content.length > 220 || post.content.split("\n").length > 4
  const [expanded, setExpanded] = useState(isDetail)

  // Build comment tree: root comments and replies grouped by parentId
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
    setBusyAction("comment"); setActionError("")
    try {
      await addComment(post.id, user, comment.trim(), replyingTo?.id)
      setComment("")
      setReplyingTo(null)
      setCommentsOpen(true)
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Không thể gửi bình luận. Hãy thử lại.")
    } finally { setBusyAction("") }
  }

  const submitEdit = async (event: FormEvent) => {
    event.preventDefault()
    if (!draft.trim() || busyAction) return
    setBusyAction("edit"); setActionError("")
    try {
      await savePost({ ...post, content: draft.trim() })
      setEditing(false)
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Không thể lưu bài viết. Hãy thử lại.")
    } finally { setBusyAction("") }
  }

  const messageAuthor = async () => {
    if (!user) return onLogin()
    try {
      const conversation = await startConversation({ accountId: user.id, name: post.name, avatar: post.initials, avatarUrl: authorAvatarUrl, userId: post.authorId, roomId: "" })
      if (conversation) navigate(`/tin-nhan?conversation=${conversation}`)
    } catch (error) { setActionError(error instanceof Error ? error.message : "Không thể mở cuộc trò chuyện.") }
  }

  const renderComment = (item: PostComment, isReply = false, rootId?: string) => {
    const isPostAuthor = item.authorId === post.authorId
    const isOwnComment = item.authorId === user?.id
    const commentUser = users.find((member) => member.id === item.authorId)
    const commentAvatar = item.avatarUrl ?? commentUser?.avatarUrl

    return (
      <div className={`fb-comment-item ${isReply ? "is-reply" : ""}`} key={item.id}>
        <Link className="profile-avatar-link fb-comment-avatar-link" to={`/nguoi-dung/${item.authorId}`} aria-label={`Xem hồ sơ ${item.author}`}>
          <ProfileAvatar className={isReply ? "fb-avatar-sm" : "peach"} initials={item.initials} avatarUrl={commentAvatar} />
        </Link>
        <div className="fb-comment-content-wrap">
          <div className="fb-comment-bubble">
            <div className="fb-bubble-header">
              <Link className="fb-comment-author" to={`/nguoi-dung/${item.authorId}`}>
                {item.author}
              </Link>
              {isPostAuthor && <span className="fb-author-badge">Tác giả</span>}
            </div>

            {editingComment === item.id ? (
              <form
                className="fb-comment-edit-form"
                onSubmit={async (event) => {
                  event.preventDefault()
                  if (!commentDraft.trim() || busyAction) return
                  setBusyAction("edit-comment"); setActionError("")
                  try { await editComment(post.id, item.id, commentDraft.trim()); setEditingComment("") }
                  catch (error) { setActionError(error instanceof Error ? error.message : "Không thể lưu bình luận.") }
                  finally { setBusyAction("") }
                }}
              >
                <input
                  value={commentDraft}
                  onChange={(event) => setCommentDraft(event.target.value)}
                  autoFocus
                  autoComplete="off"
                  spellCheck={false}
                />
                <div className="fb-edit-actions">
                  <button type="button" className="fb-edit-cancel" onClick={() => setEditingComment("")}>
                    Hủy
                  </button>
                  <button type="submit" className="fb-edit-save" disabled={!commentDraft.trim() || Boolean(busyAction)}>
                    Lưu
                  </button>
                </div>
              </form>
            ) : (
              <p className="fb-comment-text">{item.text}</p>
            )}


          </div>

          <div className="fb-comment-actions">
            <span className="fb-comment-time">{formatRelativeTime(item.createdAt)}</span>

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
                    try { await deleteComment(post.id, item.id); toast("Đã xóa bình luận.", "info") }
                    catch (error) { setActionError(error instanceof Error ? error.message : "Không thể xóa bình luận.") }
                  }}
                >
                  Xóa
                </button>
              </>
            ) : (
              <button
                type="button"
                className="fb-action-btn fb-action-report"
                onClick={() => setReportedComment({ id: item.id, text: item.text })}
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

  return (
    <article className="post-card">
      {actionError && <p className="form-message error" role="alert">{actionError}</p>}
      <div className="post-head">
        <div className="fb-post-avatar-wrapper">
          <Link className="profile-avatar-link" to={`/nguoi-dung/${post.authorId}`} aria-label={`Xem hồ sơ ${post.name}`}>
            <ProfileAvatar className="peach" initials={post.initials} avatarUrl={authorAvatarUrl} />
          </Link>
          
        </div>
        <div className="post-author-wrap">
          <div className="post-author">
            <Link className="post-author-name" to={`/nguoi-dung/${post.authorId}`}>
              {post.name}
            </Link>
            <span className="role-badge">{role ? (role === "landlord" ? "Chủ trọ" : "Người thuê") : "Thành viên"}</span>
          </div>
          <div className="post-meta-sub">
            <span className="post-relative-time">{formatRelativeTime(post.createdAt || post.time)}</span>
            <span className="post-meta-dot">·</span>
            <span className="post-privacy-icon" title="Công khai">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ verticalAlign: "-1px" }}>
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
            </span>
          </div>
        </div>
        {!isOwner && <button className="post-message-action" onClick={messageAuthor}><Icon name="chat" size={16}/><span>Nhắn tin</span></button>}
        <div className="post-menu-wrap"><button aria-label="Tùy chọn bài viết" aria-expanded={menuOpen} onClick={() => setMenuOpen((value) => !value)}><Icon name="more"/></button>{menuOpen && <div className="post-menu">{isOwner ? <><button onClick={() => { setDraft(post.content); setEditing(true); setMenuOpen(false) }}><Icon name="edit" size={16}/>Sửa bài viết</button><button onClick={async () => { if (!window.confirm("Xóa bài viết này?")) return; try { await deletePost(post.id); toast("Đã xóa bài viết.", "info") } catch (error) { setActionError(error instanceof Error ? error.message : "Không thể xóa bài viết.") } }}><Icon name="trash" size={16}/>Xóa bài viết</button></> : <button onClick={() => { setReportOpen(true); setMenuOpen(false) }}><Icon name="shield" size={16}/>Báo cáo bài viết</button>}</div>}</div>
      </div>
      <div className="post-copy-wrapper">
        <p className={`post-copy${!expanded && isLong ? " is-collapsed" : ""}`}>{post.content}</p>
        {isLong && (
          <button
            type="button"
            className="post-expand-btn"
            onClick={() => setExpanded((prev) => !prev)}
            aria-expanded={expanded}
          >
            {expanded ? "Ẩn bớt" : "... Xem thêm"}
          </button>
        )}
      </div>
      {post.image && <img className="post-image" src={post.image} alt={`Ảnh bài viết của ${post.name}`} loading="lazy" decoding="async"/>}
      <div className="reaction-count"><span className="post-like-count" aria-label={`${post.likes} lượt yêu thích`}><Icon name="heart" size={14}/><b>{post.likes}</b></span><button aria-expanded={commentsOpen} onClick={() => setCommentsOpen((value) => !value)}>{post.commentsCount} bình luận</button></div>
      <div className="reaction-bar"><button className={liked ? "liked" : ""} onClick={async () => { if (!user) return onLogin(); try { await togglePostLike(post.id, user) } catch (error) { setActionError(error instanceof Error ? error.message : "Không thể cập nhật lượt yêu thích.") } }}><Icon name="heart"/>{liked ? "Đã yêu thích" : "Yêu thích"}</button><button aria-expanded={commentsOpen} onClick={() => setCommentsOpen((value) => !value)}><Icon name="chat"/>Bình luận</button><button onClick={async () => { try { if (!navigator.clipboard) throw new Error("Trình duyệt chưa cho phép sao chép. Hãy sao chép địa chỉ bài viết trên thanh địa chỉ."); await navigator.clipboard.writeText(`${window.location.origin}/bai-viet/${post.id}`); setCopied(true); toast("Đã sao chép liên kết bài viết.", "success"); window.setTimeout(() => setCopied(false), 1600) } catch (error) { setActionError(error instanceof Error ? error.message : "Không thể sao chép liên kết.") } }}><Icon name="share"/>{copied ? "Đã sao chép" : "Chia sẻ"}</button></div>
      {commentsOpen && (
        <div className="post-comments fb-comments-section">
          {/* Facebook-style Compose Input */}
          <form className="fb-comment-compose-box" onSubmit={submitComment}>
            {user ? (
              <Link className="profile-avatar-link" to={`/nguoi-dung/${user.id}`} aria-label="Mở hồ sơ của bạn">
                <ProfileAvatar initials={user.initials} avatarUrl={currentUserAvatarUrl} />
              </Link>
            ) : (
              <span className="avatar">?</span>
            )}

            <div className="fb-compose-input-wrapper">
              {replyingTo && (
                <div className="fb-replying-banner">
                  <span>
                    Đang trả lời <b>{replyingTo.author}</b>
                  </span>
                  <button type="button" onClick={cancelReply} className="fb-reply-cancel-btn" title="Hủy trả lời">
                    <Icon name="close" size={14} />
                  </button>
                </div>
              )}
              <div className="fb-input-row">
                <input
                  ref={commentInputRef}
                  aria-label="Nội dung bình luận"
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  placeholder={
                    user
                      ? replyingTo
                        ? `Trả lời ${replyingTo.author}...`
                        : `Bình luận dưới tên ${user.name}...`
                      : "Đăng nhập để bình luận"
                  }
                  onFocus={() => {
                    if (!user) onLogin()
                  }}
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
                  <Icon name="send" size={15} />
                </button>
              </div>
            </div>
          </form>

          {/* Facebook-style Comment Threads */}
          <div className="fb-comments-tree">
            {rootComments.map((root) => {
              const replies = replyMap[root.id] || []
              return (
                <div className="fb-comment-thread" key={root.id}>
                  {renderComment(root, false, root.id)}

                  {replies.length > 0 && (
                    <div className="fb-replies-list">
                      {replies.map((reply) => renderComment(reply, true, root.id))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {editing && <div className="dialog-backdrop"><section className="action-dialog" ref={editDialogRef} role="dialog" aria-modal="true" aria-label="Chỉnh sửa bài viết"><button className="dialog-close" aria-label="Đóng" onClick={() => setEditing(false)}><Icon name="close"/></button><h2>Chỉnh sửa nội dung</h2><form className="dialog-form" onSubmit={submitEdit}><label className="form-field"><span>Nội dung</span><textarea rows={6} value={draft} onChange={(event) => setDraft(event.target.value)}/></label><div className="dialog-actions"><Button type="button" variant="outline" onClick={() => setEditing(false)}>Hủy</Button><Button disabled={Boolean(busyAction)}>{busyAction === "edit" ? "Đang lưu…" : "Lưu thay đổi"}</Button></div></form></section></div>}
      {reportOpen && <ReportDialog targetType="Bài viết" targetId={post.id} targetTitle={post.content.slice(0, 100)} onClose={() => setReportOpen(false)}/>}
      {reportedComment && <ReportDialog targetType="Bình luận" targetId={reportedComment.id} targetTitle={reportedComment.text.slice(0, 100)} onClose={() => setReportedComment(null)}/>}
    </article>
  )
}

export default function ForumPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { id } = useParams()
  const { user } = useAuth()
  const { posts, users, savePost, startConversation } = usePlatform()
  const [query, setQuery] = useState("")
  const [composerOpen, setComposerOpen] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [draft, setDraft] = useState("")
  const [image, setImage] = useState("")
  const [uploadingImage, setUploadingImage] = useState(false)
  const composerRef = useRef<HTMLElement>(null)
  useDialogFocus(composerRef, () => setComposerOpen(false), composerOpen)
  const [error, setError] = useState("")
  const publicPosts = useMemo(
    () =>
      posts
        .filter((post) => post.status === "active" && (!id || post.id === id))
        .filter((post) => !query || `${post.content} ${post.name}`.toLocaleLowerCase("vi").includes(query.toLocaleLowerCase("vi"))),
    [posts, id, query],
  )
  const trendingPosts = useMemo(() => [...posts].filter((post) => post.status === "active").sort((a, b) => (b.likes + b.commentsCount) - (a.likes + a.commentsCount)).slice(0, 3), [posts])
  const login = () => navigate("/dang-nhap", { state: { from: window.location.pathname } })
  const currentUserAvatarUrl = user?.avatarUrl ?? users.find((item) => item.id === user?.id)?.avatarUrl

  const PAGE_SIZE = 5
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  // Reset pagination when filter or search changes
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
    if (!draft.trim()) { setError("Hãy viết nội dung trước khi đăng."); return }
    if (publishing || uploadingImage) return
    setPublishing(true)
    try {
      await savePost({ id: `post-${Date.now()}`, authorId: user.id, name: user.name, initials: user.initials, avatarUrl: currentUserAvatarUrl, time: "Vừa xong", content: draft.trim(), image, likes: 0, likedBy: [], commentsCount: 0, comments: [], status: "active", createdAt: new Date().toISOString() })
      setDraft("")
      setComposerOpen(false)
      setError("")
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Không thể đăng bài viết.")
    } finally { setPublishing(false) }
  }

  return (
    <main className="page-bg forum-page">
      <div className="container forum-layout">
        <aside className="forum-left"><h3>Diễn đàn</h3><button className="active" onClick={() => navigate("/dien-dan")}><Icon name="home"/>Bảng tin</button><button onClick={() => navigate("/tim-ban-be")}><Icon name="users"/>Bạn bè</button><button onClick={() => user ? navigate("/trang-ca-nhan") : login()}><Icon name="user"/>Trang cá nhân</button><button onClick={() => user ? navigate("/tin-nhan") : login()}><Icon name="chat"/>Tin nhắn</button><div className="forum-banner"><Icon name="shield"/><strong>Giữ thông tin riêng tư</strong><p>Chia sẻ khu vực và tầm giá là đủ. Nếu gặp nội dung vi phạm, bạn có thể gửi báo cáo để quản trị viên xem xét.</p><button onClick={() => user ? navigate("/bao-cao-cua-toi") : login()}>Báo cáo của tôi</button></div></aside>
        <section className="feed">
          {id && (
            <button
              type="button"
              className="forum-back-btn"
              onClick={() => navigate("/dien-dan")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "16px",
                background: "none",
                border: "none",
                color: "#245f3b",
                fontWeight: 600,
                fontSize: "14px",
                cursor: "pointer",
                padding: 0,
              }}
            >
              <Icon name="arrowLeft" size={16} /> Quay lại bảng tin
            </button>
          )}

          {/* Facebook Feed Composer */}
          <div className="fb-feed-composer">
            <div className="fb-composer-top-row">
              <div className="fb-composer-avatar-wrap">
                <ProfileAvatar initials={user?.initials ?? "?"} avatarUrl={currentUserAvatarUrl} />
                {user && <span className="fb-composer-online-dot" />}
              </div>
              <button
                type="button"
                className="fb-composer-input-pill"
                onClick={() => (user ? setComposerOpen(true) : login())}
              >
                {user ? `${user.name} ơi, bạn đang nghĩ gì thế?` : "Đăng nhập để chia sẻ với cộng đồng..."}
              </button>
            </div>

            <div className="fb-composer-divider" />

            <div className="fb-composer-action-bar">
              <button type="button" className="fb-composer-action-btn" onClick={() => user ? setComposerOpen(true) : login()}><Icon name="edit" size={18}/><span>Viết bài chia sẻ</span></button>
              <button type="button" className="fb-composer-action-btn" onClick={() => user ? setComposerOpen(true) : login()}><Icon name="image" size={18}/><span>Đính kèm ảnh</span></button>
            </div>
          </div>

          
          {/* Facebook Create Post Modal */}
          {composerOpen && (
            <div className="dialog-backdrop" onClick={(e) => { if (e.target === e.currentTarget) setComposerOpen(false) }}>
              <section className="action-dialog fb-post-create-dialog" ref={composerRef} aria-label="Tạo bài viết" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
                <div className="fb-post-create-head">
                  <h2>Tạo bài viết</h2>
                  <button type="button" className="dialog-close" onClick={() => setComposerOpen(false)} aria-label="Đóng">
                    <Icon name="close" />
                  </button>
                </div>

                <div className="fb-create-author-row">
                  <div className="fb-composer-avatar-wrap">
                    <ProfileAvatar initials={user?.initials ?? "?"} avatarUrl={currentUserAvatarUrl} />
                    <span className="fb-composer-online-dot" />
                  </div>
                  <div>
                    <strong>{user?.name}</strong>
                    <div className="fb-audience-pill">
                      <span>Công khai</span>
                    </div>
                  </div>
                </div>

                <form className="fb-post-create-form" onSubmit={publish}>
                  <textarea
                    autoFocus
                    rows={4}
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    placeholder={`${user?.name || "Bạn"} ơi, bạn đang nghĩ gì thế? Chia sẻ kinh nghiệm thuê trọ, tìm bạn ghép hoặc pass phòng...`}
                  />

                  {image && (
                    <div className="fb-create-image-preview">
                      <img src={image} alt="Ảnh đính kèm" />
                      <button type="button" className="fb-remove-img-btn" onClick={() => setImage("")} title="Gỡ ảnh">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>
                  )}

                  <label className="form-field community-image-upload">
                    <span>Ảnh đính kèm <small>(không bắt buộc)</small></span>
                    <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" disabled={uploadingImage || publishing} onChange={async (event) => {
                      const file = event.target.files?.[0]
                      if (!file) return
                      if (file.size > 3_000_000 || !file.type.startsWith("image/")) { setError("Chọn một ảnh JPG, PNG hoặc WebP nhỏ hơn 3 MB."); return }
                      setUploadingImage(true); setError("")
                      try {
                        if (isApiMode) {
                          const body = new FormData(); body.append("file", file)
                          const result = await apiRequest<{ url: string }>("uploads/image", { method: "POST", body }); setImage(result.url)
                        } else {
                          const url = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(new Error("Không thể đọc ảnh.")); reader.readAsDataURL(file) }); setImage(url)
                        }
                      } catch (error) { setError(error instanceof Error ? error.message : "Không thể tải ảnh. Hãy thử lại.") }
                      finally { setUploadingImage(false) }
                    }} />
                    <small>{uploadingImage ? "Đang tải ảnh…" : "Chia sẻ ảnh bạn có quyền sử dụng, tối đa 3 MB."}</small>
                  </label>

                  {error && <p className="form-message error">{error}</p>}

                  <button type="submit" className="fb-post-submit-btn" disabled={!draft.trim() || publishing || uploadingImage}>
                    {publishing ? "Đang đăng…" : "Đăng bài viết"}
                  </button>
                </form>
              </section>
            </div>
          )}

          {displayedPosts.map((post) => (
            <PostCard key={post.id} post={post} onLogin={login} isDetail={Boolean(id && id === post.id)} />
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
              <span>Bạn đã xem hết tất cả {publicPosts.length} bài viết trên diễn đàn</span>
            </div>
          )}
          {!publicPosts.length && (
            <section className="empty-state">
              <span className="placeholder-icon">
                <Icon name="search" size={28} />
              </span>
              <h2>Chưa tìm thấy bài viết</h2>
              <p>Thử tìm kiếm với từ khóa khác hoặc viết bài mới để mở đầu cuộc thảo luận trong cộng đồng.</p>
              {!id && (
                <Button onClick={() => (user ? setComposerOpen(true) : login())}>
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
            {trendingPosts.map((post, index) => {
              const snippet = post.content.split("\n")[0].trim()
              const titleText = snippet.length > 90 ? snippet.slice(0, 90).trim() + "..." : snippet
              return (
                <Link to={`/bai-viet/${post.id}`} className="trending-post" key={post.id}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <div>
                    <strong>{titleText}</strong>
                    <small>
                      <span>{post.name}</span>
                      <span>•</span>
                      <span>{post.likes + post.commentsCount} tương tác</span>
                    </small>
                  </div>
                </Link>
              )
            })}
            {!trendingPosts.length && <p className="forum-side-empty">Chưa có bài viết để hiển thị.</p>}
          </div>

          <div className="side-card">
            <h3>Người thuê và chủ trọ</h3>
            {users
              .filter((item) => item.status === "active" && item.role !== "admin" && item.id !== user?.id)
              .slice(0, 3)
              .map((item) => (
                <div className="member" key={item.id}>
                  <Link className="profile-avatar-link" to={`/nguoi-dung/${item.id}`} aria-label={`Xem hồ sơ ${item.name}`}>
                    <ProfileAvatar initials={item.initials} avatarUrl={item.avatarUrl} />
                  </Link>
                  <div>
                    <Link className="member-profile-name" to={`/nguoi-dung/${item.id}`}>
                      {item.name}
                    </Link>
                    <small>{item.role === "landlord" ? "Chủ trọ" : "Người thuê"}</small>
                  </div>
                  <button
                    onClick={async () => {
                      if (!user) return login()
                      try {
                      const conversation = await startConversation({
                        accountId: user.id,
                        name: item.name,
                        avatar: item.initials,
                        avatarUrl: item.avatarUrl,
                        userId: item.id,
                        roomId: "",
                      })
                      if (conversation) navigate(`/tin-nhan?conversation=${conversation}`)
                      } catch (caught) { toast(caught instanceof Error ? caught.message : "Không thể mở cuộc trò chuyện.", "error") }
                    }}
                  >
                    Nhắn tin
                  </button>
                </div>
              ))}
          </div>
        </aside>
      </div>
    </main>
  )
}
