"use client";

import { useState, useEffect } from "react";
import Modal from "./Modal";
import { Save, DollarSign } from "lucide-react";
import { SERVICE_TYPES, COMMON_ITEMS } from "@/lib/utils/orders";

interface ServicePrice {
  id?: string;
  serviceType: string;
  itemType: string;
  price: number;
}

interface PricingManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PricingManagementModal({
  isOpen,
  onClose,
  onSuccess,
}: PricingManagementModalProps) {
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [existingPrices, setExistingPrices] = useState<ServicePrice[]>([]);

  // Fetch existing prices when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchPrices();
    }
  }, [isOpen]);

  const fetchPrices = async () => {
    setLoadingData(true);
    try {
      const response = await fetch("/api/service-prices");
      if (!response.ok) throw new Error("Failed to fetch prices");

      const data = await response.json();
      setExistingPrices(data);

      // Build prices object from existing data
      const pricesObj: Record<string, number> = {};
      data.forEach((sp: ServicePrice) => {
        const key = `${sp.serviceType}-${sp.itemType}`;
        pricesObj[key] = sp.price;
      });
      setPrices(pricesObj);
    } catch (err) {
      console.error("Error fetching prices:", err);
      setError("Failed to load existing prices");
    } finally {
      setLoadingData(false);
    }
  };

  const getPriceKey = (serviceType: string, itemType: string) => {
    return `${serviceType}-${itemType}`;
  };

  const getPrice = (serviceType: string, itemType: string): number => {
    const key = getPriceKey(serviceType, itemType);
    return prices[key] || 0;
  };

  const updatePrice = (serviceType: string, itemType: string, price: number) => {
    const key = getPriceKey(serviceType, itemType);
    setPrices({
      ...prices,
      [key]: price,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Build bulk update array
      const bulk: Array<{ serviceType: string; itemType: string; price: number }> = [];

      SERVICE_TYPES.forEach((service) => {
        COMMON_ITEMS.forEach((item) => {
          const price = getPrice(service.value, item.type);
          if (price > 0) {
            bulk.push({
              serviceType: service.value,
              itemType: item.type,
              price,
            });
          }
        });
      });

      if (bulk.length === 0) {
        throw new Error("Please set at least one price");
      }

      const response = await fetch("/api/service-prices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ bulk }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update prices");
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

  // Apply default prices from COMMON_ITEMS
  const applyDefaultPrices = (serviceType: string) => {
    const updatedPrices = { ...prices };
    COMMON_ITEMS.forEach((item) => {
      const key = getPriceKey(serviceType, item.type);
      if (!updatedPrices[key] || updatedPrices[key] === 0) {
        updatedPrices[key] = item.defaultPrice;
      }
    });
    setPrices(updatedPrices);
  };

  const copyPricesFromService = (fromService: string, toService: string) => {
    const updatedPrices = { ...prices };
    COMMON_ITEMS.forEach((item) => {
      const fromKey = getPriceKey(fromService, item.type);
      const toKey = getPriceKey(toService, item.type);
      if (updatedPrices[fromKey]) {
        updatedPrices[toKey] = updatedPrices[fromKey];
      }
    });
    setPrices(updatedPrices);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Manage Service Pricing"
      size="2xl"
    >
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {loadingData ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <p className="text-sm text-gray-600">
            Set prices for each service type and item combination. Prices are in Naira (₦).
          </p>

          {/* Pricing Grid */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border p-2 text-left sticky left-0 bg-gray-50 z-10">
                    Item / Service
                  </th>
                  {SERVICE_TYPES.map((service) => (
                    <th key={service.value} className="border p-2 min-w-[120px]">
                      <div className="flex flex-col gap-1">
                        <span className="font-medium">{service.label}</span>
                        <button
                          type="button"
                          onClick={() => applyDefaultPrices(service.value)}
                          disabled={loading}
                          className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50"
                        >
                          Apply Defaults
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMMON_ITEMS.map((item) => (
                  <tr key={item.type} className="hover:bg-gray-50">
                    <td className="border p-2 font-medium sticky left-0 bg-white">
                      {item.type}
                      <span className="text-xs text-gray-500 ml-2">
                        (₦{item.defaultPrice})
                      </span>
                    </td>
                    {SERVICE_TYPES.map((service) => (
                      <td key={`${service.value}-${item.type}`} className="border p-2">
                        <div className="flex items-center gap-1">
                          <span className="text-gray-500">₦</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={getPrice(service.value, item.type) || ""}
                            onChange={(e) =>
                              updatePrice(
                                service.value,
                                item.type,
                                parseFloat(e.target.value) || 0
                              )
                            }
                            disabled={loading}
                            placeholder="0.00"
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Quick Actions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Quick Actions</h4>
            <div className="flex flex-wrap gap-2">
              {SERVICE_TYPES.map((service, idx) => {
                if (idx === 0) return null; // Skip first one for copy source
                return (
                  <button
                    key={service.value}
                    type="button"
                    onClick={() => copyPricesFromService(SERVICE_TYPES[0].value, service.value)}
                    disabled={loading}
                    className="text-xs px-3 py-1 bg-white border border-blue-300 rounded hover:bg-blue-50 disabled:opacity-50"
                  >
                    Copy {SERVICE_TYPES[0].label} → {service.label}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-blue-700 mt-2">
              Copy prices from one service type to another to save time.
            </p>
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
                  Saving Prices...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Save All Prices
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
      )}
    </Modal>
  );
}
