import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

// GET /api/staff - List all staff members
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role");
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    // Build where clause
    const where: any = { userId: session.user.id };

    if (role && role !== "all") {
      where.role = role;
    }

    if (status && status !== "all") {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const staff = await prisma.staff.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        _count: {
          select: {
            ordersHandled: true,
            salaryPayments: true,
            attendances: {
              where: {
                status: "present",
              },
            },
          },
        },
      },
    });

    // Calculate statistics
    const totalStaff = staff.length;
    const activeStaff = staff.filter((s) => s.status === "active").length;
    const totalSalary = staff
      .filter((s) => s.status === "active")
      .reduce((sum, s) => sum + s.salary, 0);

    return NextResponse.json({
      staff,
      statistics: {
        totalStaff,
        activeStaff,
        totalSalary,
      },
    });
  } catch (error) {
    console.error("Error fetching staff:", error);
    return NextResponse.json(
      { error: "Failed to fetch staff" },
      { status: 500 }
    );
  }
}

// POST /api/staff - Add new staff member
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      phone,
      email,
      role,
      salary,
      commissionRate,
      hireDate,
      notes,
    } = body;

    // Validate required fields
    if (!name || !phone || !role || salary === undefined) {
      return NextResponse.json(
        { error: "Name, phone, role, and salary are required" },
        { status: 400 }
      );
    }

    if (salary < 0) {
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

    const staffMember = await prisma.staff.create({
      data: {
        userId: session.user.id,
        name,
        phone,
        email: email || null,
        role,
        salary: parseFloat(salary),
        commissionRate: commissionRate ? parseFloat(commissionRate) : 0,
        hireDate: hireDate ? new Date(hireDate) : new Date(),
        notes: notes || null,
      },
    });

    return NextResponse.json(staffMember, { status: 201 });
  } catch (error) {
    console.error("Error creating staff member:", error);
    return NextResponse.json(
      { error: "Failed to create staff member" },
      { status: 500 }
    );
  }
}
