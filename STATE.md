# DapurAdonan / Toko Mini Moni — Project State

**Last updated:** 2025-01-24  
**Branch:** main  
**Commit:** 8e83c77 (refactor: kontak page keeps only WhatsApp card)

---

## What's Built

### Core Features (Complete)
- **Product catalog** — categories, variants, add-ons, allergens, tags, daily production capacity, lead time
- **Custom cake orders** — text, design notes, photo, enforces lead time
- **Ordering** — pickup/delivery, multiple payment methods, guest lookup by code+phone
- **Table booking** — time-slot capacity, cancel/reschedule (audit trail), WhatsApp confirmation
- **Admin dashboard** — `/admin` behind HMAC session cookie (single shared password)
  - Orders: list, stats, status updates, payment confirmation
  - Bookings: list, stats, status updates
  - Products/Categories/Slots/Settings: full CRUD
- **Payment proof upload** — validated endpoint + serving route
- **Order history** — `/account/orders` via phone lookup
- **WhatsApp deep links** — pre-filled messages for orders/bookings

### Infrastructure
- **Next.js 16** (App Router) + TypeScript + Prisma + PostgreSQL
- **Tailwind CSS** + shadcn/ui components
- **Vitest** (21 unit tests passing) + **Playwright** (scenarios written)
- **GitHub Actions CI** — lint, typecheck, unit tests, build
- **Test DB** — separate setup/cleanup scripts

---

## Skills Framework (Newly Installed)

Installed **Matt Pocock's skills** (38 skills) via `npx skills@latest add mattpocock/skills`

### Configured (via `/setup-matt-pocock-skills`)
- **Issue tracker:** GitHub Issues (`gh` CLI)
- **Triage labels:** `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`
- **Domain docs:** Single-context — `CONTEXT.md` + `docs/adr/`

### Files Created
```
.agents/skills/                    # 38 skills (engineering + productivity)
docs/agents/
  ├── issue-tracker.md            # GitHub conventions
  ├── domain.md                   # Single-context layout rules
  └── triage-labels.md            # Label mappings
CONTEXT.md                        # Domain glossary (79 lines)
docs/adr/
  ├── 0001-wib-calendar-date-storage.md
  ├── 0002-pessimistic-locking-stock-capacity.md
  ├── 0003-booking-reschedule-audit-trail.md
  ├── 0004-separate-ispaid-boolean.md
  └── 0005-custom-cake-delivery-fee-override.md
```

### Available Skills (Engineering)
- `/grill-with-docs` — alignment interview + domain docs
- `/tdd` — red-green-refactor loop
- `/diagnosing-bugs` — structured debugging
- `/to-spec` + `/to-tickets` + `/implement` — spec → tickets → implementation
- `/code-review` — two-axis review (standards + spec)
- `/improve-codebase-architecture` — scan for deepening opportunities
- `/prototype`, `/research`, `/domain-modeling`, `/codebase-design`, `/resolving-merge-conflicts`, `/wizard`

### Available Skills (Productivity)
- `/grill-me`, `/handoff`, `/teach`, `/to-questionnaire`, `/wait-what`, `/writing-for-agents`

---

## Architecture Review (Just Completed)

Ran `/improve-codebase-architecture` → generated HTML report at `/tmp/architecture-review-*/architecture-review.html`

### 6 Candidates Identified

| # | Candidate | Strength | Category |
|---|-----------|----------|----------|
| 1 | **Collapse Order Intake Pipeline** | **Strong** | ports & adapters |
| 2 | **Collapse Booking Intake Pipeline** | **Strong** | ports & adapters |
| 3 | **Deepen Admin Order/Booking Panels** | Worth exploring | local-substitutable |
| 4 | **Consolidate Settings Access** | Worth exploring | local-substitutable |
| 5 | **Extract WIB Date Helpers → Time Module** | Worth exploring | local-substitutable |
| 6 | **Unify Phone/Email Validation → Contact Module** | Speculative | local-substitutable |

### Top Recommendation: **Order Intake Pipeline**
- Largest flow (675 lines in `orders.ts`)
- Touches most domain concepts
- 5 modules → 1 interface (`OrderIntake.accept(input) → Order`)
- Highest leverage for testability and bug localization

---

## Remaining Work (from TODO.md)

### High Priority
- [ ] **Migrate legacy booking/pickup dates** — rows before off-by-one fix are stored one day early
- [ ] **Make date display fully TZ-independent** — `formatDateLong` uses local time
- [ ] **Run E2E tests** against seeded DB, fix failures, enable `e2e-tests` job in CI

### Medium Priority
- [ ] Rate-limit `/api/admin/login`
- [ ] Replace local `uploads/` with S3/Cloudinary (for serverless)
- [ ] Clear remaining ESLint warnings (unused imports, `<img>` → `next/image`)

### Optional Enhancements
- [ ] Image upload for products
- [ ] Email notifications (stub exists in `src/lib/email.ts`)
- [ ] Customer dashboard (favorites, reorder, address book)

---

## Next Recommended Steps

### 1. Deepen Order Intake (Highest Leverage)
```
/grilling "Collapse Order Intake Pipeline"
```
Walk the decision tree: interface shape, what sits behind the seam, test strategy, migration plan.

### 2. Run E2E Tests
```bash
npm run dev          # terminal 1
npm run test:e2e     # terminal 2
```
Fix failures, then uncomment `e2e-tests` job in `.github/workflows/ci.yml`

### 3. Migrate Legacy Dates
Write a one-time migration script for booking/order rows stored with off-by-one error.

### 4. Extract Time Module (Candidate 5)
Low-risk, high-value: separates WIB date logic from settings, makes ADR-0001 explicit, improves testability.

---

## Key Files to Know

| Area | Files |
|------|-------|
| Domain model | `prisma/schema.prisma` |
| Order logic | `src/lib/orders.ts` (675 lines) |
| Booking logic | `src/lib/bookings.ts` (490 lines) |
| Settings/Time | `src/lib/settings.ts` (226 lines) |
| Validation | `src/validations/orders.ts`, `bookings.ts` |
| Admin API | `src/app/api/admin/orders/`, `bookings/` |
| Public API | `src/app/api/orders/`, `bookings/` |
| Admin UI | `src/components/admin/*Panel.tsx` |
| Customer UI | `src/app/(site)/*` |
| Tests | `tests/unit/bookings.test.ts` |
| CI | `.github/workflows/ci.yml` |

---

## How to Resume

1. **Start dev server:** `npm run dev`
2. **Run tests:** `npm run test` (unit), `npm run test:e2e` (E2E)
3. **Type-check:** `npm run type-check`
4. **Lint:** `npm run lint`
5. **Use skills:** In agent session, run `/grill-with-docs "your feature"` or `/improve-codebase-architecture`

---

## Decision Log (ADRs)

| ADR | Decision | Status |
|-----|----------|--------|
| 0001 | WIB calendar dates = UTC midnight | Accepted |
| 0002 | Pessimistic locking (`FOR UPDATE`) for stock/capacity | Accepted |
| 0003 | Booking reschedule = new row + audit trail | Accepted |
| 0004 | Separate `isPaid` boolean (not status enum) | Accepted |
| 0005 | Custom cake delivery fee override (car vs motorcycle) | Accepted |

---

*This document is the single source of truth for project state. Update it when significant changes occur.*