import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserCog } from "lucide-react";

export default async function StaffPage() {
  const user = await requireUser();
  const staff = await prisma.staff.findMany({
    where: { userId: user.id },
    orderBy: { name: "asc" },
  });

  const totalSalaries = staff
    .filter((s) => s.status === "active")
    .reduce((sum, s) => sum + s.salary, 0);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Staff</h1>
          <p className="text-gray-600 mt-2">Manage your team members</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
          + Add Staff
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-sm font-medium text-gray-600 mb-2">Total Monthly Payroll</h3>
        <p className="text-3xl font-bold text-gray-900">${totalSalaries.toFixed(2)}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {staff.length === 0 ? (
          <div className="col-span-full bg-white rounded-lg shadow-md p-12 text-center">
            <UserCog className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">No staff members yet</p>
          </div>
        ) : (
          staff.map((member) => (
            <div
              key={member.id}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition"
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-semibold text-gray-900">{member.name}</h3>
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    member.status === "active"
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {member.status}
                </span>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-blue-600 font-medium">{member.role}</p>
                <p className="text-sm text-gray-600">📞 {member.phone}</p>
                {member.email && <p className="text-sm text-gray-600">📧 {member.email}</p>}
                <p className="text-sm font-semibold text-gray-900 mt-3">
                  Salary: ${member.salary.toFixed(2)}/month
                </p>
                <p className="text-xs text-gray-500">
                  Since: {new Date(member.hireDate).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
