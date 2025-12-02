import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/inventory - List inventory items with low stock alerts
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const lowStockOnly = searchParams.get("lowStockOnly") === "true";
    const search = searchParams.get("search");

    // Build where clause
    const where: any = { userId: session.user.id };

    if (category) {
      where.category = category;
    }

    if (search) {
      where.name = {
        contains: search,
        mode: "insensitive",
      };
    }

    let items = await prisma.inventory.findMany({
      where,
      orderBy: {
        name: "asc",
      },
    });

    // Filter low stock items if requested
    if (lowStockOnly) {
      items = items.filter((item) => item.quantity <= item.minStockLevel);
    }

    // Calculate stock statistics
    const totalItems = items.length;
    const lowStockItems = items.filter(
      (item) => item.quantity <= item.minStockLevel
    );
    const outOfStockItems = items.filter((item) => item.quantity === 0);

    return NextResponse.json({
      items,
      statistics: {
        totalItems,
        lowStockCount: lowStockItems.length,
        outOfStockCount: outOfStockItems.length,
      },
    });
  } catch (error) {
    console.error("Error fetching inventory:", error);
    return NextResponse.json(
      { error: "Failed to fetch inventory" },
      { status: 500 }
    );
  }
}

// POST /api/inventory - Add inventory item
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, quantity, unit, minStockLevel, category, notes } = body;

    // Validate required fields
    if (!name || quantity === undefined || !unit || minStockLevel === undefined) {
      return NextResponse.json(
        { error: "Name, quantity, unit, and minimum stock level are required" },
        { status: 400 }
      );
    }

    if (quantity < 0 || minStockLevel < 0) {
      return NextResponse.json(
        { error: "Quantity and minimum stock level must be non-negative" },
        { status: 400 }
      );
    }

    const item = await prisma.inventory.create({
      data: {
        userId: session.user.id,
        name,
        quantity: parseFloat(quantity),
        unit,
        minStockLevel: parseFloat(minStockLevel),
        category: category || null,
        notes: notes || null,
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error("Error creating inventory item:", error);
    return NextResponse.json(
      { error: "Failed to create inventory item" },
      { status: 500 }
    );
  }
}
