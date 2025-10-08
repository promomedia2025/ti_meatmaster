"use client";

import { useState } from "react";
import { X, Plus, Minus, ShoppingCart, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-context";

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartModal({ isOpen, onClose }: CartModalProps) {
  const {
    locationCarts,
    globalSummary,
    updateQuantity,
    removeItem,
    clearAllCarts,
  } = useCart();
  const [isClearing, setIsClearing] = useState(false);
  const router = useRouter();

  if (!isOpen) return null;

  const handleClearCart = async () => {
    setIsClearing(true);
    clearAllCarts();
    setIsClearing(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end justify-center">
      <div className="bg-gray-900 w-full max-w-md max-h-[80vh] rounded-t-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-semibold text-white">Καλάθι</h2>
            <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
              {globalSummary.totalItems}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4">
          {locationCarts.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingCart className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">Το καλάθι σας είναι άδειο</p>
            </div>
          ) : (
            <div className="space-y-4">
              {locationCarts.map((locationCart) => (
                <div key={locationCart.locationId} className="space-y-3">
                  {/* Location Header */}
                  <div className="flex items-center justify-between">
                    <h3 className="text-white font-medium">
                      {locationCart.locationName}
                    </h3>
                    <span className="text-gray-400 text-sm">
                      {locationCart.summary.count}{" "}
                      {locationCart.summary.count === 1
                        ? "αντικείμενο"
                        : "αντικείμενα"}
                    </span>
                  </div>

                  {/* Location Items */}
                  {locationCart.items.map((item) => (
                    <div
                      key={item.rowId}
                      className="bg-gray-800 rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="text-white font-medium">
                            {item.name}
                          </h3>
                          {item.comment && (
                            <p className="text-gray-400 text-sm mt-1">
                              Σχόλιο: {item.comment}
                            </p>
                          )}
                          {item.options && item.options.length > 0 && (
                            <div className="text-gray-400 text-sm mt-1">
                              Επιλογές:{" "}
                              {item.options
                                .map((opt) => opt.name || opt)
                                .join(", ")}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() =>
                            removeItem(locationCart.locationId, item.rowId)
                          }
                          className="p-1 hover:bg-gray-700 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              updateQuantity(
                                locationCart.locationId,
                                item.rowId,
                                item.qty - 1
                              )
                            }
                            className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center hover:bg-gray-600 transition-colors"
                          >
                            <Minus className="w-4 h-4 text-white" />
                          </button>
                          <span className="text-white font-medium w-8 text-center">
                            {item.qty}
                          </span>
                          <button
                            onClick={() =>
                              updateQuantity(
                                locationCart.locationId,
                                item.rowId,
                                item.qty + 1
                              )
                            }
                            className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center hover:bg-gray-600 transition-colors"
                          >
                            <Plus className="w-4 h-4 text-white" />
                          </button>
                        </div>
                        <div className="text-right">
                          <p className="text-blue-400 font-bold">
                            {item.subtotal.toFixed(2)} €
                          </p>
                          <p className="text-gray-400 text-sm">
                            {item.price.toFixed(2)} € × {item.qty}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Location Summary and Checkout Button */}
                  <div className="mt-3 pt-3 border-t border-gray-600">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-gray-300 text-sm">Σύνολο:</span>
                      <span className="text-white font-medium">
                        €{locationCart.summary.total.toFixed(2)}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        onClose();
                        router.push(
                          `/checkout?locationId=${locationCart.locationId}`
                        );
                      }}
                      className="w-full bg-primary text-primary-foreground py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors text-sm"
                    >
                      Ολοκληρωση παραγγελιας
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {locationCarts.length > 0 && (
          <div className="border-t border-gray-800 p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="text-right">
                <p className="text-gray-400 text-sm">
                  Συνολικό ποσό ({globalSummary.totalLocations}{" "}
                  {globalSummary.totalLocations === 1
                    ? "εστιατόριο"
                    : "εστιατόρια"}
                  )
                </p>
                <p className="text-white text-lg font-bold">
                  {globalSummary.totalAmount.toFixed(2)} €
                </p>
              </div>
              <button
                onClick={handleClearCart}
                disabled={isClearing}
                className="text-red-400 text-sm hover:text-red-300 transition-colors disabled:opacity-50"
              >
                {isClearing ? "Διαγραφή..." : "Διαγραφή όλων"}
              </button>
            </div>

            <button className="w-full bg-blue-500 text-white py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors">
              Συνέχεια παραγγελίας
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
