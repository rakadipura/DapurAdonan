# TODO

## Top priorities (already completed)
- [x] Remove duplicate `getMaxPartySize` in `src/lib/bookings.ts` and import from `src/lib/settings.ts`.
- [x] Fix WhatsApp link date handling in `generateWhatsAppLink` (use `fromWIBString`).
- [x] Clean up `getPickupDateOptions` – drop unused async calls.
- [x] Refactor `latestAllowedBookingDate` to use configurable settings (`orderCutoffHour`, `bookingLeadHours`).
- [x] Update `getAvailableSlots` to exclude `RESCHEDULED` status and extract `ensureSlotCapacity` helper used by `createBooking` & `rescheduleBooking`.

## Remaining items
- [ ] Fix failing unit test for invalid email format (bookings validation)
- [ ] Implement payment proof upload feature (file upload, storage, DB field `paymentProofUrl`)
- [ ] Run E2E test suite and fix any failures
- [ ] Add optional enhancements (image upload for products, email notifications, customer dashboard)
- [ ] Add "type-check" script (`tsc --noEmit`) to `package.json` and ensure CI runs it.
- [ ] Create GitHub Actions CI/CD workflow (`.github/workflows/ci-cd.yml`).
- [ ] Insert npm‑audit security step in CI.
- [ ] Update PRD with assumptions & scalability sections.
- [ ] Document CI flow in `README.md` (badge, pipeline description, local setup).
