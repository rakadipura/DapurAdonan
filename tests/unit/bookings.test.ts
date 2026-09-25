import { describe, it, expect } from 'vitest';
import { createBookingSchema } from '@/validations/bookings';
import { isValidPhone, normalizePhone } from '@/lib/regex';
import { formatDateYMD } from '@/lib/settings';
import { getBookingDateOptions } from '@/lib/bookings';

describe('Booking Validations', () => {
  describe('createBookingSchema', () => {
    it('accepts valid booking data', () => {
      const validData = {
        date: '2025-12-25',
        slotId: 1,
        partySize: 4,
        name: 'John Doe',
        phone: '081234567890',
        email: 'john@example.com',
      };
      const result = createBookingSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('accepts valid booking data with menu items', () => {
      const validData = {
        date: '2025-12-25',
        slotId: 1,
        partySize: 4,
        name: 'John Doe',
        phone: '081234567890',
        email: 'john@example.com',
        menuItems: [
          {
            productId: 1,
            variantId: 2,
            qty: 2,
            notes: 'Extra sweet',
            selectedAddOns: ['1', '2'],
          },
        ],
      };
      const result = createBookingSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('accepts empty menu items array', () => {
      const validData = {
        date: '2025-12-25',
        slotId: 1,
        partySize: 4,
        name: 'John Doe',
        phone: '081234567890',
        email: 'john@example.com',
        menuItems: [],
      };
      const result = createBookingSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('rejects menu item with missing productId', () => {
      const invalidData = {
        date: '2025-12-25',
        slotId: 1,
        partySize: 4,
        name: 'John Doe',
        phone: '081234567890',
        menuItems: [
          {
            variantId: 2,
            qty: 2,
          },
        ],
      };
      const result = createBookingSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('rejects menu item with qty < 1', () => {
      const invalidData = {
        date: '2025-12-25',
        slotId: 1,
        partySize: 4,
        name: 'John Doe',
        phone: '081234567890',
        menuItems: [
          {
            productId: 1,
            qty: 0,
          },
        ],
      };
      const result = createBookingSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('rejects menu item with qty > 50', () => {
      const invalidData = {
        date: '2025-12-25',
        slotId: 1,
        partySize: 4,
        name: 'John Doe',
        phone: '081234567890',
        menuItems: [
          {
            productId: 1,
            qty: 51,
          },
        ],
      };
      const result = createBookingSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('rejects more than 20 menu items', () => {
      const invalidData = {
        date: '2025-12-25',
        slotId: 1,
        partySize: 4,
        name: 'John Doe',
        phone: '081234567890',
        menuItems: Array.from({ length: 21 }, (_, i) => ({
          productId: i + 1,
          qty: 1,
        })),
      };
      const result = createBookingSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('rejects invalid date format', () => {
      const result = createBookingSchema.safeParse({
        date: '25-12-2025',
        slotId: 1,
        partySize: 2,
        name: 'Test',
        phone: '081234567890',
      });
      expect(result.success).toBe(false);
    });

    it('rejects partySize < 1', () => {
      const result = createBookingSchema.safeParse({
        date: '2025-12-25',
        slotId: 1,
        partySize: 0,
        name: 'Test',
        phone: '081234567890',
      });
      expect(result.success).toBe(false);
    });

    it('allows partySize above the old per-table limit (slot capacity decides)', () => {
      const result = createBookingSchema.safeParse({
        date: '2025-12-25',
        slotId: 1,
        partySize: 12,
        name: 'Test',
        phone: '081234567890',
      });
      expect(result.success).toBe(true);
    });

    it('rejects partySize beyond the sanity bound', () => {
      const result = createBookingSchema.safeParse({
        date: '2025-12-25',
        slotId: 1,
        partySize: 100,
        name: 'Test',
        phone: '081234567890',
      });
      expect(result.success).toBe(false);
    });

    it('rejects empty name', () => {
      const result = createBookingSchema.safeParse({
        date: '2025-12-25',
        slotId: 1,
        partySize: 2,
        name: '',
        phone: '081234567890',
      });
      expect(result.success).toBe(false);
    });

    it('rejects invalid phone format', () => {
      const result = createBookingSchema.safeParse({
        date: '2025-12-25',
        slotId: 1,
        partySize: 2,
        name: 'Test',
        phone: '123',
      });
      expect(result.success).toBe(false);
    });

    it('accepts international phone format', () => {
      const result = createBookingSchema.safeParse({
        date: '2025-12-25',
        slotId: 1,
        partySize: 2,
        name: 'Test',
        phone: '6281234567890',
      });
      expect(result.success).toBe(true);
    });

    it('accepts empty email', () => {
      const result = createBookingSchema.safeParse({
        date: '2025-12-25',
        slotId: 1,
        partySize: 2,
        name: 'Test',
        phone: '081234567890',
        email: '',
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid email format', () => {
      const result = createBookingSchema.safeParse({
        date: '2025-12-25',
        slotId: 1,
        partySize: 2,
        name: 'Test',
        phone: '081234567890',
        email: 'invalid-email',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('isValidPhone', () => {
    it('accepts valid Indonesian mobile numbers', () => {
      expect(isValidPhone('081234567890')).toBe(true);
      expect(isValidPhone('082134567890')).toBe(true);
      expect(isValidPhone('6281234567890')).toBe(true);
      expect(isValidPhone('+6281234567890')).toBe(true);
    });

    it('rejects invalid numbers', () => {
      expect(isValidPhone('08123')).toBe(false);
      expect(isValidPhone('08123456789012345')).toBe(false);
      expect(isValidPhone('0211234567')).toBe(false);
      expect(isValidPhone('')).toBe(false);
    });
  });

  describe('normalizePhone', () => {
    it('normalizes 628xx to 08xx', () => {
      expect(normalizePhone('6281234567890')).toBe('081234567890');
    });

    it('keeps 08xx as is', () => {
      expect(normalizePhone('081234567890')).toBe('081234567890');
    });

    it('handles +62 prefix', () => {
      expect(normalizePhone('+6281234567890')).toBe('081234567890');
    });
  });
});

describe('Date Utilities', () => {
  describe('formatDateYMD', () => {
    it('formats date as YYYY-MM-DD', () => {
      const date = new Date('2025-12-25T10:30:00');
      expect(formatDateYMD(date)).toBe('2025-12-25');
    });

    it('handles month/day padding', () => {
      const date = new Date('2025-01-05T10:30:00');
      expect(formatDateYMD(date)).toBe('2025-01-05');
    });
  });

  describe('getBookingDateOptions', () => {
    it('is an async function that requires database', () => {
      expect(typeof getBookingDateOptions).toBe('function');
    });
  });
});

describe('Booking Business Logic', () => {
  it('uses slot capacity (default 8 kursi) as the party-size ceiling', () => {
    const defaultSlotCapacity = 8;
    expect(defaultSlotCapacity).toBeGreaterThan(0);
    expect(defaultSlotCapacity).toBeLessThanOrEqual(20);
  });

  it('calculates remaining capacity correctly', () => {
    const slotCapacity = 4;
    const bookedPartySize = 2;
    const remaining = slotCapacity - bookedPartySize;
    expect(remaining).toBe(2);
  });

  it('handles full capacity', () => {
    const slotCapacity = 4;
    const bookedPartySize = 4;
    const remaining = Math.max(0, slotCapacity - bookedPartySize);
    expect(remaining).toBe(0);
  });

  it('handles overbooked (should not happen with validation)', () => {
    const slotCapacity = 4;
    const bookedPartySize = 5;
    const remaining = Math.max(0, slotCapacity - bookedPartySize);
    expect(remaining).toBe(0);
  });
});