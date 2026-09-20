# DapurAdonan - Remaining Work Plan

## Priority 1: Admin Pages (Core Features)

### 1.1 Categories Management Page `/admin/categories`
- [ ] Create page component at `src/app/admin/(dashboard)/categories/page.tsx`
- [ ] Create CategoriesPanel component at `src/components/admin/CategoriesPanel.tsx`
- [ ] Features: List, Create, Edit, Delete categories
- [ ] Fields: name, slug, imageUrl, sortOrder, isVisible
- [ ] API routes already exist: GET/POST `/api/admin/categories`, GET/PUT/DELETE `/api/admin/categories/[id]`

### 1.2 Settings Management Page `/admin/settings`
- [ ] Create page component at `src/app/admin/(dashboard)/settings/page.tsx`
- [ ] Create SettingsPanel component at `src/components/admin/SettingsPanel.tsx`
- [ ] Features: Edit key-value settings
- [ ] Key settings: maxPartySize, bookingLeadHours, whatsAppNumber, pickupWindows, deliveryZones, transferBank
- [ ] API route exists: GET/PUT `/api/settings`

---

## Priority 2: Code Quality (Lint Errors)

### 2.1 Fix `<a>` → `<Link>` in customer pages
- [ ] `src/app/booking/page.tsx` line 64
- [ ] `src/app/booking/status/page.tsx` line 32
- [ ] `src/app/booking/success/page.tsx` line 27
- [ ] `src/app/menu/page.tsx` lines 64, 76
- [ ] `src/app/order/status/page.tsx` line 41
- [ ] `src/app/order/success/page.tsx` lines 31, 49

### 2.2 Fix `useEffect` setState warnings
- [ ] `src/components/admin/BookingsPanel.tsx` line 69
- [ ] `src/components/admin/OrdersPanel.tsx` line 68
- [ ] `src/components/admin/ProductsPanel.tsx` line 133
- [ ] `src/components/admin/SlotsPanel.tsx` line 66

### 2.3 Fix `require()` import
- [ ] `src/lib/db.ts` line 11

---

## Priority 3: CI/CD

### 3.1 Create GitHub Actions workflow
- [ ] Create `.github/workflows/ci.yml`
- [ ] Run: lint, typecheck, unit tests, build
- [ ] Optional: E2E tests (requires database)

---

## Priority 4: Customer Features

### 4.1 Order History / My Account page
- [ ] Create `/account/orders` page
- [ ] List customer orders by phone lookup
- [ ] Show order details, status, reorder option

### 4.2 Payment proof upload
- [ ] Add file upload to order form or order status page
- [ ] Store in cloud storage (S3, Cloudinary) or local
- [ ] Update `paymentProofUrl` in DB

### 4.3 WhatsApp deep links
- [ ] Add `wa.me` links to contact buttons
- [ ] Pre-fill message with order/booking code

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
| ProductsPanel | ✅ Done | |
| SlotsPanel | ✅ Done | |
| Unit tests | ✅ Done | 21 tests passing |
| E2E tests | ✅ Written | Need to run |
| Categories page | ✅ Done | |
| Settings page | ✅ Done | |
| Lint: `<a>` → `<Link>` | ✅ Done | 6 files |
| Lint: `useEffect` setState | ✅ Done | 6 admin panels with useRef |
| Lint: `require()` → `import` | ✅ Done | db.ts |
| CI workflow | ✅ Done | .github/workflows/ci.yml, ci-pr.yml |
| Order history | ⏳ Next | |
| Payment upload | ⏳ | |
| WhatsApp links | ⏳ | |