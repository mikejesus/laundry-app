import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

// Helper function to ensure user exists in database
async function ensureUserExists(clerkUserId: string) {
  // Check if user exists
  let user = await prisma.user.findUnique({
    where: { clerkId: clerkUserId },
  });

  // If not, create the user
  if (!user) {
    const clerkUser = await (await clerkClient()).users.getUser(clerkUserId);
    user = await prisma.user.create({
      data: {
        clerkId: clerkUserId,
        email: clerkUser.emailAddresses[0]?.emailAddress || "",
        firstName: clerkUser.firstName || "",
        lastName: clerkUser.lastName || "",
      },
    });
  }

  return user;
}

// GET /api/service-prices - List all service prices for the user
export async function GET(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Ensure user exists in database
    const user = await ensureUserExists(clerkUserId);

    const { searchParams } = new URL(request.url);
    const serviceType = searchParams.get("serviceType");

    // Build where clause
    const where: any = { userId: user.id };
    if (serviceType) {
      where.serviceType = serviceType;
    }

    const servicePrices = await prisma.servicePrice.findMany({
      where,
      orderBy: [
        { serviceType: "asc" },
        { itemType: "asc" },
      ],
    });

    return NextResponse.json(servicePrices);
  } catch (error) {
    console.error("Error fetching service prices:", error);
    return NextResponse.json(
      { error: "Failed to fetch service prices" },
      { status: 500 }
    );
  }
}

// POST /api/service-prices - Create or update service price (upsert)
export async function POST(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Ensure user exists in database
    const user = await ensureUserExists(clerkUserId);

    const body = await request.json();
    const { serviceType, itemType, price, bulk } = body;

    // Handle bulk update
    if (bulk && Array.isArray(bulk)) {
      const results = await Promise.all(
        bulk.map((item: { serviceType: string; itemType: string; price: number }) =>
          prisma.servicePrice.upsert({
            where: {
              userId_serviceType_itemType: {
                userId: user.id,
                serviceType: item.serviceType,
                itemType: item.itemType,
              },
            },
            update: {
              price: item.price,
            },
            create: {
              userId: user.id,
              serviceType: item.serviceType,
              itemType: item.itemType,
              price: item.price,
            },
          })
        )
      );

      return NextResponse.json({
        message: "Prices updated successfully",
        count: results.length,
        prices: results
      });
    }

    // Handle single update
    if (!serviceType || !itemType || price === undefined) {
      return NextResponse.json(
        { error: "serviceType, itemType, and price are required" },
        { status: 400 }
      );
    }

    if (price < 0) {
      return NextResponse.json(
        { error: "Price must be a positive number" },
        { status: 400 }
      );
    }

    const servicePrice = await prisma.servicePrice.upsert({
      where: {
        userId_serviceType_itemType: {
          userId: user.id,
          serviceType,
          itemType,
        },
      },
      update: {
        price,
      },
      create: {
        userId: user.id,
        serviceType,
        itemType,
        price,
      },
    });

    return NextResponse.json(servicePrice);
  } catch (error) {
    console.error("Error creating/updating service price:", error);
    return NextResponse.json(
      { error: "Failed to create/update service price" },
      { status: 500 }
    );
  }
}
