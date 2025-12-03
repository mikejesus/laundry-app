import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

// GET /api/inventory/[id] - Get item details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const item = await prisma.inventory.findUnique({
      where: { id: params.id },
    });

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    if (item.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized to access this item" },
        { status: 403 }
      );
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error("Error fetching inventory item:", error);
    return NextResponse.json(
      { error: "Failed to fetch inventory item" },
      { status: 500 }
    );
  }
}

// PUT /api/inventory/[id] - Update stock levels
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const item = await prisma.inventory.findUnique({
      where: { id: params.id },
    });

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    if (item.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized to update this item" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, quantity, unit, minStockLevel, category, notes } = body;

    // Validate if quantity is being updated
    if (quantity !== undefined && quantity < 0) {
      return NextResponse.json(
        { error: "Quantity must be non-negative" },
        { status: 400 }
      );
    }

    if (minStockLevel !== undefined && minStockLevel < 0) {
      return NextResponse.json(
        { error: "Minimum stock level must be non-negative" },
        { status: 400 }
      );
    }

    const updatedItem = await prisma.inventory.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(quantity !== undefined && { quantity: parseFloat(quantity) }),
        ...(unit && { unit }),
        ...(minStockLevel !== undefined && {
          minStockLevel: parseFloat(minStockLevel),
        }),
        ...(category !== undefined && { category: category || null }),
        ...(notes !== undefined && { notes: notes || null }),
      },
    });

    return NextResponse.json(updatedItem);
  } catch (error) {
    console.error("Error updating inventory item:", error);
    return NextResponse.json(
      { error: "Failed to update inventory item" },
      { status: 500 }
    );
  }
}

// DELETE /api/inventory/[id] - Delete item
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const item = await prisma.inventory.findUnique({
      where: { id: params.id },
    });

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    if (item.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized to delete this item" },
        { status: 403 }
      );
    }

    await prisma.inventory.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Item deleted successfully" });
  } catch (error) {
    console.error("Error deleting inventory item:", error);
    return NextResponse.json(
      { error: "Failed to delete inventory item" },
      { status: 500 }
    );
  }
}
