# Toko Mini Moni

Online ordering and table booking app for a home bakery/cake shop, built with Next.js, Prisma, and PostgreSQL.

## Features

- **Product catalog** — categories, size variants, add-ons, allergen/tag labels, per-day stock limits
- **Custom cake orders** — configurable lead time, custom text/design notes
- **Ordering** — pickup or delivery, multiple payment methods, guest order lookup by code + phone
- **Table booking** — time-slot capacity management, cancel/reschedule, WhatsApp confirmation links
- **Admin dashboard** — `/admin` behind a single shared password (`ADMIN_PASSWORD`) with an HMAC-signed session cookie; every `/api/admin/*` route and the dashboard layout enforce it
- Prices in Rupiah, all scheduling in WIB (Western Indonesia Time)

## Tech stack

- [Next.js](https://nextjs.org) (App Router)
- [Prisma](https://www.prisma.io) + PostgreSQL
- Tailwind CSS, shadcn/ui components
- Zod for input validation

## Getting started

1. Install dependencies:

```bash
npm install
```

2. Configure your environment (see [`.env.example`](.env.example)):

```bash
cp .env.example .env.local
# set DATABASE_URL, ADMIN_PASSWORD, ADMIN_SESSION_SECRET
```

3. Set up a test database and run migrations:

```bash
npm run db:ci:setup
```

4. Run type‑check:

```bash
npm run type-check
```

5. Run unit tests:

```bash
npm run test
```

6. Run end‑to‑end tests (needs Playwright browsers and a seeded database):

```bash
npx playwright install
npm run test:e2e
```

7. Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Available scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Run the production build (requires `DATABASE_URL`) |
| `npm run lint` | Lint the codebase |
| `npm run db:migrate` | Run Prisma migrations (dev) |
| `npm run db:push` | Push the Prisma schema without migrations |
| `npm run db:reset` | Reset the database |
| `npm run db:seed` | Seed the database with sample data |
| `npm run db:studio` | Open Prisma Studio |

## CI / CD

[![CI](https://github.com/rakadipura/DapurAdonan/actions/workflows/ci.yml/badge.svg)](https://github.com/rakadipura/DapurAdonan/actions/workflows/ci.yml)

The project uses a GitHub Actions workflow (`.github/workflows/ci.yml`) with three jobs:

- **Lint & Typecheck** — `npm run lint` and `npm run type-check`
- **Unit Tests** — `npm run test` (Vitest)
- **Build** — `npm run build` (runs after the two jobs above)

Not currently in CI (run it locally): Playwright end‑to‑end tests (`npm run test:e2e`) — the
workflow contains a commented‑out `e2e-tests` job with the steps needed to enable it.
There is no automated deploy step yet.

**Running CI locally**

```bash
# Install dependencies
npm ci

# Lint
npm run lint

# Type‑check
npm run type-check

# Unit tests
npm run test

# End‑to‑end tests (requires Playwright browsers and a database)
npx playwright install
npm run test:e2e
```

---
