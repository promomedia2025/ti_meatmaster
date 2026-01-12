"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { usePusher } from "@/lib/pusher-context";
import { Package, Clock, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Order {
  order_id: number;
  order_date: string;
  order_time: string;
  order_total: string;
  currency: string;
  status_id: number;
  created_at: string;
  location_name: string;
  status_name: string;
}

interface ActiveOrdersDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ActiveOrdersDropdown({
  isOpen,
  onClose,
}: ActiveOrdersDropdownProps) {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { subscribe, unsubscribe, isConnected } = usePusher();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const subscribedChannelsRef = useRef<Set<string>>(new Set());

  // Fetch active orders when dropdown opens
  useEffect(() => {
    if (isOpen && isAuthenticated && user?.id) {
      fetchActiveOrders();
    }
  }, [isOpen, isAuthenticated, user?.id]);

  // Subscribe to Pusher channels for order updates
  useEffect(() => {
    if (!isConnected || !isOpen || orders.length === 0) {
      return;
    }

    console.log(
      "🔍 Active Orders Dropdown - Setting up Pusher subscriptions for orders:",
      orders.map((o) => o.order_id)
    );

    // Subscribe to each order's channel
    orders.forEach((order) => {
      const channelName = `order.${order.order_id}`;

      if (!subscribedChannelsRef.current.has(channelName)) {
        console.log(`📡 Subscribing to channel: ${channelName}`);
        const channel = subscribe(channelName);

        if (channel) {
          subscribedChannelsRef.current.add(channelName);

          // Listen for order status updates
          channel.bind("orderStatusUpdated", (data: any) => {
            console.log(
              `📦 Order ${order.order_id} status updated in dropdown:`,
              data
            );

            const newStatus = data.status_name || data.statusName;
            console.log(
              `🔍 Order ${order.order_id} status update: "${newStatus}"`
            );

            const isOrderCompleted =
              newStatus && ["Completed", "Canceled"].includes(newStatus);

            console.log(
              `🔍 Is order ${order.order_id} completed? ${isOrderCompleted}`
            );

            if (isOrderCompleted) {
              // Remove the order from dropdown if it's completed/cancelled
              setOrders((prevOrders) =>
                prevOrders.filter(
                  (prevOrder) => prevOrder.order_id !== order.order_id
                )
              );
              console.log(
                `🗑️ Order ${order.order_id} removed from dropdown (status: ${newStatus})`
              );
            } else {
              // Update the order status if it's still active
              setOrders((prevOrders) =>
                prevOrders.map((prevOrder) =>
                  prevOrder.order_id === order.order_id
                    ? {
                        ...prevOrder,
                        status_id: data.status_id || prevOrder.status_id,
                        status_name: newStatus || prevOrder.status_name,
                      }
                    : prevOrder
                )
              );
            }
          });
        }
      }
    });

    // Cleanup function
    return () => {
      console.log(
        "🔌 Active Orders Dropdown - Cleaning up Pusher subscriptions"
      );
      subscribedChannelsRef.current.forEach((channelName) => {
        unsubscribe(channelName);
      });
      subscribedChannelsRef.current.clear();
    };
  }, [isConnected, isOpen, orders, subscribe, unsubscribe]);

  const fetchActiveOrders = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Add cache-busting to ensure fresh data
      const response = await fetch(
        `/api/orders?user_id=${user?.id}&_t=${Date.now()}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        }
      );
      const data = await response.json();

      if (data.success && data.data && Array.isArray(data.data)) {
        // Filter to show only active orders (exclude completed and cancelled)
        console.log(
          "🔍 All orders from API:",
          data.data.map((o) => ({ id: o.order_id, status: o.status_name }))
        );

        const activeOrders = data.data.filter((order: Order) => {
          const originalStatus = order.status_name;
          const status = order.status_name?.toLowerCase();

          console.log(`🔍 Order ${order.order_id}:`, {
            originalStatus: `"${originalStatus}"`,
            lowercasedStatus: `"${status}"`,
            statusLength: originalStatus?.length,
            hasSpaces: originalStatus?.includes(" "),
            trimmedStatus: `"${originalStatus?.trim()}"`,
          });

          const isActive =
            status !== "completed" &&
            status !== "canceled" &&
            status !== "received" &&
            status !== "delivered";

          console.log(`🔍 Order ${order.order_id} filtering check:`, {
            isCompleted: status === "completed",
            isCancelled: status === "cancelled",
            isReceived: status === "received",
            isDelivered: status === "delivered",
            finalResult: isActive ? "✅ KEEP" : "🚫 FILTER OUT",
          });

          if (!isActive) {
            console.log(
              `🚫 Filtering out order ${order.order_id} with status: "${order.status_name}"`
            );
          } else {
            console.log(
              `✅ Keeping order ${order.order_id} with status: "${order.status_name}"`
            );
          }

          return isActive;
        });

        console.log(
          "✅ Active orders after filtering:",
          activeOrders.map((o) => ({ id: o.order_id, status: o.status_name }))
        );
        setOrders(activeOrders);
      } else {
        setOrders([]);
        setError(data.message || "Failed to load orders");
      }
    } catch (err) {
      console.error("Error fetching active orders:", err);
      setError("Failed to load orders");
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (statusName: string) => {
    switch (statusName.toLowerCase()) {
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case "delivery":
        return <Package className="w-4 h-4 text-blue-500" />;
      case "received":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "canceled":
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (statusName: string) => {
    switch (statusName.toLowerCase()) {
      case "pending":
        return "text-yellow-500";
      case "delivery":
        return "text-blue-500";
      case "received":
        return "text-green-500";
      case "canceled":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  };

  const formatDate = (orderDate: string, orderTime: string) => {
    try {
      const date = new Date(`${orderDate}T${orderTime}`);
      return date.toLocaleDateString("el-GR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return `${orderDate} ${orderTime}`;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="absolute top-full right-0 mt-2 w-80 bg-gray-900 border border-gray-800 rounded-lg shadow-xl z-[70]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <Package className="w-5 h-5 text-blue-500" />
          <h3 className="text-white font-semibold">Παραγγελίες</h3>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors"
        >
          ×
        </button>
      </div>

      {/* Content */}
      <div className="max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="space-y-3 py-4">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="bg-gray-800 rounded-lg p-4 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-4 text-center">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-4 text-center">
            <Package className="w-8 h-8 text-gray-600 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">Δεν υπάρχουν παραγγελίες</p>
          </div>
        ) : (
          <div className="p-2">
            {orders.map((order) => (
              <div
                key={order.order_id}
                className="p-3 hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
                onClick={() => {
                  router.push(`/order/${order.order_id}`);
                  onClose();
                }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="text-white font-medium text-sm">
                      {order.location_name}
                    </h4>
                    <p className="text-gray-400 text-xs">
                      #{order.order_id} •{" "}
                      {formatDate(order.order_date, order.order_time)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-semibold text-sm">
                      {parseFloat(order.order_total).toFixed(2)}{" "}
                      {order.currency}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(order.status_name)}
                  <span
                    className={`text-xs font-medium ${getStatusColor(
                      order.status_name
                    )}`}
                  >
                    {order.status_name}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {orders.length > 0 && (
        <div className="p-3 border-t border-gray-800">
          <button
            onClick={() => {
              router.push("/order-history");
              onClose();
            }}
            className="w-full text-center text-blue-500 hover:text-blue-400 text-sm font-medium transition-colors"
          >
            Προβολή όλων των παραγγελιών
          </button>
        </div>
      )}
    </div>
  );
}
