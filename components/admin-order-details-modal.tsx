"use client";

import { useState, Fragment } from "react";
import { X, Printer } from "lucide-react";
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
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

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

  const getPaymentMethodName = (payment?: string) => {
    if (!payment) return "";
    return payment === "cod" ? "Μετρητά" : "Κάρτα";
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

  const handlePrint = () => {
    // Check if we're in an Electron environment
    const win = window as any;
    const isElectron =
      typeof window !== "undefined" && (win.electron || win.require);

    if (isElectron) {
      // Use Electron's silent printing API
      try {
        // Method 1: If electron API is exposed via preload script
        if (win.electron?.print) {
          win.electron.print({
            silent: true,
            printBackground: true,
            deviceName: "", // Use default printer
          });
          return;
        }

        // Method 2: Use IPC if available
        if (win.electron?.ipcRenderer) {
          win.electron.ipcRenderer.send("print-invoice", {
            silent: true,
            printBackground: true,
          });
          return;
        }

        // Method 3: Try using require (if contextIsolation is disabled)
        if (win.require) {
          const { ipcRenderer } = win.require("electron");
          if (ipcRenderer) {
            ipcRenderer.send("print-invoice", {
              silent: true,
              printBackground: true,
            });
            return;
          }
        }

        // Method 4: Try direct webContents access (if remote is enabled)
        if (win.require) {
          const { remote } = win.require("electron");
          if (remote?.getCurrentWindow) {
            const currentWindow = remote.getCurrentWindow();
            if (currentWindow?.webContents?.print) {
              currentWindow.webContents.print({
                silent: true,
                printBackground: true,
              });
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
  };

  return (
    <Fragment>
      <div
        className="order-details-modal fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4"
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
              <p className="text-gray-400 text-sm mt-1">
                {order.location_name}
              </p>
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
                              (option: any, idx: number) => (
                                <p key={idx} className="text-gray-300 text-xs">
                                  • {option.name || JSON.stringify(option)}
                                </p>
                              )
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
                      {parseFloat(order.order_total).toFixed(2)}{" "}
                      {order.currency}
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

            {/* Action Buttons */}
            <div className="pt-4 space-y-3">
              <Button
                onClick={() => setIsInvoiceModalOpen(true)}
                className="w-full bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white border border-gray-600"
              >
                Προβολή τιμολογίου
              </Button>
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

      {/* Invoice Modal */}
      {isInvoiceModalOpen && (
        <Fragment>
          {/* Print Styles */}
          <style
            dangerouslySetInnerHTML={{
              __html: `
            @media print {
              @page {
                margin: 1cm;
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
                visibility: hidden !important;
              }
              /* Show only invoice content */
              .invoice-print-content {
                display: block !important;
                visibility: visible !important;
                position: fixed !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                max-width: 100% !important;
                max-height: none !important;
                overflow: visible !important;
                background: white !important;
                padding: 0 !important;
                margin: 0 !important;
                box-shadow: none !important;
                border: none !important;
                z-index: 9999 !important;
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
                padding: 20px !important;
              }
              .invoice-print-content > div {
                max-height: none !important;
                overflow: visible !important;
              }
              table {
                page-break-inside: auto !important;
              }
              tr {
                page-break-inside: avoid !important;
                page-break-after: auto !important;
              }
            }
          `,
            }}
          />
          <div
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-[200] p-4 no-print"
            onClick={() => setIsInvoiceModalOpen(false)}
          >
            <div
              className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto relative invoice-print-content"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Invoice Modal Header */}
              <div className="sticky top-0 bg-white border-b border-gray-300 p-4 flex items-center justify-between shadow-sm no-print">
                <h2 className="text-xl font-bold text-black">
                  Τιμολόγιο Παραγγελίας #{order.order_id}
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrint}
                    className="text-gray-600 hover:text-black transition-colors p-2 hover:bg-gray-100 rounded"
                    title="Εκτύπωση"
                  >
                    <Printer className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setIsInvoiceModalOpen(false)}
                    className="text-gray-600 hover:text-black transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Invoice Content */}
              <div className="p-5 bg-white text-black">
                {/* Invoice Title */}
                <div className="mb-4">
                  <div className="flex justify-between items-start">
                    <h2 className="text-2xl font-bold mb-0">Τιμολόγιο</h2>
                    <h3 className="text-xl font-semibold">
                      Παραγγελία #{order.order_id}
                    </h3>
                  </div>
                </div>

                <hr className="my-3" />

                {/* Restaurant and Logo */}
                <div className="flex mb-4">
                  <div className="w-1/2">
                    <strong>Εστιατόριο</strong>
                    <br />
                    <span>{order.location_name}</span>
                  </div>
                  <div className="w-1/2 text-right">
                    {/* Logo placeholder - can be added later if needed */}
                  </div>
                </div>

                <hr className="my-3" />

                {/* Customer and Invoice Info */}
                <div className="flex mb-4">
                  <div className="w-1/2">
                    <p>
                      <strong>Πελάτης</strong>
                      <br />
                      {order.customer_name || "N/A"}
                      {order.email && ` (${order.email})`}
                    </p>
                    {order.order_type === "delivery" && (
                      <div className="mt-2">
                        <strong>Διεύθυνση Παράδοσης</strong>
                        <br />
                        <address className="not-italic">
                          {/* Delivery address not available in current data structure */}
                          N/A
                        </address>
                      </div>
                    )}
                  </div>
                  <div className="w-1/4 text-left">
                    <p>
                      <strong>Αριθμός Τιμολογίου</strong>
                      <br />
                      {order.order_id}
                    </p>
                    <p>
                      <strong>Ημερομηνία Τιμολογίου</strong>
                      <br />
                      {formatDate(order.order_date)}
                      <br />
                      <br />
                    </p>
                  </div>
                  <div className="w-1/4 text-right">
                    <p>
                      <strong>Πληρωμή</strong>
                      <br />
                      {getPaymentMethodName(order.payment)}
                    </p>
                    <p>
                      <strong>Ημερομηνία Παραγγελίας</strong>
                      <br />
                      {formatDateTime(order.order_date, order.order_time)}
                    </p>
                  </div>
                </div>

                {/* Order Items Table */}
                <div>
                  <div>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-gray-300">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="border border-gray-300 p-2 text-left w-[2%]"></th>
                            <th className="border border-gray-300 p-2 text-left w-[65%]">
                              <b>Όνομα / Επιλογές</b>
                            </th>
                            <th className="border border-gray-300 p-2 text-left">
                              <b>Τιμή</b>
                            </th>
                            <th className="border border-gray-300 p-2 text-right">
                              <b>Σύνολο</b>
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {order.order_menus && order.order_menus.length > 0
                            ? order.order_menus.map((menu) => {
                                const groupedOptions = groupMenuOptions(
                                  menu.menu_options || []
                                );
                                return (
                                  <tr key={menu.order_menu_id}>
                                    <td className="border border-gray-300 p-2">
                                      {menu.quantity}x
                                    </td>
                                    <td className="border border-gray-300 p-2 text-left">
                                      <b>{menu.name}</b>
                                      <br />
                                      {Object.keys(groupedOptions).length >
                                        0 && (
                                        <ul className="list-none pl-0 mt-1">
                                          {Object.entries(groupedOptions).map(
                                            ([category, options]) => (
                                              <li
                                                key={category}
                                                className="mb-1"
                                              >
                                                <u className="text-gray-600">
                                                  {category}:
                                                </u>
                                                <ul className="list-none pl-4">
                                                  {options.map(
                                                    (
                                                      option: any,
                                                      idx: number
                                                    ) => (
                                                      <li key={idx}>
                                                        {option.quantity > 1 &&
                                                          `${option.quantity} × `}
                                                        {option.order_option_name ||
                                                          option.name}
                                                        {option.order_option_price >
                                                          0 &&
                                                          ` (${formatCurrency(
                                                            option.order_option_price *
                                                              (option.quantity ||
                                                                1)
                                                          )} ${
                                                            order.currency
                                                          })`}
                                                      </li>
                                                    )
                                                  )}
                                                </ul>
                                              </li>
                                            )
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
                                    <td className="border border-gray-300 p-2 text-left">
                                      {formatCurrency(menu.price)}{" "}
                                      {order.currency}
                                    </td>
                                    <td className="border border-gray-300 p-2 text-right">
                                      {formatCurrency(menu.subtotal)}{" "}
                                      {order.currency}
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
                                const isThickLine =
                                  index === 0 ||
                                  total.code === "order_total" ||
                                  total.code === "total";
                                return (
                                  <tr key={total.order_total_id}>
                                    <td
                                      className={`border border-gray-300 p-2 ${
                                        isThickLine ? "border-t-2" : ""
                                      }`}
                                    ></td>
                                    <td
                                      className={`border border-gray-300 p-2 ${
                                        isThickLine ? "border-t-2" : ""
                                      }`}
                                    ></td>
                                    <td
                                      className={`border border-gray-300 p-2 text-left ${
                                        isThickLine ? "border-t-2" : ""
                                      }`}
                                    >
                                      {total.title}
                                    </td>
                                    <td
                                      className={`border border-gray-300 p-2 text-right ${
                                        isThickLine ? "border-t-2" : ""
                                      }`}
                                    >
                                      {formatCurrency(total.value)}{" "}
                                      {order.currency}
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
