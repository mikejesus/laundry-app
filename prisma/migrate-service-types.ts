/**
 * Migration script to copy serviceType from Order to OrderItems
 * Run this with: npx tsx prisma/migrate-service-types.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Mapping of old service type names to new standardized ones
const serviceTypeMap: Record<string, string> = {
  'Wash & Fold': 'wash_and_fold',
  'wash_and_fold': 'wash_and_fold',
  'Dry Cleaning': 'dry_cleaning',
  'dry_cleaning': 'dry_cleaning',
  'Ironing': 'iron_only',
  'Iron Only': 'iron_only',
  'iron_only': 'iron_only',
  'Wash & Iron': 'wash_and_iron',
  'wash_and_iron': 'wash_and_iron',
  'Starching': 'starching',
  'starching': 'starching',
};

async function main() {
  console.log('Starting migration of service types from orders to order items...\n');

  // Get all orders with their items
  const orders = await prisma.order.findMany({
    where: {
      serviceType: {
        not: null,
      },
    },
    include: {
      items: true,
    },
  });

  console.log(`Found ${orders.length} orders with ${orders.reduce((sum, order) => sum + order.items.length, 0)} total items\n`);

  let updatedCount = 0;

  // Update each order item with the parent order's service type
  for (const order of orders) {
    if (!order.serviceType) continue;

    const standardizedServiceType = serviceTypeMap[order.serviceType] || 'wash_and_iron';

    console.log(`Order ${order.orderNumber}: "${order.serviceType}" → "${standardizedServiceType}"`);

    for (const item of order.items) {
      await prisma.orderItem.update({
        where: { id: item.id },
        data: {
          serviceType: standardizedServiceType,
        },
      });

      console.log(`  ✓ Updated ${item.itemType} (qty: ${item.quantity})`);
      updatedCount++;
    }
  }

  console.log(`\n✅ Migration complete! Updated ${updatedCount} order items.`);
}

main()
  .catch((e) => {
    console.error('❌ Error during migration:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
