import { test, expect } from '@playwright/test';

test.describe('Booking Flow - E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/booking');
  });

  test('displays booking page with date options', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Booking Meja');
    
    // Should have date options
    const dateButtons = page.locator('button:has-text("Pilih Tanggal") + div button, .grid button');
    await expect(dateButtons.first()).toBeVisible();
  });

  test('can select date and proceed to slot selection', async ({ page }) => {
    // Wait for date options to load
    await page.waitForSelector('button:has-text("Pilih Tanggal") + div button, .grid button');
    
    // Click first available date
    const firstDateButton = page.locator('.grid button').first();
    await firstDateButton.click();
    
    // Should show slot selection step
    await expect(page.locator('text=Pilih Waktu & Jumlah Orang')).toBeVisible();
  });

  test('shows available slots after date selection', async ({ page }) => {
    await page.waitForSelector('.grid button');
    const firstDateButton = page.locator('.grid button').first();
    await firstDateButton.click();
    
    // Should show slot options
    await expect(page.locator('text=Waktu')).toBeVisible();
    await expect(page.locator('text=meja tersedia').first()).toBeVisible({ timeout: 5000 });
  });

  test('can select slot and proceed to contact form', async ({ page }) => {
    await page.waitForSelector('.grid button');
    const firstDateButton = page.locator('.grid button').first();
    await firstDateButton.click();
    
    // Wait for slots to load
    await page.waitForSelector('text=meja tersedia', { timeout: 5000 });
    
    // Click first available slot
    const availableSlot = page.locator('text=meja tersedia').first().locator('..').locator('..');
    await availableSlot.click();
    
    // Should show contact form step
    await expect(page.locator('text=Masukkan Info Kontak & Konfirmasi')).toBeVisible();
  });

  test('validates required fields in contact form', async ({ page }) => {
    await page.waitForSelector('.grid button');
    await page.locator('.grid button').first().click();
    await page.waitForSelector('text=meja tersedia', { timeout: 5000 });
    await page.locator('text=meja tersedia').first().locator('..').locator('..').click();
    
    // Try to submit without filling required fields
    await page.click('button:has-text("Konfirmasi Booking")');
    
    // Should show validation (browser native for required fields)
    // Phone validation is custom
    await expect(page.locator('text=Nomor telepon tidak valid')).toBeVisible({ timeout: 3000 });
  });

  test('validates phone number format', async ({ page }) => {
    await page.waitForSelector('.grid button');
    await page.locator('.grid button').first().click();
    await page.waitForSelector('text=meja tersedia', { timeout: 5000 });
    await page.locator('text=meja tersedia').first().locator('..').locator('..').click();
    
    // Fill name only
    await page.fill('input[placeholder="Nama Anda"]', 'Test User');
    
    // Fill invalid phone
    await page.fill('input[placeholder="081234567890"]', '123');
    
    // Try submit
    await page.click('button:has-text("Konfirmasi Booking")');
    
    // Should show phone validation error
    await expect(page.locator('text=Nomor telepon tidak valid')).toBeVisible({ timeout: 3000 });
  });

  test('accepts valid phone formats', async ({ page }) => {
    await page.waitForSelector('.grid button');
    await page.locator('.grid button').first().click();
    await page.waitForSelector('text=meja tersedia', { timeout: 5000 });
    await page.locator('text=meja tersedia').first().locator('..').locator('..').click();
    
    await page.fill('input[placeholder="Nama Anda"]', 'Test User');
    await page.fill('input[placeholder="081234567890"]', '081234567890');
    
    // Should not show phone error
    await expect(page.locator('text=Nomor telepon tidak valid')).not.toBeVisible();
  });

  test('party size controls work', async ({ page }) => {
    await page.waitForSelector('.grid button');
    await page.locator('.grid button').first().click();
    await page.waitForSelector('text=meja tersedia', { timeout: 5000 });
    await page.locator('text=meja tersedia').first().locator('..').locator('..').click();
    
    // Check default party size
    const partySizeDisplay = page.locator('text=Jumlah orang').locator('..').locator('span').first();
    await expect(partySizeDisplay).toContainText('2');
    
    // Increase party size
    await page.click('button:has-text("+")');
    await expect(partySizeDisplay).toContainText('3');
    
    // Decrease party size
    await page.click('button:has-text("−")');
    await expect(partySizeDisplay).toContainText('2');
  });

  test('disables party size at max', async ({ page }) => {
    await page.waitForSelector('.grid button');
    await page.locator('.grid button').first().click();
    await page.waitForSelector('text=meja tersedia', { timeout: 5000 });
    await page.locator('text=meja tersedia').first().locator('..').locator('..').click();
    
    // Get max party size from text
    const maxText = await page.locator('text=Maksimal').textContent();
    const maxMatch = maxText?.match(/Maksimal (\d+) orang/);
    const maxPartySize = maxMatch ? parseInt(maxMatch[1]) : 8;
    
    // Increase to max
    for (let i = 2; i < maxPartySize; i++) {
      await page.click('button:has-text("+")');
    }
    
    // Plus button should be disabled
    const plusButton = page.locator('button:has-text("+")');
    await expect(plusButton).toBeDisabled();
  });

  test('shows booking summary on confirm step', async ({ page }) => {
    await page.waitForSelector('.grid button');
    await page.locator('.grid button').first().click();
    await page.waitForSelector('text=meja tersedia', { timeout: 5000 });
    await page.locator('text=meja tersedia').first().locator('..').locator('..').click();
    
    // Check summary shows
    await expect(page.locator('text=Ringkasan:')).toBeVisible();
    await expect(page.locator('text=orang')).toBeVisible();
  });

  test('full booking flow with valid data creates booking', async ({ page }) => {
    await page.waitForSelector('.grid button');
    await page.locator('.grid button').first().click();
    await page.waitForSelector('text=meja tersedia', { timeout: 5000 });
    await page.locator('text=meja tersedia').first().locator('..').locator('..').click();
    
    await page.fill('input[placeholder="Nama Anda"]', 'E2E Test User');
    await page.fill('input[placeholder="081234567890"]', '081234567890');
    await page.fill('input[placeholder="email@contoh.com"]', 'e2e@test.com');
    
    // Submit booking
    await page.click('button:has-text("Konfirmasi Booking")');
    
    // Should redirect to success page
    await expect(page).toHaveURL(/\/booking\/success\?code=.+/);
    
    // Success page should show booking code
    await expect(page.locator('text=Booking Berhasil')).toBeVisible();
    await expect(page.locator('text=Kode booking')).toBeVisible();
    
    // Should have WhatsApp link
    await expect(page.locator('text=Konfirmasi via WhatsApp')).toBeVisible();
  });
});

test.describe('Booking API', () => {
  test('POST /api/bookings creates booking with valid data', async ({ request }) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().slice(0, 10);
    
    const response = await request.post('/api/bookings', {
      data: {
        date: dateStr,
        slotId: 1,
        partySize: 2,
        name: 'API Test',
        phone: '081234567890',
      },
    });
    
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.booking).toBeDefined();
    expect(data.booking.code).toBeDefined();
    expect(data.redirectUrl).toContain('/booking/success');
  });

  test('POST /api/bookings rejects past date', async ({ request }) => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().slice(0, 10);
    
    const response = await request.post('/api/bookings', {
      data: {
        date: dateStr,
        slotId: 1,
        partySize: 2,
        name: 'API Test',
        phone: '081234567890',
      },
    });
    
    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('Tanggal booking harus hari ini atau setelahnya');
  });

  test('POST /api/bookings rejects invalid phone', async ({ request }) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().slice(0, 10);
    
    const response = await request.post('/api/bookings', {
      data: {
        date: dateStr,
        slotId: 1,
        partySize: 2,
        name: 'API Test',
        phone: '123',
      },
    });
    
    expect(response.status()).toBe(400);
  });

  test('GET /api/bookings/slots returns available slots', async ({ request }) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().slice(0, 10);
    
    const response = await request.get(`/api/bookings/slots?date=${dateStr}`);
    
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.slots).toBeDefined();
    expect(Array.isArray(data.slots)).toBe(true);
  });

  test('GET /api/bookings/slots requires date param', async ({ request }) => {
    const response = await request.get('/api/bookings/slots');
    expect(response.status()).toBe(400);
  });
});

test.describe('Booking Status Page', () => {
  test('shows booking details with valid code and phone', async ({ page, request }) => {
    // First create a booking
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().slice(0, 10);
    
    const createResponse = await request.post('/api/bookings', {
      data: {
        date: dateStr,
        slotId: 1,
        partySize: 2,
        name: 'Status Test',
        phone: '081234567890',
      },
    });
    
    const data = await createResponse.json();
    const { code, phone } = data.booking;
    
    // Visit status page
    await page.goto(`/booking/status?code=${code}&phone=${phone}`);
    
    await expect(page.locator('text=Cek Status')).toBeVisible();
    await expect(page.locator(`text=${code}`)).toBeVisible();
    await expect(page.locator(`text=${phone}`)).toBeVisible();
    await expect(page.locator('text=Booking Meja')).toBeVisible();
  });

  test('shows error for invalid code/phone', async ({ page }) => {
    await page.goto('/booking/status?code=INVALID&phone=081234567890');
    
    await expect(page.locator('text=Kode atau nomor telepon tidak cocok')).toBeVisible();
  });
});