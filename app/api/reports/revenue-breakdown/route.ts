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

// GET /api/reports/revenue-breakdown - Revenue by service type
export async function GET(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await ensureUserExists(clerkUserId);

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

    // Get all orders
    const orders = await prisma.order.findMany({
      where: {
        userId: user.id,
        ...(Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {}),
      },
    });

    // Group by service type
    const revenueByService = orders.reduce((acc, order) => {
      if (!acc[order.serviceType]) {
        acc[order.serviceType] = {
          serviceType: order.serviceType,
          totalRevenue: 0,
          orderCount: 0,
        };
      }
      acc[order.serviceType].totalRevenue += order.totalAmount;
      acc[order.serviceType].orderCount += 1;
      return acc;
    }, {} as Record<string, { serviceType: string; totalRevenue: number; orderCount: number }>);

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
