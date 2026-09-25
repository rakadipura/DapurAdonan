import {
  BookingIntakeAdapter,
  BookingIntakeError,
  BookingIntakeErrorCode,
  type CreateBookingWithMenuInput,
  type BookingWithMenuResult,
  type ProductData,
  type TransactionLike,
  type BookingWithSlot,
  type OrderWithItems,
} from "./types";

export class BookingIntake {
  private readonly adapter: BookingIntakeAdapter;

  constructor(adapter: BookingIntakeAdapter) {
    this.adapter = adapter;
  }

  async accept(input: CreateBookingWithMenuInput): Promise<BookingWithMenuResult> {
    this.#validateContact(input);
    this.#validateBookingDate(input.date);
    const { menuItems, ...bookingData } = input;

    const validatedMenuItems = menuItems && menuItems.length > 0
      ? await this.#validateMenuItems(menuItems, bookingData)
      : [];

    const bookingCode = this.adapter.idGenerator();
    const now = this.adapter.clock();

    return this.adapter.$transaction(async (tx: TransactionLike): Promise<BookingWithMenuResult> => {
      // 1. Lock and verify slot capacity
      await this.#lockSlot(tx, bookingData.slotId);
      await this.#ensureSlotCapacity(tx, bookingData.slotId, bookingData.date, bookingData.partySize);

      // 2. Lock products for menu items (stock reservation)
      if (validatedMenuItems.length > 0) {
        const productIds = validatedMenuItems.map((i) => i.product.id);
        await this.#lockProducts(tx, productIds);
        await this.#recheckStockUnderLock(tx, validatedMenuItems, now);
      }

      // 3. Create booking
      const booking = await tx.booking.create({
        data: {
          code: bookingCode,
          date: this.#parseYMD(bookingData.date),
          slotId: bookingData.slotId,
          partySize: bookingData.partySize,
          name: bookingData.name,
          phone: bookingData.phone,
          email: bookingData.email ?? null,
          status: "PENDING",
          createdAt: now,
          updatedAt: now,
        },
        include: { slot: { select: { id: true, name: true, startTime: true, endTime: true } } },
      });

      // 4. Create pre-orders linked to booking
      const orders: OrderWithItems[] = [];
      for (const item of validatedMenuItems) {
        const orderCode = this.adapter.idGenerator();
        const basePrice = item.product.basePrice + (item.variant?.priceDiff ?? 0);
        const addOnsPrice = item.addOns.reduce((sum, a) => sum + a.price, 0);
        const lineTotal = (basePrice + addOnsPrice) * item.qty;

        const order = await tx.order.create({
          data: {
            code: orderCode,
            status: "PENDING",
            type: "PICKUP", // pre-orders are pickup at the table
            customerName: bookingData.name,
            customerPhone: bookingData.phone,
            customerEmail: bookingData.email ?? null,
            pickupDate: this.#parseYMD(bookingData.date),
            pickupWindow: null, // will be determined by slot time
            deliveryAddress: null,
            deliveryZone: null,
            deliveryFee: 0,
            notes: item.notes ?? null,
            isCustomCake: false,
            customText: null,
            customDesign: null,
            customPhotoUrl: null,
            paymentMethod: "CASH",
            isPaid: false,
            paymentProofUrl: null,
            total: lineTotal,
            createdAt: now,
            bookingId: booking.id,
            itemsOrder: {
              create: [{
                productId: item.product.id,
                variantId: item.variant?.id ?? null,
                qty: item.qty,
                notes: item.notes ?? null,
                selectedAddOns: item.selectedAddOnIds,
                addOnsPrice,
                price: basePrice,
              }],
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
        orders.push(order as unknown as OrderWithItems);
      }

      return {
        booking: booking as unknown as BookingWithMenuResult["booking"],
        orders,
      };
    });
  }

  #validateContact(input: CreateBookingWithMenuInput): void {
    const phoneResult = this.adapter.contact.validatePhone(input.phone);
    if (!phoneResult.valid) {
      throw new BookingIntakeError("INVALID_PHONE", phoneResult.error ?? "Invalid phone number", { phone: input.phone });
    }
    input.phone = phoneResult.normalized;

    if (input.email && input.email.trim() !== "") {
      const emailResult = this.adapter.contact.validateEmail(input.email);
      if (!emailResult.valid) {
        throw new BookingIntakeError("INVALID_EMAIL", emailResult.error ?? "Invalid email", { email: input.email });
      }
    }
  }

  #validateBookingDate(date: string): void {
    const today = this.#wibToday();
    if (date < today) {
      throw new BookingIntakeError("INVALID_DATE", `Tanggal booking (${date}) tidak valid: harus hari ini atau setelahnya. Hari ini: ${today}`, { date, today });
    }
  }

  async #validateMenuItems(
    items: CreateBookingWithMenuInput["menuItems"],
    bookingData: Omit<CreateBookingWithMenuInput, "menuItems">
  ): Promise<Array<{
    product: ProductData;
    variant: { id: number; name: string; priceDiff: number } | null;
    addOns: Array<{ id: number; name: string; price: number; isRequired: boolean }>;
    qty: number;
    notes: string | undefined;
    selectedAddOnIds: string[];
  }>> {
    if (!items || items.length === 0) return [];

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
        throw new BookingIntakeError("INVALID_MENU_ITEM", `Produk dengan ID ${item.productId} tidak ditemukan`, { productId: item.productId });
      }
      if (!product.isAvailable) {
        throw new BookingIntakeError("PRODUCT_UNAVAILABLE", `Produk "${product.name}" tidak tersedia`, { productId: item.productId });
      }

      let variant: { id: number; name: string; priceDiff: number } | null = null;
      if (item.variantId) {
        variant = product.variants.find((v: { id: number; name: string; priceDiff: number }) => v.id === item.variantId) ?? null;
        if (!variant) {
          throw new BookingIntakeError("INVALID_VARIANT", `Varian ID ${item.variantId} tidak valid untuk "${product.name}"`, { variantId: item.variantId, productId: item.productId });
        }
      }

      const selectedAddOns = product.addOns.filter((a: { id: number; name: string; price: number; isRequired: boolean }) => item.selectedAddOns?.includes(String(a.id)));
      const requiredAddOns = product.addOns.filter((a: { id: number; name: string; price: number; isRequired: boolean }) => a.isRequired);
      for (const req of requiredAddOns) {
        if (!selectedAddOns.find((a: { id: number; name: string; price: number; isRequired: boolean }) => a.id === req.id)) {
          throw new BookingIntakeError("MISSING_REQUIRED_ADDON", `Add-on wajib "${req.name}" harus dipilih untuk "${product.name}"`, { addOnId: req.id, productId: item.productId });
        }
      }

      // Lead time check for custom cakes / products with lead time
      if (product.leadTimeDays > 0) {
        const diffDays = this.#daysBetween(this.#wibToday(), bookingData.date);
        if (diffDays < product.leadTimeDays) {
          throw new BookingIntakeError("LEAD_TIME_VIOLATION", `Memerlukan minimal ${product.leadTimeDays} hari persiapan. Tanggal ${bookingData.date} terlalu dekat (${diffDays} hari).`, { leadTimeDays: product.leadTimeDays, pickupDate: bookingData.date });
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

  async #lockSlot(tx: TransactionLike, slotId: number): Promise<void> {
    await tx.$queryRaw`SELECT id FROM "BookingSlot" WHERE id = ${slotId} FOR UPDATE`;
  }

  async #ensureSlotCapacity(
    tx: TransactionLike,
    slotId: number,
    date: string,
    requiredSize: number
  ): Promise<void> {
    const wibDate = this.#parseYMD(date);

    const slot = await this.adapter.prisma.bookingSlot.findUnique({ where: { id: slotId } });
    if (!slot) throw new BookingIntakeError("INVALID_SLOT", `Slot booking dengan ID ${slotId} tidak ditemukan`);
    if (!slot.isActive) throw new BookingIntakeError("SLOT_INACTIVE", `Slot booking "${slot.name}" tidak aktif`);

    const existing = await this.adapter.prisma.booking.findMany({
      where: {
        date: wibDate,
        slotId,
        status: { notIn: ["CANCELLED", "NO_SHOW", "RESCHEDULED"] },
      },
      select: { partySize: true },
    });
    const occupied = existing.reduce((sum, b) => sum + b.partySize, 0);
    const available = slot.capacity - occupied;
    if (available < requiredSize) {
      throw new BookingIntakeError("SLOT_FULL", `Jadwal penuh untuk slot ${slot.name} (${slot.startTime}-${slot.endTime}) pada tanggal ${date}; hanya tersisa ${available} orang dari kapasitas ${slot.capacity}, butuh ${requiredSize}`);
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
        throw new BookingIntakeError("INSUFFICIENT_STOCK", `Stok harian untuk "${item.product.name}" sudah habis`, { productId: item.product.id, dailyStock, soldQty });
      }
      if (item.qty > available) {
        throw new BookingIntakeError("INSUFFICIENT_STOCK", `Stok "${item.product.name}" tidak cukup: diminta ${item.qty}, tersisa ${available}`, { productId: item.product.id, requested: item.qty, available, dailyStock, soldQty });
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