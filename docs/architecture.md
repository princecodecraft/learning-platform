# Learning platform architecture

- `apps/web`: public course discovery and course details.
- `apps/dashboard`: student learning area and progress UI.
- `services/api`: NestJS REST API.
- `supabase/migrations`: PostgreSQL schema and row-level security.

## Scale strategy
Keep web pages stateless and cache public catalogue at the CDN. Run API instances behind a load balancer and use database connection pooling. Add Redis for cache/rate limits and a durable queue for asynchronous work when needed. Store videos in object storage/CDN rather than serving them from API instances. Add metrics, tracing, alerting, backups and restore drills. Load-test realistic workloads before capacity claims: one million registered users is not one million concurrent users.

## Production blockers
Authentication/JWT verification and role authorization; server-side payment order creation; raw-body webhook signature verification and idempotency; persisted enrollments/progress; email verification/password reset; rate limits; integration tests; monitoring and recovery procedures. Do not commit secrets.
