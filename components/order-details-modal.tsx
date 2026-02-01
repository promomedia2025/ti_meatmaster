"use client";

import { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
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
        setError("Αποτυχία φόρτωσης λεπτομερειών");
      }
    } catch (err) {
      console.error("Error fetching order details:", err);
      setError("Αποτυχία φόρτωσης λεπτομερειών");
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
        return "bg-green-500/10 text-green-400 border-green-500/20";
      case "received":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "pending":
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
      case "cancelled":
      case "canceled":
        return "bg-[#7C2429]/10 text-[#7C2429] border-[#7C2429]/20";
      default:
        return "bg-zinc-800 text-zinc-400 border-zinc-700";
    }
  };

  const getStatusText = (statusName: string) => {
    switch (statusName.toLowerCase()) {
      case "delivery":
      case "delivered":
        return "Στο δρόμο";
      case "complete":
        return "Ολοκληρώθηκε";
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

  // Helper to translate Order Total titles if needed
  const getTranslatedTitle = (title: string) => {
    const lower = title.toLowerCase();
    if (lower.includes("subtotal")) return "Υποσύνολο";
    if (lower.includes("total")) return "Σύνολο";
    if (lower.includes("delivery")) return "Κόστος Διανομής";
    return title;
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-white">
              Παραγγελία #{orderId}
            </h2>
            {orderDetails && (
              <p className="text-zinc-400 text-sm mt-1">
                {orderDetails.location_name}
              </p>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-full"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content - Scrollable */}
        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
              <div className="text-zinc-500">Φόρτωση λεπτομερειών...</div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-[#7C2429] bg-[#7C2429]/10 border border-[#7C2429]/20 p-4 rounded-lg inline-block">
                {error}
              </div>
            </div>
          ) : orderDetails ? (
            <>
              {/* Order Info */}
              <div className="bg-black border border-zinc-800 rounded-xl p-5">
                <h3 className="text-sm font-bold text-zinc-300 tracking-wider mb-4 border-b border-zinc-800 pb-2">
                  Πληροφορίες
                </h3>
                <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
                  <div>
                    <span className="block text-zinc-500 mb-1">Ημερομηνία</span>
                    <p className="text-white font-medium">{formatDate(orderDetails.order_date)}</p>
                  </div>
                  <div>
                    <span className="block text-zinc-500 mb-1">Ώρα</span>
                    <p className="text-white font-medium">{formatTime(orderDetails.order_time)}</p>
                  </div>
                  <div>
                    <span className="block text-zinc-500 mb-1">Κατάσταση</span>
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(
                        orderDetails.status_name
                      )}`}
                    >
                      {getStatusText(orderDetails.status_name)}
                    </span>
                  </div>
                  {orderDetails.order_type_name && (
                    <div>
                      <span className="block text-zinc-500 mb-1">Τύπος</span>
                      <p className="text-white font-medium">{orderDetails.order_type_name}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Delivery Address */}
              {(orderDetails.bell_name || orderDetails.floor) && (
                <div className="bg-black border border-zinc-800 rounded-xl p-5">
                  <h3 className="text-sm font-bold text-zinc-300 tracking-wider mb-4 border-b border-zinc-800 pb-2">
                    Διεύθυνση Παράδοσης
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {orderDetails.floor && (
                      <div>
                        <span className="block text-zinc-500 mb-1">Όροφος</span>
                        <p className="text-white font-medium">{orderDetails.floor}</p>
                      </div>
                    )}
                    {orderDetails.bell_name && (
                      <div>
                        <span className="block text-zinc-500 mb-1">Κουδούνι</span>
                        <p className="text-white font-medium">{orderDetails.bell_name}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Order Items */}
              {orderDetails.menu_items && orderDetails.menu_items.length > 0 && (
                <div className="bg-black border border-zinc-800 rounded-xl p-5">
                  <h3 className="text-sm font-bold text-zinc-300 tracking-wider mb-4 border-b border-zinc-800 pb-2">
                    Προϊόντα ({orderDetails.menu_items.length})
                  </h3>
                  <div className="space-y-4">
                    {orderDetails.menu_items.map((item, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-start pb-4 border-b border-zinc-800 last:border-0 last:pb-0"
                      >
                        <div className="flex gap-3">
                            <div className="flex items-center justify-center w-6 h-6 bg-zinc-800 text-white text-xs font-bold rounded">
                                {item.menu_quantity}x
                            </div>
                            <div>
                                <h4 className="text-white font-medium text-sm">
                                    {item.menu_name}
                                </h4>
                                {item.menu_options && (
                                    <p className="text-zinc-500 text-xs mt-1">
                                    {item.menu_options}
                                    </p>
                                )}
                                {item.menu_comment && (
                                    <p className="text-zinc-500 text-xs mt-1 italic">
                                    "{item.menu_comment}"
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="text-white font-medium text-sm whitespace-nowrap">
                          {formatCurrency(item.menu_subtotal)} {orderDetails.currency}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Order Totals */}
              {orderDetails.order_totals &&
                orderDetails.order_totals.length > 0 && (
                  <div className="bg-zinc-800/50 border border-zinc-800 rounded-xl p-5">
                    <div className="space-y-2">
                      {orderDetails.order_totals
                        .sort((a, b) => a.priority - b.priority)
                        .map((total, index) => {
                            const isTotal = total.title.toLowerCase().includes("total") && !total.title.toLowerCase().includes("subtotal");
                            return (
                                <div
                                    key={index}
                                    className={`flex justify-between items-center ${isTotal ? "pt-2 mt-2 border-t border-zinc-700" : ""}`}
                                >
                                    <span
                                    className={isTotal ? "text-white font-bold text-base" : "text-zinc-400 text-sm"}
                                    >
                                    {getTranslatedTitle(total.title)}
                                    </span>
                                    <span
                                    className={isTotal ? "text-white font-bold text-lg" : "text-zinc-300 text-sm"}
                                    >
                                    {formatCurrency(total.value)} {orderDetails.currency}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                  </div>
                )}

              {/* Order Comment */}
              {orderDetails.comment && (
                <div className="bg-black border border-zinc-800 rounded-xl p-5">
                  <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-wider mb-2 border-b border-zinc-800 pb-2">
                    Σχόλια
                  </h3>
                  <p className="text-zinc-300 text-sm italic">"{orderDetails.comment}"</p>
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="border-t border-zinc-800 p-6 bg-zinc-900 rounded-b-xl flex justify-end">
          <Button
            onClick={onClose}
            className="bg-white text-black hover:bg-zinc-200 font-medium px-6"
          >
            Κλείσιμο
          </Button>
        </div>
      </div>
    </div>
  );
}