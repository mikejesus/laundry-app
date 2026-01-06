import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting seed...");

  // Create super admin user
  const superAdminPassword = await bcrypt.hash("SuperAdmin@2026!Secure#", 12);
  const superAdmin = await prisma.user.upsert({
    where: { email: "olawuni.michael@gmail.com" },
    update: {
      role: "super_admin", // Ensure role is updated if user exists
      status: "active",
    },
    create: {
      email: "olawuni.michael@gmail.com",
      password: superAdminPassword,
      firstName: "Michael",
      lastName: "Olawuni",
      role: "super_admin",
      status: "active",
    },
  });

  console.log("Created/Updated super admin user:", superAdmin);

  // Create default service pricing
  const servicePricing = [
    // Wash & Iron
    { serviceType: "wash_and_iron", itemType: "Shirt", price: 200 },
    { serviceType: "wash_and_iron", itemType: "Trouser/Pants", price: 250 },
    { serviceType: "wash_and_iron", itemType: "Dress", price: 500 },
    { serviceType: "wash_and_iron", itemType: "Suit", price: 1000 },
    { serviceType: "wash_and_iron", itemType: "Bedsheet", price: 400 },
    { serviceType: "wash_and_iron", itemType: "Duvet", price: 800 },
    { serviceType: "wash_and_iron", itemType: "Curtain", price: 600 },
    { serviceType: "wash_and_iron", itemType: "Agbada", price: 1500 },
    { serviceType: "wash_and_iron", itemType: "Native Wear", price: 800 },
    { serviceType: "wash_and_iron", itemType: "Skirt", price: 250 },
    { serviceType: "wash_and_iron", itemType: "Blouse", price: 200 },

    // Dry Cleaning (typically more expensive)
    { serviceType: "dry_cleaning", itemType: "Shirt", price: 350 },
    { serviceType: "dry_cleaning", itemType: "Trouser/Pants", price: 400 },
    { serviceType: "dry_cleaning", itemType: "Dress", price: 800 },
    { serviceType: "dry_cleaning", itemType: "Suit", price: 1500 },
    { serviceType: "dry_cleaning", itemType: "Bedsheet", price: 600 },
    { serviceType: "dry_cleaning", itemType: "Duvet", price: 1200 },
    { serviceType: "dry_cleaning", itemType: "Curtain", price: 1000 },
    { serviceType: "dry_cleaning", itemType: "Agbada", price: 2000 },
    { serviceType: "dry_cleaning", itemType: "Native Wear", price: 1200 },
    { serviceType: "dry_cleaning", itemType: "Skirt", price: 400 },
    { serviceType: "dry_cleaning", itemType: "Blouse", price: 350 },

    // Iron Only (cheaper - no washing)
    { serviceType: "iron_only", itemType: "Shirt", price: 100 },
    { serviceType: "iron_only", itemType: "Trouser/Pants", price: 150 },
    { serviceType: "iron_only", itemType: "Dress", price: 250 },
    { serviceType: "iron_only", itemType: "Suit", price: 500 },
    { serviceType: "iron_only", itemType: "Bedsheet", price: 200 },
    { serviceType: "iron_only", itemType: "Duvet", price: 400 },
    { serviceType: "iron_only", itemType: "Curtain", price: 300 },
    { serviceType: "iron_only", itemType: "Agbada", price: 800 },
    { serviceType: "iron_only", itemType: "Native Wear", price: 400 },
    { serviceType: "iron_only", itemType: "Skirt", price: 150 },
    { serviceType: "iron_only", itemType: "Blouse", price: 100 },

    // Starching
    { serviceType: "starching", itemType: "Shirt", price: 150 },
    { serviceType: "starching", itemType: "Trouser/Pants", price: 200 },
    { serviceType: "starching", itemType: "Dress", price: 350 },
    { serviceType: "starching", itemType: "Suit", price: 700 },
    { serviceType: "starching", itemType: "Bedsheet", price: 300 },
    { serviceType: "starching", itemType: "Duvet", price: 600 },
    { serviceType: "starching", itemType: "Curtain", price: 400 },
    { serviceType: "starching", itemType: "Agbada", price: 1000 },
    { serviceType: "starching", itemType: "Native Wear", price: 600 },
    { serviceType: "starching", itemType: "Skirt", price: 200 },
    { serviceType: "starching", itemType: "Blouse", price: 150 },

    // Wash & Fold (similar to wash & iron)
    { serviceType: "wash_and_fold", itemType: "Shirt", price: 180 },
    { serviceType: "wash_and_fold", itemType: "Trouser/Pants", price: 220 },
    { serviceType: "wash_and_fold", itemType: "Dress", price: 450 },
    { serviceType: "wash_and_fold", itemType: "Suit", price: 900 },
    { serviceType: "wash_and_fold", itemType: "Bedsheet", price: 350 },
    { serviceType: "wash_and_fold", itemType: "Duvet", price: 700 },
    { serviceType: "wash_and_fold", itemType: "Curtain", price: 550 },
    { serviceType: "wash_and_fold", itemType: "Agbada", price: 1300 },
    { serviceType: "wash_and_fold", itemType: "Native Wear", price: 700 },
    { serviceType: "wash_and_fold", itemType: "Skirt", price: 220 },
    { serviceType: "wash_and_fold", itemType: "Blouse", price: 180 },
  ];

  await prisma.servicePrice.createMany({
    data: servicePricing.map((price) => ({
      ...price,
      userId: superAdmin.id,
    })),
  });

  console.log("Created default service pricing");

  console.log("Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("Error during seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
