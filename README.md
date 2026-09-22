# Toko Mini Moni

Online ordering and table booking app for a home bakery/cake shop, built with Next.js, Prisma, and PostgreSQL.

## Features

- **Product catalog** — categories, size variants, add-ons, allergen/tag labels, per-day stock limits
- **Custom cake orders** — configurable lead time, custom text/design notes
- **Ordering** — pickup or delivery, multiple payment methods, guest order lookup by code + phone
- **Table booking** — time-slot capacity management, cancel/reschedule, WhatsApp confirmation links
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

2. Set up a test database and run migrations:

```bash
npm run db:ci:setup
```

3. Run type‑check:

```bash
npm run type-check
```

4. Run unit tests:

```bash
npm run test
```

5. Run end‑to‑end tests:

```bash
npm run test:e2e
```

6. Start the development server:

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

[![CI](https://github.com/your-repo/toko-mini-moni-app/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/your-repo/toko-mini-moni-app/actions/workflows/ci-cd.yml)

The project uses a GitHub Actions pipeline that:

- Lints the code (`npm run lint`)
- Runs a TypeScript type‑check (`npm run type-check`)
- Executes unit tests (`npm run test`) against a test‑database
- Executes Playwright end‑to‑end tests (`npm run test:e2e`)
- Performs a security audit (`npm audit --audit-level=high`)
- Builds the production bundle (`npm run build`)
- Deploys automatically to Vercel on pushes to `main`

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

# End‑to‑end tests (requires Playwright browsers)
npm run test:e2e

# Security audit
npm audit --audit-level=high
```

Add the badge above to your README to surface CI status.

---
