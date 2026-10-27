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
    text: "Dạ phòng vẫn còn bạn nhé!",
    time: "10:32",
    avatar: "MN",
    active: true,
  },
  {
    name: "Phương Linh",
    text: "Mình gửi bạn vị trí nha",
    time: "09:15",
    avatar: "PL",
    active: true,
  },
  {
    name: "Anh Tuấn",
    text: "Cảm ơn bạn đã quan tâm",
    time: "T.2",
    avatar: "AT",
    active: false,
  },
  {
    name: "Nhóm săn phòng Thủ Đức",
    text: "Hà: Có ai đi xem cùng không?",
    time: "T.2",
    avatar: "N",
    active: false,
  },
]
