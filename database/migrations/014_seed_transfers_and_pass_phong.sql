-- 014_seed_transfers_and_pass_phong.sql
-- Du lieu mau nguoi thue pass phong tro va chuyen nhuong phong tren Dien dan

-- 1. Xoa bo phong chuyen nhuong khoi bang listings va categories danh cho chu tro (neu co)
DELETE FROM listings WHERE id LIKE 'pass-phong-%' OR room_type = 'Chuyển nhượng';
DELETE FROM categories WHERE id = 'cat-chuyen-nhuong';

-- 2. Dong bo vao bang transfers (bang luu tru thong tin chuyen nhuong doc lap)
INSERT INTO transfers (
  id, owner_id, title, description, location,
  monthly_rent_vnd, transfer_fee_vnd, deposit_text, area_m2,
  room_type, contract_end_date, available_from, amenities,
  image_url, gallery, status, created_at, updated_at
) VALUES
(
  'transfer-01',
  'user-renter-01',
  'Pass phòng studio ban công Ung Văn Khiêm, Bình Thạnh',
  'Do mình nhận việc mới ở Quận 7 nên cần pass gấp phòng studio có ban công thoáng mát tại hẻm 105 Ung Văn Khiêm, P.25, Bình Thạnh.',
  '105 Ung Văn Khiêm, Phường 25, Bình Thạnh, TP. Hồ Chí Minh',
  4200000,
  0,
  'Cọc 1 tháng 4.200.000đ',
  28.00,
  'Phòng studio',
  CURRENT_DATE + INTERVAL '7 months',
  CURRENT_DATE + INTERVAL '3 days',
  '["Máy lạnh", "Tủ lạnh", "Ban công", "Máy giặt"]'::jsonb,
  '/images/rooms/scandinavian-room.jpg',
  '["/images/rooms/scandinavian-room.jpg", "/images/rooms/studio-kitchen.jpg"]'::jsonb,
  'active',
  NOW() - INTERVAL '2 hours',
  NOW()
),
(
  'transfer-02',
  'user-renter-03',
  'Nhượng gấp phòng trọ gác đúc cao Tô Hiến Thành, Q.10',
  'Mình tốt nghiệp chuẩn bị về quê công tác nên cần sang nhượng lại phòng trọ gác đúc cao đứng thẳng người ở Tô Hiến Thành, Q.10.',
  '248 Tô Hiến Thành, Phường 15, Quận 10, TP. Hồ Chí Minh',
  3800000,
  0,
  'Cọc 1 tháng 3.800.000đ',
  24.00,
  'Phòng trọ',
  CURRENT_DATE + INTERVAL '6 months',
  CURRENT_DATE + INTERVAL '5 days',
  '["Máy lạnh", "Gác lửng cao", "Chỗ để xe"]'::jsonb,
  '/images/rooms/wood-accent-room.jpg',
  '["/images/rooms/wood-accent-room.jpg", "/images/rooms/student-desk.jpg"]'::jsonb,
  'active',
  NOW() - INTERVAL '4 hours',
  NOW()
),
(
  'transfer-03',
  'user-renter-02',
  'Pass phòng căn hộ mini Bàu Cát, Tân Bình',
  'Căn hộ mini tầng 3 có thang máy và ban công riêng tại khu Bàu Cát, Tân Bình.',
  '52 Bàu Cát 1, Phường 14, Tân Bình, TP. Hồ Chí Minh',
  4600000,
  0,
  'Cọc 1 tháng 4.600.000đ',
  32.00,
  'Căn hộ mini',
  CURRENT_DATE + INTERVAL '5 months',
  CURRENT_DATE + INTERVAL '2 days',
  '["Máy lạnh", "Tủ lạnh", "Ban công", "Thang máy"]'::jsonb,
  '/images/rooms/compact-color-room.jpg',
  '["/images/rooms/compact-color-room.jpg", "/images/rooms/blue-bedroom.jpg"]'::jsonb,
  'active',
  NOW() - INTERVAL '6 hours',
  NOW()
),
(
  'transfer-04',
  'user-renter-04',
  'Chuyển nhượng studio Landmark Đỗ Xuân Hợp, TP. Thủ Đức',
  'Phòng studio full nội thất xịn xò tại đường Đỗ Xuân Hợp, TP. Thủ Đức.',
  '365 Đỗ Xuân Hợp, Phước Long B, TP. Thủ Đức, TP. Hồ Chí Minh',
  5500000,
  0,
  'Cọc 1 tháng 5.500.000đ',
  35.00,
  'Căn hộ studio',
  CURRENT_DATE + INTERVAL '8 months',
  CURRENT_DATE + INTERVAL '7 days',
  '["Full nội thất cao cấp", "Máy lạnh Inverter", "Sofa"]'::jsonb,
  '/images/rooms/city-window.jpg',
  '["/images/rooms/city-window.jpg", "/images/rooms/studio-kitchen.jpg"]'::jsonb,
  'active',
  NOW() - INTERVAL '8 hours',
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  status = 'active',
  updated_at = NOW();

-- 3. Bai viet dien dan pass phong va chuyen nhuong (danh cho cong dong nguoi thue)
INSERT INTO forum_posts (
  id, author_id, content, image_url, status, created_at, updated_at
) VALUES
(
  'pass-forum-post-01',
  'user-renter-01',
  E'[PASS PHÒNG GẤP - BÌNH THẠNH] Sang nhượng cọc phòng studio ban công Ung Văn Khiêm\n\nChào mọi người, do mình chuyển nơi làm việc sang Quận 7 nên cần pass lại gấp phòng studio lầu 2 ban công siêu thoáng ở hẻm 105 Ung Văn Khiêm, P.25, Bình Thạnh (ngay ngã tư Hàng Xanh, gần Hutech, Ngoại Thương).\n\n📌 Thông tin phòng:\n- Giá thuê: 4.200.000đ/tháng (giá này giữ cố định suốt hợp đồng).\n- Tiền cọc: 1 tháng (4.2tr), hợp đồng còn 7 tháng. Mình hỗ trợ 500k tiền dọn nhà cho bạn nào chốt sớm trong tuần này!\n- Phòng có sẵn: Máy lạnh Inverter, tủ lạnh, giường nệm cao su, tủ quần áo, kệ bếp riêng biệt nấu ăn thoải mái.\n- Tòa nhà có thang máy, khóa vân tay 2 lớp, camera 24/7, xe máy để free ở trệt.\n\n🎁 Tặng lại bạn mới: Kệ để giày dép gỗ, quạt cây và bộ rèm cửa chống nắng mình tự mua.\n\nChủ trọ cô Ngọc cực kỳ dễ thương, hỗ trợ làm lại phụ lục hợp đồng sang tên cọc minh bạch. Mọi người quan tâm nhắn tin cho mình hoặc ghé xem phòng sau 17h30 hàng ngày nhé!',
  '/images/rooms/scandinavian-room.jpg',
  'active',
  NOW() - INTERVAL '2 hours',
  NOW()
),
(
  'pass-forum-post-02',
  'user-renter-03',
  E'[CHUYỂN NHƯỢNG PHÒNG TRỌ QUẬN 10] Pass phòng gác lửng cao Tô Hiến Thành sát ĐH Bách Khoa\n\nEm vừa tốt nghiệp chuẩn bị về quê nên cần nhượng lại phòng trọ đang thuê ở đường Tô Hiến Thành, P.15, Quận 10.\n\n✨ Chi tiết phòng:\n- Giá thuê: 3.800.000đ/tháng, diện tích 24m².\n- Gác lửng đúc bê tông kiên cố, cao 1m9 đứng thẳng người thoải mái, không lo cộc đầu.\n- Vệ sinh khép kín trong phòng, có sẵn máy lạnh mới vệ sinh sạch sẽ, quạt hút mùi.\n- Giờ giấc tự do, không chung chủ, có sân phơi đồ đón nắng trên sân thượng.\n- Cọc 1 tháng (3.8tr), hợp đồng còn 6 tháng. Em pass lại cọc và tặng kèm bàn học gỗ + giá sách gắn tường còn rất mới.\n\nBạn nào cần tìm phòng khu vực Q10, gần Bách Khoa, Huflit hay Big C Miền Đông thì nhắn tin em dẫn qua xem phòng nha!',
  '/images/rooms/wood-accent-room.jpg',
  'active',
  NOW() - INTERVAL '4 hours',
  NOW()
),
(
  'pass-forum-post-03',
  'user-renter-02',
  E'[PASS PHÒNG TÂN BÌNH] Nhượng căn hộ mini khu Bàu Cát, ban công riêng\n\nMình cần chuyển công tác gấp nên nhượng lại căn hộ mini tầng 3 tại hẻm 52 Bàu Cát 1, P.14, Tân Bình.\n\n🏡 Ưu điểm nổi bật:\n- Giá thuê: 4.600.000đ/tháng, diện tích 32m² rộng rãi.\n- Ban công đón gió thoáng mát, phơi đồ riêng tư không lo mưa gió.\n- Thang máy tốc độ cao, camera an ninh từng tầng, bảo vệ trực 24/24.\n- Tặng lại: Tủ lạnh mini mới mua 5 tháng + bàn làm việc chân sắt mặt gỗ xịn xò.\n- Hợp đồng còn 5 tháng, hỗ trợ sang tên cọc 1 tháng 4.6tr nhanh gọn lẹ.\n\nLiên hệ trực tiếp qua tin nhắn để hẹn xem phòng buổi tối nhé!',
  '/images/rooms/compact-color-room.jpg',
  'active',
  NOW() - INTERVAL '6 hours',
  NOW()
),
(
  'pass-forum-post-04',
  'user-renter-04',
  E'[CHUYỂN NHƯỢNG PHÒNG THỦ ĐỨC] Studio cao cấp Landmark Đỗ Xuân Hợp view thoáng\n\nCần pass lại căn studio cao cấp tại 365 Đỗ Xuân Hợp, Phước Long B, TP. Thủ Đức (tiện đi Khu Công Nghệ Cao, ĐH FPT, HUTECH cơ sở E).\n\n🌟 Tiện nghi sẵn có:\n- Giá: 5.500.000đ/tháng, diện tích 35m².\n- Full nội thất cao cấp: máy lạnh Inverter, smart TV, sofa bed, máy giặt riêng, tủ lạnh 2 cánh.\n- Bếp điện âm hiện đại, hút mùi không ám khói.\n- Hợp đồng còn 8 tháng, tiền cọc 1 tháng. Chủ nhà hỗ trợ ký mới hoàn toàn.\n\nAi có nhu cầu chuyển vào ngay đầu tháng liên hệ mình qua tin nhắn nhé!',
  '/images/rooms/city-window.jpg',
  'active',
  NOW() - INTERVAL '8 hours',
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  content = EXCLUDED.content,
  image_url = EXCLUDED.image_url,
  status = 'active',
  updated_at = NOW();

-- 4. Binh luan tuong tac cho bai viet pass phong tren dien dan
INSERT INTO forum_comments (id, post_id, author_id, content, created_at, updated_at)
VALUES
(
  'pass-forum-comment-01',
  'pass-forum-post-01',
  'user-renter-03',
  'Phòng ban công thoáng đãng xinh quá Trang ơi, hẻm Ung Văn Khiêm đoạn này mùa mưa không bị ngập nước đúng không bạn?',
  NOW() - INTERVAL '50 minutes',
  NOW()
),
(
  'pass-forum-comment-02',
  'pass-forum-post-01',
  'user-renter-01',
  '@Thu Hà Dạ đoạn 105 cao ráo lắm bạn ơi, mưa to triều cường cũng ko bao giờ ngập nha. Bạn muốn ghé xem thì nhắn mình dẫn lên phòng nhé!',
  NOW() - INTERVAL '30 minutes',
  NOW()
),
(
  'pass-forum-comment-03',
  'pass-forum-post-02',
  'user-renter-01',
  'Khu Tô Hiến Thành này tiện ăn uống mua sắm nè, chúc bạn sớm pass được phòng nha!',
  NOW() - INTERVAL '2 hours',
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  content = EXCLUDED.content,
  updated_at = NOW();
