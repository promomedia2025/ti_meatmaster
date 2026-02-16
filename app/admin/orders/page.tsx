"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AdminOrderDetailsModal } from "@/components/admin-order-details-modal";
import { Menu, X } from "lucide-react";
import Link from "next/link";

interface AdminOrder {
  order_id: number;
  order_date: string;
  order_time: string;
  order_total: string;
  currency: string;
  status_id: number;
  created_at: string;
  location_name: string;
  status_name: string;
  order_menus: any[];
  order_totals: any[];
  customer_name?: string;
  customer_id?: number;
  telephone?: string;
  email?: string;
  payment?: string;
  order_type?: string;
  order_type_name?: string;
  comment?: string;
  total_items?: number;
  address_id?: number | null;
}

export default function AdminOrdersPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const adminToken = localStorage.getItem("admin_token");
      if (!adminToken) {
        router.push("/admin/login");
        return;
      }
      setIsAuthenticated(true);
      setIsLoading(false);
    };
    checkAuth();
  }, [router]);

  // Track if a fetch is in progress to prevent duplicate requests (using ref to avoid dependency issues)
  const isFetchingRef = useRef(false);
  // Track fetch sequence number to ignore stale responses (prevents race conditions)
  const fetchSequenceRef = useRef(0);
  // Debounce timer for order created events (batch multiple orders into one fetch)
  const orderCreatedDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchOrders = useCallback(
    async (delay = 0) => {
      if (!isAuthenticated) return;

      // Increment sequence number for this fetch (allow multiple fetches, track latest)
      const currentSequence = ++fetchSequenceRef.current;
      console.log(
        `🔄 [AdminOrders] Starting fetch #${currentSequence} with delay ${delay}ms`
      );

      // Set loading state only if this is the first/latest fetch
      const isLatestFetch = currentSequence === fetchSequenceRef.current;
      if (isLatestFetch) {
        isFetchingRef.current = true;
        setOrdersLoading(true);
        setOrdersError(null);
      }

      // Add delay if specified (useful when waiting for backend to process new orders)
      if (delay > 0) {
        await new Promise((resolve) => setTimeout(resolve, delay));
        // Check if a newer fetch has started during the delay
        if (currentSequence !== fetchSequenceRef.current) {
          console.log(
            `⏸️ [AdminOrders] Fetch #${currentSequence} is stale (current: #${fetchSequenceRef.current}), skipping`
          );
          return;
        }
      }

      try {
        // Add cache-busting timestamp to ensure fresh data
        const response = await fetch(`/api/admin/orders?t=${Date.now()}`, {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        const result = await response.json();

        // Check if this fetch is still the latest (ignore stale responses)
        if (currentSequence !== fetchSequenceRef.current) {
          console.log(
            `⏸️ [AdminOrders] Ignoring stale response from fetch #${currentSequence} (current: #${fetchSequenceRef.current})`
          );
          return;
        }

        if (result.success && result.data) {
          const ordersArray = Array.isArray(result.data) ? result.data : [];

          // Debug: Check for duplicate order IDs (could cause React to skip rendering)
          const orderIds = ordersArray.map((o: AdminOrder) => o.order_id);
          const uniqueOrderIds = new Set(orderIds);
          if (orderIds.length !== uniqueOrderIds.size) {
            console.warn(
              `⚠️ [AdminOrders] Duplicate order IDs detected! Total: ${orderIds.length}, Unique: ${uniqueOrderIds.size}`
            );
            const duplicates = orderIds.filter(
              (id: number, index: number) => orderIds.indexOf(id) !== index
            );
            console.warn(`⚠️ [AdminOrders] Duplicate IDs:`, duplicates);
          }

          setOrders(ordersArray);
          console.log(
            `✅ [AdminOrders] Fetch #${currentSequence} completed: ${ordersArray.length} orders`
          );
          // Debug: Log all order IDs to see what we received
          console.log(
            `📋 [AdminOrders] Order IDs received:`,
            orderIds.join(", ")
          );
          // Debug: Log first few orders in detail
          if (ordersArray.length > 0) {
            console.log(
              `📋 [AdminOrders] First order:`,
              JSON.stringify(ordersArray[0], null, 2)
            );
            if (ordersArray.length > 1) {
              console.log(
                `📋 [AdminOrders] Second order:`,
                JSON.stringify(ordersArray[1], null, 2)
              );
            }
          }
        } else {
          setOrdersError(
            result.error ||
              "Failed to fetch orders - invalid response structure"
          );
        }
      } catch (error) {
        // Only log error if this is still the latest fetch
        if (currentSequence === fetchSequenceRef.current) {
          console.error("Error fetching orders:", error);
          setOrdersError("An error occurred while fetching orders");
        } else {
          console.log(
            `⏸️ [AdminOrders] Ignoring error from stale fetch #${currentSequence}`
          );
        }
      } finally {
        // Always reset loading state if this is the latest fetch
        if (currentSequence === fetchSequenceRef.current) {
          setOrdersLoading(false);
          isFetchingRef.current = false;
        } else {
          // If this is a stale fetch, we still need to check if we should reset the flag
          // This handles the case where a stale fetch completes after the latest one
          // We'll let the latest fetch handle the reset, but log for debugging
          console.log(
            `⏸️ [AdminOrders] Stale fetch #${currentSequence} completed, latest is #${fetchSequenceRef.current}`
          );
        }
      }
    },
    [isAuthenticated]
  );

  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders();
    }
  }, [isAuthenticated, fetchOrders]);

  // Listen for global order events to refresh data
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleOrderCreated = (event?: CustomEvent) => {
      const orderId = event?.detail?.order_id;
      console.log(
        `📦 [AdminOrders] Order created event received${
          orderId ? ` for order #${orderId}` : ""
        }, debouncing fetch...`
      );

      // Clear any existing debounce timer
      if (orderCreatedDebounceTimerRef.current) {
        clearTimeout(orderCreatedDebounceTimerRef.current);
        console.log(
          `⏱️ [AdminOrders] Previous debounce timer cleared, resetting...`
        );
      }

      // Set a new debounce timer - wait 2 seconds after the last order notification
      // This batches multiple orders that arrive quickly into a single fetch
      orderCreatedDebounceTimerRef.current = setTimeout(() => {
        console.log(
          `📦 [AdminOrders] Debounce period ended, fetching all new orders`
        );
        orderCreatedDebounceTimerRef.current = null;
        // Add delay to ensure backend has processed all orders
        // This prevents race conditions where the API is called before orders are fully committed
        fetchOrders(500);
      }, 2000);
    };

    const handleOrderUpdated = () => {
      console.log(
        "🔄 [AdminOrders] Order updated event received, refreshing orders"
      );
      fetchOrders(300);
    };

    const handleOrderStatusChanged = () => {
      console.log(
        "🔄 [AdminOrders] Order status changed event received, refreshing orders"
      );
      fetchOrders(300);
    };

    const handleOrderDeleted = () => {
      console.log(
        "🗑️ [AdminOrders] Order deleted event received, refreshing orders"
      );
      fetchOrders(300);
    };

    // Listen for custom events from global notification component
    window.addEventListener(
      "admin:order-created",
      handleOrderCreated as EventListener
    );
    window.addEventListener("admin:order-updated", handleOrderUpdated);
    window.addEventListener(
      "admin:order-status-changed",
      handleOrderStatusChanged
    );
    window.addEventListener("admin:order-deleted", handleOrderDeleted);

    return () => {
      // Clear debounce timer on cleanup
      if (orderCreatedDebounceTimerRef.current) {
        clearTimeout(orderCreatedDebounceTimerRef.current);
        orderCreatedDebounceTimerRef.current = null;
      }
      window.removeEventListener(
        "admin:order-created",
        handleOrderCreated as EventListener
      );
      window.removeEventListener("admin:order-updated", handleOrderUpdated);
      window.removeEventListener(
        "admin:order-status-changed",
        handleOrderStatusChanged
      );
      window.removeEventListener("admin:order-deleted", handleOrderDeleted);
    };
  }, [isAuthenticated, fetchOrders]);

  // Refresh orders when window regains focus (handles case when user was away)
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        console.log(
          "👁️ [AdminOrders] Window became visible, refreshing orders"
        );
        // Refresh when window regains focus to catch any missed updates
        fetchOrders(100);
      }
    };

    const handleFocus = () => {
      console.log("🎯 [AdminOrders] Window gained focus, refreshing orders");
      // Also refresh on focus event as a backup
      fetchOrders(100);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, [isAuthenticated, fetchOrders]);

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    // Clear remembered credentials on manual logout
    if (typeof window !== "undefined") {
      localStorage.removeItem("admin_remembered_credentials");
    }
    router.push("/admin/login");
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

  const openOrderModal = (order: AdminOrder) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedOrder(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1a1a1a]">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] flex">
      {/* Main Content */}
      <div className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-start mb-8">
            <div className="flex items-center gap-4">
              <h1 className="text-4xl font-bold text-white">Παραγγελίες</h1>
            </div>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="bg-[#2a2a2a] border-gray-600 text-white hover:bg-[#3a3a3a]"
            >
              Logout
            </Button>
          </div>

          {/* Orders Table */}
          <div className="bg-[#2a2a2a] rounded-lg overflow-hidden">
            {ordersLoading ? (
              <div className="p-8 text-center">
                <p className="text-gray-400">Φόρτωση παραγγελιών...</p>
              </div>
            ) : ordersError ? (
              <div className="p-8 text-center">
                <p className="text-red-400">{ordersError}</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-400">Δεν υπάρχουν παραγγελίες</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#1a1a1a] border-b border-gray-700">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                        ID Παραγγελίας
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                        Ημερομηνία
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                        Ώρα
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                        Κατάσταση
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                        Σύνολο
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order, index) => {
                      // Debug: Log each order being rendered
                      if (index < 3) {
                        console.log(
                          `🎨 [AdminOrders] Rendering order #${order.order_id} at index ${index}`
                        );
                      }
                      return (
                        <tr
                          key={order.order_id}
                          onClick={() => openOrderModal(order)}
                          className="border-b border-gray-700 hover:bg-[#3a3a3a] cursor-pointer transition-colors"
                        >
                          <td className="px-6 py-4 text-white font-medium">
                            #{order.order_id}
                          </td>
                          <td className="px-6 py-4 text-gray-300">
                            {formatDate(order.order_date)}
                          </td>
                          <td className="px-6 py-4 text-gray-300">
                            {formatTime(order.order_time)}
                          </td>
                          <td className="px-6 py-4">
                            <span className="bg-[#3D3D3D] text-[#FFFFF] px-3 py-1 rounded-full text-xs font-medium">
                              {order.status_name}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-white font-semibold">
                            {order.order_total} {order.currency}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Order Details Modal */}
      <AdminOrderDetailsModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        order={selectedOrder}
      />
    </div>
  );
}
