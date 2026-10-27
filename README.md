# Learning Platform

A full-stack learning platform monorepo. See `docs/architecture.md` and `.env.example` for setup.

## Stack
- Public website and student dashboard: Next.js App Router, TypeScript, Tailwind CSS
- API: NestJS, PostgreSQL/Supabase
- Payments: Razorpay adapter scaffold (credentials required)
- Deployment: Vercel for web apps; API deployed separately

This repository is an initial implementation scaffold. Configure secrets, run migrations, and complete security/integration testing before production use.
