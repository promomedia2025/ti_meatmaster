"use client";

import { useState, useEffect, Suspense, useMemo } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useServerCart } from "@/lib/server-cart-context";
import { useAuth } from "@/lib/auth-context";
import { usePusher } from "@/lib/pusher-context";
import { useDeliveryAvailability } from "@/lib/delivery-availability-context";
import { useLocation } from "@/lib/location-context";
import { addActiveOrder } from "@/lib/active-orders";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ArrowLeft, MapPin, CreditCard, Package } from "lucide-react";

interface UserLocation {
  city: string;
  fullAddress: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  addressDetails: {
    street?: string;
    houseNumber?: string;
    postalCode?: string;
    locality?: string;
    country?: string;
  };
}

function CheckoutPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuth();
  const { locationCarts, getLocationCart, clearLocationCart } = useServerCart();
  const { subscribe, unsubscribe, isConnected } = usePusher();
  const { isDeliveryBlocked, setDeliveryData, getDeliveryData } =
    useDeliveryAvailability();
  const { coordinates } = useLocation();

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

  const locationId = searchParams.get("locationId");
  const locationCart = locationId
    ? getLocationCart(parseInt(locationId))
    : null;

  const [orderType, setOrderType] = useState<"pickup" | "delivery">("delivery");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card">("cash");
  const [orderComments, setOrderComments] = useState("");
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderId, setOrderId] = useState<number | null>(null);
  const [isCheckingDelivery, setIsCheckingDelivery] = useState(false);

  // Load user location from localStorage (with Safari-safe access)
  useEffect(() => {
    try {
      const savedLocation = localStorage.getItem("userLocation");
      if (savedLocation) {
        try {
          const parsedLocation = JSON.parse(savedLocation);
          setUserLocation(parsedLocation);
        } catch (error) {
          console.error("Error parsing saved location:", error);
        }
      }
    } catch (error) {
      // Safari private browsing mode throws errors when accessing localStorage
      console.warn("localStorage not available:", error);
    }
  }, []);

  // Check delivery availability when locationId, coordinates, and orderType change
  useEffect(() => {
    const checkDeliveryAvailability = async () => {
      console.log("🛒 [CHECKOUT] Delivery availability check triggered", {
        locationId: locationCart?.locationId,
        hasCoordinates: !!coordinates,
        coordinates: coordinates
          ? { lat: coordinates.latitude, lng: coordinates.longitude }
          : null,
        orderType,
        isCheckingDelivery,
      });

      // Check if delivery is available from restaurant status
      const isDeliveryAvailable =
        locationCart?.restaurantStatus?.deliveryAvailable ?? true;

      if (
        !locationCart?.locationId ||
        !coordinates ||
        orderType !== "delivery" ||
        isCheckingDelivery ||
        !isDeliveryAvailable
      ) {
        console.log("🛒 [CHECKOUT] Skipping delivery check:", {
          reason: !locationCart?.locationId
            ? "No location cart"
            : !coordinates
            ? "No coordinates"
            : orderType !== "delivery"
            ? "Not delivery order"
            : !isDeliveryAvailable
            ? "Delivery not available"
            : "Already checking",
        });
        return;
      }

      console.log("🛒 [CHECKOUT] Starting delivery availability check", {
        locationId: locationCart.locationId,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
      });

      setIsCheckingDelivery(true);

      try {
        const response = await fetch(
          `/api/locations/${locationCart.locationId}/delivery-availability?latitude=${coordinates.latitude}&longitude=${coordinates.longitude}`
        );

        const data = await response.json();

        console.log("🛒 [CHECKOUT] Delivery availability response:", {
          success: data.success,
          data: data.data,
        });

        if (data.success && data.data) {
          // Store delivery data in context
          setDeliveryData(locationCart.locationId, data.data);
          console.log("🛒 [CHECKOUT] Delivery data stored in context", {
            locationId: locationCart.locationId,
            isDeliveryBlocked:
              data.data.delivery_enabled && !data.data.is_within_delivery_area,
            deliveryEnabled: data.data.delivery_enabled,
            isWithinDeliveryArea: data.data.is_within_delivery_area,
          });

          // If delivery is disabled and user has delivery selected, switch to pickup
          if (!data.data.delivery_enabled && orderType === "delivery") {
            console.log("🛒 [CHECKOUT] Delivery disabled, switching to pickup");
            setOrderType("pickup");
          }
        }
      } catch (error) {
        console.error("🛒 [CHECKOUT] Error checking delivery availability:", error);
      } finally {
        setIsCheckingDelivery(false);
        console.log("🛒 [CHECKOUT] Delivery availability check completed");
      }
    };

    checkDeliveryAvailability();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    locationCart?.locationId,
    coordinates?.latitude,
    coordinates?.longitude,
    orderType,
  ]);

  // Listen to specific order channel for order status updates
  useEffect(() => {
    console.log("🔍 Pusher connection state:", {
      isConnected,
      orderId,
    });

    if (!isConnected) {
      console.log("⚠️ Pusher not connected yet");
      return;
    }

    if (!orderId) {
      console.log("⚠️ No order ID available yet");
      return;
    }

    const channelName = `order.${orderId}`;
    console.log(`📡 Attempting to subscribe to channel: ${channelName}`);
    const channel = subscribe(channelName);

    if (channel) {
      // Listen for successful subscription
      channel.bind("pusher:subscription_succeeded", () => {
        console.log(`✅ Successfully subscribed to ${channelName}`);
      });

      // Listen for subscription errors
      channel.bind("pusher:subscription_error", (error: any) => {
        console.error(`❌ Failed to subscribe to ${channelName}:`, error);
      });

      // Listen for order status updates
      channel.bind("orderStatusUpdated", (data: any) => {
        console.log(`📦 Order ${orderId} status updated:`, data);
      });

      console.log(`🔗 Channel ${channelName} binding complete`);
    } else {
      console.error(`❌ Failed to create channel: ${channelName}`);
    }

    return () => {
      console.log(`🔌 Unsubscribing from ${channelName}`);
      unsubscribe(channelName);
    };
  }, [isConnected, orderId, subscribe, unsubscribe]);

  if (!locationCart) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-white text-lg mb-2">Φόρτωση καλαθιού...</div>
          <div className="text-gray-400 text-sm">Παρακαλώ περιμένετε</div>
        </div>
      </div>
    );
  }

  const handleSubmitOrder = async () => {
    // Check if user is authenticated
    if (!isAuthenticated || !user) {
      alert("Παρακαλώ συνδεθείτε για να ολοκληρώσετε την παραγγελία.");
      return;
    }

    // Check if delivery is blocked for delivery orders
    if (orderType === "delivery" && locationCart) {
      const deliveryData = getDeliveryData(locationCart.locationId);
      if (
        deliveryData &&
        deliveryData.delivery_enabled &&
        !deliveryData.is_within_delivery_area
      ) {
        toast.error(
          "Η διεύθυνσή σας είναι εκτός περιοχής παράδοσης. Παρακαλώ επιλέξτε παραλαβή ή αλλάξτε διεύθυνση."
        );
        return;
      }
    }

    setIsSubmitting(true);

    try {
      // Transform cart items to match the expected API format
      const formattedItems = locationCart.items.map((item) => {
        // Transform options array to option_values array for API
        // Each option has: menu_option_id, option_name, and values array
        const optionValues = item.options
          ? item.options.flatMap((opt) =>
              opt.values.map((val) => ({
                menu_option_id: opt.menu_option_id,
                menu_option_value_id: val.menu_option_value_id,
                option_name: opt.option_name,
                option_value_name: val.option_value_name,
                price: val.price,
              }))
            )
          : [];

        return {
          id: item.id,
          name: item.name,
          qty: item.qty,
          price: item.price,
          subtotal: item.subtotal,
          option_values: optionValues,
          comment: item.comment,
        };
      });

      // Prepare order data in the expected API format
      const orderData = {
        locationId: locationCart.locationId,
        locationName: locationCart.locationName,
        items: formattedItems,
        total: locationCart.summary.total,
        orderType: orderType === "delivery" ? "delivery" : "collection",
        paymentMethod: paymentMethod === "cash" ? "cod" : "card",
        orderComments,
        user: {
          email: user.email,
          name:
            user.name ||
            `${user.first_name || ""} ${user.last_name || ""}`.trim(),
        },
      };

      console.log("📦 Submitting order with data:", orderData);

      // Submit order via server-side API route (Safari-safe)
      // IMPORTANT: Using /api/orders/submit to avoid CORS issues in Safari
      const response = await fetch("/api/orders/submit", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error ||
            `API request failed with status: ${response.status}`
        );
      }

      const result = await response.json();
      console.log("✅ Order created successfully:", result);

      // Set the order ID and save to active orders
      const orderId =
        result.data?.order_id || result.data?.id || result.order_id;
      if (orderId) {
        console.log(`🆔 Setting order ID: ${orderId}`);
        setOrderId(orderId);

        // Save to active orders for tracking
        addActiveOrder(orderId, locationCart.locationName);

        // Clear the cart for this specific location
        clearLocationCart(locationCart.locationId);
        console.log(`🛒 Cleared cart for location ${locationCart.locationId}`);

        // Show success message

        // Redirect to order tracking page
        router.push(`/${currentLang}/order/${orderId}`);
      } else {
        console.warn("⚠️ No orderId found in API response:", result);
        alert(
          "Η παραγγελία υποβλήθηκε αλλά δεν μπορέσαμε να λάβουμε το αναγνωριστικό."
        );
      }
    } catch (error) {
      console.error("Error submitting order:", error);

      // Safari-specific error handling
      let errorMessage =
        "Σφάλμα κατά την υποβολή της παραγγελίας. Παρακαλώ δοκιμάστε ξανά.";

      if (error instanceof TypeError) {
        if (
          error.message.includes("could not load") ||
          error.message.includes("Failed to fetch") ||
          error.message.includes("Load failed")
        ) {
          errorMessage =
            "Σφάλμα δικτύου. Παρακαλώ ελέγξτε τη σύνδεσή σας και δοκιμάστε ξανά. Αν το πρόβλημα επιμείνει, δοκιμάστε να ανανεώσετε τη σελίδα.";
        } else {
          errorMessage =
            "Σφάλμα υποβολής. Παρακαλώ ανανεώστε τη σελίδα και δοκιμάστε ξανά.";
        }
      } else if (error instanceof Error) {
        // Check for CORS-related errors
        if (
          error.message.includes("access control") ||
          error.message.includes("CORS") ||
          error.message.includes("multitake.bettersolution.gr")
        ) {
          errorMessage =
            "Σφάλμα ασφαλείας δικτύου. Παρακαλώ ανανεώστε τη σελίδα και δοκιμάστε ξανά.";
        } else {
          errorMessage = error.message || errorMessage;
        }
      }

      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-full bg-gray-800 text-white hover:bg-gray-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold text-white">
              Ολοκληρωση παραγγελιας
            </h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Restaurant Info */}
        <Card className="bg-gray-900 border-gray-800 p-4 mb-6">
          <h2 className="text-lg font-semibold text-white mb-2">
            {locationCart.locationName}
          </h2>
          <div className="text-gray-400 text-sm">
            {locationCart.summary.count}{" "}
            {locationCart.summary.count === 1 ? "αντικείμενο" : "αντικείμενα"} •
            Σύνολο: €{locationCart.summary.total.toFixed(2)}
          </div>
        </Card>

        {/* Customer Info */}
        <Card className="bg-gray-900 border-gray-800 p-4 mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Στοιχεία πελάτη
          </h3>
          <div className="space-y-3">
            <div>
              <label className="block text-gray-300 text-sm mb-1">Όνομα</label>
              <Input
                value={
                  user?.name ||
                  `${user?.first_name || ""} ${user?.last_name || ""}`.trim() ||
                  ""
                }
                readOnly
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="Όνομα"
              />
            </div>
            <div>
              <label className="block text-gray-300 text-sm mb-1">Email</label>
              <Input
                value={user?.email || ""}
                readOnly
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="Email"
              />
            </div>
          </div>
        </Card>

        {/* Order Type */}
        <Card className="bg-gray-900 border-gray-800 p-4 mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Τρόπος παραλαβής
          </h3>
          <div className="space-y-3">
            {(() => {
              const deliveryData = locationCart
                ? getDeliveryData(locationCart.locationId)
                : null;
              const isDeliveryDisabled =
                deliveryData && !deliveryData.delivery_enabled;

              return (
                <label
                  className={`flex items-center gap-3 ${
                    isDeliveryDisabled
                      ? "cursor-not-allowed opacity-50"
                      : "cursor-pointer"
                  }`}
                >
                  <input
                    type="radio"
                    name="orderType"
                    value="delivery"
                    checked={orderType === "delivery"}
                    onChange={(e) => setOrderType(e.target.value as "delivery")}
                    disabled={isDeliveryDisabled}
                    className="w-4 h-4 text-primary disabled:cursor-not-allowed"
                  />
                  <div className="flex items-center gap-2 flex-1">
                    <MapPin className="w-4 h-4 text-blue-400" />
                    <span className="text-white">Παράδοση</span>
                    {isDeliveryDisabled && (
                      <span className="text-red-400 text-sm ml-auto">
                        Το delivery δεν είναι διαθεσιμο
                      </span>
                    )}
                  </div>
                </label>
              );
            })()}
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="orderType"
                value="pickup"
                checked={orderType === "pickup"}
                onChange={(e) => setOrderType(e.target.value as "pickup")}
                className="w-4 h-4 text-primary"
              />
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-green-400" />
                <span className="text-white">Παραλαβή</span>
              </div>
            </label>
          </div>
        </Card>

        {/* Delivery Address (only if delivery is selected) */}
        {orderType === "delivery" && userLocation && (
          <Card className="bg-gray-900 border-gray-800 p-4 mb-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Διεύθυνση παράδοσης
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-gray-300 text-sm mb-1">
                  Διεύθυνση
                </label>
                <Input
                  value={userLocation.fullAddress}
                  readOnly
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-300 text-sm mb-1">
                    Πόλη
                  </label>
                  <Input
                    value={userLocation.city}
                    readOnly
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm mb-1">
                    Ταχυδρομικός κώδικας
                  </label>
                  <Input
                    value={userLocation.addressDetails.postalCode || ""}
                    readOnly
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Payment Method */}
        <Card className="bg-gray-900 border-gray-800 p-4 mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Τρόπος πληρωμής
          </h3>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="paymentMethod"
                value="cash"
                checked={paymentMethod === "cash"}
                onChange={(e) => setPaymentMethod(e.target.value as "cash")}
                className="w-4 h-4 text-primary"
              />
              <div className="flex items-center gap-2">
                <span className="text-white">
                  Πληρωμή στην παράδοση/παραλαβή
                </span>
              </div>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="paymentMethod"
                value="card"
                checked={paymentMethod === "card"}
                onChange={(e) => setPaymentMethod(e.target.value as "card")}
                className="w-4 h-4 text-primary"
              />
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-blue-400" />
                <span className="text-white">Χρεωστική/Πιστωτική Κάρτα</span>
              </div>
            </label>
          </div>
        </Card>

        {/* Order Comments */}
        <Card className="bg-gray-900 border-gray-800 p-4 mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Σχόλια παραγγελίας
          </h3>
          <textarea
            value={orderComments}
            onChange={(e) => setOrderComments(e.target.value)}
            placeholder="Προσθέστε σχόλια για την παραγγελία σας..."
            className="w-full h-24 bg-gray-800 border border-gray-700 rounded-lg p-3 text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </Card>

        {/* Order Summary */}
        <Card className="bg-gray-900 border-gray-800 p-4 mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Σύνοψη παραγγελίας
          </h3>
          <div className="space-y-3">
            {locationCart.items.map((item) => (
              <div
                key={item.rowId}
                className="border-b border-gray-700 pb-2 last:border-b-0"
              >
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">
                    {item.name} x{item.qty}
                  </span>
                  <span className="text-white font-medium">
                    €{item.subtotal.toFixed(2)}
                  </span>
                </div>

                {/* Display menu options if any */}
                {item.options && item.options.length > 0 && (
                  <div className="ml-4 mt-1 space-y-1">
                    {item.options.flatMap((opt) =>
                      opt.values.map((val, index) => (
                        <div
                          key={`${item.rowId}-${opt.menu_option_id}-${val.menu_option_value_id}-${index}`}
                          className="flex justify-between items-center text-sm"
                        >
                          <span className="text-gray-400">
                            + {val.option_value_name}
                            {val.price > 0 && ` (€${val.price.toFixed(2)})`}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Display item comment if any */}
                {item.comment && (
                  <div className="ml-4 mt-1">
                    <span className="text-gray-400 text-sm italic">
                      "{item.comment}"
                    </span>
                  </div>
                )}
              </div>
            ))}
            <div className="border-t border-gray-700 pt-2 mt-2">
              <div className="flex justify-between items-center">
                <span className="text-white font-semibold">Σύνολο</span>
                <span className="text-white font-bold text-lg">
                  €{locationCart.summary.total.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Submit Button */}
        {(() => {
          const deliveryData = locationCart
            ? getDeliveryData(locationCart.locationId)
            : null;
          const isOutsideDeliveryArea =
            orderType === "delivery" &&
            deliveryData &&
            !deliveryData.is_within_delivery_area;

          return (
            <div className="space-y-2">
              <Button
                onClick={handleSubmitOrder}
                disabled={
                  isSubmitting ||
                  (orderType === "delivery" &&
                    locationCart &&
                    isDeliveryBlocked(locationCart.locationId))
                }
                className={`w-full py-3 text-lg font-medium transition-all duration-200 ${
                  orderType === "delivery" &&
                  locationCart &&
                  isDeliveryBlocked(locationCart.locationId)
                    ? "bg-gray-600 text-gray-400 cursor-not-allowed opacity-50"
                    : "bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                }`}
              >
                {isSubmitting
                  ? "Υποβολή..."
                  : orderType === "delivery" &&
                    locationCart &&
                    isDeliveryBlocked(locationCart.locationId)
                  ? "Η διεύθυνση είναι εκτός περιοχής"
                  : "Υποβολή παραγγελίας"}
              </Button>
              {isOutsideDeliveryArea && (
                <p className="text-red-400 text-sm text-center">
                  Το καταστημα δεν εξυπηρετει την συγκεκριμενη διευθυνση
                </p>
              )}
            </div>
          );
        })()}
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="text-center">
            <div className="text-white text-lg mb-2">Loading...</div>
          </div>
        </div>
      }
    >
      <CheckoutPageContent />
    </Suspense>
  );
}
