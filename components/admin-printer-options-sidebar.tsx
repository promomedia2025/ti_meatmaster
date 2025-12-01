"use client";

import { useState, useEffect } from "react";
import { X, Printer } from "lucide-react";
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
    dimensions: "69.95mm (thermal)",
    width: 69.95,
  },
];

const STORAGE_KEY = "admin_printer_paper_size";

export function AdminPrinterOptionsSidebar({
  isOpen,
  onClose,
}: PrinterOptionsSidebarProps) {
  const [selectedSize, setSelectedSize] = useState<PaperSize>("A4");

  // Load saved paper size from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedSize = localStorage.getItem(STORAGE_KEY) as PaperSize | null;
      if (savedSize && PAPER_SIZES.some((size) => size.id === savedSize)) {
        setSelectedSize(savedSize);
      }
    }
  }, []);

  const handleSelectSize = (size: PaperSize) => {
    setSelectedSize(size);
    // Save to localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, size);
    }
    toast.success(`Επιλέχθηκε: ${PAPER_SIZES.find((s) => s.id === size)?.name}`);
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
              <Printer className="w-5 h-5 text-[#ff9328ff]" />
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
                      ? "border-[#ff9328ff] bg-[#ff9328ff]/10"
                      : "border-gray-700 bg-[#1a1a1a] hover:border-gray-600"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3
                        className={`text-lg font-semibold ${
                          selectedSize === size.id
                            ? "text-[#ff9328ff]"
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
                      <div className="w-5 h-5 rounded-full bg-[#ff9328ff] flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-white" />
                      </div>
                    )}
                  </div>
                </button>
              ))}
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

