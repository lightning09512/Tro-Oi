UPDATE listings
SET area_is_estimate = false
WHERE area_is_estimate IS DISTINCT FROM false;

UPDATE listings
SET deposit_text = 'Cọc ' || deposit_months.month_count || ' tháng: ' ||
  replace(to_char(listings.price_vnd * deposit_months.month_count, 'FM999G999G999G990'), ',', '.') || 'đ'
FROM (
  SELECT id, CASE WHEN room_type = 'Nhà nguyên căn' THEN 2 ELSE 1 END AS month_count
  FROM listings
) AS deposit_months
WHERE listings.id = deposit_months.id
  AND listings.source_url IS NOT NULL
  AND listings.deposit_text ILIKE 'Ước tính:%';
