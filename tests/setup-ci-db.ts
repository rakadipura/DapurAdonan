#!/usr/bin/env tsx
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Setting up CI test database...');

  // Clean up any existing test data
  await prisma.booking.deleteMany({ where: { phone: { startsWith: '628999' } } });
  await prisma.bookingSlot.deleteMany({ where: { name: { startsWith: 'Test' } } });
  await prisma.setting.deleteMany({ where: { key: { in: ['maxPartySize', 'bookingLeadHours', 'whatsAppNumber'] } } });

  // Create test booking slots
  await prisma.bookingSlot.createMany({
    data: [
      { name: 'Test Pagi', startTime: '09:00', endTime: '11:00', capacity: 8, isActive: true, order: 1 },
      { name: 'Test Siang', startTime: '12:00', endTime: '14:00', capacity: 8, isActive: true, order: 2 },
      { name: 'Test Sore', startTime: '17:00', endTime: '19:00', capacity: 8, isActive: true, order: 3 },
    ],
    skipDuplicates: true,
  });

  // Create test settings
  await prisma.setting.upsert({
    where: { key: 'bookingLeadHours' },
    update: { value: '1' },
    create: { key: 'bookingLeadHours', value: '1' },
  });

  await prisma.setting.upsert({
    where: { key: 'whatsAppNumber' },
    update: { value: '6281234567890' },
    create: { key: 'whatsAppNumber', value: '6281234567890' },
  });

  console.log('CI test database setup complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });