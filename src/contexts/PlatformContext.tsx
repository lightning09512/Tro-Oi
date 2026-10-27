import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { conversations } from "@/mocks/content"
import { mockUsers } from "@/mocks/users"
import type { AuthUser } from "@/types/auth"
import useAuth from "@/hooks/useAuth"
import { apiRequest, isApiMode } from "@/services/apiClient"

export type ListingStatus = "pending" | "active" | "hidden" | "rented" | "rejected"
export type ContentStatus = "pending" | "active" | "hidden" | "rejected"

export type RentalListing = {
  id: string
  title: string
  price: string
  priceValue: number
  area: string
  areaValue: number | null
  location: string
  type: string
  amenities: string[]
  mapX: number
  mapY: number
  image: string
  badge: string
  latitude?: number
  longitude?: number
  gallery?: string[]
  ownerId: string
  ownerName: string
  ownerAvatarUrl?: string
  isReferenceListing?: boolean
  phone?: string
  deposit: string
  description: string
  status: ListingStatus
  currentTenantId?: string | null
  views: number
  contacts: number
  createdAt: string
}

export interface PostComment {
  id: string
  authorId: string
  author: string
  initials: string
  avatarUrl?: string
  text: string
  createdAt: string
}

export interface RoomReview {
  id: string
  listingId: string
  authorId: string
  author: string
  initials: string
  stars: number
  text: string
  createdAt: string
}

export interface ForumPost {
  id: string
  authorId: string
  name: string
  initials: string
  avatarUrl?: string
  time: string
  content: string
  image: string
  likes: number
  likedBy: string[]
  commentsCount: number
  comments: PostComment[]
  status: ContentStatus
  createdAt: string
}

export interface PlatformUser extends AuthUser {
  status: "active" | "locked"
  createdAt: string
  avatarUrl?: string
}

export interface ReportRecord {
  id: string
  reporterId: string
  reporter: string
  targetType: "Tin phòng" | "Bài viết" | "Bình luận"
  targetId: string
  targetTitle: string
  reason: string
  description: string
  status: "pending" | "accepted" | "rejected"
  adminNote: string
  createdAt: string
}

export interface MessageRecord {
  id: string
  accountId: string
  name: string
  avatar: string
  avatarUrl?: string
  active: boolean
  text: string
  time: string
  unread?: boolean
  muted?: boolean
  roomId: string
  userId: string
  messages: { id: string; from: "me" | "them"; text: string; time: string }[]
}

export interface CategoryRecord {
  id: string
  type: "Khu vực" | "Loại phòng" | "Tiện ích"
  name: string
  status: "active" | "hidden"
}

export interface NotificationRecord {
  id: string
  userId: string
  title: string
  detail: string
  read: boolean
  createdAt: string
}

const legacyDemoListingIds = new Set([
  "room-binh-tan-budget",
  "room-binh-thanh-mini",
  "room-district-10-study",
  "room-go-vap-balcony",
  "room-go-vap-furnished",
  "room-linh-trung-share",
  "room-phu-nhuan-single",
  "room-tan-phu-mezzanine",
  "room-thao-dien-studio",
  "room-thu-duc-metro",
])
const legacyDemoPostIds = new Set([
  ...Array.from({ length: 10 }, (_, index) => `post-${index + 1}`),
  ...Array.from({ length: 10 }, (_, index) => `forum-post-${String(index + 1).padStart(2, "0")}`),
])

const initialListings: RentalListing[] = []
const loadListings = () => storage("listings", initialListings).filter((listing) => !legacyDemoListingIds.has(listing.id))

const initialPosts: ForumPost[] = []
const loadFeedPosts = () => storage("posts", initialPosts).filter((post) => !legacyDemoPostIds.has(post.id))

const savedAt = new Date().toISOString()
const initialUsers: PlatformUser[] = [
  ...Object.values(mockUsers),
  {
    id: "user-renter-02",
    name: "Nguyễn An",
    email: "nguyenan@example.com",
    phone: "0901 234 568",
    role: "renter",
    initials: "NA",
    avatarUrl: "/images/avatars/demo-owner-05.jpg",
  },
  {
    id: "user-renter-03",
    name: "Thu Hà",
    email: "thuha@example.com",
    phone: "0901 234 569",
    role: "renter",
    initials: "TH",
    avatarUrl: "/images/avatars/demo-owner-02.jpg",
  },
  {
    id: "user-renter-04",
    name: "Quang Minh",
    email: "quangminh@example.com",
    phone: "0901 234 570",
    role: "renter",
    initials: "QM",
    avatarUrl: "/images/avatars/demo-owner-06.jpg",
  },
  {
    id: "user-landlord-02",
    name: "Anh Khoa",
    email: "anhkhoa@example.com",
    phone: "0987 654 322",
    role: "landlord",
    initials: "AK",
    avatarUrl: "/images/avatars/demo-owner-04.jpg",
  },
].map((user) => ({
  ...user,
  role: user.role as PlatformUser["role"],
  status: "active",
  createdAt: savedAt,
}))

const initialReviews: RoomReview[] = []

const initialMessages: MessageRecord[] = conversations.slice(0, 3).map((conversation, index) => {
  const avatarUrls = [
    "/images/avatars/demo-owner-03.jpg",
    "/images/avatars/demo-owner-01.jpg",
    "/images/avatars/demo-owner-05.jpg",
  ]
  const sampleMessages: { id: string; from: "me" | "them"; text: string; time: string }[][] = [
    [
      { id: "msg-1-1", from: "me", text: "Dạ em chào chị Ngọc ạ, em thấy tin phòng Ung Văn Khiêm của mình, hiện phòng còn trống không chị?", time: "09:30" },
      { id: "msg-1-2", from: "them", text: "Chào em nha, phòng lầu 2 ban công thoáng bên chị vẫn còn nhé! Em tính khi nào dọn qua?", time: "09:45" },
      { id: "msg-1-3", from: "me", text: "Dạ cuối tháng này em chuyển trọ á chị. Tầm chiều mai 5h30 em ghé xem phòng thực tế được không chị ha?", time: "10:05" },
      { id: "msg-1-4", from: "them", text: "Được em nhé, tầm đó chị có ở nhà. Tới hẻm 105 Ung Văn Khiêm em cứ alo số chị ra đón vô xem nha.", time: "10:15" },
      { id: "msg-1-5", from: "me", text: "Dạ vâng chị, tiền điện nước với xe cộ bên mình tính thế nào chị ha?", time: "10:20" },
      { id: "msg-1-6", from: "them", text: "Điện 3.5k/số đồng hồ riêng từng phòng em nha, nước máy 20k/khối. Xe máy để tầng trệt có khóa vân tay với camera an ninh, miễn phí 1 xe nhé em.", time: "10:25" },
      { id: "msg-1-7", from: "me", text: "Dạ ưng quá chị ơi, chiều mai 5h30 em qua alo chị liền nha. Em cảm ơn chị ạ!", time: "10:30" },
      { id: "msg-1-8", from: "them", text: "Okie em nha, hẹn em chiều mai 5h30 qua xem phòng nhé!", time: "10:32" },
    ],
    [
      { id: "msg-2-1", from: "them", text: "Chào bạn nha! Bạn đang đi làm hay sinh viên á? Tụi mình đang tìm 1 bạn nữ ở chung cho vui với share tiền phòng.", time: "08:50" },
      { id: "msg-2-2", from: "me", text: "Mình đi làm văn phòng ở Q1 nè, giờ hành chính 8h-17h, tính mình gọn gàng ngăn nắp, ko tụ tập ồn ào nha.", time: "09:05" },
      { id: "msg-2-3", from: "them", text: "Ui hợp vibe ghê á! Phòng có sẵn máy lạnh tủ lạnh với bếp rồi, chỉ xách vali vào ở thôi nè.", time: "09:10" },
      { id: "msg-2-4", from: "them", text: "Tối nay rảnh ko b ghé phòng chơi nc xem hợp tính ko nè.", time: "09:15" },
    ],
    [
      { id: "msg-3-1", from: "me", text: "Chào admin, mình thấy có tin đăng ở Bình Thạnh để giá ảo 1tr5 câu view xong đòi cọc trước á.", time: "T.2 14:00" },
      { id: "msg-3-2", from: "them", text: "Chào bạn, Trọ Ơi đã tiếp nhận phản ánh của bạn. Đội ngũ kiểm duyệt đang xác minh tin đăng này.", time: "T.2 14:15" },
      { id: "msg-3-3", from: "them", text: "Admin đã kiểm tra và gỡ tin đăng vi phạm rồi nhé! Cảm ơn bạn đã chung tay bảo vệ cộng đồng Trọ Ơi an toàn ạ.", time: "T.2 15:30" },
    ],
  ]

  return {
    ...conversation,
    accountId: index === 1 ? "user-landlord-01" : "user-renter-01",
    name: ["Minh Ngọc", "Hoàng Trang", "Quản trị viên"][index],
    avatar: ["MN", "HT", "AD"][index],
    avatarUrl: avatarUrls[index],
    id: `conversation-${index + 1}`,
    roomId: ["tromoi-105-ung-van-khiem", "tromoi-binh-thanh-nguyen-van-dau", ""][index],
    userId: ["user-landlord-01", "user-renter-01", "user-admin-01"][index],
    unread: index === 1,
    messages: sampleMessages[index] ?? [],
  }
})

const loadMessages = () => storage("messages", initialMessages).map((conversation) => ({
  ...conversation,
  accountId: conversation.accountId ?? (conversation.userId === "user-renter-01" ? "user-landlord-01" : "user-renter-01"),
}))

const initialCategories: CategoryRecord[] = [
  ...["Thủ Đức", "Gò Vấp", "Bình Thạnh", "Tân Phú"].map((name, i) => ({ id: `district-${i}`, type: "Khu vực" as const, name, status: "active" as const })),
  ...["Phòng trọ", "Căn hộ mini", "Căn hộ", "Ở ghép", "Ký túc xá", "Nhà nguyên căn", "Chuyển nhượng"].map((name, i) => ({ id: `room-type-${i}`, type: "Loại phòng" as const, name, status: "active" as const })),
  ...["Máy lạnh", "Bãi đỗ xe", "Ban công", "Máy giặt", "Cho nuôi thú cưng"].map((name, i) => ({ id: `amenity-${i}`, type: "Tiện ích" as const, name, status: "active" as const })),
]

const storage = <T,>(key: string, fallback: T): T => {
  try {
    const value = window.localStorage.getItem(`phongtroplus_${key}`)
    return value ? (JSON.parse(value) as T) : fallback
  } catch {
    return fallback
  }
}

async function platformRequest<T>(path: string, init?: RequestInit): Promise<T | undefined> {
  try { return await apiRequest<T>(path, init) }
  catch { return undefined }
}

const listingPayload = (item: RentalListing) => ({
  title: item.title, location: item.location, priceValue: item.priceValue, areaValue: item.areaValue,
  type: item.type, description: item.description, amenities: item.amenities, image: item.image,
  gallery: item.gallery ?? [item.image], latitude: item.latitude, longitude: item.longitude,
  deposit: item.deposit, phone: item.phone, currentTenantId: item.currentTenantId,
})

interface PlatformContextValue {
  listings: RentalListing[]
  posts: ForumPost[]
  users: PlatformUser[]
  reports: ReportRecord[]
  messages: MessageRecord[]
  reviews: RoomReview[]
  categories: CategoryRecord[]
  notifications: NotificationRecord[]
  connectionState: "demo" | "loading" | "ready" | "error"
  connectionError: string
  refreshMessages: () => Promise<void>
  saveListing: (value: RentalListing) => Promise<void>
  deleteListing: (id: string) => Promise<void>
  setListingStatus: (id: string, status: ListingStatus, currentTenantId?: string | null) => Promise<void>
  incrementListingViews: (id: string) => Promise<void>
  incrementListingContacts: (id: string) => Promise<string | undefined>
  savePost: (value: ForumPost) => Promise<void>
  deletePost: (id: string) => Promise<void>
  setPostStatus: (id: string, status: ContentStatus) => Promise<void>
  togglePostLike: (id: string, user: AuthUser) => Promise<void>
  addComment: (id: string, user: AuthUser, text: string) => Promise<void>
  deleteComment: (postId: string, commentId: string) => Promise<void>
  editComment: (postId: string, commentId: string, text: string) => Promise<void>
  addReport: (value: Omit<ReportRecord, "id" | "status" | "adminNote" | "createdAt">) => Promise<void>
  updateReport: (id: string, status: ReportRecord["status"], note?: string) => Promise<void>
  saveUser: (value: PlatformUser, password?: string) => Promise<void>
  deleteUser: (id: string) => Promise<void>
  saveCategory: (value: CategoryRecord) => Promise<void>
  deleteCategory: (id: string) => Promise<void>
  addNotification: (value: Omit<NotificationRecord, "id" | "read" | "createdAt">) => Promise<void>
  markNotificationsRead: (userId: string) => Promise<void>
  markSingleNotificationRead: (id: string, read?: boolean) => Promise<void>
  deleteNotification: (id: string) => Promise<void>
  clearAllNotifications: (userId: string) => Promise<void>
  sendMessage: (conversationId: string, accountId: string, text: string) => Promise<void>
  markConversationRead: (conversationId: string, accountId: string) => Promise<void>
  toggleConversationMute: (conversationId: string, accountId: string) => Promise<void>
  startConversation: (person: { accountId: string; name: string; avatar: string; avatarUrl?: string; userId: string; roomId: string }) => Promise<string>
  saveReview: (review: RoomReview) => Promise<void>
  deleteReview: (id: string) => Promise<void>
}

const PlatformContext = createContext<PlatformContextValue | null>(null)

export function PlatformProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [listings, setListings] = useState(() => isApiMode ? [] as RentalListing[] : loadListings())
  const [feedPosts, setFeedPosts] = useState(() => isApiMode ? [] as ForumPost[] : loadFeedPosts())
  const [users, setUsers] = useState(() => isApiMode ? [] as PlatformUser[] : storage("users", initialUsers))
  const [reports, setReports] = useState(() => isApiMode ? [] as ReportRecord[] : storage("reports", [] as ReportRecord[]).filter((item) => ["Tin phòng", "Bài viết", "Bình luận"].includes(item.targetType)))
  const [messages, setMessages] = useState(() => isApiMode ? [] as MessageRecord[] : loadMessages())
  const [reviews, setReviews] = useState(() => isApiMode ? [] as RoomReview[] : storage("reviews", initialReviews).filter((review) => review.id !== "review-1" && !legacyDemoListingIds.has(review.listingId)))
  const [categories, setCategories] = useState(() => isApiMode ? [] as CategoryRecord[] : storage("categories", initialCategories))
  const [notifications, setNotifications] = useState(() => isApiMode ? [] as NotificationRecord[] : storage("notifications", [] as NotificationRecord[]))
  const [connectionState, setConnectionState] = useState<PlatformContextValue["connectionState"]>(isApiMode ? "loading" : "demo")
  const [connectionError, setConnectionError] = useState("")

  useEffect(() => { if (!isApiMode) window.localStorage.setItem("phongtroplus_listings", JSON.stringify(listings)) }, [listings])
  useEffect(() => { if (!isApiMode) window.localStorage.setItem("phongtroplus_posts", JSON.stringify(feedPosts)) }, [feedPosts])
  useEffect(() => { if (!isApiMode) window.localStorage.setItem("phongtroplus_users", JSON.stringify(users)) }, [users])
  useEffect(() => { if (!isApiMode) window.localStorage.setItem("phongtroplus_reports", JSON.stringify(reports)) }, [reports])
  useEffect(() => { if (!isApiMode) window.localStorage.setItem("phongtroplus_messages", JSON.stringify(messages)) }, [messages])
  useEffect(() => { if (!isApiMode) window.localStorage.setItem("phongtroplus_reviews", JSON.stringify(reviews)) }, [reviews])
  useEffect(() => { if (!isApiMode) window.localStorage.setItem("phongtroplus_categories", JSON.stringify(categories)) }, [categories])
  useEffect(() => { if (!isApiMode) window.localStorage.setItem("phongtroplus_notifications", JSON.stringify(notifications)) }, [notifications])

  useEffect(() => {
    if (!isApiMode) return
    let alive = true
    const load = async () => {
      setConnectionState("loading")
      setConnectionError("")
      try {
        const admin = user?.role === "admin"
        const landlord = user?.role === "landlord"
        const [publicListings, privateListings, rentalListings, favoriteListings, postsResult, usersResult, categoriesResult, reportsResult, messagesResult, reviewsResult, notificationsResult] = await Promise.all([
            admin ? apiRequest<{ items: RentalListing[] }>("admin/listings") : apiRequest<{ items: RentalListing[] }>("listings?limit=60"),
          landlord ? apiRequest<{ items: RentalListing[] }>("listings/mine") : Promise.resolve({ items: [] as RentalListing[] }),
          user?.role === "renter" ? apiRequest<{ items: RentalListing[] }>("listings/rentals") : Promise.resolve({ items: [] as RentalListing[] }),
          user && user.role !== "admin" ? apiRequest<{ items: RentalListing[] }>("favorites") : Promise.resolve({ items: [] as RentalListing[] }),
          admin ? apiRequest<{ items: ForumPost[] }>("admin/forum") : apiRequest<{ items: ForumPost[] }>("forum"),
          user ? (admin ? apiRequest<{ items: PlatformUser[] }>("admin/users") : apiRequest<{ items: PlatformUser[] }>("members")) : Promise.resolve({ items: [] as PlatformUser[] }),
          admin ? apiRequest<{ items: CategoryRecord[] }>("admin/categories") : apiRequest<{ items: CategoryRecord[] }>("categories"),
          user ? apiRequest<{ items: ReportRecord[] }>(admin ? "reports" : "reports/mine") : Promise.resolve({ items: [] as ReportRecord[] }),
          user && user.role !== "admin" ? apiRequest<{ items: MessageRecord[] }>("messages/conversations") : Promise.resolve({ items: [] as MessageRecord[] }),
          apiRequest<{ items: RoomReview[] }>("reviews"),
          user ? apiRequest<{ items: NotificationRecord[] }>("notifications") : Promise.resolve({ items: [] as NotificationRecord[] }),
        ])
        if (!alive) return
        const listingSources = [publicListings.items, privateListings.items, rentalListings.items, favoriteListings.items]
        const mergedListings = listingSources.flat()
          .filter((item, index, all) => all.findIndex((candidate) => candidate.id === item.id) === index)
          .map((item) => ({
            ...item,
            isReferenceListing: item.isReferenceListing ?? item.id.startsWith("tromoi-"),
          }))
        setListings(mergedListings)
        setFeedPosts(postsResult.items)
        setUsers(usersResult.items)
        setCategories(categoriesResult.items)
        setReports(reportsResult.items)
        setMessages(messagesResult.items)
        setReviews(reviewsResult.items)
        setNotifications(notificationsResult.items)
        setConnectionState("ready")
      } catch (error) {
        if (!alive) return
        setConnectionState("error")
        setConnectionError(error instanceof Error ? error.message : "Không thể tải dữ liệu máy chủ.")
      }
    }
    void load()
    return () => { alive = false }
  }, [user?.id, user?.role])

  useEffect(() => {
    if (isApiMode || !user) return
    setUsers((current) => current.some((item) => item.id === user.id)
      ? current.map((item) => item.id === user.id ? { ...item, ...user } : item)
      : [{ ...user, status: "active", createdAt: new Date().toISOString() }, ...current])
  }, [user?.id, user?.name, user?.email, user?.phone, user?.role])

  const refreshMessages = useCallback(async () => {
    if (!isApiMode || !user || user.role === "admin") return
    const result = await platformRequest<{ items: MessageRecord[] }>("messages/conversations")
    if (result) setMessages(result.items)
  }, [user?.id, user?.role])

  const value = useMemo<PlatformContextValue>(() => ({
    listings,
    posts: feedPosts,
    users,
    reports,
    messages,
    reviews,
    categories,
    notifications,
    connectionState,
    connectionError,
    refreshMessages,
    saveListing: async (item) => {
      if (isApiMode) {
        const existing = listings.some((value) => value.id === item.id)
        const result = await apiRequest<{ item: RentalListing }>(existing
          ? `listings/${encodeURIComponent(item.id)}`
          : "listings", { method: existing ? "PATCH" : "POST", body: JSON.stringify(listingPayload(item)) })
        const saved = result.item
        setListings((current) => current.some((value) => value.id === saved.id) ? current.map((value) => value.id === saved.id ? saved : value) : [saved, ...current])
        return
      }
      setListings((current) => current.some((value) => value.id === item.id) ? current.map((value) => value.id === item.id ? item : value) : [item, ...current])
    },
    deleteListing: async (id) => {
      if (isApiMode) await apiRequest(`listings/${encodeURIComponent(id)}`, { method: "DELETE" })
      setListings((current) => current.filter((item) => item.id !== id))
    },
    setListingStatus: async (id, status, currentTenantId) => {
      if (isApiMode) {
        const result = await apiRequest<{ item: RentalListing }>(`listings/${encodeURIComponent(id)}/status`, { method: "PATCH", body: JSON.stringify({ status, currentTenantId }) })
        setListings((current) => current.map((item) => item.id === id ? result.item : item))
        return
      }
      setListings((current) => current.map((item) => item.id === id ? { ...item, status, currentTenantId: status === "rented" ? currentTenantId ?? item.currentTenantId : null } : item))
    },
    incrementListingViews: async (id) => {
      if (isApiMode) {
        const result = await platformRequest<{ views: number }>(`listings/${encodeURIComponent(id)}/view`, { method: "POST" })
        if (result) setListings((current) => current.map((item) => item.id === id ? { ...item, views: result.views } : item))
        return
      }
      setListings((current) => current.map((item) => item.id === id ? { ...item, views: item.views + 1 } : item))
    },
    incrementListingContacts: async (id) => {
      if (isApiMode) {
        const result = await platformRequest<{ phone: string }>(`listings/${encodeURIComponent(id)}/contact`, { method: "POST" })
        if (!result) return undefined
        setListings((current) => current.map((item) => item.id === id ? { ...item, contacts: item.contacts + 1 } : item))
        return result.phone
      }
      setListings((current) => current.map((item) => item.id === id ? { ...item, contacts: item.contacts + 1 } : item))
      return listings.find((item) => item.id === id)?.phone
    },
    savePost: async (item) => {
      if (isApiMode) {
        const existing = feedPosts.some((value) => value.id === item.id)
        const result = await apiRequest<{ item: ForumPost }>(existing ? `forum/${encodeURIComponent(item.id)}` : "forum", { method: existing ? "PATCH" : "POST", body: JSON.stringify({ content: item.content, image: item.image }) })
        setFeedPosts((current) => current.some((value) => value.id === result.item.id) ? current.map((value) => value.id === result.item.id ? result.item : value) : [result.item, ...current])
        return
      }
      setFeedPosts((current) => current.some((value) => value.id === item.id) ? current.map((value) => value.id === item.id ? item : value) : [item, ...current])
    },
    deletePost: async (id) => {
      if (isApiMode && !await platformRequest(`forum/${encodeURIComponent(id)}`, { method: "DELETE" })) return
      setFeedPosts((current) => current.filter((item) => item.id !== id))
    },
    setPostStatus: async (id, status) => {
      if (isApiMode) {
        const result = await platformRequest<{ item: ForumPost }>(`forum/${encodeURIComponent(id)}/status`, { method: "PATCH", body: JSON.stringify({ status }) })
        if (!result) return
        setFeedPosts((current) => current.map((item) => item.id === id ? result.item : item))
        return
      }
      setFeedPosts((current) => current.map((item) => item.id === id ? { ...item, status } : item))
    },
    togglePostLike: async (id, actingUser) => {
      if (isApiMode) {
        const result = await platformRequest<{ liked: boolean; likes: number }>(`forum/${encodeURIComponent(id)}/like`, { method: "POST" })
        if (!result) return
        setFeedPosts((current) => current.map((post) => post.id !== id ? post : { ...post, likedBy: result.liked ? [...post.likedBy, actingUser.id] : post.likedBy.filter((userId) => userId !== actingUser.id), likes: result.likes }))
        return
      }
      setFeedPosts((current) => current.map((post) => {
        if (post.id !== id) return post
        const liked = post.likedBy.includes(actingUser.id)
        return { ...post, likedBy: liked ? post.likedBy.filter((userId) => userId !== actingUser.id) : [...post.likedBy, actingUser.id], likes: Math.max(0, post.likes + (liked ? -1 : 1)) }
      }))
    },
    addComment: async (id, actingUser, text) => {
      if (isApiMode) {
        const result = await apiRequest<{ item: PostComment }>(`forum/${encodeURIComponent(id)}/comments`, { method: "POST", body: JSON.stringify({ text }) })
        setFeedPosts((current) => current.map((post) => post.id !== id ? post : { ...post, comments: [...post.comments, result.item], commentsCount: post.commentsCount + 1 }))
        return
      }
      setFeedPosts((current) => current.map((post) => post.id !== id ? post : { ...post, commentsCount: post.commentsCount + 1, comments: [...post.comments, { id: `comment-${Date.now()}`, authorId: actingUser.id, author: actingUser.name, initials: actingUser.initials, avatarUrl: actingUser.avatarUrl, text, createdAt: new Date().toLocaleString("vi-VN") }] }))
    },
    deleteComment: async (postId, commentId) => {
      if (isApiMode && !await platformRequest(`forum/${encodeURIComponent(postId)}/comments/${encodeURIComponent(commentId)}`, { method: "DELETE" })) return
      setFeedPosts((current) => current.map((post) => post.id !== postId ? post : { ...post, commentsCount: Math.max(0, post.commentsCount - 1), comments: post.comments.filter((comment) => comment.id !== commentId) }))
    },
    editComment: async (postId, commentId, text) => {
      if (isApiMode) {
        const result = await platformRequest<{ item: PostComment }>(`forum/${encodeURIComponent(postId)}/comments/${encodeURIComponent(commentId)}`, { method: "PATCH", body: JSON.stringify({ text }) })
        if (!result) return
        setFeedPosts((current) => current.map((post) => post.id !== postId ? post : { ...post, comments: post.comments.map((comment) => comment.id === commentId ? result.item : comment) }))
        return
      }
      setFeedPosts((current) => current.map((post) => post.id !== postId ? post : { ...post, comments: post.comments.map((comment) => comment.id === commentId ? { ...comment, text } : comment) }))
    },
    addReport: async (report) => {
      if (isApiMode) {
        const result = await apiRequest<{ item: ReportRecord }>("reports", { method: "POST", body: JSON.stringify({ targetType: report.targetType, targetId: report.targetId, targetTitle: report.targetTitle, reason: report.reason, description: report.description }) })
        setReports((current) => [result.item, ...current])
        return
      }
      setReports((current) => [{ ...report, id: `report-${Date.now()}`, status: "pending", adminNote: "", createdAt: new Date().toISOString() }, ...current])
    },
    updateReport: async (id, status, note = "") => {
      if (isApiMode) {
        if (status === "pending") return
        const result = await apiRequest<{ item: { status: ReportRecord["status"]; adminNote: string } }>(`reports/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify({ status, note }) })
        setReports((current) => current.map((item) => item.id === id ? { ...item, ...result.item } : item))
        return
      }
      setReports((current) => current.map((item) => item.id === id ? { ...item, status, adminNote: note } : item))
    },
    saveUser: async (managedUser, password) => {
      if (isApiMode) {
        const existing = users.some((item) => item.id === managedUser.id)
        const result = await apiRequest<{ item: PlatformUser }>(existing ? `admin/users/${encodeURIComponent(managedUser.id)}` : "admin/users", { method: existing ? "PATCH" : "POST", body: JSON.stringify({ name: managedUser.name, email: managedUser.email, phone: managedUser.phone, role: managedUser.role, status: managedUser.status, ...(password ? { password } : {}) }) })
        setUsers((current) => current.some((item) => item.id === result.item.id) ? current.map((item) => item.id === result.item.id ? result.item : item) : [result.item, ...current])
        return
      }
      setUsers((current) => current.some((item) => item.id === managedUser.id) ? current.map((item) => item.id === managedUser.id ? managedUser : item) : [managedUser, ...current])
    },
    deleteUser: async (id) => {
      if (isApiMode) await apiRequest(`admin/users/${encodeURIComponent(id)}`, { method: "DELETE" })
      setUsers((current) => current.filter((item) => item.id !== id))
    },
    saveCategory: async (category) => {
      if (isApiMode) {
        const existing = categories.some((item) => item.id === category.id)
        const result = await platformRequest<{ item: CategoryRecord }>(existing ? `admin/categories/${encodeURIComponent(category.id)}` : "admin/categories", { method: existing ? "PATCH" : "POST", body: JSON.stringify(category) })
        if (!result) return
        setCategories((current) => current.some((item) => item.id === result.item.id) ? current.map((item) => item.id === result.item.id ? result.item : item) : [result.item, ...current])
        return
      }
      setCategories((current) => current.some((item) => item.id === category.id) ? current.map((item) => item.id === category.id ? category : item) : [category, ...current])
    },
    deleteCategory: async (id) => {
      if (isApiMode && !await platformRequest(`admin/categories/${encodeURIComponent(id)}`, { method: "DELETE" })) return
      setCategories((current) => current.filter((item) => item.id !== id))
    },
    addNotification: async (item) => {
      if (isApiMode) {
        const result = await apiRequest<{ item: NotificationRecord }>("notifications", { method: "POST", body: JSON.stringify(item) })
        setNotifications((current) => [result.item, ...current])
        return
      }
      setNotifications((current) => [{ ...item, id: `notification-${Date.now()}`, read: false, createdAt: new Date().toISOString() }, ...current])
    },
    markNotificationsRead: async (userId) => {
      if (isApiMode) {
        if (userId !== user?.id) return
        const result = await platformRequest("notifications/read", { method: "PATCH", body: JSON.stringify({}) })
        if (!result) return
      }
      setNotifications((current) => current.map((item) => item.userId === userId ? { ...item, read: true } : item))
    },
    markSingleNotificationRead: async (id: string, read = true) => {
      if (isApiMode) {
        await platformRequest(`notifications/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify({ read }) }).catch(() => undefined)
      }
      setNotifications((current) => current.map((item) => item.id === id ? { ...item, read } : item))
    },
    deleteNotification: async (id: string) => {
      if (isApiMode) {
        await platformRequest(`notifications/${encodeURIComponent(id)}`, { method: "DELETE" }).catch(() => undefined)
      }
      setNotifications((current) => current.filter((item) => item.id !== id))
    },
    clearAllNotifications: async (userId: string) => {
      if (isApiMode) {
        if (userId === user?.id) {
          await platformRequest("notifications", { method: "DELETE" }).catch(() => undefined)
        }
      }
      setNotifications((current) => current.filter((item) => item.userId !== userId))
    },
    sendMessage: async (conversationId, accountId, text) => {
      if (isApiMode) {
        const result = await apiRequest<{ item: { id: string; from: "me" | "them"; text: string; time: string } }>(`messages/conversations/${encodeURIComponent(conversationId)}/messages`, { method: "POST", body: JSON.stringify({ text }) })
        setMessages((current) => current.map((conversation) => conversation.id !== conversationId ? conversation : { ...conversation, text, unread: false, time: result.item.time, messages: [...conversation.messages, result.item] }))
        return
      }
      const time = new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
      const messageId = `message-${Date.now()}`
      setMessages((current) => current.map((conversation) => conversation.id !== conversationId ? conversation : {
        ...conversation,
        text,
        unread: conversation.accountId !== accountId,
        time,
        messages: [...conversation.messages, { id: messageId, from: conversation.accountId === accountId ? "me" : "them", text, time }],
      }))
    },
    markConversationRead: async (conversationId, accountId) => {
      if (isApiMode) {
        const result = await platformRequest(`messages/conversations/${encodeURIComponent(conversationId)}/read`, { method: "PATCH", body: JSON.stringify({}) })
        if (!result) return
      }
      setMessages((current) => current.some((item) => item.id === conversationId && item.accountId === accountId && item.unread) ? current.map((item) => item.id === conversationId && item.accountId === accountId ? { ...item, unread: false } : item) : current)
    },
    toggleConversationMute: async (conversationId, accountId) => {
      const conversation = messages.find((item) => item.id === conversationId && item.accountId === accountId)
      if (isApiMode) {
        const result = await platformRequest(`messages/conversations/${encodeURIComponent(conversationId)}/mute`, { method: "PATCH", body: JSON.stringify({ muted: !conversation?.muted }) })
        if (!result) return
      }
      setMessages((current) => current.map((item) => item.id === conversationId && item.accountId === accountId ? { ...item, muted: !item.muted } : item))
    },
    startConversation: async (person) => {
      if (isApiMode) {
        const result = await apiRequest<{ item: MessageRecord }>("messages/conversations", { method: "POST", body: JSON.stringify({ otherUserId: person.userId, listingId: person.roomId }) })
        setMessages((current) => [result.item, ...current.filter((item) => item.id !== result.item.id)])
        return result.item.id
      }
      const existing = messages.find((conversation) => conversation.accountId === person.accountId && conversation.userId === person.userId && conversation.roomId === person.roomId)
      const id = existing?.id ?? `conversation-${Date.now()}`
      const self = users.find((item) => item.id === person.accountId)
      setMessages((current) => {
        const sender = current.find((item) => item.id === id && item.accountId === person.accountId) ?? {
          id,
          accountId: person.accountId,
          name: person.name,
          avatar: person.avatar,
          avatarUrl: person.avatarUrl,
          active: true,
          text: person.roomId ? "Quan tâm tin phòng này" : "Chưa có tin nhắn mới",
          time: "Vừa xong",
          roomId: person.roomId,
          userId: person.userId,
          messages: [],
        }
        if (current.some((item) => item.id === id && item.accountId === person.userId)) return current
        const recipient: MessageRecord = {
          ...sender,
          accountId: person.userId,
          userId: person.accountId,
          name: self?.name ?? "Thành viên",
          avatar: self?.initials ?? "TV",
          avatarUrl: self?.avatarUrl,
          unread: false,
          muted: false,
          messages: sender.messages.map((item) => ({ ...item, from: item.from === "me" ? "them" : "me" })),
        }
        return current.some((item) => item.id === id)
          ? [...current, recipient]
          : [sender, recipient, ...current]
      })
      return id
    },
    saveReview: async (review) => {
      if (isApiMode) {
        const result = await apiRequest<{ item: RoomReview }>(`listings/${encodeURIComponent(review.listingId)}/reviews`, { method: "POST", body: JSON.stringify({ stars: review.stars, text: review.text }) })
        const saved = { ...review, ...result.item, author: user?.name ?? review.author, initials: user?.initials ?? review.initials }
        setReviews((current) => current.some((item) => item.listingId === saved.listingId && item.authorId === saved.authorId) ? current.map((item) => item.listingId === saved.listingId && item.authorId === saved.authorId ? saved : item) : [saved, ...current])
        return
      }
      setReviews((current) => current.some((item) => item.id === review.id) ? current.map((item) => item.id === review.id ? review : item) : [review, ...current])
    },
    deleteReview: async (id) => {
      if (isApiMode) {
        const review = reviews.find((item) => item.id === id)
        if (!review || !await platformRequest(`listings/${encodeURIComponent(review.listingId)}/reviews/${encodeURIComponent(id)}`, { method: "DELETE" })) return
      }
      setReviews((current) => current.filter((item) => item.id !== id))
    },
  }), [listings, feedPosts, users, reports, messages, categories, reviews, notifications, connectionState, connectionError, user, refreshMessages])

  return <PlatformContext.Provider value={value}>{children}</PlatformContext.Provider>
}

export function usePlatform() {
  const value = useContext(PlatformContext)
  if (!value) throw new Error("usePlatform must be used inside PlatformProvider")
  return value
}
