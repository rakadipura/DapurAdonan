# Prisma setup

This project uses the modern Prisma **contract + migration** workflow (Prisma 8/9-era CLI, `prisma db` / `prisma migration` / `prisma orm`).

## Quick commands

```bash
# Generate (regenerate) the client after schema changes
npx prisma generate

# Run a migration (create table + apply)
npx prisma migration --create <name>      # plan
npx prisma migration --apply              # apply

# Or one-shot "db push" for dev (no migration history)
# (preferred only for prototyping; migrations are used here)
npx prisma db push
```

The generated client lives under `node_modules/.prisma/client`. The app imports
`PrismaClient` from `@prisma/client` via the helper in `src/lib/db.ts`.

## Database

Set `DATABASE_URL` in `.env.local` (the app reads it).

For local development you can use a Docker Postgres, a local Postgres install,
or a hosted Postgres (e.g. Neon/Supabase).

Example `.env.local`:

```
DATABASE_URL="postgresql://user:password@127.0.0.1:5432/toko_mini_moni?schema=public"
```

## Notes
- Prices are stored as **integer rupiah**, never floats.
- Dates (booking date, pickup date) are stored as `DATE`; the app works in **WIB**
  (Asia/Jakarta) and converts on input/output.
- `Booking.code` / `Order.code` use `cuid`; order codes are prefixed so they read
  like `MM-xxxxxxx`.
