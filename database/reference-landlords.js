const ownerIdByRoomType = {
  "Phòng trọ": "demo-landlord-01",
  "Căn hộ mini": "demo-landlord-02",
  "Ở ghép": "demo-landlord-03",
  "Ký túc xá": "demo-landlord-04",
  "Nhà nguyên căn": "demo-landlord-05",
  "Căn hộ": "demo-landlord-06",
}

export function ownerIdForReferenceListing(roomType) {
  return ownerIdByRoomType[roomType] ?? "demo-landlord-01"
}
