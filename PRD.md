# Toko Mini Moni — Product Requirements Document (PRD)

## 1. Product Overview

**Toko Mini Moni** is an online ordering and table booking system for a home bakery/cake shop in Indonesia. It enables customers to browse products, place pickup/delivery orders, and book tables — while providing admins with a complete management dashboard.

### 1.1 Target Users
- **Customers**: Walk-in and online customers wanting to order cakes, bread, snacks, drinks
- **Admins**: Shop owner/staff managing products, orders, bookings, settings

### 1.2 Key Value Propositions
- Unified platform for **product orders** + **table bookings**
- Real-time capacity management for table slots
- Per-day stock tracking for fresh items
- WhatsApp integration for order confirmations
- All scheduling in WIB (Western Indonesia Time)

---

## 2. Features

### 2.1 Customer-Facing Features

#### 2.1.1 Product Catalog (`/menu`)
- **Category browsing**: Filter by category (Ronde Kue, Kue Kering, Kue Lempeng, Roti, Minuman, Kue Custom)
- **Product cards**: Image, name, description, base price, variants, add-ons, allergens, tags, stock status
- **Variant selection**: Size variants with price differences (e.g., Small/Medium/Large cakes)
- **Add-ons**: Optional and required add-ons (custom message, extra frosting, toppings)
- **Custom cakes**: Configurable lead time (days), custom text/design notes, reference photo upload
- **Stock display**: "Habis" (sold out) or "X tersisa" per-day stock

#### 2.1.2 Ordering Flow (`/menu` → Order Form)
- **Cart management**: Add/remove items, adjust quantities, notes per item
- **Order types**: 
  - **Pickup**: Select date + time window (10:00-12:00, 12:00-14:00, 15:00-17:00, 17:00-18:30)
  - **Delivery**: Address, zone-based fee calculation (base + per km, free over threshold)
- **Payment methods**: Cash, Transfer, QRIS, E-Wallet
- **Customer info**: Name, phone (validated Indonesian format), optional email
- **Guest checkout**: No account required; lookup by order code + phone

#### 2.1.3 Table Booking (`/booking`)
- **Date selection**: Next 14 days (excluding Sundays)
- **Time slots**: Pagi (09:00-11:00), Siang (12:00-14:00), Sore (15:00-17:00) — configurable capacity
- **Party size**: 1-8 people per table (configurable max)
- **Lead time**: Minimum 1 hour advance booking (configurable)
- **Contact info**: Name, phone, optional email
- **Confirmation**: Booking code + WhatsApp deep link for confirmation

#### 2.1.4 Order/Booking Status Lookup
- **Order status** (`/order/status`): Lookup by code + phone → shows items, status, payment, pickup/delivery info
- **Booking status** (`/booking/status`): Lookup by code + phone → shows date, time, party size, status
- **Reschedule/Cancel**: Self-service booking changes via status page

#### 2.1.5 Order History (`/account/orders`)
- Phone-based lookup (no login)
- Lists all past orders with status, total, date
- Reorder capability

---

### 2.2 Admin Dashboard Features (`/admin`)

#### 2.2.1 Authentication
- Email/password login with HTTP-only session cookies
- Middleware protection for `/admin/*` and `/api/admin/*`
- Session expiry: 24 hours

#### 2.2.2 Dashboard (`/admin`)
- **Stats cards**: Today's orders, pending orders, unpaid orders, today's revenue, today's bookings, pending bookings, total bookings
- **Recent orders table**: Code, customer, status, total (last 5)
- **Today's bookings table**: Code, customer, time, party size, status (last 5)

#### 2.2.3 Orders Management (`/admin/orders`)
- **List**: Filter by status, search by code/customer, pagination
- **Actions**: 
  - View details (items, customer, payment, notes)
  - Update status: Pending → Confirmed → Baking → Ready → Completed / Cancelled
  - Confirm payment (Transfer/QRIS/E-Wallet)
  - View payment proof upload

#### 2.2.4 Bookings Management (`/admin/bookings`)
- **List**: Filter by status, date range, search by code/customer
- **Actions**: View details, update status (Pending/Confirmed/Cancelled/No-Show/Completed/Rescheduled)

#### 2.2.5 Products Management (`/admin/products`)
- **List**: Search, filter by category/availability
- **Create/Edit**: 
  - Basic: name, slug, description, base price, image URL
  - Inventory: daily stock (null = unlimited), availability toggle
  - Categorization: category, allergens (multi-select), tags (multi-select)
  - Custom cake: lead time (days)
  - **Variants**: Size options with price diffs, default selection
  - **Add-ons**: Optional/required extras with prices
- **Delete**: Cascade deletes variants/add-ons

#### 2.2.6 Categories Management (`/admin/categories`)
- **List**: Name, slug, sort order, visibility, product count
- **Create/Edit**: name, slug, image URL, sort order, visibility toggle
- **Delete**: Cascades to products

#### 2.2.7 Booking Slots Management (`/admin/slots`)
- **List**: Time range, capacity, active status, display order
- **Create/Edit**: name, start/end time (HH:mm), capacity, active toggle, order
- **Reorder**: Up/down buttons to change display order

#### 2.2.8 Settings Management (`/admin/settings`)
- **Shop settings**: maxPartySize, bookingLeadHours, whatsAppNumber
- **Pickup windows**: Array of time ranges
- **Delivery zones**: Zone config (base fee, per km, max km, free threshold)
- **Transfer info**: Bank details HTML
- **Admin password**: Bcrypt hash

---

## 3. Business Rules

### 3.1 Pricing
- All prices in **Indonesian Rupiah (IDR)**, stored as integers (no decimals)
- Product price = basePrice + variant priceDiff + add-on prices
- Delivery fee = baseFee + (distance × perKm), free if subtotal ≥ freeMin

### 3.2 Scheduling (WIB / UTC+7)
- All dates/times stored and displayed in WIB
- Booking date options: next 14 days, excluding Sundays
- Pickup windows: 4 fixed windows daily
- Booking lead time: configurable minimum hours (default 1h)
- Order cutoff: 16:00 WIB for next-day pickup

### 3.3 Stock Management
- Daily stock per product (nullable = unlimited)
- Decrements on order confirmation
- "Habis" shown when stock = 0

### 3.4 Capacity Management (Bookings)
- Each slot has capacity (default 4 tables)
- Real-time availability = capacity - sum of confirmed/pending party sizes
- Slot shows "Penuh" (full) or "Hanya X kursi" when limited

### 3.5 Order Status Flow
```
PENDING → CONFIRMED → BAKING → READY → COMPLETED
                ↓
            CANCELLED
```

### 3.6 Booking Status Flow
```
PENDING → CONFIRMED → COMPLETED
    ↓         ↓
CANCELLED  RESCHEDULED
    ↓
  NO_SHOW
```

---

## 4. Non-Functional Requirements

### 4.1 Performance
- Static generation for public pages where possible
- API responses < 500ms p95
- Image optimization via Next.js Image (when implemented)

### 4.2 Security
- Input validation via Zod on all API routes
- SQL injection prevention via Prisma ORM
- XSS prevention via React auto-escaping
- Auth via HTTP-only cookies, CSRF protection
- Rate limiting on public APIs (future)

### 4.3 Accessibility
- Semantic HTML
- Focus management in modals
- Color contrast (WCAG AA)
- Alt text on all images

### 4.4 Localization
- Indonesian language (Bahasa Indonesia)
- IDR currency formatting
- WIB timezone throughout

## Assumptions

- Single shop (one bakery) with a single admin user.
- No multi‑tenant support required for the MVP.
- All customers are Indonesian (phone numbers, language, currency).
- WhatsApp deep‑link is the only external notification channel.
- Orders are processed manually; no automatic payment capture.

## Scalability / Load

- Target concurrent users: **200** active browsing/booking sessions.
- Expected peak booking volume: **30 bookings per minute**.
- API response time SLA: **≤ 500 ms** for all public endpoints.
- System monitoring: track request latency, error rates, and DB connection pool usage.



## 6. Future Enhancements (Post-MVP)

1. **Image upload** for products/categories (cloud storage)
2. **Email notifications** for order/booking confirmations
3. **Customer dashboard** with favorites, address book, reorder
4. **Push/SMS notifications** for status updates
5. **Loyalty program** (points, rewards)
6. **Multi-location** support
7. **Analytics dashboard** (sales trends, popular items, peak hours)
8. **POS integration** for walk-in orders

---

## 7. Glossary

| Term | Definition |
|------|------------|
| WIB | Western Indonesia Time (UTC+7) |
| SKU | Product variant identifier |
| Add-on | Optional/required product extra |
| Lead time | Days needed for custom cakes |
| Pooler | Connection pooling (PgBouncer) for serverless |