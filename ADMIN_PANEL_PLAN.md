# Admin Panel - Product & Slot Management Plan

## Current Status

### ✅ Completed
- Admin authentication (login, session cookies, middleware)
- Dashboard with stats cards
- Orders panel (list, filter, status update, confirm payment)
- Bookings panel (list, filter, status update)
- Navigation layout with links
- API routes for products, categories, slots (full CRUD)

### 🔄 In Progress
- ProductsPanel component
- SlotsPanel component

---

## Detailed Implementation Plan

### 1. ProductsPanel.tsx (`src/components/admin/ProductsPanel.tsx`)

#### Features
- **Product Table**: name, category, base price, daily stock, availability, actions
- **Filters**: category dropdown, availability toggle, search by name
- **Add Product Modal**: 
  - Basic: name, slug, description, base price, image URL
  - Inventory: daily stock (nullable = unlimited), isAvailable
  - Categorization: category (select), allergens (multi-select), tags (multi-select)
  - Custom cake: isCustomCake, leadTimeDays
- **Edit Product Modal**: same fields, pre-filled
- **Variants Inline Management** (within product edit):
  - Add/remove variant rows
  - Fields: name, priceDiff, isDefault, sortOrder
- **Add-ons Inline Management** (within product edit):
  - Add/remove add-on rows
  - Fields: name, price, isRequired, sortOrder
- **Delete confirmation** with product name

#### State Management
```typescript
interface ProductFormData {
  name: string;
  slug: string;
  description: string;
  basePrice: number;
  imageUrl: string;
  dailyStock: number | null;
  isAvailable: boolean;
  leadTimeDays: number;
  isCustomCake: boolean;
  allergens: string[];
  tags: string[];
  categoryId: number;
  variants: VariantFormData[];
  addOns: AddOnFormData[];
}

interface VariantFormData {
  id?: number;
  name: string;
  priceDiff: number;
  isDefault: boolean;
  sortOrder: number;
}

interface AddOnFormData {
  id?: number;
  name: string;
  price: number;
  isRequired: boolean;
  sortOrder: number;
}
```

#### API Calls
- `GET /api/admin/products` - list
- `POST /api/admin/products` - create
- `PUT /api/admin/products/[id]` - update
- `DELETE /api/admin/products/[id]` - delete
- `GET /api/admin/categories` - for category select

---

### 2. SlotsPanel.tsx (`src/components/admin/SlotsPanel.tsx`)

#### Features
- **Slot Table**: name, startTime–endTime, capacity, isActive, order, actions
- **Add Slot Modal**:
  - name, startTime (HH:mm), endTime (HH:mm), capacity, isActive, order
- **Edit Slot Modal**: same fields, pre-filled
- **Drag-to-reorder** (or up/down buttons) to change display order
- **Toggle isActive** inline
- **Delete confirmation**

#### State Management
```typescript
interface SlotFormData {
  id?: number;
  name: string;
  startTime: string; // "HH:mm"
  endTime: string;   // "HH:mm"
  capacity: number;
  isActive: boolean;
  order: number;
}
```

#### API Calls
- `GET /api/admin/slots` - list
- `POST /api/admin/slots` - create
- `PUT /api/admin/slots/[id]` - update
- `DELETE /api/admin/slots/[id]` - delete

---

### 3. Shared UI Patterns

#### Modal Component
```typescript
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}
```

#### Form Field Components
- `Input` - text, number, URL
- `Textarea` - description
- `Select` - category, allergens, tags
- `MultiSelect` - allergens (checkboxes), tags (checkboxes)
- `Checkbox` - isAvailable, isCustomCake, isRequired, isDefault, isActive
- `TimeInput` - HH:mm format with validation

---

### 4. Implementation Order

1. **Create ProductsPanel.tsx** (largest component)
   - Product table with filters
   - Add/Edit modal with all fields
   - Variants & add-ons inline editors
   - Category select integration

2. **Create SlotsPanel.tsx** (simpler)
   - Slot table
   - Add/Edit modal
   - Reorder functionality

3. **Test & Build**
   - `npm run build`
   - Verify all CRUD operations work
   - Check admin navigation

---

### 5. File Structure

```
src/
├── components/admin/
│   ├── ProductsPanel.tsx      # NEW
│   ├── SlotsPanel.tsx         # NEW
│   ├── BookingsPanel.tsx      # existing
│   ├── OrdersPanel.tsx        # existing
│   ├── LogoutButton.tsx       # existing
│   └── Modal.tsx              # NEW (shared)
├── app/admin/(dashboard)/
│   ├── products/page.tsx      # existing (renders ProductsPanel)
│   ├── slots/page.tsx         # existing (renders SlotsPanel)
│   ├── layout.tsx             # updated with nav links
└── app/api/admin/
    ├── products/route.ts      # existing
    ├── products/[id]/route.ts # existing
    ├── categories/route.ts    # existing
    ├── categories/[id]/route.ts # existing
    ├── slots/route.ts         # existing
    └── slots/[id]/route.ts    # existing
```

---

### 6. Key Technical Decisions

- **Variants/Add-ons**: Managed inline in product edit modal (delete & recreate on save for simplicity)
- **Reorder slots**: Up/down buttons (simpler than drag-drop)
- **Allergens/Tags**: Multi-select with predefined options + custom input
- **Image URL**: Simple text input (no upload handling for MVP)
- **Form validation**: Zod schemas match API validation
- **Error handling**: Toast-style inline error messages

---

### 7. Testing Checklist

#### ProductsPanel
- [ ] List loads with categories, variants, add-ons
- [ ] Filter by category works
- [ ] Filter by availability works
- [ ] Search by name works
- [ ] Create product with all fields
- [ ] Create product with variants & add-ons
- [ ] Edit product updates correctly
- [ ] Delete product removes from list
- [ ] Custom cake fields appear when toggled
- [ ] Required add-ons enforced in customer UI (verify separately)

#### SlotsPanel
- [ ] List loads with correct order
- [ ] Create slot with all fields
- [ ] Edit slot updates correctly
- [ ] Reorder changes display order
- [ ] Toggle active/inactive works
- [ ] Delete slot removes from list
- [ ] Time format validation (HH:mm)

---

### 8. Dependencies
- Already installed: `zod`, `@prisma/client`, `next`, `react`
- No new dependencies needed