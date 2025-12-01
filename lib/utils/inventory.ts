// Inventory utility functions and constants

// Inventory units
export const INVENTORY_UNITS = [
  { value: "kg", label: "Kilograms (kg)" },
  { value: "liters", label: "Liters" },
  { value: "pieces", label: "Pieces" },
  { value: "packs", label: "Packs" },
  { value: "bottles", label: "Bottles" },
  { value: "bags", label: "Bags" },
] as const;

// Inventory categories
export const INVENTORY_CATEGORIES = [
  { value: "detergent", label: "Detergent" },
  { value: "softener", label: "Softener" },
  { value: "bleach", label: "Bleach" },
  { value: "starch", label: "Starch" },
  { value: "hangers", label: "Hangers" },
  { value: "packaging", label: "Packaging Materials" },
  { value: "chemicals", label: "Cleaning Chemicals" },
  { value: "accessories", label: "Accessories" },
  { value: "other", label: "Other" },
] as const;

// Get unit label
export function getUnitLabel(unit: string): string {
  const found = INVENTORY_UNITS.find((u) => u.value === unit);
  return found ? found.label : unit;
}

// Get category label
export function getCategoryLabel(category: string): string {
  const found = INVENTORY_CATEGORIES.find((c) => c.value === category);
  return found ? found.label : category;
}

// Check if stock is low
export function isLowStock(quantity: number, minStockLevel: number): boolean {
  return quantity <= minStockLevel;
}

// Get stock status
export function getStockStatus(
  quantity: number,
  minStockLevel: number
): {
  status: "ok" | "low" | "critical";
  label: string;
  color: string;
} {
  const percentOfMin = (quantity / minStockLevel) * 100;

  if (quantity === 0) {
    return {
      status: "critical",
      label: "Out of Stock",
      color: "bg-red-100 text-red-800",
    };
  } else if (percentOfMin <= 50) {
    return {
      status: "critical",
      label: "Critical",
      color: "bg-red-100 text-red-800",
    };
  } else if (percentOfMin <= 100) {
    return {
      status: "low",
      label: "Low Stock",
      color: "bg-yellow-100 text-yellow-800",
    };
  } else {
    return {
      status: "ok",
      label: "In Stock",
      color: "bg-green-100 text-green-800",
    };
  }
}

// Format quantity with unit
export function formatQuantity(quantity: number, unit: string): string {
  return `${quantity.toLocaleString()} ${unit}`;
}

// Calculate stock value (if price per unit is available)
export function calculateStockValue(quantity: number, pricePerUnit?: number): number {
  if (!pricePerUnit) return 0;
  return quantity * pricePerUnit;
}

// Interface for inventory item
export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  minStockLevel: number;
  category?: string;
  notes?: string;
}

// Get low stock items
export function getLowStockItems(items: InventoryItem[]): InventoryItem[] {
  return items.filter((item) => isLowStock(item.quantity, item.minStockLevel));
}

// Sort inventory items
export function sortInventoryItems(
  items: InventoryItem[],
  sortBy: "name" | "quantity" | "status" = "name"
): InventoryItem[] {
  switch (sortBy) {
    case "name":
      return [...items].sort((a, b) => a.name.localeCompare(b.name));
    case "quantity":
      return [...items].sort((a, b) => a.quantity - b.quantity);
    case "status":
      return [...items].sort((a, b) => {
        const aLow = isLowStock(a.quantity, a.minStockLevel);
        const bLow = isLowStock(b.quantity, b.minStockLevel);
        if (aLow === bLow) return 0;
        return aLow ? -1 : 1; // Low stock items first
      });
    default:
      return items;
  }
}
