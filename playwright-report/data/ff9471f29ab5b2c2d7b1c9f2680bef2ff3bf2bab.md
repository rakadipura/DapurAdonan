# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: booking.spec.ts >> Booking Flow - E2E >> displays booking page with date options
- Location: tests/e2e/booking.spec.ts:8:7

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: locator('h1')
Expected substring: "Booking Meja"
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toContainText" locator('h1') with timeout 5000ms
  - waiting for locator('h1')

```

```yaml
- navigation:
  - button "previous" [disabled]:
    - img "previous"
  - text: 1/ 1
  - button "next" [disabled]:
    - img "next"
- img
- text: Next.js 16.3.5 Turbopack
- dialog "Build Error":
  - text: Build Error
  - button "Copy Error Info":
    - img
  - button "No related documentation found" [disabled]:
    - img
  - button "Attach Node.js inspector":
    - img
  - text: Export createBooking doesn't exist in target module
  - img
  - text: ./src/app/api/bookings/route.ts (2:1)
  - button "Open in editor":
    - img
  - text: "Error: Export createBooking doesn't exist in target module 1 | import { NextRequest, NextResponse } from \"next/server\"; > 2 | import { createBooking, getBooking } from \"@/lib/bookings\"; | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ 3 | import { createBookingSchema } from \"@/validations/bookings\"; 4 | import { revalidatePath } from \"next/cache\"; 5 | import { normalizePhone } from \"@/lib/regex\"; The export createBooking was not found in module [project]/src/lib/bookings.ts [app-route] (ecmascript). Did you mean to import getBooking? All exports of the module are statically known (It doesn't have dynamic exports). So it's known statically that the requested export doesn't exist."
- button "Open Next.js Dev Tools":
  - img
- button "Open issues overlay": 1 Issue
- alert
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | test.describe('Booking Flow - E2E', () => {
  4   |   test.beforeEach(async ({ page }) => {
  5   |     await page.goto('/booking');
  6   |   });
  7   | 
  8   |   test('displays booking page with date options', async ({ page }) => {
> 9   |     await expect(page.locator('h1')).toContainText('Booking Meja');
      |                                      ^ Error: expect(locator).toContainText(expected) failed
  10  |     
  11  |     // Should have date options
  12  |     const dateButtons = page.locator('button:has-text("Pilih Tanggal") + div button, .grid button');
  13  |     await expect(dateButtons.first()).toBeVisible();
  14  |   });
  15  | 
  16  |   test('can select date and proceed to slot selection', async ({ page }) => {
  17  |     // Wait for date options to load
  18  |     await page.waitForSelector('button:has-text("Pilih Tanggal") + div button, .grid button');
  19  |     
  20  |     // Click first available date
  21  |     const firstDateButton = page.locator('.grid button').first();
  22  |     await firstDateButton.click();
  23  |     
  24  |     // Should show slot selection step
  25  |     await expect(page.locator('text=Pilih Waktu & Jumlah Orang')).toBeVisible();
  26  |   });
  27  | 
  28  |   test('shows available slots after date selection', async ({ page }) => {
  29  |     await page.waitForSelector('.grid button');
  30  |     const firstDateButton = page.locator('.grid button').first();
  31  |     await firstDateButton.click();
  32  |     
  33  |     // Should show slot options
  34  |     await expect(page.locator('text=Waktu')).toBeVisible();
  35  |     await expect(page.locator('text=meja tersedia').first()).toBeVisible({ timeout: 5000 });
  36  |   });
  37  | 
  38  |   test('can select slot and proceed to contact form', async ({ page }) => {
  39  |     await page.waitForSelector('.grid button');
  40  |     const firstDateButton = page.locator('.grid button').first();
  41  |     await firstDateButton.click();
  42  |     
  43  |     // Wait for slots to load
  44  |     await page.waitForSelector('text=meja tersedia', { timeout: 5000 });
  45  |     
  46  |     // Click first available slot
  47  |     const availableSlot = page.locator('text=meja tersedia').first().locator('..').locator('..');
  48  |     await availableSlot.click();
  49  |     
  50  |     // Should show contact form step
  51  |     await expect(page.locator('text=Masukkan Info Kontak & Konfirmasi')).toBeVisible();
  52  |   });
  53  | 
  54  |   test('validates required fields in contact form', async ({ page }) => {
  55  |     await page.waitForSelector('.grid button');
  56  |     await page.locator('.grid button').first().click();
  57  |     await page.waitForSelector('text=meja tersedia', { timeout: 5000 });
  58  |     await page.locator('text=meja tersedia').first().locator('..').locator('..').click();
  59  |     
  60  |     // Try to submit without filling required fields
  61  |     await page.click('button:has-text("Konfirmasi Booking")');
  62  |     
  63  |     // Should show validation (browser native for required fields)
  64  |     // Phone validation is custom
  65  |     await expect(page.locator('text=Nomor telepon tidak valid')).toBeVisible({ timeout: 3000 });
  66  |   });
  67  | 
  68  |   test('validates phone number format', async ({ page }) => {
  69  |     await page.waitForSelector('.grid button');
  70  |     await page.locator('.grid button').first().click();
  71  |     await page.waitForSelector('text=meja tersedia', { timeout: 5000 });
  72  |     await page.locator('text=meja tersedia').first().locator('..').locator('..').click();
  73  |     
  74  |     // Fill name only
  75  |     await page.fill('input[placeholder="Nama Anda"]', 'Test User');
  76  |     
  77  |     // Fill invalid phone
  78  |     await page.fill('input[placeholder="081234567890"]', '123');
  79  |     
  80  |     // Try submit
  81  |     await page.click('button:has-text("Konfirmasi Booking")');
  82  |     
  83  |     // Should show phone validation error
  84  |     await expect(page.locator('text=Nomor telepon tidak valid')).toBeVisible({ timeout: 3000 });
  85  |   });
  86  | 
  87  |   test('accepts valid phone formats', async ({ page }) => {
  88  |     await page.waitForSelector('.grid button');
  89  |     await page.locator('.grid button').first().click();
  90  |     await page.waitForSelector('text=meja tersedia', { timeout: 5000 });
  91  |     await page.locator('text=meja tersedia').first().locator('..').locator('..').click();
  92  |     
  93  |     await page.fill('input[placeholder="Nama Anda"]', 'Test User');
  94  |     await page.fill('input[placeholder="081234567890"]', '081234567890');
  95  |     
  96  |     // Should not show phone error
  97  |     await expect(page.locator('text=Nomor telepon tidak valid')).not.toBeVisible();
  98  |   });
  99  | 
  100 |   test('party size controls work', async ({ page }) => {
  101 |     await page.waitForSelector('.grid button');
  102 |     await page.locator('.grid button').first().click();
  103 |     await page.waitForSelector('text=meja tersedia', { timeout: 5000 });
  104 |     await page.locator('text=meja tersedia').first().locator('..').locator('..').click();
  105 |     
  106 |     // Check default party size
  107 |     const partySizeDisplay = page.locator('text=Jumlah orang').locator('..').locator('span').first();
  108 |     await expect(partySizeDisplay).toContainText('2');
  109 |     
```