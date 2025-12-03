import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

// GET /api/reports/income - Get income data by date range
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

    // Get orders with payments
    const orders = await prisma.order.findMany({
      where: {
        userId: session.user.id,
        ...(Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {}),
      },
      include: {
        payments: true,
        customer: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Calculate totals
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    const totalPaid = orders.reduce((sum, order) => sum + order.paidAmount, 0);
    const totalOutstanding = totalRevenue - totalPaid;

    // Group by date for chart data
    const revenueByDate: Record<string, { date: string; revenue: number; paid: number }> = {};

    orders.forEach((order) => {
      const date = new Date(order.createdAt).toISOString().split("T")[0];
      if (!revenueByDate[date]) {
        revenueByDate[date] = { date, revenue: 0, paid: 0 };
      }
      revenueByDate[date].revenue += order.totalAmount;
      revenueByDate[date].paid += order.paidAmount;
    });

    const dailyRevenue = Object.values(revenueByDate).sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    return NextResponse.json({
      totalRevenue,
      totalPaid,
      totalOutstanding,
      orderCount: orders.length,
      dailyRevenue,
      orders: orders.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        customerName: order.customer.name,
        totalAmount: order.totalAmount,
        paidAmount: order.paidAmount,
        status: order.status,
        createdAt: order.createdAt,
      })),
    });
  } catch (error) {
    console.error("Error fetching income data:", error);
    return NextResponse.json(
      { error: "Failed to fetch income data" },
      { status: 500 }
    );
  }
}
