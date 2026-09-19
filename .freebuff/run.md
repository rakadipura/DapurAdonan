# Run Toko Mini Moni (worktree local)

## 1. Reproduce uncommitted artifacts this worktree needs

This directory is a checkout of `rakadipura/DapurAdonan`. No symlinks — copy from the main checkout when you need the environment file:

- `.env.local` — contains `DATABASE_URL`. Copy from the main checkout (`/Users/rakadipura/Workspace/Projects/DapurAdonan/.env.local`) if missing. It holds the value, so treat it as secret-ish: do not paste it into run docs or chat.

After copying `.env.local`, install npm dependencies if `node_modules` is absent:

```bash
npm install
```

## 2. Database wiring (needed before the app can run)

The app expects a PostgreSQL server at `127.0.0.1:5432` reachable by the `DATABASE_URL` value in `.env.local`:

```
DATABASE_URL="postgresql://toko:toko@127.0.0.1:5432/toko_mini_moni?schema=public"
```

If there is no PostgreSQL running locally, choose one of:

- Start a local Postgres (Homebrew Postgres, Postgres.app, native `initdb`/`pg_ctl`, or Docker) listening on `127.0.0.1:5432`.
- Or change `.env.local` to point at a reachable Postgres instance and create the `toko_mini_moni` database.

Once Postgres is reachable, apply the schema and (optionally) seed it:

```bash
npx prisma db push --accept-data-loss
npx tsx prisma/seed.ts
```

Note: `prisma db push` and `prisma migrate` both read `DATABASE_URL` from `.env.local`. If the file is missing, those commands fail with "Environment variable not found: DATABASE_URL".

## 3. Run the server (dev)

From this directory:

```bash
npm run dev
```

Default: `http://localhost:3000`.

To use a different port (e.g. if 3000 is taken):

```bash
PORT=3001 npm run dev
```

## 4. Notes

- `.env.local` is required at runtime. Next.js only reads it from the project root.
- The build currently tries to instantiate Prisma during static prerender on `/booking`. If there is no database at build time, that page fails in production build. For a live dev server this is fine because the page is rendered on demand.
- `npm run start` runs the production build and also needs a reachable `DATABASE_URL` at runtime.
