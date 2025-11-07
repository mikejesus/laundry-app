"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Printer,
  Edit,
  DollarSign,
  Calendar,
  User,
  Package,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";
import {
  getStatusColor,
  formatServiceType,
  getPaymentStatus,
  getNextStatus,
  ORDER_STATUSES,
  PAYMENT_METHODS,
} from "@/lib/utils/orders";

interface OrderItem {
  id: string;
  itemType: string;
  quantity: number;
  price: number;
  notes: string | null;
}

interface Payment {
  id: string;
  amount: number;
  method: string;
  date: string;
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
  notes: string | null;
  customer: {
    id: string;
    name: string;
    phone: string;
    address: string | null;
    email: string | null;
  };
  items: OrderItem[];
  payments: Payment[];
}

export default function OrderDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  // Payment form state
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");

  // Fetch order
  const fetchOrder = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/orders/${params.id}`);

      if (!response.ok) {
        throw new Error("Failed to fetch order");
      }

      const data = await response.json();
      setOrder(data.order);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [params.id]);

  // Update order status
  const handleStatusUpdate = async (newStatus: string) => {
    if (!order) return;

    try {
      setUpdating(true);
      const response = await fetch(`/api/orders/${order.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update status");
      }

      await fetchOrder();
      alert("Status updated successfully");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  // Add payment
  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;

    try {
      setUpdating(true);
      const response = await fetch(`/api/orders/${order.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paymentAmount: parseFloat(paymentAmount),
          paymentMethod,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to add payment");
      }

      await fetchOrder();
      setShowPaymentForm(false);
      setPaymentAmount("");
      setPaymentMethod("");
      alert("Payment added successfully");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to add payment");
    } finally {
      setUpdating(false);
    }
  };

  // Print receipt
  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-2 text-gray-600">Loading order...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-800">{error || "Order not found"}</p>
        </div>
        <Link
          href="/dashboard/orders"
          className="inline-flex items-center text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Orders
        </Link>
      </div>
    );
  }

  const paymentStatus = getPaymentStatus(order.totalAmount, order.paidAmount);
  const balance = order.totalAmount - order.paidAmount;
  const nextStatus = getNextStatus(order.status);
  const isOverdue = new Date(order.dueDate) < new Date() && order.status !== "delivered";

  return (
    <div>
      {/* Header - Hidden when printing */}
      <div className="print:hidden mb-6">
        <Link
          href="/dashboard/orders"
          className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Orders
        </Link>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{order.orderNumber}</h1>
            <p className="text-gray-600 mt-2">
              Created on {new Date(order.createdAt).toLocaleDateString()}
            </p>
          </div>
          <button
            onClick={handlePrint}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition flex items-center gap-2"
          >
            <Printer className="w-5 h-5" />
            Print Receipt
          </button>
        </div>
      </div>

      {/* Receipt View */}
      <div className="bg-white rounded-lg shadow-md p-8 mb-6">
        {/* Header for Print */}
        <div className="hidden print:block text-center mb-6">
          <h1 className="text-2xl font-bold">Laundry Management System</h1>
          <p className="text-gray-600">Order Receipt</p>
        </div>

        {/* Order Info */}
        <div className="grid grid-cols-2 gap-6 mb-6 pb-6 border-b print:grid-cols-3">
          <div>
            <p className="text-sm text-gray-600">Order Number</p>
            <p className="font-semibold text-lg">{order.orderNumber}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Status</p>
            <span className={`inline-block px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(order.status)} print:border print:border-gray-400`}>
              {order.status.replace("_", " ").toUpperCase()}
            </span>
          </div>
          <div>
            <p className="text-sm text-gray-600">Service Type</p>
            <p className="font-semibold">{formatServiceType(order.serviceType)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Order Date</p>
            <p className="font-semibold">{new Date(order.createdAt).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Due Date</p>
            <p className={`font-semibold ${isOverdue ? "text-red-600" : ""}`}>
              {new Date(order.dueDate).toLocaleDateString()}
              {isOverdue && " (Overdue)"}
            </p>
          </div>
        </div>

        {/* Customer Info */}
        <div className="mb-6 pb-6 border-b">
          <h3 className="font-semibold text-gray-900 mb-3">Customer Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Name</p>
              <p className="font-medium">{order.customer.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Phone</p>
              <p className="font-medium">{order.customer.phone}</p>
            </div>
            {order.customer.address && (
              <div className="col-span-2">
                <p className="text-sm text-gray-600">Address</p>
                <p className="font-medium">{order.customer.address}</p>
              </div>
            )}
          </div>
        </div>

        {/* Order Items */}
        <div className="mb-6 pb-6 border-b">
          <h3 className="font-semibold text-gray-900 mb-3">Items</h3>
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 text-sm text-gray-600">Item</th>
                <th className="text-center py-2 text-sm text-gray-600">Quantity</th>
                <th className="text-right py-2 text-sm text-gray-600">Price</th>
                <th className="text-right py-2 text-sm text-gray-600">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.id} className="border-b last:border-0">
                  <td className="py-3">{item.itemType}</td>
                  <td className="py-3 text-center">{item.quantity}</td>
                  <td className="py-3 text-right">₦{item.price.toLocaleString()}</td>
                  <td className="py-3 text-right font-medium">
                    ₦{(item.quantity * item.price).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Payment Summary */}
        <div className="mb-6">
          <div className="flex justify-end">
            <div className="w-64">
              <div className="flex justify-between py-2">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">₦{order.totalAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-2 border-t">
                <span className="text-gray-600">Paid:</span>
                <span className="font-medium text-green-600">₦{order.paidAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-2 border-t border-b-2 border-gray-800">
                <span className="font-bold">Balance:</span>
                <span className={`font-bold text-lg ${balance > 0 ? "text-red-600" : "text-green-600"}`}>
                  ₦{balance.toLocaleString()}
                </span>
              </div>
              <div className="mt-2 text-center">
                <span className={`text-sm font-semibold ${paymentStatus.color}`}>
                  {paymentStatus.label}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        {order.notes && (
          <div className="mb-6 pb-6 border-t pt-6">
            <h3 className="font-semibold text-gray-900 mb-2">Notes</h3>
            <p className="text-gray-700">{order.notes}</p>
          </div>
        )}

        {/* Footer for Print */}
        <div className="hidden print:block text-center pt-6 border-t">
          <p className="text-sm text-gray-600">Thank you for your business!</p>
          <p className="text-xs text-gray-500 mt-2">This is a computer-generated receipt</p>
        </div>
      </div>

      {/* Actions Section - Hidden when printing */}
      <div className="print:hidden grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Status Update */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Update Status</h3>
          <div className="space-y-3">
            {ORDER_STATUSES.map((statusOption) => {
              const isCurrentStatus = order.status === statusOption.value;
              const canTransition = statusOption.value !== order.status;

              return (
                <button
                  key={statusOption.value}
                  onClick={() => handleStatusUpdate(statusOption.value)}
                  disabled={isCurrentStatus || updating}
                  className={`w-full px-4 py-3 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed ${
                    isCurrentStatus
                      ? statusOption.color
                      : "border-2 border-gray-300 hover:border-blue-500"
                  }`}
                >
                  {statusOption.label}
                  {isCurrentStatus && " (Current)"}
                </button>
              );
            })}
          </div>
        </div>

        {/* Payment Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Management</h3>

          {/* Payment History */}
          {order.payments.length > 0 && (
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Payment History:</p>
              <div className="space-y-2">
                {order.payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded"
                  >
                    <div>
                      <span className="font-medium">₦{payment.amount.toLocaleString()}</span>
                      <span className="text-gray-600 ml-2">({payment.method})</span>
                    </div>
                    <span className="text-gray-500">
                      {new Date(payment.date).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add Payment Form */}
          {balance > 0 && (
            <div>
              {!showPaymentForm ? (
                <button
                  onClick={() => setShowPaymentForm(true)}
                  className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                >
                  Add Payment
                </button>
              ) : (
                <form onSubmit={handleAddPayment} className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Amount (Max: ₦{balance.toLocaleString()})
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={balance}
                      step="0.01"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Payment Method
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select method</option>
                      {PAYMENT_METHODS.map((method) => (
                        <option key={method.value} value={method.value}>
                          {method.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={updating}
                      className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                    >
                      {updating ? "Adding..." : "Add Payment"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowPaymentForm(false);
                        setPaymentAmount("");
                        setPaymentMethod("");
                      }}
                      disabled={updating}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {balance === 0 && (
            <div className="text-center py-4">
              <CheckCircle2 className="w-12 h-12 mx-auto text-green-500 mb-2" />
              <p className="text-green-600 font-semibold">Fully Paid</p>
            </div>
          )}
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:block,
          .print\\:block * {
            visibility: visible;
          }
          .print\\:hidden {
            display: none !important;
          }
          @page {
            margin: 1cm;
          }
        }
      `}</style>
    </div>
  );
}
