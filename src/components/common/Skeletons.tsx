/** Skeleton loading placeholders for content that is being fetched. */

export function RoomCardSkeleton() {
  return (
    <div className="skeleton-card" aria-hidden="true">
      <div className="skeleton-photo shimmer" />
      <div className="skeleton-body">
        <div className="skeleton-line skeleton-line-wide shimmer" />
        <div className="skeleton-line skeleton-line-medium shimmer" />
        <div className="skeleton-line-row">
          <div className="skeleton-line skeleton-line-short shimmer" />
          <div className="skeleton-line skeleton-line-short shimmer" />
        </div>
        <div className="skeleton-seller">
          <div className="skeleton-avatar shimmer" />
          <div className="skeleton-line skeleton-line-medium shimmer" />
        </div>
      </div>
    </div>
  )
}

export function RoomCardSkeletonGrid({ count = 8 }: { count?: number }) {
  return (
    <div className="result-grid" aria-busy="true" aria-label="Đang tải danh sách phòng">
      {Array.from({ length: count }, (_, index) => (
        <RoomCardSkeleton key={index} />
      ))}
    </div>
  )
}

export function ForumPostSkeleton() {
  return (
    <div className="skeleton-post" aria-hidden="true">
      <div className="skeleton-post-head">
        <div className="skeleton-avatar shimmer" />
        <div className="skeleton-post-meta">
          <div className="skeleton-line skeleton-line-medium shimmer" />
          <div className="skeleton-line skeleton-line-short shimmer" />
        </div>
      </div>
      <div className="skeleton-post-body">
        <div className="skeleton-line skeleton-line-wide shimmer" />
        <div className="skeleton-line skeleton-line-wide shimmer" />
        <div className="skeleton-line skeleton-line-medium shimmer" />
      </div>
      <div className="skeleton-post-bar">
        <div className="skeleton-line skeleton-line-short shimmer" />
        <div className="skeleton-line skeleton-line-short shimmer" />
        <div className="skeleton-line skeleton-line-short shimmer" />
      </div>
    </div>
  )
}

export function ForumPostSkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="feed" aria-busy="true" aria-label="Đang tải bài viết">
      {Array.from({ length: count }, (_, index) => (
        <ForumPostSkeleton key={index} />
      ))}
    </div>
  )
}

export function MessageItemSkeleton() {
  return (
    <div className="skeleton-conversation" aria-hidden="true">
      <div className="skeleton-avatar skeleton-avatar-lg shimmer" />
      <div className="skeleton-conversation-text">
        <div className="skeleton-line skeleton-line-medium shimmer" />
        <div className="skeleton-line skeleton-line-wide shimmer" />
      </div>
    </div>
  )
}

export function MessageListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div aria-busy="true" aria-label="Đang tải cuộc trò chuyện">
      {Array.from({ length: count }, (_, index) => (
        <MessageItemSkeleton key={index} />
      ))}
    </div>
  )
}
