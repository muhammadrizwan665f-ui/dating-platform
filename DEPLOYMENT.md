# Deployment

## Why not shared/cPanel hosting (e.g. typical Hostinger shared plans)

This app needs two **persistent Node processes** running at all times:
1. The Next.js server (`apps/web`) — works fine on serverless/edge platforms too.
2. The Socket.IO realtime server (`apps/realtime`) — **requires a long-lived
   process holding open WebSocket connections**. Shared cPanel-style hosting
   only runs PHP/CGI per-request and cannot keep a Node process alive, so
   realtime chat and live notifications will not work there.

If budget is the primary constraint, VPS hosting (DigitalOcean, Linode,
Contabo, a Hostinger **VPS** plan specifically — not shared hosting) or a
PaaS with native Node support (Railway, Render, Fly.io) are the practical
options. Tell me which you're leaning toward and I'll confirm compatibility
and give exact setup steps for that provider.

## Recommended topology

```
┌─────────────┐      ┌──────────────────┐      ┌─────────────┐
│  Next.js     │─────▶│  PostgreSQL       │      │  Object      │
│  (apps/web)  │      │  (managed)        │      │  Storage     │
└──────┬───────┘      └──────────────────┘      │  (R2/S3)     │
       │ internal HTTP (shared secret)            └─────────────┘
       ▼
┌──────────────────┐
│  Socket.IO        │
│  (apps/realtime)  │
└──────────────────┘
```

## Steps

1. **Database**: provision managed Postgres (Neon, Supabase, Railway Postgres,
   or self-hosted on the VPS). Set `DATABASE_URL`.
2. **Object storage**: create an R2/S3 bucket, set `STORAGE_*` env vars, and
   configure CORS to allow PUT from your app's origin.
3. **Web app**:
   - `npm install && npm run build` in `apps/web`
   - `npm run db:migrate` (or `prisma migrate deploy` in production) then
     `npm run db:seed` once, on first deploy only
   - `npm run start` behind a process manager (pm2/systemd) or your
     platform's native Node runtime
4. **Realtime server**:
   - `npm install && npm run build` in `apps/realtime`
   - `npm run start`, exposed on its own port, reachable from the web app via
     `REALTIME_INTERNAL_URL` (internal network) and from browsers via a
     public URL for the Socket.IO client (`NEXT_PUBLIC_REALTIME_URL`)
5. **Reverse proxy**: put both services behind nginx/Caddy with TLS. Route
   `/socket.io/*` (or a subdomain) to the realtime server.
6. **First admin account**: the seed script creates `admin@dev.local` /
   `ChangeMe123!` — log in and change the password (or better, create a new
   SUPER_ADMIN and delete the seed account) before going live.
7. **Payment methods & pricing**: set real bank/Easypaisa/JazzCash
   instructions from Admin > Settings > Payment Methods, and adjust plan
   prices from Admin > Memberships. Nothing is hardcoded.

## Environment checklist before going live

- [ ] `AUTH_SECRET` is a strong random value, not the example
- [ ] Seed admin password changed
- [ ] Real payment method instructions entered (no placeholder account numbers)
- [ ] Terms/Privacy pages replaced with counsel-reviewed text
- [ ] Storage bucket is private with only presigned-URL access
- [ ] `REALTIME_INTERNAL_SECRET` set and only known to the two backend services
