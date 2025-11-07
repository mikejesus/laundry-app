import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

// DELETE /api/service-prices/[id] - Delete a service price
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    // Check if the service price exists and belongs to the user
    const servicePrice = await prisma.servicePrice.findUnique({
      where: { id },
    });

    if (!servicePrice) {
      return NextResponse.json(
        { error: "Service price not found" },
        { status: 404 }
      );
    }

    if (servicePrice.userId !== userId) {
      return NextResponse.json(
        { error: "Unauthorized to delete this service price" },
        { status: 403 }
      );
    }

    await prisma.servicePrice.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Service price deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting service price:", error);
    return NextResponse.json(
      { error: "Failed to delete service price" },
      { status: 500 }
    );
  }
}
