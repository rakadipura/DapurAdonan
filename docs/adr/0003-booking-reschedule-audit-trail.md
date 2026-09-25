# Booking Reschedule as New Row with Audit Trail

Rescheduling a booking creates a new `Booking` row with a new code, linked to the original via `rescheduledFromId`. The original row's status becomes `RESCHEDULED` and is excluded from capacity counts. It retains the original date/slot for audit purposes.

Orders do not support reschedule — customers cancel and reorder.

This pattern was chosen over in-place updates because:
- It preserves an immutable audit trail
- Capacity checks naturally exclude `RESCHEDULED` rows
- No data loss if something goes wrong mid-reschedule