"use client";

import { useState, Fragment, useEffect, useRef, useCallback } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getPrinterPaperSize,
  getSelectedPrinter,
} from "./admin-printer-options-sidebar";

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
  bell_name?: string | null;
  floor?: string | null;
  address_id?: number | null;
}

interface AdminOrderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: AdminOrder | null;
  autoPrintOnAccept?: boolean; // New prop to trigger auto-print
}

// PrintStyles component removed - no longer needed with server-side PDF generation

export function AdminOrderDetailsModal({
  isOpen,
  onClose,
  order,
  autoPrintOnAccept = false,
}: AdminOrderDetailsModalProps) {
  const [paperSize, setPaperSize] = useState(getPrinterPaperSize());

  // Define handlePrint using useCallback (must be before useEffect that uses it)
  const handlePrint = useCallback(async () => {
    if (!order) return;

    console.log("🖨️ [PRINT] Generating PDF with paper size:", paperSize);

    try {
      // Call the PDF generation API
      const response = await fetch("/api/admin/invoice/pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          order,
          paperSize,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate PDF");
      }

      // Get PDF blob
      const blob = await response.blob();
      
      // Check if we're in Electron
      if (typeof window !== "undefined" && window.electron?.ipcRenderer) {
        // Convert blob to base64 for Electron
        const arrayBuffer = await blob.arrayBuffer();
        const base64 = btoa(
          String.fromCharCode(...new Uint8Array(arrayBuffer))
        );
        
        // Get selected printer name
        const selectedPrinter = getSelectedPrinter();
        
        // Send to Electron for printing
        // Note: paperSize is undefined since we always use A4 page size in the PDF
        window.electron.ipcRenderer.send("print-pdf", {
          pdfData: base64,
          silent: true,
          printBackground: true,
          deviceName: selectedPrinter || undefined, // Use selected printer or undefined for default
          paperSize: undefined,
          scaleFactor: 1,
          disablePrintingHeaderFooter: true,
        });

        console.log("🖨️ [PRINT] IPC 'print-pdf' sent successfully");
      } else {
        // Fallback to browser printing if not in Electron
        const url = window.URL.createObjectURL(blob);
        const printWindow = window.open(url, "_blank");
        if (printWindow) {
          printWindow.onload = () => {
            setTimeout(() => {
              printWindow.print();
            }, 500);
          };
        }
      }
    } catch (error) {
      console.error("❌ [PRINT] Error generating PDF:", error);
      alert("Σφάλμα κατά τη δημιουργία PDF. Παρακαλώ δοκιμάστε ξανά.");
    }
  }, [order, paperSize]);

  // Handle auto-print when accept is clicked
  useEffect(() => {
    if (autoPrintOnAccept && isOpen && order) {
      // Small delay to ensure everything is ready, then print directly
      const printTimer = setTimeout(() => {
        handlePrint();
        }, 500);

      return () => {
        clearTimeout(printTimer);
      };
    }
  }, [autoPrintOnAccept, isOpen, order, handlePrint]);

  // Update paper size when it changes in localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      setPaperSize(getPrinterPaperSize());
    };

    // Listen for storage changes (when user selects a different paper size)
    window.addEventListener("storage", handleStorageChange);

    // Also check periodically for changes (in case same window)
    const interval = setInterval(() => {
        const currentSize = getPrinterPaperSize();
        if (currentSize !== paperSize) {
          setPaperSize(currentSize);
      }
    }, 500);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, [paperSize]);

  // Early return moved after all hooks to maintain hook order
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

  const formatDateTime = (dateString: string, timeString: string) => {
    const date = new Date(dateString);
    const [hours, minutes] = timeString.split(":");
    date.setHours(parseInt(hours || "0"), parseInt(minutes || "0"));
    return date.toLocaleString("el-GR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (value: string | number) => {
    const numValue = typeof value === "string" ? parseFloat(value) : value;
    return numValue.toFixed(2);
  };

  const formatLocationName = (locationName: string) => {
    // Always return the full location_name
    return locationName || "";
  };

  const getPaymentMethodName = (payment?: string) => {
    if (!payment) return "";
    return payment === "cod" ? "Μετρητά" : "Κάρτα";
  };

  const getOrderTypeDisplayName = (
    orderType?: string,
    orderTypeName?: string
  ) => {
    if (orderTypeName) {
      // If we have a display name, use it but map to our standard terms
      const typeName = orderTypeName;
      // Check exact matches and common variations
      if (
        typeName === "delivery" ||
        typeName === "Delivery" ||
        typeName === "DELIVERY"
      ) {
        return "Delivery";
      }
      if (
        typeName === "collection" ||
        typeName === "Collection" ||
        typeName === "COLLECTION" ||
        typeName === "pickup" ||
        typeName === "Pickup" ||
        typeName === "PICKUP" ||
        typeName === "takeaway" ||
        typeName === "Takeaway" ||
        typeName === "TAKEAWAY"
      ) {
        return "Takeaway";
      }
      return orderTypeName;
    }

    // Fallback to order_type
    if (!orderType) return "N/A";
    const type = orderType;
    if (type === "delivery" || type === "Delivery" || type === "DELIVERY") {
      return "Delivery";
    }
    if (
      type === "collection" ||
      type === "Collection" ||
      type === "COLLECTION" ||
      type === "pickup" ||
      type === "Pickup" ||
      type === "PICKUP"
    ) {
      return "Takeaway";
    }
    return orderType;
  };

  const translateTotalTitle = (title: string, code: string) => {
    // Translate based on code first, then fallback to title
    if (code === "subtotal") return "Υποσύνολο";
    if (code === "total") return "Σύνολο";
    // Also check title text as fallback (without using toLowerCase)
    if (title === "Subtotal" || title === "subtotal" || title === "SUBTOTAL") return "Υποσύνολο";
    if (title === "Total" || title === "total" || title === "TOTAL") return "Σύνολο";
    return title;
  };

  const groupMenuOptions = (menuOptions: any[]) => {
    if (!menuOptions || menuOptions.length === 0) return {};
    const grouped: { [key: string]: any[] } = {};
    menuOptions.forEach((option) => {
      const category =
        option.order_option_category || option.category || "Other";
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(option);
    });
    return grouped;
  };

  return (
    <>
      <div
        className="order-details-modal fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 overflow-y-auto"
        onClick={onClose}
      >
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .order-modal-scroll::-webkit-scrollbar {
              width: 8px;
            }
            .order-modal-scroll::-webkit-scrollbar-track {
              background: #1a1a1a;
              border-radius: 10px;
            }
            .order-modal-scroll::-webkit-scrollbar-thumb {
              background: #4a4a4a;
              border-radius: 10px;
              border: 2px solid #1a1a1a;
            }
            .order-modal-scroll::-webkit-scrollbar-thumb:hover {
              background: #5a5a5a;
            }
            .order-modal-scroll {
              scrollbar-width: thin;
              scrollbar-color: #4a4a4a #1a1a1a;
            }
          `,
        }}
      />
        <div
          className="bg-[#1a1a1a] rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl border border-gray-800 relative my-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-[#1a1a1a] border-b border-gray-700 p-6 flex items-center justify-between z-10 rounded-t-xl">
            <div>
              <h2 className="text-2xl font-bold text-white">
                Παραγγελία #{order.order_id}
              </h2>
              <p className="text-gray-400 text-sm mt-1">
                {formatLocationName(order.location_name)}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-lg"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content - Scrollable */}
          <div className="p-6 space-y-6 overflow-y-auto flex-1 min-h-0 order-modal-scroll">
            {/* Order Info */}
            <div className="bg-[#2a2a2a] rounded-lg p-4 border border-gray-700/50 shadow-lg">
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
              <div className="bg-[#2a2a2a] rounded-lg p-4 border border-gray-700/50 shadow-lg">
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

            {/* Delivery Address */}
            {order.order_type === "delivery" && order.location_name && (
              <div className="bg-[#2a2a2a] rounded-lg p-4 border border-gray-700/50 shadow-lg">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Διεύθυνση Παράδοσης
                </h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-400">Διεύθυνση:</span>
                    <p className="text-white">
                      {formatLocationName(order.location_name)}
                    </p>
                  </div>
                  {order.floor && (
                    <div>
                      <span className="text-gray-400">Όροφος:</span>
                      <p className="text-white">{order.floor}</p>
                    </div>
                  )}
                  {order.bell_name && (
                    <div>
                      <span className="text-gray-400">Κουδούνι:</span>
                      <p className="text-white">{order.bell_name}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Order Items */}
            <div className="bg-[#2a2a2a] rounded-lg p-4 border border-gray-700/50 shadow-lg">
              <h3 className="text-lg font-semibold text-white mb-4">
                Προϊόντα ({order.order_menus?.length || 0})
              </h3>
              <div className="space-y-3">
                {order.order_menus && order.order_menus.length > 0 ? (
                  order.order_menus.map((menu) => (
                    <div
                      key={menu.order_menu_id}
                      className="bg-[#1a1a1a] rounded-lg p-4 border border-gray-700/50 hover:border-gray-600 transition-colors"
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
                            {parseFloat(menu.subtotal).toFixed(2)}{" "}
                            {order.currency}
                          </p>
                          <p className="text-gray-400 text-sm">
                            Ποσότητα: {menu.quantity}
                          </p>
                        </div>
                      </div>
                      {menu.menu_options && menu.menu_options.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-gray-700">
                          <p className="text-gray-400 text-xs mb-1">
                            Επιλογές:
                          </p>
                          <div className="space-y-1">
                            {menu.menu_options.map(
                              (option: any, idx: number) => {
                                const quantity =
                                  option.quantity > 1
                                    ? `${option.quantity} × `
                                    : "";
                                const price =
                                  option.order_option_price &&
                                  parseFloat(option.order_option_price) > 0
                                    ? ` (${parseFloat(
                                        option.order_option_price
                                      ).toFixed(2)}€)`
                                    : "";
                                return (
                                  <p
                                    key={idx}
                                    className="text-gray-300 text-xs"
                                  >
                                    • {quantity}
                                    {option.order_option_name || option.name}
                                    {price}
                                  </p>
                                );
                              }
                            )}
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
            <div className="bg-[#2a2a2a] rounded-lg p-4 border border-gray-700/50 shadow-lg">
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
                      {parseFloat(order.order_total).toFixed(2)}{" "}
                      {order.currency}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Comment */}
            {order.comment && (
              <div className="bg-[#2a2a2a] rounded-lg p-4 border border-gray-700/50 shadow-lg">
                <h3 className="text-lg font-semibold text-white mb-2">
                  Σχόλιο
                </h3>
                <p className="text-gray-300">{order.comment}</p>
              </div>
            )}
          </div>

          {/* Action Buttons - Fixed at bottom */}
          <div className="p-6 pt-0 space-y-3 border-t border-gray-700 bg-[#1a1a1a] rounded-b-xl">
            <Button
              onClick={handlePrint}
              className="w-full bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white border border-gray-600 transition-all"
            >
              Εκτύπωση τιμολογίου
            </Button>
            <Button
              onClick={onClose}
              className="w-full bg-[var(--brand-border)] hover:bg-[#0088CC] text-white transition-all"
            >
              Κλείσιμο
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
