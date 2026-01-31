-- Add title column to posts table if it doesn't exist
ALTER TABLE posts ADD COLUMN IF NOT EXISTS title TEXT;

-- Update existing posts to have title same as first 50 chars of content
UPDATE posts
SET title = LEFT(content, 50)
WHERE title IS NULL;
