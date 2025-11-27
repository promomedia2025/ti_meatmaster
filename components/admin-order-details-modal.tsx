"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OrderMenu {
  order_menu_id: number;
  order_id: number;
  menu_id: number;
  name: string;
  quantity: number;
  price: string;
  subtotal: string;
  comment: string;
  menu_options: any[];
}

interface OrderTotal {
  order_total_id: number;
  order_id: number;
  code: string;
  title: string;
  value: string;
  priority: number;
  is_summable: number;
}

interface AdminOrder {
  order_id: number;
  order_date: string;
  order_time: string;
  order_total: string;
  currency: string;
  status_id: number;
  created_at: string;
  location_name: string;
  status_name: string;
  order_menus: OrderMenu[];
  order_totals: OrderTotal[];
  customer_name?: string;
  customer_id?: number;
  telephone?: string;
  email?: string;
  payment?: string;
  order_type?: string;
  order_type_name?: string;
  comment?: string;
  total_items?: number;
}

interface AdminOrderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: AdminOrder | null;
}

export function AdminOrderDetailsModal({
  isOpen,
  onClose,
  order,
}: AdminOrderDetailsModalProps) {
  if (!isOpen || !order) return null;

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

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#1a1a1a] rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-[#1a1a1a] border-b border-gray-700 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">
              Παραγγελία #{order.order_id}
            </h2>
            <p className="text-gray-400 text-sm mt-1">{order.location_name}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Order Info */}
          <div className="bg-[#2a2a2a] rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-4">
              Πληροφορίες Παραγγελίας
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Ημερομηνία:</span>
                <p className="text-white">{formatDate(order.order_date)}</p>
              </div>
              <div>
                <span className="text-gray-400">Ώρα:</span>
                <p className="text-white">{formatTime(order.order_time)}</p>
              </div>
              <div>
                <span className="text-gray-400">Κατάσταση:</span>
                <p className="text-white">{order.status_name}</p>
              </div>
              <div>
                <span className="text-gray-400">Τύπος:</span>
                <p className="text-white">
                  {order.order_type_name || order.order_type || "N/A"}
                </p>
              </div>
              <div>
                <span className="text-gray-400">Πληρωμή:</span>
                <p className="text-white">
                  {order.payment === "cod" ? "Μετρητά" : "Κάρτα"}
                </p>
              </div>
              <div>
                <span className="text-gray-400">Συνολικά Προϊόντα:</span>
                <p className="text-white">{order.total_items || 0}</p>
              </div>
            </div>
          </div>

          {/* Customer Info */}
          {(order.customer_name || order.telephone || order.email) && (
            <div className="bg-[#2a2a2a] rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-4">
                Πληροφορίες Πελάτη
              </h3>
              <div className="space-y-2 text-sm">
                {order.customer_name && (
                  <div>
                    <span className="text-gray-400">Όνομα:</span>
                    <p className="text-white">{order.customer_name}</p>
                  </div>
                )}
                {order.telephone && (
                  <div>
                    <span className="text-gray-400">Τηλέφωνο:</span>
                    <p className="text-white">{order.telephone}</p>
                  </div>
                )}
                {order.email && (
                  <div>
                    <span className="text-gray-400">Email:</span>
                    <p className="text-white">{order.email}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Order Items */}
          <div className="bg-[#2a2a2a] rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-4">
              Προϊόντα ({order.order_menus?.length || 0})
            </h3>
            <div className="space-y-3">
              {order.order_menus && order.order_menus.length > 0 ? (
                order.order_menus.map((menu) => (
                  <div
                    key={menu.order_menu_id}
                    className="bg-[#1a1a1a] rounded-lg p-4 border border-gray-700"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h4 className="text-white font-semibold">
                          {menu.name}
                        </h4>
                        {menu.comment && (
                          <p className="text-gray-400 text-sm mt-1">
                            {menu.comment}
                          </p>
                        )}
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-white font-semibold">
                          {parseFloat(menu.subtotal).toFixed(2)} {order.currency}
                        </p>
                        <p className="text-gray-400 text-sm">
                          Ποσότητα: {menu.quantity}
                        </p>
                      </div>
                    </div>
                    {menu.menu_options && menu.menu_options.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-gray-700">
                        <p className="text-gray-400 text-xs mb-1">Επιλογές:</p>
                        <div className="space-y-1">
                          {menu.menu_options.map((option: any, idx: number) => (
                            <p key={idx} className="text-gray-300 text-xs">
                              • {option.name || JSON.stringify(option)}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-center py-4">
                  Δεν υπάρχουν προϊόντα
                </p>
              )}
            </div>
          </div>

          {/* Order Totals */}
          <div className="bg-[#2a2a2a] rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-4">
              Σύνοψη Παραγγελίας
            </h3>
            <div className="space-y-2">
              {order.order_totals && order.order_totals.length > 0 ? (
                order.order_totals
                  .sort((a, b) => a.priority - b.priority)
                  .map((total) => (
                    <div
                      key={total.order_total_id}
                      className="flex justify-between items-center py-2 border-b border-gray-700 last:border-0"
                    >
                      <span className="text-gray-300">{total.title}:</span>
                      <span
                        className={`font-semibold ${
                          total.code === "total"
                            ? "text-white text-lg"
                            : "text-gray-300"
                        }`}
                      >
                        {parseFloat(total.value).toFixed(2)} {order.currency}
                      </span>
                    </div>
                  ))
              ) : (
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-300">Σύνολο:</span>
                  <span className="text-white font-semibold text-lg">
                    {parseFloat(order.order_total).toFixed(2)} {order.currency}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Comment */}
          {order.comment && (
            <div className="bg-[#2a2a2a] rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-2">
                Σχόλιο
              </h3>
              <p className="text-gray-300">{order.comment}</p>
            </div>
          )}

          {/* Close Button */}
          <div className="pt-4">
            <Button
              onClick={onClose}
              className="w-full bg-[#009DE0] hover:bg-[#0088CC] text-white"
            >
              Κλείσιμο
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

