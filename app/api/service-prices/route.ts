import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

// GET /api/service-prices - List all service prices for the user
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const serviceType = searchParams.get("serviceType");

    // Build where clause
    const where: any = { userId: session.user.id };
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
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { serviceType, itemType, price, bulk } = body;

    // Handle bulk update
    if (bulk && Array.isArray(bulk)) {
      const results = await Promise.all(
        bulk.map((item: { serviceType: string; itemType: string; price: number }) =>
          prisma.servicePrice.upsert({
            where: {
              userId_serviceType_itemType: {
                userId: session.user.id,
                serviceType: item.serviceType,
                itemType: item.itemType,
              },
            },
            update: {
              price: item.price,
            },
            create: {
              userId: session.user.id,
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
          userId: session.user.id,
          serviceType,
          itemType,
        },
      },
      update: {
        price,
      },
      create: {
        userId: session.user.id,
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
