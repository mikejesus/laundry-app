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

// GET /api/staff/[id] - Get staff member details
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

    const staffMember = await prisma.staff.findUnique({
      where: { id: params.id },
      include: {
        ordersHandled: {
          where: {
            status: "completed",
          },
          select: {
            id: true,
            orderNumber: true,
            totalAmount: true,
            createdAt: true,
            status: true,
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 10,
        },
        salaryPayments: {
          orderBy: {
            paymentDate: "desc",
          },
        },
        attendances: {
          orderBy: {
            date: "desc",
          },
          take: 30,
        },
        _count: {
          select: {
            ordersHandled: {
              where: {
                status: "completed",
              },
            },
            attendances: {
              where: {
                status: "present",
              },
            },
          },
        },
      },
    });

    if (!staffMember) {
      return NextResponse.json(
        { error: "Staff member not found" },
        { status: 404 }
      );
    }

    if (staffMember.userId !== user.id) {
      return NextResponse.json(
        { error: "Unauthorized to access this staff member" },
        { status: 403 }
      );
    }

    return NextResponse.json(staffMember);
  } catch (error) {
    console.error("Error fetching staff member:", error);
    return NextResponse.json(
      { error: "Failed to fetch staff member" },
      { status: 500 }
    );
  }
}

// PUT /api/staff/[id] - Update staff member
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await ensureUserExists(clerkUserId);

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
      return NextResponse.json(
        { error: "Unauthorized to update this staff member" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      name,
      phone,
      email,
      role,
      salary,
      commissionRate,
      status,
      notes,
    } = body;

    // Validate if salary is being updated
    if (salary !== undefined && salary < 0) {
      return NextResponse.json(
        { error: "Salary must be non-negative" },
        { status: 400 }
      );
    }

    if (
      commissionRate !== undefined &&
      (commissionRate < 0 || commissionRate > 100)
    ) {
      return NextResponse.json(
        { error: "Commission rate must be between 0 and 100" },
        { status: 400 }
      );
    }

    const updatedStaff = await prisma.staff.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(phone && { phone }),
        ...(email !== undefined && { email: email || null }),
        ...(role && { role }),
        ...(salary !== undefined && { salary: parseFloat(salary) }),
        ...(commissionRate !== undefined && {
          commissionRate: parseFloat(commissionRate),
        }),
        ...(status && { status }),
        ...(notes !== undefined && { notes: notes || null }),
      },
    });

    return NextResponse.json(updatedStaff);
  } catch (error) {
    console.error("Error updating staff member:", error);
    return NextResponse.json(
      { error: "Failed to update staff member" },
      { status: 500 }
    );
  }
}

// DELETE /api/staff/[id] - Delete staff member
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await ensureUserExists(clerkUserId);

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
      return NextResponse.json(
        { error: "Unauthorized to delete this staff member" },
        { status: 403 }
      );
    }

    await prisma.staff.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Staff member deleted successfully" });
  } catch (error) {
    console.error("Error deleting staff member:", error);
    return NextResponse.json(
      { error: "Failed to delete staff member" },
      { status: 500 }
    );
  }
}
