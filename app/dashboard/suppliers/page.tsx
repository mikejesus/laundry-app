import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Truck } from "lucide-react";

export default async function SuppliersPage() {
  const user = await requireUser();
  const suppliers = await prisma.supplier.findMany({
    where: { userId: user.id },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Suppliers</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-2">Manage your supplier contacts</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition w-full sm:w-auto justify-center flex items-center gap-2">
          + Add Supplier
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {suppliers.length === 0 ? (
          <div className="col-span-full bg-white rounded-lg shadow-md p-12 text-center">
            <Truck className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">No suppliers yet</p>
          </div>
        ) : (
          suppliers.map((supplier) => (
            <div
              key={supplier.id}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition"
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-semibold text-gray-900">{supplier.name}</h3>
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                  {supplier.category}
                </span>
              </div>
              <div className="space-y-1 text-sm text-gray-600">
                <p>📞 {supplier.phone}</p>
                {supplier.email && <p>📧 {supplier.email}</p>}
                {supplier.address && <p>📍 {supplier.address}</p>}
                {supplier.notes && (
                  <p className="mt-2 text-xs italic">{supplier.notes}</p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
