"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdminDeliveryTimeModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: number;
  onUpdate: (orderId: number, estimatedTime: number) => Promise<void>;
}

const TIME_OPTIONS = [15, 20, 25, 30, 35, 45, 50, 55, 60];

export function AdminDeliveryTimeModal({
  isOpen,
  onClose,
  orderId,
  onUpdate,
}: AdminDeliveryTimeModalProps) {
  const [selectedTime, setSelectedTime] = useState<number>(30);
  const [isUpdating, setIsUpdating] = useState(false);

  if (!isOpen) return null;

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      await onUpdate(orderId, selectedTime);
      onClose();
    } catch (error) {
      console.error("Error updating delivery time:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#1a1a1a] rounded-xl w-full max-w-md shadow-2xl border border-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-gray-700 p-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Χρόνος Παραγγελίας</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-300 mb-6 text-center">
            Επιλέξτε τον εκτιμώμενο χρόνο παραγγελίας (λεπτά)
          </p>

          {/* Time Options Grid */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {TIME_OPTIONS.map((time) => (
              <button
                key={time}
                onClick={() => setSelectedTime(time)}
                className={`px-4 py-3 rounded-lg font-medium transition-all ${
                  selectedTime === time
                    ? "bg-[#009DE0] text-white border-2 border-[#009DE0]"
                    : "bg-[#2a2a2a] text-gray-300 border-2 border-gray-700 hover:border-gray-600"
                }`}
              >
                {time}
              </button>
            ))}
          </div>

          {/* Selected Time Display */}
          <div className="bg-[#2a2a2a] rounded-lg p-4 mb-6 text-center">
            <p className="text-gray-400 text-sm mb-1">Επιλεγμένος χρόνος</p>
            <p className="text-2xl font-bold text-white">{selectedTime} λεπτά</p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              Ακύρωση
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={isUpdating}
              className="flex-1 bg-[#009DE0] hover:bg-[#0082b8] text-white"
            >
              {isUpdating ? "Ενημέρωση..." : "Ενημέρωση χρόνου"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}







