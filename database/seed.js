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
  {
    id: "seed-forum-01",
    authorId: "user-renter-01",
    daysAgo: 1,
    content: "Kinh nghiệm xương máu cho mấy bạn tân sinh viên hoặc mới đi thuê trọ lần đầu: Lúc nhận phòng nhớ lôi điện thoại ra quay một chiếc video từ cửa vào trong thật kỹ nha mn! Chân tường ẩm mốc, vòi nước rỉ, ổ điện lỏng hay máy lạnh bám bụi thì quay rõ hết lại rồi gửi qua Zalo cho chủ trọ luôn để làm bằng chứng. Đợt trước mình chủ quan ko quay, lúc trả phòng bị trừ mất 600k tiền trầy tường oan ức cay ko chịu được :(",
    comments: [
      ["user-renter-02", "Chuẩn luôn b ơi, nhớ chụp luôn cả chỉ số đồng hồ điện nước ngày đầu dọn vào nữa nha, ko là gánh tiền tháng trước của ng ta ráng chịu á."],
      ["user-landlord-01", "Chủ trọ như mình cũng khuyến khích các bạn làm vậy nhé. Có video bàn giao ngay từ đầu hai bên cùng thoải mái, sau này trả phòng đỡ phải lấn cấn chuyện gì."],
      ["user-renter-03", "Bổ sung thêm là nhớ xả thử nước bồn cầu với vòi sen xem thoát nước có nhanh ko nha, trúng cống nghẹt là ám ảnh luôn."],
    ],
    likes: ["user-renter-02", "user-renter-03", "user-landlord-01"],
  },
  {
    id: "seed-forum-02",
    authorId: "user-renter-03",
    daysAgo: 2,
    content: "Góc tìm bạn ở ghép Bình Thạnh nè mn ơi 👋 Mình đang thuê 1 phòng studio ở hẻm Ung Văn Khiêm, gần ngã tư Hàng Xanh, muốn tìm 1 bạn nữ ở ghép để share tiền phòng tầm 2tr5 - 2tr8/tháng/người. Phòng đã có sẵn máy lạnh, tủ lạnh, bếp nấu ăn, giờ giấc tự do ko chung chủ. Ưu tiên bạn nào đi làm hoặc sinh viên năm 3-4, tính tình gọn gàng, sạch sẽ và biết tôn trọng không gian riêng tư nha. Ai thấy hợp vibe thì nhắn tin cho mình trao đổi thêm nhé!",
    comments: [
      ["user-renter-01", "Phòng xinh xắn quá bạn ơi, khu này đi làm qua Q1 hay Q3 đều tiện nè. Chúc b sớm tìm dc bạn hợp tính nha!"],
      ["user-renter-04", "Vote hai bạn hẹn ra cà phê nc một buổi trước xem thói quen sinh hoạt có khớp nhau ko là chuẩn bài nhất."],
    ],
    likes: ["user-renter-01", "user-renter-04"],
  },
  {
    id: "seed-forum-03",
    authorId: "user-renter-02",
    daysAgo: 3,
    content: "Mọi người đi ký hợp đồng thuê trọ nhớ đọc kỹ 3 chỗ này giùm mình, đừng có ký vội vàng theo lời hứa miệng nha:\n1. Thời gian báo trước khi trả phòng: Thường là báo trước 30 ngày, nhiều chỗ gài 45-60 ngày là mất cọc như chơi.\n2. Chi phí phát sinh: Ngoài tiền phòng + điện nước, nhớ hỏi rõ phí thang máy, tiền rác, wifi, vệ sinh hành lang là bao nhiêu, ghi hẳn vào giấy.\n3. Điều kiện nhận lại cọc: Quy định rõ ràng trong bao nhiêu ngày sau khi trả phòng chủ phải chuyển khoản trả cọc.\nGiấy trắng mực đen cho chắc ăn mn ạ!",
    comments: [
      ["user-landlord-02", "Bài viết rất thực tế. Người thuê hỏi kỹ từ đầu thì chủ trọ đàng hoàng họ càng thích vì chứng tỏ bạn có trách nhiệm."],
      ["user-renter-03", "Hôm trước mình vừa né được một quả hợp đồng ghi 'giá điện có thể thay đổi theo thỏa thuận', sợ quá chạy vội luôn á haha."],
    ],
    likes: ["user-renter-03", "user-renter-04", "user-landlord-02"],
  },
  {
    id: "seed-forum-04",
    authorId: "user-landlord-01",
    daysAgo: 4,
    content: "Góc chia sẻ thật lòng từ phía chủ trọ: Nhiều bạn cứ ngại báo mỗi khi trong phòng có thiết bị hỏng vặt. Nhưng thật ra vòi nước rò rỉ, phao bồn cầu kẹt hay aptomat nhảy các bạn cứ nhắn cho chủ trọ sớm giùm nha. Báo sớm thì mình cho thợ qua sửa trong ngày vừa tiết kiệm tiền nước cho các bạn, vừa giữ nhà bền đẹp. Đừng để nước ngấm hư hết sàn gỗ rồi lúc trả phòng lại khó xử cho cả đôi bên nè 😊",
    comments: [
      ["user-renter-01", "Gặp được chủ trọ có tâm và tâm lý như cô/chị là phước lành đi thuê trọ luôn á ❤️"],
      ["user-renter-02", "Dạ đúng rồi ạ, có vấn đề gì nhắn kèm tấm ảnh hoặc video ngắn là chủ hiểu ngay, sửa nhanh gọn lẹ."],
    ],
    likes: ["user-renter-01", "user-renter-02", "user-renter-03"],
  },
  {
    id: "seed-forum-05",
    authorId: "user-renter-04",
    daysAgo: 5,
    content: "Chào mn, tháng tới mình bắt đầu đi làm ở Khu công nghệ cao Thủ Đức. Đang phân vân giữa 2 lựa chọn: một là thuê phòng ngay gần chỗ làm (tầm Lê Văn Việt) nhưng phòng hơi nhỏ và cũ xíu, hai là dạt về mạn Gò Vấp/Bình Thạnh phòng mới xịn xò có thang máy máy giặt nhưng phải đi làm mất 35-40 phút. Ai từng trải qua cảnh này cho mình xin lời khuyên với, đi làm mùa mưa Sài Gòn có ngán lắm ko ạ?",
    comments: [
      ["user-renter-03", "Né đi xa giùm mình bạn ơi 😭 Mùa mưa SG kẹt xe Đỗ Xuân Hợp với Xa Lộ Hà Nội là khóc tiếng Mán luôn, đi làm về chỉ muốn xỉu chứ chẳng còn sức chill phòng đẹp đâu."],
      ["user-renter-01", "Vote thuê gần nha, dư ra mỗi ngày 1 tiếng rưỡi ngủ thêm với tập thể thao khỏe người hơn nhiều b à."],
      ["user-landlord-02", "Bên mạn Tăng Nhơn Phú B hoặc Lã Xuân Oai có nhiều dãy trọ mới xây sạch đẹp lắm, bạn thử chạy lòng vòng xem thử nha."],
    ],
    likes: ["user-renter-01", "user-renter-02"],
  },
  {
    id: "seed-forum-06",
    authorId: "user-renter-01",
    daysAgo: 6,
    content: "CẢNH BÁO LỪA ĐẢO CỌC PHÒNG ẢO MỌI NGƯỜI CẨN THẬN ⚠️\nHôm qua con bạn em suýt bị lừa 1 triệu tiền cọc giữ chỗ. Chiêu trò của tụi nó là lấy ảnh căn hộ studio cực đẹp trên mạng xong đăng giá siêu rẻ (chỉ 2tr5 - 3tr ở Q1/Q3), ai nhắn tin hỏi thì bảo 'phòng đang có nhiều người hỏi thuê lắm, muốn giữ thì ck trước 500k-1tr'. Vừa chuyển khoản xong là nó chặn Zalo, block Facebook luôn!\nMn nhớ nguyên tắc bất di bất dịch: KHÔNG chuyển 1 xu nào nếu chưa đến tận nơi xem phòng, gặp trực tiếp chủ nhà nha!",
    comments: [
      ["user-renter-04", "Trò này cũ mèm mà năm nào cũng có người dính, nhất là mấy em tân sinh viên mới lên TP chưa rành đường."],
      ["user-admin-01", "Mọi người thấy tin đăng nào có dấu hiệu bất thường hoặc giá rẻ vô lý thì bấm nút 'Báo cáo' ngay góc phải bài viết nhé, admin sẽ kiểm tra và khóa tài khoản vi phạm liền ạ."],
    ],
    likes: ["user-renter-02", "user-renter-03", "user-renter-04", "user-landlord-01"],
  },
  {
    id: "seed-forum-07",
    authorId: "user-landlord-02",
    daysAgo: 7,
    content: "Nhiều bạn hỏi mình cách tính chi phí sinh hoạt hàng tháng khi ở trọ sao cho khỏi bị hụt ví. Mình share bảng chi phí trung bình bên khu trọ mình quản lý để các bạn tham khảo lên ngân sách nhé:\n- Tiền phòng: 3tr5 (chia 2 bạn là 1tr750/người)\n- Điện: 3.5k x 120 số = tầm 420k (có máy lạnh bật tối)\n- Nước: 20k/khối x 4 khối = 80k/người\n- Wifi + Rác + Vệ sinh chung: 150k/phòng\nTổng cộng mỗi bạn tốn tầm 2tr1 - 2tr3/tháng tất tần tật. Mọi người ở khu khác có bảng giá tương đương ko?",
    comments: [
      ["user-renter-02", "Giá này bên anh tính quá hợp lý và minh bạch luôn á, nhiều chỗ tiền rác với xe máy đội lên cả nửa triệu khiếp vía."],
      ["user-renter-01", "Phòng em ở Tân Bình tiền điện 4k/số mà tháng nào cũng 800k tiền điện, chắc phải học cách tiết kiệm máy lạnh lại thôi."],
    ],
    likes: ["user-renter-01", "user-renter-02", "user-renter-03"],
  },
  {
    id: "seed-forum-08",
    authorId: "user-renter-03",
    daysAgo: 8,
    content: "Cuối tuần này mình dẫn đứa em gái mới lên trường đi tìm phòng trọ, soạn sẵn chiếc checklist này mang theo. Mọi người xem còn thiếu gì ko nhắc mình thêm với nha:\n1. Giờ giấc ra vào: có giới nghiêm 23h ko hay mở khóa vân tay tự do?\n2. Bạn bè/người thân đến chơi qua đêm có phải đăng ký hay đóng phí ko?\n3. Áp lực nước trên lầu có mạnh ko, nước nóng năng lượng mặt trời hay bình nóng lạnh?\n4. Xung quanh có bị ngập lúc mưa lớn hay gần quán nhậu hát karaoke ầm ĩ ko?\n5. Cửa sổ có song sắt an toàn ko?\nCảm ơn cả nhà nhiều nhiều!",
    comments: [
      ["user-renter-04", "Nhớ test luôn sóng 4G/Wifi trong phòng nha b, nhiều phòng trong hẻm sâu tường dày vào tới nơi mất sạch sóng đt luôn á."],
      ["user-landlord-01", "Checklist rất đầy đủ em nha. Nhớ hỏi thêm chỗ phơi đồ ngoài trời hay phơi trong phòng nhé, mùa mưa đồ lâu khô lắm."],
      ["user-renter-02", "Hỏi thêm có chỗ sạc xe điện ko nha nếu em gái đi xe máy điện, nhiều chung cư mini cấm sạc đêm á."],
    ],
    likes: ["user-renter-01", "user-renter-02"],
  },
  {
    id: "seed-forum-09",
    authorId: "user-renter-02",
    daysAgo: 9,
    content: "[PASS PHÒNG GẤP CÓ TẶNG NỘI THẤT]\nDo chuyển công tác về Cần Thơ nên mình cần pass lại phòng trọ lầu 1 ở đường Cộng Hòa, P.13, Tân Bình (gần Etown).\n- Giá thuê: 3tr8/tháng, cọc 1 tháng. Hợp đồng còn 5 tháng.\n- Phòng có gác cao ko đụng đầu, ban công riêng siêu thoáng, máy lạnh Daikin mới toanh.\n- Anh chủ trọ trẻ tính cực kỳ thoải mái, xe để tầng trệt free.\nBạn nào dọn vào trước ngày 1 thì mình tặng lại luôn cái kệ bếp gỗ với giá treo quần áo còn mới 95% nha. Xem phòng thoải mái sau 18h các ngày trong tuần ạ.",
    comments: [
      ["user-renter-03", "Phòng nhìn sáng sủa thoáng mát ghê, cho mình xin số Zalo hoặc inbox hỏi thăm với nha b ơi."],
      ["user-admin-01", "Lưu ý nhỏ: Hai bên nhớ nhờ chủ trọ làm lại phụ lục chuyển nhượng hợp đồng chính thức để sang tên cọc an toàn nhé ạ."],
    ],
    likes: ["user-renter-01", "user-renter-03", "user-renter-04"],
  },
  {
    id: "seed-forum-10",
    authorId: "user-renter-04",
    daysAgo: 10,
    content: "Chia sẻ xíu kinh nghiệm xài điều hòa tháng vừa rồi hóa đơn của mình giảm từ 700k xuống còn hơn 350k:\n1. Đặt nhiệt độ ở mức 26-27 độ kết hợp bật quạt gió thoang thoảng: Vừa mát đều khắp phòng vừa ko bị khô họng.\n2. Hẹn giờ tắt trước khi thức dậy 1 tiếng: Tầm 5h sáng trời mát rồi, phòng vẫn giữ hơi lạnh tới 6-7h dậy là vừa đẹp.\n3. Tháo lưới lọc bụi ra rửa 2 tuần 1 lần: Cái này quan trọng cực, bụi bám dày máy chạy gằn ăn điện gấp rưỡi mà ko mát.\nBác nào đang méo mặt vì tiền điện hè này thử áp dụng xem sao nha!",
    comments: [
      ["user-renter-01", "Ôi chuẩn luôn, nhà mình lắp thêm cái rèm cửa cản nắng che bớt kính ban công nhiệt độ giảm hẳn 2-3 độ luôn nè."],
      ["user-landlord-02", "Lưới lọc sạch cũng giúp lốc máy lạnh bền hơn nhiều, đỡ hỏng hóc giữa mùa nóng."],
    ],
    likes: ["user-renter-01", "user-renter-02"],
  },
  {
    id: "seed-forum-11",
    authorId: "user-landlord-01",
    daysAgo: 11,
    content: "Chuyện nuôi boss ở trọ 🐱🐶\nDãy trọ bên mình hiện tại cho nuôi mèo và cún nhỏ, nhưng mình luôn dặn các bạn kỹ về chuyện tiêm phòng đầy đủ và dùng cát vệ sinh khử mùi. Mấy bé ngoan thì cưng xỉu, nhưng nếu để thú cưng cào rách lưới chống muỗi hay sủa đêm ảnh hưởng phòng bên cạnh thì chủ trọ cũng khó xử với cả xóm trọ lắm. Các bạn đi thuê trọ mang theo thú cưng thường tìm kiếm những tiêu chí gì nhất ở khu trọ ạ?",
    comments: [
      ["user-renter-03", "Dạ em nuôi 1 bé mèo, tiêu chí số 1 là có ban công rào chắn an toàn hoặc cửa sổ có song sắt để bé ko bị té ngã ạ."],
      ["user-renter-04", "Nhiều khu trọ thấy nuôi thú cưng là hét giá thêm 300-500k/tháng vô lý ghê, gặp chỗ tâm lý như bên cô là quý lắm."],
    ],
    likes: ["user-renter-02", "user-renter-03", "user-renter-04"],
  },
  {
    id: "seed-forum-12",
    authorId: "user-renter-01",
    daysAgo: 12,
    content: "Chủ nhật này em chính thức dọn sang phòng mới, chia sẻ chút kinh nghiệm đóng gói đồ cho bạn nào chuẩn bị dọn trọ nha:\n- Quần áo: đừng gấp từng cái ra khỏi móc, cứ gom 10-15 cái móc chung một túi rác to màu đen túm cổ lại, qua phòng mới treo lên luôn mất đúng 3 giây!\n- Đồ sành sứ, ly chén: quấn bằng mấy cái áo thun cũ hoặc khăn tắm, vừa êm vừa ko tốn tiền mua xốp bọc nilon nổ.\n- Đồ linh tinh: dùng bút dạ ghi rõ tên phòng lên từng thùng carton (vd: đồ bếp, đồ tắm, mỹ phẩm...) dọn tới đâu mở tới đó cực kỳ nhàn.\nAi có mối xe ba gác hoặc xe tải nhỏ chuyển trọ uy tín giá sinh viên bên Bình Thạnh ko cho em xin contact với ạ!",
    comments: [
      ["user-renter-02", "Mẹo bọc quần áo cả móc thông minh ghê, đợt trước mình ngồi gấp đồ dọn trọ muốn gãy cái lưng haha."],
      ["user-renter-03", "Bác tài xế xe tải nhỏ 0908... đợt trc chở cho mình nhiệt tình lắm, phụ bưng bê đồ lên lầu luôn ko tính thêm tiền nè b, để mình nhắn sđt cho."],
      ["user-landlord-01", "Chúc em sang phòng mới nhiều may mắn, ở trọ vui vẻ thuận lợi nhé!"],
    ],
    likes: ["user-renter-02", "user-renter-03", "user-renter-04", "user-landlord-01"],
  },
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

    // Assign active listings to demo landlords
    await client.query(`UPDATE listings SET owner_id = 'user-landlord-01' WHERE id IN ('tromoi-105-ung-van-khiem', 'tromoi-binh-thanh-nguyen-van-dau')`)
    await client.query(`UPDATE listings SET owner_id = 'user-landlord-02' WHERE id IN ('tromoi-phong-tro-huynh-van-nghe-tan-binh')`)

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

    const sampleReviews = [
      ["tromoi-105-ung-van-khiem", "user-renter-01", 5, "Mình từng ở trọ bên cô Ngọc gần 1 năm trước khi đổi chỗ làm. Phòng sạch sẽ, nước máy mạnh, cô chú chủ trọ cực kỳ dễ thương và tôn trọng sự riêng tư của khách thuê. Xe để tầng trệt có khóa vân tay rất an tâm nha mn."],
      ["tromoi-105-ung-van-khiem", "user-renter-03", 5, "Vị trí ở Ung Văn Khiêm ra ngã tư Hàng Xanh siêu gần, đi học Hutech hay Ngoại Thương đều tiện. Phòng có ban công đón nắng tốt, giờ giấc tự do không chung chủ."],
      ["tromoi-binh-thanh-nguyen-van-dau", "user-renter-02", 4, "Phòng ốc sạch đẹp y như ảnh chụp trên web, gác cao đứng thẳng người thoải mái ko sợ đụng đầu. Điểm trừ xíu là hẻm 241 hơi đông vào giờ tan tầm, nhưng bù lại an ninh tốt, hàng xóm văn minh."],
      ["tromoi-phong-tro-huynh-van-nghe-tan-binh", "user-renter-04", 5, "Anh chủ trọ trẻ tính, dễ tính và nhiệt tình. Lúc nhận phòng anh kiểm tra máy lạnh quạt gió hoạt động tốt mới bàn giao. Giá điện nước tính đúng theo giá cam kết, ko phát sinh phụ phí gì."],
    ]
    for (const [listingId, authorId, stars, text] of sampleReviews) {
      await client.query(
        `INSERT INTO reviews(id, listing_id, author_id, stars, text, created_at, updated_at)
         VALUES($1, $2, $3, $4, $5, now() - interval '3 days', now())
         ON CONFLICT (listing_id, author_id) DO UPDATE SET
           stars=EXCLUDED.stars, text=EXCLUDED.text, updated_at=now()`,
        [`review-${listingId}-${authorId}`, listingId, authorId, stars, text],
      )
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

  const landlordRenterMsgs = [
    { senderId: "user-renter-01", text: "Dạ em chào chị Ngọc ạ, em thấy tin phòng studio bên Ung Văn Khiêm của mình, hiện phòng còn trống không chị?", readBy: ["user-renter-01", "user-landlord-01"], createdAt: new Date(Date.now() - 3600_000 * 26) },
    { senderId: "user-landlord-01", text: "Chào em nha, phòng lầu 2 ban công thoáng bên chị vẫn còn nhé! Em tính khi nào dọn qua?", readBy: ["user-landlord-01", "user-renter-01"], createdAt: new Date(Date.now() - 3600_000 * 25) },
    { senderId: "user-renter-01", text: "Dạ cuối tháng này em chuyển trọ á chị. Tầm chiều mai 5h30 em ghé xem phòng thực tế được không chị ha?", readBy: ["user-renter-01", "user-landlord-01"], createdAt: new Date(Date.now() - 3600_000 * 24) },
    { senderId: "user-landlord-01", text: "Được em nhé, tầm đó chị có ở nhà. Tới hẻm 105 Ung Văn Khiêm em cứ alo số chị 0987 654 321 chị ra đón vô xem nha.", readBy: ["user-landlord-01", "user-renter-01"], createdAt: new Date(Date.now() - 3600_000 * 23) },
    { senderId: "user-renter-01", text: "Dạ chị ơi, cho em hỏi thêm là tiền điện nước với xe cộ bên mình tính sao chị ha?", readBy: ["user-renter-01", "user-landlord-01"], createdAt: new Date(Date.now() - 3600_000 * 5) },
    { senderId: "user-landlord-01", text: "Điện 3.5k/số đồng hồ riêng từng phòng em nha, nước máy 20k/khối. Xe máy để tầng trệt có khóa vân tay với camera 24/7, miễn phí 1 xe nhé em.", readBy: ["user-landlord-01", "user-renter-01"], createdAt: new Date(Date.now() - 3600_000 * 4) },
    { senderId: "user-renter-01", text: "Dạ vâng chị, nghe ưng quá. Chiều mai 5h30 em qua alo chị liền nha, em cảm ơn chị!", readBy: ["user-renter-01", "user-landlord-01"], createdAt: new Date(Date.now() - 3600_000 * 2) },
    { senderId: "user-landlord-01", text: "Okie em, hẹn em chiều mai nhé!", readBy: ["user-landlord-01"], createdAt: new Date(Date.now() - 3600_000 * 1) },
  ]

  await Conversation.updateOne(
    { _id: "672000000000000000000001" },
    {
      $set: {
        participants: ["user-landlord-01", "user-renter-01"],
        listingId: "tromoi-105-ung-van-khiem",
        mutedBy: [],
        messages: landlordRenterMsgs,
      },
      $setOnInsert: { createdAt: new Date() },
    },
    { upsert: true },
  )

  const activeUser = await pool.query("SELECT id FROM users WHERE id='11e095c2-caff-4698-9168-7480ac8a8d17'")
  if (activeUser.rows[0]) {
    const participants = ["11e095c2-caff-4698-9168-7480ac8a8d17", "user-landlord-01"].sort()
    let conv = await Conversation.findOne({ participants: { $all: participants, $size: 2 } })
    const userMessages = [
      { senderId: "11e095c2-caff-4698-9168-7480ac8a8d17", text: "Dạ em chào chị Ngọc ạ, em thấy tin phòng trọ Ung Văn Khiêm của mình trên Trọ Ơi, phòng còn trống không chị?", readBy: ["11e095c2-caff-4698-9168-7480ac8a8d17", "user-landlord-01"], createdAt: new Date(Date.now() - 3600_000 * 6) },
      { senderId: "user-landlord-01", text: "Chào em nha, phòng bên Ung Văn Khiêm lầu 2 có ban công thoáng vẫn còn nha em! Em tính khi nào dọn qua?", readBy: ["user-landlord-01", "11e095c2-caff-4698-9168-7480ac8a8d17"], createdAt: new Date(Date.now() - 3600_000 * 5) },
      { senderId: "11e095c2-caff-4698-9168-7480ac8a8d17", text: "Dạ cuối tháng này hợp đồng bên chỗ cũ của em hết hạn á chị. Chiều mai tầm 5h30 em ghé qua xem phòng được không chị ha?", readBy: ["11e095c2-caff-4698-9168-7480ac8a8d17", "user-landlord-01"], createdAt: new Date(Date.now() - 3600_000 * 4) },
      { senderId: "user-landlord-01", text: "Được em nhé, tầm đó chị có ở nhà trọ. Tới hẻm 105 Ung Văn Khiêm em cứ alo số 0987 654 321 chị ra đón vô xem nha.", readBy: ["user-landlord-01", "11e095c2-caff-4698-9168-7480ac8a8d17"], createdAt: new Date(Date.now() - 3600_000 * 3) },
      { senderId: "11e095c2-caff-4698-9168-7480ac8a8d17", text: "Dạ chị ơi, cho em hỏi thêm là chi phí điện nước với chỗ để xe bên mình tính thế nào chị ha?", readBy: ["11e095c2-caff-4698-9168-7480ac8a8d17", "user-landlord-01"], createdAt: new Date(Date.now() - 3600_000 * 2) },
      { senderId: "user-landlord-01", text: "Điện 3.5k/số đồng hồ riêng từng phòng em nha, nước máy 20k/khối. Xe máy để tầng trệt có khóa vân tay với camera an ninh 24/7, miễn phí 1 xe nhé em.", readBy: ["user-landlord-01", "11e095c2-caff-4698-9168-7480ac8a8d17"], createdAt: new Date(Date.now() - 3600_000 * 1) },
      { senderId: "11e095c2-caff-4698-9168-7480ac8a8d17", text: "Dạ vâng nghe ưng quá chị. Chiều mai tầm 5h30 em chạy qua alo chị liền nha, em cảm ơn chị!", readBy: ["11e095c2-caff-4698-9168-7480ac8a8d17"], createdAt: new Date(Date.now() - 1800_000) },
      { senderId: "user-landlord-01", text: "Okie em nha, hẹn em chiều mai nhé!", readBy: ["user-landlord-01"], createdAt: new Date(Date.now() - 900_000) },
    ]
    if (conv) {
      conv.messages = userMessages
      conv.listingId = "tromoi-105-ung-van-khiem"
      await conv.save()
    } else {
      await Conversation.create({
        participants,
        listingId: "tromoi-105-ung-van-khiem",
        messages: userMessages,
        mutedBy: [],
      })
    }
  }
}

try {
  await seedPostgres()
  await seedMongo()
  console.log("Seeded PostgreSQL and MongoDB successfully.")
  console.log(`Added ${forumPosts.length} sample forum posts with natural comments and reactions.`)
  console.log("Development accounts: renter, landlord, and admin use the configured SEED_PASSWORD.")
} finally {
  await Promise.allSettled([pool.end(), mongoose.disconnect()])
}
