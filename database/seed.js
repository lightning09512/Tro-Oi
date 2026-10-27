import "dotenv/config"
import bcrypt from "bcryptjs"
import mongoose from "mongoose"
import pg from "pg"
import Conversation from "../server/models/Conversation.js"
import Notification from "../server/models/Notification.js"

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required to seed PostgreSQL.")
if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is required to seed MongoDB.")

const seedPassword = process.env.SEED_PASSWORD || "PhongTro@123"
if (seedPassword.length < 12) throw new Error("SEED_PASSWORD must contain at least 12 characters.")
if (process.env.NODE_ENV === "production" && !process.env.SEED_PASSWORD) {
  throw new Error("SEED_PASSWORD is required when seeding a production environment.")
}

const { Pool } = pg
const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const users = [
  ["user-renter-01", "Hoàng Trang", "trang.nguyen@example.com", "0901234567", "renter", "/images/avatars/demo-owner-01.jpg"],
  ["user-renter-02", "Nguyễn An", "nguyenan@example.com", "0901234568", "renter", "/images/avatars/demo-owner-05.jpg"],
  ["user-renter-03", "Thu Hà", "thuha@example.com", "0901234569", "renter", "/images/avatars/demo-owner-02.jpg"],
  ["user-renter-04", "Quang Minh", "quangminh@example.com", "0901234570", "renter", "/images/avatars/demo-owner-06.jpg"],
  ["user-landlord-01", "Minh Ngọc", "minhngoc@example.com", "0987654321", "landlord", "/images/avatars/demo-owner-03.jpg"],
  ["user-landlord-02", "Anh Khoa", "anhkhoa@example.com", "0987654322", "landlord", "/images/avatars/demo-owner-04.jpg"],
  ["user-admin-01", "Quản trị viên", "admin@phongtroplus.vn", "0909000001", "admin", "/images/avatars/demo-owner-01.jpg"],
]

const forumImages = [
  "/images/tromoi/nha-tro-10-tran-thien-chanh/anh-02.webp",
  "/images/tromoi/nha-tro-binh-thanh-nguyen-van-dau/anh-02.webp",
  "/images/tromoi/nha-tro-24-13-nguyen-thai-binh/anh-03.webp",
  "/images/tromoi/nha-tro-105-ung-van-khiem/anh-03.webp",
  "/images/tromoi/nha-tro-nguyen-van-nghi/anh-02.webp",
  "/images/tromoi/ky-tuc-xa-huynh-khuong-an/anh-04.webp",
  "/images/tromoi/p301-quang-trung/anh-04.webp",
  "/images/tromoi/nha-tro-633-hong-bang/anh-01.webp",
  "/images/tromoi/nha-tro-341-bui-minh-truc/anh-01.jpg",
  "/images/tromoi/nha-tro-10-tran-thien-chanh/anh-04.webp",
  "/images/tromoi/nha-tro-binh-thanh-nguyen-van-dau/anh-04.webp",
  "/images/tromoi/ky-tuc-xa-huynh-khuong-an/anh-02.webp",
]

const forumPosts = [
  { id: "seed-forum-01", authorId: "user-renter-01", daysAgo: 1, content: "Mẹo kiểm tra phòng trước khi đặt cọc: hãy quay video hiện trạng, hỏi rõ giá điện nước, tiền giữ xe và chụp lại chỉ số đồng hồ. Mình đã tránh được một khoản phí phát sinh nhờ kiểm tra từ đầu.", comments: [["user-renter-02", "Cảm ơn bạn, phần ghi nhận hiện trạng bằng video rất hữu ích."], ["user-landlord-01", "Chủ trọ minh bạch cũng nên gửi bảng giá dịch vụ trước khi hẹn xem."]], likes: ["user-renter-02", "user-renter-03", "user-landlord-01"] },
  { id: "seed-forum-02", authorId: "user-renter-03", daysAgo: 2, content: "Mình đang tìm người ở ghép khu Bình Thạnh, ngân sách khoảng 2,5–3 triệu/người. Ưu tiên bạn nữ đi làm giờ hành chính, cùng giữ không gian chung sạch sẽ. Ai có kinh nghiệm chọn bạn ở ghép chia sẻ giúp mình nhé.", comments: [["user-renter-01", "Bạn nên gặp trực tiếp và thống nhất trước chuyện giờ giấc, khách đến chơi và chi phí chung."], ["user-renter-04", "Mình từng ở ghép, lập bảng chia tiền theo tháng sẽ dễ theo dõi hơn."]], likes: ["user-renter-01", "user-renter-04"] },
  { id: "seed-forum-03", authorId: "user-renter-02", daysAgo: 3, content: "Khi xem hợp đồng thuê, mọi người nhớ đọc điều khoản tăng giá, thời hạn báo trước khi trả phòng và cách hoàn cọc. Nếu có thỏa thuận miệng thì nên ghi thêm vào hợp đồng hoặc tin nhắn để hai bên cùng xác nhận.", comments: [["user-landlord-02", "Đúng rồi, điều khoản rõ từ đầu giúp chủ trọ và người thuê đều yên tâm."], ["user-renter-03", "Mình sẽ bổ sung mục bàn giao chìa khóa và đồ đạc vào biên bản."]], likes: ["user-renter-03", "user-renter-04", "user-landlord-02"] },
  { id: "seed-forum-04", authorId: "user-landlord-01", daysAgo: 4, content: "Chia sẻ từ phía chủ trọ: trước khi nhận phòng, hai bên nên chụp lại đồng hồ điện nước, tình trạng tường, thiết bị và lập biên bản bàn giao. Việc này giúp xử lý nhanh nếu có thắc mắc sau này.", comments: [["user-renter-01", "Mình rất thích cách làm có biên bản rõ ràng như vậy."], ["user-renter-02", "Có kèm ảnh hiện trạng thì càng dễ đối chiếu ạ."]], likes: ["user-renter-01", "user-renter-02", "user-renter-03"] },
  { id: "seed-forum-05", authorId: "user-renter-04", daysAgo: 5, content: "Có ai thuê trọ gần khu công nghệ cao Thủ Đức không? Mình đang cân nhắc giữa phòng gần chỗ làm và phòng xa hơn nhưng có máy giặt, bãi xe rộng. Mọi người thường ưu tiên tiêu chí nào nhất?", comments: [["user-renter-03", "Nếu đi làm mỗi ngày thì thời gian di chuyển đáng để cân nhắc lắm."], ["user-renter-01", "Mình thường tính tổng cả tiền xăng, gửi xe và thời gian đi lại."], ["user-landlord-02", "Hãy đến xem khu vực vào giờ cao điểm để kiểm tra đường đi."]], likes: ["user-renter-01", "user-renter-02"] },
  { id: "seed-forum-06", authorId: "user-renter-01", daysAgo: 6, content: "Cảnh báo nhỏ khi tìm phòng online: không chuyển tiền giữ chỗ nếu chưa xác minh người đăng, địa chỉ và điều kiện hoàn tiền. Nếu tin có giá rẻ bất thường, hãy rủ bạn bè đi xem cùng và trao đổi qua kênh có lưu lịch sử.", comments: [["user-renter-04", "Mình từng gặp tin dùng ảnh đẹp nhưng địa chỉ không khớp, mọi người nên kiểm tra kỹ."], ["user-admin-01", "Nếu thấy nội dung đáng ngờ, bạn có thể dùng chức năng báo cáo trên Trọ Ơi."]], likes: ["user-renter-02", "user-renter-03", "user-renter-04", "user-landlord-01"] },
  { id: "seed-forum-07", authorId: "user-landlord-02", daysAgo: 7, content: "Một bảng chi phí minh bạch nên có tiền phòng, điện, nước, Internet, giữ xe và ngày chốt số. Chủ trọ nên thông báo trước khi thay đổi giá để người thuê chủ động kế hoạch chi tiêu.", comments: [["user-renter-02", "Bảng chi phí tách riêng từng mục như vậy rất dễ kiểm tra."], ["user-renter-01", "Mình mong nhiều nơi công khai đơn giá ngay từ tin đăng."]], likes: ["user-renter-01", "user-renter-02", "user-renter-03"] },
  { id: "seed-forum-08", authorId: "user-renter-03", daysAgo: 8, content: "Cuối tuần này mình đi xem phòng lần đầu. Danh sách câu hỏi mình đã chuẩn bị gồm: giờ giấc ra vào, số người tối đa, có được nấu ăn không, phí phát sinh và cách xử lý khi hỏng thiết bị. Còn thiếu gì không mọi người?", comments: [["user-renter-04", "Hỏi thêm về ngập nước, tiếng ồn và chỗ phơi đồ nhé."], ["user-landlord-01", "Bạn cũng có thể hỏi thời gian sửa chữa trung bình khi có sự cố."], ["user-renter-02", "Đừng quên thử sóng điện thoại và Wi-Fi ngay tại phòng."]], likes: ["user-renter-01", "user-renter-02"] },
  { id: "seed-forum-09", authorId: "user-renter-02", daysAgo: 9, content: "Bạn nào đang pass phòng có thể ghi rõ giá thuê, tiền cọc, ngày có thể nhận phòng, thời hạn hợp đồng và phí dịch vụ. Thông tin đủ từ đầu giúp người cần tìm phòng đỡ mất thời gian hỏi lại.", comments: [["user-renter-03", "Mình cũng nghĩ nên nói rõ lý do pass phòng để người nhận dễ cân nhắc."], ["user-admin-01", "Khi đăng bài pass phòng, không nên công khai giấy tờ hoặc dữ liệu cá nhân nhạy cảm."]], likes: ["user-renter-01", "user-renter-03", "user-renter-04"] },
  { id: "seed-forum-10", authorId: "user-renter-04", daysAgo: 10, content: "Kinh nghiệm tiết kiệm điện ở phòng trọ: đặt điều hòa ở mức vừa phải, vệ sinh lưới lọc định kỳ và tắt bình nóng lạnh sau khi dùng. Tháng này hóa đơn của mình giảm đáng kể so với tháng trước.", comments: [["user-renter-01", "Mình cũng dùng ổ cắm có công tắc để tắt hẳn thiết bị chờ."], ["user-landlord-02", "Vệ sinh máy lạnh định kỳ cũng giúp máy chạy ổn định hơn."]], likes: ["user-renter-01", "user-renter-02"] },
  { id: "seed-forum-11", authorId: "user-landlord-01", daysAgo: 11, content: "Nếu căn phòng có vấn đề nhỏ như vòi nước rỉ hoặc ổ điện chập chờn, người thuê nên báo sớm kèm ảnh hoặc video. Mô tả rõ thời điểm và tình trạng sẽ giúp chủ trọ xử lý nhanh hơn.", comments: [["user-renter-03", "Cách trao đổi có hình ảnh giúp hai bên hiểu đúng vấn đề hơn nhiều."], ["user-renter-04", "Mình thường lưu lại thời gian đã báo để tiện theo dõi."]], likes: ["user-renter-02", "user-renter-03", "user-renter-04"] },
  { id: "seed-forum-12", authorId: "user-renter-01", daysAgo: 12, content: "Mình vừa chuyển trọ và thấy việc dọn đồ nhẹ nhàng hơn khi phân loại trước một tuần: đồ cần giữ, đồ thanh lý và đồ tặng lại. Mọi người có mẹo đóng gói hoặc tìm xe chở đồ tiết kiệm không?", comments: [["user-renter-02", "Dùng thùng giấy cùng kích cỡ và dán nhãn theo phòng sẽ dễ xếp hơn."], ["user-renter-03", "Mình thường đặt lịch xe trước vài ngày, nhất là cuối tuần."]], likes: ["user-renter-02", "user-renter-03", "user-renter-04", "user-landlord-01"] },
].map((post, index) => ({ ...post, image: forumImages[index] }))

async function seedPostgres() {
  const client = await pool.connect()
  try {
    await client.query("BEGIN")
    const passwordHash = await bcrypt.hash(seedPassword, 12)

    for (const [id, name, email, phone, role, avatarUrl] of users) {
      await client.query(
        `INSERT INTO users(id,name,email,phone,password_hash,role,status,avatar_url)
         VALUES($1,$2,$3,$4,$5,$6,'active',$7)
         ON CONFLICT(id) DO UPDATE SET
           name=EXCLUDED.name,email=EXCLUDED.email,phone=EXCLUDED.phone,
           password_hash=EXCLUDED.password_hash,role=EXCLUDED.role,status='active',avatar_url=EXCLUDED.avatar_url,updated_at=now()`,
        [id, name, email, phone, passwordHash, role, avatarUrl],
      )
    }

    const postIds = forumPosts.map((post) => post.id)
    await client.query("DELETE FROM forum_reactions WHERE post_id = ANY($1::text[])", [postIds])
    await client.query("DELETE FROM forum_comments WHERE post_id = ANY($1::text[])", [postIds])
    for (const post of forumPosts) {
      await client.query(
        `INSERT INTO forum_posts(id,author_id,content,image_url,status,created_at,updated_at)
         VALUES($1,$2,$3,$4,'active',now() - ($5::int * interval '1 day'),now())
         ON CONFLICT(id) DO UPDATE SET author_id=EXCLUDED.author_id,content=EXCLUDED.content,image_url=EXCLUDED.image_url,status='active',moderation_note='',created_at=EXCLUDED.created_at,updated_at=now()`,
        [post.id, post.authorId, post.content, post.image, post.daysAgo],
      )
      for (const [index, [authorId, content]] of post.comments.entries()) {
        await client.query(
          `INSERT INTO forum_comments(id,post_id,author_id,content,created_at,updated_at)
           VALUES($1,$2,$3,$4,now() - (($5::int * 24 + $6::int) * interval '1 hour'),now())`,
          [`${post.id}-comment-${index + 1}`, post.id, authorId, content, post.daysAgo, index + 2],
        )
      }
      for (const userId of post.likes) {
        await client.query("INSERT INTO forum_reactions(post_id,user_id) VALUES($1,$2) ON CONFLICT DO NOTHING", [post.id, userId])
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
  await seedMongo()
  console.log("Seeded PostgreSQL and MongoDB successfully.")
  console.log(`Added ${forumPosts.length} sample forum posts with comments and reactions.`)
  console.log("Development accounts: renter, landlord, and admin use the configured SEED_PASSWORD.")
} finally {
  await Promise.allSettled([pool.end(), mongoose.disconnect()])
}
