"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { usePusher } from "@/lib/pusher-context";
import { useAuth } from "@/lib/auth-context";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Loader2,
  CheckCircle,
  Clock,
  Truck,
  ChefHat,
} from "lucide-react";

interface OrderStatus {
  status: string;
  statusName: string;
  updatedAt: string;
}

export default function OrderStatusPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.orderId as string;
  const { subscribe, unsubscribe, isConnected } = usePusher();
  const { user, isAuthenticated } = useAuth();

  const [orderStatus, setOrderStatus] = useState<OrderStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch initial order status from API
  useEffect(() => {
    const fetchOrderStatus = async () => {
      if (!user?.id || !orderId) {
        console.log("⚠️ Missing user ID or order ID");
        setIsLoading(false);
        return;
      }

      try {
        console.log(`🔍 Fetching order ${orderId} details...`);
        const response = await fetch(
          `https://cocofino.bettersolution.gr/api/user/${user.id}/orders/${orderId}`
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch order: ${response.status}`);
        }

        const data = await response.json();
        console.log(`✅ Order ${orderId} fetched:`, data);

        if (data.success && data.data) {
          setOrderStatus({
            status: data.data.status_id?.toString() || "",
            statusName: data.data.status_name || "Unknown",
            updatedAt: data.data.order_date || new Date().toISOString(),
          });
        }
      } catch (error) {
        console.error(`❌ Error fetching order ${orderId}:`, error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrderStatus();
  }, [user?.id, orderId]);

  // Subscribe to order-specific channel
  useEffect(() => {
    console.log("🔍 Order page - Pusher connection state:", {
      isConnected,
      orderId,
    });

    if (!isConnected || !orderId) {
      if (!isConnected) console.log("⚠️ Pusher not connected yet");
      if (!orderId) console.log("⚠️ No order ID available");
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
        setOrderStatus({
          status: data.status_id?.toString() || data.status || "",
          statusName: data.status_name || data.statusName || "Updated",
          updatedAt: data.updated_at || new Date().toISOString(),
        });
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

  const getStatusIcon = (status: string) => {
    const statusLower = status?.toLowerCase() || "";
    if (statusLower.includes("complete") || statusLower.includes("delivered")) {
      return <CheckCircle className="w-8 h-8 text-green-500" />;
    }
    if (statusLower.includes("preparing") || statusLower.includes("received")) {
      return <ChefHat className="w-8 h-8 text-yellow-500" />;
    }
    if (statusLower.includes("transit") || statusLower.includes("way")) {
      return <Truck className="w-8 h-8 text-blue-500" />;
    }
    return <Clock className="w-8 h-8 text-gray-500" />;
  };

  const getStatusColor = (status: string) => {
    const statusLower = status?.toLowerCase() || "";
    if (statusLower.includes("complete") || statusLower.includes("delivered")) {
      return "bg-green-50 border-green-200 text-green-700";
    }
    if (statusLower.includes("preparing") || statusLower.includes("received")) {
      return "bg-yellow-50 border-yellow-200 text-yellow-700";
    }
    if (statusLower.includes("transit") || statusLower.includes("way")) {
      return "bg-blue-50 border-blue-200 text-blue-700";
    }
    return "bg-gray-50 border-gray-200 text-gray-700";
  };

  const getStatusText = (statusName: string) => {
    const statusLower = statusName?.toLowerCase() || "";

    // Exact matches first
    switch (statusLower) {
      case "delivery":
      case "delivered":
      case "complete":
      case "completed":
        return "Παραδόθηκε";
      case "received":
        return "Ελήφθη";
      case "pending":
        return "Εκκρεμεί";
      case "cancelled":
      case "canceled":
        return "Ακυρώθηκε";
      case "preparing":
      case "in preparation":
        return "Σε προετοιμασία";
      case "transit":
      case "on the way":
      case "in transit":
        return "Σε διανομή";
      case "ready":
        return "Έτοιμο";
      default:
        // Check for partial matches (order matters - more specific first)
        if (
          statusLower.includes("transit") ||
          statusLower.includes("on the way")
        ) {
          return "Σε διανομή";
        }
        if (
          statusLower.includes("delivered") ||
          statusLower.includes("complete")
        ) {
          return "Παραδόθηκε";
        }
        if (statusLower.includes("receive")) {
          return "Ελήφθη";
        }
        if (statusLower.includes("pending") || statusLower.includes("wait")) {
          return "Εκκρεμεί";
        }
        if (statusLower.includes("cancel")) {
          return "Ακυρώθηκε";
        }
        if (statusLower.includes("prepar") || statusLower.includes("cook")) {
          return "Σε προετοιμασία";
        }
        if (statusLower.includes("deliver")) {
          return "Σε διανομή";
        }
        // Return original if no match found
        return statusName;
    }
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/order-history")}
              className="p-2 rounded-full bg-gray-800 text-white hover:bg-gray-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold text-white">
              Παρακολούθηση Παραγγελίας #{orderId}
            </h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Connection Status */}
        <Card className="bg-gray-900 border-gray-800 p-4 mb-6">
          <div className="flex items-center gap-3">
            <div
              className={`w-3 h-3 rounded-full ${
                isConnected ? "bg-green-400 animate-pulse" : "bg-red-400"
              }`}
            ></div>
            <span className="text-gray-300 text-sm">
              {isConnected
                ? "Συνδεδεμένο - Λήψη ενημερώσεων σε πραγματικό χρόνο"
                : "Αποσυνδεδεμένο"}
            </span>
          </div>
        </Card>

        {/* Order Status */}
        {isLoading ? (
          <Card className="bg-gray-900 border-gray-800 p-8">
            <div className="flex flex-col items-center justify-center">
              <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
              <p className="text-gray-300">Φόρτωση κατάστασης παραγγελίας...</p>
            </div>
          </Card>
        ) : orderStatus ? (
          <Card className="bg-gray-900 border-gray-800 p-6">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                {getStatusIcon(orderStatus.statusName)}
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                {getStatusText(orderStatus.statusName)}
              </h2>
              <p className="text-gray-400 text-sm mb-6">
                Τελευταία ενημέρωση:{" "}
                {new Date(orderStatus.updatedAt).toLocaleString("el-GR")}
              </p>
              <div
                className={`inline-block px-4 py-2 rounded-full border ${getStatusColor(
                  orderStatus.statusName
                )}`}
              >
                Παραγγελία #{orderId}
              </div>
            </div>
          </Card>
        ) : (
          <Card className="bg-gray-900 border-gray-800 p-8">
            <div className="text-center">
              <Clock className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">
                Αναμονή για ενημερώσεις
              </h3>
              <p className="text-gray-400">
                Η παραγγελία σας ελήφθη. Θα λάβετε ενημερώσεις σε πραγματικό
                χρόνο.
              </p>
            </div>
          </Card>
        )}

        {/* Info Card */}
        <Card className="bg-gray-900 border-gray-800 p-4 mt-6">
          <h3 className="text-lg font-semibold text-white mb-3">Πληροφορίες</h3>
          <ul className="space-y-2 text-gray-300 text-sm">
            <li>• Η σελίδα ενημερώνεται αυτόματα σε πραγματικό χρόνο</li>
            <li>
              • Μπορείτε να κρατήσετε τη σελίδα ανοιχτή για να δείτε τις
              ενημερώσεις
            </li>
            <li>• Οι ειδοποιήσεις θα εμφανίζονται επίσης στην αρχική σελίδα</li>
          </ul>
        </Card>

        {/* Actions */}
        <div className="mt-6 space-y-3">
          <Button
            onClick={() => router.push("/order-history")}
            className="w-full bg-gray-800 text-white hover:bg-gray-700"
          >
            Προβολή Ιστορικού Παραγγελιών
          </Button>
          <Button
            onClick={() => router.push("/")}
            variant="outline"
            className="w-full border-gray-700 text-gray-300 hover:bg-gray-800"
          >
            Επιστροφή στην Αρχική
          </Button>
        </div>
      </div>
    </div>
  );
}
