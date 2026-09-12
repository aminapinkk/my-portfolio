-- My Portfolio — Supabase setup
-- Run this entire file once in Supabase SQL Editor.

create table if not exists public.works (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null check (category in ('digital','traditional')),
  title text not null check (char_length(title) between 1 and 120),
  date date,
  description text check (description is null or char_length(description) <= 1200),
  file_name text not null,
  file_type text not null,
  file_path text not null unique,
  created_at timestamptz not null default now()
);

alter table public.works enable row level security;

grant select on public.works to anon, authenticated;
grant insert, update, delete on public.works to authenticated;

drop policy if exists "Public can view portfolio works" on public.works;
create policy "Public can view portfolio works"
on public.works for select to anon, authenticated
using (true);

drop policy if exists "Owners can add portfolio works" on public.works;
create policy "Owners can add portfolio works"
on public.works for insert to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Owners can update portfolio works" on public.works;
create policy "Owners can update portfolio works"
on public.works for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Owners can delete portfolio works" on public.works;
create policy "Owners can delete portfolio works"
on public.works for delete to authenticated
using ((select auth.uid()) = user_id);

-- Create the storage bucket. It is public so visitors can view artwork files.
insert into storage.buckets (id, name, public)
values ('portfolio-files', 'portfolio-files', true)
on conflict (id) do update set public = true;

-- Public read access to files in this portfolio bucket.
drop policy if exists "Public can view portfolio files" on storage.objects;
create policy "Public can view portfolio files"
on storage.objects for select to anon, authenticated
using (bucket_id = 'portfolio-files');

-- Only the signed-in owner can upload into their own UID folder.
drop policy if exists "Owners can upload portfolio files" on storage.objects;
create policy "Owners can upload portfolio files"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'portfolio-files'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

-- Needed so Storage can return the inserted object metadata.
drop policy if exists "Owners can inspect own portfolio files" on storage.objects;
create policy "Owners can inspect own portfolio files"
on storage.objects for select to authenticated
using (
  bucket_id = 'portfolio-files'
  and owner_id = (select auth.uid())
);

-- Only the owner can delete their uploaded file.
drop policy if exists "Owners can delete portfolio files" on storage.objects;
create policy "Owners can delete portfolio files"
on storage.objects for delete to authenticated
using (
  bucket_id = 'portfolio-files'
  and owner_id = (select auth.uid())
);
