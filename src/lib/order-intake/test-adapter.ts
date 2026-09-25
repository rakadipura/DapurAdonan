import type {
  OrderIntakeAdapter,
  ProductData,
  PickupWindow,
  DeliveryZone,
  ContactValidator,
  OrderCreateData,
  OrderWithItems,
  TransactionLike,
  StockCheckWhere,
} from "./types";

export function createTestAdapter(overrides: Partial<{
  products: ProductData[];
  orders: OrderWithItems[];
  pickupWindows: PickupWindow[];
  deliveryZones: DeliveryZone[];
  cutoffHour: number;
  clock: Date;
  idCounter: number;
}> = {}): OrderIntakeAdapter {
  const products = new Map<number, ProductData>(
    (overrides.products ?? []).map((p) => [p.id, p])
  );
  const orders: OrderWithItems[] = overrides.orders ?? [];
  let idCounter = overrides.idCounter ?? 1;
  const fixedClock = overrides.clock ?? new Date("2025-01-15T10:00:00+07:00");

  const pickupWindows = overrides.pickupWindows ?? [
    { start: "09:00", end: "11:00" },
    { start: "12:00", end: "14:00" },
    { start: "17:00", end: "19:00" },
  ];

  const deliveryZones = overrides.deliveryZones ?? [
    { zone: "zone1", baseFee: 15000, perKm: 2000, maxKm: 10, freeMin: 200000 },
    { zone: "zone2", baseFee: 25000, perKm: 2000, maxKm: 20, freeMin: 300000 },
    { zone: "car", baseFee: 35000, perKm: 3000, maxKm: 30, freeMin: 500000 },
  ];

  const cutoffHour = overrides.cutoffHour ?? 16;

  function createTxAdapter(): TransactionLike {
    return {
      $queryRaw: async () => {},
      orderItem: {
        groupBy: async (args: Record<string, unknown>) => {
          const where = (args as { where: StockCheckWhere }).where;
          const productId = where.productId;
          const relevantOrders = orders.filter(
            (o) =>
              o.items.some((i) => i.productId === productId) &&
              ["PENDING", "CONFIRMED", "BAKING", "READY", "COMPLETED"].includes(o.status) &&
              o.createdAt >= where.order.createdAt.gte &&
              o.createdAt < where.order.createdAt.lt
          );
          const totalQty = relevantOrders.reduce(
            (sum, o) => sum + o.items.filter((i) => i.productId === productId).reduce((s, i) => s + i.qty, 0),
            0
          );
          return [{ _sum: { qty: totalQty } }];
        },
      },
      order: {
        create: async (args: { data: Record<string, unknown>; include: Record<string, unknown> }) => {
          const data = args.data as unknown as OrderCreateData;
          const order: OrderWithItems = {
            id: idCounter++,
            code: data.code,
            status: data.status,
            type: data.type,
            customerName: data.customerName,
            customerPhone: data.customerPhone,
            customerEmail: data.customerEmail,
            pickupDate: data.pickupDate?.toISOString().slice(0, 10) ?? null,
            pickupWindow: data.pickupWindow,
            deliveryAddress: data.deliveryAddress,
            deliveryZone: data.deliveryZone,
            deliveryFee: data.deliveryFee,
            notes: data.notes,
            isCustomCake: data.isCustomCake,
            customText: data.customText,
            customDesign: data.customDesign,
            customPhotoUrl: data.customPhotoUrl,
            paymentMethod: data.paymentMethod,
            isPaid: data.isPaid,
            paymentProofUrl: data.paymentProofUrl,
            total: data.total,
            createdAt: data.createdAt,
            completedAt: null,
            items: data.itemsOrder.create.map((item, idx) => {
              const product = products.get(item.productId);
              const variant = product?.variants.find((v: { id: number; name: string; priceDiff: number }) => v.id === item.variantId);
              return {
                id: idx + 1,
                productId: item.productId,
                variantId: item.variantId ?? null,
                productName: product?.name ?? "Unknown",
                variantName: variant?.name ?? null,
                productImageUrl: product?.imageUrl ?? null,
                qty: item.qty,
                notes: item.notes,
                selectedAddOns: item.selectedAddOns,
                addOnsPrice: item.addOnsPrice,
                price: item.price,
                lineTotal: item.qty * item.price + item.addOnsPrice,
              };
            }),
          };
          orders.push(order);
          return order;
        },
      },
    };
  }

  const prismaAdapter = {
    product: {
      findUnique: async ({ where, select }: { where: { id: number }; select: Record<string, unknown> }) => {
        const product = products.get(where.id);
        return product ?? null;
      },
      findMany: async ({ where }: { where: { id: { in: number[] } }; select: Record<string, unknown> }) => {
        return Array.from(products.values()).filter((p) => where.id.in.includes(p.id));
      },
    },
    order: {
      create: async (args: { data: Record<string, unknown>; include: Record<string, unknown> }) => {
        const tx = createTxAdapter();
        return tx.order.create(args);
      },
    },
    orderItem: {
      groupBy: async (args: Record<string, unknown>) => {
        const where = (args as { where: StockCheckWhere }).where;
        const productId = where.productId;
        const relevantOrders = orders.filter(
          (o) =>
            o.items.some((i) => i.productId === productId) &&
            ["PENDING", "CONFIRMED", "BAKING", "READY", "COMPLETED"].includes(o.status) &&
            o.createdAt >= where.order.createdAt.gte &&
            o.createdAt < where.order.createdAt.lt
        );
        const totalQty = relevantOrders.reduce(
          (sum, o) => sum + o.items.filter((i) => i.productId === productId).reduce((s, i) => s + i.qty, 0),
          0
        );
        return [{ _sum: { qty: totalQty } }];
      },
    },
    $transaction: async <T>(fn: (tx: TransactionLike) => Promise<T>) => {
      const tx = createTxAdapter();
      return fn(tx);
    },
    $queryRaw: async () => {},
  };

  return {
    prisma: prismaAdapter,
    settings: {
      getPickupWindows: async () => pickupWindows,
      getDeliveryZones: async () => deliveryZones,
      getOrderCutoffHour: async () => cutoffHour,
    },
    contact: {
      normalizePhone: (raw: string) => {
        const digits = raw.replace(/\D/g, "");
        if (digits.startsWith("62")) return "0" + digits.slice(2);
        return digits;
      },
      validatePhone: (raw: string) => {
        const normalized = raw.replace(/\D/g, "");
        const valid = /^(08|628)[0-9]{6,11}$/.test(normalized);
        return {
          valid,
          normalized: valid ? (normalized.startsWith("62") ? "0" + normalized.slice(2) : normalized) : raw,
          error: valid ? undefined : "Invalid phone",
        };
      },
      validateEmail: (raw: string) => {
        const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw);
        return { valid, error: valid ? undefined : "Invalid email" };
      },
    },
    idGenerator: () => `ORD-${String(idCounter++).padStart(3, "0")}`,
    clock: () => new Date(fixedClock),
    $transaction: prismaAdapter.$transaction,
  };
}

export type { OrderWithItems, ProductData };