-- Update listing owners so demo landlords have real active listings
UPDATE listings SET owner_id = 'user-landlord-01' WHERE id IN ('tromoi-105-ung-van-khiem', 'tromoi-binh-thanh-nguyen-van-dau');
UPDATE listings SET owner_id = 'user-landlord-02' WHERE id IN ('tromoi-phong-tro-huynh-van-nghe-tan-binh');

-- Update Forum Posts with natural, authentic community voice
UPDATE forum_posts SET
  content = 'Kinh nghiệm xương máu cho mấy bạn tân sinh viên hoặc mới đi thuê trọ lần đầu: Lúc nhận phòng nhớ lôi điện thoại ra quay một chiếc video từ cửa vào trong thật kỹ nha mn! Chân tường ẩm mốc, vòi nước rỉ, ổ điện lỏng hay máy lạnh bám bụi thì quay rõ hết lại rồi gửi qua Zalo cho chủ trọ luôn để làm bằng chứng. Đợt trước mình chủ quan ko quay, lúc trả phòng bị trừ mất 600k tiền trầy tường oan ức cay ko chịu được :('
WHERE id = 'seed-forum-01';

UPDATE forum_posts SET
  content = 'Góc tìm bạn ở ghép Bình Thạnh nè mn ơi 👋 Mình đang thuê 1 phòng studio ở hẻm Ung Văn Khiêm, gần ngã tư Hàng Xanh, muốn tìm 1 bạn nữ ở ghép để share tiền phòng tầm 2tr5 - 2tr8/tháng/người. Phòng đã có sẵn máy lạnh, tủ lạnh, bếp nấu ăn, giờ giấc tự do ko chung chủ. Ưu tiên bạn nào đi làm hoặc sinh viên năm 3-4, tính tình gọn gàng, sạch sẽ và biết tôn trọng không gian riêng tư nha. Ai thấy hợp vibe thì nhắn tin cho mình trao đổi thêm nhé!'
WHERE id = 'seed-forum-02';

UPDATE forum_posts SET
  content = E'Mọi người đi ký hợp đồng thuê trọ nhớ đọc kỹ 3 chỗ này giùm mình, đừng có ký vội vàng theo lời hứa miệng nha:\n1. Thời gian báo trước khi trả phòng: Thường là báo trước 30 ngày, nhiều chỗ gài 45-60 ngày là mất cọc như chơi.\n2. Chi phí phát sinh: Ngoài tiền phòng + điện nước, nhớ hỏi rõ phí thang máy, tiền rác, wifi, vệ sinh hành lang là bao nhiêu, ghi hẳn vào giấy.\n3. Điều kiện nhận lại cọc: Quy định rõ ràng trong bao nhiêu ngày sau khi trả phòng chủ phải chuyển khoản trả cọc.\nGiấy trắng mực đen cho chắc ăn mn ạ!'
WHERE id = 'seed-forum-03';

UPDATE forum_posts SET
  content = 'Góc chia sẻ thật lòng từ phía chủ trọ: Nhiều bạn cứ ngại báo mỗi khi trong phòng có thiết bị hỏng vặt. Nhưng thật ra vòi nước rò rỉ, phao bồn cầu kẹt hay aptomat nhảy các bạn cứ nhắn cho chủ trọ sớm giùm nha. Báo sớm thì mình cho thợ qua sửa trong ngày vừa tiết kiệm tiền nước cho các bạn, vừa giữ nhà bền đẹp. Đừng để nước ngấm hư hết sàn gỗ rồi lúc trả phòng lại khó xử cho cả đôi bên nè 😊'
WHERE id = 'seed-forum-04';

UPDATE forum_posts SET
  content = 'Chào mn, tháng tới mình bắt đầu đi làm ở Khu công nghệ cao Thủ Đức. Đang phân vân giữa 2 lựa chọn: một là thuê phòng ngay gần chỗ làm (tầm Lê Văn Việt) nhưng phòng hơi nhỏ và cũ xíu, hai là dạt về mạn Gò Vấp/Bình Thạnh phòng mới xịn xò có thang máy máy giặt nhưng phải đi làm mất 35-40 phút. Ai từng trải qua cảnh này cho mình xin lời khuyên với, đi làm mùa mưa Sài Gòn có ngán lắm ko ạ?'
WHERE id = 'seed-forum-05';

UPDATE forum_posts SET
  content = E'CẢNH BÁO LỪA ĐẢO CỌC PHÒNG ẢO MỌI NGƯỜI CẨN THẬN ⚠️\nHôm qua con bạn em suýt bị lừa 1 triệu tiền cọc giữ chỗ. Chiêu trò của tụi nó là lấy ảnh căn hộ studio cực đẹp trên mạng xong đăng giá siêu rẻ (chỉ 2tr5 - 3tr ở Q1/Q3), ai nhắn tin hỏi thì bảo ''phòng đang có nhiều người hỏi thuê lắm, muốn giữ thì ck trước 500k-1tr''. Vừa chuyển khoản xong là nó chặn Zalo, block Facebook luôn!\nMn nhớ nguyên tắc bất di bất dịch: KHÔNG chuyển 1 xu nào nếu chưa đến tận nơi xem phòng, gặp trực tiếp chủ nhà nha!'
WHERE id = 'seed-forum-06';

UPDATE forum_posts SET
  content = E'Nhiều bạn hỏi mình cách tính chi phí sinh hoạt hàng tháng khi ở trọ sao cho khỏi bị hụt ví. Mình share bảng chi phí trung bình bên khu trọ mình quản lý để các bạn tham khảo lên ngân sách nhé:\n- Tiền phòng: 3tr5 (chia 2 bạn là 1tr750/người)\n- Điện: 3.5k x 120 số = tầm 420k (có máy lạnh bật tối)\n- Nước: 20k/khối x 4 khối = 80k/người\n- Wifi + Rác + Vệ sinh chung: 150k/phòng\nTổng cộng mỗi bạn tốn tầm 2tr1 - 2tr3/tháng tất tần tật. Mọi người ở khu khác có bảng giá tương đương ko?'
WHERE id = 'seed-forum-07';

UPDATE forum_posts SET
  content = E'Cuối tuần này mình dẫn đứa em gái mới lên trường đi tìm phòng trọ, soạn sẵn chiếc checklist này mang theo. Mọi người xem còn thiếu gì ko nhắc mình thêm với nha:\n1. Giờ giấc ra vào: có giới nghiêm 23h ko hay mở khóa vân tay tự do?\n2. Bạn bè/người thân đến chơi qua đêm có phải đăng ký hay đóng phí ko?\n3. Áp lực nước trên lầu có mạnh ko, nước nóng năng lượng mặt trời hay bình nóng lạnh?\n4. Xung quanh có bị ngập lúc mưa lớn hay gần quán nhậu hát karaoke ầm ĩ ko?\n5. Cửa sổ có song sắt an toàn ko?\nCảm ơn cả nhà nhiều nhiều!'
WHERE id = 'seed-forum-08';

UPDATE forum_posts SET
  content = E'[PASS PHÒNG GẤP CÓ TẶNG NỘI THẤT]\nDo chuyển công tác về Cần Thơ nên mình cần pass lại phòng trọ lầu 1 ở đường Cộng Hòa, P.13, Tân Bình (gần Etown).\n- Giá thuê: 3tr8/tháng, cọc 1 tháng. Hợp đồng còn 5 tháng.\n- Phòng có gác cao ko đụng đầu, ban công riêng siêu thoáng, máy lạnh Daikin mới toanh.\n- Anh chủ trọ trẻ tính cực kỳ thoải mái, xe để tầng trệt free.\nBạn nào dọn vào trước ngày 1 thì mình tặng lại luôn cái kệ bếp gỗ với giá treo quần áo còn mới 95% nha. Xem phòng thoải mái sau 18h các ngày trong tuần ạ.'
WHERE id = 'seed-forum-09';

UPDATE forum_posts SET
  content = E'Chia sẻ xíu kinh nghiệm xài điều hòa tháng vừa rồi hóa đơn của mình giảm từ 700k xuống còn hơn 350k:\n1. Đặt nhiệt độ ở mức 26-27 độ kết hợp bật quạt gió thoang thoảng: Vừa mát đều khắp phòng vừa ko bị khô họng.\n2. Hẹn giờ tắt trước khi thức dậy 1 tiếng: Tầm 5h sáng trời mát rồi, phòng vẫn giữ hơi lạnh tới 6-7h dậy là vừa đẹp.\n3. Tháo lưới lọc bụi ra rửa 2 tuần 1 lần: Cái này quan trọng cực, bụi bám dày máy chạy gằn ăn điện gấp rưỡi mà ko mát.\nBác nào đang méo mặt vì tiền điện hè này thử áp dụng xem sao nha!'
WHERE id = 'seed-forum-10';

UPDATE forum_posts SET
  content = E'Chuyện nuôi boss ở trọ 🐱🐶\nDãy trọ bên mình hiện tại cho nuôi mèo và cún nhỏ, nhưng mình luôn dặn các bạn kỹ về chuyện tiêm phòng đầy đủ và dùng cát vệ sinh khử mùi. Mấy bé ngoan thì cưng xỉu, nhưng nếu để thú cưng cào rách lưới chống muỗi hay sủa đêm ảnh hưởng phòng bên cạnh thì chủ trọ cũng khó xử với cả xóm trọ lắm. Các bạn đi thuê trọ mang theo thú cưng thường tìm kiếm những tiêu chí gì nhất ở khu trọ ạ?'
WHERE id = 'seed-forum-11';

UPDATE forum_posts SET
  content = E'Chủ nhật này em chính thức dọn sang phòng mới, chia sẻ chút kinh nghiệm đóng gói đồ cho bạn nào chuẩn bị dọn trọ nha:\n- Quần áo: đừng gấp từng cái ra khỏi móc, cứ gom 10-15 cái móc chung một túi rác to màu đen túm cổ lại, qua phòng mới treo lên luôn mất đúng 3 giây!\n- Đồ sành sứ, ly chén: quấn bằng mấy cái áo thun cũ hoặc khăn tắm, vừa êm vừa ko tốn tiền mua xốp bọc nilon nổ.\n- Đồ linh tinh: dùng bút dạ ghi rõ tên phòng lên từng thùng carton (vd: đồ bếp, đồ tắm, mỹ phẩm...) dọn tới đâu mở tới đó cực kỳ nhàn.\nAi có mối xe ba gác hoặc xe tải nhỏ chuyển trọ uy tín giá sinh viên bên Bình Thạnh ko cho em xin contact với ạ!'
WHERE id = 'seed-forum-12';

-- Delete and rewrite comments with realistic, lively netizen dialogue
DELETE FROM forum_comments WHERE post_id IN (
  'seed-forum-01', 'seed-forum-02', 'seed-forum-03', 'seed-forum-04',
  'seed-forum-05', 'seed-forum-06', 'seed-forum-07', 'seed-forum-08',
  'seed-forum-09', 'seed-forum-10', 'seed-forum-11', 'seed-forum-12'
);

INSERT INTO forum_comments(id, post_id, author_id, content, created_at) VALUES
  ('seed-forum-01-c1', 'seed-forum-01', 'user-renter-02', 'Chuẩn luôn b ơi, nhớ chụp luôn cả chỉ số đồng hồ điện nước ngày đầu dọn vào nữa nha, ko là gánh tiền tháng trước của ng ta ráng chịu á.', now() - interval '22 hours'),
  ('seed-forum-01-c2', 'seed-forum-01', 'user-landlord-01', 'Chủ trọ như mình cũng khuyến khích các bạn làm vậy nhé. Có video bàn giao ngay từ đầu hai bên cùng thoải mái, sau này trả phòng đỡ phải lấn cấn chuyện gì.', now() - interval '20 hours'),
  ('seed-forum-01-c3', 'seed-forum-01', 'user-renter-03', 'Bổ sung thêm là nhớ xả thử nước bồn cầu với vòi sen xem thoát nước có nhanh ko nha, trúng cống nghẹt là ám ảnh luôn.', now() - interval '18 hours'),

  ('seed-forum-02-c1', 'seed-forum-02', 'user-renter-01', 'Phòng xinh xắn quá bạn ơi, khu này đi làm qua Q1 hay Q3 đều tiện nè. Chúc b sớm tìm dc bạn hợp tính nha!', now() - interval '40 hours'),
  ('seed-forum-02-c2', 'seed-forum-02', 'user-renter-04', 'Vote hai bạn hẹn ra cà phê nc một buổi trước xem thói quen sinh hoạt có khớp nhau ko là chuẩn bài nhất.', now() - interval '38 hours'),

  ('seed-forum-03-c1', 'seed-forum-03', 'user-landlord-02', 'Bài viết rất thực tế. Người thuê hỏi kỹ từ đầu thì chủ trọ đàng hoàng họ càng thích vì chứng tỏ bạn có trách nhiệm.', now() - interval '65 hours'),
  ('seed-forum-03-c2', 'seed-forum-03', 'user-renter-03', 'Hôm trước mình vừa né được một quả hợp đồng ghi ''giá điện có thể thay đổi theo thỏa thuận'', sợ quá chạy vội luôn á haha.', now() - interval '60 hours'),

  ('seed-forum-04-c1', 'seed-forum-04', 'user-renter-01', 'Gặp được chủ trọ có tâm và tâm lý như cô/chị là phước lành đi thuê trọ luôn á ❤️', now() - interval '88 hours'),
  ('seed-forum-04-c2', 'seed-forum-04', 'user-renter-02', 'Dạ đúng rồi ạ, có vấn đề gì nhắn kèm tấm ảnh hoặc video ngắn là chủ hiểu ngay, sửa nhanh gọn lẹ.', now() - interval '84 hours'),

  ('seed-forum-05-c1', 'seed-forum-05', 'user-renter-03', 'Né đi xa giùm mình bạn ơi 😭 Mùa mưa SG kẹt xe Đỗ Xuân Hợp với Xa Lộ Hà Nội là khóc tiếng Mán luôn, đi làm về chỉ muốn xỉu chứ chẳng còn sức chill phòng đẹp đâu.', now() - interval '110 hours'),
  ('seed-forum-05-c2', 'seed-forum-05', 'user-renter-01', 'Vote thuê gần nha, dư ra mỗi ngày 1 tiếng rưỡi ngủ thêm với tập thể thao khỏe người hơn nhiều b à.', now() - interval '106 hours'),
  ('seed-forum-05-c3', 'seed-forum-05', 'user-landlord-02', 'Bên mạn Tăng Nhơn Phú B hoặc Lã Xuân Oai có nhiều dãy trọ mới xây sạch đẹp lắm, bạn thử chạy lòng vòng xem thử nha.', now() - interval '100 hours'),

  ('seed-forum-06-c1', 'seed-forum-06', 'user-renter-04', 'Trò này cũ mèm mà năm nào cũng có người dính, nhất là mấy em tân sinh viên mới lên TP chưa rành đường.', now() - interval '135 hours'),
  ('seed-forum-06-c2', 'seed-forum-06', 'user-admin-01', 'Mọi người thấy tin đăng nào có dấu hiệu bất thường hoặc giá rẻ vô lý thì bấm nút ''Báo cáo'' ngay góc phải bài viết nhé, admin sẽ kiểm tra và khóa tài khoản vi phạm liền ạ.', now() - interval '130 hours'),

  ('seed-forum-07-c1', 'seed-forum-07', 'user-renter-02', 'Giá này bên anh tính quá hợp lý và minh bạch luôn á, nhiều chỗ tiền rác với xe máy đội lên cả nửa triệu khiếp vía.', now() - interval '158 hours'),
  ('seed-forum-07-c2', 'seed-forum-07', 'user-renter-01', 'Phòng em ở Tân Bình tiền điện 4k/số mà tháng nào cũng 800k tiền điện, chắc phải học cách tiết kiệm máy lạnh lại thôi.', now() - interval '154 hours'),

  ('seed-forum-08-c1', 'seed-forum-08', 'user-renter-04', 'Nhớ test luôn sóng 4G/Wifi trong phòng nha b, nhiều phòng trong hẻm sâu tường dày vào tới nơi mất sạch sóng đt luôn á.', now() - interval '182 hours'),
  ('seed-forum-08-c2', 'seed-forum-08', 'user-landlord-01', 'Checklist rất đầy đủ em nha. Nhớ hỏi thêm chỗ phơi đồ ngoài trời hay phơi trong phòng nhé, mùa mưa đồ lâu khô lắm.', now() - interval '178 hours'),
  ('seed-forum-08-c3', 'seed-forum-08', 'user-renter-02', 'Hỏi thêm có chỗ sạc xe điện ko nha nếu em gái đi xe máy điện, nhiều chung cư mini cấm sạc đêm á.', now() - interval '172 hours'),

  ('seed-forum-09-c1', 'seed-forum-09', 'user-renter-03', 'Phòng nhìn sáng sủa thoáng mát ghê, cho mình xin số Zalo hoặc inbox hỏi thăm với nha b ơi.', now() - interval '204 hours'),
  ('seed-forum-09-c2', 'seed-forum-09', 'user-admin-01', 'Lưu ý nhỏ: Hai bên nhớ nhờ chủ trọ làm lại phụ lục chuyển nhượng hợp đồng chính thức để sang tên cọc an toàn nhé ạ.', now() - interval '200 hours'),

  ('seed-forum-10-c1', 'seed-forum-10', 'user-renter-01', 'Ôi chuẩn luôn, nhà mình lắp thêm cái rèm cửa cản nắng che bớt kính ban công nhiệt độ giảm hẳn 2-3 độ luôn nè.', now() - interval '228 hours'),
  ('seed-forum-10-c2', 'seed-forum-10', 'user-landlord-02', 'Lưới lọc sạch cũng giúp lốc máy lạnh bền hơn nhiều, đỡ hỏng hóc giữa mùa nóng.', now() - interval '224 hours'),

  ('seed-forum-11-c1', 'seed-forum-11', 'user-renter-03', 'Dạ em nuôi 1 bé mèo, tiêu chí số 1 là có ban công rào chắn an toàn hoặc cửa sổ có song sắt để bé ko bị té ngã ạ.', now() - interval '252 hours'),
  ('seed-forum-11-c2', 'seed-forum-11', 'user-renter-04', 'Nhiều khu trọ thấy nuôi thú cưng là hét giá thêm 300-500k/tháng vô lý ghê, gặp chỗ tâm lý như bên cô là quý lắm.', now() - interval '248 hours'),

  ('seed-forum-12-c1', 'seed-forum-12', 'user-renter-02', 'Mẹo bọc quần áo cả móc thông minh ghê, đợt trước mình ngồi gấp đồ dọn trọ muốn gãy cái lưng haha.', now() - interval '276 hours'),
  ('seed-forum-12-c2', 'seed-forum-12', 'user-renter-03', 'Bác tài xế xe tải nhỏ 0908... đợt trc chở cho mình nhiệt tình lắm, phụ bưng bê đồ lên lầu luôn ko tính thêm tiền nè b, để mình nhắn sđt cho.', now() - interval '272 hours'),
  ('seed-forum-12-c3', 'seed-forum-12', 'user-landlord-01', 'Chúc em sang phòng mới nhiều may mắn, ở trọ vui vẻ thuận lợi nhé!', now() - interval '268 hours');

-- Add realistic tenant reviews
INSERT INTO reviews(id, listing_id, author_id, stars, text, created_at, updated_at) VALUES
  ('rev-105-ung-van-khiem-01', 'tromoi-105-ung-van-khiem', 'user-renter-01', 5, 'Mình từng ở trọ bên cô Ngọc gần 1 năm trước khi đổi chỗ làm. Phòng sạch sẽ, nước máy mạnh, cô chú chủ trọ cực kỳ dễ thương và tôn trọng sự riêng tư của khách thuê. Xe để tầng trệt có khóa vân tay rất an tâm nha mn.', now() - interval '3 days', now()),
  ('rev-105-ung-van-khiem-02', 'tromoi-105-ung-van-khiem', 'user-renter-03', 5, 'Vị trí ở Ung Văn Khiêm ra ngã tư Hàng Xanh siêu gần, đi học Hutech hay Ngoại Thương đều tiện. Phòng có ban công đón nắng tốt, giờ giấc tự do không chung chủ.', now() - interval '7 days', now()),
  ('rev-binh-thanh-01', 'tromoi-binh-thanh-nguyen-van-dau', 'user-renter-02', 4, 'Phòng ốc sạch đẹp y như ảnh chụp trên web, gác cao đứng thẳng người thoải mái ko sợ đụng đầu. Điểm trừ xíu là hẻm 241 hơi đông vào giờ tan tầm, nhưng bù lại an ninh tốt, hàng xóm văn minh.', now() - interval '5 days', now()),
  ('rev-huynh-van-nghe-01', 'tromoi-phong-tro-huynh-van-nghe-tan-binh', 'user-renter-04', 5, 'Anh chủ trọ trẻ tính, dễ tính và nhiệt tình. Lúc nhận phòng anh kiểm tra máy lạnh quạt gió hoạt động tốt mới bàn giao. Giá điện nước tính đúng theo giá cam kết, ko phát sinh phụ phí gì.', now() - interval '4 days', now())
ON CONFLICT (listing_id, author_id) DO UPDATE SET
  stars = EXCLUDED.stars,
  text = EXCLUDED.text,
  updated_at = now();
