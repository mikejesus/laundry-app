import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Warehouse, AlertCircle } from "lucide-react";

export default async function InventoryPage() {
  const user = await requireUser();
  const inventory = await prisma.inventory.findMany({
    where: { userId: user.id },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inventory</h1>
          <p className="text-gray-600 mt-2">Track your supplies and stock levels</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
          + Add Item
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {inventory.length === 0 ? (
          <div className="col-span-full bg-white rounded-lg shadow-md p-12 text-center">
            <Warehouse className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">No inventory items yet</p>
          </div>
        ) : (
          inventory.map((item) => {
            const isLowStock = item.quantity <= item.minStockLevel;
            return (
              <div
                key={item.id}
                className={`bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition ${
                  isLowStock ? "border-2 border-red-300" : ""
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {item.name}
                  </h3>
                  {isLowStock && (
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Quantity:</span>
                    <span className={`font-semibold ${isLowStock ? "text-red-600" : "text-gray-900"}`}>
                      {item.quantity} {item.unit}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Min Level:</span>
                    <span className="text-gray-900">{item.minStockLevel} {item.unit}</span>
                  </div>
                  {item.category && (
                    <div className="mt-2">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        {item.category}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
