-- KLEN member accounts: run this once in the Supabase SQL Editor
-- (Project > SQL Editor > New query) after creating your project.

create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  first_name text not null,
  last_name text not null,
  rank text not null,
  agency text not null,
  ori text not null,
  email text not null,
  personal_cell text,
  business_cell text,
  bio text,
  avatar_url text,
  approved boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Storage bucket for profile pictures. Create it in the dashboard under
-- Storage > New bucket, named exactly "avatars", and set it Public so
-- uploaded pictures can be displayed via a public URL. Then run the
-- policies below (Storage > Policies, or here in the SQL editor).

create policy "Avatar images are publicly readable"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "Users can upload their own avatar"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can update their own avatar"
  on storage.objects for update
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

-- To approve a registered member, open Table Editor > profiles in the
-- Supabase dashboard and set their "approved" column to true. There is no
-- in-site admin approval page yet.
