# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: booking.spec.ts >> Booking Status Page >> shows booking details with valid code and phone
- Location: tests/e2e/booking.spec.ts:257:7

# Error details

```
SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON
```

# Test source

```ts
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
  270 |       },
  271 |     });
  272 |     
> 273 |     const data = await createResponse.json();
      |                  ^ SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON
  274 |     const { code, phone } = data.booking;
  275 |     
  276 |     // Visit status page
  277 |     await page.goto(`/booking/status?code=${code}&phone=${phone}`);
  278 |     
  279 |     await expect(page.locator('text=Cek Status')).toBeVisible();
  280 |     await expect(page.locator(`text=${code}`)).toBeVisible();
  281 |     await expect(page.locator(`text=${phone}`)).toBeVisible();
  282 |     await expect(page.locator('text=Booking Meja')).toBeVisible();
  283 |   });
  284 | 
  285 |   test('shows error for invalid code/phone', async ({ page }) => {
  286 |     await page.goto('/booking/status?code=INVALID&phone=081234567890');
  287 |     
  288 |     await expect(page.locator('text=Kode atau nomor telepon tidak cocok')).toBeVisible();
  289 |   });
  290 | });
```