// Order utility functions

// Service types available
export const SERVICE_TYPES = [
  { value: "wash_and_iron", label: "Wash & Iron" },
  { value: "dry_cleaning", label: "Dry Cleaning" },
  { value: "iron_only", label: "Iron Only" },
  { value: "starching", label: "Starching" },
  { value: "wash_and_fold", label: "Wash & Fold" },
] as const;

// Order statuses
export const ORDER_STATUSES = [
  { value: "received", label: "Received", color: "bg-yellow-100 text-yellow-800" },
  { value: "in_progress", label: "In Progress", color: "bg-blue-100 text-blue-800" },
  { value: "ready", label: "Ready", color: "bg-purple-100 text-purple-800" },
  { value: "delivered", label: "Delivered", color: "bg-green-100 text-green-800" },
  { value: "cancelled", label: "Cancelled", color: "bg-red-100 text-red-800" },
] as const;

// Payment methods
export const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "card", label: "Card" },
  { value: "mobile_money", label: "Mobile Money" },
  { value: "pos", label: "POS" },
] as const;

// Common laundry items with default prices
export const COMMON_ITEMS = [
  { type: "Shirt", defaultPrice: 200 },
  { type: "Trouser/Pants", defaultPrice: 250 },
  { type: "Dress", defaultPrice: 500 },
  { type: "Suit", defaultPrice: 1000 },
  { type: "Skirt", defaultPrice: 250 },
  { type: "Blouse", defaultPrice: 200 },
  { type: "Bedsheet", defaultPrice: 400 },
  { type: "Duvet", defaultPrice: 800 },
  { type: "Curtain", defaultPrice: 600 },
  { type: "Towel", defaultPrice: 150 },
  { type: "Jacket", defaultPrice: 600 },
  { type: "Blazer", defaultPrice: 700 },
  { type: "Native Wear", defaultPrice: 800 },
  { type: "Agbada", defaultPrice: 1500 },
  { type: "Blanket", defaultPrice: 500 },
];

// Generate unique order number
export function generateOrderNumber(): string {
  const prefix = "LDY";
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
  return `${prefix}-${timestamp}-${random}`;
}

// Calculate order totals
export interface OrderItem {
  itemType: string;
  quantity: number;
  price: number;
}

export function calculateOrderTotal(items: OrderItem[]): number {
  return items.reduce((total, item) => total + (item.quantity * item.price), 0);
}

// Get payment status
export function getPaymentStatus(totalAmount: number, paidAmount: number): {
  status: "paid" | "partial" | "pending";
  label: string;
  color: string;
} {
  if (paidAmount >= totalAmount) {
    return {
      status: "paid",
      label: "Fully Paid",
      color: "text-green-600",
    };
  } else if (paidAmount > 0) {
    return {
      status: "partial",
      label: "Partially Paid",
      color: "text-yellow-600",
    };
  } else {
    return {
      status: "pending",
      label: "Pending Payment",
      color: "text-red-600",
    };
  }
}

// Get status color
export function getStatusColor(status: string): string {
  const statusObj = ORDER_STATUSES.find(s => s.value === status);
  return statusObj?.color || "bg-gray-100 text-gray-800";
}

// Format service type for display
export function formatServiceType(serviceType: string): string {
  const service = SERVICE_TYPES.find(s => s.value === serviceType);
  return service?.label || serviceType.replace(/_/g, " ");
}

// Calculate due date (default 3 days from now)
export function getDefaultDueDate(): Date {
  const date = new Date();
  date.setDate(date.getDate() + 3);
  return date;
}

// Format date for input
export function formatDateForInput(date: Date | string): string {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Validate order items
export function validateOrderItems(items: OrderItem[]): {
  valid: boolean;
  error?: string;
} {
  if (!items || items.length === 0) {
    return { valid: false, error: "At least one item is required" };
  }

  for (const item of items) {
    if (!item.itemType || !item.itemType.trim()) {
      return { valid: false, error: "Item type is required for all items" };
    }
    if (!item.quantity || item.quantity <= 0) {
      return { valid: false, error: "Quantity must be greater than 0" };
    }
    if (!item.price || item.price <= 0) {
      return { valid: false, error: "Price must be greater than 0" };
    }
  }

  return { valid: true };
}

// Get next status in workflow
export function getNextStatus(currentStatus: string): string | null {
  const workflow = ["received", "in_progress", "ready", "delivered"];
  const currentIndex = workflow.indexOf(currentStatus);

  if (currentIndex === -1 || currentIndex === workflow.length - 1) {
    return null;
  }

  return workflow[currentIndex + 1];
}

// Check if status transition is valid
export function isValidStatusTransition(from: string, to: string): boolean {
  // Can always cancel
  if (to === "cancelled") return true;

  // Cannot uncomplete delivered orders
  if (from === "delivered") return false;

  // Cannot move from cancelled
  if (from === "cancelled") return false;

  const workflow = ["received", "in_progress", "ready", "delivered"];
  const fromIndex = workflow.indexOf(from);
  const toIndex = workflow.indexOf(to);

  // Can move forward or stay same
  return toIndex >= fromIndex;
}
