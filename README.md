# Unicharm Unified CRM

3-tier monorepo. **frontend** (Next.js 15 UI), **backend** (Express + JWT API), **database** (Prisma package). Database is only touched by the backend; the frontend talks to the backend over HTTP.

## Architecture

```
unicharm-crm/
├── frontend/   Next.js 15 — UI only (:3000). NextAuth login, no DB access.
│              Server components fetch via lib/api.ts (serverApi).
│              Client components fetch /api/* → BFF proxy → backend.
├── backend/    Express + TypeScript API (:4000). All Prisma queries,
│              RBAC, services (ai, identity, segmentation, providers).
│              Verifies HS256 JWT (shared JWT_SECRET).
└── database/   @unicharm/database — Prisma schema, client, seed.
```

**Auth flow:** NextAuth `authorize()` → `POST backend /auth/login` → backend
verifies bcrypt, returns user + HS256 JWT. Frontend stores token in the
NextAuth session. Every backend call carries `Authorization: Bearer <jwt>`
plus `X-Active-Brand` (the cross-brand cookie). Backend `authMiddleware`
verifies the JWT and enforces RBAC.

## Run

```bash
npm install            # installs all 3 workspaces
npm run db:reset       # push schema + seed demo data (database workspace)
npm run dev            # concurrently: db generate + backend (:4000) + frontend (:3000)
```

Or individually: `npm run dev:backend`, `npm run dev:frontend`.

Open http://localhost:3000

## Env

- `backend/.env` — `PORT`, `JWT_SECRET`, `DATABASE_URL` (`file:./dev.db` relative to schema), `FRONTEND_ORIGIN`
- `frontend/.env.local` — `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `BACKEND_URL`, `JWT_SECRET` (must match backend)
- `database/.env` — `DATABASE_URL`

## Modules (per PRD §4)

1. **CDP** — unified customer profile
2. **Segmentation** — rule-based audience builder
3. **Marketing Automation** — journeys, campaigns, triggers
4. **WhatsApp CRM** — template messages, inbox
5. **Analytics** — funnel, cohort, CLTV, attribution
6. **AI Recommendation** — churn, lifecycle, product reco
7. **Loyalty & Rewards** — tiers, points, redemptions
8. **Admin & Governance** — users, brands, audit log, consent

## Brands

Sofy · Mamy Poko Pants · Lifree · Pet Care. RBAC per-brand.

Demo logins (seeded):

| Email                    | Password   | Role        | Brands             |
|--------------------------|------------|-------------|--------------------|
| admin@unicharm.in        | admin123   | SUPER_ADMIN | All                |
| sofy.manager@unicharm.in | sofy123    | BRAND_ADMIN | Sofy               |
| analyst@unicharm.in      | analyst123 | ANALYST     | All (read-only)    |

## Swap SQLite → Postgres

Edit `prisma/schema.prisma`: change `provider = "sqlite"` to `"postgresql"`, set
`DATABASE_URL` in `.env.local`, run `npx prisma migrate dev`.

## Stack notes (deviations from PRD §10)

- DB: SQLite local for dev; Postgres prod (PRD specified). MongoDB layer skipped — pluggable via repository pattern under `src/lib/repos/`.
- Messaging: WhatsApp/SES/Firebase stubbed behind interfaces in `src/lib/providers/`. Swap in real creds via env.
- AI: Heuristic models in `src/lib/ai/`. Swap with real ML endpoints.
