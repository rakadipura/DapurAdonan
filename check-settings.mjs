import { prisma } from './src/lib/db.js';
const settings = await prisma.setting.findMany({
  where: { key: { in: ['logoUrl', 'faviconUrl', 'heroImageUrl', 'storeName', 'storeTagline'] } }
});
console.log(JSON.stringify(settings, null, 2));