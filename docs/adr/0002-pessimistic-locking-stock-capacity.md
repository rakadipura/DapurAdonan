# Pessimistic Locking for Daily Stock and Slot Capacity

Concurrent order/booking creation uses `SELECT ... FOR UPDATE` on `Product` and `BookingSlot` rows inside transactions to prevent overselling daily production capacity and slot seats.

Alternatives considered:
- Optimistic locking with version columns: rejected — requires retry logic and doesn't prevent the race cleanly for "check-then-insert" patterns
- Application-level mutex: rejected — doesn't work across multiple app instances

The lock is acquired in ascending ID order to avoid deadlocks. Stock/slot validation runs inside the transaction under the lock.