"use client";

import { useState, Fragment, useEffect, useRef, useCallback } from "react";
import { X, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getPrinterPaperSize,
  getPaperSizeConfig,
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
}

interface AdminOrderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: AdminOrder | null;
  autoPrintOnAccept?: boolean; // New prop to trigger auto-print
}

// Component to generate dynamic print styles based on paper size
function PrintStyles({ paperSize }: { paperSize: string }) {
  const paperConfig = getPaperSizeConfig(paperSize as any);
  const isThermal = paperSize === "80mm" || paperSize === "58mm";

  let pageSizeCSS = "margin: 1cm;";

  if (isThermal) {
    // Thermal printer - continuous feed
    pageSizeCSS = `
      size: ${paperConfig.width}mm auto;
      margin: 3mm 2mm;
    `;
  } else if (paperSize === "A4") {
    pageSizeCSS = `
      size: A4;
      margin: 1.5cm;
    `;
  } else if (paperSize === "A5") {
    pageSizeCSS = `
      size: A5;
      margin: 1cm;
    `;
  }

  // Generate paper-size specific styles
  const paperSpecificStyles = isThermal
    ? `
    /* Thermal printer - Compact layout */
    .invoice-print-content {
      width: ${paperConfig.width}mm !important;
      max-width: ${paperConfig.width}mm !important;
      padding: 0 !important;
      margin: 0 auto !important;
    }
    
    .invoice-print-content > div.p-5 {
      padding: 10px !important;
      font-size: 9.8325px !important;
      line-height: 1.2 !important;
    }
    
    /* Headers and titles - smaller */
    .invoice-print-content h2,
    .invoice-print-content h3 {
      font-size: 25.4955px !important;
      margin: 4px 0 !important;
      font-weight: bold !important;
    }
    
    /* All text smaller */
    .invoice-print-content {
      font-size: 25.76225px !important;
      line-height: 1.2 !important;
      font-weight: 600 !important;
    }
    
    /* Spacing adjustments */
    .invoice-print-content .mb-4 {
      margin-bottom: 8px !important;
    }
    
    .invoice-print-content .mb-2 {
      margin-bottom: 4px !important;
    }
    
    .invoice-print-content hr {
      margin: 6px 0 !important;
      border-width: 1px !important;
    }
    
    /* Table adjustments for thermal */
    .invoice-print-content table {
      width: 100% !important;
      font-size: 30.35425px !important;
      border-collapse: collapse !important;
    }
    
    .invoice-print-content table th,
    .invoice-print-content table td {
      padding: 3px 2px !important;
      border-top: 1px solid #000 !important;
      border-bottom: 1px solid #000 !important;
      border-left: none !important;
      border-right: none !important;
      font-size: 14.35425px !important;
      line-height: 1.1 !important;
      font-weight: 600 !important;
    }
    
    .invoice-print-content table th {
      font-size: 30.35425px !important;
      font-weight: bold !important;
      padding: 4px 2px !important;
    }
    
    /* Column widths for thermal */
    .invoice-print-content table th:nth-child(1),
    .invoice-print-content table td:nth-child(1) {
      width: 10% !important;
      text-align: center !important;
      min-width: 20px !important;
    }
    
    .invoice-print-content table th:nth-child(2),
    .invoice-print-content table td:nth-child(2) {
      width: 70% !important;
      word-wrap: break-word !important;
      word-break: break-word !important;
      overflow-wrap: break-word !important;
    }
    
    .invoice-print-content table th:nth-child(3),
    .invoice-print-content table td:nth-child(3) {
      width: 20% !important;
      text-align: right !important;
      white-space: nowrap !important;
    }
    
    /* Ensure table cells don't overflow */
    .invoice-print-content table td {
      word-wrap: break-word !important;
      overflow: hidden !important;
      max-width: 0 !important;
    }
    
    /* Better text wrapping for item names */
    .invoice-print-content table td:nth-child(2) {
      max-width: none !important;
    }
    
    /* Options and nested lists - compact */
    .invoice-print-content ul {
      margin: 2px 0 !important;
      padding-left: 8px !important;
    }
    
    .invoice-print-content li {
      margin: 1px 0 !important;
      font-size: 16.376px !important;
      line-height: 1.1 !important;
      word-wrap: break-word !important;
      word-break: break-word !important;
      font-weight: 300 !important;
    }
    
    /* Long text handling */
    .invoice-print-content b,
    .invoice-print-content strong {
      word-wrap: break-word !important;
      word-break: break-word !important;
      max-width: 100% !important;
    }
    
    /* Customer info - single column */
    .invoice-print-content .flex {
      display: block !important;
    }
    
    .invoice-print-content .w-1\\/2,
    .invoice-print-content .w-1\\/4 {
      width: 100% !important;
      margin-bottom: 4px !important;
    }
    
    /* Strong/bold text */
    .invoice-print-content strong,
    .invoice-print-content b {
      font-weight: bold !important;
      font-size: inherit !important;
    }
    
    /* Remove excessive spacing */
    .invoice-print-content p {
      margin: 2px 0 !important;
      font-weight: 600 !important;
    }
    
    /* Address and customer info */
    .invoice-print-content address {
      font-size: 14.626px !important;
      line-height: 1.2 !important;
      font-weight: 600 !important;
    }
    
    /* Make customer and delivery sections bigger */
    .invoice-print-content .invoice-customer-section {
      font-size: 18px !important;
    }
    
    .invoice-print-content .invoice-customer-section strong {
      font-size: 20px !important;
    }
    
    .invoice-print-content .invoice-delivery-section {
      font-size: 18px !important;
    }
    
    .invoice-print-content .invoice-delivery-section strong {
      font-size: 20px !important;
    }
    
    .invoice-print-content .invoice-payment-section,
    .invoice-print-content .invoice-date-section {
      font-size: 18px !important;
    }
    
    .invoice-print-content .invoice-payment-section strong,
    .invoice-print-content .invoice-date-section strong {
      font-size: 20px !important;
    }
    
    body {
      width: ${paperConfig.width}mm !important;
    }
  `
    : paperSize === "A5"
    ? `
    /* A5 - Medium layout */
    .invoice-print-content {
      font-size: 14.61075px !important;
      font-weight: 600 !important;
    }
    
    .invoice-print-content h2,
    .invoice-print-content h3 {
      font-size: 23.9085px !important;
    }
    
    .invoice-print-content table {
      font-size: 13.2825px !important;
    }
    
    .invoice-print-content table th,
    .invoice-print-content table td {
      padding: 6px 4px !important;
      font-weight: 600 !important;
    }
    
    /* Make customer and delivery sections bigger for A5 */
    .invoice-print-content .invoice-customer-section {
      font-size: 16px !important;
    }
    
    .invoice-print-content .invoice-customer-section strong {
      font-size: 18px !important;
    }
    
    .invoice-print-content .invoice-delivery-section {
      font-size: 16px !important;
    }
    
    .invoice-print-content .invoice-delivery-section strong {
      font-size: 18px !important;
    }
    
    .invoice-print-content .invoice-payment-section,
    .invoice-print-content .invoice-date-section {
      font-size: 16px !important;
    }
    
    .invoice-print-content .invoice-payment-section strong,
    .invoice-print-content .invoice-date-section strong {
      font-size: 18px !important;
    }
  `
    : `
    /* A4 - Standard layout (default) */
    .invoice-print-content {
      font-size: 15.939px !important;
      font-weight: 600 !important;
    }
    
    .invoice-print-content h2 {
      font-size: 31.878px !important;
    }
    
    .invoice-print-content h3 {
      font-size: 26.565px !important;
    }
    
    .invoice-print-content table {
      font-size: 15.939px !important;
    }
    
    .invoice-print-content table td {
      font-weight: 600 !important;
    }
    
    .invoice-print-content p,
    .invoice-print-content address,
    .invoice-print-content li {
      font-weight: 600 !important;
    }
    
    /* Make customer and delivery sections bigger for A4 */
    .invoice-print-content .invoice-customer-section {
      font-size: 18px !important;
    }
    
    .invoice-print-content .invoice-customer-section strong {
      font-size: 20px !important;
    }
    
    .invoice-print-content .invoice-delivery-section {
      font-size: 18px !important;
    }
    
    .invoice-print-content .invoice-delivery-section strong {
      font-size: 20px !important;
    }
    
    .invoice-print-content .invoice-payment-section,
    .invoice-print-content .invoice-date-section {
      font-size: 18px !important;
    }
    
    .invoice-print-content .invoice-payment-section strong,
    .invoice-print-content .invoice-date-section strong {
      font-size: 20px !important;
    }
  `;

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
          @media print {
            @page {
              ${pageSizeCSS}
            }
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            html, body {
              background: white !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            /* Hide everything by default */
            body * {
              visibility: hidden !important;
            }
            /* Hide order details modal completely */
            .order-details-modal {
              display: none !important;
            }
            /* Show only invoice content */
            .invoice-print-content {
              position: fixed !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              background: white !important;
              box-shadow: none !important;
            }
            /* Make all invoice content visible except no-print elements */
            .invoice-print-content,
            .invoice-print-content * {
              visibility: visible !important;
            }
            /* Hide the header with buttons */
            .invoice-print-content .no-print,
            .invoice-print-content .no-print * {
              display: none !important;
              visibility: hidden !important;
            }
            /* Ensure the content div is visible */
            .invoice-print-content > div.p-5 {
              display: block !important;
              visibility: visible !important;
            }
            .invoice-print-content > div {
              max-height: none !important;
              overflow: visible !important;
            }
            table {
              page-break-inside: auto !important;
            }
            ${paperSpecificStyles}
          }
        `,
      }}
    />
  );
}

export function AdminOrderDetailsModal({
  isOpen,
  onClose,
  order,
  autoPrintOnAccept = false,
}: AdminOrderDetailsModalProps) {
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [paperSize, setPaperSize] = useState(getPrinterPaperSize());

  // Define handlePrint using useCallback (must be before useEffect that uses it)
  const handlePrint = useCallback(() => {
    // Get current paper size configuration
    const paperConfig = getPaperSizeConfig(paperSize);

    console.log("🖨️ [PRINT] Printing with paper size:", paperConfig);

    // Check if we're in an Electron environment
    const win = window as any;
    const isElectron =
      typeof window !== "undefined" && (win.electron || win.require);

    // Prepare print options with paper size
    const printOptions: any = {
      silent: true,
      printBackground: true,
      deviceName: "", // Use default printer
    };

    // Add paper size configuration for thermal printers
    if (paperSize === "80mm" || paperSize === "58mm") {
      // Thermal printer settings
      printOptions.pageSize = {
        width: paperConfig.width / 25.4, // Convert mm to inches
        height: undefined, // Continuous feed
      };
    } else {
      // Standard paper sizes (A4, A5)
      printOptions.pageSize = {
        width: paperConfig.width / 25.4, // Convert mm to inches
        height: paperConfig.height ? paperConfig.height / 25.4 : undefined, // Convert mm to inches
      };
    }

    if (isElectron) {
      // Use Electron's silent printing API
      try {
        // Method 1: If electron API is exposed via preload script
        if (win.electron?.print) {
          win.electron.print(printOptions);
          return;
        }

        // Method 2: Use IPC if available
        if (win.electron?.ipcRenderer) {
          win.electron.ipcRenderer.send("print-invoice", printOptions);
          return;
        }

        // Method 3: Try using require (if contextIsolation is disabled)
        if (win.require) {
          const { ipcRenderer } = win.require("electron");
          if (ipcRenderer) {
            ipcRenderer.send("print-invoice", printOptions);
            return;
          }
        }

        // Method 4: Try direct webContents access (if remote is enabled)
        if (win.require) {
          const { remote } = win.require("electron");
          if (remote?.getCurrentWindow) {
            const currentWindow = remote.getCurrentWindow();
            if (currentWindow?.webContents?.print) {
              currentWindow.webContents.print(printOptions);
              return;
            }
          }
        }
      } catch (error) {
        console.error("Error with Electron printing:", error);
      }
    }

    // Fallback to browser print dialog if not in Electron or if Electron printing failed
    window.print();

    // Reset printing flag after a delay
    setTimeout(() => {
      (window as any).__isPrinting = false;
    }, 1000);
  }, [paperSize]);

  // Handle auto-print when accept is clicked
  useEffect(() => {
    if (autoPrintOnAccept && isOpen && order) {
      // Small delay to ensure modal is fully rendered
      const openTimer = setTimeout(() => {
        setIsInvoiceModalOpen(true);
      }, 100);

      // Wait 3.5 seconds after invoice opens, then print and close
      const printTimer = setTimeout(() => {
        handlePrint();
        // Close invoice modal after a short delay to allow print to start
        setTimeout(() => {
          setIsInvoiceModalOpen(false);
        }, 500);
      }, 3600); // 100ms delay + 3500ms display = 3600ms total

      return () => {
        clearTimeout(openTimer);
        clearTimeout(printTimer);
      };
    }
  }, [autoPrintOnAccept, isOpen, order, handlePrint]);

  // Update paper size when it changes in localStorage or when invoice modal opens
  useEffect(() => {
    // Refresh paper size when invoice modal opens
    if (isInvoiceModalOpen) {
      setPaperSize(getPrinterPaperSize());
    }

    const handleStorageChange = () => {
      setPaperSize(getPrinterPaperSize());
    };

    // Listen for storage changes (when user selects a different paper size)
    window.addEventListener("storage", handleStorageChange);

    // Also check periodically for changes (in case same window)
    const interval = setInterval(() => {
      if (isInvoiceModalOpen) {
        const currentSize = getPrinterPaperSize();
        if (currentSize !== paperSize) {
          setPaperSize(currentSize);
        }
      }
    }, 500);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, [paperSize, isInvoiceModalOpen]);

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
    if (!locationName) return locationName;
    // Remove duplicate commas (replace multiple commas with single comma)
    const cleaned = locationName.replace(/,+/g, ",");
    // Split into array
    const parts = cleaned
      .split(",")
      .map((part) => part.trim())
      .filter((part) => part);
    // Remove last 2 indices
    if (parts.length > 2) {
      parts.splice(-2);
    }
    // Join back to string
    return parts.join(", ");
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
      const typeName = orderTypeName.toLowerCase();
      if (
        typeName.includes("delivery") ||
        typeName.includes("διανομή") ||
        typeName.includes("παράδοση")
      ) {
        return "Delivery";
      }
      if (
        typeName.includes("collection") ||
        typeName.includes("pickup") ||
        typeName.includes("παραλαβή") ||
        typeName.includes("takeaway")
      ) {
        return "Takeaway";
      }
      return orderTypeName;
    }

    // Fallback to order_type
    if (!orderType) return "N/A";
    const type = orderType.toLowerCase();
    if (type === "delivery" || type.includes("delivery")) {
      return "Delivery";
    }
    if (
      type === "collection" ||
      type.includes("collection") ||
      type.includes("pickup")
    ) {
      return "Takeaway";
    }
    return orderType;
  };

  const translateTotalTitle = (title: string, code: string) => {
    // Translate based on code first, then fallback to title
    if (code === "subtotal") return "Υποσύνολο";
    if (code === "total") return "Σύνολο";
    // Also check title text as fallback
    if (title.toLowerCase().includes("subtotal")) return "Υποσύνολο";
    if (
      title.toLowerCase().includes("total") &&
      !title.toLowerCase().includes("subtotal")
    )
      return "Σύνολο";
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
    <Fragment>
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
        className="order-details-modal fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 overflow-y-auto"
        onClick={onClose}
      >
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
              onClick={() => setIsInvoiceModalOpen(true)}
              className="w-full bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white border border-gray-600 transition-all"
            >
              Προβολή τιμολογίου
            </Button>
            <Button
              onClick={onClose}
              className="w-full bg-[#009DE0] hover:bg-[#0088CC] text-white transition-all"
            >
              Κλείσιμο
            </Button>
          </div>
        </div>
      </div>

      {/* Invoice Modal */}
      {isInvoiceModalOpen && (
        <Fragment>
          {/* Print Styles */}
          <PrintStyles paperSize={paperSize} />
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[200] p-4 no-print overflow-y-auto"
            onClick={() => setIsInvoiceModalOpen(false)}
          >
            <div
              className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl relative invoice-print-content my-auto"
              data-paper-size={paperSize}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Invoice Modal Header */}
              <div className="sticky top-0 bg-white border-b border-gray-300 p-4 flex items-center justify-between shadow-sm no-print z-10 rounded-t-xl">
                <h2 className="text-xl font-bold text-black">
                  Παραγγελία #{order.order_id}
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrint}
                    className="text-gray-600 hover:text-black transition-colors p-2 hover:bg-gray-100 rounded-lg"
                    title="Εκτύπωση"
                  >
                    <Printer className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setIsInvoiceModalOpen(false)}
                    className="text-gray-600 hover:text-black transition-colors p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Invoice Content - Scrollable */}
              <div className="p-5 bg-white text-black overflow-y-auto flex-1">
                {/* Invoice Title */}
                <div className="mb-4">
                  <div className="flex justify-between items-start">
                    <h2 className="text-2xl font-bold mb-0">
                      Παραγγελία #{order.order_id}
                    </h2>
                  </div>
                </div>

                <hr className="my-3" />

                {/* Customer and Invoice Info */}
                <div className="flex mb-4">
                  <div className="w-1/2">
                    <p className="invoice-customer-section">
                      <strong>Πελάτης</strong>
                      <br />
                      {order.customer_name || "N/A"}
                      {order.telephone && (
                        <>
                          <br />
                          {order.telephone}
                        </>
                      )}
                    </p>
                    {order.order_type === "delivery" && (
                      <div className="mt-2 invoice-delivery-section">
                        <strong>Διεύθυνση Παράδοσης</strong>
                        <br />
                        <address className="not-italic">
                          {formatLocationName(order.location_name) || "N/A"}
                          {order.floor && (
                            <>
                              <br />
                              Όροφος: {order.floor}
                            </>
                          )}
                          {order.bell_name && (
                            <>
                              <br />
                              Κουδούνι: {order.bell_name}
                            </>
                          )}
                        </address>
                      </div>
                    )}
                  </div>
                  <div className="w-1/2 text-right">
                    <p className="invoice-payment-section">
                      <strong>Πληρωμή</strong>
                      <br />
                      {getPaymentMethodName(order.payment)}
                    </p>
                    <p className="invoice-date-section">
                      <strong>Τύπος παραγγελίας</strong>
                      <br />
                      {getOrderTypeDisplayName(
                        order.order_type,
                        order.order_type_name
                      )}
                    </p>
                    <p className="invoice-date-section">
                      <strong>Ημερομηνία Παραγγελίας</strong>
                      <br />
                      {formatDateTime(order.order_date, order.order_time)}
                    </p>
                    {order.comment && (
                      <p className="invoice-date-section mt-2">
                        <strong>Σχόλιο Παραγγελίας</strong>
                        <br />
                        {order.comment}
                      </p>
                    )}
                  </div>
                </div>

                {/* Order Items Table */}
                <div>
                  <div>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <tbody>
                          {order.order_menus && order.order_menus.length > 0
                            ? order.order_menus.map((menu) => {
                                const groupedOptions = groupMenuOptions(
                                  menu.menu_options || []
                                );
                                return (
                                  <tr key={menu.order_menu_id}>
                                    <td className="border-t border-b border-gray-300 p-2">
                                      {menu.quantity}x
                                    </td>
                                    <td className="border-t border-b border-gray-300 p-2 text-left">
                                      <b>{menu.name}</b>
                                      <br />
                                      {menu.menu_options &&
                                        menu.menu_options.length > 0 && (
                                          <ul className="list-none pl-0 mt-1">
                                            {menu.menu_options.map(
                                              (option: any, idx: number) => {
                                                const quantity =
                                                  option.quantity > 1
                                                    ? `${option.quantity} × `
                                                    : "";
                                                const price =
                                                  option.order_option_price &&
                                                  parseFloat(
                                                    option.order_option_price
                                                  ) > 0
                                                    ? ` (${parseFloat(
                                                        option.order_option_price
                                                      ).toFixed(2)}€)`
                                                    : "";
                                                return (
                                                  <li
                                                    key={idx}
                                                    className="text-xs"
                                                  >
                                                    • {quantity}
                                                    {option.order_option_name ||
                                                      option.name}
                                                    {price}
                                                  </li>
                                                );
                                              }
                                            )}
                                          </ul>
                                        )}
                                      {menu.comment && (
                                        <div className="mt-1">
                                          <small>
                                            <b>{menu.comment}</b>
                                          </small>
                                        </div>
                                      )}
                                    </td>
                                    <td className="border-t border-b border-gray-300 p-2 text-right">
                                      {formatCurrency(menu.subtotal)}{" "}
                                      {order.currency === "EUR"
                                        ? "€"
                                        : order.currency}
                                    </td>
                                  </tr>
                                );
                              })
                            : null}
                        </tbody>
                        <tfoot>
                          {order.order_totals &&
                            order.order_totals
                              .sort((a, b) => a.priority - b.priority)
                              .map((total, index) => {
                                // Skip delivery total for collection orders
                                if (
                                  order.order_type === "collection" &&
                                  total.code === "delivery"
                                ) {
                                  return null;
                                }
                                return (
                                  <tr key={total.order_total_id}>
                                    <td className="border-t border-b border-gray-300 p-2"></td>
                                    <td className="border-t border-b border-gray-300 p-2 text-left">
                                      {translateTotalTitle(
                                        total.title,
                                        total.code
                                      )}
                                    </td>
                                    <td className="border-t border-b border-gray-300 p-2 text-right">
                                      {formatCurrency(total.value)}{" "}
                                      {order.currency === "EUR"
                                        ? "€"
                                        : order.currency}
                                    </td>
                                  </tr>
                                );
                              })}
                        </tfoot>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Thank You Message */}
                <div className="mt-4">
                  <div>
                    <p className="text-center">
                      Ευχαριστούμε για την παραγγελία σας!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Fragment>
      )}
    </Fragment>
  );
}
