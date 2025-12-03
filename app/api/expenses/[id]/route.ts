import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

// GET /api/expenses/[id] - Get expense details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const expense = await prisma.expense.findUnique({
      where: { id: params.id },
      include: {
        supplier: true,
      },
    });

    if (!expense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    if (expense.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized to access this expense" },
        { status: 403 }
      );
    }

    return NextResponse.json(expense);
  } catch (error) {
    console.error("Error fetching expense:", error);
    return NextResponse.json(
      { error: "Failed to fetch expense" },
      { status: 500 }
    );
  }
}

// PUT /api/expenses/[id] - Update expense
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const expense = await prisma.expense.findUnique({
      where: { id: params.id },
    });

    if (!expense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    if (expense.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized to update this expense" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { category, amount, description, date, supplierId, receiptUrl } = body;

    const updatedExpense = await prisma.expense.update({
      where: { id: params.id },
      data: {
        ...(category && { category }),
        ...(amount && { amount: parseFloat(amount) }),
        ...(description && { description }),
        ...(date && { date: new Date(date) }),
        ...(supplierId !== undefined && { supplierId: supplierId || null }),
        ...(receiptUrl !== undefined && { receiptUrl: receiptUrl || null }),
      },
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(updatedExpense);
  } catch (error) {
    console.error("Error updating expense:", error);
    return NextResponse.json(
      { error: "Failed to update expense" },
      { status: 500 }
    );
  }
}

// DELETE /api/expenses/[id] - Delete expense
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const expense = await prisma.expense.findUnique({
      where: { id: params.id },
    });

    if (!expense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    if (expense.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized to delete this expense" },
        { status: 403 }
      );
    }

    await prisma.expense.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Expense deleted successfully" });
  } catch (error) {
    console.error("Error deleting expense:", error);
    return NextResponse.json(
      { error: "Failed to delete expense" },
      { status: 500 }
    );
  }
}
