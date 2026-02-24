"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Printer, RefreshCw, FileText, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface PrinterOptionsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

type PaperSize = "A4" | "A5" | "80mm" | "58mm";

interface PaperSizeConfig {
  id: PaperSize;
  name: string;
  dimensions: string;
  width: number; // in mm
  height?: number; // in mm (for standard sizes)
}

interface PrinterInfo {
  name: string;
  displayName: string;
  description?: string;
  status?: string;
}

const PAPER_SIZES: PaperSizeConfig[] = [
  {
    id: "A4",
    name: "A4",
    dimensions: "210 × 297 mm",
    width: 210,
    height: 297,
  },
  {
    id: "A5",
    name: "A5",
    dimensions: "148 × 210 mm",
    width: 148,
    height: 210,
  },
  {
    id: "80mm",
    name: "80mm",
    dimensions: "80mm (thermal)",
    width: 80,
  },
  {
    id: "58mm",
    name: "58mm",
    dimensions: "58mm (thermal)",
    width: 58,
  },
];

const STORAGE_KEY = "admin_printer_paper_size";
const PRINTER_STORAGE_KEY = "admin_selected_printer";

export function AdminPrinterOptionsSidebar({
  isOpen,
  onClose,
}: PrinterOptionsSidebarProps) {
  const [selectedSize, setSelectedSize] = useState<PaperSize>("A4");
  const [printers, setPrinters] = useState<PrinterInfo[]>([]);
  const [selectedPrinter, setSelectedPrinter] = useState<string | null>(null);
  const [loadingPrinters, setLoadingPrinters] = useState(false);
  const [isElectron, setIsElectron] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Load saved paper size and printer from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedSize = localStorage.getItem(STORAGE_KEY) as PaperSize | null;
      if (savedSize && PAPER_SIZES.some((size) => size.id === savedSize)) {
        setSelectedSize(savedSize);
      }

      const savedPrinter = localStorage.getItem(PRINTER_STORAGE_KEY);
      if (savedPrinter) {
        setSelectedPrinter(savedPrinter);
      }

      // Check if running in Electron
      setIsElectron(!!window.electron?.ipcRenderer);
    }
  }, []);

  // Clean up preview URL when component unmounts or preview closes
  useEffect(() => {
    return () => {
      if (previewUrl) {
        window.URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Load printers when sidebar opens
  useEffect(() => {
    if (isOpen) {
      loadPrinters();
    }
  }, [isOpen]);

  const loadPrinters = async () => {
    setLoadingPrinters(true);
    try {
      let printerList: PrinterInfo[] = [];

      // Try to get printers from Electron
      if (typeof window !== "undefined" && window.electron?.ipcRenderer) {
        try {
          // Request printers from Electron main process
          const electronPrinters = await window.electron.ipcRenderer.invoke(
            "get-printers"
          );
          if (Array.isArray(electronPrinters)) {
            printerList = electronPrinters.map((p: any) => ({
              name: p.name || p.deviceName || "",
              displayName: p.displayName || p.name || p.deviceName || "",
              description: p.description || p.status || "",
              status: p.status || (p.isDefault ? "Default" : ""),
            }));
          }
        } catch (error) {
          console.error("Error getting printers from Electron:", error);
        }
      }

      // Fallback: Try browser Print API (limited support)
      if (printerList.length === 0 && typeof window !== "undefined") {
        try {
          // Browser Print API doesn't expose printer list directly
          // We can only detect if printing is available
          if (window.matchMedia && window.matchMedia("print").media !== "print") {
            // Print API is available, but we can't enumerate printers
            // For now, we'll show a manual input option
            console.log("Browser Print API available, but printer enumeration not supported");
          }
        } catch (error) {
          console.error("Error checking browser print API:", error);
        }
      }

      // If no printers found, add a "Default Printer" option
      if (printerList.length === 0) {
        printerList.push({
          name: "",
          displayName: "Προεπιλεγμένος εκτυπωτής",
          description: "Θα χρησιμοποιηθεί ο προεπιλεγμένος εκτυπωτής",
        });
      }

      setPrinters(printerList);

      // If no printer is selected and we have printers, select the first one or default
      if (!selectedPrinter && printerList.length > 0) {
        const defaultPrinter = printerList.find((p) => p.status === "Default") || printerList[0];
        if (defaultPrinter) {
          setSelectedPrinter(defaultPrinter.name);
          if (typeof window !== "undefined") {
            localStorage.setItem(PRINTER_STORAGE_KEY, defaultPrinter.name);
          }
        }
      }
    } catch (error) {
      console.error("Error loading printers:", error);
      toast.error("Σφάλμα κατά τη φόρτωση εκτυπωτών");
    } finally {
      setLoadingPrinters(false);
    }
  };

  const handleSelectSize = (size: PaperSize) => {
    setSelectedSize(size);
    // Save to localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, size);
    }
    toast.success(`Επιλέχθηκε: ${PAPER_SIZES.find((s) => s.id === size)?.name}`);
  };

  const handleSelectPrinter = (printerName: string) => {
    setSelectedPrinter(printerName);
    // Save to localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem(PRINTER_STORAGE_KEY, printerName);
    }
    const printer = printers.find((p) => p.name === printerName);
    toast.success(`Επιλέχθηκε: ${printer?.displayName || printerName || "Προεπιλεγμένος"}`);
  };

  const handleTestPreview = useCallback(async () => {
    console.log("👁️ [TEST PREVIEW] Generating test PDF preview with paper size:", selectedSize);

    try {
      // Call the test PDF generation API
      const response = await fetch("/api/admin/invoice/test-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paperSize: selectedSize,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate test PDF");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      setPreviewUrl(url);
      setShowPreview(true);
    } catch (error) {
      console.error("❌ [TEST PREVIEW] Error generating test PDF:", error);
      toast.error("Σφάλμα κατά τη δημιουργία προεπισκόπησης. Παρακαλώ δοκιμάστε ξανά.");
    }
  }, [selectedSize]);

  const handleTestPrint = useCallback(async () => {
    console.log("🖨️ [TEST PRINT] Generating test PDF with paper size:", selectedSize);

    try {
      // Call the test PDF generation API
      const response = await fetch("/api/admin/invoice/test-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paperSize: selectedSize,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate test PDF");
      }

      // Get PDF blob
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      // Check if Electron is available and use silent printing
      const isElectron = typeof window !== "undefined" && window.electron;

      if (isElectron && window.electron?.ipcRenderer?.send) {
        console.log("🖨️ [TEST PRINT] Using Electron silent printing");
        // Convert blob to base64 for Electron IPC
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result as string;
          // Remove data:application/pdf;base64, prefix if present
          const base64Only = base64data.includes(',') ? base64data.split(',')[1] : base64data;
          console.log("📤 [TEST PRINT] Sending IPC 'print-pdf' with data length:", base64Only.length);
          try {
            window.electron?.ipcRenderer?.send('print-pdf', {
              pdfData: base64Only,
              silent: true,
              printBackground: true,
              deviceName: selectedPrinter || undefined,
              paperSize: selectedSize,
            });
            console.log("✅ [TEST PRINT] IPC 'print-pdf' sent successfully", {
              deviceName: selectedPrinter || "default printer",
              paperSize: selectedSize,
            });
            toast.success("Δοκιμαστική εκτύπωση ξεκίνησε");
          } catch (error) {
            console.error("❌ [TEST PRINT] Error sending IPC:", error);
            // Fallback to browser print
            openPdfInWindow(url);
          }
        };
        reader.onerror = () => {
          console.error("❌ [TEST PRINT] Failed to read PDF blob, falling back to browser print");
          openPdfInWindow(url);
        };
        reader.readAsDataURL(blob);
        // Clean up URL after a delay to allow IPC to complete
        setTimeout(() => {
          window.URL.revokeObjectURL(url);
        }, 2000);
      } else {
        // Fallback to browser print dialog
        console.log("🖨️ [TEST PRINT] Using browser print dialog");
        openPdfInWindow(url);
      }

      // Helper function to open PDF in window and print (with auto-close)
      function openPdfInWindow(pdfUrl: string) {
        const printWindow = window.open(pdfUrl, "_blank");
        if (printWindow) {
          const handlePrint = () => {
            try {
              printWindow.print();
              setTimeout(() => {
                printWindow.close();
                window.URL.revokeObjectURL(pdfUrl);
              }, 1500);
            } catch (error) {
              console.log("Print dialog may have been cancelled");
              setTimeout(() => {
                printWindow.close();
                window.URL.revokeObjectURL(pdfUrl);
              }, 1000);
            }
          };

          let hasHandled = false;
          printWindow.addEventListener("load", () => {
            if (!hasHandled) {
              hasHandled = true;
              setTimeout(handlePrint, 500);
            }
          });

          setTimeout(() => {
            if (!hasHandled) {
              hasHandled = true;
              handlePrint();
            }
          }, 1000);
        } else {
          // If popup was blocked, fallback to download
          const link = document.createElement("a");
          link.href = pdfUrl;
          link.download = "test-invoice.pdf";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(pdfUrl);
          toast.info("Το PDF κατέβηκε. Ανοίξτε το για εκτύπωση.");
        }
      }
    } catch (error) {
      console.error("❌ [TEST PRINT] Error generating test PDF:", error);
      toast.error("Σφάλμα κατά τη δημιουργία δοκιμαστικού PDF. Παρακαλώ δοκιμάστε ξανά.");
    }
  }, [selectedSize, selectedPrinter]);

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[60] transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed right-0 top-0 h-full bg-[#2a2a2a] border-l border-gray-700 z-[70] transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        } w-80`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <div className="flex items-center gap-2">
              <Printer className="w-5 h-5 text-[var(--brand-border)]" />
              <h2 className="text-xl font-bold text-white">
                Επιλογές Εκτυπωτή
              </h2>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white hover:bg-[#3a3a3a]"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 pb-6">
            {/* Printer Selection Section */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-white">
                  Εκτυπωτής
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={loadPrinters}
                  disabled={loadingPrinters}
                  className="h-8 w-8 text-gray-400 hover:text-white"
                  title="Ανανέωση λίστας εκτυπωτών"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${loadingPrinters ? "animate-spin" : ""}`}
                  />
                </Button>
              </div>

              {loadingPrinters ? (
                <div className="text-gray-400 text-sm py-4 text-center">
                  Φόρτωση εκτυπωτών...
                </div>
              ) : printers.length > 0 ? (
                <div className="space-y-2">
                  {printers.map((printer) => (
                    <button
                      key={printer.name || printer.displayName}
                      onClick={() => handleSelectPrinter(printer.name)}
                      className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                        selectedPrinter === printer.name
                          ? "border-[var(--brand-border)] bg-[var(--brand-border)]/10"
                          : "border-gray-700 bg-[#1a1a1a] hover:border-gray-600"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <h4
                            className={`text-sm font-semibold truncate ${
                              selectedPrinter === printer.name
                                ? "text-[var(--brand-border)]"
                                : "text-white"
                            }`}
                          >
                            {printer.displayName}
                          </h4>
                          {printer.description && (
                            <p className="text-gray-400 text-xs mt-1 truncate">
                              {printer.description}
                            </p>
                          )}
                        </div>
                        {selectedPrinter === printer.name && (
                          <div className="w-4 h-4 rounded-full bg-[var(--brand-border)] flex items-center justify-center ml-2 flex-shrink-0">
                            <div className="w-1.5 h-1.5 rounded-full bg-white" />
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-gray-400 text-sm py-4 text-center">
                  Δεν βρέθηκαν εκτυπωτές
                </div>
              )}
            </div>

            {/* Paper Size Selection Section */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-3">
                Μέγεθος Χαρτιού
              </h3>
              <p className="text-gray-400 text-sm mb-4">
                Επιλέξτε το μέγεθος χαρτιού για την εκτύπωση παραγγελιών
              </p>

              <div className="space-y-3">
                {PAPER_SIZES.map((size) => (
                  <button
                    key={size.id}
                    onClick={() => handleSelectSize(size.id)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      selectedSize === size.id
                        ? "border-[var(--brand-border)] bg-[var(--brand-border)]/10"
                        : "border-gray-700 bg-[#1a1a1a] hover:border-gray-600"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3
                          className={`text-lg font-semibold ${
                            selectedSize === size.id
                              ? "text-[var(--brand-border)]"
                              : "text-white"
                          }`}
                        >
                          {size.name}
                        </h3>
                        <p className="text-gray-400 text-sm mt-1">
                          {size.dimensions}
                        </p>
                      </div>
                      {selectedSize === size.id && (
                        <div className="w-5 h-5 rounded-full bg-[var(--brand-border)] flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-white" />
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Info Section */}
            <div className="mt-6 p-4 bg-[#1a1a1a] rounded-lg border border-gray-700">
              <p className="text-gray-400 text-xs">
                <strong className="text-white">Σημείωση:</strong> Το μέγεθος
                χαρτιού επηρεάζει τη διάταξη της εκτύπωσης. Για θερμικούς
                εκτυπωτές, χρησιμοποιήστε τις επιλογές 80mm ή 58mm.
              </p>
            </div>
          </div>

          {/* Footer with Test Print Button - Always visible at bottom */}
          <div className="border-t border-gray-700 p-4 bg-[#2a2a2a]">
            <div className="flex gap-2">
              <Button
                onClick={handleTestPreview}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 flex items-center justify-center gap-2"
              >
                <Eye className="w-5 h-5" />
                Προεπισκόπηση
              </Button>
              <Button
                onClick={handleTestPrint}
                className="flex-1 bg-[var(--brand-border)] hover:bg-[var(--brand-hover)] text-white font-semibold py-3 flex items-center justify-center gap-2"
              >
                <FileText className="w-5 h-5" />
                Εκτύπωση
              </Button>
            </div>
            <p className="text-gray-400 text-xs mt-2 text-center">
              Προεπισκόπηση ή εκτύπωση δοκιμαστικού αποδείγματος
            </p>
          </div>
        </div>
      </div>

      {/* Test Receipt Preview Modal */}
      {showPreview && previewUrl && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 p-4">
          <div className="relative bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-300">
              <h2 className="text-xl font-semibold text-gray-900">
                Προεπισκόπηση Δοκιμαστικού Αποδείγματος - {selectedSize === "80mm" ? "80mm" : selectedSize === "58mm" ? "58mm" : selectedSize}
              </h2>
              <Button
                onClick={() => {
                  setShowPreview(false);
                  if (previewUrl) {
                    window.URL.revokeObjectURL(previewUrl);
                    setPreviewUrl(null);
                  }
                }}
                variant="ghost"
                size="sm"
                className="text-gray-600 hover:text-gray-900"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* PDF Preview */}
            <div className="flex-1 overflow-auto p-4 bg-gray-100 flex items-start justify-center">
              <div
                className="bg-white shadow-lg"
                style={{
                  width: selectedSize === "80mm" 
                    ? `${(80 / 25.4) * 96}px` 
                    : selectedSize === "58mm"
                    ? `${(58 / 25.4) * 96}px`
                    : "100%",
                  maxWidth: "100%",
                  border: "2px solid #333",
                }}
              >
                <iframe
                  src={previewUrl}
                  className="w-full"
                  style={{
                    height: "800px",
                    border: "none",
                  }}
                  title="Test Receipt Preview"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-300 flex justify-end gap-2">
              <Button
                onClick={() => {
                  setShowPreview(false);
                  if (previewUrl) {
                    window.URL.revokeObjectURL(previewUrl);
                    setPreviewUrl(null);
                  }
                }}
                className="bg-gray-600 hover:bg-gray-700 text-white"
              >
                Κλείσιμο
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Export function to get current paper size from anywhere in the app
export function getPrinterPaperSize(): PaperSize {
  if (typeof window === "undefined") return "A4";
  const savedSize = localStorage.getItem(STORAGE_KEY) as PaperSize | null;
  if (savedSize && PAPER_SIZES.some((size) => size.id === savedSize)) {
    return savedSize;
  }
  return "A4";
}

// Export function to get paper size config
export function getPaperSizeConfig(size?: PaperSize): PaperSizeConfig {
  const targetSize = size || getPrinterPaperSize();
  return (
    PAPER_SIZES.find((s) => s.id === targetSize) || PAPER_SIZES[0]
  );
}

// Export function to get selected printer name from anywhere in the app
export function getSelectedPrinter(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(PRINTER_STORAGE_KEY);
}
