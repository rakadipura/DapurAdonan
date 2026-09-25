import { prisma } from "./db";
import { Prisma } from "@prisma/client";
import type { DeliveryZone, PickupWindow } from "@/types";
import {
  daysBetweenYMD,
  fromWIBString,
  parseYMD,
  wibToday,
  wibTomorrow,
} from "./settings";
import { isValidPhone, isValidEmail, normalizePhone } from "./regex";

export type OrderStatus = "PENDING" | "CONFIRMED" | "BAKING" | "READY" | "COMPLETED" | "CANCELLED";
export type OrderType = "PICKUP" | "DELIVERY";
export type PaymentMethod = "TRANSFER" | "EWALLET" | "CASH" | "QRIS";

export const ORDER_STATUSES: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "BAKING",
  "READY",
  "COMPLETED",
  "CANCELLED",
];

export interface CreateOrderInput {
  items: Array<{
    productId: number;
    variantId?: number;
    qty: number;
    notes?: string;
    selectedAddOns?: string[];
  }>;
  type: OrderType;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  pickupDate?: string;
  pickupWindow?: string;
  deliveryAddress?: string;
  deliveryZone?: string;
  paymentMethod: PaymentMethod;
  paymentProofUrl?: string;
  notes?: string;
  // custom cake fields
  isCustomCake?: boolean;
  customText?: string;
  customDesign?: string;
  customPhotoUrl?: string;
}

export interface OrderWithItems {
  id: number;
  code: string;
  status: string;
  type: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  pickupDate: string | null;
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
  completedAt: Date | null;
  bookingId: number | null;
  items: Array<{
    id: number;
    productId: number;
    variantId: number | null;
    productName: string;
    variantName: string | null;
    productImageUrl: string | null;
    qty: number;
    notes: string | null;
    selectedAddOns: string[];
    addOnsPrice: number;
    price: number;
    lineTotal: number;
  }>;
}

export async function getOrder(code: string, phone: string): Promise<OrderWithItems | null> {
  const order = await prisma.order.findUnique({
    where: { code },
    include: {
      itemsOrder: {
        include: {
          product: { select: { name: true, imageUrl: true } },
          variant: { select: { name: true, priceDiff: true } },
        },
      },
    },
  });

  if (!order) return null;
  if (order.customerPhone !== normalizePhone(phone)) return null;

  const items = order.itemsOrder.map((item: {
    id: number;
    productId: number;
    variantId: number | null;
    product: { name: string; imageUrl: string | null };
    variant: { name: string; priceDiff: number } | null;
    qty: number;
    notes: string | null;
    selectedAddOns: string[];
    addOnsPrice: number;
    price: number;
  }) => ({
    id: item.id,
    productId: item.productId,
    variantId: item.variantId,
    productName: item.product.name,
    variantName: item.variant?.name ?? null,
    productImageUrl: item.product.imageUrl,
    qty: item.qty,
    notes: item.notes,
    selectedAddOns: item.selectedAddOns || [],
    addOnsPrice: item.addOnsPrice,
    price: item.price,
    lineTotal: item.qty * item.price + item.addOnsPrice,
  }));

  return {
    id: order.id,
    code: order.code,
    status: order.status,
    type: order.type,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    customerEmail: order.customerEmail,
    pickupDate: order.pickupDate ? order.pickupDate.toISOString().slice(0, 10) : null,
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
    completedAt: order.completedAt,
    bookingId: order.bookingId,
    items,
  };
}

export async function createOrder(input: CreateOrderInput): Promise<OrderWithItems> {
  const {
    items,
    type,
    customerName,
    customerPhone,
    customerEmail,
    pickupDate,
    pickupWindow,
    deliveryAddress,
    deliveryZone,
    paymentMethod,
    paymentProofUrl,
    notes,
    isCustomCake = false,
    customText,
    customDesign,
    customPhotoUrl,
  } = input;

  if (!isValidPhone(customerPhone)) {
    throw new Error(`Nomor telepon tidak valid: "${customerPhone}". Format: 08xxxxxxxxxx atau +628xxxxxxxxxx`);
  }
  if (customerEmail && !isValidEmail(customerEmail)) {
    throw new Error(`Alamat email tidak valid: "${customerEmail}". Format: nama@domain.com`);
  }

  const orderItems: Array<{
    product: { id: number; name: string; imageUrl: string | null; basePrice: number; dailyStock: number | null; isAvailable: boolean; leadTimeDays: number };
    variant: { id: number; name: string; priceDiff: number } | null;
    addOns: Array<{ id: number; name: string; price: number; isRequired: boolean }>;
    qty: number;
    notes?: string;
    selectedAddOnIds: string[];
  }> = [];
  let subtotal = 0;

  for (const item of items) {
    const product = await prisma.product.findUnique({
      where: { id: item.productId },
      select: {
        id: true,
        name: true,
        imageUrl: true,
        basePrice: true,
        dailyStock: true,
        isAvailable: true,
        leadTimeDays: true,
        variants: { select: { id: true, name: true, priceDiff: true } },
        addOns: { select: { id: true, name: true, price: true, isRequired: true } },
      },
    });

    if (!product || !product.isAvailable) {
      throw new Error(`Produk dengan ID ${item.productId} tidak ditemukan atau tidak tersedia`);
    }

    // Validate variant if provided
    let variant: { id: number; name: string; priceDiff: number } | null = null;
    if (item.variantId) {
      variant = product.variants.find((v: { id: number; name: string; priceDiff: number }) => v.id === item.variantId) ?? null;
      if (!variant) {
        const availableVariants = product.variants.map((v) => `${v.id}:${v.name}`).join(", ");
        throw new Error(`Varian ID ${item.variantId} tidak valid untuk "${product.name}". Varian tersedia: ${availableVariants || "tidak ada"}`);
      }
    }

    // Validate selected add-ons
    const selectedAddOns = product.addOns.filter((a: { id: number; name: string; price: number; isRequired: boolean }) => item.selectedAddOns?.includes(String(a.id)));
    const requiredAddOns = product.addOns.filter((a: { id: number; name: string; price: number; isRequired: boolean }) => a.isRequired);
    for (const req of requiredAddOns) {
      if (!selectedAddOns.find((a: { id: number; name: string; price: number; isRequired: boolean }) => a.id === req.id)) {
        throw new Error(`Add-on wajib "${req.name}" (ID: ${req.id}) harus dipilih untuk produk "${product.name}"`);
      }
    }

    // Daily stock is validated inside createOrder's transaction (with the
    // product rows locked) so concurrent orders can't oversell it.
    // Validate lead time for custom cakes
    if (isCustomCake || product.leadTimeDays > 0) {
      if (pickupDate) {
        const diffDays = daysBetweenYMD(wibToday(), pickupDate);
        if (diffDays < product.leadTimeDays) {
          throw new Error(
            `Pesanan kue custom/lead time memerlukan minimal ${product.leadTimeDays} hari persiapan. Tanggal pengambilan (${pickupDate}) terlalu dekat (hanya ${diffDays} hari dari hari ini). Pilih tanggal minimal ${product.leadTimeDays} hari ke depan.`
          );
        }
      }
    }

    const basePrice = product.basePrice + (variant?.priceDiff || 0);
    const addOnsPrice = selectedAddOns.reduce((sum: number, a: { price: number }) => sum + a.price, 0);
    const lineTotal = (basePrice + addOnsPrice) * item.qty;
    subtotal += lineTotal;

    orderItems.push({
      product,
      variant,
      addOns: selectedAddOns,
      qty: item.qty,
      notes: item.notes,
      selectedAddOnIds: selectedAddOns.map((a: { id: number }) => String(a.id)),
    });
  }

  // Delivery fee
  let deliveryFee = 0;
  if (type === "DELIVERY") {
    const zones = await getDeliveryZonesRaw();
    const zone = zones.find((z) => z.zone === deliveryZone);
    if (!zone) {
      const availableZones = zones.map((z) => z.zone).join(", ");
      throw new Error(`Zona pengiriman "${deliveryZone}" tidak ditemukan. Zona tersedia: ${availableZones || "tidak ada"}`);
    }
    deliveryFee = zone.baseFee;
  }

  const total = subtotal + deliveryFee;

  // Validate pickup date / window against settings if pickup.
  if (type === "PICKUP") {
    if (!pickupDate || !pickupWindow) {
      throw new Error(`Untuk pemesanan pick-up, tanggal pengambilan (${pickupDate || "kosong"}) dan jadwal pengambilan (${pickupWindow || "kosong"}) wajib diisi`);
    }
    const windows = await getPickupWindowsRaw();
    const validWindow = windows.find((w) => `${w.start}-${w.end}` === pickupWindow);
    if (!validWindow) {
      const availableWindows = windows.map((w) => `${w.start}-${w.end}`).join(", ");
      throw new Error(`Jadwal pengambilan "${pickupWindow}" tidak tersedia. Jadwal yang valid: ${availableWindows || "tidak ada"}`);
    }
    const todayStr = wibToday();
    if (pickupDate < todayStr) {
      throw new Error(`Tanggal pengambilan (${pickupDate}) tidak valid: harus hari ini atau setelahnya. Hari ini: ${todayStr}`);
    }
  }  const orderCode = generateOrderCode();

  // Lock the product rows involved (ascending id keeps lock-acquisition order
  // consistent across transactions and avoids deadlocks) so concurrent orders
  // can't oversell limited daily stock.
  const productIds = [...new Set(items.map((i) => i.productId))].sort((a, b) => a - b);

  const order = await prisma.$transaction(async (tx) => {
    if (productIds.length > 0) {
      await tx.$queryRaw`SELECT id FROM "Product" WHERE id IN (${Prisma.join(productIds)}) FOR UPDATE`;
    }

    // Stock re-check under the lock: validation outside the transaction only
    // protects against stale data, not concurrent writers.
    const stockTodayStart = fromWIBString(wibToday());
    const stockTodayEnd = fromWIBString(wibTomorrow());

    for (const ordered of orderItems) {
      const dailyStock = ordered.product.dailyStock;
      if (dailyStock === null) continue;

      const soldToday = await tx.orderItem.groupBy({
        by: ["productId"],
        where: {
          productId: ordered.product.id,
          order: {
            status: { in: ["PENDING", "CONFIRMED", "BAKING", "READY", "COMPLETED"] },
            createdAt: { gte: stockTodayStart, lt: stockTodayEnd },
          },
        },
        _sum: { qty: true },
      });

      const soldQty = soldToday[0]?._sum.qty || 0;
      const available = dailyStock - soldQty;
      if (available <= 0) {
        throw new Error(`Stok harian untuk "${ordered.product.name}" sudah habis (stok harian: ${dailyStock}, terpakai: ${soldQty})`);
      }
      if (ordered.qty > available) {
        throw new Error(`Stok "${ordered.product.name}" tidak cukup: diminta ${ordered.qty}, tersisa ${available} (stok harian: ${dailyStock}, terpakai: ${soldQty})`);
      }
    }

    return tx.order.create({
      data: {
        code: orderCode,
        status: "PENDING",
        type,
        customerName,
        customerPhone,
        customerEmail: customerEmail || null,
        pickupDate: pickupDate ? parseYMD(pickupDate) : null,
        pickupWindow: pickupWindow || null,
        deliveryAddress: deliveryAddress || null,
        deliveryZone: deliveryZone || null,
        deliveryFee,
        notes: notes || null,
        isCustomCake,
        customText: customText || null,
        customDesign: customDesign || null,
        customPhotoUrl: customPhotoUrl || null,
        paymentMethod,
        isPaid: false,
        paymentProofUrl: paymentProofUrl || null,
        total,
        createdAt: new Date(),
        itemsOrder: {
          create: orderItems.map((item) => ({
            productId: item.product.id,
            variantId: item.variant?.id ?? null,
            qty: item.qty,
            notes: item.notes || null,
            selectedAddOns: item.selectedAddOnIds,
            addOnsPrice: item.addOns.reduce((sum: number, a: { price: number }) => sum + a.price, 0),
            price: item.product.basePrice + (item.variant?.priceDiff || 0),
          })),
        },
      },
      include: {
        itemsOrder: {
          include: {
            product: { select: { name: true, imageUrl: true } },
            variant: { select: { name: true, priceDiff: true } },
          },
        },
      },
    });
  });

  return mapOrderWithItems(order);
}

export async function updateOrderStatus(code: string, status: OrderStatus): Promise<OrderWithItems | null> {
  if (!ORDER_STATUSES.includes(status)) {
    throw new Error(
      `Status pesanan tidak valid: "${status}". Status yang diperbolehkan: ${ORDER_STATUSES.join(", ")}`
    );
  }

  try {
    const order = await prisma.order.update({
      where: { code },
      data: {
        status,
        completedAt: status === "COMPLETED" ? new Date() : undefined,
      },
      include: {
        itemsOrder: {
          include: {
            product: { select: { name: true, imageUrl: true } },
            variant: { select: { name: true, priceDiff: true } },
          },
        },
      },
    });
    return mapOrderWithItems(order);
  } catch {
    // Prisma throws (P2025) when the `code` doesn't match any row.
    return null;
  }
}

export async function confirmPayment(code: string): Promise<OrderWithItems | null> {
  try {
    const order = await prisma.order.update({
      where: { code },
      data: { isPaid: true },
      include: {
        itemsOrder: {
          include: {
            product: { select: { name: true, imageUrl: true } },
            variant: { select: { name: true, priceDiff: true } },
          },
        },
      },
    });
    return mapOrderWithItems(order);
  } catch {
    return null;
  }
}

/** Look up an order by its reference code only — for admin use, where the
 * caller is already authenticated and doesn't need the phone-number check
 * that guards the customer-facing lookup. */
export async function getOrderByCode(code: string): Promise<OrderWithItems | null> {
  const order = await prisma.order.findUnique({
    where: { code },
    include: {
      itemsOrder: {
        include: {
          product: { select: { name: true, imageUrl: true } },
          variant: { select: { name: true, priceDiff: true } },
        },
      },
    },
  });
  if (!order) return null;
  return mapOrderWithItems(order);
}

export interface OrderListFilter {
  /** Filter to a single status. Omit for all statuses. */
  status?: OrderStatus;
  /** "today" (default) restricts to orders created today (WIB); "all" returns everything. */
  scope?: "today" | "all";
}

/** List orders for the admin dashboard, newest first. */
export async function getOrders(filter: OrderListFilter = {}): Promise<OrderWithItems[]> {
  const { status, scope = "today" } = filter;

  const where: { status?: OrderStatus; createdAt?: { gte: Date; lt: Date } } = {};
  if (status) where.status = status;
  if (scope === "today") {
    where.createdAt = { gte: fromWIBString(wibToday()), lt: fromWIBString(wibTomorrow()) };
  }

  const orders = await prisma.order.findMany({
    where,
    include: {
      itemsOrder: {
        include: {
          product: { select: { name: true, imageUrl: true } },
          variant: { select: { name: true, priceDiff: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return orders.map(mapOrderWithItems);
}

export interface OrderStats {
  todayCount: number;
  pendingCount: number;
  unpaidCount: number;
  todayRevenue: number;
}

/** Summary numbers for the admin dashboard's stat cards. */
export async function getOrderStats(): Promise<OrderStats> {
  const todayStart = fromWIBString(wibToday());
  const todayEnd = fromWIBString(wibTomorrow());

  const [todayCount, pendingCount, unpaidCount, todayRevenue] = await Promise.all([
    prisma.order.count({ where: { createdAt: { gte: todayStart, lt: todayEnd } } }),
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.order.count({ where: { isPaid: false, status: { notIn: ["CANCELLED"] } } }),
    prisma.order.aggregate({
      where: { createdAt: { gte: todayStart, lt: todayEnd }, status: { not: "CANCELLED" } },
      _sum: { total: true },
    }),
  ]);

  return {
    todayCount,
    pendingCount,
    unpaidCount,
    todayRevenue: todayRevenue._sum.total ?? 0,
  };
}

export async function getTodayOrders(): Promise<OrderWithItems[]> {
  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: fromWIBString(wibToday()), lt: fromWIBString(wibTomorrow()) } },
    include: {
      itemsOrder: {
        include: {
          product: { select: { name: true, imageUrl: true } },
          variant: { select: { name: true, priceDiff: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 3,
  });

  return orders.map(mapOrderWithItems);
}

export async function getProductAvailability(productId: number): Promise<{ available: number; sold: number; total: number } | null> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { dailyStock: true, isAvailable: true },
  });
  if (!product) return null;
  if (product.dailyStock === null) return { available: -1, sold: 0, total: -1 };

  const todayStart = fromWIBString(wibToday());
  const todayEnd = fromWIBString(wibTomorrow());

  const soldToday = await prisma.orderItem.groupBy({
    by: ["productId"],
    where: {
      productId,
      order: {
        status: { in: ["PENDING", "CONFIRMED", "BAKING", "READY", "COMPLETED"] },
        createdAt: { gte: todayStart, lt: todayEnd },
      },
    },
    _sum: { qty: true },
  });

  const sold = soldToday[0]?._sum.qty || 0;
  const available = Math.max(0, product.dailyStock - sold);
  return { available, sold, total: product.dailyStock };
}

// ---- helpers ----

function mapOrderWithItems(order: {
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
  completedAt: Date | null;
  bookingId: number | null;
  itemsOrder: Array<{
    id: number;
    productId: number;
    variantId: number | null;
    product: { name: string; imageUrl: string | null };
    variant: { name: string; priceDiff: number } | null;
    qty: number;
    notes: string | null;
    selectedAddOns: string[];
    addOnsPrice: number;
    price: number;
  }>;
}): OrderWithItems {
  return {
    id: order.id,
    code: order.code,
    status: order.status,
    type: order.type,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    customerEmail: order.customerEmail,
    pickupDate: order.pickupDate ? order.pickupDate.toISOString().slice(0, 10) : null,
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
    completedAt: order.completedAt,
    bookingId: order.bookingId,
    items: order.itemsOrder.map((item: {
      id: number;
      productId: number;
      variantId: number | null;
      product: { name: string; imageUrl: string | null };
      variant: { name: string; priceDiff: number } | null;
      qty: number;
      notes: string | null;
      selectedAddOns: string[];
      addOnsPrice: number;
      price: number;
    }) => ({
      id: item.id,
      productId: item.productId,
      variantId: item.variantId,
      productName: item.product.name,
      variantName: item.variant?.name ?? null,
      productImageUrl: item.product.imageUrl,
      qty: item.qty,
      notes: item.notes,
      selectedAddOns: item.selectedAddOns || [],
      addOnsPrice: item.addOnsPrice,
      price: item.price,
      lineTotal: item.qty * item.price + item.addOnsPrice,
    })),
  };
}

async function getDeliveryZonesRaw(): Promise<DeliveryZone[]> {
  const row = await prisma.setting.findUnique({ where: { key: "deliveryZones" } });
  if (!row?.value) return [];
  try { return JSON.parse(row.value); } catch { return []; }
}

async function getPickupWindowsRaw(): Promise<PickupWindow[]> {
  const row = await prisma.setting.findUnique({ where: { key: "pickupWindows" } });
  if (!row?.value) return [];
  try { return JSON.parse(row.value); } catch { return []; }
}

function generateOrderCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}