const areaEstimates = {
  "tromoi-apartment-sun-cosmo-ngu-hanh-son": 50,
  "tromoi-apartment-mia-plaza-lien-chieu": 65,
  "tromoi-apartment-doan-khue-ngu-hanh-son": 45,
  "tromoi-ktx-phan-van-tri": 32,
  "tromoi-ktx-long-truong": 28,
  "tromoi-ktx-huit-tay-thanh": 30,
  "tromoi-o-ghep-duong-so-21-tan-hung": 28,
  "tromoi-o-ghep-tran-thai-tong-cau-giay": 24,
  "tromoi-hanoi-au-co-tay-ho": 30,
  "tromoi-hoang-tang-bi-dong-ngac": 60,
  "tromoi-fpt-city-da-nang": 50,
  "tromoi-105-ung-van-khiem": 18,
  "tromoi-633-hong-bang": 16,
  "tromoi-binh-thanh-nguyen-van-dau": 22,
  "tromoi-341-bui-minh-truc": 20,
}

const sourceConfirmedDepositIds = new Set([
  "tromoi-nha-tran-nguyen-dan-lien-chieu",
  "tromoi-o-ghep-tran-thai-tong-cau-giay",
  "tromoi-60-18a-huynh-khuong-an",
])

const formatVnd = (amount) => Math.round(amount).toLocaleString("vi-VN")

export function withDemoEstimates(listing) {
  const areaEstimate = areaEstimates[listing.id]
  const areaIsEstimate = listing.area == null && areaEstimate != null
  const area = listing.area ?? areaEstimate ?? null
  const confirmedDeposit = sourceConfirmedDepositIds.has(listing.id)
  const depositMonths = listing.type === "Nhà nguyên căn" ? 2 : 1
  const deposit = confirmedDeposit
    ? listing.deposit
    : `Ước tính: ${depositMonths} tháng (~${formatVnd(listing.price * depositMonths)}đ)`

  return { ...listing, area, areaIsEstimate, deposit }
}
