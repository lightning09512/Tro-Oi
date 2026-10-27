-- Set avatar assets for all seed users, forum authors, and chat participants
UPDATE users SET avatar_url = '/images/avatars/demo-owner-01.jpg' WHERE id = 'user-renter-01';
UPDATE users SET avatar_url = '/images/avatars/demo-owner-05.jpg' WHERE id = 'user-renter-02';
UPDATE users SET avatar_url = '/images/avatars/demo-owner-02.jpg' WHERE id = 'user-renter-03';
UPDATE users SET avatar_url = '/images/avatars/demo-owner-06.jpg' WHERE id = 'user-renter-04';
UPDATE users SET avatar_url = '/images/avatars/demo-owner-03.jpg' WHERE id = 'user-landlord-01';
UPDATE users SET avatar_url = '/images/avatars/demo-owner-04.jpg' WHERE id = 'user-landlord-02';
UPDATE users SET avatar_url = '/images/avatars/demo-owner-01.jpg' WHERE id = 'user-admin-01';
UPDATE users SET avatar_url = '/images/avatars/demo-owner-05.jpg' WHERE id = '11e095c2-caff-4698-9168-7480ac8a8d17';

-- Default avatar for any existing or future users missing avatar_url
UPDATE users
SET avatar_url = CASE role
  WHEN 'landlord' THEN '/images/avatars/demo-owner-03.jpg'
  WHEN 'admin' THEN '/images/avatars/demo-owner-01.jpg'
  ELSE '/images/avatars/demo-owner-05.jpg'
END
WHERE avatar_url IS NULL OR avatar_url = '';
