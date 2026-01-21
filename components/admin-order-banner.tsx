"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { X, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdminOrder {
  order_id: number;
  location_name?: string;
  order_total?: string;
  currency?: string;
}

interface AdminOrderBannerProps {
  order: AdminOrder | null;
  onDismiss: () => void;
  onView: () => void;
}

/**
 * Returns the full location name
 */
const formatLocationName = (locationName?: string) => {
  // Always return the full location_name
  return locationName || "";
};

export function AdminOrderBanner({
  order,
  onDismiss,
  onView,
}: AdminOrderBannerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (order) {
      setIsVisible(true);
      setIsAnimating(true);

      // Auto-dismiss after 8 seconds
      const timer = setTimeout(() => {
        setIsAnimating(false);
        setTimeout(() => {
          setIsVisible(false);
          onDismiss();
        }, 300); // Wait for animation to complete
      }, 8000);

      return () => clearTimeout(timer);
    } else {
      setIsAnimating(false);
      setTimeout(() => {
        setIsVisible(false);
      }, 300);
    }
  }, [order, onDismiss]);

  if (!order || !isVisible) {
    return null;
  }

  const locationDisplay =
    formatLocationName(order.location_name) || "άγνωστη τοποθεσία";
  const totalDisplay = order.order_total
    ? `${order.order_total} ${order.currency || "EUR"}`
    : "";

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ease-in-out ${
        isAnimating
          ? "translate-y-0 opacity-100"
          : "-translate-y-full opacity-0"
      }`}
    >
      <div className="bg-gradient-to-r from-[#009DE0] to-[#0077B6] text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="flex-shrink-0">
                <Bell className="h-6 w-6 animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-lg md:text-xl">
                  Νέα Παραγγελία
                </div>
                <div className="text-sm md:text-base opacity-90 truncate">
                  Παραγγελία #{order.order_id}
                  {totalDisplay && ` • ${totalDisplay}`}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                onClick={onView}
                variant="secondary"
                size="sm"
                className="bg-white/20 hover:bg-white/30 text-white border-white/30"
              >
                Προβολή
              </Button>
              <Button
                onClick={() => {
                  setIsAnimating(false);
                  setTimeout(() => {
                    setIsVisible(false);
                    onDismiss();
                  }, 300);
                }}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20 h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
