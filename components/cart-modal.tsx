"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { X, Plus, Minus, ShoppingCart, Trash2, Loader2 } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
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
  const [removingItems, setRemovingItems] = useState<Set<string>>(new Set());
  const [isRemoving, setIsRemoving] = useState(false);
  const [locationImages, setLocationImages] = useState<Map<number, string>>(
    new Map()
  );
  const fetchedLocationIdsRef = useRef<Set<number>>(new Set());
  const router = useRouter();
  const pathname = usePathname();

  // Extract current language from pathname (first segment)
  const currentLang = useMemo(() => {
    const segments = pathname.split("/").filter(Boolean);
    // Check if first segment is a language code (el, en)
    if (segments[0] === "el" || segments[0] === "en") {
      return segments[0];
    }
    // Default to Greek if no language found
    return "el";
  }, [pathname]);

  // Fetch location images for carts
  useEffect(() => {
    const fetchLocationImages = async () => {
      if (locationCarts.length === 0) return;

      // Use functional update to check current state without including it in dependencies
      let missingIds: number[] = [];
      setLocationImages((currentImages) => {
        const locationIds = locationCarts.map((cart) => cart.locationId);
        missingIds = locationIds.filter(
          (id) =>
            !fetchedLocationIdsRef.current.has(id) &&
            !currentImages.has(id) &&
            !locationCarts.find((c) => c.locationId === id)?.locationImage
        );
        return currentImages; // Don't update yet
      });

      if (missingIds.length === 0) return;

      // Mark as being fetched to prevent duplicate requests
      missingIds.forEach((id) => fetchedLocationIdsRef.current.add(id));

      try {
        // Fetch all locations and filter by the ones we need
        const response = await fetch("/api/locations");
        const data = await response.json();

        if (data.success && data.data?.locations) {
          // Use functional update to add new images
          setLocationImages((prevImages) => {
            const updatedImages = new Map(prevImages);
            data.data.locations.forEach((location: any) => {
              if (
                missingIds.includes(location.id) &&
                location.images?.thumbnail?.url
              ) {
                updatedImages.set(location.id, location.images.thumbnail.url);
              }
            });
            return updatedImages;
          });
        }
      } catch (error) {
        console.error("Error fetching location images:", error);
        // Remove from fetched set on error so we can retry
        missingIds.forEach((id) => fetchedLocationIdsRef.current.delete(id));
      }
    };

    fetchLocationImages();
  }, [locationCarts]);

  if (!isOpen) return null;

  const handleClearCart = useCallback(async () => {
    setIsClearing(true);
    clearAllCarts();
    setIsClearing(false);
  }, [clearAllCarts]);

  // Handle animated item removal with loading state
  const handleRemoveItem = useCallback(
    async (locationId: number, rowId: string) => {
      if (isRemoving) return; // Prevent multiple simultaneous removals

      setIsRemoving(true);
      // Add item to removing set to trigger animation
      setRemovingItems((prev) => new Set(prev).add(rowId));

      try {
        // Wait for animation to complete (300ms)
        await new Promise((resolve) => setTimeout(resolve, 300));

        // Actually remove the item
        removeItem(locationId, rowId);
      } finally {
        // Remove from removing set
        setRemovingItems((prev) => {
          const newSet = new Set(prev);
          newSet.delete(rowId);
          return newSet;
        });
        setIsRemoving(false);
      }
    },
    [isRemoving, removeItem]
  );

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
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {(locationCart.locationImage ||
                        locationImages.get(locationCart.locationId)) && (
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                          <Image
                            src={
                              locationCart.locationImage ||
                              locationImages.get(locationCart.locationId) ||
                              ""
                            }
                            alt={locationCart.locationName}
                            fill
                            className="object-cover"
                            sizes="48px"
                          />
                        </div>
                      )}
                      <h3 className="text-white font-medium truncate">
                        {locationCart.locationName}
                      </h3>
                    </div>
                    <span className="text-gray-400 text-sm flex-shrink-0">
                      {locationCart.summary.count}{" "}
                      {locationCart.summary.count === 1
                        ? "αντικείμενο"
                        : "αντικείμενα"}
                    </span>
                  </div>

                  {/* Location Items */}
                  {Array.isArray(locationCart.items) &&
                    locationCart.items.map((item) => (
                      <div
                        key={item.rowId}
                        className={`bg-gray-800 rounded-lg p-4 transition-all duration-300 ease-in-out ${
                          removingItems.has(item.rowId)
                            ? "opacity-0 scale-95 -translate-x-4"
                            : "opacity-100 scale-100 translate-x-0"
                        }`}
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
                              <div className="mt-2">
                                <p className="text-gray-400 text-sm mb-1">
                                  Επιλογές:
                                </p>
                                <div className="space-y-1">
                                  {item.options.map((option, index) => (
                                    <div key={index} className="text-sm">
                                      <span className="text-gray-300 font-medium">
                                        {option.option_name}:
                                      </span>
                                      <div className="ml-2 space-y-1">
                                        {option.values.map(
                                          (value, valueIndex) => (
                                            <div
                                              key={valueIndex}
                                              className="flex justify-between items-center"
                                            >
                                              <span className="text-gray-300">
                                                {value.option_value_name}
                                                {value.qty > 1 &&
                                                  ` (x${value.qty})`}
                                              </span>
                                              {value.price > 0 && (
                                                <span className="text-green-400 font-medium">
                                                  +€{value.price.toFixed(2)}
                                                </span>
                                              )}
                                            </div>
                                          )
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() =>
                              handleRemoveItem(
                                locationCart.locationId,
                                item.rowId
                              )
                            }
                            disabled={
                              removingItems.has(item.rowId) || isRemoving
                            }
                            className={`p-1 hover:bg-gray-700 rounded transition-colors ${
                              removingItems.has(item.rowId) || isRemoving
                                ? "opacity-50 cursor-not-allowed"
                                : ""
                            }`}
                          >
                            {removingItems.has(item.rowId) ? (
                              <Skeleton className="w-4 h-4 rounded" />
                            ) : (
                              <Trash2 className="w-4 h-4 text-red-400" />
                            )}
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
                          `/${currentLang}/checkout?locationId=${locationCart.locationId}`
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

            <button className="w-full bg-[#ff9328ff] text-white py-3 rounded-lg font-medium hover:bg-[#915316] transition-colors">
              Συνέχεια παραγγελίας
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
