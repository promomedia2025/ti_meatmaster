"use client";

import { useState, useEffect } from "react";
import { X, Printer, RefreshCw } from "lucide-react";
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
    }
  }, []);

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
          <div className="flex-1 overflow-y-auto p-4">
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
        </div>
      </div>
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
