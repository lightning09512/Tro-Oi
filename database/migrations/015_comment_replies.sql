ALTER TABLE forum_comments ADD COLUMN IF NOT EXISTS parent_id TEXT REFERENCES forum_comments(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_forum_comments_parent_id ON forum_comments(parent_id);

-- Gán parent_id cho các câu trả lời mẫu
UPDATE forum_comments SET parent_id = 'pass-forum-comment-01' WHERE id = 'pass-forum-comment-02';
UPDATE forum_comments SET parent_id = 'seed-forum-04-c1' WHERE id = 'seed-forum-04-c2';
