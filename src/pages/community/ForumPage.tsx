import { useEffect, useMemo, useRef, useState, type FormEvent } from "react"
import { Link, useNavigate, useParams } from "react-router"
import { Button, Icon } from "@/components/common/legacy"
import ReportDialog from "@/components/common/ReportDialog"
import { usePlatform, type ForumPost } from "@/contexts/PlatformContext"
import { useToast } from "@/contexts/ToastContext"
import useAuth from "@/hooks/useAuth"
import { photos } from "@/mocks/content"
import { isApiMode } from "@/services/apiClient"

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
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(post.content)
  const [reportOpen, setReportOpen] = useState(false)
  const [reportedComment, setReportedComment] = useState<{ id: string; text: string } | null>(null)
  const [editingComment, setEditingComment] = useState("")
  const [commentDraft, setCommentDraft] = useState("")
  const [copied, setCopied] = useState(false)
  const isOwner = user?.id === post.authorId
  const liked = user ? post.likedBy.includes(user.id) : false
  const author = users.find((item) => item.id === post.authorId)
  const role = author?.role
  const authorAvatarUrl = post.avatarUrl ?? author?.avatarUrl
  const currentUserAvatarUrl = user?.avatarUrl ?? users.find((item) => item.id === user?.id)?.avatarUrl

  const isLong = post.content.length > 220 || post.content.split("\n").length > 4
  const [expanded, setExpanded] = useState(isDetail)

  const submitComment = async (event: FormEvent) => {
    event.preventDefault()
    if (!user) return onLogin()
    if (!comment.trim()) return
    try {
      await addComment(post.id, user, comment.trim())
      setComment("")
      setCommentsOpen(true)
    } catch {
      // Shared API status banner explains remote failures.
    }
  }

  const submitEdit = async (event: FormEvent) => {
    event.preventDefault()
    if (!draft.trim()) return
    try {
      await savePost({ ...post, content: draft.trim() })
      setEditing(false)
    } catch {
      // Keep the editor open if saving fails.
    }
  }

  const messageAuthor = async () => {
    if (!user) return onLogin()
    const conversation = await startConversation({ accountId: user.id, name: post.name, avatar: post.initials, avatarUrl: authorAvatarUrl, userId: post.authorId, roomId: "" })
    if (!conversation) return
    navigate(`/tin-nhan?conversation=${conversation}`)
  }

  return (
    <article className="post-card">
      <div className="post-head">
        <Link className="profile-avatar-link" to={`/nguoi-dung/${post.authorId}`} aria-label={`Xem hồ sơ ${post.name}`}><ProfileAvatar className="peach" initials={post.initials} avatarUrl={authorAvatarUrl}/></Link>
        <div className="post-author-wrap"><div className="post-author"><Link className="post-author-name" to={`/nguoi-dung/${post.authorId}`}>{post.name}</Link><span className="role-badge">{role ? (role === "landlord" ? "Chủ trọ" : "Người thuê") : "Thành viên"}</span></div><span>{post.time}</span></div>
        {!isOwner && <button className="post-message-action" onClick={messageAuthor}><Icon name="chat" size={16}/><span>Nhắn tin</span></button>}
        <div className="post-menu-wrap"><button aria-label="Tùy chọn bài viết" aria-expanded={menuOpen} onClick={() => setMenuOpen((value) => !value)}><Icon name="more"/></button>{menuOpen && <div className="post-menu">{isOwner ? <><button onClick={() => { setDraft(post.content); setEditing(true); setMenuOpen(false) }}><Icon name="edit" size={16}/>Sửa bài viết</button><button onClick={() => { if (window.confirm("Xóa bài viết này?")) { deletePost(post.id); toast("Đã xóa bài viết.", "info"); } }}><Icon name="trash" size={16}/>Xóa bài viết</button></> : <button onClick={() => { setReportOpen(true); setMenuOpen(false) }}><Icon name="shield" size={16}/>Báo cáo bài viết</button>}</div>}</div>
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
      <div className="reaction-count"><span className="post-like-count" aria-label={`${post.likes} lượt thích`}><Icon name="heart" size={14}/><b>{post.likes}</b></span><button aria-expanded={commentsOpen} onClick={() => setCommentsOpen((value) => !value)}>{post.commentsCount} bình luận</button></div>
      <div className="reaction-bar"><button className={liked ? "liked" : ""} onClick={() => user ? togglePostLike(post.id, user) : onLogin()}><Icon name="thumbs"/>{liked ? "Đã thích" : "Thích"}</button><button aria-expanded={commentsOpen} onClick={() => setCommentsOpen((value) => !value)}><Icon name="chat"/>Bình luận</button><button onClick={async () => { await navigator.clipboard?.writeText(`${window.location.origin}/bai-viet/${post.id}`); setCopied(true); toast("Đã sao chép liên kết bài viết vào bộ nhớ tạm!", "success"); window.setTimeout(() => setCopied(false), 1600) }}><Icon name="share"/>{copied ? "Đã sao chép" : "Chia sẻ"}</button></div>
      {commentsOpen && <div className="post-comments">
        <form className="comment-compose" onSubmit={submitComment}>
          {user ? <Link className="profile-avatar-link" to={`/nguoi-dung/${user.id}`} aria-label="Mở hồ sơ của bạn"><ProfileAvatar initials={user.initials} avatarUrl={currentUserAvatarUrl}/></Link> : <span className="avatar">?</span>}
          <input aria-label="Nội dung bình luận" value={comment} onChange={(event) => setComment(event.target.value)} placeholder={user ? "Viết bình luận..." : "Đăng nhập để bình luận"} onFocus={() => { if (!user) onLogin() }} autoComplete="off" spellCheck={false}/>
          <button type="submit" aria-label="Gửi bình luận" disabled={!comment.trim()}><Icon name="send"/></button>
        </form>
        {post.comments.map((item) => <div className="feed-comment" key={item.id}>
          <Link className="profile-avatar-link" to={`/nguoi-dung/${item.authorId}`} aria-label={`Xem hồ sơ ${item.author}`}><ProfileAvatar className="peach" initials={item.initials} avatarUrl={item.avatarUrl ?? users.find((member) => member.id === item.authorId)?.avatarUrl}/></Link>
          <div className="feed-comment-body">
            <div className="feed-comment-meta">
              <Link className="feed-comment-author" to={`/nguoi-dung/${item.authorId}`}>{item.author}</Link>
              <small>{item.createdAt}</small>
              {item.authorId === user?.id ? <div className="feed-comment-actions"><button onClick={() => { setEditingComment(item.id); setCommentDraft(item.text) }}>Sửa</button><button aria-label="Xóa bình luận" onClick={() => { if (window.confirm("Xóa bình luận này?")) { deleteComment(post.id, item.id); toast("Đã xóa bình luận.", "info"); } }}><Icon name="trash" size={15}/></button></div> : <button className="feed-comment-report" aria-label="Báo cáo bình luận" onClick={() => setReportedComment({ id: item.id, text: item.text })}><Icon name="shield" size={15}/></button>}
            </div>
            {editingComment === item.id ? <form className="feed-comment-edit" onSubmit={(event) => { event.preventDefault(); if (commentDraft.trim()) editComment(post.id, item.id, commentDraft.trim()); setEditingComment("") }}><input value={commentDraft} onChange={(event) => setCommentDraft(event.target.value)} autoComplete="off" spellCheck={false}/><button>Lưu</button><button type="button" onClick={() => setEditingComment("")}>Hủy</button></form> : <p>{item.text}</p>}
          </div>
        </div>)}
      </div>}

      {editing && <div className="dialog-backdrop"><section className="action-dialog"><button className="dialog-close" aria-label="Đóng" onClick={() => setEditing(false)}><Icon name="close"/></button><span className="eyebrow">Bài viết của bạn</span><h2>Chỉnh sửa nội dung</h2><form className="dialog-form" onSubmit={submitEdit}><label className="form-field"><span>Nội dung</span><textarea rows={6} value={draft} onChange={(event) => setDraft(event.target.value)}/></label><div className="dialog-actions"><Button type="button" variant="outline" onClick={() => setEditing(false)}>Hủy</Button><Button>Lưu thay đổi</Button></div></form></section></div>}
      {reportOpen && <ReportDialog targetType="Bài viết" targetId={post.id} targetTitle={post.content.slice(0, 100)} onClose={() => setReportOpen(false)}/>}
      {reportedComment && <ReportDialog targetType="Bình luận" targetId={reportedComment.id} targetTitle={reportedComment.text.slice(0, 100)} onClose={() => setReportedComment(null)}/>}
    </article>
  )
}

export default function ForumPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { user } = useAuth()
  const { posts, users, savePost, startConversation } = usePlatform()
  const [query, setQuery] = useState("")
  const [composerOpen, setComposerOpen] = useState(false)
  const [draft, setDraft] = useState("")
  const [image, setImage] = useState(isApiMode ? "" : photos[5])
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
    try {
      await savePost({ id: `post-${Date.now()}`, authorId: user.id, name: user.name, initials: user.initials, avatarUrl: currentUserAvatarUrl, time: "Vừa xong", content: draft.trim(), image, likes: 0, likedBy: [], commentsCount: 0, comments: [], status: "active", createdAt: new Date().toISOString() })
      setDraft("")
      setComposerOpen(false)
      setError("")
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Không thể đăng bài viết.")
    }
  }

  return (
    <main className="page-bg forum-page">
      <div className="container forum-layout">
        <aside className="forum-left"><h3>Diễn đàn</h3><button className="active" onClick={() => navigate("/dien-dan")}><Icon name="home"/>Bảng tin</button><button onClick={() => user ? navigate("/trang-ca-nhan") : login()}><Icon name="users"/>Trang cá nhân</button><button onClick={() => user ? navigate("/tin-nhan") : login()}><Icon name="chat"/>Tin nhắn</button><div className="forum-banner"><Icon name="shield"/><strong>Giữ thông tin riêng tư</strong><p>Chia sẻ khu vực và tầm giá là đủ. Nếu gặp nội dung vi phạm, bạn có thể gửi báo cáo để quản trị viên xem xét.</p><button onClick={() => user ? navigate("/bao-cao-cua-toi") : login()}>Báo cáo của tôi</button></div></aside>
        <section className="feed">
          <label className="forum-search"><Icon name="search"/><input className="forum-search-field" aria-label="Tìm bài viết" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm bài viết trong cộng đồng" autoComplete="off" spellCheck={false}/>{query && <button type="button" onClick={() => setQuery("")}>Xóa</button>}</label>
          <div className="composer"><div><ProfileAvatar initials={user?.initials ?? "?"} avatarUrl={currentUserAvatarUrl}/><button onClick={() => user ? setComposerOpen(true) : login()}>{user ? "Bạn muốn chia sẻ điều gì?" : "Đăng nhập để chia sẻ với cộng đồng"}</button></div><div><button onClick={() => user ? setComposerOpen(true) : login()}><Icon name="image"/>Thêm ảnh</button><button onClick={() => user ? setComposerOpen(true) : login()}><Icon name="edit"/>Viết bài</button></div></div>
          {composerOpen && <form className="composer-editor" onSubmit={publish}>
            <div className="composer-editor-head">
              <div className="composer-editor-author">
                <ProfileAvatar initials={user?.initials ?? "?"} avatarUrl={currentUserAvatarUrl}/>
                <div className="composer-editor-identity"><strong>{user?.name}</strong><small>Chia sẻ công khai</small></div>
              </div>
              <button className="composer-editor-close" type="button" aria-label="Đóng" onClick={() => setComposerOpen(false)}><Icon name="close"/></button>
            </div>
            <textarea autoFocus rows={5} value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Chia sẻ kinh nghiệm thuê trọ, tìm người ở ghép hoặc đăng pass phòng. Hãy ghi khu vực, giá thuê, tiền cọc và thời gian có thể nhận phòng..."/>
            <label className="form-field"><span>Ảnh minh họa (đường dẫn)</span><input value={image} onChange={(event) => setImage(event.target.value)} placeholder="https://..." autoComplete="off"/></label>
            {error && <p className="form-message error">{error}</p>}
            <div className="composer-editor-actions"><span>Đừng đăng số giấy tờ hoặc địa chỉ riêng tư; có thể nhắn tin để trao đổi chi tiết.</span><Button icon="send">Đăng bài</Button></div>
          </form>}
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
                      const conversation = await startConversation({
                        accountId: user.id,
                        name: item.name,
                        avatar: item.initials,
                        avatarUrl: item.avatarUrl,
                        userId: item.id,
                        roomId: "",
                      })
                      if (conversation) navigate(`/tin-nhan?conversation=${conversation}`)
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
