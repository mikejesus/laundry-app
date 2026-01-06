import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting database cleanup...");

  // Get the super admin user ID
  const superAdmin = await prisma.user.findUnique({
    where: { email: "olawuni.michael@gmail.com" },
  });

  if (!superAdmin) {
    console.error("Super admin user not found!");
    return;
  }

  console.log("Super admin user found:", superAdmin.email);

  // Delete all data in the correct order (respecting foreign key constraints)

  // 1. Delete payments (depends on orders and users)
  const deletedPayments = await prisma.payment.deleteMany({});
  console.log(`Deleted ${deletedPayments.count} payments`);

  // 2. Delete order items (depends on orders)
  const deletedOrderItems = await prisma.orderItem.deleteMany({});
  console.log(`Deleted ${deletedOrderItems.count} order items`);

  // 3. Delete orders (depends on customers and staff)
  const deletedOrders = await prisma.order.deleteMany({});
  console.log(`Deleted ${deletedOrders.count} orders`);

  // 4. Delete customers
  const deletedCustomers = await prisma.customer.deleteMany({});
  console.log(`Deleted ${deletedCustomers.count} customers`);

  // 5. Delete salary payments (depends on staff)
  const deletedSalaryPayments = await prisma.salaryPayment.deleteMany({});
  console.log(`Deleted ${deletedSalaryPayments.count} salary payments`);

  // 6. Delete attendance records (depends on staff)
  const deletedAttendance = await prisma.attendance.deleteMany({});
  console.log(`Deleted ${deletedAttendance.count} attendance records`);

  // 7. Delete staff
  const deletedStaff = await prisma.staff.deleteMany({});
  console.log(`Deleted ${deletedStaff.count} staff members`);

  // 8. Delete expenses
  const deletedExpenses = await prisma.expense.deleteMany({});
  console.log(`Deleted ${deletedExpenses.count} expenses`);

  // 9. Delete suppliers
  const deletedSuppliers = await prisma.supplier.deleteMany({});
  console.log(`Deleted ${deletedSuppliers.count} suppliers`);

  // 10. Delete inventory
  const deletedInventory = await prisma.inventory.deleteMany({});
  console.log(`Deleted ${deletedInventory.count} inventory items`);

  // 11. Delete service prices that don't belong to super admin
  const deletedServicePrices = await prisma.servicePrice.deleteMany({
    where: {
      userId: {
        not: superAdmin.id,
      },
    },
  });
  console.log(`Deleted ${deletedServicePrices.count} service prices (kept super admin's)`);

  // 12. Delete NextAuth sessions and accounts for all users
  const deletedSessions = await prisma.session.deleteMany({});
  console.log(`Deleted ${deletedSessions.count} sessions`);

  const deletedAccounts = await prisma.account.deleteMany({});
  console.log(`Deleted ${deletedAccounts.count} accounts`);

  // 13. Delete all users except super admin
  const deletedUsers = await prisma.user.deleteMany({
    where: {
      email: {
        not: "olawuni.michael@gmail.com",
      },
    },
  });
  console.log(`Deleted ${deletedUsers.count} users (kept super admin)`);

  console.log("\n✅ Database cleanup completed successfully!");
  console.log("\nRemaining data:");
  console.log("- Super admin user: olawuni.michael@gmail.com");

  const servicePriceCount = await prisma.servicePrice.count({
    where: { userId: superAdmin.id },
  });
  console.log(`- Service prices: ${servicePriceCount}`);
}

main()
  .catch((e) => {
    console.error("Error during cleanup:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
