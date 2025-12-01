// Staff utility functions and constants

// Staff roles
export const STAFF_ROLES = [
  { value: "manager", label: "Manager" },
  { value: "attendant", label: "Attendant" },
  { value: "delivery", label: "Delivery" },
] as const;

// Staff status options
export const STAFF_STATUS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "terminated", label: "Terminated" },
] as const;

// Attendance status options
export const ATTENDANCE_STATUS = [
  { value: "present", label: "Present" },
  { value: "absent", label: "Absent" },
  { value: "leave", label: "On Leave" },
  { value: "half_day", label: "Half Day" },
] as const;

// Payment methods for salary
export const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "mobile_money", label: "Mobile Money" },
  { value: "cheque", label: "Cheque" },
] as const;

// Get role label
export function getRoleLabel(role: string): string {
  const found = STAFF_ROLES.find((r) => r.value === role);
  return found ? found.label : role;
}

// Get status label
export function getStatusLabel(status: string): string {
  const found = STAFF_STATUS.find((s) => s.value === status);
  return found ? found.label : status;
}

// Get attendance status label
export function getAttendanceStatusLabel(status: string): string {
  const found = ATTENDANCE_STATUS.find((s) => s.value === status);
  return found ? found.label : status;
}

// Get payment method label
export function getPaymentMethodLabel(method: string): string {
  const found = PAYMENT_METHODS.find((m) => m.value === method);
  return found ? found.label : method;
}

// Get status badge color
export function getStatusColor(status: string): string {
  switch (status) {
    case "active":
      return "bg-green-100 text-green-800";
    case "inactive":
      return "bg-yellow-100 text-yellow-800";
    case "terminated":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

// Get attendance status color
export function getAttendanceColor(status: string): string {
  switch (status) {
    case "present":
      return "bg-green-100 text-green-800";
    case "absent":
      return "bg-red-100 text-red-800";
    case "leave":
      return "bg-blue-100 text-blue-800";
    case "half_day":
      return "bg-yellow-100 text-yellow-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

// Calculate commission based on orders completed
export function calculateCommission(
  ordersAmount: number,
  commissionRate: number
): number {
  return (ordersAmount * commissionRate) / 100;
}

// Format month string for display
export function formatMonth(monthString: string): string {
  const [year, month] = monthString.split("-");
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

// Get current month string (YYYY-MM)
export function getCurrentMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

// Calculate total earnings (salary + commission)
export function calculateTotalEarnings(
  salary: number,
  commission: number
): number {
  return salary + commission;
}

// Calculate working days in a month
export function getWorkingDaysInMonth(year: number, month: number): number {
  const date = new Date(year, month, 1);
  let workingDays = 0;

  while (date.getMonth() === month) {
    const dayOfWeek = date.getDay();
    // Excluding Sundays (0)
    if (dayOfWeek !== 0) {
      workingDays++;
    }
    date.setDate(date.getDate() + 1);
  }

  return workingDays;
}

// Calculate attendance percentage
export function calculateAttendancePercentage(
  presentDays: number,
  totalDays: number
): number {
  if (totalDays === 0) return 0;
  return Math.round((presentDays / totalDays) * 100);
}

// Interface for staff member
export interface StaffMember {
  id: string;
  name: string;
  phone: string;
  email?: string;
  role: string;
  salary: number;
  commissionRate: number;
  hireDate: string;
  status: string;
  notes?: string;
}

// Interface for attendance record
export interface AttendanceRecord {
  id: string;
  date: string;
  status: string;
  checkIn?: string;
  checkOut?: string;
  notes?: string;
}

// Interface for salary payment
export interface SalaryPaymentRecord {
  id: string;
  amount: number;
  commission: number;
  totalPaid: number;
  month: string;
  paymentDate: string;
  paymentMethod: string;
  ordersCompleted: number;
  notes?: string;
}
