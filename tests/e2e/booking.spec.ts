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

    // The old per-table limit note is gone
    await expect(page.locator('text=orang per meja')).toHaveCount(0);
  });

  test('can select date and proceed to slot selection', async ({ page }) => {
    // Wait for date options to load
    await page.waitForSelector('button:has-text("Pilih Tanggal") + div button, .grid button');
    
    // Click first available (enabled) date
    const firstDateButton = page.locator('.grid button:not([disabled])').first();
    await firstDateButton.click();
    
    // Should show slot selection step
    await expect(page.locator('text=Pilih Jam & Jumlah Orang')).toBeVisible();
  });

  test('shows available slots after date selection', async ({ page }) => {
    await page.waitForSelector('.grid button');
    const firstDateButton = page.locator('.grid button:not([disabled])').first();
    await firstDateButton.click();
    
    // Should show slot options with seat availability
    await expect(page.locator('text=Waktu')).toBeVisible();
    await expect(page.locator('text=kursi tersedia').first()).toBeVisible({ timeout: 5000 });
  });

  test('can select slot and proceed to contact form', async ({ page }) => {
    await page.waitForSelector('.grid button');
    const firstDateButton = page.locator('.grid button:not([disabled])').first();
    await firstDateButton.click();
    
    // Wait for slots to load
    await page.waitForSelector('text=kursi tersedia', { timeout: 5000 });
    
    // Click first available slot (the label's parent is the slot button)
    const availableSlot = page.locator('text=kursi tersedia').first().locator('..');
    await availableSlot.click();
    
    // Should show contact form step
    await expect(page.locator('text=Masukkan Info Kontak & Konfirmasi')).toBeVisible();
  });

  test('validates required fields in contact form', async ({ page }) => {
    await page.waitForSelector('.grid button');
    await page.locator('.grid button:not([disabled])').first().click();
    await page.waitForSelector('text=kursi tersedia', { timeout: 5000 });
    await page.locator('text=kursi tersedia').first().locator('..').click();

    // Wait for confirm step
    await expect(page.locator('text=Masukkan Info Kontak & Konfirmasi')).toBeVisible();
    
    // Fill name and invalid phone to enable button
    await page.fill('input[placeholder="Nama Anda"]', 'Test User');
    await page.fill('input[placeholder="081234567890"]', '123');
    
    // Try to submit
    await page.click('button:has-text("Konfirmasi Booking")');
    
    // Should show phone validation error
    await expect(page.locator('text=Nomor telepon tidak valid')).toBeVisible({ timeout: 3000 });
  });

  test('validates phone number format', async ({ page }) => {
    await page.waitForSelector('.grid button');
    await page.locator('.grid button:not([disabled])').first().click();
    await page.waitForSelector('text=kursi tersedia', { timeout: 5000 });
    await page.locator('text=kursi tersedia').first().locator('..').click();

    // Wait for confirm step
    await expect(page.locator('text=Masukkan Info Kontak & Konfirmasi')).toBeVisible();

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
    await page.locator('.grid button:not([disabled])').first().click();
    await page.waitForSelector('text=kursi tersedia', { timeout: 5000 });
    await page.locator('text=kursi tersedia').first().locator('..').click();

    // Wait for confirm step
    await expect(page.locator('text=Masukkan Info Kontak & Konfirmasi')).toBeVisible();

    await page.fill('input[placeholder="Nama Anda"]', 'Test User');
    await page.fill('input[placeholder="081234567890"]', '081234567890');
    
    // Should not show phone error
    await expect(page.locator('text=Nomor telepon tidak valid')).not.toBeVisible();
  });

  test('party size controls work', async ({ page }) => {
    await page.waitForSelector('.grid button');
    await page.locator('.grid button:not([disabled])').first().click();

    // Wait for details step (slot selection + party size)
    await expect(page.locator('text=Pilih Jam & Jumlah Orang')).toBeVisible();

    // Check default party size
    // The party size span is in the flex div with +/- buttons, not the date span
    const partySizeDisplay = page.locator('button:has-text("+")').locator('..').locator('span').first();
    await expect(partySizeDisplay).toContainText('2');
    
    // Increase party size
    await page.click('button:has-text("+")');
    await expect(partySizeDisplay).toContainText('3');
    
    // Decrease party size
    await page.click('button:has-text("−")');
    await expect(partySizeDisplay).toContainText('2');
  });

  test('kursi tersedia drops as jumlah orang increases', async ({ page }) => {
    await page.waitForSelector('.grid button');
    await page.locator('.grid button:not([disabled])').first().click();

    // Wait for details step
    await expect(page.locator('text=Pilih Jam & Jumlah Orang')).toBeVisible();

    const seats = page.locator('text=kursi tersedia').first();
    const initialText = (await seats.textContent()) ?? '';
    const initialSeats = parseInt(initialText.match(/^(\d+)/)?.[1] ?? '0', 10);
    expect(initialSeats).toBeGreaterThan(0);

    // One more person => one seat less shown on every slot
    await page.click('button:has-text("+")');
    await expect(seats).toHaveText(new RegExp(`^${initialSeats - 1} kursi tersedia$`));
  });

  test('disables party size at max (kursi tersedia)', async ({ page }) => {
    await page.waitForSelector('.grid button');
    await page.locator('.grid button:not([disabled])').first().click();

    // Wait for details step
    await expect(page.locator('text=Pilih Jam & Jumlah Orang')).toBeVisible();

    // The cap is the date's biggest free slot (slot capacity, default 8)
    const plusButton = page.locator('button:has-text("+")');
    for (let i = 0; i < 20 && !(await plusButton.isDisabled()); i++) {
      await plusButton.click();
    }

    // Plus button should now be disabled at the seat cap
    await expect(plusButton).toBeDisabled();

    // And the counter reflects the cap, never more than the seats available
    const counter = page.locator('button:has-text("+")').locator('..').locator('span').first();
    await expect(counter).toHaveText(/^\d+$/);
    const value = parseInt((await counter.textContent()) ?? '0', 10);
    expect(value).toBeGreaterThanOrEqual(1);
    expect(value).toBeLessThanOrEqual(8);
  });

  test('shows booking summary on confirm step', async ({ page }) => {
    await page.waitForSelector('.grid button');
    await page.locator('.grid button:not([disabled])').first().click();
    await page.waitForSelector('text=kursi tersedia', { timeout: 5000 });
    await page.locator('text=kursi tersedia').first().locator('..').click();

    // Wait for confirm step
    await expect(page.locator('text=Masukkan Info Kontak & Konfirmasi')).toBeVisible();

    // Check summary shows
    await expect(page.locator('text=Ringkasan:')).toBeVisible();
    await expect(page.locator('text=orang').first()).toBeVisible();
  });

  test('full booking flow with valid data creates booking', async ({ page }) => {
    await page.waitForSelector('.grid button');
    await page.locator('.grid button:not([disabled])').first().click();
    await page.waitForSelector('text=kursi tersedia', { timeout: 5000 });
    await page.locator('text=kursi tersedia').first().locator('..').click();

    // Wait for confirm step
    await expect(page.locator('text=Masukkan Info Kontak & Konfirmasi')).toBeVisible();

    await page.fill('input[placeholder="Nama Anda"]', 'E2E Test User');
    await page.fill('input[placeholder="081234567890"]', '081234567890');
    await page.fill('input[placeholder="email@contoh.com"]', 'e2e@test.com');
    
    // Submit booking
    await page.click('button:has-text("Konfirmasi Booking")');
    
    // Wait for success redirect
    await page.waitForURL(/\/booking\/success\?code=.+/, { timeout: 10000 });
    
    // Success page should show booking code
    await expect(page.locator('text=Booking Anda berhasil!')).toBeVisible();
    await expect(page.locator('text=Kode Referensi')).toBeVisible();
    
    // Should have WhatsApp link
    await expect(page.locator('text=Konfirmasi via WhatsApp')).toBeVisible();
  });
});
 
// Shared test constants
const testDate = '2026-09-25';
const apiTestDate = '2026-09-28'; // Different date for API tests to avoid conflicts
const testSlotId = 2; // Siang slot has more availability
 
async function cleanTestBookings() {
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL || 'postgresql://toko:toko@127.0.0.1:5432/toko_mini_moni?schema=public'
      }
    }
  });
  await prisma.booking.deleteMany({
    where: { date: { gte: new Date('2026-09-23') } }
  });
  await prisma.$disconnect();
}
 
test.describe('Booking API', () => {
  test.beforeAll(async () => {
    await cleanTestBookings();
  });
  
  test('POST /api/bookings creates booking with valid data', async ({ request }) => {
    const response = await request.post('/api/bookings', {
      data: {
        date: apiTestDate,
        slotId: testSlotId,
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
        slotId: testSlotId,
        partySize: 2,
        name: 'API Test',
        phone: '081234567890',
      },
    });
    
    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('Tanggal booking (');
  });

  test('POST /api/bookings rejects invalid phone', async ({ request }) => {
    const response = await request.post('/api/bookings', {
      data: {
        date: apiTestDate,
        slotId: testSlotId,
        partySize: 2,
        name: 'API Test',
        phone: '123',
      },
    });
    
    expect(response.status()).toBe(400);
  });

  test('POST /api/bookings rejects party size above slot capacity', async ({ request }) => {
    const response = await request.post('/api/bookings', {
      data: {
        date: apiTestDate,
        slotId: testSlotId,
        partySize: 99,
        name: 'API Test',
        phone: '081234567890',
      },
    });

    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('melebihi kapasitas jadwal');
  });

  test('GET /api/bookings/slots returns available slots', async ({ request }) => {
    const response = await request.get(`/api/bookings/slots?date=${apiTestDate}`);
    
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
  test.beforeAll(async () => {
    await cleanTestBookings();
  });
  // Use slotId: 1 for 2026-09-28 to avoid conflict with API tests (which use slotId: 2)
  const statusTestSlotId = 1;
  
  test('shows booking details with valid code and phone', async ({ page, request }) => {
    // First create a booking
    const createResponse = await request.post('/api/bookings', {
      data: {
        date: apiTestDate,
        slotId: statusTestSlotId,
        partySize: 2,
        name: 'Status Test',
        phone: '081234567890',
      },
    });
    
    const data = await createResponse.json();
    const { code, phone } = data.booking;
    
    // Visit status page
    await page.goto(`/booking/status?code=${code}&phone=${phone}`);
    
    await expect(page.locator('text=Kode Booking')).toBeVisible();
    await expect(page.locator(`text=${code}`)).toBeVisible();
    await expect(page.locator(`text=${phone}`)).toBeVisible();
    await expect(page.locator('text=Kelola Booking')).toBeVisible();
  });

  test('shows error for invalid code/phone', async ({ page }) => {
    await page.goto('/booking/status?code=INVALID&phone=081234567890');
    
    await expect(page.locator('text=Kode atau nomor telepon tidak cocok')).toBeVisible();
  });
});
