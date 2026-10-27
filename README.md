# SkillSpring Learning Platform

A code-based LMS monorepo with a public student site and a separate administrator dashboard.

## Applications and route map

- `apps/web` — public Next.js App Router site.
  - `/` public homepage
  - `/login` student sign-in and account creation
  - `/courses` published course catalogue and checkout
  - `/my-learning` student enrollments
  - `/learn/[courseId]` enrolled course player
  - `/api/checkout` authenticated server-side order creation
  - `/api/checkout/verify` payment verification and enrollment grant
  - `/api/lessons/[lessonId]/playback` short-lived signed private video playback
- `apps/dashboard` — separate Next.js admin app.
  - `/login` administrator sign-in
  - `/` live overview metrics
  - `/courses` create, edit, publish and delete courses
  - `/videos` add/edit/delete lessons and upload video files to private R2
  - `/users` search learners and manage student/admin roles
  - `/payments` view orders, verified revenue and payment status
  - `/settings` integration checklist
  - `/api/admin/video-upload` admin-only signed R2 upload URL
- `services/api` — NestJS REST API foundation.

## Stack

- Next.js App Router + TypeScript
- Supabase Auth + PostgreSQL + Row Level Security
- Razorpay server-side orders and signature/payment verification
- Cloudflare R2 signed uploads and short-lived signed playback URLs
- NestJS API foundation

## Local development

1. Use Node.js 20+.
2. Copy `.env.example` to your local environment and configure the providers.
3. Run `npm install` from the repository root.
4. Apply `supabase/schema.sql` in the Supabase SQL Editor.
5. Run `npm run dev:web`, `npm run dev:dashboard` and optionally `npm run dev:api` in separate terminals.

## Required environment variables

Set public Supabase URL and anon key on both Vercel projects:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Set server-only variables on the public website project:
- `SUPABASE_SERVICE_ROLE_KEY`
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET`

Set R2 variables on the dashboard project too, for direct signed video uploads. Configure the R2 bucket CORS to allow PUT from the dashboard's production origin with the `Content-Type` request header. Never expose R2 credentials, the Supabase service-role key or Razorpay secret as `NEXT_PUBLIC_*`.

## First-time admin setup

1. Create your account through the public site's `/login` page by switching to Create account.
2. Confirm the email if Supabase email confirmation is enabled.
3. Run this in Supabase SQL Editor, replacing the email with your own:
   ```sql
   update public.profiles
   set role = 'admin'
   where email = 'YOUR_EMAIL';
   ```
4. Sign in at the dashboard's `/login` route.

## Payment and video security notes

- Never grant enrollment based on the browser's payment callback alone. The server verifies the Razorpay signature and fetches payment state before granting access.
- R2-backed lessons store an internal `r2://...` object reference. Playback requires an authenticated user and either an active enrollment, a preview lesson, or an administrator role. Signed playback URLs expire after five minutes.
- Direct third-party video URLs can be shared independently of LMS permissions. Use private R2 storage for paid content.
- Refunds should be initiated through Razorpay's server API and reconciled with webhooks before implementing refund actions in the UI.
- Configure Supabase Auth redirect URLs for the public site and dashboard production domains.

This is a deployable implementation foundation; provider credentials, SQL application, R2 bucket CORS and a full payment/webhook test pass are still required before production transactions.
