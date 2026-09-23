# Toko Mini Moni — Technical Architecture Document (RFC)

## 1. System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Next.js Application                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │  App Router │  │ Components  │  │      API Routes         │ │
│  │  (Pages)    │  │  (React)    │  │  /api/*                 │ │
│  └──────┬──────┘  └──────┬──────┘  └───────────┬─────────────┘ │
│         │                │                      │               │
│         └────────────────┴──────────────────────┘               │
│                          │                                      │
│                    ┌─────▼─────┐                                 │
│                    │   Prisma  │                                 │
│                    │  Client   │                                 │
│                    └─────┬─────┘                                 │
│                          │                                      │
└──────────────────────────┼──────────────────────────────────────┘
                           │
                    ┌──────▼──────┐
                    │ PostgreSQL  │
                    │  (Supabase) │
                    └─────────────┘
```

### 1.1 Technology Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Framework | Next.js (App Router) | 16.3.5 |
| Language | TypeScript | 5.x |
| Database | PostgreSQL | 15+ |
| ORM | Prisma | 5.22.0 |
| Styling | Tailwind CSS + shadcn/ui | 4.x |
| Validation | Zod | 3.x |
| Auth | Custom (HTTP-only cookies) | - |
| Timezone | Manual WIB (UTC+7) | - |

---

## 2. Database Schema

### 2.1 Core Models

```prisma
// User-facing models
model Category {
  id        Int       @id @default(autoincrement())
  name      String
  slug      String    @unique
  imageUrl  String?
  sortOrder Int       @default(0)
  isVisible Boolean   @default(true)
  products  Product[]
}

model Product {
  id            Int           @id @default(autoincrement())
  name          String
  slug          String        @unique
  description   String        @db.Text
  basePrice     Int           // Rupiah, integer
  imageUrl      String?
  isAvailable   Boolean       @default(true)
  dailyStock    Int?          // null = unlimited
  leadTimeDays  Int           @default(0)
  isCustomCake  Boolean       @default(false)
  allergens     String[]      // ["nuts", "dairy", "gluten"]
  tags          String[]      // ["best-seller", "vegan"]
  categoryId    Int
  category      Category      @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  variants      ProductVariant[]
  addOns        AddOn[]
  orderItems    OrderItem[]
}

model ProductVariant {
  id        Int     @id @default(autoincrement())
  name      String  // "Small (6 inch)"
  priceDiff Int     // additional price (can be negative)
  isDefault Boolean @default(false)
  sortOrder Int     @default(0)
  productId Int
  product   Product @relation(fields: [productId], references: [id], onDelete: Cascade)
  orderItems OrderItem[]
}

model AddOn {
  id        Int      @id @default(autoincrement())
  name      String
  price     Int
  isRequired Boolean @default(false)
  sortOrder Int      @default(0)
  productId Int
  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
}

// Booking models
model BookingSlot {
  id        Int       @id @default(autoincrement())
  name      String
  startTime String    // "HH:mm" WIB
  endTime   String    // "HH:mm" WIB
  capacity  Int       @default(4)
  isActive  Boolean   @default(true)
  order     Int       @default(0)
  bookings  Booking[]
}

model Booking {
  id              Int       @id @default(autoincrement())
  code            String    @unique @default(dbgenerated("..."))
  date            DateTime  @db.Date // WIB date
  slotId          Int
  slot            BookingSlot @relation(fields: [slotId], references: [id])
  partySize       Int
  name            String
  phone           String
  email           String?
  status          String    @default("PENDING")
  cancelledAt     DateTime?
  cancelReason    String?
  rescheduledFromId Int?
  rescheduledAt   DateTime?
  createdAt       DateTime
  updatedAt       DateTime  @updatedAt
  noShowAt        DateTime?
}

// Order models
model Order {
  id              Int       @id @default(autoincrement())
  code            String    @unique @default(dbgenerated("..."))
  status          String    @default("PENDING")
  type            String    @default("PICKUP") // PICKUP, DELIVERY
  customerName    String
  customerPhone   String
  customerEmail   String?
  pickupDate      DateTime? @db.Date
  pickupWindow    String?
  deliveryAddress String?
  deliveryZone    String?
  deliveryFee     Int       @default(0)
  notes           String?   @db.Text
  // Custom cake fields
  isCustomCake    Boolean   @default(false)
  customText      String?
  customDesign    String?   @db.Text
  customPhotoUrl  String?
  // Payment
  paymentMethod   String    @default("CASH")
  isPaid          Boolean   @default(false)
  paymentProofUrl String?
  total           Int
  createdAt       DateTime
  updatedAt       DateTime  @updatedAt
  completedAt     DateTime?
  itemsOrder      OrderItem[]
}

model OrderItem {
  id            Int      @id @default(autoincrement())
  orderId       Int
  order         Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  productId     Int
  product       Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  variantId     Int?
  variant       ProductVariant? @relation(fields: [variantId], references: [id], onDelete: SetNull)
  qty           Int
  notes         String?  @db.Text
  selectedAddOns String[] // JSON array of add-on IDs
  addOnsPrice   Int      @default(0)
  price         Int      // snapshot at order time
}

// Settings
model Setting {
  id        Int      @id @default(autoincrement())
  key       String   @unique
  value     String
  updatedAt DateTime @updatedAt
}
```

### 2.2 Indexes
```prisma
@@index([date, slotId])  // Booking
@@index([phone])          // Booking, Order
@@index([code])           // Booking, Order
@@index([pickupDate])     // Order
@@index([status])         // Order
@@index([customerPhone])  // Order
```

---

## 3. API Design

### 3.1 REST Endpoints

| Method | Path | Description |
|--------|------|-------------|
| **Products** |
| GET | `/api/admin/products` | List products (with variants, add-ons, category) |
| POST | `/api/admin/products` | Create product |
| GET | `/api/admin/products/[id]` | Get product detail |
| PUT | `/api/admin/products/[id]` | Update product |
| DELETE | `/api/admin/products/[id]` | Delete product |
| **Categories** |
| GET | `/api/admin/categories` | List categories |
| POST | `/api/admin/categories` | Create category |
| PUT | `/api/admin/categories/[id]` | Update category |
| DELETE | `/api/admin/categories/[id]` | Delete category |
| **Booking Slots** |
| GET | `/api/admin/slots` | List slots |
| POST | `/api/admin/slots` | Create slot |
| PUT | `/api/admin/slots/[id]` | Update slot |
| DELETE | `/api/admin/slots/[id]` | Delete slot |
| **Settings** |
| GET | `/api/settings` | Get customer-facing settings |
| GET/PUT | `/api/admin/settings` | Admin settings CRUD |
| **Bookings** |
| GET | `/api/bookings/slots?date=YYYY-MM-DD` | Get available slots for date |
| POST | `/api/bookings` | Create booking |
| GET | `/api/bookings?code=X&phone=Y` | Get booking by code+phone |
| POST | `/api/bookings/cancel` | Cancel booking |
| POST | `/api/bookings/reschedule` | Reschedule booking |
| **Orders** |
| GET | `/api/orders?code=X&phone=Y` | Get order by code+phone |
| POST | `/api/orders` | Create order |
| POST | `/api/orders/[code]/payment` | Confirm payment |
| POST | `/api/orders/[code]/proof` | Upload payment proof |

### 3.2 Request/Response Patterns

**Success Response:**
```json
{ "data": { ... }, "status": 200 }
```

**Error Response:**
```json
{ "error": "Human readable message", "details": { ... }, "status": 400 }
```

**Booking Slot Availability:**
```json
{
  "slots": [
    { "id": 1, "name": "Pagi", "startTime": "09:00", "endTime": "11:00", "capacity": 4, "remaining": 2 }
  ]
}
```

---

## 4. Key Flows

### 4.1 Customer Order Flow

```
User → /menu (browse) 
    → ProductCard (select variant/add-ons/qty) 
    → OrderForm (cart summary)
    → Fill contact info + pickup/delivery
    → POST /api/orders
    → Response: { code, redirectUrl }
    → /order/success?code=X&phone=Y
    → WhatsApp deep link with order details
```

**Order Creation (`POST /api/orders`):**
1. Validate request body (Zod schema)
2. Calculate totals: items + add-ons + delivery fee
3. Verify daily stock for each item
4. Create Order + OrderItems in transaction
5. Decrement product dailyStock
6. Return order code + redirect URL

### 4.2 Table Booking Flow

```
User → /booking 
    → Step 1: Select date (calendar)
    → Step 2: Select slot + party size (fetches /api/bookings/slots?date=X)
    → Step 3: Enter name, phone, email
    → POST /api/bookings
    → Response: { booking: { code, ... }, redirectUrl }
    → /booking/success?code=X&phone=Y
    → WhatsApp deep link
```

**Booking Creation (`POST /api/bookings`):**
1. Normalize phone (08xxx → 08xxx, +628xxx → 08xxx)
2. Validate (Zod: date format, slotId, partySize 1-8, phone regex)
3. Check lead time (≥ bookingLeadHours)
4. Check slot capacity in transaction:
   - Sum partySize of existing non-cancelled bookings for date+slot
   - Verify remaining ≥ requested partySize
5. Generate 8-char booking code
6. Create Booking with status=PENDING
7. Return booking + redirect URL

### 4.3 Admin Order Management Flow

```
Admin → /admin/orders
    → GET /api/admin/orders (list with filters)
    → Click order → GET /api/admin/orders/[id]
    → Update status: PUT /api/admin/orders/[id] { status }
    → Confirm payment: POST /api/orders/[code]/payment
```

### 4.4 Real-time Availability Calculation

**Booking Slots (`GET /api/bookings/slots?date=X`):**
```typescript
// 1. Get all non-cancelled bookings for date
const bookings = await prisma.booking.findMany({
  where: { date: wibDate, status: { notIn: ["CANCELLED", "NO_SHOW"] } },
  select: { slotId: true, partySize: true }
});

// 2. Aggregate by slot
const counts = bookings.reduce((acc, b) => {
  acc[b.slotId] = (acc[b.slotId] || 0) + b.partySize;
  return acc;
}, {} as Record<number, number>);

// 3. Get active slots, compute remaining
const slots = await prisma.bookingSlot.findMany({ where: { isActive: true } });
return slots.map(s => ({
  ...s,
  remaining: Math.max(0, s.capacity - (counts[s.id] || 0))
}));
```

---

## 5. Timezone Handling (WIB)

### 5.1 Design Decision
All dates/times stored and displayed in **WIB (UTC+7)**. No IANA timezone database dependency.

### 5.2 Implementation (`src/lib/settings.ts`)

```typescript
// Convert Date → WIB
export function toWIB(date: Date): Date {
  return new Date(date.getTime() + 7 * 60 * 60 * 1000);
}

// Parse "YYYY-MM-DD" as WIB midnight
export function fromWIBString(isoDate: string): Date {
  return new Date(isoDate + "T00:00:00+07:00");
}

// Format Date → "YYYY-MM-DD" in WIB
export function formatDateYMD(d: Date): string {
  return d.toISOString().slice(0, 10); // Works because ISO string is UTC, but we treat as WIB
}
```

### 5.3 Usage Patterns
- **Booking date**: Stored as `DateTime @db.Date` representing WIB midnight
- **Slot times**: Stored as strings "HH:mm" (WIB)
- **Pickup date**: Stored as `DateTime @db.Date` (WIB)
- **CreatedAt/UpdatedAt**: Stored as UTC (Prisma default), displayed as WIB

---

## 6. Authentication & Authorization

### 6.1 Admin Auth
- **Login**: `POST /api/admin/login` → validates password against `adminPasswordHash` (bcrypt)
- **Session**: 32-char random token stored in HTTP-only cookie (`tmm_admin_session`)
- **Verification**: Middleware checks cookie on `/admin/*` and `/api/admin/*`
- **Expiry**: 24 hours (configurable)

### 6.2 Customer Auth
- **No login required** for ordering/booking
- **Lookup by code + phone** for status pages
- Phone normalized: `08xxx`, `+628xxx` → `08xxx`

---

## 7. Validation & Error Handling

### 7.1 Zod Schemas (API Layer)
```typescript
// Example: Create Booking
const createBookingSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  slotId: z.number().int().positive(),
  partySize: z.number().int().min(1).max(99), // real limit = slot capacity (BookingSlot.capacity)
  name: z.string().trim().min(1),
  phone: z.string().trim().regex(/^(\+?62|0)8[0-9]{6,11}$/),
  email: z.string().email().optional(),
});
```

### 7.2 Phone Normalization
```typescript
export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("62")) return "0" + digits.slice(2);
  return digits;
}
```

### 7.3 Error Codes
| Code | Meaning |
|------|---------|
| 400 | Validation error / Business rule violation |
| 401 | Unauthorized (admin) |
| 404 | Not found |
| 500 | Server error |

---

## 8. Frontend Architecture

### 8.1 Component Structure
```
src/
├── app/                    # App Router pages
│   ├── (dashboard)/        # Admin layout group
│   ├── menu/page.tsx       # Product catalog + order form
│   ├── booking/page.tsx    # Booking flow
│   └── order/status/page.tsx
├── components/
│   ├── admin/              # Admin panels (ProductsPanel, OrdersPanel, etc.)
│   ├── customer/
│   │   ├── booking/        # BookingFlow, RescheduleForm
│   │   └── order/          # ProductCard, OrderForm, OrderHistory, MiniCart
│   └── ui/                 # shadcn/ui components (Button, Input, Dialog, etc.)
├── lib/
│   ├── db.ts               # Prisma singleton with datasourceUrl
│   ├── bookings.ts         # Booking business logic
│   ├── orders.ts           # Order business logic
│   ├── settings.ts         # Settings getters + WIB helpers
│   ├── regex.ts            # Phone/email validation
│   └── money.ts            // Rupiah formatting
├── validations/            # Zod schemas
└── types/                  # TypeScript interfaces
```

### 8.2 State Management
- **Server state**: React Server Components + `fetch` in async pages
- **Client state**: 
  - `SessionProvider` (React Context) for cart + customer info
  - `useState`/`useTransition` for form flows (BookingFlow)
- **No external state library** (Redux, Zustand) — kept simple

### 8.3 Key Client Components

| Component | Purpose |
|-----------|---------|
| `SessionProvider` | Cart + customer info context |
| `ProductCard` | Product display + variant/add-on modal + add to cart |
| `OrderForm` | Cart summary + contact info + pickup/delivery + submit |
| `BookingFlow` | 3-step booking wizard (date → slot → contact) |
| `OrderHistory` | Phone-based order lookup + list |
| `OrdersPanel` | Admin order list + status updates |
| `ProductsPanel` | Admin product CRUD + variants/add-ons inline |
| `BookingsPanel` | Admin booking list + status updates |

---

## 9. Deployment & Infrastructure

### 9.1 Vercel Configuration
```typescript
// next.config.ts
{
  generateEtags: true,
  headers: [
    { source: "/images/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }] },
    { source: "/:path*", headers: [{ key: "Cache-Control", value: "no-cache, no-store, must-revalidate" }] }
  ]
}
```

### 9.2 Environment Variables
| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | Supabase `POSTGRES_PRISMA_URL` |
| `ADMIN_PASSWORD` | Yes | Plain password (bcrypt'd at runtime) |
| `ADMIN_SESSION_SECRET` | Yes | 32+ char random string |

### 9.3 Build Process
```bash
npm run build
# 1. npm run version:gen (git hash → version.json)
# 2. prisma generate (runtime datasourceUrl)
# 3. next build (TypeScript + static generation)
```

### 9.4 Prisma Runtime datasourceUrl
```typescript
// src/lib/db.ts
new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL, // Runtime override
})
```
This allows Vercel to provide `DATABASE_URL` at **function runtime** (not build time).

---

## 10. Testing

### 10.1 Unit Tests (Vitest)
- `src/lib/__tests__/bookings.test.ts` — booking logic, availability, conflicts
- `src/lib/__tests__/orders.test.ts` — order creation, totals, stock
- `src/lib/__tests__/money.test.ts` — formatting
- `src/lib/__tests__/regex.test.ts` — phone/email validation

### 10.2 E2E Tests (Playwright)
- Booking flow: date → slot → contact → success
- Order flow: add to cart → checkout → success
- Admin: login → CRUD products/orders/bookings
- Status lookup: code + phone

---

## 11. Security Considerations

| Threat | Mitigation |
|--------|------------|
| SQL Injection | Prisma parameterized queries |
| XSS | React auto-escape, no `dangerouslySetInnerHTML` |
| CSRF | SameSite=Lax cookies, admin middleware |
| Auth bypass | Middleware on all `/admin/*` routes |
| Rate abuse | Future: rate limiting on public APIs |
| Data exposure | Phone normalization, code+phone lookup only |

---

## 12. Performance Optimizations

| Area | Technique |
|------|-----------|
| Static pages | `export const dynamic = "force-dynamic"` only where needed |
| Images | `/public/images/` with long Cache-Control headers |
| Database | Prisma connection pooling (PgBouncer via Supabase pooler) |
| Bundling | Next.js Turbopack (dev), SWC (prod) |
| Fonts | Self-hosted Geist via `next/font` |

---

## 13. Known Limitations & Tech Debt

1. **No image upload** — imageUrl is manual text input
2. **No email notifications** — only WhatsApp deep links
3. **Manual timezone** — WIB hardcoded, no DST handling
4. **No rate limiting** — public APIs vulnerable to abuse
5. **Single admin user** — no role-based access
6. **No order editing** — only status changes
7. **Variant/add-on delete-recreate** — not incremental updates
8. **No automated tests in CI** — workflow exists but tests need DB

---

## 14. Migration Guide (Future)

If moving to multi-tenant or adding features:

| Change | Approach |
|--------|----------|
| Multi-shop | Add `shopId` to all models, middleware for shop resolution |
| Email auth | Add `User` model, NextAuth.js, email verification |
| Payments | Integrate Midtrans/Xendit webhook → `/api/payments/webhook` |
| Inventory | Add `StockMovement` model, real-time WebSocket updates |
| Analytics | Add `Event` model, export to BigQuery/ClickHouse |

---

## 15. Appendix: File Reference

### Core Business Logic
- `src/lib/bookings.ts` — Booking CRUD, availability, conflicts
- `src/lib/orders.ts` — Order CRUD, totals, stock, stats
- `src/lib/settings.ts` — Settings getters, WIB helpers, pickup windows
- `src/lib/regex.ts` — Phone/email validation
- `src/lib/money.ts` — Rupiah formatting (`formatRupiah`)

### Validations
- `src/validations/bookings.ts` — Create booking schema
- `src/validations/orders.ts` — Create order schema

### Admin API
- `src/app/api/admin/products/route.ts`
- `src/app/api/admin/categories/route.ts`
- `src/app/api/admin/slots/route.ts`
- `src/app/api/admin/settings/route.ts`

### Customer API
- `src/app/api/bookings/route.ts`
- `src/app/api/bookings/slots/route.ts`
- `src/app/api/orders/route.ts`