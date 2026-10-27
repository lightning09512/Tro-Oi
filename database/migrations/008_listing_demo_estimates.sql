ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS area_is_estimate boolean NOT NULL DEFAULT false;

UPDATE listings
SET area_m2 = estimates.area_m2,
    area_is_estimate = true
FROM (VALUES
  ('tromoi-apartment-sun-cosmo-ngu-hanh-son', 50::numeric),
  ('tromoi-apartment-mia-plaza-lien-chieu', 65::numeric),
  ('tromoi-apartment-doan-khue-ngu-hanh-son', 45::numeric),
  ('tromoi-ktx-phan-van-tri', 32::numeric),
  ('tromoi-ktx-long-truong', 28::numeric),
  ('tromoi-ktx-huit-tay-thanh', 30::numeric),
  ('tromoi-o-ghep-duong-so-21-tan-hung', 28::numeric),
  ('tromoi-o-ghep-tran-thai-tong-cau-giay', 24::numeric),
  ('tromoi-hanoi-au-co-tay-ho', 30::numeric),
  ('tromoi-hoang-tang-bi-dong-ngac', 60::numeric),
  ('tromoi-fpt-city-da-nang', 50::numeric),
  ('tromoi-105-ung-van-khiem', 18::numeric),
  ('tromoi-633-hong-bang', 16::numeric),
  ('tromoi-binh-thanh-nguyen-van-dau', 22::numeric),
  ('tromoi-341-bui-minh-truc', 20::numeric)
) AS estimates(id, area_m2)
WHERE listings.id = estimates.id
  AND listings.source_url IS NOT NULL
  AND listings.area_m2 IS NULL;

UPDATE listings
SET deposit_text = 'Ước tính: ' || deposit_months.month_count || ' tháng (~' ||
  to_char(listings.price_vnd * deposit_months.month_count, 'FM999G999G999G990') || 'đ)'
FROM (
  SELECT id, CASE WHEN room_type = 'Nhà nguyên căn' THEN 2 ELSE 1 END AS month_count
  FROM listings
) AS deposit_months
WHERE listings.id = deposit_months.id
  AND listings.source_url IS NOT NULL
  AND (
    listings.deposit_text ILIKE '%chưa nêu%'
    OR listings.deposit_text ILIKE '%chưa công bố%'
    OR listings.deposit_text ILIKE '%xác nhận khi liên hệ%'
    OR listings.deposit_text ILIKE '%xác nhận với người đăng%'
    OR listings.deposit_text ILIKE '%xác nhận mức cọc%'
    OR listings.deposit_text ILIKE '%hỗ trợ giãn cọc%'
    OR listings.deposit_text ILIKE '%hỗ trợ cọc chia lần%'
  );
