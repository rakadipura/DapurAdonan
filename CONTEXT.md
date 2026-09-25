# Toko Mini Moni

A home bakery/cake shop system for product ordering (pickup/delivery) and table booking.

## Language

### Catalog

**Category**: A grouping of products (e.g., "Kue Basah", "Roti"). Has visibility and sort order.

**Product**: A sellable item with base price (IDR), optional variants and add-ons, daily production capacity, and lead time.

**Variant**: A size/option of a product with a price differential (e.g., "6 inch", "8 inch", "10 inch"). One variant per product is the default.

**Add-on**: An optional extra for a product (e.g., "Custom message", "Birthday candles"). Can be required.

**Daily production capacity**: Maximum units producible per calendar day. `null` or `0` = no limit (unlimited).

**Lead time (days)**: Minimum advance notice in calendar days required to produce a product (especially custom cakes).

**Allergen**: A dietary allergen tag (e.g., "nuts", "dairy", "gluten") attached to a product.

**Tag**: A marketing/filter label (e.g., "best-seller", "vegan", "gluten-free") attached to a product.

### Ordering

**Order**: A customer request for products, either pickup or delivery. Has a unique code, status, and payment tracking.

**Order status**: One of:
- `PENDING` — placed by customer, awaiting admin acknowledgement
- `CONFIRMED` — admin acknowledged the order
- `BAKING` — in production
- `READY` — ready for pickup/delivery
- `COMPLETED` — fulfilled
- `CANCELLED` — cancelled

**Order type**: `PICKUP` (customer collects) or `DELIVERY` (we deliver).

**Pickup window**: A configured time range for order collection (e.g., "17:00-18:00"). Stored in settings.

**Delivery zone**: A geographic area with fee rules (base fee, per-km, max-km, free-minimum). Custom cakes use a different fee tier (car delivery vs motorcycle).

**Custom cake**: An order with `isCustomCake=true` carrying custom text, design notes, and/or reference photo. Enforces product lead time.

**Payment method**: `CASH`, `TRANSFER`, `QRIS`, or `EWALLET`. Payment confirmation is a separate boolean (`isPaid`), not part of status.

### Booking

**Booking**: A table reservation for a specific date and time slot. Has a unique code and status.

**Booking slot**: A named time window (e.g., "Pagi 09:00-11:00") with a seat capacity. Configured in admin.

**Booking status**: One of:
- `PENDING` — requested by customer
- `CONFIRMED` — admin confirmed the booking
- `COMPLETED` — customer attended
- `CANCELLED` — cancelled by customer/admin
- `NO_SHOW` — customer did not attend
- `RESCHEDULED` — superseded by a new booking (audit trail)

**Reschedule**: Creates a new booking row linked to the original via `rescheduledFromId`. The old row becomes `RESCHEDULED` and is excluded from capacity counts. Orders do not reschedule (cancel + reorder).

### Time & Money

**WIB calendar date**: A calendar date in Asia/Jakarta (UTC+7), stored as UTC midnight (`YYYY-MM-DDT00:00:00.000Z`). Used for `Booking.date`, `Order.pickupDate`, and daily stock windows.

**WIB instant**: A real point in time in WIB, stored as ISO 8601 with offset (`YYYY-MM-DDT00:00:00+07:00`). Used for `createdAt`, `updatedAt`, range queries.

**Price**: Integer Indonesian Rupiah (no decimals). All monetary values stored as integer IDR.

### Settings

**Setting**: A key-value configuration row. Keys include: `pickupWindows`, `deliveryZones`, `transferBank`, `waNumber`, `storeName`, `logoUrl`, `orderCutoffHour`, `bookingLeadHours`, `closedDays`.

**Closed days**: Array of day indices (0=Sunday..6=Saturday) when the shop is closed for pickup/booking. Default: `["0"]` (Sundays). Used to filter available dates.

### Customer

**Customer**: A person placing an order or booking. Identified by name + phone (normalized to `+628...`). Email optional.

### Avoid

| Instead of... | Use |
|---------------|-----|
| "daily stock", "stock limit" | **daily production capacity** |
| "advance notice", "prep time" | **lead time (days)** |
| "collection slot", "pickup slot" | **pickup window** |
| "zone", "delivery area" | **delivery zone** |
| "order cancellation" | **order cancellation** (order status) |
| "booking cancellation" | **booking cancellation** (booking status) |
| "date" (ambiguous) | **WIB calendar date** or **WIB instant** |