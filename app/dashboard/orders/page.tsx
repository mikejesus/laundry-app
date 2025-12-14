"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ShoppingCart, Plus, Eye, Trash2, Filter, X, DollarSign } from "lucide-react";
import OrderFormModal from "@/components/modals/OrderFormModal";
import PricingManagementModal from "@/components/modals/PricingManagementModal";
import { getStatusColor, formatServiceType, getPaymentStatus } from "@/lib/utils/orders";

interface Customer {
  id: string;
  name: string;
  phone: string;
}

interface Order {
  id: string;
  orderNumber: string;
  serviceType: string;
  totalAmount: number;
  paidAmount: number;
  status: string;
  dueDate: string;
  createdAt: string;
  customer: Customer;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Fetch orders and customers
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query params
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (searchQuery) params.append("search", searchQuery);

      const [ordersRes, customersRes] = await Promise.all([
        fetch(`/api/orders?${params.toString()}`),
        fetch("/api/customers"),
      ]);

      if (!ordersRes.ok || !customersRes.ok) {
        throw new Error("Failed to fetch data");
      }

      const [ordersData, customersData] = await Promise.all([
        ordersRes.json(),
        customersRes.json(),
      ]);

      setOrders(ordersData.orders);
      setCustomers(customersData.customers);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter, searchQuery]);

  // Handle delete
  const handleDelete = async (orderId: string, orderNumber: string) => {
    if (!confirm(`Are you sure you want to delete order ${orderNumber}?`)) {
      return;
    }

    try {
      setDeleteLoading(orderId);
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Failed to delete order");
        return;
      }

      setOrders(orders.filter((o) => o.id !== orderId));
      alert("Order deleted successfully");
    } catch (err) {
      alert("Failed to delete order");
    } finally {
      setDeleteLoading(null);
    }
  };

  // Status counts
  const statusCounts = {
    all: orders.length,
    received: orders.filter((o) => o.status === "received").length,
    in_progress: orders.filter((o) => o.status === "in_progress").length,
    ready: orders.filter((o) => o.status === "ready").length,
    delivered: orders.filter((o) => o.status === "delivered").length,
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-600 mt-2">
            Manage your laundry orders ({orders.length} total)
          </p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => setIsPricingModalOpen(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition flex items-center gap-2 text-sm sm:text-base"
          >
            <DollarSign className="w-5 h-5" />
            <span className="hidden sm:inline">Manage Pricing</span>
            <span className="sm:hidden">Pricing</span>
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2 text-sm sm:text-base"
          >
            <Plus className="w-5 h-5" />
            New Order
          </button>
        </div>
      </div>

      {/* Status Filters */}
      <div className="mb-6">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-4 py-2 rounded-lg font-medium transition whitespace-nowrap text-sm sm:text-base ${
              statusFilter === "all"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
            }`}
          >
            All ({statusCounts.all})
          </button>
          <button
            onClick={() => setStatusFilter("received")}
            className={`px-4 py-2 rounded-lg font-medium transition whitespace-nowrap text-sm sm:text-base ${
              statusFilter === "received"
                ? "bg-yellow-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
            }`}
          >
            Received ({statusCounts.received})
          </button>
          <button
            onClick={() => setStatusFilter("in_progress")}
            className={`px-4 py-2 rounded-lg font-medium transition whitespace-nowrap text-sm sm:text-base ${
              statusFilter === "in_progress"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
            }`}
          >
            In Progress ({statusCounts.in_progress})
          </button>
          <button
            onClick={() => setStatusFilter("ready")}
            className={`px-4 py-2 rounded-lg font-medium transition whitespace-nowrap text-sm sm:text-base ${
              statusFilter === "ready"
                ? "bg-purple-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
            }`}
          >
            Ready ({statusCounts.ready})
          </button>
          <button
            onClick={() => setStatusFilter("delivered")}
            className={`px-4 py-2 rounded-lg font-medium transition whitespace-nowrap text-sm sm:text-base ${
              statusFilter === "delivered"
                ? "bg-green-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
            }`}
          >
            Delivered ({statusCounts.delivered})
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Search by order number or customer name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading orders...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && orders.length === 0 && (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <ShoppingCart className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No orders found
          </h3>
          <p className="text-gray-600 mb-6">
            {searchQuery || statusFilter !== "all"
              ? "Try adjusting your filters"
              : "Get started by creating your first order"}
          </p>
          {!searchQuery && statusFilter === "all" && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
            >
              <Plus className="w-5 h-5" />
              Create First Order
            </button>
          )}
        </div>
      )}

      {/* Orders Table */}
      {!loading && !error && orders.length > 0 && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="mobile-table-scroll">
            <table className="min-w-full divide-y divide-gray-200 sticky-col-mobile">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Order #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Service
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Payment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order) => {
                  const paymentStatus = getPaymentStatus(order.totalAmount, order.paidAmount);
                  const isOverdue = new Date(order.dueDate) < new Date() && order.status !== "delivered";

                  return (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          href={`/dashboard/orders/${order.id}`}
                          className="text-sm font-medium text-blue-600 hover:text-blue-800"
                        >
                          {order.orderNumber}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{order.customer.name}</div>
                        <div className="text-sm text-gray-500">{order.customer.phone}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatServiceType(order.serviceType)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                          {order.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₦{order.totalAmount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-semibold ${paymentStatus.color}`}>
                          {paymentStatus.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm ${isOverdue ? "text-red-600 font-semibold" : "text-gray-600"}`}>
                          {new Date(order.dueDate).toLocaleDateString()}
                          {isOverdue && <span className="ml-1">(Overdue)</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/dashboard/orders/${order.id}`}
                            className="text-blue-600 hover:text-blue-900 p-1"
                            title="View Details"
                          >
                            <Eye className="w-5 h-5" />
                          </Link>
                          <button
                            onClick={() => handleDelete(order.id, order.orderNumber)}
                            disabled={deleteLoading === order.id}
                            className="text-red-600 hover:text-red-900 p-1 disabled:opacity-50"
                            title="Delete Order"
                          >
                            {deleteLoading === order.id ? (
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-600"></div>
                            ) : (
                              <Trash2 className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Order Form Modal */}
      <OrderFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchData}
        customers={customers}
      />

      {/* Pricing Management Modal */}
      <PricingManagementModal
        isOpen={isPricingModalOpen}
        onClose={() => setIsPricingModalOpen(false)}
        onSuccess={() => {
          setIsPricingModalOpen(false);
          // Optionally show success message
        }}
      />
    </div>
  );
}
