"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Package,
  Edit,
  Trash2,
  Plus,
  Minus,
  Calendar,
  AlertTriangle,
} from "lucide-react";
import {
  getCategoryLabel,
  getStockStatus,
  formatQuantity,
} from "@/lib/utils/inventory";

interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  minStockLevel: number;
  category: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function InventoryDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [item, setItem] = useState<InventoryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Stock adjustment
  const [adjustmentType, setAdjustmentType] = useState<"add" | "remove">("add");
  const [adjustmentAmount, setAdjustmentAmount] = useState("");
  const [adjustmentLoading, setAdjustmentLoading] = useState(false);
  const [adjustmentError, setAdjustmentError] = useState<string | null>(null);
  const [adjustmentSuccess, setAdjustmentSuccess] = useState(false);

  // Edit mode
  const [editMode, setEditMode] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [editedMinStockLevel, setEditedMinStockLevel] = useState("");
  const [editedCategory, setEditedCategory] = useState("");
  const [editedNotes, setEditedNotes] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  useEffect(() => {
    fetchItem();
  }, [params.id]);

  const fetchItem = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/inventory/${params.id}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Inventory item not found");
        }
        throw new Error("Failed to fetch inventory item");
      }

      const data = await response.json();
      setItem(data);
      setEditedName(data.name);
      setEditedMinStockLevel(data.minStockLevel.toString());
      setEditedCategory(data.category || "");
      setEditedNotes(data.notes || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleStockAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;

    setAdjustmentLoading(true);
    setAdjustmentError(null);
    setAdjustmentSuccess(false);

    try {
      const amount = parseFloat(adjustmentAmount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error("Please enter a valid amount");
      }

      let newQuantity: number;
      if (adjustmentType === "add") {
        newQuantity = item.quantity + amount;
      } else {
        newQuantity = item.quantity - amount;
        if (newQuantity < 0) {
          throw new Error("Cannot remove more than current quantity");
        }
      }

      const response = await fetch(`/api/inventory/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          quantity: newQuantity,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to adjust stock");
      }

      const updatedItem = await response.json();
      setItem(updatedItem);
      setAdjustmentAmount("");
      setAdjustmentSuccess(true);

      setTimeout(() => {
        setAdjustmentSuccess(false);
      }, 3000);
    } catch (err) {
      setAdjustmentError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setAdjustmentLoading(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;

    setEditLoading(true);
    setEditError(null);

    try {
      const minStock = parseFloat(editedMinStockLevel);
      if (isNaN(minStock) || minStock < 0) {
        throw new Error("Minimum stock level must be a non-negative number");
      }

      const response = await fetch(`/api/inventory/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: editedName.trim(),
          minStockLevel: minStock,
          category: editedCategory || null,
          notes: editedNotes.trim() || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update item");
      }

      const updatedItem = await response.json();
      setItem(updatedItem);
      setEditMode(false);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!item || !confirm(`Are you sure you want to delete "${item.name}"?`)) return;

    try {
      setDeleteLoading(true);
      const response = await fetch(`/api/inventory/${params.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete item");
      }

      router.push("/dashboard/inventory");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete item");
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-600 mt-4">Loading inventory item...</p>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="p-12 text-center">
        <p className="text-red-600 mb-4">{error || "Item not found"}</p>
        <Link
          href="/dashboard/inventory"
          className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Inventory
        </Link>
      </div>
    );
  }

  const status = getStockStatus(item.quantity, item.minStockLevel);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/dashboard/inventory"
          className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-2 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Inventory
        </Link>

        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{item.name}</h1>
            <p className="text-gray-600 mt-2">
              Last updated: {new Date(item.updatedAt).toLocaleString()}
            </p>
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

      {/* Edit Form */}
      {editMode && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Edit Item Details</h2>
          {editError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {editError}
            </div>
          )}
          <form onSubmit={handleEdit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Item Name
              </label>
              <input
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                disabled={editLoading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Minimum Stock Level
              </label>
              <input
                type="number"
                value={editedMinStockLevel}
                onChange={(e) => setEditedMinStockLevel(e.target.value)}
                disabled={editLoading}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <input
                type="text"
                value={editedCategory}
                onChange={(e) => setEditedCategory(e.target.value)}
                disabled={editLoading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
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
        </div>
      )}

      {/* Item Details */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Item Details</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Current Quantity */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Package className="w-5 h-5 text-gray-400" />
              <label className="text-sm font-medium text-gray-600">Current Quantity</label>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {formatQuantity(item.quantity, item.unit)}
            </p>
          </div>

          {/* Stock Status */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-gray-400" />
              <label className="text-sm font-medium text-gray-600">Status</label>
            </div>
            <span className={`inline-block px-4 py-2 text-lg font-semibold rounded-lg ${status.color}`}>
              {status.label}
            </span>
          </div>

          {/* Minimum Stock Level */}
          <div>
            <label className="text-sm font-medium text-gray-600 block mb-2">
              Minimum Stock Level
            </label>
            <p className="text-xl font-semibold text-gray-900">
              {formatQuantity(item.minStockLevel, item.unit)}
            </p>
          </div>

          {/* Category */}
          <div>
            <label className="text-sm font-medium text-gray-600 block mb-2">
              Category
            </label>
            {item.category ? (
              <span className="inline-block px-3 py-1 text-sm font-semibold rounded-full bg-gray-100 text-gray-800">
                {getCategoryLabel(item.category)}
              </span>
            ) : (
              <p className="text-gray-500">-</p>
            )}
          </div>

          {/* Created Date */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-5 h-5 text-gray-400" />
              <label className="text-sm font-medium text-gray-600">Created</label>
            </div>
            <p className="text-gray-900">
              {new Date(item.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Notes */}
        {item.notes && (
          <div className="mt-6 pt-6 border-t">
            <label className="text-sm font-medium text-gray-600 block mb-2">
              Notes
            </label>
            <p className="text-gray-900 whitespace-pre-wrap">{item.notes}</p>
          </div>
        )}
      </div>

      {/* Stock Adjustment */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Adjust Stock</h2>

        {adjustmentSuccess && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-600 text-sm">
            Stock adjusted successfully!
          </div>
        )}

        {adjustmentError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {adjustmentError}
          </div>
        )}

        <form onSubmit={handleStockAdjustment} className="space-y-4">
          {/* Adjustment Type */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setAdjustmentType("add")}
              disabled={adjustmentLoading}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition ${
                adjustmentType === "add"
                  ? "border-green-500 bg-green-50 text-green-700"
                  : "border-gray-300 text-gray-700 hover:bg-gray-50"
              } disabled:opacity-50`}
            >
              <Plus className="w-5 h-5" />
              Add Stock
            </button>
            <button
              type="button"
              onClick={() => setAdjustmentType("remove")}
              disabled={adjustmentLoading}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition ${
                adjustmentType === "remove"
                  ? "border-red-500 bg-red-50 text-red-700"
                  : "border-gray-300 text-gray-700 hover:bg-gray-50"
              } disabled:opacity-50`}
            >
              <Minus className="w-5 h-5" />
              Remove Stock
            </button>
          </div>

          {/* Amount Input */}
          <div>
            <label htmlFor="adjustmentAmount" className="block text-sm font-medium text-gray-700 mb-1">
              Amount ({item.unit})
            </label>
            <input
              type="number"
              id="adjustmentAmount"
              value={adjustmentAmount}
              onChange={(e) => setAdjustmentAmount(e.target.value)}
              disabled={adjustmentLoading}
              min="0.01"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              placeholder={`Enter amount to ${adjustmentType}`}
            />
          </div>

          {/* Preview */}
          {adjustmentAmount && parseFloat(adjustmentAmount) > 0 && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Preview:</p>
              <p className="text-lg font-semibold">
                {formatQuantity(item.quantity, item.unit)}
                {" → "}
                <span className={adjustmentType === "add" ? "text-green-600" : "text-red-600"}>
                  {formatQuantity(
                    adjustmentType === "add"
                      ? item.quantity + parseFloat(adjustmentAmount)
                      : item.quantity - parseFloat(adjustmentAmount),
                    item.unit
                  )}
                </span>
              </p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={adjustmentLoading || !adjustmentAmount || parseFloat(adjustmentAmount) <= 0}
            className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-white font-semibold transition disabled:opacity-50 ${
              adjustmentType === "add"
                ? "bg-green-600 hover:bg-green-700"
                : "bg-red-600 hover:bg-red-700"
            }`}
          >
            {adjustmentLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Processing...
              </>
            ) : (
              <>
                {adjustmentType === "add" ? (
                  <>
                    <Plus className="w-5 h-5" />
                    Add Stock
                  </>
                ) : (
                  <>
                    <Minus className="w-5 h-5" />
                    Remove Stock
                  </>
                )}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
