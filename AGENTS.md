<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

# ORBLOX — Agent / Developer Guide

> Marketplace Roblox: Robux Gamepass, Robux Instan, dan Item Game (multi-seller hybrid).
> See `PLAN.md` for the full product specification.

Brand: **ORBLOX** — Workspace folder name: `rolnuks`.

## Versions in use (verify before assuming behavior)

| Library            | Version               | Notes                                                                     |
| ------------------ | --------------------- | ------------------------------------------------------------------------- |
| Next.js            | 16.2.4                | App Router, Cache Components, async `params` & `cookies()`                |
| React              | 19.2.4                | Server Components default                                                 |
| TypeScript         | ^5                    | strict                                                                    |
| Tailwind CSS       | v4                    | `@tailwindcss/postcss`, no `tailwind.config.js` — theme in `globals.css`  |
| Prisma             | 7.8.0                 | URL in `prisma.config.ts`, requires driver adapter (`@prisma/adapter-pg`) |
| NextAuth (Auth.js) | 5.0.0-beta.31         | Credentials, JWT session, `auth.config.ts` for edge middleware            |
| Midtrans           | midtrans-client 1.4.x | Snap + Webhook                                                            |
| Queue              | BullMQ + ioredis      |                                                                           |
| Storage            | MinIO (S3 compatible) | local dev                                                                 |

When in doubt about Next.js, **read** `node_modules/next/dist/docs/` first — the docs ship with the installed version.

## Quickstart

```bash
# 1. Install deps
npm install

# 2. Bring up local infra (postgres + redis + minio)
npm run docker:up

# 3. Generate Prisma client + apply migrations
npm run prisma:generate
npm run prisma:migrate -- --name init

# 4. Seed products & admin user (see PLAN §5 for source-of-truth pricing)
npm run prisma:seed

# 5. Start dev server
npm run dev
# -> http://localhost:3000
```

Default admin (created by seed):

- Email: `admin@orblox.local`
- Password: `admin12345`
- ⚠️ Change before any deployment.

## Scripts

| Command                             | What it does                                    |
| ----------------------------------- | ----------------------------------------------- |
| `npm run dev`                       | Next.js dev server with HMR                     |
| `npm run build`                     | Production build                                |
| `npm run start`                     | Run production build                            |
| `npm run lint` / `lint:fix`         | ESLint                                          |
| `npm run typecheck`                 | `tsc --noEmit`                                  |
| `npm run format` / `format:check`   | Prettier                                        |
| `npm run prisma:generate`           | Regenerate Prisma client (after schema changes) |
| `npm run prisma:migrate`            | Create + apply dev migration                    |
| `npm run prisma:deploy`             | Apply migrations in CI/prod                     |
| `npm run prisma:studio`             | Browse DB via Prisma Studio                     |
| `npm run prisma:seed`               | Seed catalog + admin user                       |
| `npm run db:reset`                  | Drop & re-migrate (dev only)                    |
| `npm run docker:up` / `docker:down` | Local stack lifecycle                           |

## Project layout

```
prisma/
  schema.prisma             # Data model — keep in sync with PLAN §4
  seed.ts                   # Robux Gamepass + Instan products + admin
src/
  auth.ts                   # NextAuth full config (Credentials + Prisma) — server-only
  auth.config.ts            # Edge-safe config used by proxy
  proxy.ts                  # Route protection (RBAC). Next.js 16 renamed `middleware.ts` -> `proxy.ts`
  app/
    (public)/               # Landing, katalog, product detail
    (auth)/                 # login, register, forgot password (TODO M1)
    (buyer)/                # Buyer dashboard (TODO M2)
    (seller)/               # Seller dashboard (TODO M4)
    admin/                  # Admin dashboard (TODO M3)
    api/
      auth/[...nextauth]/   # Auth.js handler
      webhooks/midtrans/    # Midtrans webhook (TODO M2)
  components/
    ui/                     # shadcn-style primitives (Button, Input, Card, Label)
    layout/                 # SiteHeader, SiteFooter, SiteLogo
  lib/
    db.ts                   # Prisma singleton with PrismaPg adapter
    utils.ts                # cn(), formatIDR(), calcGamepassRequiredAmount()
    validators/             # Zod schemas
  server/
    actions/                # Server Actions (auth, order, ...)
    services/               # Business logic (TODO)
    queue/                  # BullMQ workers (TODO)
  types/                    # Type augmentations (next-auth, etc.)
docker/
  docker-compose.yml        # Local dev stack
.husky/                     # pre-commit + commit-msg hooks
prisma.config.ts            # Prisma 7 config (datasource URL lives here, NOT in schema)
PLAN.md                     # Product spec — source of truth
```

## Coding conventions

### Next.js 16 specifics

- **`params` is a Promise** — `await params` (or `.then`) in pages/layouts/route handlers.
- **`cookies()` and `headers()` are async** — `const c = await cookies()`.
- **Server Actions** with form validation use `useActionState` — signature `(prevState, formData) => Promise<State>`. See `src/server/actions/auth.ts`.
- **Caching**: `'use cache'` directive (Cache Components). For dynamic data, wrap in `<Suspense>`. Avoid `revalidate` export from older versions.
- **Dynamic routes** that read cookies/headers: usually no need to mark — Next infers. If you cache, use `'use cache'` + `cacheLife()`.
- **Webhook routes** (`/api/webhooks/...`) export `POST` handler. Default uncached.

### Auth

- Use `auth()` from `@/auth` in Server Components / Server Actions / Route Handlers.
- For proxy (formerly middleware), only `@/auth.config` (edge-safe).
- Always re-verify role inside Server Actions — don't trust client.
- Passwords hashed with `bcryptjs` (12 rounds).
- Session strategy: JWT only (Credentials limitation). Database sessions later when adding OAuth.

### Database

- Single Prisma client instance (`@/lib/db`).
- `Decimal(15, 2)` for money. Always wrap with `new Prisma.Decimal(...)` when assigning numbers.
- Audit trail: write to `AuditLog` for every admin/seller mutating action.
- Always paginate listing queries (default page size 24).
- Use `select` to limit fields when reading (no `findMany()` without select unless internal).

### Forms & validation

- Define schemas in `src/lib/validators/*.ts` (Zod).
- Server Actions: parse with `safeParse`, return `{ ok, errors, message }`.
- Client form: `useActionState(action, initialState)` + display `errors[field]?.[0]`.
- For optimistic UI use React 19 `useOptimistic`.

### Styling

- Tailwind v4: utility classes only. Theme tokens in `src/app/globals.css` via `@theme`.
- Brand color: `bg-primary`, `text-primary-foreground` (vibrant red / oklch 58 .22 28).
- Dark mode: class-based (`html.dark`). Toggle component TODO.
- Never inline arbitrary hex; use a token (`oklch()` in globals).

### Money & locale

- Display with `formatIDR()` from `@/lib/utils`.
- Locale: `id-ID`, timezone `Asia/Jakarta`.
- Robux Gamepass formula: `gamepass_required = ceil(robux_amount / 0.7)`.

### Errors & logging

- Server Actions: throw only on programmer errors. Return user-facing errors as state.
- Use `pino` for structured logs (TODO: shared logger).
- Never `console.log` PII; redact email/phone if logged.

## Workflow

1. Read `PLAN.md` for relevant section before adding a feature.
2. Update Prisma schema → run `prisma:migrate -- --name <slug>` → commit migration.
3. Add Zod schema in `lib/validators/` if new input shape.
4. Add server action / service in `server/`.
5. Build UI in `app/...` — Server Components by default, `"use client"` only when needed.
6. Run `npm run typecheck && npm run lint && npm run build` before opening PR.
7. Conventional commits enforced by Husky + commitlint (`feat`, `fix`, `chore`, ...).

## Roadmap (see PLAN §11)

- ✅ M0 — Foundation (this milestone)
- ⏳ M1 — Public catalog + auth pages (login/register)
- ⏳ M2 — Checkout + Midtrans webhook
- ⏳ M3 — Admin fulfillment dashboard
- ⏳ M4 — Seller registration + item escrow flow
- ⏳ M5 — Payout + analytics + polish
- ⏳ M6 — Hardening + production deploy

## Environment

Required env vars are documented in `.env.example`. For local dev, copy to `.env`:

- `DATABASE_URL`, `REDIS_URL` — match Docker Compose defaults.
- `AUTH_SECRET` — generate with `openssl rand -base64 32`.
- `MIDTRANS_*` — fill from sandbox dashboard before working on M2.
- `S3_*` — match MinIO root user/password.

## Don'ts

- ❌ Don't import server-only code from Client Components. Use `import 'server-only'` to fail at build.
- ❌ Don't put `DATABASE_URL` in `prisma/schema.prisma` — Prisma 7 uses `prisma.config.ts`.
- ❌ Don't bypass Zod validation in Server Actions.
- ❌ Don't `revalidatePath('/')` for everything — use precise tags.
- ❌ Don't cache anything that depends on session/cookies/headers — wrap in `<Suspense>`.
- ❌ Don't push migrations directly to a non-empty production DB without a backup.
