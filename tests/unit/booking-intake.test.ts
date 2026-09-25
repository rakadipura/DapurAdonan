import { describe, it, expect, beforeEach } from 'vitest';
import { BookingIntake, createTestAdapter } from '@/lib/booking-intake';
import { BookingIntakeError } from '@/lib/booking-intake/types';

describe('BookingIntake', () => {
  let adapter: ReturnType<typeof createTestAdapter>;
  let intake: BookingIntake;

  beforeEach(() => {
    adapter = createTestAdapter({
      fixedClock: new Date('2025-01-15T10:00:00+07:00'),
      slots: [
        { id: 1, name: 'Pagi', startTime: '09:00', endTime: '11:00', capacity: 8, isActive: true },
        { id: 2, name: 'Siang', startTime: '12:00', endTime: '14:00', capacity: 8, isActive: true },
      ],
      products: [
        {
          id: 1,
          name: 'Nastar',
          imageUrl: null,
          basePrice: 50000,
          dailyStock: 100,
          isAvailable: true,
          leadTimeDays: 0,
          variants: [{ id: 1, name: 'Small', priceDiff: 0 }, { id: 2, name: 'Large', priceDiff: 20000 }],
          addOns: [{ id: 1, name: 'Custom message', price: 5000, isRequired: false }],
        },
        {
          id: 2,
          name: 'Custom Cake',
          imageUrl: null,
          basePrice: 200000,
          dailyStock: 5,
          isAvailable: true,
          leadTimeDays: 2,
          variants: [{ id: 3, name: 'Regular', priceDiff: 0 }],
          addOns: [{ id: 2, name: 'Custom text', price: 10000, isRequired: true }],
        },
      ],
    });
    intake = new BookingIntake(adapter);
  });

  describe('accept - basic booking without menu', () => {
    it('creates booking with valid data', async () => {
      const result = await intake.accept({
        date: '2025-01-16',
        slotId: 1,
        partySize: 4,
        name: 'Test User',
        phone: '081234567890',
        email: 'test@example.com',
      });

      expect(result.booking).toBeDefined();
      expect(result.booking.code).toMatch(/^[A-Z0-9]{8}$/);
      expect(result.booking.partySize).toBe(4);
      expect(result.booking.status).toBe('PENDING');
      expect(result.orders).toHaveLength(0);
    });

    it('rejects past date', async () => {
      await expect(
        intake.accept({
          date: '2025-01-13', // Before fixed clock date (2025-01-15)
          slotId: 1,
          partySize: 2,
          name: 'Test',
          phone: '081234567890',
        })
      ).rejects.toThrow(BookingIntakeError);
    });

    it('rejects inactive slot', async () => {
      const inactiveAdapter = createTestAdapter({
        fixedClock: new Date('2025-01-15T10:00:00+07:00'),
        slots: [{ id: 1, name: 'Pagi', startTime: '09:00', endTime: '11:00', capacity: 8, isActive: false }],
        products: [],
      });
      const inactiveIntake = new BookingIntake(inactiveAdapter);

      await expect(
        inactiveIntake.accept({
          date: '2025-01-16',
          slotId: 1,
          partySize: 2,
          name: 'Test',
          phone: '081234567890',
        })
      ).rejects.toThrow(BookingIntakeError);
    });

    it('rejects party size exceeding slot capacity', async () => {
      await expect(
        intake.accept({
          date: '2025-01-16',
          slotId: 1,
          partySize: 9,
          name: 'Test',
          phone: '081234567890',
        })
      ).rejects.toThrow(BookingIntakeError);
    });

    it('rejects invalid phone', async () => {
      await expect(
        intake.accept({
          date: '2025-01-16',
          slotId: 1,
          partySize: 2,
          name: 'Test',
          phone: '123',
        })
      ).rejects.toThrow(BookingIntakeError);
    });

    it('rejects invalid email', async () => {
      await expect(
        intake.accept({
          date: '2025-01-16',
          slotId: 1,
          partySize: 2,
          name: 'Test',
          phone: '081234567890',
          email: 'invalid-email',
        })
      ).rejects.toThrow(BookingIntakeError);
    });
  });

  describe('accept - with menu items', () => {
    it('creates booking with menu items (pre-orders)', async () => {
      const result = await intake.accept({
        date: '2025-01-16',
        slotId: 1,
        partySize: 4,
        name: 'Test User',
        phone: '081234567890',
        menuItems: [
          { productId: 1, variantId: 1, qty: 2 },
        ],
      });

      expect(result.booking).toBeDefined();
      expect(result.orders).toHaveLength(1);
      expect(result.orders[0].code).toMatch(/^[A-Z0-9]{8}$/);
      expect(result.orders[0].total).toBe(100000); // 50000 * 2
      expect(result.orders[0].bookingId).toBe(result.booking.id);
    });

    it('creates booking with multiple menu items', async () => {
      const result = await intake.accept({
        date: '2025-01-16',
        slotId: 1,
        partySize: 4,
        name: 'Test User',
        phone: '081234567890',
        menuItems: [
          { productId: 1, variantId: 1, qty: 2 },
          { productId: 1, variantId: 2, qty: 1 },
        ],
      });

      expect(result.orders).toHaveLength(2);
      expect(result.orders[0].total).toBe(100000);
      expect(result.orders[1].total).toBe(70000); // 70000 * 1
    });

    it('includes add-ons in price calculation', async () => {
      const result = await intake.accept({
        date: '2025-01-16',
        slotId: 1,
        partySize: 4,
        name: 'Test User',
        phone: '081234567890',
        menuItems: [
          { productId: 1, variantId: 1, qty: 1, selectedAddOns: ['1'] },
        ],
      });

      expect(result.orders[0].total).toBe(55000); // 50000 + 5000
    });

    it('rejects invalid productId in menu', async () => {
      await expect(
        intake.accept({
          date: '2025-01-16',
          slotId: 1,
          partySize: 4,
          name: 'Test',
          phone: '081234567890',
          menuItems: [{ productId: 999, qty: 1 }],
        })
      ).rejects.toThrow(BookingIntakeError);
    });

    it('rejects unavailable product in menu', async () => {
      const unavailableAdapter = createTestAdapter({
        fixedClock: new Date('2025-01-15T10:00:00+07:00'),
        slots: [{ id: 1, name: 'Pagi', startTime: '09:00', endTime: '11:00', capacity: 8, isActive: true }],
        products: [{ id: 1, name: 'Nastar', imageUrl: null, basePrice: 50000, dailyStock: 100, isAvailable: false, leadTimeDays: 0, variants: [], addOns: [] }],
      });
      const unavailableIntake = new BookingIntake(unavailableAdapter);

      await expect(
        unavailableIntake.accept({
          date: '2025-01-16',
          slotId: 1,
          partySize: 4,
          name: 'Test',
          phone: '081234567890',
          menuItems: [{ productId: 1, qty: 1 }],
        })
      ).rejects.toThrow(BookingIntakeError);
    });

    it('rejects invalid variant for product', async () => {
      await expect(
        intake.accept({
          date: '2025-01-16',
          slotId: 1,
          partySize: 4,
          name: 'Test',
          phone: '081234567890',
          menuItems: [{ productId: 1, variantId: 999, qty: 1 }],
        })
      ).rejects.toThrow(BookingIntakeError);
    });

    it('rejects missing required add-on', async () => {
      await expect(
        intake.accept({
          date: '2025-01-16',
          slotId: 1,
          partySize: 4,
          name: 'Test',
          phone: '081234567890',
          menuItems: [{ productId: 2, variantId: 3, qty: 1, selectedAddOns: [] }],
        })
      ).rejects.toThrow(BookingIntakeError);
    });

    it('accepts required add-on when provided', async () => {
      const result = await intake.accept({
        date: '2025-01-17', // 2 days ahead for leadTimeDays=2
        slotId: 1,
        partySize: 4,
        name: 'Test',
        phone: '081234567890',
        menuItems: [{ productId: 2, variantId: 3, qty: 1, selectedAddOns: ['2'] }],
      });

      expect(result.orders[0].total).toBe(210000); // 200000 + 10000
    });

    it('rejects menu item exceeding daily stock', async () => {
      const lowStockAdapter = createTestAdapter({
        fixedClock: new Date('2025-01-15T10:00:00+07:00'),
        slots: [{ id: 1, name: 'Pagi', startTime: '09:00', endTime: '11:00', capacity: 8, isActive: true }],
        products: [{ id: 1, name: 'Nastar', imageUrl: null, basePrice: 50000, dailyStock: 2, isAvailable: true, leadTimeDays: 0, variants: [{ id: 1, name: 'Small', priceDiff: 0 }], addOns: [] }],
      });
      const lowStockIntake = new BookingIntake(lowStockAdapter);

      await expect(
        lowStockIntake.accept({
          date: '2025-01-16',
          slotId: 1,
          partySize: 4,
          name: 'Test',
          phone: '081234567890',
          menuItems: [{ productId: 1, variantId: 1, qty: 5 }],
        })
      ).rejects.toThrow(BookingIntakeError);
    });

    it('rejects lead time violation for custom cake', async () => {
      // Lead time is 2 days, booking for tomorrow (1 day ahead)
      await expect(
        intake.accept({
          date: '2025-01-16',
          slotId: 1,
          partySize: 4,
          name: 'Test',
          phone: '081234567890',
          menuItems: [{ productId: 2, variantId: 3, qty: 1, selectedAddOns: ['2'] }],
        })
      ).rejects.toThrow(BookingIntakeError);
    });

    it('accepts custom cake with sufficient lead time', async () => {
      // Lead time is 2 days, booking for day after tomorrow (2 days ahead)
      const result = await intake.accept({
        date: '2025-01-17',
        slotId: 1,
        partySize: 4,
        name: 'Test',
        phone: '081234567890',
        menuItems: [{ productId: 2, variantId: 3, qty: 1, selectedAddOns: ['2'] }],
      });

      expect(result.orders).toHaveLength(1);
    });

    it('reserves stock for menu items (prevents double booking)', async () => {
      // First booking uses 3 units of daily stock (capacity 5)
      await intake.accept({
        date: '2025-01-17', // 2 days ahead for leadTimeDays=2
        slotId: 1,
        partySize: 2,
        name: 'User 1',
        phone: '081234567890',
        menuItems: [{ productId: 2, variantId: 3, qty: 3, selectedAddOns: ['2'] }],
      });

      // Second booking tries to use remaining 2 units
      await expect(
        intake.accept({
          date: '2025-01-17',
          slotId: 1,
          partySize: 2,
          name: 'User 2',
          phone: '081234567891',
          menuItems: [{ productId: 2, variantId: 3, qty: 3, selectedAddOns: ['2'] }],
        })
      ).rejects.toThrow(BookingIntakeError);
    });

    it('enforces party size limit from slot capacity', async () => {
      // Slot capacity is 8
      await expect(
        intake.accept({
          date: '2025-01-16',
          slotId: 1,
          partySize: 8,
          name: 'Test',
          phone: '081234567890',
          menuItems: [{ productId: 1, variantId: 1, qty: 1 }],
        })
      ).resolves.toBeDefined();

      // 9 should fail
      await expect(
        intake.accept({
          date: '2025-01-16',
          slotId: 1,
          partySize: 9,
          name: 'Test',
          phone: '081234567890',
          menuItems: [{ productId: 1, variantId: 1, qty: 1 }],
        })
      ).rejects.toThrow(BookingIntakeError);
    });
  });

  describe('phone normalization', () => {
    it('normalizes phone in acceptance', async () => {
      const result = await intake.accept({
        date: '2025-01-16',
        slotId: 1,
        partySize: 2,
        name: 'Test',
        phone: '+6281234567890',
      });

      expect(result.booking.phone).toBe('+6281234567890');
    });
  });
});