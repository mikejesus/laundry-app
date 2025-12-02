import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/dashboard/stats - Overall statistics
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get date ranges
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get all orders
    const allOrders = await prisma.order.findMany({
      where: { userId: session.user.id },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Today's stats
    const todaysOrders = allOrders.filter(
      (o) => o.createdAt >= today && o.createdAt < tomorrow
    );
    const todayRevenue = todaysOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const todayPaid = todaysOrders.reduce((sum, o) => sum + o.paidAmount, 0);

    // Weekly stats
    const weekOrders = allOrders.filter((o) => o.createdAt >= weekAgo);
    const weekRevenue = weekOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const weekPaid = weekOrders.reduce((sum, o) => sum + o.paidAmount, 0);

    // Monthly stats
    const monthOrders = allOrders.filter((o) => o.createdAt >= monthAgo);
    const monthRevenue = monthOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const monthPaid = monthOrders.reduce((sum, o) => sum + o.paidAmount, 0);

    // Overall outstanding
    const totalRevenue = allOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const totalPaid = allOrders.reduce((sum, o) => sum + o.paidAmount, 0);
    const totalOutstanding = totalRevenue - totalPaid;

    // Recent orders (last 10)
    const recentOrders = allOrders
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 10)
      .map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        customerName: order.customer.name,
        totalAmount: order.totalAmount,
        paidAmount: order.paidAmount,
        status: order.status,
        createdAt: order.createdAt,
      }));

    // Revenue by day for last 30 days
    const last30DaysOrders = allOrders.filter((o) => o.createdAt >= thirtyDaysAgo);
    const revenueByDate: Record<
      string,
      { date: string; revenue: number; paid: number; orders: number }
    > = {};

    // Initialize all dates
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      revenueByDate[dateStr] = { date: dateStr, revenue: 0, paid: 0, orders: 0 };
    }

    // Fill in actual data
    last30DaysOrders.forEach((order) => {
      const date = new Date(order.createdAt).toISOString().split("T")[0];
      if (revenueByDate[date]) {
        revenueByDate[date].revenue += order.totalAmount;
        revenueByDate[date].paid += order.paidAmount;
        revenueByDate[date].orders += 1;
      }
    });

    const dailyRevenue = Object.values(revenueByDate).sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    // Get all payments for payment method breakdown
    const allPayments = await prisma.payment.findMany({
      where: { userId: session.user.id },
    });

    const paymentMethodBreakdown = allPayments.reduce((acc, payment) => {
      acc[payment.method] = (acc[payment.method] || 0) + payment.amount;
      return acc;
    }, {} as Record<string, number>);

    // Top customers by revenue
    const customerRevenue: Record<
      string,
      { customerId: string; customerName: string; revenue: number; orderCount: number }
    > = {};

    allOrders.forEach((order) => {
      const id = order.customer.id;
      if (!customerRevenue[id]) {
        customerRevenue[id] = {
          customerId: id,
          customerName: order.customer.name,
          revenue: 0,
          orderCount: 0,
        };
      }
      customerRevenue[id].revenue += order.totalAmount;
      customerRevenue[id].orderCount += 1;
    });

    const topCustomers = Object.values(customerRevenue)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return NextResponse.json({
      today: {
        revenue: todayRevenue,
        paid: todayPaid,
        orders: todaysOrders.length,
      },
      week: {
        revenue: weekRevenue,
        paid: weekPaid,
        orders: weekOrders.length,
      },
      month: {
        revenue: monthRevenue,
        paid: monthPaid,
        orders: monthOrders.length,
      },
      overall: {
        totalRevenue,
        totalPaid,
        totalOutstanding,
        totalOrders: allOrders.length,
      },
      dailyRevenue,
      recentOrders,
      paymentMethodBreakdown,
      topCustomers,
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard stats" },
      { status: 500 }
    );
  }
}
