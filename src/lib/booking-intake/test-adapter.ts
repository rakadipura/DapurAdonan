import { BookingIntakeAdapter } from "./types";

type InMemoryBookingSlot = {
  id: number;
  name: string;
  startTime: string;
  endTime: string;
  capacity: number;
  isActive: boolean;
};

type InMemoryBooking = {
  id: number;
  code: string;
  date: Date;
  slotId: number;
  partySize: number;
  name: string;
  phone: string;
  email: string | null;
  status: string;
  cancelledAt: Date | null;
  cancelReason: string | null;
  rescheduledFromId: number | null;
  rescheduledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  noShowAt: Date | null;
};

type InMemoryProduct = {
  id: number;
  name: string;
  imageUrl: string | null;
  basePrice: number;
  dailyStock: number | null;
  isAvailable: boolean;
  leadTimeDays: number;
  variants: Array<{ id: number; name: string; priceDiff: number }>;
  addOns: Array<{ id: number; name: string; price: number; isRequired: boolean }>;
};

type InMemoryOrder = {
  id: number;
  code: string;
  status: string;
  type: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  pickupDate: Date | null;
  pickupWindow: string | null;
  deliveryAddress: string | null;
  deliveryZone: string | null;
  deliveryFee: number;
  notes: string | null;
  isCustomCake: boolean;
  customText: string | null;
  customDesign: string | null;
  customPhotoUrl: string | null;
  paymentMethod: string;
  isPaid: boolean;
  paymentProofUrl: string | null;
  total: number;
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
  bookingId: number | null;
};

type InMemoryOrderItem = {
  id: number;
  orderId: number;
  productId: number;
  variantId: number | null;
  qty: number;
  notes: string | null;
  selectedAddOns: string[];
  addOnsPrice: number;
  price: number;
  createdAt: Date;
};

export function createTestAdapter(overrides: {
  slots?: InMemoryBookingSlot[];
  products?: InMemoryProduct[];
  bookings?: InMemoryBooking[];
  orders?: InMemoryOrder[];
  orderItems?: InMemoryOrderItem[];
  fixedClock?: Date;
  nextBookingId?: number;
  nextOrderId?: number;
  nextOrderItemId?: number;
} = {}): BookingIntakeAdapter {
  const slots = new Map<number, InMemoryBookingSlot>(
    (overrides.slots ?? []).map((s) => [s.id, s])
  );
  const products = new Map<number, InMemoryProduct>(
    (overrides.products ?? []).map((p) => [p.id, p])
  );
  const bookings: InMemoryBooking[] = [...(overrides.bookings ?? [])];
  const orders: InMemoryOrder[] = [...(overrides.orders ?? [])];
  const orderItems: InMemoryOrderItem[] = [...(overrides.orderItems ?? [])];

  let bookingIdSeq = overrides.nextBookingId ?? 1;
  let orderIdSeq = overrides.nextOrderId ?? 1;
  let orderItemIdSeq = overrides.nextOrderItemId ?? 1;
  let idCounter = 0;

  const fixedClock = overrides.fixedClock ?? new Date("2025-01-15T00:00:00+07:00");

  return {
    prisma: {
      bookingSlot: {
        findUnique: async ({ where: { id } }) => slots.get(id) ?? null,
      },
booking: {
        create: async ({ data, include }: any) => {
          const booking: InMemoryBooking = {
            id: bookingIdSeq++,
            code: data.code as string,
            date: data.date as Date,
            slotId: data.slotId as number,
            partySize: data.partySize as number,
            name: data.name as string,
            phone: data.phone as string,
            email: data.email as string | null,
            status: data.status as string,
            cancelledAt: null,
            cancelReason: null,
            rescheduledFromId: null,
            rescheduledAt: null,
            createdAt: data.createdAt as Date,
            updatedAt: data.updatedAt as Date,
            noShowAt: null,
          };
          bookings.push(booking);

          const slot = slots.get(booking.slotId)!;
          return {
            id: booking.id,
            code: booking.code,
            date: booking.date,
            slotId: booking.slotId,
            partySize: booking.partySize,
            name: booking.name,
            phone: booking.phone,
            email: booking.email,
            status: booking.status,
            cancelledAt: booking.cancelledAt,
            cancelReason: booking.cancelReason,
            rescheduledFromId: booking.rescheduledFromId,
            rescheduledAt: booking.rescheduledAt,
            createdAt: booking.createdAt,
            updatedAt: booking.updatedAt,
            noShowAt: booking.noShowAt,
            slot: include?.slot?.select
              ? { id: slot.id, name: slot.name, startTime: slot.startTime, endTime: slot.endTime }
              : undefined,
          } as any;
        },
        findMany: async ({ where, select }: any) => {
          let result = [...bookings];

          if (where.date) {
            const targetDate = where.date as Date;
            result = result.filter((b) =>
              b.date.getTime() === targetDate.getTime()
            );
          }
          if (where.slotId) {
            result = result.filter((b) => b.slotId === where.slotId);
          }
          if (where.status?.notIn) {
            const excluded = where.status.notIn as string[];
            result = result.filter((b) => !excluded.includes(b.status));
          }

          return result.map((b) => {
            const slot = slots.get(b.slotId);
            const out: any = {};
            if (select?.slotId) out.slotId = b.slotId;
            if (select?.partySize) out.partySize = b.partySize;
            if (select?.status) out.status = b.status;
            if (select?.id) out.id = b.id;
            if (select?.slot && slot) {
              out.slot = { id: slot.id, name: slot.name, startTime: slot.startTime, endTime: slot.endTime };
            }
            return out;
          });
        },
      },
      product: {
        findMany: async ({ where, select }: any) => {
          if (!where.id?.in) return [];
          return (where.id.in as number[])
            .map((id) => products.get(id))
            .filter((p): p is InMemoryProduct => p !== undefined);
        },
      },
      order: {
        create: async ({ data, include }) => {
          const order: InMemoryOrder = {
            id: orderIdSeq++,
            code: data.code as string,
            status: data.status as string,
            type: data.type as string,
            customerName: data.customerName as string,
            customerPhone: data.customerPhone as string,
            customerEmail: data.customerEmail as string | null,
            pickupDate: data.pickupDate as Date | null,
            pickupWindow: data.pickupWindow as string | null,
            deliveryAddress: data.deliveryAddress as string | null,
            deliveryZone: data.deliveryZone as string | null,
            deliveryFee: data.deliveryFee as number,
            notes: data.notes as string | null,
            isCustomCake: data.isCustomCake as boolean,
            customText: data.customText as string | null,
            customDesign: data.customDesign as string | null,
            customPhotoUrl: data.customPhotoUrl as string | null,
            paymentMethod: data.paymentMethod as string,
            isPaid: data.isPaid as boolean,
            paymentProofUrl: data.paymentProofUrl as string | null,
            total: data.total as number,
            createdAt: data.createdAt as Date,
            updatedAt: new Date(),
            completedAt: null,
            bookingId: data.bookingId as number | null,
          };
          orders.push(order);

          const itemsData = (data as any).itemsOrder?.create ?? [];
          const items = itemsData.map((itemData: any) => {
            const product = products.get(itemData.productId)!;
            const variant = itemData.variantId
              ? product.variants.find((v) => v.id === itemData.variantId) ?? null
              : null;
            const orderItem: InMemoryOrderItem = {
              id: orderItemIdSeq++,
              orderId: order.id,
              productId: itemData.productId,
              variantId: itemData.variantId ?? null,
              qty: itemData.qty,
              notes: itemData.notes ?? null,
              selectedAddOns: itemData.selectedAddOns ?? [],
              addOnsPrice: itemData.addOnsPrice ?? 0,
              price: itemData.price,
              createdAt: new Date(),
            };
            orderItems.push(orderItem);
            return {
              id: orderItem.id,
              productId: orderItem.productId,
              variantId: orderItem.variantId,
              qty: orderItem.qty,
              notes: orderItem.notes,
              selectedAddOns: orderItem.selectedAddOns,
              addOnsPrice: orderItem.addOnsPrice,
              price: orderItem.price,
              product: { name: product.name, imageUrl: product.imageUrl },
              variant: variant ? { name: variant.name, priceDiff: variant.priceDiff } : null,
            };
          });

          return {
            id: order.id,
            code: order.code,
            status: order.status,
            type: order.type,
            customerName: order.customerName,
            customerPhone: order.customerPhone,
            customerEmail: order.customerEmail,
            pickupDate: order.pickupDate?.toISOString().slice(0, 10) ?? null,
            pickupWindow: order.pickupWindow,
            deliveryAddress: order.deliveryAddress,
            deliveryZone: order.deliveryZone,
            deliveryFee: order.deliveryFee,
            notes: order.notes,
            isCustomCake: order.isCustomCake,
            customText: order.customText,
            customDesign: order.customDesign,
            customPhotoUrl: order.customPhotoUrl,
            paymentMethod: order.paymentMethod,
            isPaid: order.isPaid,
            paymentProofUrl: order.paymentProofUrl,
            total: order.total,
            createdAt: order.createdAt,
            updatedAt: order.updatedAt,
            completedAt: order.completedAt,
            bookingId: order.bookingId,
            itemsOrder: items,
          } as any;
        },
      },
      orderItem: {
        groupBy: async ({ where, _sum }: any) => {
          if (!where.productId || !where.order) return [{ _sum: { qty: null } }];
          const filtered = orderItems.filter(
            (oi) =>
              oi.productId === where.productId &&
              oi.orderId > 0 &&
              orders.some(
                (o) =>
                  o.id === oi.orderId &&
                  (where.order.status?.in as string[]).includes(o.status) &&
                  o.createdAt >= (where.order.createdAt.gte as Date) &&
                  o.createdAt < (where.order.createdAt.lt as Date)
              )
          );
          const sum = filtered.reduce((acc, oi) => acc + oi.qty, 0);
          return [{ _sum: { qty: sum } }];
        },
      },
      $queryRaw: async () => {},
    },
    settings: {
      getBookingLeadHours: async () => 2,
    },
    contact: {
      normalizePhone: (raw) => raw.replace(/^0/, "+62"),
      validatePhone: (raw) => {
        const normalized = raw.replace(/^0/, "+62");
        return { valid: /^\+628[0-9]{8,11}$/.test(normalized), normalized };
      },
      validateEmail: (raw) => ({ valid: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw) }),
    },
    idGenerator: () => {
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      let code = "";
      for (let i = 0; i < 8; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
      }
      return code;
    },
    clock: () => fixedClock,
    $transaction: async <T>(fn: (tx: any) => Promise<T>) => {
      return fn({
        $queryRaw: async () => {},
        orderItem: {
          groupBy: async ({ where, _sum }: any) => {
            if (!where.productId || !where.order) return [{ _sum: { qty: null } }];
            const filtered = orderItems.filter(
              (oi) =>
                oi.productId === where.productId &&
                oi.orderId > 0 &&
                orders.some(
                  (o) =>
                    o.id === oi.orderId &&
                    (where.order.status?.in as string[]).includes(o.status) &&
                    o.createdAt >= (where.order.createdAt.gte as Date) &&
                    o.createdAt < (where.order.createdAt.lt as Date)
                )
            );
            const sum = filtered.reduce((acc, oi) => acc + oi.qty, 0);
            return [{ _sum: { qty: sum } }];
          },
        },
        booking: {
          create: async ({ data, include }: any) => {
            const booking: InMemoryBooking = {
              id: bookingIdSeq++,
              code: data.code as string,
              date: data.date as Date,
              slotId: data.slotId as number,
              partySize: data.partySize as number,
              name: data.name as string,
              phone: data.phone as string,
              email: data.email as string | null,
              status: data.status as string,
              cancelledAt: null,
              cancelReason: null,
              rescheduledFromId: null,
              rescheduledAt: null,
              createdAt: data.createdAt as Date,
              updatedAt: data.updatedAt as Date,
              noShowAt: null,
            };
            bookings.push(booking);

            const slot = slots.get(booking.slotId)!;
            return {
              id: booking.id,
              code: booking.code,
              date: booking.date,
              slotId: booking.slotId,
              partySize: booking.partySize,
              name: booking.name,
              phone: booking.phone,
              email: booking.email,
              status: booking.status,
              cancelledAt: booking.cancelledAt,
              cancelReason: booking.cancelReason,
              rescheduledFromId: booking.rescheduledFromId,
              rescheduledAt: booking.rescheduledAt,
              createdAt: booking.createdAt,
              updatedAt: booking.updatedAt,
              noShowAt: booking.noShowAt,
              slot: include?.slot?.select
                ? { id: slot.id, name: slot.name, startTime: slot.startTime, endTime: slot.endTime }
                : undefined,
            } as any;
          },
        },
        order: {
          create: async ({ data, include }: any) => {
            const order: InMemoryOrder = {
              id: orderIdSeq++,
              code: data.code as string,
              status: data.status as string,
              type: data.type as string,
              customerName: data.customerName as string,
              customerPhone: data.customerPhone as string,
              customerEmail: data.customerEmail as string | null,
              pickupDate: data.pickupDate as Date | null,
              pickupWindow: data.pickupWindow as string | null,
              deliveryAddress: data.deliveryAddress as string | null,
              deliveryZone: data.deliveryZone as string | null,
              deliveryFee: data.deliveryFee as number,
              notes: data.notes as string | null,
              isCustomCake: data.isCustomCake as boolean,
              customText: data.customText as string | null,
              customDesign: data.customDesign as string | null,
              customPhotoUrl: data.customPhotoUrl as string | null,
              paymentMethod: data.paymentMethod as string,
              isPaid: data.isPaid as boolean,
              paymentProofUrl: data.paymentProofUrl as string | null,
              total: data.total as number,
              createdAt: data.createdAt as Date,
              updatedAt: new Date(),
              completedAt: null,
              bookingId: data.bookingId as number | null,
            };
            orders.push(order);

const itemsData = (data as any).itemsOrder?.create ?? [];
const items = itemsData.map((itemData: any) => {
              const product = products.get(itemData.productId)!;
              const variant = itemData.variantId
                ? product.variants.find((v) => v.id === itemData.variantId) ?? null
                : null;
              const orderItem: InMemoryOrderItem = {
                id: orderItemIdSeq++,
                orderId: order.id,
                productId: itemData.productId,
                variantId: itemData.variantId ?? null,
                qty: itemData.qty,
                notes: itemData.notes ?? null,
                selectedAddOns: itemData.selectedAddOns ?? [],
                addOnsPrice: itemData.addOnsPrice ?? 0,
                price: itemData.price,
                createdAt: new Date(),
              };
              orderItems.push(orderItem);
              return {
                id: orderItem.id,
                productId: orderItem.productId,
                variantId: orderItem.variantId,
                qty: orderItem.qty,
                notes: orderItem.notes,
                selectedAddOns: orderItem.selectedAddOns,
                addOnsPrice: orderItem.addOnsPrice,
                price: orderItem.price,
                product: { name: product.name, imageUrl: product.imageUrl },
                variant: variant ? { name: variant.name, priceDiff: variant.priceDiff } : null,
              };
            });

            return {
              id: order.id,
              code: order.code,
              status: order.status,
              type: order.type,
              customerName: order.customerName,
              customerPhone: order.customerPhone,
              customerEmail: order.customerEmail,
              pickupDate: order.pickupDate?.toISOString().slice(0, 10) ?? null,
              pickupWindow: order.pickupWindow,
              deliveryAddress: order.deliveryAddress,
              deliveryZone: order.deliveryZone,
              deliveryFee: order.deliveryFee,
              notes: order.notes,
              isCustomCake: order.isCustomCake,
              customText: order.customText,
              customDesign: order.customDesign,
              customPhotoUrl: order.customPhotoUrl,
              paymentMethod: order.paymentMethod,
              isPaid: order.isPaid,
              paymentProofUrl: order.paymentProofUrl,
              total: order.total,
              createdAt: order.createdAt,
              updatedAt: order.updatedAt,
              completedAt: order.completedAt,
              bookingId: order.bookingId,
              itemsOrder: items,
            } as any;
          },
        },
      });
    },
  };
}