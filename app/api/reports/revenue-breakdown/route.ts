import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

// GET /api/reports/revenue-breakdown - Revenue by service type
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Build date filter
    const dateFilter: any = {};
    if (startDate) {
      dateFilter.gte = new Date(startDate);
    }
    if (endDate) {
      dateFilter.lte = new Date(endDate);
    }

    // Get all orders with items
    const orders = await prisma.order.findMany({
      where: {
        userId: session.user.id,
        ...(Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {}),
      },
      include: {
        items: true,
      },
    });

    // Group by service type from order items
    const revenueByService: Record<string, { serviceType: string; totalRevenue: number; itemCount: number }> = {};

    orders.forEach((order) => {
      order.items.forEach((item) => {
        if (!revenueByService[item.serviceType]) {
          revenueByService[item.serviceType] = {
            serviceType: item.serviceType,
            totalRevenue: 0,
            itemCount: 0,
          };
        }
        revenueByService[item.serviceType].totalRevenue += item.quantity * item.price;
        revenueByService[item.serviceType].itemCount += item.quantity;
      });
    });

    return NextResponse.json({
      breakdown: Object.values(revenueByService).sort(
        (a, b) => b.totalRevenue - a.totalRevenue
      ),
    });
  } catch (error) {
    console.error("Error fetching revenue breakdown:", error);
    return NextResponse.json(
      { error: "Failed to fetch revenue breakdown" },
      { status: 500 }
    );
  }
}
