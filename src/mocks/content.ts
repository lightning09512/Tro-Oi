export const photos = [
  "https://images.unsplash.com/photo-1655265173214-77882268bc64?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1655265173852-ad4a9b704490?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1737737149038-e6532662659e?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1655265173643-f096686bb597?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1655265173703-84c855c4d870?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1655265172929-d80a361ad54a?auto=format&fit=crop&w=900&q=80",
]

export const rooms: Array<{
  id: string
  title: string
  price: string
  priceValue: number
  area: string
  areaValue: number
  location: string
  type: string
  amenities: string[]
  mapX: number
  mapY: number
  latitude: number
  longitude: number
  image: string
  badge: string
}> = []

export const conversations = [
  {
    name: "Minh Ngọc",
    text: "Okie em nha, hẹn em chiều mai 5h30 qua xem phòng nhé!",
    time: "10:32",
    avatar: "MN",
    active: true,
  },
  {
    name: "Hoàng Trang",
    text: "Tối nay rảnh ko b ghé phòng chơi nc xem hợp tính ko nè.",
    time: "09:15",
    avatar: "HT",
    active: true,
  },
  {
    name: "Quản trị viên",
    text: "Admin đã kiểm tra và gỡ tin đăng vi phạm rồi nhé!",
    time: "T.2",
    avatar: "AD",
    active: false,
  },
  {
    name: "Anh Khoa",
    text: "Phòng bên Tân Bình vừa có bạn cọc sáng nay rồi em nha.",
    time: "T.2",
    avatar: "AK",
    active: false,
  },
]
