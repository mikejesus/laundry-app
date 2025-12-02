import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Hash the demo password
  const hashedPassword = await bcrypt.hash('demo123', 12);

  // Create a demo user
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@laundry.com' },
    update: {},
    create: {
      email: 'demo@laundry.com',
      password: hashedPassword,
      firstName: 'Demo',
      lastName: 'User',
      role: 'admin',
    },
  });

  console.log('Created demo user:', demoUser);

  // Create sample customers
  const customer1 = await prisma.customer.create({
    data: {
      name: 'John Doe',
      phone: '+1234567890',
      address: '123 Main St, Cityville',
      email: 'john.doe@example.com',
      notes: 'Regular customer, prefers eco-friendly detergents',
      userId: demoUser.id,
    },
  });

  const customer2 = await prisma.customer.create({
    data: {
      name: 'Jane Smith',
      phone: '+1234567891',
      address: '456 Oak Ave, Townsburg',
      email: 'jane.smith@example.com',
      userId: demoUser.id,
    },
  });

  console.log('Created customers');

  // Create sample suppliers
  const supplier1 = await prisma.supplier.create({
    data: {
      name: 'CleanSupply Co.',
      phone: '+1234567892',
      email: 'sales@cleansupply.com',
      address: '789 Industrial Rd',
      category: 'Detergent',
      notes: 'Main detergent supplier',
      userId: demoUser.id,
    },
  });

  const supplier2 = await prisma.supplier.create({
    data: {
      name: 'Equipment Masters',
      phone: '+1234567893',
      email: 'info@equipmentmasters.com',
      address: '321 Business Blvd',
      category: 'Equipment',
      userId: demoUser.id,
    },
  });

  console.log('Created suppliers');

  // Create sample inventory items
  await prisma.inventory.createMany({
    data: [
      {
        name: 'Laundry Detergent',
        quantity: 50,
        unit: 'kg',
        minStockLevel: 10,
        category: 'Detergent',
        userId: demoUser.id,
      },
      {
        name: 'Fabric Softener',
        quantity: 30,
        unit: 'liters',
        minStockLevel: 5,
        category: 'Softener',
        userId: demoUser.id,
      },
      {
        name: 'Hangers',
        quantity: 200,
        unit: 'pieces',
        minStockLevel: 50,
        category: 'Accessories',
        userId: demoUser.id,
      },
      {
        name: 'Plastic Bags',
        quantity: 500,
        unit: 'pieces',
        minStockLevel: 100,
        category: 'Packaging',
        userId: demoUser.id,
      },
    ],
  });

  console.log('Created inventory items');

  // Create sample staff
  await prisma.staff.createMany({
    data: [
      {
        name: 'Alice Johnson',
        phone: '+1234567894',
        email: 'alice.j@laundry.com',
        role: 'Manager',
        salary: 3000,
        status: 'active',
        userId: demoUser.id,
      },
      {
        name: 'Bob Williams',
        phone: '+1234567895',
        role: 'Cleaner',
        salary: 1500,
        status: 'active',
        userId: demoUser.id,
      },
      {
        name: 'Charlie Brown',
        phone: '+1234567896',
        role: 'Delivery',
        salary: 1200,
        status: 'active',
        userId: demoUser.id,
      },
    ],
  });

  console.log('Created staff members');

  // Create sample orders
  const order1 = await prisma.order.create({
    data: {
      orderNumber: 'ORD-001',
      serviceType: 'Wash & Fold',
      totalAmount: 45.0,
      paidAmount: 45.0,
      status: 'completed',
      dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      pickupDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      deliveryDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      notes: 'Delicate items included',
      customerId: customer1.id,
      userId: demoUser.id,
      items: {
        create: [
          {
            itemType: 'Shirt',
            quantity: 5,
            price: 15.0,
          },
          {
            itemType: 'Pants',
            quantity: 3,
            price: 30.0,
          },
        ],
      },
      payments: {
        create: {
          amount: 45.0,
          method: 'Cash',
          date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          userId: demoUser.id,
        },
      },
    },
  });

  const order2 = await prisma.order.create({
    data: {
      orderNumber: 'ORD-002',
      serviceType: 'Dry Cleaning',
      totalAmount: 80.0,
      paidAmount: 40.0,
      status: 'in_progress',
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
      pickupDate: new Date(),
      notes: 'Handle with care - expensive suit',
      customerId: customer2.id,
      userId: demoUser.id,
      items: {
        create: [
          {
            itemType: 'Suit',
            quantity: 1,
            price: 50.0,
          },
          {
            itemType: 'Dress',
            quantity: 2,
            price: 30.0,
          },
        ],
      },
      payments: {
        create: {
          amount: 40.0,
          method: 'Card',
          date: new Date(),
          userId: demoUser.id,
        },
      },
    },
  });

  const order3 = await prisma.order.create({
    data: {
      orderNumber: 'ORD-003',
      serviceType: 'Ironing',
      totalAmount: 25.0,
      paidAmount: 0.0,
      status: 'pending',
      dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day from now
      customerId: customer1.id,
      userId: demoUser.id,
      items: {
        create: [
          {
            itemType: 'Shirt',
            quantity: 10,
            price: 25.0,
          },
        ],
      },
    },
  });

  console.log('Created orders with items and payments');

  // Create sample expenses
  await prisma.expense.createMany({
    data: [
      {
        category: 'Utilities',
        amount: 250.0,
        description: 'Electricity bill for the month',
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        userId: demoUser.id,
      },
      {
        category: 'Supplies',
        amount: 500.0,
        description: 'Detergent and softener bulk purchase',
        date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        supplierId: supplier1.id,
        userId: demoUser.id,
      },
      {
        category: 'Maintenance',
        amount: 150.0,
        description: 'Washing machine repair',
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        userId: demoUser.id,
      },
      {
        category: 'Rent',
        amount: 1500.0,
        description: 'Monthly rent payment',
        date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        userId: demoUser.id,
      },
    ],
  });

  console.log('Created expenses');

  // Create default service pricing
  const servicePricing = [
    // Wash & Iron
    { serviceType: 'wash_and_iron', itemType: 'Shirt', price: 200 },
    { serviceType: 'wash_and_iron', itemType: 'Trouser/Pants', price: 250 },
    { serviceType: 'wash_and_iron', itemType: 'Dress', price: 500 },
    { serviceType: 'wash_and_iron', itemType: 'Suit', price: 1000 },
    { serviceType: 'wash_and_iron', itemType: 'Bedsheet', price: 400 },
    { serviceType: 'wash_and_iron', itemType: 'Duvet', price: 800 },
    { serviceType: 'wash_and_iron', itemType: 'Curtain', price: 600 },
    { serviceType: 'wash_and_iron', itemType: 'Agbada', price: 1500 },
    { serviceType: 'wash_and_iron', itemType: 'Native Wear', price: 800 },
    { serviceType: 'wash_and_iron', itemType: 'Skirt', price: 250 },
    { serviceType: 'wash_and_iron', itemType: 'Blouse', price: 200 },

    // Dry Cleaning (typically more expensive)
    { serviceType: 'dry_cleaning', itemType: 'Shirt', price: 350 },
    { serviceType: 'dry_cleaning', itemType: 'Trouser/Pants', price: 400 },
    { serviceType: 'dry_cleaning', itemType: 'Dress', price: 800 },
    { serviceType: 'dry_cleaning', itemType: 'Suit', price: 1500 },
    { serviceType: 'dry_cleaning', itemType: 'Bedsheet', price: 600 },
    { serviceType: 'dry_cleaning', itemType: 'Duvet', price: 1200 },
    { serviceType: 'dry_cleaning', itemType: 'Curtain', price: 1000 },
    { serviceType: 'dry_cleaning', itemType: 'Agbada', price: 2000 },
    { serviceType: 'dry_cleaning', itemType: 'Native Wear', price: 1200 },
    { serviceType: 'dry_cleaning', itemType: 'Skirt', price: 400 },
    { serviceType: 'dry_cleaning', itemType: 'Blouse', price: 350 },

    // Iron Only (cheaper - no washing)
    { serviceType: 'iron_only', itemType: 'Shirt', price: 100 },
    { serviceType: 'iron_only', itemType: 'Trouser/Pants', price: 150 },
    { serviceType: 'iron_only', itemType: 'Dress', price: 250 },
    { serviceType: 'iron_only', itemType: 'Suit', price: 500 },
    { serviceType: 'iron_only', itemType: 'Bedsheet', price: 200 },
    { serviceType: 'iron_only', itemType: 'Duvet', price: 400 },
    { serviceType: 'iron_only', itemType: 'Curtain', price: 300 },
    { serviceType: 'iron_only', itemType: 'Agbada', price: 800 },
    { serviceType: 'iron_only', itemType: 'Native Wear', price: 400 },
    { serviceType: 'iron_only', itemType: 'Skirt', price: 150 },
    { serviceType: 'iron_only', itemType: 'Blouse', price: 100 },

    // Starching
    { serviceType: 'starching', itemType: 'Shirt', price: 150 },
    { serviceType: 'starching', itemType: 'Trouser/Pants', price: 200 },
    { serviceType: 'starching', itemType: 'Dress', price: 350 },
    { serviceType: 'starching', itemType: 'Suit', price: 700 },
    { serviceType: 'starching', itemType: 'Bedsheet', price: 300 },
    { serviceType: 'starching', itemType: 'Duvet', price: 600 },
    { serviceType: 'starching', itemType: 'Curtain', price: 400 },
    { serviceType: 'starching', itemType: 'Agbada', price: 1000 },
    { serviceType: 'starching', itemType: 'Native Wear', price: 600 },
    { serviceType: 'starching', itemType: 'Skirt', price: 200 },
    { serviceType: 'starching', itemType: 'Blouse', price: 150 },

    // Wash & Fold (similar to wash & iron)
    { serviceType: 'wash_and_fold', itemType: 'Shirt', price: 180 },
    { serviceType: 'wash_and_fold', itemType: 'Trouser/Pants', price: 220 },
    { serviceType: 'wash_and_fold', itemType: 'Dress', price: 450 },
    { serviceType: 'wash_and_fold', itemType: 'Suit', price: 900 },
    { serviceType: 'wash_and_fold', itemType: 'Bedsheet', price: 350 },
    { serviceType: 'wash_and_fold', itemType: 'Duvet', price: 700 },
    { serviceType: 'wash_and_fold', itemType: 'Curtain', price: 550 },
    { serviceType: 'wash_and_fold', itemType: 'Agbada', price: 1300 },
    { serviceType: 'wash_and_fold', itemType: 'Native Wear', price: 700 },
    { serviceType: 'wash_and_fold', itemType: 'Skirt', price: 220 },
    { serviceType: 'wash_and_fold', itemType: 'Blouse', price: 180 },
  ];

  await prisma.servicePrice.createMany({
    data: servicePricing.map((price) => ({
      ...price,
      userId: demoUser.id,
    })),
  });

  console.log('Created default service pricing');

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
