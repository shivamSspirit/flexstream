-- Update posts table to include token fields
alter table posts add column if not exists token_mint text;
alter table posts add column if not exists token_symbol text;
alter table posts add column if not exists token_pool text;
alter table posts add column if not exists token_image text;

-- Create index for token fields
create index if not exists idx_posts_token_mint on posts(token_mint);
create index if not exists idx_posts_token_pool on posts(token_pool);

-- Update storage policy for post-media bucket
insert into storage.buckets (id, name)
values ('post-media', 'post-media')
on conflict (id) do nothing;

-- Allow public access to post-media bucket
create policy "Public Access"
on storage.objects for select
using ( bucket_id = 'post-media' );

-- Allow authenticated users to upload to post-media bucket
create policy "Authenticated Users Can Upload"
on storage.objects for insert
with check (
  bucket_id = 'post-media' 
  and auth.role() = 'authenticated'
);