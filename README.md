# Learning Platform

Full-stack learning platform monorepo with a public course website, separate student dashboard, NestJS API, and Supabase schema.

## Stack
- Public website: Next.js App Router + TypeScript (`apps/web`, port 3000)
- Student dashboard: Next.js App Router + TypeScript (`apps/dashboard`, port 3001)
- REST API: NestJS (`services/api`, port 4000)
- Database/auth foundation: Supabase Postgres + RLS migration (`supabase/migrations`)
- CI: GitHub Actions build workflow

## Run locally
1. Install Node.js 20 or newer.
2. Copy `.env.example` to `.env`; set values for services you configure.
3. From the repository root, run `npm install`.
4. Start API: `npm run dev:api`.
5. In separate terminals run `npm run dev:web` and `npm run dev:dashboard`.
6. Apply `supabase/migrations/0001_initial_schema.sql` to your Supabase project before using its tables.

## Current implementation status
The public landing page and dashboard UI are present. Dashboard numbers and the API course catalogue are sample/demo data. The SQL migration provides an initial schema and RLS policies.

**Not production-ready yet:** authentication/session flows, database-backed course APIs, enrollment and progress writes, secure Razorpay order/webhook flow, video hosting, email, admin CRUD, comprehensive tests, observability and load testing. Do not expose service-role credentials in the browser. Never deploy payment functionality until server-side price lookup, raw-body signature verification, idempotency and persisted payment state are implemented and tested.

One million registered users does not mean one million concurrent users. Capacity must be established with workload-specific load tests and infrastructure sizing.
