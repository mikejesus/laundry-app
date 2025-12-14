"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Printer,
  Download,
  Share2,
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
  serviceType: string;
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
  serviceType: string | null; // Optional - now at item level
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
  const [downloading, setDownloading] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

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

  // Download receipt as PDF
  const handleDownload = async () => {
    if (!receiptRef.current || !order) return;

    try {
      setDownloading(true);

      // Dynamically import html2pdf
      const html2pdf = (await import('html2pdf.js')).default;

      // Clone the receipt element to avoid modifying the original
      const receiptClone = receiptRef.current.cloneNode(true) as HTMLElement;

      // Remove shadow and adjust for PDF
      receiptClone.style.boxShadow = 'none';
      receiptClone.style.borderRadius = '0';
      receiptClone.style.padding = '20px';

      const opt = {
        margin: [10, 10, 10, 10] as [number, number, number, number],
        filename: `${order.orderNumber}-receipt.pdf`,
        image: { type: 'jpeg' as const, quality: 1 },
        html2canvas: {
          scale: 3,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          windowWidth: 800
        },
        jsPDF: {
          unit: 'mm',
          format: 'a4',
          orientation: 'portrait' as const,
          compress: true
        },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
      };

      await html2pdf().set(opt).from(receiptClone).save();
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Failed to download receipt. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  // Share receipt
  const handleShare = async () => {
    if (!receiptRef.current || !order) return;

    try {
      setDownloading(true);

      // Generate PDF blob for sharing
      const html2pdf = (await import('html2pdf.js')).default;

      const receiptClone = receiptRef.current.cloneNode(true) as HTMLElement;
      receiptClone.style.boxShadow = 'none';
      receiptClone.style.borderRadius = '0';
      receiptClone.style.padding = '20px';

      const opt = {
        margin: [10, 10, 10, 10] as [number, number, number, number],
        filename: `${order.orderNumber}-receipt.pdf`,
        image: { type: 'jpeg' as const, quality: 1 },
        html2canvas: {
          scale: 3,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          windowWidth: 800
        },
        jsPDF: {
          unit: 'mm',
          format: 'a4',
          orientation: 'portrait' as const,
          compress: true
        },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
      };

      // Generate PDF as blob
      const pdfBlob = await html2pdf().set(opt).from(receiptClone).output('blob');

      // Create file from blob
      const file = new File([pdfBlob], `${order.orderNumber}-receipt.pdf`, {
        type: 'application/pdf',
      });

      // Check if Web Share API is available and supports files
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `Receipt - ${order.orderNumber}`,
          text: `Order Receipt for ${order.customer.name}\nTotal: ₦${order.totalAmount.toLocaleString()}\nBalance: ₦${(order.totalAmount - order.paidAmount).toLocaleString()}`,
          files: [file],
        });
      } else {
        // Fallback: Download the PDF
        const url = URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${order.orderNumber}-receipt.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        alert('Receipt downloaded! You can now share the PDF file from your downloads folder.');
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error('Error sharing receipt:', err);
        alert('Failed to share receipt. Please try downloading instead.');
      }
    } finally {
      setDownloading(false);
    }
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
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{order.orderNumber}</h1>
            <p className="text-gray-600 mt-2">
              Created on {new Date(order.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={handleShare}
              disabled={downloading}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition flex items-center gap-2 disabled:opacity-50 text-sm sm:text-base"
            >
              {downloading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Generating...
                </>
              ) : (
                <>
                  <Share2 className="w-5 h-5" />
                  Share
                </>
              )}
            </button>
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-50 text-sm sm:text-base"
            >
              {downloading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Downloading...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  Download
                </>
              )}
            </button>
            <button
              onClick={handlePrint}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition flex items-center gap-2 text-sm sm:text-base"
            >
              <Printer className="w-5 h-5" />
              Print
            </button>
          </div>
        </div>
      </div>

      {/* Receipt View */}
      <div ref={receiptRef} className="bg-white rounded-lg shadow-md p-8 mb-6 no-page-break">
        {/* Company Header - Always visible for PDF/Print */}
        <div className="text-center mb-8 pb-6 border-b-2 border-gray-800">
          <div className="flex items-center justify-center mb-3">
            <div className="bg-blue-600 text-white p-3 rounded-full mr-3">
              <Package className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">LaundryMS</h1>
              <p className="text-sm text-gray-600">Professional Laundry Services</p>
            </div>
          </div>

          <div className="mt-4 text-sm text-gray-600 space-y-1">
            <p>📍 123 Business Street, Commercial Area, Lagos, Nigeria</p>
            <p>📞 +234 800 123 4567 | 📧 info@laundryms.com</p>
            <p>🌐 www.laundryms.com</p>
          </div>

          <div className="mt-4">
            <h2 className="text-xl font-semibold text-gray-900">ORDER RECEIPT</h2>
          </div>
        </div>

        {/* Order Info */}
        <div className="grid grid-cols-2 gap-6 mb-6 pb-6 border-b">
          <div>
            <p className="text-sm text-gray-600">Order Number</p>
            <p className="font-semibold text-lg">{order.orderNumber}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Status</p>
            <span className={`inline-block px-3 py-1 text-sm font-semibold rounded-full status-badge ${getStatusColor(order.status)}`}>
              {order.status.replace("_", " ").toUpperCase()}
            </span>
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
                <th className="text-left py-2 text-sm text-gray-600">Service</th>
                <th className="text-center py-2 text-sm text-gray-600">Quantity</th>
                <th className="text-right py-2 text-sm text-gray-600">Price</th>
                <th className="text-right py-2 text-sm text-gray-600">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.id} className="border-b last:border-0">
                  <td className="py-3">{item.itemType}</td>
                  <td className="py-3 text-sm text-gray-600">{formatServiceType(item.serviceType)}</td>
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
            <h3 className="font-semibold text-gray-900 mb-2">Special Instructions</h3>
            <p className="text-gray-700 italic">{order.notes}</p>
          </div>
        )}

        {/* Payment History */}
        {order.payments.length > 0 && (
          <div className="mb-6 pb-6 border-t pt-6">
            <h3 className="font-semibold text-gray-900 mb-3">Payment History</h3>
            <div className="space-y-2">
              {order.payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex justify-between items-center text-sm p-3 bg-gray-50 rounded border"
                >
                  <div>
                    <span className="font-medium text-gray-900">₦{payment.amount.toLocaleString()}</span>
                    <span className="text-gray-600 ml-3">via {payment.method.replace("_", " ")}</span>
                  </div>
                  <span className="text-gray-500">
                    {new Date(payment.date).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Terms and Footer */}
        <div className="mt-8 pt-6 border-t-2 border-gray-800">
          <div className="text-sm text-gray-600 space-y-2 mb-4">
            <p className="font-semibold text-gray-900">Terms & Conditions:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Items not collected within 30 days will be donated to charity</li>
              <li>Claims must be made within 24 hours of collection</li>
              <li>We are not responsible for items left in pockets</li>
              <li>Damaged items beyond repair will be compensated at 10x the cleaning cost</li>
            </ul>
          </div>

          <div className="text-center pt-4 border-t">
            <p className="text-lg font-semibold text-gray-900">Thank You for Your Business!</p>
            <p className="text-sm text-gray-600 mt-2">We look forward to serving you again</p>
            <p className="text-xs text-gray-500 mt-3">
              Receipt generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
            </p>
            <p className="text-xs text-gray-400 mt-1">This is a computer-generated receipt and requires no signature</p>
          </div>
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
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Payment</h3>

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
