"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/lib/auth-context";
import { usePusher } from "@/lib/pusher-context";
import { addActiveOrder } from "@/lib/active-orders";
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

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated } = useAuth();
  const { locationCarts, getLocationCart } = useCart();
  const { subscribe, unsubscribe, isConnected } = usePusher();

  const locationId = searchParams.get("locationId");
  const locationCart = locationId
    ? getLocationCart(parseInt(locationId))
    : null;

  const [orderType, setOrderType] = useState<"pickup" | "delivery">("delivery");

  // Determine available order types based on restaurant status
  const availableOrderTypes = locationCart?.restaurantStatus
    ? {
        delivery: locationCart.restaurantStatus.deliveryAvailable,
        pickup: locationCart.restaurantStatus.pickupAvailable,
      }
    : { delivery: true, pickup: true }; // Default to both available if no status

  // Set default order type based on availability
  useEffect(() => {
    if (locationCart?.restaurantStatus) {
      if (availableOrderTypes.delivery && !availableOrderTypes.pickup) {
        setOrderType("delivery");
      } else if (availableOrderTypes.pickup && !availableOrderTypes.delivery) {
        setOrderType("pickup");
      }
    }
  }, [locationCart, availableOrderTypes]);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card">("cash");
  const [orderComments, setOrderComments] = useState("");
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderId, setOrderId] = useState<number | null>(null);

  // Load user location from localStorage
  useEffect(() => {
    const savedLocation = localStorage.getItem("userLocation");
    if (savedLocation) {
      try {
        const parsedLocation = JSON.parse(savedLocation);
        setUserLocation(parsedLocation);
      } catch (error) {
        console.error("Error parsing saved location:", error);
      }
    }
  }, []);

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
    // Validate restaurant status and order type availability
    if (locationCart?.restaurantStatus) {
      if (!locationCart.restaurantStatus.isOpen) {
        alert("Το εστιατόριο είναι κλειστό αυτή τη στιγμή.");
        return;
      }

      if (
        orderType === "delivery" &&
        !locationCart.restaurantStatus.deliveryAvailable
      ) {
        alert("Η παράδοση δεν είναι διαθέσιμη από αυτό το εστιατόριο.");
        return;
      }

      if (
        orderType === "pickup" &&
        !locationCart.restaurantStatus.pickupAvailable
      ) {
        alert("Η παραλαβή δεν είναι διαθέσιμη από αυτό το εστιατόριο.");
        return;
      }
    }

    // Check if user is authenticated
    if (!isAuthenticated || !user) {
      alert("Παρακαλώ συνδεθείτε για να ολοκληρώσετε την παραγγελία.");
      return;
    }

    setIsSubmitting(true);

    try {
      // First, get CSRF token
      console.log("🔐 Fetching CSRF token...");
      const csrfResponse = await fetch(
        "https://multitake.bettersolution.gr/api/csrf"
      );

      if (!csrfResponse.ok) {
        throw new Error(`Failed to get CSRF token: ${csrfResponse.status}`);
      }

      const csrfData = await csrfResponse.json();
      console.log("🔐 CSRF token received:", csrfData);

      if (!csrfData.success || !csrfData.csrf_token) {
        throw new Error("Invalid CSRF token response");
      }

      // Prepare order data in the expected API format
      const orderData = {
        locationId: locationCart.locationId,
        locationName: locationCart.locationName,
        items: locationCart.items,
        total: locationCart.summary.total,
        orderType: orderType === "delivery" ? "delivery" : "collection",
        paymentMethod: paymentMethod === "cash" ? "cod" : "card",
        orderComments,
        user: {
          id: user.id,
          email: user.email,
          name:
            user.name ||
            `${user.first_name || ""} ${user.last_name || ""}`.trim(),
        },
        restaurantStatus: locationCart.restaurantStatus,
      };

      console.log("📦 Submitting order with data:", orderData);

      // Submit order to API with CSRF token
      const response = await fetch(
        "https://multitake.bettersolution.gr/public/custom-orders/create",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-TOKEN": csrfData.csrf_token,
          },
          body: JSON.stringify(orderData),
        }
      );

      if (!response.ok) {
        throw new Error(`API request failed with status: ${response.status}`);
      }

      const result = await response.json();
      console.log("✅ Order created successfully:", result);

      // Set the order ID and save to active orders
      if (result.data?.order_id) {
        const orderId = result.data.order_id;
        console.log(`🆔 Setting order ID: ${orderId}`);
        setOrderId(orderId);

        // Save to active orders for tracking
        addActiveOrder(orderId, locationCart.locationName);

        // Show success message
        alert("Η παραγγελία σας υποβλήθηκε επιτυχώς!");

        // Redirect to order tracking page
        router.push(`/order/${orderId}`);
      } else {
        console.warn("⚠️ No orderId found in API response:", result);
        alert(
          "Η παραγγελία υποβλήθηκε αλλά δεν μπορέσαμε να λάβουμε το αναγνωριστικό."
        );
      }
    } catch (error) {
      console.error("Error submitting order:", error);
      alert(
        "Σφάλμα κατά την υποβολή της παραγγελίας. Παρακαλώ δοκιμάστε ξανά."
      );
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
                value={user?.name || ""}
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
            <label
              className={`flex items-center gap-3 ${
                availableOrderTypes.delivery
                  ? "cursor-pointer"
                  : "cursor-not-allowed opacity-50"
              }`}
            >
              <input
                type="radio"
                name="orderType"
                value="delivery"
                checked={orderType === "delivery"}
                onChange={(e) => setOrderType(e.target.value as "delivery")}
                disabled={!availableOrderTypes.delivery}
                className="w-4 h-4 text-primary"
              />
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-400" />
                <span className="text-white">Παράδοση</span>
                {!availableOrderTypes.delivery && (
                  <span className="text-red-400 text-sm">(Μη διαθέσιμο)</span>
                )}
              </div>
            </label>
            <label
              className={`flex items-center gap-3 ${
                availableOrderTypes.pickup
                  ? "cursor-pointer"
                  : "cursor-not-allowed opacity-50"
              }`}
            >
              <input
                type="radio"
                name="orderType"
                value="pickup"
                checked={orderType === "pickup"}
                onChange={(e) => setOrderType(e.target.value as "pickup")}
                disabled={!availableOrderTypes.pickup}
                className="w-4 h-4 text-primary"
              />
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-green-400" />
                <span className="text-white">Παραλαβή</span>
                {!availableOrderTypes.pickup && (
                  <span className="text-red-400 text-sm">(Μη διαθέσιμο)</span>
                )}
              </div>
            </label>
          </div>

          {/* Show restaurant status message if available */}
          {locationCart?.restaurantStatus && (
            <div className="mt-3 p-3 bg-gray-800 rounded-lg">
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    locationCart.restaurantStatus.isOpen
                      ? "bg-green-400"
                      : "bg-red-400"
                  }`}
                ></div>
                <span className="text-gray-300 text-sm">
                  {locationCart.restaurantStatus.statusMessage}
                </span>
              </div>
              {locationCart.restaurantStatus.nextOpeningTime && (
                <div className="text-gray-400 text-xs mt-1">
                  Επόμενη ανοιχτή ώρα:{" "}
                  {locationCart.restaurantStatus.nextOpeningTime}
                </div>
              )}
            </div>
          )}
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
          <div className="space-y-2">
            {locationCart.items.map((item) => (
              <div
                key={item.rowId}
                className="flex justify-between items-center"
              >
                <span className="text-gray-300">
                  {item.name} x{item.qty}
                </span>
                <span className="text-white font-medium">
                  €{item.subtotal.toFixed(2)}
                </span>
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
        <Button
          onClick={handleSubmitOrder}
          disabled={isSubmitting}
          className="w-full bg-primary text-primary-foreground py-3 text-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Υποβολή..." : "Υποβολή παραγγελίας"}
        </Button>
      </div>
    </div>
  );
}
