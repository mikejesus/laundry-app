"use client";

import { useState, useEffect } from "react";
import Modal from "./Modal";
import { Save, Plus, Trash2, DollarSign } from "lucide-react";
import {
  SERVICE_TYPES,
  COMMON_ITEMS,
  PAYMENT_METHODS,
  calculateOrderTotal,
  formatDateForInput,
  getDefaultDueDate,
  type OrderItem,
} from "@/lib/utils/orders";

interface Customer {
  id: string;
  name: string;
  phone: string;
}

interface OrderFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  customers: Customer[];
}

export default function OrderFormModal({
  isOpen,
  onClose,
  onSuccess,
  customers,
}: OrderFormModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [customerId, setCustomerId] = useState("");
  const [dueDate, setDueDate] = useState(formatDateForInput(getDefaultDueDate()));
  const [notes, setNotes] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");

  // Items state with custom flag
  const [items, setItems] = useState<OrderItem[]>([
    { itemType: "", serviceType: "wash_and_iron", quantity: 1, price: 0 },
  ]);
  const [customItemFlags, setCustomItemFlags] = useState<boolean[]>([false]);

  // Service-specific pricing for all service types
  const [allServicePrices, setAllServicePrices] = useState<Record<string, Record<string, number>>>({});

  // Calculate total
  const totalAmount = calculateOrderTotal(items);
  const paymentAmountNum = parseFloat(paymentAmount) || 0;
  const balance = totalAmount - paymentAmountNum;

  // Fetch all service prices on component mount
  useEffect(() => {
    fetchAllServicePrices();
  }, []);

  const fetchAllServicePrices = async () => {
    try {
      const response = await fetch(`/api/service-prices`);
      if (!response.ok) {
        console.error("Failed to fetch service prices");
        return;
      }

      const data = await response.json();

      // Organize prices by service type and item type
      const pricesMap: Record<string, Record<string, number>> = {};
      data.forEach((sp: { serviceType: string; itemType: string; price: number }) => {
        if (!pricesMap[sp.serviceType]) {
          pricesMap[sp.serviceType] = {};
        }
        pricesMap[sp.serviceType][sp.itemType] = sp.price;
      });

      setAllServicePrices(pricesMap);
    } catch (err) {
      console.error("Error fetching service prices:", err);
    }
  };

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setCustomerId("");
      setDueDate(formatDateForInput(getDefaultDueDate()));
      setNotes("");
      setPaymentAmount("");
      setPaymentMethod("");
      setItems([{ itemType: "", serviceType: "wash_and_iron", quantity: 1, price: 0 }]);
      setCustomItemFlags([false]);
      setError(null);
    }
  }, [isOpen]);

  // Add new item
  const addItem = () => {
    setItems([...items, { itemType: "", serviceType: "wash_and_iron", quantity: 1, price: 0 }]);
    setCustomItemFlags([...customItemFlags, false]);
  };

  // Remove item
  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
      setCustomItemFlags(customItemFlags.filter((_, i) => i !== index));
    }
  };

  // Update item
  const updateItem = (index: number, field: keyof OrderItem, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  // Select common item with price
  const selectCommonItem = (index: number, itemType: string) => {
    const commonItem = COMMON_ITEMS.find((item) => item.type === itemType);
    if (!commonItem) {
      return;
    }

    // Get the service type for this item
    const serviceType = items[index].serviceType || "wash_and_iron";

    // Use service-specific price if available, otherwise use default
    const price = allServicePrices[serviceType]?.[itemType] || commonItem.defaultPrice;

    // Update both itemType and price in one go using functional setState
    setItems(prevItems => {
      const newItems = [...prevItems];
      newItems[index] = {
        ...newItems[index],
        itemType: commonItem.type,
        price: price
      };
      return newItems;
    });
  };

  // Update price when service type changes
  const updateItemServiceType = (index: number, serviceType: string) => {
    setItems(prevItems => {
      const newItems = [...prevItems];
      const item = newItems[index];

      // Get new price for this service type and item type combination
      const newPrice = allServicePrices[serviceType]?.[item.itemType] || item.price;

      newItems[index] = {
        ...item,
        serviceType,
        price: newPrice
      };
      return newItems;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate
      if (!customerId) {
        throw new Error("Please select a customer");
      }

      // Filter out empty items and validate
      const validItems = items.filter(
        (item) => item.itemType.trim() && item.serviceType.trim() && item.quantity > 0 && item.price > 0
      );

      if (validItems.length === 0) {
        throw new Error("Please add at least one valid item with service type");
      }

      const orderData = {
        customerId,
        serviceType: null, // Service type is now at item level
        items: validItems,
        dueDate,
        notes: notes.trim() || undefined,
        paymentAmount: paymentAmountNum > 0 ? paymentAmountNum : undefined,
        paymentMethod: paymentAmountNum > 0 ? paymentMethod : undefined,
      };

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create order");
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create New Order"
      size="xl"
    >
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Customer <span className="text-red-500">*</span>
          </label>
          <select
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            required
            disabled={loading}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select customer</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name} - {customer.phone}
              </option>
            ))}
          </select>
        </div>

        {/* Items Section */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <label className="block text-sm font-medium text-gray-700">
              Items <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={addItem}
              disabled={loading}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              Add Item
            </button>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {items.map((item, index) => {
              const dropdownValue = customItemFlags[index] ? "custom" : item.itemType || "";

              return (
              <div key={index} className="flex flex-col bg-gray-50 p-3 rounded-lg gap-2">
                <div className="flex gap-2 items-start">
                  {/* Item Type */}
                  <div className="flex-1">
                    <label className="text-xs text-gray-500 mb-1 block">Item</label>
                    <select
                      value={dropdownValue}
                      onChange={(e) => {
                        const newFlags = [...customItemFlags];
                        if (e.target.value === "custom") {
                          // Switching to custom item mode
                          newFlags[index] = true;
                          setCustomItemFlags(newFlags);
                          updateItem(index, "itemType", "");
                          updateItem(index, "price", 0);
                        } else if (e.target.value) {
                          // Selecting a common item
                          newFlags[index] = false;
                          setCustomItemFlags(newFlags);
                          selectCommonItem(index, e.target.value);
                        } else {
                          // Clearing selection
                          newFlags[index] = false;
                          setCustomItemFlags(newFlags);
                          updateItem(index, "itemType", "");
                          updateItem(index, "price", 0);
                        }
                      }}
                      disabled={loading}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">Select item</option>
                      {COMMON_ITEMS.map((commonItem) => (
                        <option key={commonItem.type} value={commonItem.type}>
                          {commonItem.type}
                        </option>
                      ))}
                      <option value="custom">Custom Item...</option>
                    </select>
                    {customItemFlags[index] && (
                      <input
                        type="text"
                        placeholder="Enter custom item name"
                        value={item.itemType}
                        onChange={(e) => updateItem(index, "itemType", e.target.value)}
                        disabled={loading}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 mt-1"
                        autoFocus
                      />
                    )}
                  </div>

                  {/* Service Type */}
                  <div className="flex-1">
                    <label className="text-xs text-gray-500 mb-1 block">Service</label>
                    <select
                      value={item.serviceType}
                      onChange={(e) => updateItemServiceType(index, e.target.value)}
                      disabled={loading}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      {SERVICE_TYPES.map((service) => (
                        <option key={service.value} value={service.value}>
                          {service.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Remove Button */}
                  <div className="pt-5">
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      disabled={loading || items.length === 1}
                      className="text-red-600 hover:text-red-800 disabled:opacity-30 disabled:cursor-not-allowed p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex gap-2 items-center">
                  {/* Quantity */}
                  <div className="w-24">
                    <label className="text-xs text-gray-500 mb-1 block">Quantity</label>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, "quantity", parseInt(e.target.value) || 1)}
                      disabled={loading}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Qty"
                    />
                  </div>

                  {/* Price */}
                  <div className="w-28">
                    <label className="text-xs text-gray-500 mb-1 block">Price (₦)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.price}
                      onChange={(e) => updateItem(index, "price", parseFloat(e.target.value) || 0)}
                      disabled={loading}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Price"
                    />
                  </div>

                  {/* Subtotal */}
                  <div className="flex-1">
                    <label className="text-xs text-gray-500 mb-1 block">Subtotal</label>
                    <div className="px-2 py-1.5 text-sm text-gray-900 font-semibold">
                      ₦{(item.quantity * item.price).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
              );
            })}
          </div>

          {/* Total */}
          <div className="mt-3 flex justify-end">
            <div className="bg-blue-50 px-4 py-2 rounded-lg">
              <span className="text-sm text-gray-600">Total: </span>
              <span className="text-lg font-bold text-blue-600">
                ₦{totalAmount.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Due Date and Notes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Due Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Due Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
              disabled={loading}
              min={formatDateForInput(new Date())}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={loading}
              placeholder="Special instructions..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Payment Section */}
        <div className="border-t pt-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Payment (Optional)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Payment Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Amount
              </label>
              <input
                type="number"
                min="0"
                max={totalAmount}
                step="0.01"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                disabled={loading}
                placeholder="0.00"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                disabled={loading || !paymentAmount}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              >
                <option value="">Select method</option>
                {PAYMENT_METHODS.map((method) => (
                  <option key={method.value} value={method.value}>
                    {method.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Balance Display */}
          {paymentAmountNum > 0 && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg flex justify-between items-center">
              <span className="text-sm text-gray-600">Balance:</span>
              <span className={`text-lg font-bold ${balance > 0 ? "text-red-600" : "text-green-600"}`}>
                ₦{balance.toLocaleString()}
              </span>
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex gap-3 pt-4 border-t">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Creating Order...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Create Order
              </>
            )}
          </button>
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="px-6 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 font-medium"
          >
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
}
