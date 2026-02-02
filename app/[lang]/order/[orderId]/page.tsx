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
import { Skeleton } from "@/components/ui/skeleton";
import { OrderDetails } from "@/lib/types";

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
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [estimatedDeliveryTime, setEstimatedDeliveryTime] =
    useState<number>(30); // Default 30 minutes
  const [baseEstimatedTime, setBaseEstimatedTime] = useState<number>(30);
  const [estimatedCompletionTime, setEstimatedCompletionTime] = useState<
    string | null
  >(null);

  // Fetch initial order status from API
  useEffect(() => {
    const fetchOrderStatus = async () => {
      if (!user?.id || !orderId) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/user/${user.id}/orders/${orderId}`
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch order: ${response.status}`);
        }

        const data = await response.json();

        if (data.success && data.data) {
          const orderData = data.data;
          setOrderStatus({
            status: orderData.status_id?.toString() || "",
            statusName: orderData.status_name || "Unknown",
            updatedAt: orderData.order_date || new Date().toISOString(),
          });

          // Store full order details
          setOrderDetails({
            order_id: orderData.order_id,
            order_date: orderData.order_date,
            order_time: orderData.order_time,
            order_total: orderData.order_total,
            currency: orderData.currency || "EUR",
            status_id: orderData.status_id,
            created_at: orderData.created_at,
            location_name: orderData.location_name,
            status_name: orderData.status_name,
            menu_items: orderData.menu_items || [],
            order_totals: orderData.order_totals || [],
          });

          // Set estimated delivery time if available in response (in minutes)
          const estimatedTime =
            orderData.estimated_delivery_time || orderData.estimated_time || 30;
          setBaseEstimatedTime(estimatedTime);
          setEstimatedDeliveryTime(estimatedTime);
        }
      } catch (error) {
        // Error fetching order
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrderStatus();
  }, [user?.id, orderId]);

  // Subscribe to order-specific channel
  useEffect(() => {
    

   

    const channelName = `order.${orderId}`;
    const channel = subscribe(`${channelName}`);

    if (channel) {
      // Listen for successful subscription
      channel.bind("pusher:subscription_succeeded", () => {
      });

      // Listen for subscription errors
      channel.bind("pusher:subscription_error", (error: any) => {
        // Failed to subscribe
      });

      // Listen for order status updates
      channel.bind("orderStatusUpdated", (data: any) => {
        setOrderStatus({
          status: data.status_id?.toString() || data.status || "",
          statusName: data.status_name || data.statusName || "Updated",
          updatedAt: data.updated_at || new Date().toISOString(),
        });
      });

      // Listen for delivery time updates (server-broadcast event)
      // Server broadcasts: .orderEstimatedTime
      channel.bind("orderEstimatedTime", (event: any) => {
       

        // Handle new event format with oldBaseEstimatedTime, newBaseEstimatedTime, etc.
        if (
          event.newBaseEstimatedTime !== undefined ||
          event.newEstimatedDeliveryTime !== undefined
        ) {
          const newBaseTime =
            event.newBaseEstimatedTime ?? event.newEstimatedDeliveryTime ?? baseEstimatedTime;
          const newDeliveryTime =
            event.newEstimatedDeliveryTime ?? event.newBaseEstimatedTime ?? estimatedDeliveryTime;
          const completionTime =
            event.estimated_completion_time || event.estimatedCompletionTime || null;


          setBaseEstimatedTime(newBaseTime);
          setEstimatedDeliveryTime(newDeliveryTime);
          if (completionTime) {
            setEstimatedCompletionTime(completionTime);
          }
        } else if (event.estimated_minutes !== undefined) {
          // Fallback to old format with estimated_minutes
          const newEstimatedTime = event.estimated_minutes;
          setBaseEstimatedTime(newEstimatedTime);
          setEstimatedDeliveryTime(newEstimatedTime);
          if (event.estimated_completion_time) {
            setEstimatedCompletionTime(event.estimated_completion_time);
          }
        }
      });

    } else {
      // Failed to create channel
    }

    return () => {
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
      case "pick up":
      case "pickup":
      case "pick-up":
        return "Έτοιμη προς παραλαβή";
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
        if (statusLower.includes("pick") && statusLower.includes("up")) {
          return "Έτοιμη προς παραλαβή";
        }
        // Return original if no match found
        return statusName;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("el-GR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatTime = (timeString: string) => {
    return timeString;
  };

  const formatCurrency = (value: string | number) => {
    const numValue = typeof value === "string" ? parseFloat(value) : value;
    return numValue.toFixed(2);
  };

  // Timer effect to calculate remaining time based on order_date and order_time
  useEffect(() => {
    if (!orderDetails?.order_date || !orderDetails?.order_time) {
      return;
    }

    // Stop timer if order is completed
    const statusLower = orderStatus?.statusName?.toLowerCase() || "";
    const isCompleted =
      statusLower.includes("complete") ||
      statusLower.includes("delivered") ||
      statusLower === "completed";

    if (isCompleted) {
      setTimeRemaining(0);
      return;
    }

    const calculateTimeRemaining = () => {
      try {
        const now = new Date();

        // If we have estimatedCompletionTime from pusher event, use it directly
        if (estimatedCompletionTime) {
          const completionTimestamp = new Date(estimatedCompletionTime);
          const remainingMs = completionTimestamp.getTime() - now.getTime();
          const remainingSeconds = Math.max(0, Math.floor(remainingMs / 1000));
          setTimeRemaining(remainingSeconds);
          return;
        }

        // Otherwise, calculate from order_date, order_time, and baseEstimatedTime
        // Form timestamp from order_date and order_time
        const datePart = orderDetails.order_date.split("T")[0];
        const timePart = orderDetails.order_time.split(".")[0];
        const timeParts = timePart.split(":");
        const hours = parseInt(timeParts[0] || "0", 10);
        const minutes = parseInt(timeParts[1] || "0", 10);
        const seconds = parseInt(timeParts[2] || "0", 10);

        const orderTimestamp = new Date(datePart);
        orderTimestamp.setHours(hours, minutes, seconds, 0);

        // Calculate estimated delivery datetime (order time + estimated delivery time in minutes)
        const estimatedDeliveryTimestamp = new Date(
          orderTimestamp.getTime() + baseEstimatedTime * 60 * 1000
        );

        // Compare estimated delivery timestamp with now() to get remaining time
        const remainingMs =
          estimatedDeliveryTimestamp.getTime() - now.getTime();
        const remainingSeconds = Math.max(0, Math.floor(remainingMs / 1000));

        setTimeRemaining(remainingSeconds);
      } catch (error) {
        setTimeRemaining(null);
      }
    };

    // Calculate immediately
    calculateTimeRemaining();

    // Update every second
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [
    orderDetails?.order_date,
    orderDetails?.order_time,
    baseEstimatedTime,
    estimatedCompletionTime,
    orderStatus?.statusName,
  ]);

  const formatTimeRemaining = (seconds: number) => {
    if (seconds <= 0) return "Έτοιμο";

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
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
          <Card className="bg-gray-900 border-gray-800 p-6 mb-6">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <Skeleton className="h-12 w-12 rounded-full" />
              </div>
              <Skeleton className="h-8 w-48 mx-auto mb-2" />
              <Skeleton className="h-4 w-64 mx-auto mb-6" />
              <Skeleton className="h-8 w-32 mx-auto rounded-full" />
              <div className="mt-6 pt-6 border-t border-gray-700">
                <Skeleton className="h-4 w-40 mx-auto mb-2" />
                <Skeleton className="h-12 w-32 mx-auto" />
              </div>
            </div>
          </Card>
        ) : orderStatus ? (
          <>
            <Card className="bg-gray-900 border-gray-800 p-6 mb-6">
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

                {/* Timer Display */}
                {timeRemaining !== null && orderDetails && (
                  <div className="mt-6 pt-6 border-t border-gray-700">
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-gray-400 text-sm">
                        {timeRemaining > 0
                          ? "Εκτιμώμενος χρόνος:"
                          : "Η παραγγελία σας είναι έτοιμη!"}
                      </span>
                      {timeRemaining > 0 && (
                        <div className="text-4xl font-bold text-[#ff9328ff] font-mono">
                          {formatTimeRemaining(timeRemaining)}
                        </div>
                      )}
                      {timeRemaining <= 0 && (
                        <div className="text-2xl font-bold text-green-500">
                          ✓
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Order Details */}
            {orderDetails && (
              <Card className="bg-gray-900 border-gray-800 p-6 mb-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Λεπτομέρειες Παραγγελίας
                </h3>

                {/* Order Info */}
                <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                  <div>
                    <span className="text-gray-400">Ημερομηνία:</span>
                    <p className="text-white">
                      {formatDate(orderDetails.order_date)}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-400">Ώρα:</span>
                    <p className="text-white">
                      {formatTime(orderDetails.order_time)}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-400">Εστιατόριο:</span>
                    <p className="text-white">{orderDetails.location_name}</p>
                  </div>
                </div>

                {/* Order Items */}
                {orderDetails.menu_items &&
                  orderDetails.menu_items.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-md font-semibold text-white mb-3">
                        Προϊόντα ({orderDetails.menu_items.length})
                      </h4>
                      <div className="space-y-3">
                        {orderDetails.menu_items.map((item, index) => (
                          <div
                            key={index}
                            className="bg-gray-800 rounded-lg p-4 border border-gray-700"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex-1">
                                <h5 className="text-white font-medium">
                                  {item.menu_name}
                                </h5>
                                {item.menu_comment && (
                                  <p className="text-gray-400 text-sm mt-1">
                                    Σχόλιο: {item.menu_comment}
                                  </p>
                                )}
                                {item.menu_options && (
                                  <p className="text-gray-400 text-sm mt-1">
                                    {item.menu_options}
                                  </p>
                                )}
                              </div>
                              <div className="text-right ml-4">
                                <p className="text-white font-medium">
                                  {item.menu_quantity}x
                                </p>
                                <p className="text-gray-400 text-sm">
                                  {formatCurrency(item.menu_subtotal)}{" "}
                                  {orderDetails.currency}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Order Totals */}
                {orderDetails.order_totals &&
                  orderDetails.order_totals.length > 0 && (
                    <div className="border-t border-gray-700 pt-4">
                      <div className="space-y-2">
                        {orderDetails.order_totals
                          .sort((a, b) => a.priority - b.priority)
                          .map((total, index) => (
                            <div
                              key={index}
                              className="flex justify-between items-center"
                            >
                              <span
                                className={
                                  total.title.toLowerCase().includes("total") &&
                                  !total.title
                                    .toLowerCase()
                                    .includes("subtotal")
                                    ? "text-white font-semibold"
                                    : "text-gray-300"
                                }
                              >
                                {total.title}
                              </span>
                              <span
                                className={
                                  total.title.toLowerCase().includes("total") &&
                                  !total.title
                                    .toLowerCase()
                                    .includes("subtotal")
                                    ? "text-white font-semibold text-lg"
                                    : "text-gray-300"
                                }
                              >
                                {formatCurrency(total.value)}{" "}
                                {orderDetails.currency}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
              </Card>
            )}
          </>
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
