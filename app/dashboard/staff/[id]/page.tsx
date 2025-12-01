"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  User,
  Calendar,
  DollarSign,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Briefcase,
} from "lucide-react";
import {
  getRoleLabel,
  getStatusLabel,
  getStatusColor,
  getAttendanceStatusLabel,
  getAttendanceColor,
  getPaymentMethodLabel,
  formatMonth,
  getCurrentMonth,
  calculateCommission,
} from "@/lib/utils/staff";
import { useToast } from "@/contexts/ToastContext";
import AttendanceMarkingForm from "@/components/staff/AttendanceMarkingForm";
import SalaryPaymentForm from "@/components/staff/SalaryPaymentForm";

interface StaffMember {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  role: string;
  salary: number;
  commissionRate: number;
  hireDate: string;
  status: string;
  notes: string | null;
  ordersHandled: Array<{
    id: string;
    orderNumber: string;
    totalAmount: number;
    createdAt: string;
    status: string;
  }>;
  salaryPayments: Array<{
    id: string;
    amount: number;
    commission: number;
    totalPaid: number;
    month: string;
    paymentDate: string;
    paymentMethod: string;
    ordersCompleted: number;
    notes: string | null;
  }>;
  attendances: Array<{
    id: string;
    date: string;
    status: string;
    checkIn: string | null;
    checkOut: string | null;
    notes: string | null;
  }>;
  _count: {
    ordersHandled: number;
    attendances: number;
  };
}

export default function StaffProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { showSuccess, showError } = useToast();

  const [staff, setStaff] = useState<StaffMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "attendance" | "salary">("overview");

  // Edit mode
  const [editMode, setEditMode] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [editedPhone, setEditedPhone] = useState("");
  const [editedEmail, setEditedEmail] = useState("");
  const [editedSalary, setEditedSalary] = useState("");
  const [editedCommissionRate, setEditedCommissionRate] = useState("");
  const [editedStatus, setEditedStatus] = useState("");
  const [editedNotes, setEditedNotes] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  useEffect(() => {
    fetchStaff();
  }, [params.id]);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/staff/${params.id}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Staff member not found");
        }
        throw new Error("Failed to fetch staff member");
      }

      const data = await response.json();
      setStaff(data);
      setEditedName(data.name);
      setEditedPhone(data.phone);
      setEditedEmail(data.email || "");
      setEditedSalary(data.salary.toString());
      setEditedCommissionRate(data.commissionRate.toString());
      setEditedStatus(data.status);
      setEditedNotes(data.notes || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staff) return;

    setEditLoading(true);

    try {
      const salary = parseFloat(editedSalary);
      const commissionRate = parseFloat(editedCommissionRate);

      if (isNaN(salary) || salary < 0) {
        throw new Error("Salary must be a non-negative number");
      }

      if (isNaN(commissionRate) || commissionRate < 0 || commissionRate > 100) {
        throw new Error("Commission rate must be between 0 and 100");
      }

      const response = await fetch(`/api/staff/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: editedName.trim(),
          phone: editedPhone.trim(),
          email: editedEmail.trim() || null,
          salary,
          commissionRate,
          status: editedStatus,
          notes: editedNotes.trim() || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update staff member");
      }

      const updatedStaff = await response.json();
      setStaff(updatedStaff);
      setEditMode(false);
      showSuccess("Staff member updated successfully");
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!staff || !confirm(`Are you sure you want to delete "${staff.name}"?`)) return;

    try {
      setDeleteLoading(true);
      const response = await fetch(`/api/staff/${params.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete staff member");
      }

      showSuccess("Staff member deleted successfully");
      router.push("/dashboard/staff");
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to delete");
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-600 mt-4">Loading staff profile...</p>
      </div>
    );
  }

  if (error || !staff) {
    return (
      <div className="p-12 text-center">
        <p className="text-red-600 mb-4">{error || "Staff member not found"}</p>
        <Link
          href="/dashboard/staff"
          className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Staff
        </Link>
      </div>
    );
  }

  // Calculate statistics
  const totalOrdersAmount = staff.ordersHandled.reduce((sum, order) => sum + order.totalAmount, 0);
  const potentialCommission = calculateCommission(totalOrdersAmount, staff.commissionRate);
  const totalPaidOut = staff.salaryPayments.reduce((sum, payment) => sum + payment.totalPaid, 0);
  const presentDays = staff.attendances.filter((a) => a.status === "present").length;
  const attendancePercentage = staff._count.attendances > 0
    ? Math.round((presentDays / staff._count.attendances) * 100)
    : 0;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/dashboard/staff"
          className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-2 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Staff
        </Link>

        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{staff.name}</h1>
            <div className="flex items-center gap-3 mt-2">
              <span className="px-3 py-1 text-sm font-semibold rounded-full bg-gray-100 text-gray-800">
                {getRoleLabel(staff.role)}
              </span>
              <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(staff.status)}`}>
                {getStatusLabel(staff.status)}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setEditMode(!editMode)}
              disabled={deleteLoading}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
            >
              <Edit className="w-4 h-4" />
              {editMode ? "Cancel Edit" : "Edit"}
            </button>
            <button
              onClick={handleDelete}
              disabled={deleteLoading}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
            >
              {deleteLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Delete
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center gap-2 mb-2">
            <Briefcase className="w-5 h-5 text-blue-600" />
            <p className="text-sm font-medium text-gray-600">Orders Completed</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{staff._count.ordersHandled}</p>
          <p className="text-xs text-gray-500 mt-1">₦{totalOrdersAmount.toLocaleString()} total</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <p className="text-sm font-medium text-gray-600">Potential Commission</p>
          </div>
          <p className="text-2xl font-bold text-green-600">₦{potentialCommission.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-1">@ {staff.commissionRate}%</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-blue-600" />
            <p className="text-sm font-medium text-gray-600">Attendance</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{attendancePercentage}%</p>
          <p className="text-xs text-gray-500 mt-1">{presentDays} days present</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-purple-600" />
            <p className="text-sm font-medium text-gray-600">Total Paid Out</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">₦{totalPaidOut.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-1">{staff.salaryPayments.length} payments</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-md mb-6">
        <div className="border-b">
          <div className="flex">
            <button
              onClick={() => setActiveTab("overview")}
              className={`flex-1 px-6 py-3 text-sm font-medium transition ${
                activeTab === "overview"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <User className="w-4 h-4" />
                Overview
              </div>
            </button>
            <button
              onClick={() => setActiveTab("attendance")}
              className={`flex-1 px-6 py-3 text-sm font-medium transition ${
                activeTab === "attendance"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Calendar className="w-4 h-4" />
                Attendance
              </div>
            </button>
            <button
              onClick={() => setActiveTab("salary")}
              className={`flex-1 px-6 py-3 text-sm font-medium transition ${
                activeTab === "salary"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <DollarSign className="w-4 h-4" />
                Salary & Payments
              </div>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div>
              {editMode ? (
                <form onSubmit={handleEdit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                      <input
                        type="text"
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        disabled={editLoading}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                      <input
                        type="tel"
                        value={editedPhone}
                        onChange={(e) => setEditedPhone(e.target.value)}
                        disabled={editLoading}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        value={editedEmail}
                        onChange={(e) => setEditedEmail(e.target.value)}
                        disabled={editLoading}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <select
                        value={editedStatus}
                        onChange={(e) => setEditedStatus(e.target.value)}
                        disabled={editLoading}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="terminated">Terminated</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Salary (₦)</label>
                      <input
                        type="number"
                        value={editedSalary}
                        onChange={(e) => setEditedSalary(e.target.value)}
                        disabled={editLoading}
                        min="0"
                        step="1000"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Commission Rate (%)</label>
                      <input
                        type="number"
                        value={editedCommissionRate}
                        onChange={(e) => setEditedCommissionRate(e.target.value)}
                        disabled={editLoading}
                        min="0"
                        max="100"
                        step="0.5"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea
                      value={editedNotes}
                      onChange={(e) => setEditedNotes(e.target.value)}
                      disabled={editLoading}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    />
                  </div>
                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setEditMode(false)}
                      disabled={editLoading}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={editLoading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                    >
                      {editLoading ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-6">
                  {/* Basic Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-sm font-medium text-gray-600 block mb-1">Phone Number</label>
                      <p className="text-gray-900">{staff.phone}</p>
                    </div>
                    {staff.email && (
                      <div>
                        <label className="text-sm font-medium text-gray-600 block mb-1">Email</label>
                        <p className="text-gray-900">{staff.email}</p>
                      </div>
                    )}
                    <div>
                      <label className="text-sm font-medium text-gray-600 block mb-1">Monthly Salary</label>
                      <p className="text-gray-900">₦{staff.salary.toLocaleString()}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600 block mb-1">Commission Rate</label>
                      <p className="text-gray-900">{staff.commissionRate}%</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600 block mb-1">Hire Date</label>
                      <p className="text-gray-900">{new Date(staff.hireDate).toLocaleDateString()}</p>
                    </div>
                  </div>

                  {staff.notes && (
                    <div className="pt-6 border-t">
                      <label className="text-sm font-medium text-gray-600 block mb-2">Notes</label>
                      <p className="text-gray-900 whitespace-pre-wrap">{staff.notes}</p>
                    </div>
                  )}

                  {/* Recent Orders */}
                  <div className="pt-6 border-t">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Orders</h3>
                    {staff.ordersHandled.length === 0 ? (
                      <p className="text-gray-600">No orders handled yet</p>
                    ) : (
                      <div className="space-y-3">
                        {staff.ordersHandled.map((order) => (
                          <Link
                            key={order.id}
                            href={`/dashboard/orders/${order.id}`}
                            className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium text-gray-900">{order.orderNumber}</p>
                                <p className="text-sm text-gray-600">
                                  {new Date(order.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold text-gray-900">₦{order.totalAmount.toLocaleString()}</p>
                                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                  {order.status}
                                </span>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Attendance Tab */}
          {activeTab === "attendance" && (
            <div>
              <AttendanceMarkingForm
                staffId={staff.id}
                onSuccess={fetchStaff}
              />

              <div className="mt-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Attendance History</h3>
                {staff.attendances.length === 0 ? (
                  <p className="text-gray-600">No attendance records yet</p>
                ) : (
                  <div className="space-y-2">
                    {staff.attendances.map((record) => (
                      <div
                        key={record.id}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-gray-900">
                            {new Date(record.date).toLocaleDateString("en-US", {
                              weekday: "short",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </p>
                          {(record.checkIn || record.checkOut) && (
                            <p className="text-sm text-gray-600 mt-1">
                              {record.checkIn && `In: ${new Date(record.checkIn).toLocaleTimeString()}`}
                              {record.checkIn && record.checkOut && " • "}
                              {record.checkOut && `Out: ${new Date(record.checkOut).toLocaleTimeString()}`}
                            </p>
                          )}
                          {record.notes && (
                            <p className="text-sm text-gray-500 mt-1">{record.notes}</p>
                          )}
                        </div>
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getAttendanceColor(record.status)}`}>
                          {getAttendanceStatusLabel(record.status)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Salary & Payments Tab */}
          {activeTab === "salary" && (
            <div>
              <SalaryPaymentForm
                staffId={staff.id}
                staffName={staff.name}
                salary={staff.salary}
                commissionRate={staff.commissionRate}
                onSuccess={fetchStaff}
              />

              <div className="mt-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment History</h3>
                {staff.salaryPayments.length === 0 ? (
                  <p className="text-gray-600">No payments recorded yet</p>
                ) : (
                  <div className="space-y-3">
                    {staff.salaryPayments.map((payment) => (
                      <div
                        key={payment.id}
                        className="p-4 border border-gray-200 rounded-lg"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-semibold text-gray-900">{formatMonth(payment.month)}</p>
                            <p className="text-sm text-gray-600">
                              {new Date(payment.paymentDate).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold text-gray-900">
                              ₦{payment.totalPaid.toLocaleString()}
                            </p>
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                              {getPaymentMethodLabel(payment.paymentMethod)}
                            </span>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4 pt-2 border-t border-gray-100">
                          <div>
                            <p className="text-xs text-gray-600">Salary</p>
                            <p className="text-sm font-medium text-gray-900">₦{payment.amount.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">Commission</p>
                            <p className="text-sm font-medium text-green-600">₦{payment.commission.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">Orders</p>
                            <p className="text-sm font-medium text-gray-900">{payment.ordersCompleted}</p>
                          </div>
                        </div>
                        {payment.notes && (
                          <p className="text-sm text-gray-600 mt-2 pt-2 border-t border-gray-100">{payment.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
