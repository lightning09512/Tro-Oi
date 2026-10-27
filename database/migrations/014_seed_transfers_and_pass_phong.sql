-- 014_seed_transfers_and_pass_phong.sql
-- Thêm danh mục Chuyển nhượng và dữ liệu mẫu người thuê pass phòng trọ

-- 1. Thêm danh mục Loại phòng 'Chuyển nhượng'
INSERT INTO categories (id, type, name, status)
VALUES ('cat-chuyen-nhuong', 'Loại phòng', 'Chuyển nhượng', 'active')
ON CONFLICT (id) DO UPDATE SET
  type = EXCLUDED.type,
  name = EXCLUDED.name,
  status = 'active';

-- 2. Thêm các tin đăng chuyển nhượng / pass phòng vào bảng listings
-- Tin 1: Hoàng Trang (user-renter-01) pass phòng Ung Văn Khiêm, Bình Thạnh
INSERT INTO listings (
  id, owner_id, current_tenant_id, title, description,
  price_vnd, deposit_vnd, deposit_text, area_m2, location,
  room_type, contact_phone, amenities, image_url, gallery,
  latitude, longitude, geom, status, views, contacts,
  created_at, updated_at, category_id, area_is_estimate
) VALUES (
  'pass-phong-ung-van-khiem-binh-thanh',
  'user-renter-01',
  NULL,
  'Pass phòng studio ban công Ung Văn Khiêm, Bình Thạnh (Tặng nội thất + hỗ trợ 500k)',
  'Do mình nhận việc mới ở Quận 7 nên cần pass gấp phòng studio có ban công thoáng mát tại hẻm 105 Ung Văn Khiêm, P.25, Bình Thạnh (sát ĐH Hutech, Ngoại Thương, ngã tư Hàng Xanh). Phòng full nội thất: máy lạnh Inverter, tủ lạnh, giường nệm cao cấp, tủ quần áo, kệ bếp riêng biệt nấu ăn thoải mái. Tòa nhà có thang máy, khóa vân tay 2 lớp, camera 24/7, xe máy để free ở tầng trệt. Hợp đồng còn 7 tháng, chủ trọ cô Ngọc cực kỳ dễ tính, hỗ trợ ký lại hợp đồng mới và bảo lưu nguyên cọc. Mình tặng lại kệ để giày dép gỗ, quạt cây và hỗ trợ 500k tiền xe chuyển đồ cho bạn nào chốt sớm trong tuần này nha!',
  4200000,
  4200000,
  'Cọc 1 tháng 4.200.000đ (sang nhượng lại, hỗ trợ 500k dọn vào)',
  28.00,
  '105 Ung Văn Khiêm, Phường 25, Bình Thạnh, TP. Hồ Chí Minh',
  'Chuyển nhượng',
  '0901234567',
  '["Máy lạnh", "Tủ lạnh", "Ban công", "Máy giặt", "Bãi đỗ xe", "Khóa vân tay", "Giờ giấc tự do", "Tặng nội thất"]'::jsonb,
  '/images/rooms/scandinavian-room.jpg',
  '["/images/rooms/scandinavian-room.jpg", "/images/rooms/studio-kitchen.jpg", "/images/rooms/blue-bedroom.jpg"]'::jsonb,
  10.8032,
  106.7161,
  ST_SetSRID(ST_MakePoint(106.7161, 10.8032), 4326),
  'active',
  46,
  5,
  NOW() - INTERVAL '2 hours',
  NOW(),
  'cat-chuyen-nhuong',
  false
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  price_vnd = EXCLUDED.price_vnd,
  deposit_text = EXCLUDED.deposit_text,
  area_m2 = EXCLUDED.area_m2,
  location = EXCLUDED.location,
  room_type = EXCLUDED.room_type,
  contact_phone = EXCLUDED.contact_phone,
  amenities = EXCLUDED.amenities,
  image_url = EXCLUDED.image_url,
  gallery = EXCLUDED.gallery,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  geom = EXCLUDED.geom,
  status = 'active',
  updated_at = NOW();

-- Tin 2: Thu Hà (user-renter-03) nhượng phòng Tô Hiến Thành, Quận 10
INSERT INTO listings (
  id, owner_id, current_tenant_id, title, description,
  price_vnd, deposit_vnd, deposit_text, area_m2, location,
  room_type, contact_phone, amenities, image_url, gallery,
  latitude, longitude, geom, status, views, contacts,
  created_at, updated_at, category_id, area_is_estimate
) VALUES (
  'pass-phong-to-hien-thanh-quan-10',
  'user-renter-03',
  NULL,
  'Nhượng gấp phòng trọ gác đúc cao Tô Hiến Thành, Q.10 (Sát ĐH Bách Khoa, tặng bàn học)',
  'Mình tốt nghiệp chuẩn bị về quê công tác nên cần sang nhượng lại phòng trọ gác đúc cao đứng thẳng người ở Tô Hiến Thành, Phường 15, Quận 10 (sát ĐH Bách Khoa, Big C Miền Đông). Phòng tầng 2, sạch sẽ thoáng mát, vệ sinh khép kín trong phòng, có sẵn máy lạnh mới vệ sinh sạch sẽ, quạt hút mùi. Giờ giấc tự do 24/24, ra vào vân tay, không chung chủ. Tiền điện 3.8k/kWh đồng hồ riêng, nước máy 20k/khối, wifi 50k/người. Hợp đồng còn 6 tháng. Mình nhượng lại tiền cọc và tặng luôn bàn học gỗ + giá sách gắn tường còn rất mới ạ.',
  3800000,
  3800000,
  'Cọc 1 tháng 3.800.000đ (hợp đồng còn 6 tháng)',
  24.00,
  '248 Tô Hiến Thành, Phường 15, Quận 10, TP. Hồ Chí Minh',
  'Chuyển nhượng',
  '0901234569',
  '["Máy lạnh", "Gác lửng cao", "Chỗ để xe", "Wifi tốc độ cao", "Không chung chủ", "Camera an ninh"]'::jsonb,
  '/images/rooms/wood-accent-room.jpg',
  '["/images/rooms/wood-accent-room.jpg", "/images/rooms/simple-bedroom.jpg", "/images/rooms/student-desk.jpg"]'::jsonb,
  10.7765,
  106.6632,
  ST_SetSRID(ST_MakePoint(106.6632, 10.7765), 4326),
  'active',
  38,
  3,
  NOW() - INTERVAL '4 hours',
  NOW(),
  'cat-chuyen-nhuong',
  false
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  price_vnd = EXCLUDED.price_vnd,
  deposit_text = EXCLUDED.deposit_text,
  area_m2 = EXCLUDED.area_m2,
  location = EXCLUDED.location,
  room_type = EXCLUDED.room_type,
  contact_phone = EXCLUDED.contact_phone,
  amenities = EXCLUDED.amenities,
  image_url = EXCLUDED.image_url,
  gallery = EXCLUDED.gallery,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  geom = EXCLUDED.geom,
  status = 'active',
  updated_at = NOW();

-- Tin 3: Nguyễn An (user-renter-02) pass căn hộ mini Bàu Cát, Tân Bình
INSERT INTO listings (
  id, owner_id, current_tenant_id, title, description,
  price_vnd, deposit_vnd, deposit_text, area_m2, location,
  room_type, contact_phone, amenities, image_url, gallery,
  latitude, longitude, geom, status, views, contacts,
  created_at, updated_at, category_id, area_is_estimate
) VALUES (
  'pass-phong-can-ho-mini-bau-cat-tan-binh',
  'user-renter-02',
  NULL,
  'Pass phòng căn hộ mini Bàu Cát, Tân Bình (Ban công riêng, tặng tủ lạnh + bàn làm việc)',
  'Mình cần chuyển sang ở cùng bạn nên pass lại căn hộ mini tầng 3 có thang máy và ban công riêng tại khu Bàu Cát, Tân Bình. Khu vực sầm uất, bước chân ra ngõ là phố ẩm thực Bàu Cát, siêu thị, cà phê, an ninh cực kỳ yên tĩnh. Phòng có gác lửng rộng, khu bếp riêng biệt nấu ăn không ám mùi vào phòng ngủ. Phòng có máy lạnh, máy giặt chung sân phơi tầng thượng, cho nuôi thú cưng nhỏ. Chủ nhà hỗ trợ làm phụ lục sang tên hợp đồng chính thức, thời hạn hợp đồng còn 5 tháng. Mình tặng lại tủ lạnh mini và bàn làm việc còn rất tốt cho bạn nào chốt sớm.',
  4600000,
  4600000,
  'Cọc 1 tháng 4.600.000đ (hỗ trợ sang tên hợp đồng nhanh chóng)',
  32.00,
  '52 Bàu Cát 1, Phường 14, Tân Bình, TP. Hồ Chí Minh',
  'Chuyển nhượng',
  '0901234568',
  '["Máy lạnh", "Tủ lạnh", "Ban công đón nắng", "Bếp nấu ăn", "Máy giặt chung", "Cho nuôi thú cưng", "Thang máy"]'::jsonb,
  '/images/rooms/compact-color-room.jpg',
  '["/images/rooms/compact-color-room.jpg", "/images/rooms/blue-bedroom.jpg", "/images/rooms/city-window.jpg"]'::jsonb,
  10.7938,
  106.6437,
  ST_SetSRID(ST_MakePoint(106.6437, 10.7938), 4326),
  'active',
  29,
  4,
  NOW() - INTERVAL '8 hours',
  NOW(),
  'cat-chuyen-nhuong',
  false
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  price_vnd = EXCLUDED.price_vnd,
  deposit_text = EXCLUDED.deposit_text,
  area_m2 = EXCLUDED.area_m2,
  location = EXCLUDED.location,
  room_type = EXCLUDED.room_type,
  contact_phone = EXCLUDED.contact_phone,
  amenities = EXCLUDED.amenities,
  image_url = EXCLUDED.image_url,
  gallery = EXCLUDED.gallery,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  geom = EXCLUDED.geom,
  status = 'active',
  updated_at = NOW();

-- Tin 4: Quang Minh (user-renter-04) chuyển nhượng studio Thủ Đức
INSERT INTO listings (
  id, owner_id, current_tenant_id, title, description,
  price_vnd, deposit_vnd, deposit_text, area_m2, location,
  room_type, contact_phone, amenities, image_url, gallery,
  latitude, longitude, geom, status, views, contacts,
  created_at, updated_at, category_id, area_is_estimate
) VALUES (
  'pass-phong-studio-thu-duc',
  'user-renter-04',
  NULL,
  'Chuyển nhượng studio Landmark Đỗ Xuân Hợp, TP. Thủ Đức (Full nội thất cao cấp view thoáng)',
  'Do công ty chuyển địa điểm làm việc sang Quận 1 nên mình cần chuyển nhượng gấp phòng studio full nội thất xịn xò tại đường Đỗ Xuân Hợp, TP. Thủ Đức (gần Cao đẳng Công Thương, ĐH Văn Hóa, Khu CNC). Phòng đầy đủ sofa nệm cao cấp, bàn ăn, máy lạnh Inverter, tủ lạnh, máy giặt riêng trong phòng. View cửa sổ lớn đón nắng sáng nhìn ra công viên. Tòa nhà có hầm xe rộng rãi, thang máy thẻ từ, bảo vệ trực 24/7. Hợp đồng còn 8 tháng, tiền cọc 1 tháng 5.5tr. Mình hỗ trợ thủ tục chuyển hợp đồng trực tiếp với ban quản lý toà nhà.',
  5500000,
  5500000,
  'Cọc 1 tháng 5.500.000đ (thời hạn hợp đồng còn 8 tháng)',
  35.00,
  '365 Đỗ Xuân Hợp, Phước Long B, TP. Thủ Đức, TP. Hồ Chí Minh',
  'Chuyển nhượng',
  '0901234570',
  '["Full nội thất cao cấp", "Máy lạnh Inverter", "Sofa", "Cửa sổ lớn view thoáng", "Thang máy", "Hầm để xe rộng rãi"]'::jsonb,
  '/images/rooms/city-window.jpg',
  '["/images/rooms/city-window.jpg", "/images/rooms/studio-kitchen.jpg", "/images/rooms/scandinavian-room.jpg"]'::jsonb,
  10.8225,
  106.7725,
  ST_SetSRID(ST_MakePoint(106.7725, 10.8225), 4326),
  'active',
  52,
  7,
  NOW() - INTERVAL '12 hours',
  NOW(),
  'cat-chuyen-nhuong',
  false
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  price_vnd = EXCLUDED.price_vnd,
  deposit_text = EXCLUDED.deposit_text,
  area_m2 = EXCLUDED.area_m2,
  location = EXCLUDED.location,
  room_type = EXCLUDED.room_type,
  contact_phone = EXCLUDED.contact_phone,
  amenities = EXCLUDED.amenities,
  image_url = EXCLUDED.image_url,
  gallery = EXCLUDED.gallery,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  geom = EXCLUDED.geom,
  status = 'active',
  updated_at = NOW();

-- 3. Đồng bộ vào bảng transfers (bảng lưu trữ chuyển nhượng)
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
  'Chuyển nhượng',
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
  'Chuyển nhượng',
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
  'Chuyển nhượng',
  CURRENT_DATE + INTERVAL '5 months',
  CURRENT_DATE + INTERVAL '2 days',
  '["Máy lạnh", "Tủ lạnh", "Ban công", "Thang máy"]'::jsonb,
  '/images/rooms/compact-color-room.jpg',
  '["/images/rooms/compact-color-room.jpg", "/images/rooms/blue-bedroom.jpg"]'::jsonb,
  'active',
  NOW() - INTERVAL '8 hours',
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
  'Chuyển nhượng',
  CURRENT_DATE + INTERVAL '8 months',
  CURRENT_DATE + INTERVAL '7 days',
  '["Full nội thất cao cấp", "Máy lạnh Inverter", "Sofa"]'::jsonb,
  '/images/rooms/city-window.jpg',
  '["/images/rooms/city-window.jpg", "/images/rooms/studio-kitchen.jpg"]'::jsonb,
  'active',
  NOW() - INTERVAL '12 hours',
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  status = 'active',
  updated_at = NOW();

-- 4. Thêm bài viết diễn đàn pass phòng mới nhất
INSERT INTO forum_posts (
  id, author_id, content, image_url, status, created_at, updated_at
) VALUES
(
  'pass-forum-post-01',
  'user-renter-01',
  E'[PASS PHÒNG GẤP - BÌNH THẠNH] Sang nhượng cọc phòng studio ban công Ung Văn Khiêm\n\nChào mọi người, do mình chuyển nơi làm việc sang Quận 7 nên cần pass lại gấp phòng studio lầu 2 ban công siêu thoáng ở hẻm 105 Ung Văn Khiêm, P.25, Bình Thạnh (ngay ngã tư Hàng Xanh, gần Hutech, Ngoại Thương).\n\n📌 Thông tin phòng:\n- Giá thuê: 4.200.000đ/tháng (giá này giữ cố định suốt hợp đồng).\n- Tiền cọc: 1 tháng (4.2tr), hợp đồng còn 7 tháng. Mình hỗ trợ 500k tiền dọn nhà cho bạn nào chốt sớm trong tuần này!\n- Phòng có sẵn: Máy lạnh Inverter, tủ lạnh, giường nệm cao su, tủ quần áo, kệ bếp riêng biệt nấu ăn thoải mái.\n- Tòa nhà có thang máy, khóa vân tay 2 lớp, camera 24/7, xe máy để free ở trệt.\n\n🎁 Tặng lại bạn mới: Kệ để giày dép gỗ, quạt cây và bộ rèm cửa chống nắng mình tự mua.\n\nChủ trọ cô Ngọc cực kỳ dễ thương, hỗ trợ làm lại phụ lục hợp đồng sang tên cọc minh bạch. Mọi người quan tâm nhắn tin cho mình hoặc ghé xem phòng sau 17h30 hàng ngày nhé!',
  '/images/rooms/scandinavian-room.jpg',
  'active',
  NOW() - INTERVAL '1 hour',
  NOW()
),
(
  'pass-forum-post-02',
  'user-renter-03',
  E'[CHUYỂN NHƯỢNG PHÒNG TRỌ QUẬN 10] Pass phòng gác lửng cao Tô Hiến Thành sát ĐH Bách Khoa\n\nEm vừa tốt nghiệp chuẩn bị về quê nên cần nhượng lại phòng trọ đang thuê ở đường Tô Hiến Thành, P.15, Quận 10.\n\n✨ Chi tiết phòng:\n- Giá thuê: 3.800.000đ/tháng, diện tích 24m².\n- Gác lửng đúc bê tông kiên cố, cao 1m9 đứng thẳng người thoải mái, không lo cộc đầu.\n- Vệ sinh khép kín trong phòng, có sẵn máy lạnh mới vệ sinh sạch sẽ, quạt hút mùi.\n- Giờ giấc tự do, không chung chủ, có sân phơi đồ đón nắng trên sân thượng.\n- Cọc 1 tháng (3.8tr), hợp đồng còn 6 tháng. Em pass lại cọc và tặng kèm bàn học gỗ + giá sách gắn tường còn rất mới.\n\nBạn nào cần tìm phòng khu vực Q10, gần Bách Khoa, Huflit hay Big C Miền Đông thì nhắn tin em dẫn qua xem phòng nha!',
  '/images/rooms/wood-accent-room.jpg',
  'active',
  NOW() - INTERVAL '3 hours',
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  content = EXCLUDED.content,
  image_url = EXCLUDED.image_url,
  status = 'active',
  updated_at = NOW();

-- 5. Bình luận tương tác cho bài viết diễn đàn pass phòng
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
  'Đúng rồi bạn nha, hẻm cao ráo sạch sẽ lắm, bước vài bước ra tới chợ với Ministop luôn nè.',
  NOW() - INTERVAL '40 minutes',
  NOW()
),
(
  'pass-forum-comment-03',
  'pass-forum-post-01',
  'user-landlord-01',
  'Cô Ngọc chủ nhà đây nha, bạn nào dọn vào tiếp nối hợp đồng của Trang cứ liên hệ cô hỗ trợ sang tên cọc và ký hợp đồng mới đầy đủ pháp lý nhé.',
  NOW() - INTERVAL '30 minutes',
  NOW()
),
(
  'pass-forum-comment-04',
  'pass-forum-post-01',
  'user-renter-02',
  'Deal hời ghê, tặng cả nội thất với hỗ trợ 500k tiền xe chuyển trọ. Chúc b sớm pass được phòng nha!',
  NOW() - INTERVAL '20 minutes',
  NOW()
),
(
  'pass-forum-comment-05',
  'pass-forum-post-02',
  'user-renter-04',
  'Phòng gác cao đứng thẳng được ở Q10 giá 3tr8 là quá hiếm luôn á bạn ơi. Tiền điện nước tính sao vậy bạn?',
  NOW() - INTERVAL '2 hours',
  NOW()
),
(
  'pass-forum-comment-06',
  'pass-forum-post-02',
  'user-renter-03',
  'Dạ điện 3.8k/kWh đồng hồ riêng, nước máy 20k/m3, wifi 50k/người nha bạn.',
  NOW() - INTERVAL '90 minutes',
  NOW()
),
(
  'pass-forum-comment-07',
  'pass-forum-post-02',
  'user-renter-01',
  'Ưng chiếc bàn học gỗ ghê, chúc em sớm tìm được bạn sang phòng nha!',
  NOW() - INTERVAL '70 minutes',
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  content = EXCLUDED.content,
  updated_at = NOW();

-- 6. Likes / Reactions cho các bài diễn đàn
INSERT INTO forum_reactions (post_id, user_id)
VALUES
('pass-forum-post-01', 'user-renter-02'),
('pass-forum-post-01', 'user-renter-03'),
('pass-forum-post-01', 'user-renter-04'),
('pass-forum-post-01', 'user-landlord-01'),
('pass-forum-post-02', 'user-renter-01'),
('pass-forum-post-02', 'user-renter-02'),
('pass-forum-post-02', 'user-renter-04')
ON CONFLICT DO NOTHING;
