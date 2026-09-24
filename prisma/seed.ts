import { PrismaClient, Prisma } from "@prisma/client";
import { writeFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const prisma = new PrismaClient();

const PHONE_EXAMPLE = "081234567890";

async function main() {
  console.log("Seeding Toko Mini Moni database…");

  // ---- Categories ----
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: "ronde-kue" },
      update: { imageUrl: "/images/categories/kue-kering.jpg" },
      create: {
        name: "Ronde Kue",
        slug: "ronde-kue",
        sortOrder: 1,
        isVisible: true,
        imageUrl: "/images/categories/kue-kering.jpg",
      },
    }),
    prisma.category.upsert({
      where: { slug: "kue-kering" },
      update: { imageUrl: "/images/categories/kue-kering.jpg" },
      create: {
        name: "Kue Kering",
        slug: "kue-kering",
        sortOrder: 2,
        isVisible: true,
        imageUrl: "/images/categories/kue-kering.jpg",
      },
    }),
    prisma.category.upsert({
      where: { slug: "kue-lempeng" },
      update: { imageUrl: "/images/categories/kue-kering.jpg" },
      create: {
        name: "Kue Lempeng",
        slug: "kue-lempeng",
        sortOrder: 3,
        isVisible: true,
        imageUrl: "/images/categories/kue-kering.jpg",
      },
    }),
    prisma.category.upsert({
      where: { slug: "roti" },
      update: { imageUrl: "/images/categories/roti.jpg" },
      create: {
        name: "Roti",
        slug: "roti",
        sortOrder: 4,
        isVisible: true,
        imageUrl: "/images/categories/roti.jpg",
      },
    }),
    prisma.category.upsert({
      where: { slug: "minuman" },
      update: { imageUrl: "/images/categories/minuman.jpg" },
      create: {
        name: "Minuman",
        slug: "minuman",
        sortOrder: 5,
        isVisible: true,
        imageUrl: "/images/categories/minuman.jpg",
      },
    }),
    prisma.category.upsert({
      where: { slug: "kue-custom" },
      update: { imageUrl: "/images/categories/custom-cake.jpg" },
      create: {
        name: "Kue Custom",
        slug: "kue-custom",
        sortOrder: 6,
        isVisible: true,
        imageUrl: "/images/categories/custom-cake.jpg",
      },
    }),
  ]);
  console.log("Categories created:", categories.length);

  // ---- Products (sample catalog) ----
  const sampleProducts: Prisma.ProductCreateInput[] = [
    {
      name: "Ronde Kue Coklat",
      slug: "ronde-kue-coklat",
      description: "Ronde kue tekstural lembut dengan taburan coklat yang manis dan gurih.",
      basePrice: 25000,
      category: { connect: { id: categories[0].id } },
      imageUrl: "/images/ronde-coklat.jpg",
      dailyStock: 30,
      allergens: ["gluten", "dairy"],
      tags: ["best-seller"],
    },
    {
      name: "Ronde Kue Keju",
      slug: "ronde-kue-keju",
      description: "Ronde kue dengan sentuhan keju parut yang gurih.",
      basePrice: 27000,
      category: { connect: { id: categories[0].id } },
      imageUrl: "/images/ronde-keju.jpg",
      dailyStock: 25,
      allergens: ["gluten", "dairy"],
      tags: [],
    },
    {
      name: "Kue Kering Pandan Green",
      slug: "kue-kering-pandan-green",
      description: "Kue kering pandan yang wangi dan renyah.",
      basePrice: 18000,
      category: { connect: { id: categories[1].id } },
      imageUrl: "/images/kue-kering-pandan.jpg",
      dailyStock: 50,
      allergens: ["gluten", "dairy", "eggs"],
      tags: ["best-seller"],
    },
    {
      name: "Kue Kering Sesame",
      slug: "kue-kering-sesame",
      description: "Kue kering sesame yang gurih dan crunchy.",
      basePrice: 18000,
      category: { connect: { id: categories[1].id } },
      imageUrl: "/images/kue-kering-sesame.jpg",
      dailyStock: 50,
      allergens: ["gluten", "sesame"],
      tags: [],
    },
    {
      name: "Kue Kering Talam",
      slug: "kue-kering-talam",
      description: "Kue kering berlapis pisang, krim, dan lik Banana.",
      basePrice: 22000,
      category: { connect: { id: categories[1].id } },
      imageUrl: "/images/kue-kering-talam.jpg",
      dailyStock: 30,
      allergens: ["gluten", "dairy", "eggs"],
      tags: [],
    },
    {
      name: "Kue Lempeng Tumpeng",
      slug: "kue-lempeng-tumpeng",
      description: "Kue lempeng manis berwarna warni.",
      basePrice: 15000,
      category: { connect: { id: categories[2].id } },
      imageUrl: "/images/kue-lempeng.jpg",
      dailyStock: 40,
      allergens: ["gluten", "dairy"],
      tags: [],
    },
    {
      name: "Roti Croissant",
      slug: "roti-croissant",
      description: "Croissant tepung lembut dengan lapisan buttery yang berlapis.",
      basePrice: 25000,
      category: { connect: { id: categories[3].id } },
      imageUrl: "/images/roti-croissant.jpg",
      dailyStock: 20,
      allergens: ["gluten", "dairy", "eggs"],
      tags: ["best-seller"],
    },
    {
      name: "Roti Bolu Coklat",
      slug: "roti-bolu-coklat",
      description: "Roti bolu moist dengan cita rasa coklat yang dalam.",
      basePrice: 30000,
      category: { connect: { id: categories[3].id } },
      imageUrl: "/images/roti-bolu-coklat.jpg",
      dailyStock: 15,
      allergens: ["gluten", "dairy", "eggs"],
      tags: [],
    },
    {
      name: "Es Teh Manis",
      slug: "es-teh-manis",
      description: "Teh manis segar ditambahkan es.",
      basePrice: 8000,
      category: { connect: { id: categories[4].id } },
      imageUrl: "/images/es-teh-manis.jpg",
      dailyStock: null,
      allergens: [],
      tags: [],
    },
    {
      name: "Es Kopi Susu",
      slug: "es-kopi-susu",
      description: "Kopi susu dengan es batu.",
      basePrice: 15000,
      category: { connect: { id: categories[4].id } },
      imageUrl: "/images/es-kopi-susu.jpg",
      dailyStock: null,
      allergens: ["dairy", "caffeine"],
      tags: [],
    },
    {
      name: "Es Jeruk Peras",
      slug: "es-jeruk-peras",
      description: "Jeruk segar perasan alami.",
      basePrice: 12000,
      category: { connect: { id: categories[4].id } },
      imageUrl: "/images/es-jeruk.jpg",
      dailyStock: null,
      allergens: [],
      tags: [],
    },
    // Custom cake product
    {
      name: "Kue Ulang Tahun Custom",
      slug: "kue-ulang-tahun-custom",
      description: "Kue ulang tahun custom dengan desain dan tulisan sesuai permintaan. Pesan minimal 3 hari sebelumnya.",
      basePrice: 200000,
      category: { connect: { id: categories[5].id } },
      imageUrl: "/images/kue-custom.jpg",
      dailyStock: 5,
      leadTimeDays: 3,
      isCustomCake: true,
      allergens: ["gluten", "dairy", "eggs", "nuts"],
      tags: ["custom", "birthday"],
      variants: {
        create: [
          { name: "Kecil (6 inch, 4-6 porsi)", priceDiff: 0, isDefault: true, sortOrder: 0 },
          { name: "Sedang (8 inch, 8-12 porsi)", priceDiff: 80000, sortOrder: 1 },
          { name: "Besar (10 inch, 15-20 porsi)", priceDiff: 180000, sortOrder: 2 },
        ],
      },
      addOns: {
        create: [
          { name: "Tulisan Custom di Atas Kue", price: 15000, isRequired: true, sortOrder: 0 },
          { name: "Buah Segar sebagai Topping", price: 30000, sortOrder: 1 },
          { name: "Coklat Premium (Belgian)", price: 40000, sortOrder: 2 },
          { name: "Kotak Hadiah Premium", price: 25000, sortOrder: 3 },
        ],
      },
    },
  ];

  const products = await Promise.all(
    sampleProducts.map((p) => prisma.product.upsert({ where: { slug: p.slug }, update: {}, create: p }))
  );
  console.log("Products created:", products.length);

  // ---- Booking slots ----
  const slots = await Promise.all([
    prisma.bookingSlot.upsert({
      where: { id: 1 },
      update: {},
      create: { id: 1, name: "Pagi", startTime: "09:00", endTime: "11:00", capacity: 8, isActive: true, order: 0 },
    }),
    prisma.bookingSlot.upsert({
      where: { id: 2 },
      update: {},
      create: { id: 2, name: "Siang", startTime: "12:00", endTime: "14:00", capacity: 8, isActive: true, order: 1 },
    }),
    prisma.bookingSlot.upsert({
      where: { id: 3 },
      update: {},
      create: { id: 3, name: "Sore", startTime: "15:00", endTime: "17:00", capacity: 8, isActive: true, order: 2 },
    }),
  ]);
  console.log("Booking slots created:", slots.length);

  // ---- Settings ----
  const settingEntries = [
    { key: "orderCutoffHour", value: "16" },
    { key: "bookingLeadHours", value: "1" },
    { key: "transferBank", value: "Bank BCA<br>Kategori: Toko Mini Moni<br>No. Rekening: 123-456-7890<br>Atas nama: Toko Mini Moni" },
    { key: "pickupWindows", value: JSON.stringify([{ start: "10:00", end: "12:00" }, { start: "12:00", end: "14:00" }, { start: "15:00", end: "17:00" }, { start: "17:00", end: "18:30" }]) },
    { key: "deliveryZones", value: JSON.stringify([
      { zone: "Lokal", baseFee: 15000, perKm: 5000, maxKm: 10, freeMin: 80000 },
    ]) },
    { key: "adminPasswordHash", value: "REPLACE_WITH_BCRYPT_HASH" },
    { key: "waNumber", value: "6281234567890" },
    // Branding settings
    { key: "storeName", value: "Toko Mini Moni" },
    { key: "storeTagline", value: "Roti, Kue, dan Jajanan Sehat" },
    { key: "logoUrl", value: "/images/logo.jpg" },
    { key: "faviconUrl", value: "/favicon.ico" },
    { key: "heroImageUrl", value: "/images/hero-banner.jpg" },
  ];

  for (const entry of settingEntries) {
    await prisma.setting.upsert({ where: { key: entry.key }, update: {}, create: entry });
  }
  console.log("Settings created.");

  console.log("Seed complete!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });