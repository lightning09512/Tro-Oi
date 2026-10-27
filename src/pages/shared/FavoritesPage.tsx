import { useMemo } from "react"
import { Link, useNavigate } from "react-router"
import { Button, Icon, RoomCard } from "@/components/common/legacy"
import { useFavorites } from "@/contexts/FavoritesContext"
import { usePlatform } from "@/contexts/PlatformContext"

export default function FavoritesPage() {
  const navigate = useNavigate()
  const { favoriteIds } = useFavorites()
  const { listings } = usePlatform()
  const savedRooms = useMemo(
    () => listings.filter((room) => favoriteIds.includes(room.id)),
    [favoriteIds, listings],
  )

  return (
    <main className="page-bg favorites-page">
      <div className="container">
        <div className="breadcrumbs">
          <Link to="/">Trang chủ</Link> <span>/</span> Tin yêu thích
        </div>
        <div className="results-head favorites-heading">
          <div>
            <span className="eyebrow">Bộ sưu tập của bạn</span>
            <h1>Tin yêu thích</h1>
            <p>{savedRooms.length} phòng đã được lưu</p>
          </div>
        </div>
        {savedRooms.length ? (
          <div className="result-grid favorites-grid">
            {savedRooms.map((room) => (
              <RoomCard
                key={room.id}
                room={room}
                onClick={() => navigate(`/phong/${room.id}`)}
              />
            ))}
          </div>
        ) : (
          <section className="empty-state">
            <span className="placeholder-icon">
              <Icon name="heart" size={32} />
            </span>
            <h2>Chưa có phòng nào được lưu</h2>
            <p>
              Chạm vào biểu tượng trái tim trên bất kỳ tin đăng nào để lưu lại những căn phòng bạn quan tâm và dễ dàng so sánh sau này.
            </p>
            <p className="empty-hint">Các tin được lưu sẽ luôn hiển thị tại đây khi bạn đăng nhập.</p>
            <Button onClick={() => navigate("/tim-phong")}>
              Khám phá phòng trọ quanh đây
            </Button>
          </section>
        )}
      </div>
    </main>
  )
}
