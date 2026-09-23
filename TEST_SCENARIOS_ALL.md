# Complete Test Scenarios - All Flows

---

## 1. BOOKING FLOW (`/booking`)

### 1.1 Happy Path - Complete Booking Flow
| Step | Action | Expected |
|------|--------|----------|
| 1 | Visit `/booking` | Page loads, shows date options |
| 2 | Select tomorrow's date | Shows real-time available slots |
| 3 | Select available slot | Slot highlighted, advances to step 3 |
| 4 | Set party size | Size updates, max limited by setting |
| 5 | Fill contact: name, phone, email | All fields accept input |
| 6 | Click "Konfirmasi Booking" | Redirects to `/booking/success?code=XXX&phone=XXX` |
| 7 | Success page | Shows booking code, details, WhatsApp link |

### 1.2 Date Selection Tests
| Scenario | Steps | Expected |
|----------|-------|----------|
| Select valid future date | Click date ≥ leadHours | Slot selection loads |
| Select today (if past leadHours) | Click today | Available if time permits |
| Select past date | Not in dateOptions | Past dates hidden |
| Sunday | Not in dateOptions | Sundays excluded |
| Date within leadHours | Click date < leadHours | Disabled, shows "Minimal X jam sebelum" |
| No dates available | All past/within leadHours | "Belum ada tanggal tersedia" |

### 1.3 Slot Selection Tests (Real-time Capacity)
| Scenario | Steps | Expected |
|----------|-------|----------|
| Available slot | Click slot with remaining ≥ partySize | Selected, advances to step 3 |
| Full slot (0 remaining) | Click slot | Disabled, shows "Penuh" |
| Insufficient capacity | remaining < partySize | Disabled, shows "Hanya X kursi" |
| Loading state | Click date | Shows spinner "Memuat ketersediaan..." |
| Real-time update | Book slot in another tab | Remaining updates on date re-select |

### 1.4 Party Size Tests
| Scenario | Steps | Expected |
|----------|-------|----------|
| Min size | Click - until 1 | Stops at 1 |
| Max size | Click + until max | Stops at the date's max "kursi tersedia" (slot capacity, default 8) |
| Exceed max | Try > kursi tersedia | + button disabled |
| Seats display | Change jumlah orang | Slot "kursi tersedia" drops by the same amount |

### 1.5 Contact Form Validation
| Field | Invalid Input | Expected |
|-------|---------------|----------|
| Name | Empty | "Nama wajib diisi" |
| Phone | "123" | "Nomor telepon tidak valid" |
| Phone | "08123" | "Format nomor telepon tidak valid" |
| Phone | "0812-3456-7890" | Accepted (normalized) |
| Phone | "+62 812 3456 7890" | Accepted (normalized) |
| Phone | "6281234567890" | Accepted (normalized) |
| Email | "invalid" | "Format email tidak valid" |
| Email | Empty | Accepted (optional) |

### 1.6 Phone Normalization
| Input | Normalized | Stored in DB |
|-------|------------|--------------|
| "081234567890" | "081234567890" | "081234567890" |
| "0812-3456-7890" | "081234567890" | "081234567890" |
| "+62 812 3456 7890" | "081234567890" | "081234567890" |
| "6281234567890" | "081234567890" | "081234567890" |

### 1.7 Lead Time Validation
| Scenario | Expected |
|----------|----------|
| Book within leadHours | Disabled, "Minimal X jam sebelum" |
| Book exactly at leadHours | Allowed |
| Book tomorrow | Allowed |
| Past date | Not shown |

### 1.8 API Validation (POST /api/bookings)
| Input | Expected |
|-------|----------|
| Valid payload | 201, { booking, redirectUrl } |
| Past date | 400, "Tanggal booking harus hari ini atau setelahnya" |
| Date within leadHours | 400, "Booking minimal X jam sebelum jadwal" |
| Invalid slotId | 400, "Jadwal tidak tersedia" |
| Party size > remaining | 400, "Hanya tersisa X kursi" |
| Party size > slot capacity | 400, "Jumlah orang melebihi kapasitas jadwal (X)" |
| Invalid phone format | 400, "Nomor telepon tidak valid" |
| Missing fields | 400, Zod validation errors |

### 1.9 Navigation Tests
| Scenario | Expected |
|----------|----------|
| Back from step 3 | Returns to step 2 |
| Back from step 2 | Returns to step 1 |
| Refresh on step 2 | Returns to step 1 |
| Refresh on step 3 | Returns to step 1 |
| Double submit | Second request ignored |
| Network error | Error shown, stays on step 3 |

### 1.10 Admin Verification
| Action | Expected |
|--------|----------|
| Dashboard | Shows today's bookings count |
| Bookings page | Lists all with status filter |
| Change to CONFIRMED | Updated, visible to customer |
| Change to CANCELLED | Slot freed, status updated |

---

## 2. ORDER FLOW (`/menu`)

### 2.1 Happy Path - Pickup Order
| Step | Action | Expected |
|------|--------|----------|
| 1 | Visit `/menu` | Products load with categories |
| 2 | Add products to cart | Mini cart updates |
| 3 | Open cart | Shows items, quantities, total |
| 4 | Select "Pickup" | Shows pickup date/time picker |
| 5 | Select pickup date | Valid dates (no past, no Sunday) |
| 6 | Select pickup window | From available windows |
| 7 | Fill contact info | Name, phone, email |
| 8 | Submit | Redirect to `/order/success` |
| 9 | Success page | Shows order code, WhatsApp link |

### 2.2 Happy Path - Delivery Order
| Step | Action | Expected |
|------|--------|----------|
| 1-3 | Same as pickup | |
| 4 | Select "Delivery" | Shows address input |
| 5 | Enter address | Auto-detects zone or manual |
| 6 | Select delivery zone | Fee calculated |
| 7 | Fill contact | Name, phone, email |
| 8 | Submit | Redirect to `/order/success` |

### 2.3 Product Variants & Add-ons
| Scenario | Expected |
|----------|----------|
| Product with variants | Radio select shows price diff |
| Default variant pre-selected | Yes |
| Product with required add-on | Must select before add to cart |
| Product with optional add-ons | Can add/remove |
| Custom cake (isCustomCake) | Shows lead time, custom text field |

### 2.4 Cart & Checkout Validation
| Field | Invalid | Expected |
|-------|---------|----------|
| Pickup date | Past | Not selectable |
| Pickup date | Sunday | Not selectable |
| Pickup window | None selected | "Pilih jadwal pengambilan" |
| Delivery address | Empty | "Alamat wajib diisi" |
| Delivery zone | None | "Pilih zona pengiriman" |
| Name | Empty | "Nama wajib diisi" |
| Phone | Invalid | "Nomor telepon tidak valid" |

### 2.5 Custom Cake Order
| Scenario | Expected |
|----------|----------|
| Select custom cake | Shows lead time notice |
| Enter custom text | Saved to order |
| Upload reference photo | URL stored in customPhotoUrl |
| Lead time enforced | Cannot pick date < leadTimeDays |

---

## 3. ORDER STATUS (`/order/status`)

| Scenario | Steps | Expected |
|----------|-------|----------|
| Valid order code + phone | Enter code & phone | Shows order details |
| Valid booking code + phone | Enter code & phone | Shows booking details |
| Invalid code | Enter wrong code | "Kode atau nomor telepon tidak cocok" |
| Invalid phone | Enter wrong phone | "Kode atau nomor telepon tidak cocok" |
| Empty inputs | Submit empty | Shows placeholder message |

---

## 4. ADMIN FLOWS

### 4.1 Products (`/admin/products`)
| Action | Expected |
|--------|----------|
| List products | Table with search, category filter, availability filter |
| Add product | Modal with all fields, variants, add-ons |
| Edit product | Pre-filled modal, saves changes |
| Delete product | Confirmation, removes from list |
| Variants | Add/remove, price diff, default, sort order |
| Add-ons | Add/remove, price, required, sort order |
| Allergens/Tags | Multi-select checkboxes |

### 4.2 Categories (`/admin/categories`)
| Action | Expected |
|--------|----------|
| List categories | Table with product count, visibility toggle |
| Add category | Name, slug, image, sort order, visible |
| Edit category | Updates correctly |
| Delete category | Confirmation, cascade deletes products |

### 4.3 Slots (`/admin/slots`)
| Action | Expected |
|--------|----------|
| List slots | Table with up/down reorder |
| Add slot | Name, time, capacity, active, order |
| Edit slot | Pre-filled, saves |
| Toggle active | Instant update |
| Reorder | Up/down buttons swap order |
| Delete slot | Confirmation, removes |
| Kapasitas kursi | number | ≥ 1 — max "kursi tersedia" per slot (default 8) |

### 4.4 Settings (`/admin/settings`)
| Setting | Type | Validation |
|---------|------|------------|
| bookingLeadHours | number | ≥ 0 |
| orderCutoffHour | number | 0-23 |
| waNumber | string | 628... format |
| transferBank | string | free text |
| pickupWindows | JSON | Valid array |
| deliveryZones | JSON | Valid array |

### 4.5 Orders (`/admin/orders`)
| Action | Expected |
|--------|----------|
| Filter by status | Works |
| Filter by date scope | Today / All |
| Update status | Instant update |
| Confirm payment | isPaid → true |

### 4.6 Bookings (`/admin/bookings`)
| Action | Expected |
|--------|----------|
| Filter by status | Works |
| Filter by date scope | Today / All |
| Update status | Instant update |

---

## 5. UNIT TESTS (Vitest)

### 5.1 Validation Tests (`tests/unit/bookings.test.ts`)
- ✅ createBookingSchema valid/invalid
- ✅ isValidPhone various formats
- ✅ normalizePhone various formats
- ✅ formatDateYMD
- ✅ Business logic (capacity, lead time)

### 5.2 Order Validation Tests (need to add)
- createOrderSchema
- Product variant selection
- Add-on required validation
- Delivery zone matching

---

## 6. E2E TESTS (Playwright)

### 6.1 Booking E2E (`tests/e2e/booking.spec.ts`)
- ✅ Full booking flow
- ✅ Date selection
- ✅ Slot selection
- ✅ Party size controls
- ✅ Phone validation
- ✅ Form submission
- ✅ API endpoints

### 6.2 Order E2E (need to add)
- Product selection
- Cart management
- Pickup checkout
- Delivery checkout
- Custom cake order

### 6.3 Admin E2E (need to add)
- Product CRUD
- Category CRUD
- Slot CRUD
- Settings update

---

## 7. TEST DATA REQUIREMENTS

### Minimal Seed for Testing
```typescript
// BookingSlots (required for booking)
await prisma.bookingSlot.createMany({
  data: [
    { name: 'Pagi', startTime: '09:00', endTime: '11:00', capacity: 4, order: 1 },
    { name: 'Siang', startTime: '12:00', endTime: '14:00', capacity: 4, order: 2 },
    { name: 'Sore', startTime: '17:00', endTime: '19:00', capacity: 4, order: 3 },
  ],
});

// Settings (required for all flows)
await prisma.setting.createMany({
  data: [
    { key: 'bookingLeadHours', value: '1' },
    { key: 'orderCutoffHour', value: '16' },
    { key: 'whatsAppNumber', value: '6281234567890' },
    { key: 'pickupWindows', value: '[{"start":"09:00","end":"12:00"},{"start":"13:00","end":"17:00"}]' },
    { key: 'deliveryZones', value: '[{"zone":"Pusat","baseFee":10000,"perKm":2000,"maxKm":10,"freeMin":100000}]' },
    { key: 'transferBank', value: 'BCA 1234567890 a.n. Toko Mini Moni' },
  ],
});

// Categories & Products (for order flow)
const cat = await prisma.category.create({ data: { name: 'Kue Kering', slug: 'kue-kering', sortOrder: 1 } });
await prisma.product.createMany({
  data: [
    { name: 'Nastar', slug: 'nastar', basePrice: 50000, categoryId: cat.id, dailyStock: 100 },
    { name: 'Kastengel', slug: 'kastengel', basePrice: 60000, categoryId: cat.id, dailyStock: 50 },
  ],
});
```

---

## 8. IMAGES NEEDED

### Product Images (place in `/public/images/products/`)
| Product | Filename | Size |
|---------|----------|------|
| Nastar | nastar.jpg | 400x400 |
| Kastengel | kastengel.jpg | 400x400 |
| Putri Salju | putri-salju.jpg | 400x400 |
| Lidah Kucing | lidah-kucing.jpg | 400x400 |
| Roti Tawar | roti-tawar.jpg | 400x400 |
| Custom Cake | custom-cake.jpg | 400x400 |

### Category Images (place in `/public/images/categories/`)
| Category | Filename | Size |
|----------|----------|------|
| Kue Kering | kue-kering.jpg | 300x300 |
| Roti | roti.jpg | 300x300 |
| Minuman | minuman.jpg | 300x300 |
| Custom Cake | custom-cake-cat.jpg | 300x300 |

### Hero/Banner (place in `/public/images/`)
| Image | Filename | Size |
|-------|----------|------|
| Hero banner | hero-banner.jpg | 1200x600 |
| About banner | about-banner.jpg | 800x400 |

### Placeholder
| Image | Filename | Size |
|-------|----------|------|
| Product placeholder | product-placeholder.jpg | 400x400 |
| Category placeholder | category-placeholder.jpg | 300x300 |

---

## 9. RUNNING TESTS

```bash
# Unit tests
npm run test

# E2E tests (requires dev server + database)
npm run dev &
npm run test:e2e

# E2E with UI
npm run test:e2e:ui

# CI commands
npm run lint
npx tsc --noEmit
npm run test
npm run build
```

---

## 10. CI/CD PIPELINE

```yaml
# .github/workflows/ci.yml
jobs:
  lint-and-typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4 with: node-version: '20'
      - run: npm ci --legacy-peer-deps
      - run: npx prisma generate
      - run: npm run lint
      - run: npx tsc --noEmit

  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4 with: node-version: '20'
      - run: npm ci --legacy-peer-deps
      - run: npx prisma generate
      - run: npm run test

  build:
    needs: [lint-and-typecheck, unit-tests]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4 with: node-version: '20'
      - run: npm ci --legacy-peer-deps
      - run: npx prisma generate
      - run: npm run build
```