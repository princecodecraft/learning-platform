-- SkillSpring core schema. Run in Supabase SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique,
  description text,
  category text,
  thumbnail_url text,
  price_inr integer not null default 0 check (price_inr >= 0),
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  description text,
  video_url text,
  position integer not null default 0,
  is_preview boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  status text not null default 'active' check (status in ('active','refunded','revoked')),
  created_at timestamptz not null default now(),
  unique(user_id, course_id)
);

create table if not exists public.checkout_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete restrict,
  razorpay_order_id text not null unique,
  amount_paise integer not null check (amount_paise >= 0),
  status text not null default 'created' check (status in ('created','paid','failed')),
  created_at timestamptz not null default now()
);

alter table public.courses enable row level security;
alter table public.lessons enable row level security;
alter table public.enrollments enable row level security;
alter table public.checkout_orders enable row level security;

drop policy if exists "Published courses are viewable" on public.courses;
create policy "Published courses are viewable" on public.courses for select using (published = true);
drop policy if exists "Published lessons or previews are viewable" on public.lessons;
create policy "Published lessons or previews are viewable" on public.lessons for select using (
  is_preview = true or exists (select 1 from public.courses c where c.id = course_id and c.published = true)
  and exists (select 1 from public.enrollments e where e.course_id = lessons.course_id and e.user_id = auth.uid() and e.status = 'active')
);
drop policy if exists "Users can view their own enrollments" on public.enrollments;
create policy "Users can view their own enrollments" on public.enrollments for select using (user_id = auth.uid());
drop policy if exists "Users can view their own checkout orders" on public.checkout_orders;
create policy "Users can view their own checkout orders" on public.checkout_orders for select using (user_id = auth.uid());
-- Do not add client INSERT/UPDATE policies for enrollments or checkout_orders.
-- The server uses the Supabase service-role key after verifying Razorpay payment.


-- Creator/admin access. After signing up, promote your own account using:
-- update public.profiles set role = 'admin'
-- where id = (select id from auth.users where email = 'YOUR_LOGIN_EMAIL');
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'student' check (role in ('student','admin')),
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile" on public.profiles for select using (id = auth.uid());
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles(id, full_name) values (new.id, new.raw_user_meta_data->>'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();

drop policy if exists "Admins can manage courses" on public.courses;
create policy "Admins can manage courses" on public.courses for all using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
) with check (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);
drop policy if exists "Admins can manage lessons" on public.lessons;
create policy "Admins can manage lessons" on public.lessons for all using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
) with check (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);
