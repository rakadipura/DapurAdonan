# Booking Flow - Test Scenarios

## Overview
Booking flow consists of 3 steps:
1. **Date Selection** - Pick a date from available options
2. **Time & Party Size** - Select time slot and number of people
3. **Contact & Confirm** - Enter contact info and submit booking

---

## Test Scenarios

### 1. Happy Path - Complete Booking Flow
**Steps:**
1. Visit `/booking`
2. Select tomorrow's date
3. Select available time slot (e.g., "Pagi 09:00-11:00")
4. Set party size (e.g., 4)
5. Fill contact: name, phone, email
6. Click "Konfirmasi Booking"
7. Should redirect to `/booking/success?code=XXX&phone=XXX`
8. Success page shows booking code, details, WhatsApp link

**Expected:**
- Booking created in DB with status "PENDING"
- Redirect to success page
- Success page displays correct details
- WhatsApp link pre-filled with booking code

---

### 2. Date Selection Tests

| Scenario | Steps | Expected |
|----------|-------|----------|
| Select today | Click today's date | Shows available slots for today |
| Select tomorrow | Click tomorrow's date | Shows available slots for tomorrow |
| Select past date | Not shown in options | Past dates not in dateOptions |
| Select weekend | Sunday dates skipped | Sunday not in dateOptions |
| No dates available | All dates booked | "Belum ada tanggal tersedia" |

---

### 3. Slot Selection Tests

| Scenario | Steps | Expected |
|----------|-------|----------|
| Available slot | Click slot with capacity > 0 | Slot selected, advance to step 3 |
| Full slot | Click slot with 0 capacity | Disabled, cannot select |
| Multiple slots | Click different slots | Only one selected at a time |
| No slots | All slots full | "Belum ada jadwal tersedia" |

---

### 4. Party Size Tests

| Scenario | Steps | Expected |
|----------|-------|----------|
| Min size | Click - until 1 | Min 1 person |
| Max size | Click + until max | Stops at the date's max "kursi tersedia" (slot capacity, default 8) |
| Invalid size | Try > kursi tersedia | Button disabled at max |
| Seats display | Change jumlah orang | Slot "kursi tersedia" drops by the same amount |

---

### 5. Contact Form Validation

| Field | Invalid Input | Expected Error |
|-------|---------------|----------------|
| Name | Empty | "Nama wajib diisi" (HTML5 required) |
| Phone | "123" | "Nomor telepon tidak valid" |
| Phone | "08123" | "Format nomor telepon tidak valid" |
| Phone | "628123456789" | Accepted (international format) |
| Email | "invalid" | "Format email tidak valid" |
| Email | Empty | Accepted (optional) |

---

### 6. API Validation (POST /api/bookings)

| Input | Expected Response |
|-------|-------------------|
| Valid payload | 201, { booking, redirectUrl } |
| Past date | 400, "Tanggal booking harus hari ini atau setelahnya" |
| Invalid slotId | 400, "Jadwal tidak tersedia" |
| Party size > capacity | 400, "Jadwal penuh; hanya tersisa X orang" |
| Party size > slot capacity | 400, "Jumlah orang melebihi kapasitas jadwal (X)" |
| Invalid phone | 400, "Nomor telepon tidak valid" |
| Missing fields | 400, Zod validation errors |

---

### 7. Slot Availability API (GET /api/bookings/slots?date=)

| Scenario | Expected |
|----------|----------|
| Valid date | 200, { slots: [{ slotId, name, startTime, endTime, capacity, remaining }] } |
| Missing date | 400, "Tanggal wajib diisi" |
| All slots full | 200, slots with remaining: 0 |

---

### 8. Edge Cases

| Scenario | Expected |
|----------|----------|
| Refresh on step 2 | Returns to step 1 (date selection) |
| Refresh on step 3 | Returns to step 1 |
| Back button on step 3 | Returns to step 2 |
| Double submit | Second request ignored (disabled button) |
| Network error | Error toast, stay on step 3 |
| Concurrent bookings | Second booking rejected if full |
| Phone normalization | "081234567890" → "6281234567890" in DB |

---

### 9. Admin Verification

| Action | Expected |
|--------|----------|
| Admin views dashboard | Shows today's bookings count |
| Admin views bookings page | Lists all bookings with status |
| Admin changes status to CONFIRMED | Status updated, visible to customer |
| Admin changes status to CANCELLED | Booking cancelled, slot freed |

---

### 10. Customer Status Check

| Scenario | Steps | Expected |
|----------|-------|----------|
| Valid code + phone | Visit `/booking/status?code=XXX&phone=XXX` | Shows booking details |
| Invalid code | Same | "Kode atau nomor telepon tidak cocok" |
| Invalid phone | Same | "Kode atau nomor telepon tidak cocok" |
| Cancelled booking | Same | Shows status "Dibatalkan" |

---

## Test Data Setup

### Prisma Seed (for test DB)
```typescript
// Categories not needed for booking
// BookingSlots
await prisma.bookingSlot.createMany({
  data: [
    { name: 'Pagi', startTime: '09:00', endTime: '11:00', capacity: 4, order: 1 },
    { name: 'Siang', startTime: '12:00', endTime: '14:00', capacity: 4, order: 2 },
    { name: 'Sore', startTime: '17:00', endTime: '19:00', capacity: 4, order: 3 },
  ],
});

// Settings
await prisma.setting.createMany({
  data: [
    { key: 'bookingLeadHours', value: '1' },
    { key: 'whatsAppNumber', value: '6281234567890' },
  ],
});
```

---

## Running Tests

```bash
# Unit tests
npm run test

# E2E tests (requires dev server running)
npm run test:e2e

# E2E with UI
npm run test:e2e:ui
```

---

## CI/CD Integration

Add to `.github/workflows/ci.yml`:
```yaml
- name: Run unit tests
  run: npm run test

- name: Run E2E tests
  run: npm run test:e2e
```