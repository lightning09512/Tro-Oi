CREATE TABLE IF NOT EXISTS friend_requests (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  sender_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(sender_id, receiver_id)
);

CREATE INDEX IF NOT EXISTS idx_friend_requests_receiver ON friend_requests(receiver_id, status);
CREATE INDEX IF NOT EXISTS idx_friend_requests_sender ON friend_requests(sender_id, status);

-- Seed pending friend requests
INSERT INTO friend_requests (id, sender_id, receiver_id, status, created_at)
VALUES
  ('fr-seed-01', 'user-renter-01', '11e095c2-caff-4698-9168-7480ac8a8d17', 'pending', now() - interval '2 hours'),
  ('fr-seed-02', 'user-renter-03', '11e095c2-caff-4698-9168-7480ac8a8d17', 'pending', now() - interval '5 hours'),
  ('fr-seed-03', 'user-landlord-01', '11e095c2-caff-4698-9168-7480ac8a8d17', 'pending', now() - interval '1 day')
ON CONFLICT (sender_id, receiver_id) DO NOTHING;
