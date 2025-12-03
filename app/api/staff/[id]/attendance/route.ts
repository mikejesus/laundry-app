import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

// GET /api/staff/[id]/attendance - Get attendance records
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month"); // Format: YYYY-MM

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

    if (staffMember.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Build where clause
    const where: any = { staffId: params.id };

    if (month) {
      const [year, monthNum] = month.split("-");
      const startDate = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(monthNum), 0);
      endDate.setHours(23, 59, 59, 999);

      where.date = {
        gte: startDate,
        lte: endDate,
      };
    }

    const attendance = await prisma.attendance.findMany({
      where,
      orderBy: {
        date: "desc",
      },
    });

    // Calculate statistics
    const totalDays = attendance.length;
    const presentDays = attendance.filter((a) => a.status === "present").length;
    const absentDays = attendance.filter((a) => a.status === "absent").length;
    const leaveDays = attendance.filter((a) => a.status === "leave").length;
    const halfDays = attendance.filter((a) => a.status === "half_day").length;

    return NextResponse.json({
      attendance,
      statistics: {
        totalDays,
        presentDays,
        absentDays,
        leaveDays,
        halfDays,
        attendancePercentage:
          totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0,
      },
    });
  } catch (error) {
    console.error("Error fetching attendance:", error);
    return NextResponse.json(
      { error: "Failed to fetch attendance" },
      { status: 500 }
    );
  }
}

// POST /api/staff/[id]/attendance - Mark attendance
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    if (staffMember.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { date, status, checkIn, checkOut, notes } = body;

    // Validate required fields
    if (!date || !status) {
      return NextResponse.json(
        { error: "Date and status are required" },
        { status: 400 }
      );
    }

    // Check if attendance already exists for this date
    const existingAttendance = await prisma.attendance.findUnique({
      where: {
        staffId_date: {
          staffId: params.id,
          date: new Date(date),
        },
      },
    });

    let attendance;

    if (existingAttendance) {
      // Update existing attendance
      attendance = await prisma.attendance.update({
        where: { id: existingAttendance.id },
        data: {
          status,
          checkIn: checkIn ? new Date(checkIn) : null,
          checkOut: checkOut ? new Date(checkOut) : null,
          notes: notes || null,
        },
      });
    } else {
      // Create new attendance record
      attendance = await prisma.attendance.create({
        data: {
          staffId: params.id,
          date: new Date(date),
          status,
          checkIn: checkIn ? new Date(checkIn) : null,
          checkOut: checkOut ? new Date(checkOut) : null,
          notes: notes || null,
        },
      });
    }

    return NextResponse.json(attendance, {
      status: existingAttendance ? 200 : 201,
    });
  } catch (error) {
    console.error("Error marking attendance:", error);
    return NextResponse.json(
      { error: "Failed to mark attendance" },
      { status: 500 }
    );
  }
}
