"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Edit, Trash2, Calendar, DollarSign, FileText, Building2 } from "lucide-react";
import { getCategoryLabel } from "@/lib/utils/expenses";

interface Expense {
  id: string;
  category: string;
  amount: number;
  description: string;
  date: string;
  receiptUrl: string | null;
  createdAt: string;
  supplier: {
    id: string;
    name: string;
    phone: string;
    email: string | null;
  } | null;
}

export default function ExpenseDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [expense, setExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchExpense();
  }, [params.id]);

  const fetchExpense = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/expenses/${params.id}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Expense not found");
        }
        throw new Error("Failed to fetch expense");
      }

      const data = await response.json();
      setExpense(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this expense?")) return;

    try {
      setDeleteLoading(true);
      const response = await fetch(`/api/expenses/${params.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete expense");
      }

      router.push("/dashboard/expenses");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete expense");
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !expense) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error || "Expense not found"}</p>
        <Link
          href="/dashboard/expenses"
          className="text-blue-600 hover:text-blue-800"
        >
          Back to Expenses
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/dashboard/expenses"
          className="text-blue-600 hover:text-blue-800 flex items-center gap-2 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Expenses
        </Link>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Expense Details</h1>
            <p className="text-gray-600 mt-2">
              {new Date(expense.date).toLocaleDateString()}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleDelete}
              disabled={deleteLoading}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition flex items-center gap-2 disabled:opacity-50"
            >
              {deleteLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-5 h-5" />
                  Delete
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Info Card */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Amount */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-5 h-5 text-gray-400" />
              <label className="text-sm font-medium text-gray-600">Amount</label>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              ₦{expense.amount.toLocaleString()}
            </p>
          </div>

          {/* Category */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-5 h-5 text-gray-400" />
              <label className="text-sm font-medium text-gray-600">Category</label>
            </div>
            <span className="inline-block px-3 py-1 text-sm font-semibold rounded-full bg-gray-100 text-gray-800">
              {getCategoryLabel(expense.category)}
            </span>
          </div>

          {/* Date */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-5 h-5 text-gray-400" />
              <label className="text-sm font-medium text-gray-600">Date</label>
            </div>
            <p className="text-gray-900">
              {new Date(expense.date).toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>

          {/* Created At */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-5 h-5 text-gray-400" />
              <label className="text-sm font-medium text-gray-600">
                Recorded On
              </label>
            </div>
            <p className="text-gray-900">
              {new Date(expense.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Description */}
        <div className="mt-6 pt-6 border-t">
          <label className="block text-sm font-medium text-gray-600 mb-2">
            Description
          </label>
          <p className="text-gray-900">{expense.description}</p>
        </div>

        {/* Supplier */}
        {expense.supplier && (
          <div className="mt-6 pt-6 border-t">
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="w-5 h-5 text-gray-400" />
              <label className="text-sm font-medium text-gray-600">Supplier</label>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="font-medium text-gray-900">{expense.supplier.name}</p>
              <p className="text-sm text-gray-600 mt-1">
                {expense.supplier.phone}
              </p>
              {expense.supplier.email && (
                <p className="text-sm text-gray-600">{expense.supplier.email}</p>
              )}
            </div>
          </div>
        )}

        {/* Receipt */}
        {expense.receiptUrl && (
          <div className="mt-6 pt-6 border-t">
            <label className="block text-sm font-medium text-gray-600 mb-3">
              Receipt
            </label>
            <img
              src={expense.receiptUrl}
              alt="Receipt"
              className="max-w-md rounded-lg border border-gray-200"
            />
          </div>
        )}
      </div>
    </div>
  );
}
