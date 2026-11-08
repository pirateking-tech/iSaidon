create table if not exists public.movies (
    id uuid primary key default gen_random_uuid(),
    title text not null,
    poster_url text not null,
    movie_url text not null,
    category text not null default '2026',
    created_at timestamptz not null default now()
);

alter table public.movies
    add column if not exists id uuid default gen_random_uuid(),
    add column if not exists title text not null default '',
    add column if not exists poster_url text not null default '',
    add column if not exists movie_url text not null default '',
    add column if not exists category text not null default '2026',
    add column if not exists created_at timestamptz not null default now();

alter table public.movies enable row level security;

grant select, insert on public.movies to anon, authenticated;

drop policy if exists "Movies are public" on public.movies;
create policy "Movies are public"
on public.movies
for select
to anon, authenticated
using (true);

drop policy if exists "Public can publish movies" on public.movies;
create policy "Public can publish movies"
on public.movies
for insert
to anon
with check (true);
