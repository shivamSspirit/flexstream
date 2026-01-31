-- Note: Storage bucket creation requires admin privileges
-- Please create the bucket manually through the Supabase Dashboard

-- Alternative: Create bucket through Supabase Dashboard
-- 1. Go to Storage in your Supabase Dashboard
-- 2. Click "New bucket"
-- 3. Name: "flexstream"
-- 4. Make it public: Yes
-- 5. File size limit: 50MB
-- 6. Allowed MIME types: image/jpeg,image/jpg,image/png,image/gif,image/webp,video/mp4,video/webm,video/ogg,video/avi,video/mov

-- After creating the bucket manually, run these policies:
-- Note: If policies already exist, you'll get "already exists" errors - this is normal and expected
-- You can safely ignore these errors as they indicate the policies are already set up correctly

-- Drop existing policies first (ignore errors if they don't exist)
DROP POLICY IF EXISTS "Allow authenticated users to upload files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to view files" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete their own files" ON storage.objects;

-- Create the policies
CREATE POLICY "Allow authenticated users to upload files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'flexstream' AND 
  auth.role() = 'authenticated'
);

CREATE POLICY "Allow authenticated users to view files" ON storage.objects
FOR SELECT USING (
  bucket_id = 'flexstream' AND 
  auth.role() = 'authenticated'
);

CREATE POLICY "Allow users to delete their own files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'flexstream' AND 
  auth.role() = 'authenticated' AND
  auth.uid()::text = (storage.foldername(name))[1]
);