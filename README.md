# Dating Platform — 18+ Pakistan-focused Dating & Social Connection App

## Status: Substantial working slice across every core feature area

This is a single continuous build — real, runnable code, not pseudo-code —
covering auth, onboarding, discovery/matching, social feed, realtime chat,
memberships/payments, privacy controls, and a full admin panel. See
`DEPLOYMENT.md` for hosting guidance (important: shared cPanel-style hosting
will not work for the realtime chat server).

## Overview

An 18+ dating + social discovery platform: profile creation with admin
approval, Rs.499 starting membership with Pro/Diamond tiers, manual payment
verification, realtime WhatsApp-style chat, a social feed, matching,
connections/follow, and a full admin moderation panel.

## Technology

- **Web app**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Database**: PostgreSQL via Prisma ORM
- **Auth**: NextAuth (Credentials) + phone OTP verification
- **Realtime**: Socket.IO sidecar server (`apps/realtime`) — required because
  serverless Next.js API routes can't hold persistent WebSocket connections
- **Storage**: S3-compatible object storage via a swappable abstraction
  (`lib/storage/storage.ts`)
- **Deployment target**: any Node-capable host (VPS, Railway, Render, Fly.io)
  running both the web app and the realtime sidecar, plus a managed Postgres
  instance. **Shared cPanel/Hostinger hosting will not work** — it can't run
  a persistent Node process for the socket server. If you're committed to a
  specific budget host, tell me and I'll confirm compatibility before you pay
  for anything.

## Project layout

```
apps/web/         Next.js app (pages, API routes, components, Prisma schema)
apps/realtime/     Socket.IO sidecar for chat + live notifications
packages/shared/    Constants/enums shared by both apps
```

## Local setup

```bash
cp .env.example .env         # fill in DATABASE_URL, AUTH_SECRET, storage, etc.
cd apps/web
npm install
npm run db:generate
npm run db:migrate           # creates all tables from prisma/schema.prisma
npm run db:seed              # membership plans, payment methods, dev admin
npm run dev                  # http://localhost:3000

# in a second terminal
cd apps/realtime
npm install
npm run dev                  # ws server on :4001
```

Dev admin login (seeded, **change immediately outside local dev**):
`admin@dev.local` / `ChangeMe123!`

## What's implemented

**Auth & onboarding**: registration with server-side age verification,
NextAuth credentials login, session-version-based "logout all devices",
8-step onboarding wizard, presigned/validated photo uploads.

**Discovery & matching**: block-aware ranked discovery (profile completeness
+ recency + capped premium boost so no tier fully dominates), idempotent
like → mutual match creation, unmatch, block cascades (hides matches,
cancels pending connection requests).

**Social feed**: text/image posts, like/unlike, comments, block-aware feed
query.

**Connections & follow**: request/accept/decline, follow/unfollow with
notification fan-out.

**Realtime chat**: WhatsApp-style UI (conversation list + chat window,
optimistic send with retry-on-fail, read receipts, date separators), strict
per-conversation authorization, Socket.IO sidecar server with JWT-verified
connections.

**Payments & membership**: dynamic DB-driven plans/pricing (nothing
hardcoded), manual payment submission with proof/reference, admin
approve/reject with automatic subscription activation and audit logging.

**Privacy & safety**: hide-from-discovery, online/last-seen toggles, block,
report (profile/post/comment/message), account deletion (soft-delete,
retains payment/audit records per spec §57).

**Admin panel**: dashboard stats, user search + suspend/ban/reinstate,
profile approval queue, payment review queue, report moderation queue — all
writing to the audit log.

**Public pages**: home, pricing (reads live plans), how-it-works, safety,
FAQ, terms, privacy, community guidelines, contact/support ticket form.

## Testing

```bash
cd apps/web
npm run test
```

Covers: server-side age calculation (edge cases around exact birthdays),
like→match idempotency, and authorization (unauthenticated requests,
non-participants trying to read/write a conversation, non-admins hitting
admin routes). These use a mocked Prisma client so they run without a
database — see `tests/` for how to extend with real DB integration tests
before production.



## Environment variables

See `.env.example`. Never commit `.env` or real credentials.
