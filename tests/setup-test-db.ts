import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function setupTestDatabase() {
  console.log('Setting up test database...');
  
  // Clean existing test data
  await prisma.booking.deleteMany({ where: { phone: { startsWith: '628999' } } });
  
  // Create test booking slots
  await prisma.bookingSlot.deleteMany({ where: { name: { startsWith: 'Test' } } });
  
  const slots = await prisma.bookingSlot.createMany({
    data: [
      { name: 'Test Pagi', startTime: '09:00', endTime: '11:00', capacity: 4, isActive: true, order: 1 },
      { name: 'Test Siang', startTime: '12:00', endTime: '14:00', capacity: 4, isActive: true, order: 2 },
      { name: 'Test Sore', startTime: '17:00', endTime: '19:00', capacity: 4, isActive: true, order: 3 },
    ],
    skipDuplicates: true,
  });
  
  // Create test settings
  await prisma.setting.upsert({
    where: { key: 'maxPartySize' },
    update: { value: '8' },
    create: { key: 'maxPartySize', value: '8' },
  });
  
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
  
  console.log('Test database setup complete');
  return { slots };
}

export async function cleanupTestDatabase() {
  console.log('Cleaning up test database...');
  
  await prisma.booking.deleteMany({ where: { phone: { startsWith: '628999' } } });
  await prisma.booking.deleteMany({ where: { phone: '081234567890' } });
  await prisma.booking.deleteMany({ where: { name: { startsWith: 'E2E Test' } } });
  await prisma.booking.deleteMany({ where: { name: { startsWith: 'API Test' } } });
  await prisma.booking.deleteMany({ where: { name: { startsWith: 'Status Test' } } });
  
  await prisma.bookingSlot.deleteMany({ where: { name: { startsWith: 'Test' } } });
  
  await prisma.$disconnect();
  console.log('Cleanup complete');
}

if (require.main === module) {
  const args = process.argv.slice(2);
  if (args[0] === 'cleanup') {
    cleanupTestDatabase().catch(console.error);
  } else {
    setupTestDatabase().catch(console.error);
  }
}