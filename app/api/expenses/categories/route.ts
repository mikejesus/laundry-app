import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/expenses/categories - Get expense by category summary
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Build where clause
    const where: any = { userId: session.user.id };

    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = new Date(startDate);
      }
      if (endDate) {
        where.date.lte = new Date(endDate);
      }
    }

    // Get all expenses in the date range
    const expenses = await prisma.expense.findMany({
      where,
      select: {
        category: true,
        amount: true,
        date: true,
      },
    });

    // Group by category
    const categoryBreakdown = expenses.reduce((acc, expense) => {
      if (!acc[expense.category]) {
        acc[expense.category] = {
          category: expense.category,
          total: 0,
          count: 0,
        };
      }
      acc[expense.category].total += expense.amount;
      acc[expense.category].count += 1;
      return acc;
    }, {} as Record<string, { category: string; total: number; count: number }>);

    // Group by month
    const monthlyBreakdown: Record<string, number> = {};
    expenses.forEach((expense) => {
      const date = new Date(expense.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      monthlyBreakdown[monthKey] = (monthlyBreakdown[monthKey] || 0) + expense.amount;
    });

    const monthlyData = Object.entries(monthlyBreakdown)
      .map(([month, total]) => ({ month, total }))
      .sort((a, b) => a.month.localeCompare(b.month));

    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    return NextResponse.json({
      totalExpenses,
      expenseCount: expenses.length,
      categoryBreakdown: Object.values(categoryBreakdown).sort(
        (a, b) => b.total - a.total
      ),
      monthlyBreakdown: monthlyData,
    });
  } catch (error) {
    console.error("Error fetching expense categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch expense categories" },
      { status: 500 }
    );
  }
}
