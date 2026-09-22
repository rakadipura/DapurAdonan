# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: booking.spec.ts >> Booking Flow - E2E >> full booking flow with valid data creates booking
- Location: tests/e2e/booking.spec.ts:151:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=Kode booking')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" locator('text=Kode booking') with timeout 5000ms
  - waiting for locator('text=Kode booking')

```

```yaml
- alert: Booking Berhasil — Toko Mini Moni
- banner:
  - link "← Kembali ke Toko Mini Moni":
    - /url: /
- text: ✅
- heading "Booking Anda berhasil!" [level=1]
- paragraph: Terima kasih sudah membooking di Toko Mini Moni.
- text: Kode Referensi ZDNNYQFP
- paragraph: Simpan kode ini. Cek status booking dengan kode dan nomor telepon.
- heading "Detail Booking" [level=2]
- text: Nama E2E Test User Nomor telepon 081234567890 Tanggal 2026-09-22 Jadwal 12:00 – 14:00 Jumlah orang 2 orang Status PENDING
- link "Cek Status":
  - /url: /booking/status?code=ZDNNYQFP&phone=081234567890
- link "Konfirmasi via WhatsApp":
  - /url: https://wa.me/6281234567890?text=Halo%20Toko%20Mini%20Moni,%20saya%20baru%20membooking%20meja%20dengan%20kode%20ZDNNYQFP.
- contentinfo:
  - paragraph: Toko Mini Moni · Jam operasional 09.00 – 17.00 WIB
  - paragraph: "Hubungi kami via WhatsApp: 0812-3456-7890"
```

# Test source

```ts
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
> 169 |     await expect(page.locator('text=Kode booking')).toBeVisible();
      |                                                     ^ Error: expect(locator).toBeVisible() failed
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
  209 |         name: 'API Test',
  210 |         phone: '081234567890',
  211 |       },
  212 |     });
  213 |     
  214 |     expect(response.status()).toBe(400);
  215 |     const data = await response.json();
  216 |     expect(data.error).toContain('Tanggal booking harus hari ini atau setelahnya');
  217 |   });
  218 | 
  219 |   test('POST /api/bookings rejects invalid phone', async ({ request }) => {
  220 |     const tomorrow = new Date();
  221 |     tomorrow.setDate(tomorrow.getDate() + 1);
  222 |     const dateStr = tomorrow.toISOString().slice(0, 10);
  223 |     
  224 |     const response = await request.post('/api/bookings', {
  225 |       data: {
  226 |         date: dateStr,
  227 |         slotId: 1,
  228 |         partySize: 2,
  229 |         name: 'API Test',
  230 |         phone: '123',
  231 |       },
  232 |     });
  233 |     
  234 |     expect(response.status()).toBe(400);
  235 |   });
  236 | 
  237 |   test('GET /api/bookings/slots returns available slots', async ({ request }) => {
  238 |     const tomorrow = new Date();
  239 |     tomorrow.setDate(tomorrow.getDate() + 1);
  240 |     const dateStr = tomorrow.toISOString().slice(0, 10);
  241 |     
  242 |     const response = await request.get(`/api/bookings/slots?date=${dateStr}`);
  243 |     
  244 |     expect(response.ok()).toBeTruthy();
  245 |     const data = await response.json();
  246 |     expect(data.slots).toBeDefined();
  247 |     expect(Array.isArray(data.slots)).toBe(true);
  248 |   });
  249 | 
  250 |   test('GET /api/bookings/slots requires date param', async ({ request }) => {
  251 |     const response = await request.get('/api/bookings/slots');
  252 |     expect(response.status()).toBe(400);
  253 |   });
  254 | });
  255 | 
  256 | test.describe('Booking Status Page', () => {
  257 |   test('shows booking details with valid code and phone', async ({ page, request }) => {
  258 |     // First create a booking
  259 |     const tomorrow = new Date();
  260 |     tomorrow.setDate(tomorrow.getDate() + 1);
  261 |     const dateStr = tomorrow.toISOString().slice(0, 10);
  262 |     
  263 |     const createResponse = await request.post('/api/bookings', {
  264 |       data: {
  265 |         date: dateStr,
  266 |         slotId: 1,
  267 |         partySize: 2,
  268 |         name: 'Status Test',
  269 |         phone: '081234567890',
```