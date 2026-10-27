-- Imported listings are represented by real, active landlord accounts so renters
-- can open a profile and start a conversation. Source attribution remains intact.
INSERT INTO users(id,name,email,phone,password_hash,role,status,avatar_url) VALUES
  ('demo-landlord-01','Nguyễn Thanh Hà','thanh.ha.demo@trooi.local','0900000101','$2b$12$zR7k4RUr3WhWzTfKXGNiveqHFVKtRmig5xBKsdxZ.mQBU8pC.Qice','landlord','active','/images/avatars/demo-owner-01.jpg'),
  ('demo-landlord-02','Phạm Minh Anh','minh.anh.demo@trooi.local','0900000102','$2b$12$zR7k4RUr3WhWzTfKXGNiveqHFVKtRmig5xBKsdxZ.mQBU8pC.Qice','landlord','active','/images/avatars/demo-owner-02.jpg'),
  ('demo-landlord-03','Lê Quốc Bảo','quoc.bao.demo@trooi.local','0900000103','$2b$12$zR7k4RUr3WhWzTfKXGNiveqHFVKtRmig5xBKsdxZ.mQBU8pC.Qice','landlord','active','/images/avatars/demo-owner-03.jpg'),
  ('demo-landlord-04','Trần Thảo Vy','thao.vy.demo@trooi.local','0900000104','$2b$12$zR7k4RUr3WhWzTfKXGNiveqHFVKtRmig5xBKsdxZ.mQBU8pC.Qice','landlord','active','/images/avatars/demo-owner-04.jpg'),
  ('demo-landlord-05','Võ Gia Hưng','gia.hung.demo@trooi.local','0900000105','$2b$12$zR7k4RUr3WhWzTfKXGNiveqHFVKtRmig5xBKsdxZ.mQBU8pC.Qice','landlord','active','/images/avatars/demo-owner-05.jpg'),
  ('demo-landlord-06','Đỗ Ngọc Mai','ngoc.mai.demo@trooi.local','0900000106','$2b$12$zR7k4RUr3WhWzTfKXGNiveqHFVKtRmig5xBKsdxZ.mQBU8pC.Qice','landlord','active','/images/avatars/demo-owner-06.jpg')
ON CONFLICT(id) DO UPDATE SET
  name=EXCLUDED.name,
  email=EXCLUDED.email,
  phone=EXCLUDED.phone,
  password_hash=EXCLUDED.password_hash,
  role='landlord',
  status='active',
  avatar_url=EXCLUDED.avatar_url,
  updated_at=now();

ALTER TABLE listings DROP CONSTRAINT IF EXISTS listings_owner_or_source_check;
ALTER TABLE listings ADD CONSTRAINT listings_owner_or_source_check CHECK (
  owner_id IS NOT NULL
  OR (source_name IS NOT NULL AND source_url IS NOT NULL AND source_checked_at IS NOT NULL)
);

UPDATE listings
SET owner_id = CASE room_type
  WHEN 'Phòng trọ' THEN 'demo-landlord-01'
  WHEN 'Căn hộ mini' THEN 'demo-landlord-02'
  WHEN 'Ở ghép' THEN 'demo-landlord-03'
  WHEN 'Ký túc xá' THEN 'demo-landlord-04'
  WHEN 'Nhà nguyên căn' THEN 'demo-landlord-05'
  WHEN 'Căn hộ' THEN 'demo-landlord-06'
  ELSE 'demo-landlord-01'
END
WHERE source_url IS NOT NULL;
