import {
  OrderIntakeAdapter,
  OrderIntakeError,
  OrderIntakeErrorCode,
  type CreateOrderInput,
  type OrderWithItems,
  type ProductData,
  type OrderCreateData,
  type OrderItemCreateData,
  type TransactionLike,
} from "./types";

export class OrderIntake {
  private readonly adapter: OrderIntakeAdapter;

  constructor(adapter: OrderIntakeAdapter) {
    this.adapter = adapter;
  }

  async accept(input: CreateOrderInput): Promise<OrderWithItems> {
    this.#validateContact(input);
    const { items, ...orderData } = input;

    const validatedItems = await this.#validateItems(items, orderData);
    const pricing = this.#calculatePricing(validatedItems, orderData);
    const { deliveryFee, total } = await this.#calculateDeliveryFee(pricing, orderData);
    this.#validatePickupWindow(orderData);

    const orderCode = this.adapter.idGenerator();
    const now = this.adapter.clock();

    return this.adapter.$transaction(async (tx: TransactionLike): Promise<OrderWithItems> => {
      await this.#lockProducts(tx, validatedItems.map((i) => i.product.id));
      await this.#recheckStockUnderLock(tx, validatedItems, now);

      const orderInput: OrderCreateData = {
        code: orderCode,
        status: "PENDING",
        type: orderData.type,
        customerName: orderData.customerName,
        customerPhone: orderData.customerPhone,
        customerEmail: orderData.customerEmail ?? null,
        pickupDate: orderData.pickupDate ? this.#parseYMD(orderData.pickupDate) : null,
        pickupWindow: orderData.pickupWindow ?? null,
        deliveryAddress: orderData.deliveryAddress ?? null,
        deliveryZone: orderData.deliveryZone ?? null,
        deliveryFee,
        notes: orderData.notes ?? null,
        isCustomCake: orderData.isCustomCake ?? false,
        customText: orderData.customText ?? null,
        customDesign: orderData.customDesign ?? null,
        customPhotoUrl: orderData.customPhotoUrl ?? null,
        paymentMethod: orderData.paymentMethod,
        isPaid: false,
        paymentProofUrl: orderData.paymentProofUrl ?? null,
        total,
        createdAt: now,
        bookingId: null,
        itemsOrder: {
          create: validatedItems.map((item) => ({
            productId: item.product.id,
            variantId: item.variant?.id ?? null,
            qty: item.qty,
            notes: item.notes ?? null,
            selectedAddOns: item.selectedAddOnIds,
            addOnsPrice: item.addOns.reduce((sum, a) => sum + a.price, 0),
            price: item.product.basePrice + (item.variant?.priceDiff ?? 0),
          })),
        },
      };

      return tx.order.create({
        data: orderInput as unknown as Record<string, unknown>,
        include: {
          itemsOrder: {
            include: {
              product: { select: { name: true, imageUrl: true } },
              variant: { select: { name: true, priceDiff: true } },
            },
          },
        },
      }) as unknown as OrderWithItems;
    });
  }

  #validateContact(input: CreateOrderInput): void {
    const phoneResult = this.adapter.contact.validatePhone(input.customerPhone);
    if (!phoneResult.valid) {
      throw new OrderIntakeError("INVALID_PHONE", phoneResult.error ?? "Invalid phone number", { phone: input.customerPhone });
    }
    input.customerPhone = phoneResult.normalized;

    if (input.customerEmail && input.customerEmail.trim() !== "") {
      const emailResult = this.adapter.contact.validateEmail(input.customerEmail);
      if (!emailResult.valid) {
        throw new OrderIntakeError("INVALID_EMAIL", emailResult.error ?? "Invalid email", { email: input.customerEmail });
      }
    }
  }

  async #validateItems(
    items: CreateOrderInput["items"],
    orderData: Omit<CreateOrderInput, "items">
  ): Promise<Array<{
    product: ProductData;
    variant: { id: number; name: string; priceDiff: number } | null;
    addOns: Array<{ id: number; name: string; price: number; isRequired: boolean }>;
    qty: number;
    notes: string | undefined;
    selectedAddOnIds: string[];
  }>> {
    const productIds = [...new Set(items.map((i) => i.productId))];
    const productSelect = {
      id: true,
      name: true,
      imageUrl: true,
      basePrice: true,
      dailyStock: true,
      isAvailable: true,
      leadTimeDays: true,
      variants: { select: { id: true, name: true, priceDiff: true } },
      addOns: { select: { id: true, name: true, price: true, isRequired: true } },
    };
    const products = await this.adapter.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: productSelect,
    }) as unknown as ProductData[];

    const productMap = new Map(products.map((p) => [p.id, p]));
    const validatedItems: Array<{
      product: ProductData;
      variant: { id: number; name: string; priceDiff: number } | null;
      addOns: Array<{ id: number; name: string; price: number; isRequired: boolean }>;
      qty: number;
      notes: string | undefined;
      selectedAddOnIds: string[];
    }> = [];

    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product) {
        throw new OrderIntakeError("INVALID_ITEM", `Produk dengan ID ${item.productId} tidak ditemukan`, { productId: item.productId });
      }
      if (!product.isAvailable) {
        throw new OrderIntakeError("PRODUCT_UNAVAILABLE", `Produk "${product.name}" tidak tersedia`, { productId: item.productId });
      }

      let variant: { id: number; name: string; priceDiff: number } | null = null;
      if (item.variantId) {
        variant = product.variants.find((v: { id: number; name: string; priceDiff: number }) => v.id === item.variantId) ?? null;
        if (!variant) {
          throw new OrderIntakeError("INVALID_VARIANT", `Varian ID ${item.variantId} tidak valid untuk "${product.name}"`, { variantId: item.variantId, productId: item.productId });
        }
      }

      const selectedAddOns = product.addOns.filter((a: { id: number; name: string; price: number; isRequired: boolean }) => item.selectedAddOns?.includes(String(a.id)));
      const requiredAddOns = product.addOns.filter((a: { id: number; name: string; price: number; isRequired: boolean }) => a.isRequired);
      for (const req of requiredAddOns) {
        if (!selectedAddOns.find((a: { id: number; name: string; price: number; isRequired: boolean }) => a.id === req.id)) {
          throw new OrderIntakeError("MISSING_REQUIRED_ADDON", `Add-on wajib "${req.name}" harus dipilih untuk "${product.name}"`, { addOnId: req.id, productId: item.productId });
        }
      }

      if (orderData.isCustomCake || product.leadTimeDays > 0) {
        if (orderData.pickupDate) {
          const diffDays = this.#daysBetween(this.#wibToday(), orderData.pickupDate);
          if (diffDays < product.leadTimeDays) {
            throw new OrderIntakeError("LEAD_TIME_VIOLATION", `Memerlukan minimal ${product.leadTimeDays} hari persiapan. Tanggal ${orderData.pickupDate} terlalu dekat (${diffDays} hari).`, { leadTimeDays: product.leadTimeDays, pickupDate: orderData.pickupDate });
          }
        }
      }

      validatedItems.push({
        product,
        variant,
        addOns: selectedAddOns,
        qty: item.qty,
        notes: item.notes,
        selectedAddOnIds: selectedAddOns.map((a: { id: number }) => String(a.id)),
      });
    }

    return validatedItems;
  }

  #calculatePricing(
    validatedItems: Array<{
      product: ProductData;
      variant: { id: number; name: string; priceDiff: number } | null;
      addOns: Array<{ id: number; name: string; price: number; isRequired: boolean }>;
      qty: number;
    }>,
    orderData: Omit<CreateOrderInput, "items">
  ): { subtotal: number; lineItems: Array<{ basePrice: number; addOnsPrice: number; lineTotal: number }> } {
    let subtotal = 0;
    const lineItems: Array<{ basePrice: number; addOnsPrice: number; lineTotal: number }> = [];

    for (const item of validatedItems) {
      const basePrice = item.product.basePrice + (item.variant?.priceDiff ?? 0);
      const addOnsPrice = item.addOns.reduce((sum, a) => sum + a.price, 0);
      const lineTotal = (basePrice + addOnsPrice) * item.qty;
      subtotal += lineTotal;
      lineItems.push({ basePrice, addOnsPrice, lineTotal });
    }

    return { subtotal, lineItems };
  }

  async #calculateDeliveryFee(
    pricing: { subtotal: number },
    orderData: Omit<CreateOrderInput, "items">
  ): Promise<{ deliveryFee: number; total: number }> {
    let deliveryFee = 0;

    if (orderData.type === "DELIVERY") {
      const zones = await this.adapter.settings.getDeliveryZones();
      const zone = zones.find((z) => z.zone === orderData.deliveryZone);
      if (!zone) {
        throw new OrderIntakeError("INVALID_DELIVERY_ZONE", `Zona pengiriman "${orderData.deliveryZone}" tidak ditemukan`, { deliveryZone: orderData.deliveryZone });
      }

      if (orderData.isCustomCake) {
        const carZones = await this.adapter.settings.getDeliveryZones();
        const carZone = carZones.find((z) => z.zone === "car") || zone;
        deliveryFee = carZone.baseFee;
      } else {
        deliveryFee = zone.baseFee;
      }
    }

    return { deliveryFee, total: pricing.subtotal + deliveryFee };
  }

  #validatePickupWindow(orderData: Omit<CreateOrderInput, "items">): void {
    if (orderData.type === "PICKUP") {
      if (!orderData.pickupDate || !orderData.pickupWindow) {
        throw new OrderIntakeError("INVALID_PICKUP_DATE", "Tanggal dan jadwal pengambilan wajib diisi untuk pickup", { pickupDate: orderData.pickupDate, pickupWindow: orderData.pickupWindow });
      }

      const today = this.#wibToday();
      if (orderData.pickupDate < today) {
        throw new OrderIntakeError("INVALID_PICKUP_DATE", `Tanggal pengambilan (${orderData.pickupDate}) harus hari ini atau setelahnya. Hari ini: ${today}`, { pickupDate: orderData.pickupDate, today });
      }
    }
  }

  async #lockProducts(tx: TransactionLike, productIds: number[]): Promise<void> {
    if (productIds.length > 0) {
      const sortedIds = [...productIds].sort((a, b) => a - b);
      await tx.$queryRaw`SELECT id FROM "Product" WHERE id IN (${sortedIds.join(",")}) FOR UPDATE`;
    }
  }

  async #recheckStockUnderLock(
    tx: TransactionLike,
    validatedItems: Array<{ product: ProductData; qty: number }>,
    now: Date
  ): Promise<void> {
    const todayStart = this.#fromWIBString(this.#wibToday());
    const todayEnd = this.#fromWIBString(this.#wibTomorrow());

    for (const item of validatedItems) {
      const dailyStock = item.product.dailyStock;
      if (dailyStock === null) continue;

      const soldToday = await tx.orderItem.groupBy({
        by: ["productId"],
        where: {
          productId: item.product.id,
          order: {
            status: { in: ["PENDING", "CONFIRMED", "BAKING", "READY", "COMPLETED"] },
            createdAt: { gte: todayStart, lt: todayEnd },
          },
        },
        _sum: { qty: true },
      }) as unknown as { _sum: { qty: number | null } }[];

      const soldQty = soldToday[0]?._sum.qty ?? 0;
      const available = dailyStock - soldQty;
      if (available <= 0) {
        throw new OrderIntakeError("INSUFFICIENT_STOCK", `Stok harian untuk "${item.product.name}" sudah habis`, { productId: item.product.id, dailyStock, soldQty });
      }
      if (item.qty > available) {
        throw new OrderIntakeError("INSUFFICIENT_STOCK", `Stok "${item.product.name}" tidak cukup: diminta ${item.qty}, tersisa ${available}`, { productId: item.product.id, requested: item.qty, available, dailyStock, soldQty });
      }
    }
  }

  // --- WIB Date Helpers ---

  #wibToday(): string {
    const now = this.adapter.clock();
    const wib = new Date(now.getTime() + 7 * 60 * 60 * 1000);
    return wib.toISOString().slice(0, 10);
  }

  #wibTomorrow(): string {
    const today = this.#wibToday();
    const d = new Date(`${today}T00:00:00.000Z`);
    d.setUTCDate(d.getUTCDate() + 1);
    return d.toISOString().slice(0, 10);
  }

  #parseYMD(ymd: string): Date {
    return new Date(`${ymd}T00:00:00.000Z`);
  }

  #fromWIBString(isoDate: string): Date {
    return new Date(isoDate + "T00:00:00+07:00");
  }

  #daysBetween(a: string, b: string): number {
    return Math.round(
      (Date.parse(`${b}T00:00:00.000Z`) - Date.parse(`${a}T00:00:00.000Z`)) / 86_400_000
    );
  }
}