"use client";

import { useState } from "react";
import { PAYMENT_METHODS, getCurrentMonth, calculateCommission } from "@/lib/utils/staff";
import { useToast } from "@/contexts/ToastContext";

interface SalaryPaymentFormProps {
  staffId: string;
  staffName: string;
  salary: number;
  commissionRate: number;
  onSuccess: () => void;
}

export default function SalaryPaymentForm({
  staffId,
  staffName,
  salary,
  commissionRate,
  onSuccess,
}: SalaryPaymentFormProps) {
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(false);

  const [amount, setAmount] = useState(salary.toString());
  const [commission, setCommission] = useState("0");
  const [month, setMonth] = useState(getCurrentMonth());
  const [paymentMethod, setPaymentMethod] = useState("");
  const [ordersCompleted, setOrdersCompleted] = useState("0");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");

  // Auto-calculate total
  const totalPaid = (parseFloat(amount) || 0) + (parseFloat(commission) || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!amount || !month || !paymentMethod) {
        throw new Error("Amount, month, and payment method are required");
      }

      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount) || parsedAmount < 0) {
        throw new Error("Amount must be a non-negative number");
      }

      const parsedCommission = parseFloat(commission);
      if (isNaN(parsedCommission) || parsedCommission < 0) {
        throw new Error("Commission must be a non-negative number");
      }

      const response = await fetch(`/api/staff/${staffId}/salary-payments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: parsedAmount,
          commission: parsedCommission,
          month,
          paymentMethod,
          ordersCompleted: parseInt(ordersCompleted) || 0,
          paymentDate,
          notes: notes.trim() || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to record payment");
      }

      // Reset form
      setAmount(salary.toString());
      setCommission("0");
      setMonth(getCurrentMonth());
      setPaymentMethod("");
      setOrdersCompleted("0");
      setPaymentDate(new Date().toISOString().split("T")[0]);
      setNotes("");

      showSuccess("Salary payment recorded successfully");
      onSuccess();
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to record payment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Record Salary Payment</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="month" className="block text-sm font-medium text-gray-700 mb-1">
              Month
            </label>
            <input
              type="month"
              id="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
          </div>

          <div>
            <label htmlFor="paymentDate" className="block text-sm font-medium text-gray-700 mb-1">
              Payment Date
            </label>
            <input
              type="date"
              id="paymentDate"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
          </div>

          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
              Salary Amount (₦)
            </label>
            <input
              type="number"
              id="amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={loading}
              min="0"
              step="1000"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
          </div>

          <div>
            <label htmlFor="commission" className="block text-sm font-medium text-gray-700 mb-1">
              Commission (₦)
            </label>
            <input
              type="number"
              id="commission"
              value={commission}
              onChange={(e) => setCommission(e.target.value)}
              disabled={loading}
              min="0"
              step="100"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
            <p className="text-xs text-gray-500 mt-1">
              Commission rate: {commissionRate}%
            </p>
          </div>

          <div>
            <label htmlFor="ordersCompleted" className="block text-sm font-medium text-gray-700 mb-1">
              Orders Completed
            </label>
            <input
              type="number"
              id="ordersCompleted"
              value={ordersCompleted}
              onChange={(e) => setOrdersCompleted(e.target.value)}
              disabled={loading}
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
          </div>

          <div>
            <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700 mb-1">
              Payment Method
            </label>
            <select
              id="paymentMethod"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <option value="">Select Method</option>
              {PAYMENT_METHODS.map((method) => (
                <option key={method.value} value={method.value}>
                  {method.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
            Notes (Optional)
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={loading}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            placeholder="Any additional notes..."
          />
        </div>

        {/* Total Display */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">Total Payment:</span>
            <span className="text-2xl font-bold text-blue-600">₦{totalPaid.toLocaleString()}</span>
          </div>
          <p className="text-xs text-gray-600 mt-1">
            Salary: ₦{parseFloat(amount || "0").toLocaleString()} + Commission: ₦{parseFloat(commission || "0").toLocaleString()}
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
        >
          {loading ? "Recording..." : "Record Payment"}
        </button>
      </form>
    </div>
  );
}
