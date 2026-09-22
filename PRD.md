## Assumptions

- Single shop (one bakery) with a single admin user.
- No multi‑tenant support required for the MVP.
- All customers are Indonesian (phone numbers, language, currency).
- WhatsApp deep‑link is the sole external notification channel.
- Orders are processed manually; no automatic payment capture.

## Scalability / Load

- Target concurrent users: **200** active browsing/booking sessions.
- Expected peak booking volume: **30 bookings per minute**.
- API response time SLA: **≤ 500 ms** for all public endpoints.
- System monitoring: track request latency, error rates, and DB connection pool usage.

---
