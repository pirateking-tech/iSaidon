-- iSaidon database setup / migration
-- Run in Supabase SQL Editor for the iSaidon project.
-- This keeps public movie browsing enabled and restricts all writes to
-- authenticated users whose server-controlled app_metadata.role is "admin".

create extension if not exists pgcrypto;

create table if not exists public.movies (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null default 'Other',
  poster_url text,
  movie_url text,
  description text,
  release_year integer,
  created_at timestamptz not null default now()
);

-- Add fields safely if the table already existed.
alter table public.movies add column if not exists title text;
alter table public.movies add column if not exists category text default 'Other';
alter table public.movies add column if not exists poster_url text;
alter table public.movies add column if not exists movie_url text;
alter table public.movies add column if not exists description text;
alter table public.movies add column if not exists release_year integer;
alter table public.movies add column if not exists created_at timestamptz default now();

alter table public.movies enable row level security;

-- Remove existing policies to prevent an older permissive write policy
-- from continuing to allow anonymous publishing.
do $$
declare p record;
begin
  for p in
    select policyname
    from pg_policies
    where schemaname = 'public' and tablename = 'movies'
  loop
    execute format('drop policy if exists %I on public.movies', p.policyname);
  end loop;
end $$;

-- Public browsing.
grant select on public.movies to anon, authenticated;

-- No anonymous writes.
revoke insert, update, delete on public.movies from anon;

-- Authenticated users get SQL privileges, but RLS below restricts
-- the actual rows they may change.
grant insert, update, delete on public.movies to authenticated;

create policy "Public can view movies"
on public.movies for select
to anon, authenticated
using (true);

create policy "Admins can publish movies"
on public.movies for insert
to authenticated
with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "Admins can update movies"
on public.movies for update
to authenticated
using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "Admins can delete movies"
on public.movies for delete
to authenticated
using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

notify pgrst, 'reload schema';

-- After creating the admin user in Authentication > Users, run separately:
-- update auth.users
-- set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
--     || '{"role":"admin"}'::jsonb
-- where email = 'YOUR_ADMIN_EMAIL';
--
-- Then sign out and sign back in so a fresh JWT contains the admin role.
