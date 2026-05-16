-- ─────────────────────────────────────────────────────────────────────────────
-- Alla LMS — Supabase schema
-- Run this in the Supabase SQL editor on a fresh project.
-- ─────────────────────────────────────────────────────────────────────────────

-- Required extensions
create extension if not exists "pgcrypto";

-- ─── Tables ──────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'student' check (role in ('admin', 'student')),
  created_at timestamptz default now()
);

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  thumbnail_url text,
  published boolean default false,
  created_at timestamptz default now()
);

create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references public.courses(id) on delete cascade,
  title text not null,
  description text,
  position integer not null default 0,
  mux_asset_id text,
  mux_playback_id text,
  mux_upload_id text,
  mux_status text default 'waiting' check (mux_status in ('waiting', 'preparing', 'ready', 'errored')),
  material_storage_path text,
  material_display_position text default 'after' check (material_display_position in ('before', 'after')),
  created_at timestamptz default now()
);

create index if not exists lessons_course_position_idx on public.lessons (course_id, position);
create index if not exists lessons_upload_id_idx on public.lessons (mux_upload_id);
create index if not exists lessons_asset_id_idx on public.lessons (mux_asset_id);

create table if not exists public.enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  course_id uuid references public.courses(id) on delete cascade,
  enrolled_at timestamptz default now(),
  unique(user_id, course_id)
);

create table if not exists public.lesson_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  lesson_id uuid references public.lessons(id) on delete cascade,
  completed boolean default false,
  last_position_seconds integer default 0,
  updated_at timestamptz default now(),
  unique(user_id, lesson_id)
);

-- ─── Profile auto-create on sign up ──────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', null),
    'student'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── Row-level security ──────────────────────────────────────────────────────
alter table public.profiles        enable row level security;
alter table public.courses         enable row level security;
alter table public.lessons         enable row level security;
alter table public.enrollments     enable row level security;
alter table public.lesson_progress enable row level security;

-- profiles
drop policy if exists "Users read own profile" on public.profiles;
create policy "Users read own profile" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "Users update own profile" on public.profiles;
create policy "Users update own profile" on public.profiles
  for update using (auth.uid() = id);

drop policy if exists "Users insert own profile" on public.profiles;
create policy "Users insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "Admin reads all profiles" on public.profiles;
create policy "Admin reads all profiles" on public.profiles
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- courses
drop policy if exists "Public reads published courses" on public.courses;
create policy "Public reads published courses" on public.courses
  for select using (published = true);

drop policy if exists "Admin full access courses" on public.courses;
create policy "Admin full access courses" on public.courses
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- lessons
drop policy if exists "Enrolled students read lessons" on public.lessons;
create policy "Enrolled students read lessons" on public.lessons
  for select using (
    exists (
      select 1 from public.enrollments
      where user_id = auth.uid() and course_id = lessons.course_id
    )
  );

drop policy if exists "Admin full access lessons" on public.lessons;
create policy "Admin full access lessons" on public.lessons
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- enrollments
drop policy if exists "Users read own enrollments" on public.enrollments;
create policy "Users read own enrollments" on public.enrollments
  for select using (auth.uid() = user_id);

drop policy if exists "Users insert own enrollments" on public.enrollments;
create policy "Users insert own enrollments" on public.enrollments
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users delete own enrollments" on public.enrollments;
create policy "Users delete own enrollments" on public.enrollments
  for delete using (auth.uid() = user_id);

drop policy if exists "Admin reads all enrollments" on public.enrollments;
create policy "Admin reads all enrollments" on public.enrollments
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- lesson_progress
drop policy if exists "Users manage own progress" on public.lesson_progress;
create policy "Users manage own progress" on public.lesson_progress
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─── Storage bucket for PDFs ─────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('materials', 'materials', false)
on conflict (id) do nothing;

drop policy if exists "Admin upload materials" on storage.objects;
create policy "Admin upload materials" on storage.objects
  for insert
  with check (
    bucket_id = 'materials' and exists (
      select 1 from public.profiles where id = auth.uid() and role = 'admin'
    )
  );

drop policy if exists "Admin update materials" on storage.objects;
create policy "Admin update materials" on storage.objects
  for update
  using (
    bucket_id = 'materials' and exists (
      select 1 from public.profiles where id = auth.uid() and role = 'admin'
    )
  );

drop policy if exists "Admin delete materials" on storage.objects;
create policy "Admin delete materials" on storage.objects
  for delete
  using (
    bucket_id = 'materials' and exists (
      select 1 from public.profiles where id = auth.uid() and role = 'admin'
    )
  );

-- Reads happen via signed URLs only (the API routes verify enrollment first),
-- so no broad SELECT policy is required.

-- Enable realtime status updates on lesson rows (admin + student players).
-- alter publication supabase_realtime add table public.lessons;

-- ─── Promote a user to admin (run once with the user's email) ────────────────
-- update public.profiles
--    set role = 'admin'
--  where id = (select id from auth.users where email = 'you@example.com');
