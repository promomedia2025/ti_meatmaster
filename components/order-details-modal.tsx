"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OrderMenuItem {
  menu_name: string;
  menu_quantity: number;
  menu_price: string;
  menu_subtotal: string;
  menu_options: string | null;
  menu_comment: string | null;
}

interface OrderTotal {
  title: string;
  value: string;
  priority: number;
}

interface OrderDetails {
  order_id: number;
  order_date: string;
  order_time: string;
  order_total: string;
  currency: string;
  status_id: number;
  created_at: string;
  location_name: string;
  status_name: string;
  menu_items?: OrderMenuItem[];
  order_totals?: OrderTotal[];
  order_type?: string;
  order_type_name?: string;
  comment?: string;
  bell_name?: string | null;
  floor?: string | null;
}

interface OrderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: number | null;
  userId: number | null;
}

export function OrderDetailsModal({
  isOpen,
  onClose,
  orderId,
  userId,
}: OrderDetailsModalProps) {
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && orderId && userId) {
      fetchOrderDetails();
    } else {
      setOrderDetails(null);
      setError(null);
    }
  }, [isOpen, orderId, userId]);

  const fetchOrderDetails = async () => {
    if (!orderId || !userId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/user/${userId}/orders/${orderId}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch order: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.data) {
        setOrderDetails(data.data);
      } else {
        setError("Failed to load order details");
      }
    } catch (err) {
      console.error("Error fetching order details:", err);
      setError("Failed to load order details");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("el-GR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatTime = (timeString: string) => {
    return timeString;
  };

  const formatCurrency = (value: string | number) => {
    const numValue = typeof value === "string" ? parseFloat(value) : value;
    return numValue.toFixed(2);
  };

  const getStatusColor = (statusName: string) => {
    switch (statusName.toLowerCase()) {
      case "delivery":
      case "delivered":
      case "complete":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "received":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "pending":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "cancelled":
      case "canceled":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getStatusText = (statusName: string) => {
    switch (statusName.toLowerCase()) {
      case "delivery":
      case "delivered":
      case "complete":
        return "Παραδόθηκε";
      case "received":
        return "Ελήφθη";
      case "pending":
        return "Εκκρεμεί";
      case "cancelled":
      case "canceled":
        return "Ακυρώθηκε";
      default:
        return statusName;
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 border border-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] flex flex-col mx-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-gray-900 border-b border-gray-800 p-6 flex items-center justify-between z-10 rounded-t-lg">
          <div>
            <h2 className="text-2xl font-bold text-white">
              Παραγγελία #{orderId}
            </h2>
            {orderDetails && (
              <p className="text-gray-400 text-sm mt-1">
                {orderDetails.location_name}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-lg"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 min-h-0">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="text-gray-400">Φόρτωση λεπτομερειών...</div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-red-400">{error}</div>
            </div>
          ) : orderDetails ? (
            <>
              {/* Order Info */}
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Πληροφορίες Παραγγελίας
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Ημερομηνία:</span>
                    <p className="text-white">{formatDate(orderDetails.order_date)}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Ώρα:</span>
                    <p className="text-white">{formatTime(orderDetails.order_time)}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Κατάσταση:</span>
                    <p className="text-white">
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs border ${getStatusColor(
                          orderDetails.status_name
                        )}`}
                      >
                        {getStatusText(orderDetails.status_name)}
                      </span>
                    </p>
                  </div>
                  {orderDetails.order_type_name && (
                    <div>
                      <span className="text-gray-400">Τύπος:</span>
                      <p className="text-white">{orderDetails.order_type_name}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Delivery Address */}
              {(orderDetails.bell_name || orderDetails.floor) && (
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Διεύθυνση Παράδοσης
                  </h3>
                  <div className="space-y-2 text-sm">
                    {orderDetails.floor && (
                      <div>
                        <span className="text-gray-400">Όροφος:</span>
                        <p className="text-white">{orderDetails.floor}</p>
                      </div>
                    )}
                    {orderDetails.bell_name && (
                      <div>
                        <span className="text-gray-400">Κουδούνι:</span>
                        <p className="text-white">{orderDetails.bell_name}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Order Items */}
              {orderDetails.menu_items && orderDetails.menu_items.length > 0 && (
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Προϊόντα ({orderDetails.menu_items.length})
                  </h3>
                  <div className="space-y-3">
                    {orderDetails.menu_items.map((item, index) => (
                      <div
                        key={index}
                        className="bg-gray-900 rounded-lg p-4 border border-gray-700"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <h4 className="text-white font-semibold">
                              {item.menu_name}
                            </h4>
                            {item.menu_comment && (
                              <p className="text-gray-400 text-sm mt-1">
                                Σχόλιο: {item.menu_comment}
                              </p>
                            )}
                            {item.menu_options && (
                              <p className="text-gray-400 text-sm mt-1">
                                {item.menu_options}
                              </p>
                            )}
                          </div>
                          <div className="text-right ml-4">
                            <p className="text-white font-semibold">
                              {formatCurrency(item.menu_subtotal)}{" "}
                              {orderDetails.currency}
                            </p>
                            <p className="text-gray-400 text-sm">
                              Ποσότητα: {item.menu_quantity}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Order Totals */}
              {orderDetails.order_totals &&
                orderDetails.order_totals.length > 0 && (
                  <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-white mb-4">
                      Σύνοψη
                    </h3>
                    <div className="space-y-2">
                      {orderDetails.order_totals
                        .sort((a, b) => a.priority - b.priority)
                        .map((total, index) => (
                          <div
                            key={index}
                            className="flex justify-between items-center"
                          >
                            <span
                              className={
                                total.title.toLowerCase().includes("total") &&
                                !total.title.toLowerCase().includes("subtotal")
                                  ? "text-white font-semibold"
                                  : "text-gray-300"
                              }
                            >
                              {total.title}
                            </span>
                            <span
                              className={
                                total.title.toLowerCase().includes("total") &&
                                !total.title.toLowerCase().includes("subtotal")
                                  ? "text-white font-semibold text-lg"
                                  : "text-gray-300"
                              }
                            >
                              {formatCurrency(total.value)}{" "}
                              {orderDetails.currency}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

              {/* Order Comment */}
              {orderDetails.comment && (
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Σχόλια Παραγγελίας
                  </h3>
                  <p className="text-gray-300">{orderDetails.comment}</p>
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-800 p-6 flex justify-end">
          <Button
            onClick={onClose}
            className="bg-gray-800 text-white hover:bg-gray-700"
          >
            Κλείσιμο
          </Button>
        </div>
      </div>
    </div>
  );
}
