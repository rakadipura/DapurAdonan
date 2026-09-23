# TODO

## Completed
- [x] Remove duplicate `getMaxPartySize` in `src/lib/bookings.ts` and import from `src/lib/settings.ts`.
- [x] Fix WhatsApp link date handling in `generateWhatsAppLink` (use `fromWIBString`).
- [x] Clean up `getPickupDateOptions` – drop unused async calls.
- [x] Refactor `latestAllowedBookingDate` to use configurable settings (`orderCutoffHour`, `bookingLeadHours`).
- [x] Update `getAvailableSlots` to exclude `RESCHEDULED` status and extract `ensureSlotCapacity` helper used by `createBooking` & `rescheduleBooking`.
- [x] Fix failing unit test for invalid email format (bookings validation) — 21/21 passing.
- [x] Implement payment proof upload (validated upload endpoint + serving route, `paymentProofUrl` stored on the order).
- [x] Add `type-check` script (`tsc --noEmit`) and run it in CI.
- [x] Create GitHub Actions CI workflow (`.github/workflows/ci.yml`).
- [x] Update PRD with assumptions & scalability sections.
- [x] Document CI flow in `README.md` (badge, pipeline description, local setup).
- [x] Enforce admin auth: every `/api/admin/*` route and the admin layout verify the session cookie.
- [x] Fix reschedule: supersede the old row instead of mutating it (self-referencing `rescheduledFromId`, capacity hole).
- [x] Close capacity/stock races with row locks inside transactions.
- [x] Repo hygiene: untrack `playwright-report/`, `dev.log`, `*.patch`; ignore `uploads/`, keep `.env.example`.
- [x] Booking flow seat model: dropped the "Maksimal N orang per meja" note/setting — the cap is now each slot's **kursi tersedia** (slot `capacity`, default 8, maintained at `/admin/slots`), and "Jumlah orang" subtracts live from every slot's seat count.
- [x] Fix booking/pickup **date off-by-one**: `@db.Date` columns were stored as the UTC day of a WIB-midnight instant (one day early). Added `parseYMD`/`wibToday`/`wibTomorrow` helpers and used them for every calendar-date read/write.

## Remaining
- [ ] **Migrate legacy booking/pickup dates**: rows written before the off-by-one fix are stored one day early (`date = date + 1` for affected rows — decide per row, seed rows may already be correct).
- [ ] Make date display fully TZ-independent (`formatDateLong` uses local time; correct on UTC/WIB servers, wrong west of UTC).
- [ ] Run the E2E test suite against a seeded database and fix any failures, then enable the commented-out `e2e-tests` job in CI.
- [ ] Rate-limit `/api/admin/login` (currently no brute-force protection beyond a timing-safe compare).
- [ ] Replace local `uploads/` storage with S3/Cloudinary if the app ever runs serverless.
- [ ] Clear the remaining ESLint warnings (unused imports, `<img>` → `next/image`).
- [ ] Optional enhancements (image upload for products, email notifications via `src/lib/email.ts`, customer dashboard).
