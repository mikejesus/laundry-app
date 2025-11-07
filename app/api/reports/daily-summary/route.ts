import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

async function ensureUserExists(clerkUserId: string) {
  let user = await prisma.user.findUnique({
    where: { clerkId: clerkUserId },
  });

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

// GET /api/reports/daily-summary - Get today's summary
export async function GET(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await ensureUserExists(clerkUserId);

    // Get start and end of today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get today's orders
    const todaysOrders = await prisma.order.findMany({
      where: {
        userId: user.id,
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      },
      include: {
        payments: true,
      },
    });

    // Get today's payments (including payments for older orders)
    const todaysPayments = await prisma.payment.findMany({
      where: {
        userId: user.id,
        date: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    const totalOrderRevenue = todaysOrders.reduce(
      (sum, order) => sum + order.totalAmount,
      0
    );
    const totalPaymentsReceived = todaysPayments.reduce(
      (sum, payment) => sum + payment.amount,
      0
    );

    // Get status breakdown
    const statusBreakdown = todaysOrders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Get payment method breakdown
    const paymentMethodBreakdown = todaysPayments.reduce((acc, payment) => {
      acc[payment.method] = (acc[payment.method] || 0) + payment.amount;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      ordersCreated: todaysOrders.length,
      totalOrderRevenue,
      totalPaymentsReceived,
      statusBreakdown,
      paymentMethodBreakdown,
      date: today.toISOString(),
    });
  } catch (error) {
    console.error("Error fetching daily summary:", error);
    return NextResponse.json(
      { error: "Failed to fetch daily summary" },
      { status: 500 }
    );
  }
}
