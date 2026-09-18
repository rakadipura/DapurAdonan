import { prisma } from "./db";
import type { CustomerType, DeliveryZone, PickupWindow } from "@/types";
import { toWIB, fromWIBString, formatDateYMD, toRupiahInt, formatDateLong } from "./settings";
import { isValidPhone, isValidEmail } from "./regex";
import { formatRupiah } from "./money";
import { addDays, startOfDay } from "date-fns";

export type OrderType = "PICKUP" | "DELIVERY";
export type PaymentMethod = "TRANSFER" | "EWALLET" | "CASH";

export interface CreateOrderInput {
  items: Array<{ productId: number; qty: number; notes?: string }>;
  type: OrderType;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  pickupDate?: string; // YYYY-MM-DD for pickup
  pickupWindow?: string; // "HH:mm-HH:mm"
  deliveryAddress?: string;
  deliveryZone?: string;
  paymentMethod: PaymentMethod;
  paymentProofUrl?: string;
  notes?: string;
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
  paymentMethod: string;
  isPaid: boolean;
  paymentProofUrl: string | null;
  total: number;
  createdAt: Date;
  completedAt: Date | null;
  items: Array<{
    id: number;
    productId: number;
    productName: string;
    productImageUrl: string | null;
    qty: number;
    notes: string | null;
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
        },
      },
    },
  });

  if (!order) return null;
  if (order.customerPhone !== phone) return null;

  const items = order.itemsOrder.map((item) => ({
    id: item.id,
    productId: item.productId,
    productName: item.product.name,
    productImageUrl: item.product.imageUrl,
    qty: item.qty,
    notes: item.notes,
    price: item.price,
    lineTotal: item.qty * item.price,
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
    paymentMethod: order.paymentMethod,
    isPaid: order.isPaid,
    paymentProofUrl: order.paymentProofUrl,
    total: order.total,
    createdAt: order.createdAt,
    completedAt: order.completedAt,
    items,
  };
}

export async function createOrder(input: CreateOrderInput): Promise<OrderWithItems> {
  const { items, type, customerName, customerPhone, customerEmail, pickupDate, pickupWindow, deliveryAddress, deliveryZone, paymentMethod, paymentProofUrl, notes } = input;

  if (!isValidPhone(customerPhone)) {
    throw new Error("Nomor telepon tidak valid");
  }
  if (customerEmail && !isValidEmail(customerEmail)) {
    throw new Error("Alamat email tidak valid");
  }

  // Compute totals and validate stock.
  const orderItems: { product: { id: number; name: string; imageUrl: string | null; price: number }; qty: number; notes?: string }[] = [];
  let subtotal = 0;

  for (const item of items) {
    const product = await prisma.product.findUnique({
      where: { id: item.productId },
      select: { id: true, name: true, imageUrl: true, price: true, dailyStock: true, isAvailable: true },
    });

    if (!product || !product.isAvailable) {
      throw new Error(`Produk "${item.productId}" tidak tersedia`);
    }

    if (product.dailyStock !== null) {
      // Count today's sold quantity for this product (non-cancelled orders on same date)
      const todayStart = startOfDay(new Date()); // WIB-ish; acceptable for daily stock snapshot
      const todayEnd = new Date(todayStart);
      todayEnd.setDate(todayEnd.getDate() + 1);

      const soldToday = await prisma.orderItem.groupBy({
        by: ["productId"],
        where: {
          productId: item.productId,
          order: {
            status: { in: ["PENDING", "CONFIRMED", "BAKING", "READY", "COMPLETED"] },
            createdAt: { gte: todayStart, lt: todayEnd },
          },
        },
        _sum: { qty: true },
      });

      const soldQty = soldToday[0]?._sum.qty || 0;
      const available = product.dailyStock - soldQty;
      if (available <= 0) {
        throw new Error(`Stok "${product.name}" habis hari ini`);
      }
      if (item.qty > available) {
        throw new Error(`Stok "${product.name}" tidak cukup; tersisa ${available}`);
      }
    }

    const lineTotal = product.price * item.qty;
    subtotal += lineTotal;

    orderItems.push({
      product: { id: product.id, name: product.name, imageUrl: product.imageUrl, price: product.price },
      qty: item.qty,
      notes: item.notes,
    });
  }

  // Delivery fee
  let deliveryFee = 0;
  if (type === "DELIVERY") {
    const zones = await getDeliveryZonesRaw();
    const zone = zones.find((z) => z.zone === deliveryZone);
    if (!zone) {
      throw new Error("Zona pengiriman tidak ditemukan");
    }
    deliveryFee = zone.baseFee;
    // If no freeMin threshold reached, we keep baseFee; further distance calc omitted for MVP.
  }

  const total = subtotal + deliveryFee;

  // Validate pickup date / window against settings if pickup.
  if (type === "PICKUP") {
    if (!pickupDate || !pickupWindow) {
      throw new Error("Untuk pemesanan pick-up, tanggal dan jadwal pengambilan wajib diisi");
    }
    const windows = await getPickupWindowsRaw();
    const validWindow = windows.find((w) => `${w.start}-${w.end}` === pickupWindow);
    if (!validWindow) {
      throw new Error("Jadwal pengambilan tidak tersedia");
    }
    // Ensure pickup date is in the future (at least tomorrow, or today if after cutoff).
    const pickup = fromWIBString(pickupDate);
    const nowWIB = toWIB(new Date());
    const todayStart = startOfDay(nowWIB);
    const pickupStart = startOfDay(pickup);
    const diffDays = (pickupStart.getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays < 0) {
      throw new Error("Tanggal pengambilan harus hari ini atau setelahnya");
    }
  }

  const orderCode = generateOrderCode();

  const order = await prisma.order.create({
    data: {
      code: orderCode,
      status: "PENDING",
      type,
      customerName,
      customerPhone,
      customerEmail: customerEmail || null,
      pickupDate: pickupDate ? fromWIBString(pickupDate) : null,
      pickupWindow: pickupWindow || null,
      deliveryAddress: deliveryAddress || null,
      deliveryZone: deliveryZone || null,
      deliveryFee,
      notes: notes || null,
      paymentMethod,
      isPaid: false,
      paymentProofUrl: paymentProofUrl || null,
      total,
      createdAt: new Date(),
      itemsOrder: {
        create: orderItems.map((item) => ({
          productId: item.product.id,
          qty: item.qty,
          notes: item.notes || null,
          price: item.product.price,
        })),
      },
    },
    include: {
      itemsOrder: {
        include: {
          product: { select: { name: true, imageUrl: true } },
        },
      },
    },
  });

  return mapOrderWithItems(order);
}

export async function updateOrderStatus(code: string, status: string, byAdminId?: number): Promise<OrderWithItems | null> {
  const order = await prisma.order.update({
    where: { code },
    data: {
      status,
      completedAt: status === "COMPLETED" ? new Date() : undefined,
    },
    include: {
      itemsOrder: {
        include: { product: { select: { name: true, imageUrl: true } } },
      },
    },
  });

  if (!order) return null;
  return mapOrderWithItems(order);
}

export async function confirmPayment(code: string): Promise<OrderWithItems | null> {
  const order = await prisma.order.update({
    where: { code },
    data: { isPaid: true },
    include: {
      itemsOrder: {
        include: { product: { select: { name: true, imageUrl: true } } },
      },
    },
  });

  if (!order) return null;
  return mapOrderWithItems(order);
}

export async function getTodayOrders(): Promise<OrderWithItems[]> {
  const nowWIB = toWIB(new Date());
  const todayStart = startOfDay(nowWIB);
  const tomorrowStart = addDays(todayStart, 1);

  const orders = await prisma.order.findMany({
    where: {
      createdAt: { gte: todayStart, lt: tomorrowStart },
    },
    include: {
      itemsOrder: {
        include: { product: { select: { name: true, imageUrl: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return orders.map(mapOrderWithItems);
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
  paymentMethod: string;
  isPaid: boolean;
  paymentProofUrl: string | null;
  total: number;
  createdAt: Date;
  completedAt: Date | null;
  itemsOrder: Array<{
    id: number;
    productId: number;
    product: { name: string; imageUrl: string | null };
    qty: number;
    notes: string | null;
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
    paymentMethod: order.paymentMethod,
    isPaid: order.isPaid,
    paymentProofUrl: order.paymentProofUrl,
    total: order.total,
    createdAt: order.createdAt,
    completedAt: order.completedAt,
    items: order.itemsOrder.map((item) => ({
      id: item.id,
      productId: item.productId,
      productName: item.product.name,
      productImageUrl: item.product.imageUrl,
      qty: item.qty,
      notes: item.notes,
      price: item.price,
      lineTotal: item.qty * item.price,
    })),
  };
}

async function getDeliveryZonesRaw(): Promise<DeliveryZone[]> {
  const row = await prisma.setting.findUnique({ where: { key: "deliveryZones" } });
  if (!row?.value) return [];
  try {
    return JSON.parse(row.value);
  } catch {
    return [];
  }
}

async function getPickupWindowsRaw(): Promise<PickupWindow[]> {
  const row = await prisma.setting.findUnique({ where: { key: "pickupWindows" } });
  if (!row?.value) return [];
  try {
    return JSON.parse(row.value);
  } catch {
    return [];
  }
}

let __orderCodeCounter = 0;
function generateOrderCode(): string {
  _codeCounter += 1;
  __orderCodeCounter += 1;
  const suffix = String(__orderCodeCounter).padStart(6, "0");
  return `MM-${suffix}`;
}
