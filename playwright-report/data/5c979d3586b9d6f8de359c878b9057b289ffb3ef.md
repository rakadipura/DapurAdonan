# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: booking.spec.ts >> Booking Flow - E2E >> party size controls work
- Location: tests/e2e/booking.spec.ts:100:7

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: locator('text=Jumlah orang').locator('..').locator('span').first()
Expected substring: "2"
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toContainText" locator('text=Jumlah orang').locator('..').locator('span').first() with timeout 5000ms
  - waiting for locator('text=Jumlah orang').locator('..').locator('span').first()

```

```yaml
- banner:
  - link "← Kembali ke Toko Mini Moni":
    - /url: /
  - heading "Booking Meja" [level=1]
  - paragraph: Pilih tanggal dan jam untuk makan bersama di Toko Mini Moni. Hanya tersedia hingga 8 orang per meja.
- text: 1 2 3
- button "Kembali"
- heading "Masukkan Info Kontak & Konfirmasi" [level=2]
- text: Ringkasan:2026-09-23 · Siang (12:00–14:00) · 2 orang Nama lengkap
- textbox "Nama Anda"
- text: Nomor telepon
- textbox "081234567890"
- text: Email (opsional)
- textbox "email@contoh.com"
- button "Konfirmasi Booking" [disabled]
- alert
```

# Test source

```ts
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
> 108 |     await expect(partySizeDisplay).toContainText('2');
      |                                    ^ Error: expect(locator).toContainText(expected) failed
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
  172 |     await expect(page.locator('text=Konfirmasi via WhatsApp')).toBeVisible();
  173 |   });
  174 | });
  175 | 
  176 | test.describe('Booking API', () => {
  177 |   test('POST /api/bookings creates booking with valid data', async ({ request }) => {
  178 |     const tomorrow = new Date();
  179 |     tomorrow.setDate(tomorrow.getDate() + 1);
  180 |     const dateStr = tomorrow.toISOString().slice(0, 10);
  181 |     
  182 |     const response = await request.post('/api/bookings', {
  183 |       data: {
  184 |         date: dateStr,
  185 |         slotId: 1,
  186 |         partySize: 2,
  187 |         name: 'API Test',
  188 |         phone: '081234567890',
  189 |       },
  190 |     });
  191 |     
  192 |     expect(response.ok()).toBeTruthy();
  193 |     const data = await response.json();
  194 |     expect(data.booking).toBeDefined();
  195 |     expect(data.booking.code).toBeDefined();
  196 |     expect(data.redirectUrl).toContain('/booking/success');
  197 |   });
  198 | 
  199 |   test('POST /api/bookings rejects past date', async ({ request }) => {
  200 |     const yesterday = new Date();
  201 |     yesterday.setDate(yesterday.getDate() - 1);
  202 |     const dateStr = yesterday.toISOString().slice(0, 10);
  203 |     
  204 |     const response = await request.post('/api/bookings', {
  205 |       data: {
  206 |         date: dateStr,
  207 |         slotId: 1,
  208 |         partySize: 2,
```