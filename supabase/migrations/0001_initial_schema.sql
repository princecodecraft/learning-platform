create extension if not exists pgcrypto;

create table if not exists public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 display_name text,
 role text not null default 'student' check (role in ('student','instructor','admin')),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create table if not exists public.courses (
 id uuid primary key default gen_random_uuid(), slug text not null unique,
 title text not null, description text not null default '',
 price_minor integer not null default 0 check (price_minor >= 0),
 currency char(3) not null default 'INR', published boolean not null default false,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.lessons (
 id uuid primary key default gen_random_uuid(),
 course_id uuid not null references public.courses(id) on delete cascade,
 title text not null, position integer not null check (position >= 0),
 content_url text, is_preview boolean not null default false,
 created_at timestamptz not null default now(), unique(course_id, position)
);
create table if not exists public.enrollments (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 course_id uuid not null references public.courses(id) on delete cascade,
 status text not null default 'active' check (status in ('active','revoked','completed')),
 enrolled_at timestamptz not null default now(), unique(user_id, course_id)
);
create table if not exists public.lesson_progress (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 lesson_id uuid not null references public.lessons(id) on delete cascade,
 completed_at timestamptz, updated_at timestamptz not null default now(), unique(user_id, lesson_id)
);
create index if not exists courses_published_idx on public.courses(published, created_at desc);
create index if not exists lessons_course_position_idx on public.lessons(course_id, position);
create index if not exists enrollments_user_status_idx on public.enrollments(user_id, status);
create index if not exists lesson_progress_user_idx on public.lesson_progress(user_id, lesson_id);

alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.lessons enable row level security;
alter table public.enrollments enable row level security;
alter table public.lesson_progress enable row level security;
create policy "Profiles readable by owner" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "Users update own profile" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
create policy "Published courses are public" on public.courses for select to anon, authenticated using (published);
create policy "Lessons of published courses are visible" on public.lessons for select to anon, authenticated using (
 exists (select 1 from public.courses c where c.id = course_id and c.published and
 (is_preview or exists (select 1 from public.enrollments e where e.course_id = c.id and e.user_id = auth.uid() and e.status = 'active')))
);
create policy "Users view own enrollments" on public.enrollments for select to authenticated using (auth.uid() = user_id);
create policy "Users view own progress" on public.lesson_progress for select to authenticated using (auth.uid() = user_id);
create policy "Users write own progress" on public.lesson_progress for insert to authenticated with check (auth.uid() = user_id);
create policy "Users update own progress" on public.lesson_progress for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
-- Enrollment writes must be performed only by a trusted server after payment verification.
-- Never expose the Supabase service-role key to browser clients.
