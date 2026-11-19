-- Update Long Truong KTX to explicitly have TP. Thủ Đức in location and location_id = 3
UPDATE listings
SET location = 'Đường Số 61, Long Trường, TP. Thủ Đức, TP. Hồ Chí Minh',
    location_id = 3
WHERE id = 'tromoi-ktx-long-truong';

-- Insert affordable student listings in TP. Thủ Đức (near SPKT / ĐHQG)
INSERT INTO listings (
  id, owner_id, title, description, price_vnd, deposit_text, area_m2,
  location, room_type, contact_phone, amenities, image_url, gallery,
  latitude, longitude, status, views, contacts, location_id, category_id
)
VALUES
  (
    'tromoi-thuduc-vo-van-ngan',
    'demo-landlord-01',
    'Phòng trọ gác lửng cao cấp Võ Văn Ngân, Thủ Đức (gần ĐH SPKT)',
    'Phòng trọ mới xây sạch đẹp trên đường Võ Văn Ngân, phường Linh Chiểu, TP. Thủ Đức. Cách ĐH Sư Phạm Kỹ Thuật (HCMUTE) chỉ 300m, thuận tiện đi bộ đi học. Phòng có gác lửng cao không đụng đầu, máy lạnh mới tiết kiệm điện, WC riêng khép kín, bãi để xe có camera an ninh và khóa vân tay ra vào 24/7.',
    2800000,
    'Cọc 1 tháng: 2.800.000đ',
    22.0,
    '126 Võ Văn Ngân, Linh Chiểu, TP. Thủ Đức, TP. Hồ Chí Minh',
    'Phòng trọ',
    '0908123456',
    '["Gác lửng", "Máy lạnh", "WC riêng", "Bãi để xe", "Khóa vân tay", "Camera an ninh", "Wi-Fi"]'::jsonb,
    '/images/tromoi/nha-tro-105-ung-van-khiem/anh-01.jpg',
    '["/images/tromoi/nha-tro-105-ung-van-khiem/anh-01.jpg", "/images/tromoi/nha-tro-105-ung-van-khiem/anh-03.webp", "/images/tromoi/nha-tro-105-ung-van-khiem/anh-04.webp"]'::jsonb,
    10.8515,
    106.7718,
    'active',
    12,
    3,
    3,
    '8f57a91f-05f1-45bb-b87b-208a30e59a78'
  ),
  (
    'tromoi-thuduc-le-van-chi',
    'demo-landlord-02',
    'Phòng trọ ban công thoáng mát Lê Văn Chí, Linh Trung, Thủ Đức',
    'Phòng trọ rộng rãi 25m² có ban công thoáng mát, đón gió tự nhiên tại đường Lê Văn Chí, Linh Trung, TP. Thủ Đức. Gần ngã tư Thủ Đức, tiện di chuyển ra Xa lộ Hà Nội và ĐH SPKT. Trang bị sẵn máy lạnh, tủ lạnh, kệ bếp riêng nấu ăn tự do, giờ giấc tự do không chung chủ, có bãi xe rộng rãi.',
    2500000,
    'Cọc 1 tháng: 2.500.000đ',
    25.0,
    '48 Lê Văn Chí, Linh Trung, TP. Thủ Đức, TP. Hồ Chí Minh',
    'Phòng trọ',
    '0912345678',
    '["Ban công", "Máy lạnh", "Tủ lạnh", "Khu bếp riêng", "WC riêng", "Bãi xe", "Giờ giấc tự do", "Wi-Fi"]'::jsonb,
    '/images/tromoi/p301-quang-trung/anh-01.webp',
    '["/images/tromoi/p301-quang-trung/anh-01.webp", "/images/tromoi/p301-quang-trung/anh-02.webp"]'::jsonb,
    10.8590,
    106.7725,
    'active',
    18,
    5,
    3,
    '8f57a91f-05f1-45bb-b87b-208a30e59a78'
  ),
  (
    'tromoi-thuduc-to-vinh-dien',
    'user-landlord-01',
    'Phòng trọ sinh viên giá rẻ Tô Vĩnh Diện, TP. Thủ Đức (gần Làng Đại học)',
    'Phòng trọ sinh viên giá rẻ gần KTX Khu A và Khu B Làng Đại học Quốc Gia TP.HCM. Phòng sạch sẽ, có gác lửng, WC riêng, giờ giấc tự do. Khu vực an ninh, nhiều quán ăn sinh viên giá rẻ, trạm xe buýt thuận tiện đi các trường ĐH Bách Khoa CS2, ĐH CNTT, ĐH KHTN.',
    2000000,
    'Cọc 1 tháng: 2.000.000đ',
    18.0,
    '35 Tô Vĩnh Diện, Đông Hòa, TP. Thủ Đức, TP. Hồ Chí Minh',
    'Phòng trọ',
    '0933456789',
    '["Gác lửng", "WC riêng", "Wi-Fi", "Bãi xe", "Giờ giấc tự do"]'::jsonb,
    '/images/tromoi/nha-tro-633-hong-bang/anh-01.webp',
    '["/images/tromoi/nha-tro-633-hong-bang/anh-01.webp", "/images/tromoi/nha-tro-633-hong-bang/anh-02.webp"]'::jsonb,
    10.8752,
    106.7981,
    'active',
    25,
    8,
    3,
    '8f57a91f-05f1-45bb-b87b-208a30e59a78'
  )
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  price_vnd = EXCLUDED.price_vnd,
  location = EXCLUDED.location,
  amenities = EXCLUDED.amenities,
  location_id = EXCLUDED.location_id,
  status = 'active';
