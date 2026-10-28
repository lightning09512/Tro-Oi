export const isValidMapPosition = (latitude: unknown, longitude: unknown): latitude is number =>
  typeof latitude === "number" && Number.isFinite(latitude) && latitude >= -90 && latitude <= 90 &&
  typeof longitude === "number" && Number.isFinite(longitude) && longitude >= -180 && longitude <= 180

export const DISTRICT_COORDINATES: Record<string, [number, number]> = {
  // TP. Hồ Chí Minh
  "tan binh": [10.8015, 106.6542],
  "tân bình": [10.8015, 106.6542],
  "binh thanh": [10.8054, 106.7025],
  "bình thạnh": [10.8054, 106.7025],
  "go vap": [10.8386, 106.6653],
  "gò vấp": [10.8386, 106.6653],
  "quan 10": [10.7718, 106.6618],
  "quận 10": [10.7718, 106.6618],
  "quan 7": [10.7484, 106.7048],
  "quận 7": [10.7484, 106.7048],
  "thu duc": [10.8494, 106.7537],
  "thủ đức": [10.8494, 106.7537],
  "tan phu": [10.8142, 106.6285],
  "tân phú": [10.8142, 106.6285],
  "phu nhuan": [10.7992, 106.6803],
  "phú nhuận": [10.7992, 106.6803],
  "quan 1": [10.7769, 106.7009],
  "quận 1": [10.7769, 106.7009],
  "quan 3": [10.7844, 106.6844],
  "quận 3": [10.7844, 106.6844],
  "quan 4": [10.7600, 106.7020],
  "quận 4": [10.7600, 106.7020],
  "quan 5": [10.7554, 106.6644],
  "quận 5": [10.7554, 106.6644],
  "quan 6": [10.7495, 106.6349],
  "quận 6": [10.7495, 106.6349],
  "quan 8": [10.7242, 106.6286],
  "quận 8": [10.7242, 106.6286],
  "quan 11": [10.7629, 106.6504],
  "quận 11": [10.7629, 106.6504],
  "quan 12": [10.8672, 106.6413],
  "quận 12": [10.8672, 106.6413],
  "binh tan": [10.7652, 106.6035],
  "bình tân": [10.7652, 106.6035],
  "hoc mon": [10.8841, 106.5925],
  "hóc môn": [10.8841, 106.5925],
  "binh chanh": [10.6874, 106.5925],
  "bình chánh": [10.6874, 106.5925],
  "nha be": [10.6953, 106.7328],
  "nhà bè": [10.6953, 106.7328],

  // Hà Nội
  "cau giay": [21.0313, 105.7905],
  "cầu giấy": [21.0313, 105.7905],
  "ba dinh": [21.0353, 105.8235],
  "ba đình": [21.0353, 105.8235],
  "dong da": [21.0180, 105.8260],
  "đống đa": [21.0180, 105.8260],
  "hai ba trung": [21.0065, 105.8510],
  "hai bà trưng": [21.0065, 105.8510],
  "hoan kiem": [21.0285, 105.8542],
  "hoàn kiếm": [21.0285, 105.8542],
  "tay ho": [21.0700, 105.8235],
  "tây hồ": [21.0700, 105.8235],
  "thanh xuan": [20.9985, 105.8115],
  "thanh xuân": [20.9985, 105.8115],
  "nam tu liem": [21.0152, 105.7650],
  "nam từ liêm": [21.0152, 105.7650],
  "bac tu liem": [21.0835, 105.7725],
  "bắc từ liêm": [21.0835, 105.7725],
  "hoang mai": [20.9856, 105.8564],
  "hoàng mai": [20.9856, 105.8564],
  "long bien": [21.0365, 105.8925],
  "long biên": [21.0365, 105.8925],
  "ha dong": [20.9725, 105.7750],
  "hà đông": [20.9725, 105.7750],

  // Đà Nẵng
  "hai chau": [16.0544, 108.2208],
  "hải châu": [16.0544, 108.2208],
  "son tra": [16.0825, 108.2435],
  "sơn trà": [16.0825, 108.2435],
  "ngu hanh son": [16.0350, 108.2485],
  "ngũ hành sơn": [16.0350, 108.2485],
  "lien chieu": [16.0715, 108.1485],
  "liên chiểu": [16.0715, 108.1485],
  "thanh khe": [16.0615, 108.1915],
  "thanh khê": [16.0615, 108.1915],
  "cam le": [16.0185, 108.1985],
  "cẩm lệ": [16.0185, 108.1985],
}

export function resolveLocationCoordinates(
  location?: string,
  latitude?: unknown,
  longitude?: unknown
): { center: [number, number]; isExact: boolean } {
  if (isValidMapPosition(latitude, longitude)) {
    return { center: [latitude as number, longitude as number], isExact: true }
  }

  if (location) {
    const normalized = location.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    for (const [key, coords] of Object.entries(DISTRICT_COORDINATES)) {
      const normKey = key.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      if (normalized.includes(normKey)) {
        return { center: coords, isExact: false }
      }
    }

    if (normalized.includes("ha noi")) return { center: [21.0285, 105.8542], isExact: false }
    if (normalized.includes("da nang")) return { center: [16.0544, 108.2022], isExact: false }
  }

  return { center: [10.7769, 106.7009], isExact: false }
}
