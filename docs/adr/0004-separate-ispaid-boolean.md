# Separate isPaid Boolean for Payment Confirmation

Orders have both a `status` enum (`PENDING` → `CONFIRMED` → `BAKING` → `READY` → `COMPLETED`/`CANCELLED`) and a separate `isPaid` boolean. Payment confirmation is an admin action, not automatic.

Alternatives considered:
- Add `PAID` status: rejected — conflates fulfillment progress with payment
- `paymentStatus` enum (`UNPAID`, `PAID`, `REFUNDED`): rejected — over-engineered for current manual confirmation flow

The boolean is simple, explicit, and matches the operational reality: admin sees order, verifies payment proof, clicks "Confirm Payment".