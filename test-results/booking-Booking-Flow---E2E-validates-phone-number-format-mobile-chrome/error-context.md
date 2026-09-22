# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: booking.spec.ts >> Booking Flow - E2E >> validates phone number format
- Location: tests/e2e/booking.spec.ts:68:7

# Error details

```
TimeoutError: page.waitForSelector: Timeout 5000ms exceeded.
Call log:
  - waiting for locator('text=meja tersedia') to be visible

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - banner [ref=e4]:
      - link "← Kembali ke Toko Mini Moni" [ref=e5] [cursor=pointer]:
        - /url: /
      - heading "Booking Meja" [level=1] [ref=e6]
      - paragraph [ref=e7]: Pilih tanggal dan waktu untuk makan bersama di Toko Mini Moni. Hanya tersedia hingga 8 orang per meja.
    - generic [ref=e8]:
      - generic [ref=e9]:
        - generic [ref=e10]: ✓
        - generic [ref=e12]: ✓
        - generic [ref=e14]: "3"
      - button "Kembali" [ref=e16]
      - generic [ref=e20]:
        - heading "Pilih Waktu & Jumlah Orang" [level=2] [ref=e21]
        - paragraph [ref=e22]: "Tanggal: 2026-09-23"
        - generic [ref=e23]:
          - generic [ref=e24]: Waktu
          - generic [ref=e25]:
            - button "Pagi · 09:00 – 11:00 Penuh" [disabled] [ref=e26]:
              - generic [ref=e27]:
                - generic [ref=e28]: Pagi · 09:00 – 11:00
                - generic [ref=e29]: Penuh
            - button "Siang · 12:00 – 14:00 2 kursi tersedia" [ref=e30]:
              - generic [ref=e31]:
                - generic [ref=e32]: Siang · 12:00 – 14:00
                - generic [ref=e33]: 2 kursi tersedia
            - button "Sore · 15:00 – 17:00 4 kursi tersedia" [ref=e34]:
              - generic [ref=e35]:
                - generic [ref=e36]: Sore · 15:00 – 17:00
                - generic [ref=e37]: 4 kursi tersedia
        - generic [ref=e38]:
          - generic [ref=e39]: Jumlah orang (2)
          - generic [ref=e40]:
            - button "−" [ref=e41]
            - generic [ref=e42]: "2"
            - button "+" [ref=e43]
          - paragraph [ref=e44]: Maksimal 8 orang per meja.
  - button "Open Next.js Dev Tools" [ref=e50] [cursor=pointer]
  - alert [ref=e54]
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
> 71  |     await page.waitForSelector('text=meja tersedia', { timeout: 5000 });
      |                ^ TimeoutError: page.waitForSelector: Timeout 5000ms exceeded.
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
  140 |   test('shows booking summary on confirm step', async ({ page }) => {
  141 |     await page.waitForSelector('.grid button');
  142 |     await page.locator('.grid button').first().click();
  143 |     await page.waitForSelector('text=meja tersedia', { timeout: 5000 });
  144 |     await page.locator('text=meja tersedia').first().locator('..').locator('..').click();
  145 |     
  146 |     // Check summary shows
  147 |     await expect(page.locator('text=Ringkasan:')).toBeVisible();
  148 |     await expect(page.locator('text=orang')).toBeVisible();
  149 |   });
  150 | 
  151 |   test('full booking flow with valid data creates booking', async ({ page }) => {
  152 |     await page.waitForSelector('.grid button');
  153 |     await page.locator('.grid button').first().click();
  154 |     await page.waitForSelector('text=meja tersedia', { timeout: 5000 });
  155 |     await page.locator('text=meja tersedia').first().locator('..').locator('..').click();
  156 |     
  157 |     await page.fill('input[placeholder="Nama Anda"]', 'E2E Test User');
  158 |     await page.fill('input[placeholder="081234567890"]', '081234567890');
  159 |     await page.fill('input[placeholder="email@contoh.com"]', 'e2e@test.com');
  160 |     
  161 |     // Submit booking
  162 |     await page.click('button:has-text("Konfirmasi Booking")');
  163 |     
  164 |     // Should redirect to success page
  165 |     await expect(page).toHaveURL(/\/booking\/success\?code=.+/);
  166 |     
  167 |     // Success page should show booking code
  168 |     await expect(page.locator('text=Booking Berhasil')).toBeVisible();
  169 |     await expect(page.locator('text=Kode booking')).toBeVisible();
  170 |     
  171 |     // Should have WhatsApp link
```