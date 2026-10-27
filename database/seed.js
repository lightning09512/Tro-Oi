import "dotenv/config"
import bcrypt from "bcryptjs"
import mongoose from "mongoose"
import pg from "pg"
import Conversation from "../server/models/Conversation.js"
import Notification from "../server/models/Notification.js"

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required to seed PostgreSQL.")
const showcaseOnly = process.argv.includes("--showcase-only")
if (!showcaseOnly && !process.env.MONGODB_URI) throw new Error("MONGODB_URI is required to seed MongoDB.")

const seedPassword = process.env.SEED_PASSWORD || "PhongTro@123"
if (!showcaseOnly && seedPassword.length < 12) throw new Error("SEED_PASSWORD must contain at least 12 characters.")
if (!showcaseOnly && process.env.NODE_ENV === "production" && !process.env.SEED_PASSWORD) {
  throw new Error("SEED_PASSWORD is required when seeding a production environment.")
}

const { Pool } = pg
const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const photos = [
  "/images/rooms/studio-kitchen.jpg",
  "/images/rooms/student-desk.jpg",
  "/images/rooms/scandinavian-room.jpg",
  "/images/rooms/compact-color-room.jpg",
  "/images/rooms/simple-bedroom.jpg",
  "/images/rooms/wood-accent-room.jpg",
  "/images/rooms/blue-bedroom.jpg",
  "/images/rooms/single-bed.jpg",
  "/images/rooms/city-window.jpg",
  "/images/rooms/shared-dorm.jpg",
]

const users = [
  ["user-renter-01", "Hoàng Trang", "trang.nguyen@example.com", "0901234567", "renter"],
  ["user-renter-02", "Nguyễn An", "nguyenan@example.com", "0901234568", "renter"],
  ["user-landlord-01", "Minh Ngọc", "minhngoc@example.com", "0987654321", "landlord"],
  ["user-admin-01", "Quản trị viên", "admin@phongtroplus.vn", "0909000001", "admin"],
]

const listings = [
  {
    id: "room-thao-dien-studio",
    title: "Studio cửa sổ lớn, đầy đủ nội thất",
    description: "Ảnh minh họa cho dữ liệu demo. Studio có cửa sổ lớn, bếp riêng và nội thất cơ bản; hẻm yên tĩnh, gần cửa hàng tiện lợi và tuyến xe buýt.",
    price: 3_500_000,
    deposit: "1 tháng tiền thuê",
    area: 28,
    location: "Thảo Điền, Thủ Đức",
    type: "Căn hộ mini",
    amenities: ["Máy lạnh", "Bãi đỗ xe", "Giờ giấc tự do"],
    image: photos[0],
    gallery: [photos[0]],
    latitude: 10.8037,
    longitude: 106.73,
    views: 214,
    contacts: 18,
  },
  {
    id: "room-go-vap-balcony",
    title: "Phòng có ban công, gần chợ Gò Vấp",
    description: "Ảnh minh họa cho dữ liệu demo. Phòng có bàn học, cửa sổ thoáng và chỗ để xe trong nhà; khu dân cư có cửa hàng tiện lợi và chợ trong bán kính gần.",
    price: 2_800_000,
    deposit: "2.800.000đ",
    area: 25,
    location: "Phường 7, Gò Vấp",
    type: "Phòng trọ",
    amenities: ["Ban công", "Máy lạnh", "Bãi đỗ xe"],
    image: photos[1],
    gallery: [photos[1]],
    latitude: 10.8387,
    longitude: 106.6653,
    views: 176,
    contacts: 12,
  },
  {
    id: "room-binh-thanh-mini",
    title: "Căn hộ mini gần Đại học Văn Lang",
    description: "Ảnh minh họa cho dữ liệu demo. Căn hộ có khu bếp riêng, máy giặt và góc làm việc; phù hợp sinh viên hoặc người đi làm cần không gian yên tĩnh.",
    price: 4_200_000,
    deposit: "1 tháng tiền thuê",
    area: 32,
    location: "Phường 13, Bình Thạnh",
    type: "Căn hộ mini",
    amenities: ["Máy lạnh", "Máy giặt", "Bãi đỗ xe"],
    image: photos[2],
    gallery: [photos[2]],
    latitude: 10.8019,
    longitude: 106.714,
    views: 142,
    contacts: 9,
  },
  {
    id: "room-tan-phu-mezzanine",
    title: "Phòng gác lửng, giờ giấc tự do",
    description: "Ảnh minh họa cho dữ liệu demo. Phòng nhỏ có gác giúp tách khu ngủ và sinh hoạt; chủ trọ hỗ trợ xem phòng buổi tối và cuối tuần.",
    price: 2_500_000,
    deposit: "1 tháng tiền thuê",
    area: 22,
    location: "Tân Phú, TP. Hồ Chí Minh",
    type: "Phòng trọ",
    amenities: ["Gác lửng", "Giờ giấc tự do", "Cho nuôi thú cưng"],
    image: photos[3],
    gallery: [photos[3]],
    latitude: 10.7901,
    longitude: 106.6286,
    views: 98,
    contacts: 6,
  },
  {
    id: "room-phu-nhuan-single",
    title: "Phòng riêng yên tĩnh, có cửa sổ",
    description: "Ảnh minh họa cho dữ liệu demo. Phòng riêng diện tích vừa phải, có cửa sổ và nhà vệ sinh riêng; phù hợp một người đi làm cần chỗ ở yên tĩnh.",
    price: 3_200_000,
    deposit: "1 tháng tiền thuê",
    area: 20,
    location: "Phường 10, Phú Nhuận",
    type: "Phòng trọ",
    amenities: ["Cửa sổ", "Máy lạnh", "Nhà vệ sinh riêng"],
    image: photos[4],
    gallery: [photos[4]],
    latitude: 10.799,
    longitude: 106.681,
    views: 87,
    contacts: 7,
  },
  {
    id: "room-linh-trung-share",
    title: "Phòng ở ghép gần Làng Đại học",
    description: "Ảnh minh họa cho dữ liệu demo. Phòng ở ghép có giường tầng, tủ riêng và khu sinh hoạt chung; tiền thuê tính theo người, phù hợp sinh viên.",
    price: 1_600_000,
    deposit: "1 tháng tiền thuê",
    area: 18,
    location: "Linh Trung, Thủ Đức",
    type: "Ở ghép",
    amenities: ["Giường tầng", "Tủ cá nhân", "Bãi đỗ xe", "Gần xe buýt"],
    image: photos[9],
    gallery: [photos[9]],
    latitude: 10.8701,
    longitude: 106.777,
    views: 68,
    contacts: 4,
  },
  {
    id: "room-district-10-study",
    title: "Phòng gần Đại học Bách Khoa, có bàn học",
    description: "Ảnh minh họa cho dữ liệu demo. Phòng có bàn học và internet, cách trường và tuyến xe buýt vài phút; chi phí điện nước cần xác nhận khi xem phòng.",
    price: 3_000_000,
    deposit: "3.000.000đ",
    area: 23,
    location: "Phường 14, Quận 10",
    type: "Phòng trọ",
    amenities: ["Bàn học", "Máy lạnh", "Wifi", "Giờ giấc tự do"],
    image: photos[6],
    gallery: [photos[6]],
    latitude: 10.772,
    longitude: 106.667,
    views: 51,
    contacts: 3,
  },
  {
    id: "room-thu-duc-metro",
    title: "Phòng thoáng, gần ga Metro và khu công nghệ",
    description: "Ảnh minh họa cho dữ liệu demo. Căn hộ mini có bếp riêng và khu giặt phơi; tiện đi làm ở khu công nghệ, hãy hỏi chủ nhà về phí quản lý.",
    price: 4_800_000,
    deposit: "1 tháng tiền thuê",
    area: 30,
    location: "Hiệp Bình Chánh, Thủ Đức",
    type: "Căn hộ mini",
    amenities: ["Cửa sổ lớn", "Bếp riêng", "Máy giặt", "Thang máy"],
    image: photos[8],
    gallery: [photos[8]],
    latitude: 10.849,
    longitude: 106.757,
    views: 43,
    contacts: 2,
  },
  {
    id: "room-binh-tan-budget",
    title: "Phòng đủ nội thất cơ bản, giá vừa tầm",
    description: "Ảnh minh họa cho dữ liệu demo. Phòng có giường, tủ quần áo và cửa sổ; lựa chọn tiết kiệm cho người ở một mình, gần chợ và trạm xe buýt.",
    price: 2_200_000,
    deposit: "2.200.000đ",
    area: 18,
    location: "Bình Hưng Hòa, Bình Tân",
    type: "Phòng trọ",
    amenities: ["Giường", "Tủ quần áo", "Chỗ để xe", "Cửa sổ"],
    image: photos[7],
    gallery: [photos[7]],
    latitude: 10.755,
    longitude: 106.604,
    views: 39,
    contacts: 3,
  },
  {
    id: "room-go-vap-furnished",
    title: "Căn hộ nhỏ có nội thất gỗ và bếp riêng",
    description: "Ảnh minh họa cho dữ liệu demo. Căn hộ nhỏ có bếp riêng và nội thất cơ bản tông gỗ; phù hợp một người hoặc cặp đôi, gần cửa hàng tiện lợi.",
    price: 3_800_000,
    deposit: "1 tháng tiền thuê",
    area: 27,
    location: "Phường 11, Gò Vấp",
    type: "Căn hộ mini",
    amenities: ["Bếp riêng", "Tủ quần áo", "Máy lạnh", "Bãi đỗ xe"],
    image: photos[5],
    gallery: [photos[5]],
    latitude: 10.84,
    longitude: 106.665,
    views: 31,
    contacts: 2,
  },
]

const forumPosts = [
  {
    id: "forum-post-01",
    authorId: "user-renter-01",
    content: "Mọi người cho mình xin review khu trọ gần Đại học Quốc gia với ạ. Mình ưu tiên phòng an ninh, có cửa sổ và giá dưới 3 triệu.",
    image: photos[4],
    comments: [
      ["forum-comment-01", "user-landlord-01", "Bạn nhớ hỏi kỹ phí điện nước và giờ giấc nhé. Khu gần trường thường có nhiều lựa chọn trong tầm giá này."],
      ["forum-comment-02", "user-renter-02", "Mình đang ở Linh Trung, bạn nên đi xem buổi tối để kiểm tra đèn và an ninh quanh hẻm."],
    ],
    reactions: ["user-landlord-01", "user-renter-02"],
  },
  {
    id: "forum-post-02",
    authorId: "user-landlord-01",
    content: "Góc nhỏ sau hai tuần tự decor. Tổng chi phí chỉ hơn 1 triệu một chút, phần lớn đồ mình săn trên hội thanh lý. Có ai muốn mình chia sẻ danh sách đồ không?",
    image: photos[5],
    comments: [
      ["forum-comment-03", "user-renter-01", "Bạn có thể chia sẻ chỗ mua đồ decor giá ổn không? Góc phòng trông ấm áp quá."],
      ["forum-comment-04", "user-renter-02", "Mình quan tâm chiếc kệ gỗ nhỏ, bạn mua ở đâu vậy?"],
    ],
    reactions: ["user-renter-01", "user-renter-02"],
  },
  {
    id: "forum-post-03",
    authorId: "user-renter-02",
    content: "Mọi người cho mình hỏi khu Quận 10 tiền điện nước hiện khoảng bao nhiêu là hợp lý? Chủ nhà báo điện 4.000đ/kWh, nước 100.000đ/người.",
    image: "",
    comments: [
      ["forum-comment-05", "user-renter-01", "Bạn hỏi thêm có đồng hồ điện riêng không nhé, mình thấy giá này hơi cao nếu chưa gồm phí dịch vụ."],
      ["forum-comment-06", "user-landlord-01", "Nên ghi rõ các khoản vào hợp đồng và hỏi thêm phí rác, wifi, giữ xe nữa bạn ạ."],
    ],
    reactions: ["user-renter-01", "user-landlord-01"],
  },
  {
    id: "forum-post-04",
    authorId: "user-renter-01",
    content: "Mình đang tìm một bạn nữ ở ghép gần Làng Đại học từ đầu tháng sau. Phòng có tủ riêng và bếp dùng chung, ưu tiên người gọn gàng, lịch sự.",
    image: photos[9],
    comments: [
      ["forum-comment-07", "user-renter-02", "Bạn đăng rõ tổng chi phí mỗi tháng và tiền cọc nhé, mình có em gái đang tìm phòng."],
      ["forum-comment-08", "user-landlord-01", "Nhớ trao đổi trước về giờ giấc và cách chia tiền điện nước để ở chung thoải mái nha."],
    ],
    reactions: ["user-renter-02", "user-landlord-01"],
  },
  {
    id: "forum-post-05",
    authorId: "user-renter-02",
    content: "Lần đầu thuê trọ mình nên kiểm tra những gì trong hợp đồng? Phòng yêu cầu cọc một tháng và báo trước 30 ngày nếu chuyển đi.",
    image: photos[0],
    comments: [
      ["forum-comment-09", "user-landlord-01", "Bạn xem kỹ thời hạn thuê, điều kiện hoàn cọc, báo trước, các khoản phí và biên bản bàn giao tài sản nhé."],
      ["forum-comment-10", "user-renter-01", "Chụp lại hiện trạng phòng và công tơ điện nước vào ngày nhận phòng nữa bạn."],
    ],
    reactions: ["user-landlord-01", "user-renter-01"],
  },
  {
    id: "forum-post-06",
    authorId: "user-renter-01",
    content: "Checklist chuyển phòng của mình: chụp hiện trạng, chốt chỉ số điện nước, nhận đủ chìa khóa, kiểm tra khóa cửa và lưu số chủ trọ. Mọi người còn bổ sung gì không?",
    image: photos[3],
    comments: [
      ["forum-comment-11", "user-renter-02", "Kiểm tra cả vòi nước, ổ cắm và wifi ngay lúc nhận phòng nhé."],
      ["forum-comment-12", "user-landlord-01", "Nên lưu biên bản bàn giao có chữ ký hai bên để sau này đối chiếu tiền cọc."],
    ],
    reactions: ["user-renter-02", "user-landlord-01"],
  },
  {
    id: "forum-post-07",
    authorId: "user-renter-02",
    content: "Ai từng thuê quanh Đại học Văn Lang cơ sở Bình Thạnh cho mình xin ít kinh nghiệm với ạ. Mình đi học tối nên quan tâm đường về có sáng và dễ gọi xe không.",
    image: photos[2],
    comments: [
      ["forum-comment-13", "user-renter-01", "Bạn nên đi thử tuyến đường vào buổi tối và hỏi hàng xóm về tình hình ngập khi mưa."],
      ["forum-comment-14", "user-landlord-01", "Khu gần đường lớn tiện xe nhưng bạn nhớ kiểm tra tiếng ồn trong phòng vào giờ cao điểm."],
    ],
    reactions: ["user-renter-01", "user-landlord-01"],
  },
  {
    id: "forum-post-08",
    authorId: "user-landlord-01",
    content: "Chủ trọ nên ghi rõ tiền điện, nước, rác, wifi và ngày thanh toán ngay từ đầu. Minh bạch các khoản giúp người thuê dễ cân đối ngân sách hơn.",
    image: photos[1],
    comments: [
      ["forum-comment-15", "user-renter-02", "Cảm ơn chị, phần phí gửi xe cũng nên ghi rõ là tính theo xe hay theo người ạ."],
      ["forum-comment-16", "user-renter-01", "Nếu có đồng hồ riêng và ảnh chốt số đầu kỳ thì người thuê yên tâm hơn nhiều."],
    ],
    reactions: ["user-renter-01", "user-renter-02"],
  },
  {
    id: "forum-post-09",
    authorId: "user-renter-01",
    content: "Có khu trọ nào ở Gò Vấp cho nuôi mèo không ạ? Mình có một bé mèo đã tiêm phòng, sẽ tự dọn vệ sinh và giữ gìn đồ đạc.",
    image: photos[6],
    comments: [
      ["forum-comment-17", "user-landlord-01", "Bạn nên hỏi và xin xác nhận điều kiện nuôi thú cưng bằng tin nhắn trước khi đặt cọc nhé."],
      ["forum-comment-18", "user-renter-02", "Mình từng thấy vài phòng ở P. 7 cho nuôi mèo, bạn thử lọc tiện ích trên trang tìm phòng nha."],
    ],
    reactions: ["user-landlord-01", "user-renter-02"],
  },
  {
    id: "forum-post-10",
    authorId: "user-renter-02",
    content: "Nhắc nhẹ mọi người: đừng chuyển tiền giữ phòng khi chưa xác minh được người đăng và chưa xem phòng hoặc gọi video trực tiếp. Có dấu hiệu thúc ép chuyển cọc thì nên dừng lại.",
    image: "",
    comments: [
      ["forum-comment-19", "user-renter-01", "Chuẩn luôn, mình còn xin xem hợp đồng mẫu và xác nhận người nhận cọc là chủ nhà trước."],
      ["forum-comment-20", "user-landlord-01", "Chủ nhà cũng nên cung cấp thông tin rõ ràng và biên nhận nếu nhận tiền cọc."],
    ],
    reactions: ["user-renter-01", "user-landlord-01"],
  },
]

async function seedPostgres() {
  const client = await pool.connect()
  try {
    await client.query("BEGIN")
    if (showcaseOnly) {
      const demoUsers = await client.query(
        "SELECT id FROM users WHERE id=ANY($1::text[])",
        [["user-landlord-01", "user-renter-01", "user-renter-02"]],
      )
      if (demoUsers.rowCount !== 3) throw new Error("Run pnpm db:seed once first so the demo user accounts exist.")
    } else {
      const passwordHash = await bcrypt.hash(seedPassword, 12)
      for (const [id, name, email, phone, role] of users) {
        await client.query(
          `INSERT INTO users(id,name,email,phone,password_hash,role,status)
           VALUES($1,$2,$3,$4,$5,$6,'active')
           ON CONFLICT(id) DO UPDATE SET
             name=EXCLUDED.name,email=EXCLUDED.email,phone=EXCLUDED.phone,
             password_hash=EXCLUDED.password_hash,role=EXCLUDED.role,status='active',updated_at=now()`,
          [id, name, email, phone, passwordHash, role],
        )
      }
    }

    for (const item of listings) {
      const onConflict = showcaseOnly
        ? "image_url=EXCLUDED.image_url,gallery=EXCLUDED.gallery,updated_at=now()"
        : `owner_id=EXCLUDED.owner_id,title=EXCLUDED.title,description=EXCLUDED.description,
           price_vnd=EXCLUDED.price_vnd,deposit_text=EXCLUDED.deposit_text,area_m2=EXCLUDED.area_m2,
           location=EXCLUDED.location,room_type=EXCLUDED.room_type,contact_phone=EXCLUDED.contact_phone,
           amenities=EXCLUDED.amenities,image_url=EXCLUDED.image_url,gallery=EXCLUDED.gallery,
           latitude=EXCLUDED.latitude,longitude=EXCLUDED.longitude,status=EXCLUDED.status,
           views=EXCLUDED.views,contacts=EXCLUDED.contacts,updated_at=now()`
      await client.query(
        `INSERT INTO listings(
           id,owner_id,title,description,price_vnd,deposit_text,area_m2,location,
           room_type,contact_phone,amenities,image_url,gallery,latitude,longitude,
           status,views,contacts,created_at,updated_at
         ) VALUES($1,'user-landlord-01',$2,$3,$4,$5,$6,$7,$8,'0987654321',$9,$10,$11,$12,$13,'active',$14,$15,now(),now())
         ON CONFLICT(id) DO UPDATE SET ${onConflict}`,
        [
          item.id, item.title, item.description, item.price, item.deposit, item.area,
          item.location, item.type, JSON.stringify(item.amenities), item.image,
          JSON.stringify(item.gallery), item.latitude, item.longitude, item.views, item.contacts,
        ],
      )
    }

    if (!showcaseOnly) await client.query(
      `INSERT INTO transfers(
         id,owner_id,title,description,location,monthly_rent_vnd,transfer_fee_vnd,
         deposit_text,area_m2,room_type,contract_end_date,available_from,amenities,
         image_url,gallery,status,created_at,updated_at
       ) VALUES
       ('transfer-demo-active-01','user-renter-02','Sang lại phòng studio gần Đại học Sư phạm Kỹ thuật',
        'Phòng studio có cửa sổ lớn, máy lạnh, khu bếp riêng và chỗ để xe. Hợp đồng còn thời hạn, chủ nhà thân thiện; mình chuyển công tác nên cần sang lại sớm.',
        'Linh Trung, Thủ Đức, TP. Hồ Chí Minh',4200000,1500000,'Cọc 1 tháng tiền thuê',28,'Căn hộ mini','2027-03-31','2026-11-01',
        '["Máy lạnh","Bếp riêng","Chỗ để xe"]'::jsonb,$1,jsonb_build_array($1::text),'active',now(),now()),
       ('transfer-demo-pending-01','user-renter-01','Sang lại phòng trọ có gác, gần chợ Gò Vấp',
        'Phòng có gác rộng, nhà vệ sinh riêng, giờ giấc tự do. Hợp đồng còn đến cuối năm và có thể nhận phòng trong tháng tới.',
        'Phường 5, Gò Vấp, TP. Hồ Chí Minh',3500000,NULL,'Đã cọc 3.500.000đ',24,'Phòng trọ','2027-01-31','2026-11-05',
        '["Gác lửng","Nhà vệ sinh riêng"]'::jsonb,$2,jsonb_build_array($2::text),'pending',now(),now())
       ON CONFLICT(id) DO UPDATE SET
         owner_id=EXCLUDED.owner_id,title=EXCLUDED.title,description=EXCLUDED.description,
         location=EXCLUDED.location,monthly_rent_vnd=EXCLUDED.monthly_rent_vnd,
         transfer_fee_vnd=EXCLUDED.transfer_fee_vnd,deposit_text=EXCLUDED.deposit_text,
         area_m2=EXCLUDED.area_m2,room_type=EXCLUDED.room_type,
         contract_end_date=EXCLUDED.contract_end_date,available_from=EXCLUDED.available_from,
         amenities=EXCLUDED.amenities,image_url=EXCLUDED.image_url,gallery=EXCLUDED.gallery,
         status=EXCLUDED.status,moderation_note='',updated_at=now()`,
      [photos[1], photos[2]],
    )

    if (!showcaseOnly) await client.query(
      `INSERT INTO favorites(user_id,listing_id) VALUES('user-renter-01','room-go-vap-balcony')
       ON CONFLICT(user_id,listing_id) DO NOTHING`,
    )
    if (!showcaseOnly) await client.query(
      `INSERT INTO reviews(id,listing_id,author_id,stars,text)
       VALUES('review-1','room-thao-dien-studio','user-renter-01',5,
         'Phòng đúng như ảnh, cô chủ nhiệt tình. Khu vực yên tĩnh và đi lại thuận tiện.')
       ON CONFLICT(id) DO UPDATE SET stars=EXCLUDED.stars,text=EXCLUDED.text,updated_at=now()`,
    )
    for (const post of forumPosts) {
      await client.query(
        `INSERT INTO forum_posts(id,author_id,content,image_url,status)
         VALUES($1,$2,$3,$4,'active')
         ON CONFLICT(id) DO UPDATE SET content=EXCLUDED.content,image_url=EXCLUDED.image_url,updated_at=now()`,
        [post.id, post.authorId, post.content, post.image],
      )
      for (const [id, authorId, content] of post.comments) {
        await client.query(
          `INSERT INTO forum_comments(id,post_id,author_id,content) VALUES($1,$2,$3,$4)
           ON CONFLICT(id) DO UPDATE SET content=EXCLUDED.content,updated_at=now()`,
          [id, post.id, authorId, content],
        )
      }
      for (const userId of post.reactions) {
        await client.query(
          "INSERT INTO forum_reactions(post_id,user_id) VALUES($1,$2) ON CONFLICT(post_id,user_id) DO NOTHING",
          [post.id, userId],
        )
      }
    }
    await client.query("COMMIT")
  } catch (error) {
    await client.query("ROLLBACK")
    throw error
  } finally {
    client.release()
  }
}

async function seedMongo() {
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5_000 })
  await Notification.updateOne(
    { sourceId: "notification-seed-01" },
    { $setOnInsert: { sourceId: "notification-seed-01", userId: "user-renter-01", title: "Chào mừng đến Trọ Ơi", detail: "Dữ liệu này được tải từ MongoDB qua API.", read: false } },
    { upsert: true },
  )
  await Conversation.updateOne(
    { _id: "672000000000000000000001" },
    {
      $set: {
        participants: ["user-landlord-01", "user-renter-01"],
        listingId: "room-thao-dien-studio",
        transferId: "",
        mutedBy: [],
        messages: [
          { senderId: "user-landlord-01", text: "Chào bạn, phòng bạn hỏi hiện vẫn còn nhé.", readBy: ["user-landlord-01"] },
          { senderId: "user-renter-01", text: "Mình có thể hẹn xem phòng chiều mai không ạ?", readBy: ["user-renter-01"] },
        ],
      },
      $setOnInsert: { createdAt: new Date() },
    },
    { upsert: true },
  )
}

try {
  await seedPostgres()
  if (!showcaseOnly) await seedMongo()
  console.log(showcaseOnly ? "Showcase room and forum data updated in PostgreSQL." : "Seeded PostgreSQL and MongoDB successfully.")
  if (!showcaseOnly) console.log("Development accounts: renter, landlord, and admin use the configured SEED_PASSWORD.")
} finally {
  await Promise.allSettled([pool.end(), mongoose.disconnect()])
}
