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

### 1. Install dependencies

```bash
npm install
```

### 2. Configure the database

Create a `.env.local` file in the project root:

```
DATABASE_URL="postgresql://USER:PASSWORD@127.0.0.1:5432/toko_mini_moni?schema=public"
```

You'll need a reachable PostgreSQL instance (local install, Docker, or a hosted database) with a `toko_mini_moni` database created.

### 3. Apply the schema and seed data

```bash
npm run db:push    # or: npm run db:migrate
npm run db:seed
```

### 4. Run the dev server

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

## Notes

- `.env.local` is required at runtime; Next.js only reads it from the project root.
- The `/booking` page instantiates Prisma during static prerender, so a production build needs a reachable database at build time.
