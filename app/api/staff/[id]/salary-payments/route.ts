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

// GET /api/staff/[id]/salary-payments - Get salary payment history
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await ensureUserExists(clerkUserId);

    // Verify staff member belongs to user
    const staffMember = await prisma.staff.findUnique({
      where: { id: params.id },
    });

    if (!staffMember) {
      return NextResponse.json(
        { error: "Staff member not found" },
        { status: 404 }
      );
    }

    if (staffMember.userId !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const payments = await prisma.salaryPayment.findMany({
      where: { staffId: params.id },
      orderBy: {
        paymentDate: "desc",
      },
    });

    // Calculate statistics
    const totalPaid = payments.reduce((sum, p) => sum + p.totalPaid, 0);
    const totalCommission = payments.reduce((sum, p) => sum + p.commission, 0);
    const totalOrders = payments.reduce((sum, p) => sum + p.ordersCompleted, 0);

    return NextResponse.json({
      payments,
      statistics: {
        totalPaid,
        totalCommission,
        totalOrders,
        paymentCount: payments.length,
      },
    });
  } catch (error) {
    console.error("Error fetching salary payments:", error);
    return NextResponse.json(
      { error: "Failed to fetch salary payments" },
      { status: 500 }
    );
  }
}

// POST /api/staff/[id]/salary-payments - Record salary payment
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await ensureUserExists(clerkUserId);

    // Verify staff member belongs to user
    const staffMember = await prisma.staff.findUnique({
      where: { id: params.id },
    });

    if (!staffMember) {
      return NextResponse.json(
        { error: "Staff member not found" },
        { status: 404 }
      );
    }

    if (staffMember.userId !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const {
      amount,
      commission,
      month,
      paymentMethod,
      ordersCompleted,
      paymentDate,
      notes,
    } = body;

    // Validate required fields
    if (!amount || !month || !paymentMethod) {
      return NextResponse.json(
        { error: "Amount, month, and payment method are required" },
        { status: 400 }
      );
    }

    if (amount < 0) {
      return NextResponse.json(
        { error: "Amount must be non-negative" },
        { status: 400 }
      );
    }

    if (commission !== undefined && commission < 0) {
      return NextResponse.json(
        { error: "Commission must be non-negative" },
        { status: 400 }
      );
    }

    const parsedAmount = parseFloat(amount);
    const parsedCommission = commission ? parseFloat(commission) : 0;
    const totalPaid = parsedAmount + parsedCommission;

    const payment = await prisma.salaryPayment.create({
      data: {
        staffId: params.id,
        amount: parsedAmount,
        commission: parsedCommission,
        totalPaid,
        month,
        paymentMethod,
        ordersCompleted: ordersCompleted || 0,
        paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
        notes: notes || null,
      },
    });

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    console.error("Error recording salary payment:", error);
    return NextResponse.json(
      { error: "Failed to record salary payment" },
      { status: 500 }
    );
  }
}
