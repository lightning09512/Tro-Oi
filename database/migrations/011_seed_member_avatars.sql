-- Seeded community members need real profile photos so forum and messaging
-- surfaces can render an identifiable person instead of a initials-only tile.
UPDATE users
SET avatar_url = CASE id
  WHEN 'user-renter-01' THEN '/images/avatars/demo-owner-01.jpg'
  WHEN 'user-renter-02' THEN '/images/avatars/demo-owner-05.jpg'
  WHEN 'user-renter-03' THEN '/images/avatars/demo-owner-02.jpg'
  WHEN 'user-renter-04' THEN '/images/avatars/demo-owner-06.jpg'
  WHEN 'user-landlord-01' THEN '/images/avatars/demo-owner-03.jpg'
  WHEN 'user-landlord-02' THEN '/images/avatars/demo-owner-04.jpg'
  ELSE avatar_url
END,
updated_at = now()
WHERE id IN (
  'user-renter-01',
  'user-renter-02',
  'user-renter-03',
  'user-renter-04',
  'user-landlord-01',
  'user-landlord-02'
);
