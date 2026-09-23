# DapurAdonan - Remaining Work Plan

## Priority 1: Admin Pages (Core Features)

### 1.1 Categories Management Page `/admin/categories`
- [x] Create page component at `src/app/admin/(dashboard)/categories/page.tsx`
- [x] Create CategoriesPanel component at `src/components/admin/CategoriesPanel.tsx`
- [x] Features: List, Create, Edit, Delete categories
- [x] Fields: name, slug, imageUrl, sortOrder, isVisible
- [x] API routes already exist: GET/POST `/api/admin/categories`, GET/PUT/DELETE `/api/admin/categories/[id]`

### 1.2 Settings Management Page `/admin/settings`
- [x] Create page component at `src/app/admin/(dashboard)/settings/page.tsx`
- [x] Create SettingsPanel component at `src/components/admin/SettingsPanel.tsx`
- [x] Features: Edit key-value settings
- [x] Key settings: bookingLeadHours, orderCutoffHour, whatsAppNumber, pickupWindows, deliveryZones, transferBank (the seat limit moved to each slot's `capacity`)
- [x] API route exists: GET/PUT `/api/settings`

---

## Priority 2: Code Quality (Lint Errors)

### 2.1 Fix `<a>` → `<Link>` in customer pages
- [x] `src/app/booking/page.tsx` line 64
- [ ] `src/app/booking/status/page.tsx` line 32
- [ ] `src/app/booking/success/page.tsx` line 27
- [ ] `src/app/menu/page.tsx` lines 64, 76
- [ ] `src/app/order/status/page.tsx` line 41
- [ ] `src/app/order/success/page.tsx` lines 31, 49

### 2.2 Fix `useEffect` setState warnings
- [x] `src/components/admin/BookingsPanel.tsx` line 69
- [ ] `src/components/admin/OrdersPanel.tsx` line 68
- [ ] `src/components/admin/ProductsPanel.tsx` line 133
- [ ] `src/components/admin/SlotsPanel.tsx` line 66

### 2.3 Fix `require()` import
- [x] `src/lib/db.ts` line 11

---

## Priority 3: CI/CD

### 3.1 Create GitHub Actions workflow
- [x] Create `.github/workflows/ci.yml`
- [x] Run: lint, typecheck, unit tests, build
- [ ] Optional: E2E tests (requires database) — job exists but is commented out

---

## Priority 4: Customer Features

### 4.1 Order History / My Account page
- [ ] Create `/account/orders` page
- [ ] List customer orders by phone lookup
- [ ] Show order details, status, reorder option

### 4.2 Payment proof upload
- [x] Add file upload to order form or order status page
- [ ] Store in cloud storage (S3, Cloudinary) — currently local `uploads/` + serving route
- [x] Update `paymentProofUrl` in DB

### 4.3 WhatsApp deep links
- [x] Add `wa.me` links to contact buttons
- [x] Pre-fill message with order/booking code (`generateWhatsAppLink`)

---

## Priority 5: Testing

### 5.1 Run E2E tests
- [ ] Start dev server: `npm run dev`
- [ ] Run: `npm run test:e2e`
- [ ] Fix any failing tests

### 5.2 Add integration tests
- [ ] API route tests with test database
- [ ] Database transaction tests

---

## Priority 6: Optional Enhancements

### 6.1 Image upload for products
- [ ] Replace imageUrl input with file upload
- [ ] Integrate with cloud storage

### 6.2 Email notifications
- [ ] Booking confirmation emails
- [ ] Order status change emails
- [ ] Admin notification emails

### 6.3 Customer dashboard
- [ ] Favorites/wishlist
- [ ] Reorder from history
- [ ] Address book for delivery

---

## Progress Tracking

| Task | Status | Notes |
|------|--------|-------|
| ProductsPanel, SlotsPanel, CategoriesPanel, SettingsPanel | ✅ Done | |
| Unit tests (21) | ✅ Done | |
| E2E test scenarios | ✅ Written | Need to run |
| Lint fixes (`<Link>`, `useRef`, `import`) | ✅ Done | 43 warnings remain (unused vars, `<img>`) |
| CI workflow | ✅ Done | .github/workflows/ci.yml |
| **Order history / My Account** | ✅ Done | /account/orders with phone lookup |
| Payment upload | ✅ Done | Validated upload + serving route (`/api/payments/proof/[filename]`) |
| WhatsApp links | ✅ Done | |
| Admin auth enforcement | ✅ Done | Session checked in every `/api/admin/*` route + dashboard layout |
| Reschedule & capacity correctness | ✅ Done | Two-row reschedule, `FOR UPDATE` slot/product locks |
| Booking/pickup date off-by-one | ✅ Done | `parseYMD`/`wibToday` helpers; legacy rows still need migration |