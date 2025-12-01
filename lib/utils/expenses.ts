// Expense utility functions and constants

// Expense categories
export const EXPENSE_CATEGORIES = [
  { value: "detergents", label: "Detergents & Supplies" },
  { value: "equipment", label: "Equipment" },
  { value: "electricity", label: "Electricity" },
  { value: "water", label: "Water" },
  { value: "generator_fuel", label: "Generator Fuel" },
  { value: "salaries", label: "Salaries" },
  { value: "rent", label: "Rent" },
  { value: "transportation", label: "Transportation" },
  { value: "maintenance", label: "Maintenance & Repairs" },
  { value: "miscellaneous", label: "Miscellaneous" },
] as const;

// Get category label
export function getCategoryLabel(category: string): string {
  const found = EXPENSE_CATEGORIES.find((c) => c.value === category);
  return found ? found.label : category;
}

// Get category color for charts
export function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    detergents: "#3B82F6", // blue
    equipment: "#8B5CF6", // purple
    electricity: "#F59E0B", // amber
    water: "#06B6D4", // cyan
    generator_fuel: "#EF4444", // red
    salaries: "#10B981", // green
    rent: "#EC4899", // pink
    transportation: "#6366F1", // indigo
    maintenance: "#F97316", // orange
    miscellaneous: "#6B7280", // gray
  };
  return colors[category] || "#6B7280";
}

// Format currency (Nigerian Naira)
export function formatCurrency(amount: number): string {
  return `₦${amount.toLocaleString()}`;
}

// Calculate total expenses
export interface Expense {
  id: string;
  category: string;
  amount: number;
  description: string;
  date: Date | string;
}

export function calculateTotalExpenses(expenses: Expense[]): number {
  return expenses.reduce((total, expense) => total + expense.amount, 0);
}

// Group expenses by category
export function groupExpensesByCategory(
  expenses: Expense[]
): Record<string, { total: number; count: number }> {
  return expenses.reduce((acc, expense) => {
    if (!acc[expense.category]) {
      acc[expense.category] = { total: 0, count: 0 };
    }
    acc[expense.category].total += expense.amount;
    acc[expense.category].count += 1;
    return acc;
  }, {} as Record<string, { total: number; count: number }>);
}

// Group expenses by month
export function groupExpensesByMonth(
  expenses: Expense[]
): Record<string, number> {
  return expenses.reduce((acc, expense) => {
    const date = new Date(expense.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    acc[monthKey] = (acc[monthKey] || 0) + expense.amount;
    return acc;
  }, {} as Record<string, number>);
}

// Get date range presets
export function getDateRangePreset(preset: string): { start: Date; end: Date } | null {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const end = new Date(today);
  end.setHours(23, 59, 59, 999);

  let start = new Date(today);

  switch (preset) {
    case "today":
      return { start, end };

    case "yesterday":
      start.setDate(start.getDate() - 1);
      end.setDate(end.getDate() - 1);
      return { start, end };

    case "this_week":
      start.setDate(start.getDate() - start.getDay());
      return { start, end };

    case "last_week":
      start.setDate(start.getDate() - start.getDay() - 7);
      end.setDate(end.getDate() - end.getDay() - 1);
      return { start, end };

    case "this_month":
      start.setDate(1);
      return { start, end };

    case "last_month":
      start.setMonth(start.getMonth() - 1);
      start.setDate(1);
      end.setDate(0); // Last day of previous month
      return { start, end };

    case "last_30_days":
      start.setDate(start.getDate() - 30);
      return { start, end };

    case "last_90_days":
      start.setDate(start.getDate() - 90);
      return { start, end };

    default:
      return null;
  }
}
