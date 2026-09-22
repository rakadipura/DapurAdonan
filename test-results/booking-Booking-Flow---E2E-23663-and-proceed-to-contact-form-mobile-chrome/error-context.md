# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: booking.spec.ts >> Booking Flow - E2E >> can select slot and proceed to contact form
- Location: tests/e2e/booking.spec.ts:38:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.waitForSelector: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('.grid button') to be visible

```

# Page snapshot

```yaml
- generic:
  - generic [active]:
    - generic [ref=e3]:
      - generic [ref=e4]:
        - navigation [ref=e6]:
          - button [disabled] [ref=e7]:
            - img "previous" [ref=e8]
          - generic [ref=e10]:
            - generic [ref=e11]: 1/
            - generic [ref=e12]: "1"
          - button [disabled] [ref=e13]:
            - img "next" [ref=e14]
        - generic [ref=e17]:
          - generic "Latest available version is detected (16.3.5)." [ref=e20]: Next.js 16.3.5
          - generic [ref=e21]: Turbopack
      - dialog "Build Error" [ref=e23]:
        - generic [ref=e26]:
          - generic [ref=e28]:
            - generic [ref=e29]:
              - generic [ref=e30]: Build Error
              - generic [ref=e32]:
                - button "Copy Error Info" [ref=e33] [cursor=pointer]
                - button "No related documentation found" [disabled] [ref=e36]
                - button "Attach Node.js inspector" [ref=e39] [cursor=pointer]
            - generic [ref=e48]: Export createBooking doesn't exist in target module
          - generic [ref=e51]:
            - generic [ref=e53]:
              - generic [ref=e59]: ./src/app/api/bookings/route.ts (2:1)
              - button "Open in editor" [ref=e60] [cursor=pointer]
            - generic [ref=e65]:
              - text: Error
              - generic [ref=e66]: ": Export"
              - text: createBooking
              - generic [ref=e67]: doesn't exist in target module
              - generic [ref=e68]: 1 |
              - text: import
              - generic [ref=e69]: "{"
              - text: NextRequest
              - generic [ref=e70]: ","
              - text: NextResponse
              - generic [ref=e71]: "}"
              - text: from "next/server"
              - generic [ref=e72]: ;
              - text: ">"
              - generic [ref=e73]: 2 |
              - text: import
              - generic [ref=e74]: "{ createBooking, getBooking }"
              - text: from "@/lib/bookings"
              - generic [ref=e75]: ;
              - generic [ref=e76]: "|"
              - text: ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
              - generic [ref=e77]: 3 |
              - text: import
              - generic [ref=e78]: "{ createBookingSchema }"
              - text: from "@/validations/bookings"
              - generic [ref=e79]: ;
              - generic [ref=e80]: 4 |
              - text: import
              - generic [ref=e81]: "{ revalidatePath }"
              - text: from "next/cache"
              - generic [ref=e82]: ;
              - generic [ref=e83]: 5 |
              - text: import
              - generic [ref=e84]: "{ normalizePhone }"
              - text: from "@/lib/regex"
              - generic [ref=e85]: ; The export
              - text: createBooking
              - generic [ref=e86]: was not found in module
              - generic [ref=e87]: "[project]/src/lib/bookings.ts [app-route] (ecmascript)"
              - generic [ref=e88]: . Did you mean to import
              - text: getBooking
              - generic [ref=e89]: "? All exports of the module are statically known (It doesn't have dynamic exports). So it's known statically that the requested export doesn't exist."
    - generic [ref=e94] [cursor=pointer]:
      - button "Open Next.js Dev Tools" [ref=e95]
      - button "Open issues overlay" [ref=e100]:
        - generic [ref=e101]:
          - generic [aria-hidden] [ref=e102]: "0"
          - generic [ref=e103]: "1"
        - generic [ref=e104]: Issue
  - alert [ref=e105]
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
  9   |     await expect(page.locator('h1')).toContainText('Booking Meja');
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
> 39  |     await page.waitForSelector('.grid button');
      |                ^ Error: page.waitForSelector: Test timeout of 30000ms exceeded.
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
  110 |     // Increase party size
  111 |     await page.click('button:has-text("+")');
  112 |     await expect(partySizeDisplay).toContainText('3');
  113 |     
  114 |     // Decrease party size
  115 |     await page.click('button:has-text("−")');
  116 |     await expect(partySizeDisplay).toContainText('2');
  117 |   });
  118 | 
  119 |   test('disables party size at max', async ({ page }) => {
  120 |     await page.waitForSelector('.grid button');
  121 |     await page.locator('.grid button').first().click();
  122 |     await page.waitForSelector('text=meja tersedia', { timeout: 5000 });
  123 |     await page.locator('text=meja tersedia').first().locator('..').locator('..').click();
  124 |     
  125 |     // Get max party size from text
  126 |     const maxText = await page.locator('text=Maksimal').textContent();
  127 |     const maxMatch = maxText?.match(/Maksimal (\d+) orang/);
  128 |     const maxPartySize = maxMatch ? parseInt(maxMatch[1]) : 8;
  129 |     
  130 |     // Increase to max
  131 |     for (let i = 2; i < maxPartySize; i++) {
  132 |       await page.click('button:has-text("+")');
  133 |     }
  134 |     
  135 |     // Plus button should be disabled
  136 |     const plusButton = page.locator('button:has-text("+")');
  137 |     await expect(plusButton).toBeDisabled();
  138 |   });
  139 | 
```