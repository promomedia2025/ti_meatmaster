"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AdminOrderDetailsModal } from "@/components/admin-order-details-modal";
import { usePusher } from "@/lib/pusher-context";
import { toast } from "sonner";
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
}

const PENDING_STATUS_ID = 2;

const ORDER_STATUS_OPTIONS = [
  { label: "Ελήφθη", value: "RECEIVED", statusId: 3 },
  { label: "Προετοιμασία", value: "PREPARATION", statusId: 4 },
  { label: "Παράδοση", value: "DELIVERY", statusId: 5 },
  { label: "Ολοκληρώθηκε", value: "COMPLETED", statusId: 6 },
  { label: "Ακυρώθηκε", value: "CANCELLED", statusId: 7 },
  { label: "Έτοιμη Προς Παραλαβή", value: "PICK_UP", statusId: 8 },
] as const;

type OrderStatusValue = (typeof ORDER_STATUS_OPTIONS)[number]["value"];

const toNumber = (value: unknown, fallback: number): number => {
  if (typeof value === "number" && !Number.isNaN(value)) {
    return value;
  }
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const normalizeOrderPayload = (payload: any): AdminOrder | null => {
  if (!payload) {
    return null;
  }

  const orderId = toNumber(payload.order_id ?? payload.orderId, 0);
  if (!orderId) {
    return null;
  }

  const statusId = toNumber(
    payload.status_id ?? payload.statusId,
    PENDING_STATUS_ID
  );

  return {
    order_id: orderId,
    order_date:
      payload.order_date ??
      payload.orderDate ??
      payload.created_at ??
      new Date().toISOString(),
    order_time:
      payload.order_time ??
      payload.orderTime ??
      new Date().toLocaleTimeString("el-GR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    order_total: `${payload.order_total ?? payload.orderTotal ?? "0"}`,
    currency: payload.currency || "EUR",
    status_id: statusId,
    created_at: payload.created_at ?? new Date().toISOString(),
    location_name:
      payload.location_name || payload.locationName || "Άγνωστη τοποθεσία",
    status_name:
      payload.status_name ||
      payload.statusName ||
      (statusId === PENDING_STATUS_ID ? "Εκκρεμεί" : "Ενημερώθηκε"),
    order_menus: payload.order_menus || payload.orderMenus || [],
    order_totals: payload.order_totals || payload.orderTotals || [],
    customer_name: payload.customer_name || payload.customerName,
    customer_id: payload.customer_id ?? payload.customerId,
    telephone: payload.telephone,
    email: payload.email,
    payment: payload.payment,
    order_type: payload.order_type || payload.orderType,
    order_type_name: payload.order_type_name || payload.orderTypeName,
    comment: payload.comment,
    total_items: payload.total_items ?? payload.totalItems,
  };
};

const normalizeStatusNameToValue = (
  statusName?: string
): OrderStatusValue | "" => {
  if (!statusName) {
    return "";
  }

  const key = statusName.toUpperCase().replace(/\s+/g, "_");
  const option = ORDER_STATUS_OPTIONS.find((item) => item.value === key);
  return option ? option.value : "";
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const { pusher, subscribe, unsubscribe, isConnected } = usePusher();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusSelections, setStatusSelections] = useState<
    Record<number, OrderStatusValue | "">
  >({});
  const selectedOrderRef = useRef<AdminOrder | null>(null);
  const [locationStatus, setLocationStatus] = useState<{
    is_open: boolean;
  } | null>(null);
  const [locationStatusLoading, setLocationStatusLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    selectedOrderRef.current = selectedOrder;
  }, [selectedOrder]);

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

  useEffect(() => {
    setStatusSelections((prev) => {
      const next = { ...prev };
      let hasChanges = false;

      orders.forEach((order) => {
        if (!next[order.order_id]) {
          const normalized = normalizeStatusNameToValue(order.status_name);
          if (normalized) {
            next[order.order_id] = normalized;
            hasChanges = true;
          }
        }
      });

      return hasChanges ? next : prev;
    });
  }, [orders]);

  const fetchOrders = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      setOrdersLoading(true);
      setOrdersError(null);
      console.log("🔍 Frontend - Fetching orders from /api/admin/orders");

      const response = await fetch("/api/admin/orders", {
        method: "GET",
        credentials: "include",
      });

      console.log("🔍 Frontend - Response status:", response.status);
      console.log("🔍 Frontend - Response ok:", response.ok);
      console.log(
        "🔍 Frontend - Response headers:",
        Object.fromEntries(response.headers.entries())
      );

      const result = await response.json();
      console.log("🔍 Frontend - Response data type:", typeof result);
      console.log("🔍 Frontend - Response keys:", Object.keys(result || {}));
      console.log(
        "🔍 Frontend - Full response:",
        JSON.stringify(result, null, 2)
      );
      console.log("🔍 Frontend - result.success:", result.success);
      console.log("🔍 Frontend - result.data:", result.data);
      console.log(
        "🔍 Frontend - result.data is array:",
        Array.isArray(result.data)
      );

      if (result.success && result.data) {
        const ordersArray = Array.isArray(result.data) ? result.data : [];
        console.log("✅ Frontend - Setting orders, count:", ordersArray.length);
        setOrders(ordersArray);
      } else {
        console.error("❌ Frontend - Invalid response structure");
        console.error("❌ result.success:", result.success);
        console.error("❌ result.data:", result.data);
        console.error("❌ result.error:", result.error);
        setOrdersError(
          result.error || "Failed to fetch orders - invalid response structure"
        );
      }
    } catch (error) {
      console.error("❌ Frontend - Error fetching orders:", error);
      if (error instanceof Error) {
        console.error("❌ Frontend - Error message:", error.message);
        console.error("❌ Frontend - Error stack:", error.stack);
      }
      setOrdersError("An error occurred while fetching orders");
    } finally {
      setOrdersLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const fetchLocationStatus = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      setLocationStatusLoading(true);
      const response = await fetch("/api/admin/location-status", {
        method: "GET",
        credentials: "include",
      });

      const result = await response.json();

      if (result.success && result.data?.status) {
        setLocationStatus({
          is_open: result.data.status.is_open,
        });
      }
    } catch (error) {
      console.error("Error fetching location status:", error);
    } finally {
      setLocationStatusLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchLocationStatus();
    }
  }, [isAuthenticated, fetchLocationStatus]);

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    router.push("/admin/login");
  };

  const handleOpenStore = async () => {
    // Optimistic update - update UI immediately
    const previousStatus = locationStatus;
    setLocationStatus({ is_open: true });

    try {
      const response = await fetch("/api/admin/toggle-schedule", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: 1,
          location_id: 13,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Κατάστημα ανοίχθηκε");
        // Refresh location status to ensure consistency
        await fetchLocationStatus();
      } else {
        // Rollback optimistic update on error
        if (previousStatus) {
          setLocationStatus(previousStatus);
        }
        toast.error(result.error || "Σφάλμα κατά την ενημέρωση");
      }
    } catch (error) {
      console.error("Error opening store:", error);
      // Rollback optimistic update on error
      if (previousStatus) {
        setLocationStatus(previousStatus);
      }
      toast.error("Σφάλμα κατά την ενημέρωση");
    }
  };

  const handleCloseStore = async () => {
    // Optimistic update - update UI immediately
    const previousStatus = locationStatus;
    setLocationStatus({ is_open: false });

    try {
      const response = await fetch("/api/admin/toggle-schedule", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: 0,
          location_id: 13,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Κατάστημα κλείστηκε");
        // Refresh location status to ensure consistency
        await fetchLocationStatus();
      } else {
        // Rollback optimistic update on error
        if (previousStatus) {
          setLocationStatus(previousStatus);
        }
        toast.error(result.error || "Σφάλμα κατά την ενημέρωση");
      }
    } catch (error) {
      console.error("Error closing store:", error);
      // Rollback optimistic update on error
      if (previousStatus) {
        setLocationStatus(previousStatus);
      }
      toast.error("Σφάλμα κατά την ενημέρωση");
    }
  };

  // Separate orders by status
  const pendingOrders = orders.filter((order) => order.status_id === 2);
  const otherOrders = orders.filter((order) => order.status_id !== 2);

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

  const openOrderModal = useCallback((order: AdminOrder) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  }, []);

  const handleOrderClick = (order: AdminOrder) => {
    openOrderModal(order);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedOrder(null);
  };

  const playNotificationSound = useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const AudioContextConstructor =
        window.AudioContext || (window as any).webkitAudioContext;

      if (!AudioContextConstructor) {
        console.warn("🔇 AudioContext not supported in this browser");
        return;
      }

      const audioContext = new AudioContextConstructor();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.type = "triangle";
      oscillator.frequency.setValueAtTime(880, audioContext.currentTime);

      gainNode.gain.setValueAtTime(0.0001, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.35,
        audioContext.currentTime + 0.02
      );
      gainNode.gain.exponentialRampToValueAtTime(
        0.0001,
        audioContext.currentTime + 0.6
      );

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.6);

      setTimeout(() => {
        audioContext.close();
      }, 750);
    } catch (error) {
      console.warn("🔇 Failed to play notification sound", error);
    }
  }, []);

  const showOrderCreatedToast = useCallback(
    (order: AdminOrder) => {
      toast.success("Νέα Παραγγελία", {
        description: `Παραγγελία #${order.order_id} από ${
          order.location_name || "άγνωστη τοποθεσία"
        }`,
        action: {
          label: "Προβολή",
          onClick: () => openOrderModal(order),
        },
        duration: 6000,
      });
    },
    [openOrderModal]
  );

  const handleStatusChange = (
    orderId: number,
    statusValue: OrderStatusValue,
    options?: { silent?: boolean }
  ) => {
    const statusOption = ORDER_STATUS_OPTIONS.find(
      (item) => item.value === statusValue
    );

    if (!statusOption) {
      console.warn("⚠️ Unknown status value selected:", statusValue);
      return;
    }

    // Store previous order state for rollback
    const previousOrder = orders.find((o) => o.order_id === orderId);

    // Optimistic update - update UI immediately
    setOrders((prev) =>
      prev.map((order) =>
        order.order_id === orderId
          ? {
              ...order,
              status_id: statusOption.statusId ?? order.status_id,
              status_name: statusOption.label,
            }
          : order
      )
    );

    setStatusSelections((prev) => ({
      ...prev,
      [orderId]: statusValue,
    }));

    // Send POST request to update order status via server-side API (avoids CORS)
    const updateOrderStatus = async () => {
      console.log("🔄 [CLIENT] handleStatusChange called:", {
        orderId,
        statusValue,
        statusOption: {
          label: statusOption.label,
          value: statusOption.value,
          statusId: statusOption.statusId,
        },
        options,
      });

      try {
        const requestPayload = {
          order_id: orderId,
          status_id: statusOption.statusId,
        };

        console.log("📤 [CLIENT] Preparing API request:", {
          url: "/api/admin/orders/update-status",
          method: "POST",
          payload: requestPayload,
        });

        const requestStartTime = Date.now();
        const response = await fetch("/api/admin/orders/update-status", {
          method: "POST",
          body: JSON.stringify(requestPayload),
        });

        const requestDuration = Date.now() - requestStartTime;
        console.log("📥 [CLIENT] API response received:", {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
          duration: `${requestDuration}ms`,
          headers: {
            contentType: response.headers.get("content-type"),
          },
        });

        if (!response.ok) {
          let errorData;
          try {
            errorData = await response.json();
            console.error("❌ [CLIENT] API request failed:", {
              status: response.status,
              statusText: response.statusText,
              errorData,
            });
          } catch (parseError) {
            const errorText = await response.text();
            console.error(
              "❌ [CLIENT] API request failed (non-JSON response):",
              {
                status: response.status,
                statusText: response.statusText,
                errorText: errorText.substring(0, 500),
              }
            );
            errorData = { error: errorText.substring(0, 200) };
          }
          throw new Error(
            errorData.error ||
              `API request failed with status: ${response.status}`
          );
        }

        const result = await response.json();
        console.log("✅ [CLIENT] Order status updated successfully:", {
          success: result.success,
          data: result.data,
          message: result.message,
          fullResponse: result,
        });

        if (!options?.silent) {
          toast.success("Ενημέρωση Κατάστασης", {
            description: `Παραγγελία #${orderId} ➜ ${statusOption.label}`,
          });
        }
      } catch (error) {
        console.error("❌ [CLIENT] Error updating order status:", {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          orderId,
          previousOrder: previousOrder
            ? {
                order_id: previousOrder.order_id,
                status_id: previousOrder.status_id,
                status_name: previousOrder.status_name,
              }
            : null,
        });

        // Rollback optimistic update on error
        if (previousOrder) {
          console.log("🔄 [CLIENT] Rolling back optimistic update:", {
            orderId,
            previousStatus: previousOrder.status_name,
          });
          setOrders((prev) =>
            prev.map((order) =>
              order.order_id === orderId ? previousOrder : order
            )
          );
        }
        toast.error("Σφάλμα κατά την ενημέρωση της κατάστασης");
      }
    };

    // Call the update function
    console.log("🚀 [CLIENT] Calling updateOrderStatus function");
    updateOrderStatus();
  };

  const handleAcceptOrder = async (orderId: number) => {
    try {
      console.log("📤 [CLIENT] Accepting order:", orderId);

      const response = await fetch("/api/admin/orders/accept", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          order_id: orderId,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Αποδοχή Παραγγελίας", {
          description: `Παραγγελία #${orderId} αποδέχθηκε`,
        });
        // Refresh orders to reflect the updated status
        fetchOrders();
      } else {
        toast.error("Σφάλμα", {
          description: result.error || "Αποτυχία αποδοχής παραγγελίας",
        });
      }
    } catch (error) {
      console.error("❌ [CLIENT] Error accepting order:", error);
      toast.error("Σφάλμα", {
        description: "Αποτυχία αποδοχής παραγγελίας",
      });
    }
  };

  const handleRejectOrder = async (orderId: number) => {
    try {
      console.log("📤 [CLIENT] Canceling order:", orderId);

      const response = await fetch("/api/admin/orders/cancel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          order_id: orderId,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.error("Απόρριψη Παραγγελίας", {
          description: `Παραγγελία #${orderId} απορρίφθηκε`,
        });
        // Refresh orders to reflect the updated status
        fetchOrders();
      } else {
        toast.error("Σφάλμα", {
          description: result.error || "Αποτυχία απόρριψης παραγγελίας",
        });
      }
    } catch (error) {
      console.error("❌ [CLIENT] Error canceling order:", error);
      toast.error("Σφάλμα", {
        description: "Αποτυχία απόρριψης παραγγελίας",
      });
    }
  };

  // Subscribe to admin.orders channel for real-time updates
  useEffect(() => {
    if (!isAuthenticated) {
      console.log("⚠️ Admin: Not authenticated, skipping Pusher subscription");
      return;
    }

    if (!isConnected) {
      console.log("⚠️ Admin: Pusher not connected yet, waiting...");
      return;
    }

    const channelName = "admin.orders";
    console.log(`📡 Admin: Attempting to subscribe to channel: ${channelName}`);
    console.log(
      `📡 Admin: Connection state - isConnected: ${isConnected}, isAuthenticated: ${isAuthenticated}`
    );

    const channel = subscribe(channelName);

    if (!channel) {
      console.error(`❌ Admin: Failed to create channel: ${channelName}`);
      return;
    }

    console.log(`✅ Admin: Channel object created for ${channelName}`);

    // Listen for successful subscription
    channel.bind("pusher:subscription_succeeded", () => {
      console.log(`✅✅✅ Admin: Successfully subscribed to ${channelName}`);
      console.log(
        `📊 Admin: Channel state - subscribed: ${channel.subscribed}`
      );
    });

    // Listen for subscription errors
    channel.bind("pusher:subscription_error", (error: any) => {
      console.error(`❌ Admin: Failed to subscribe to ${channelName}:`, error);
      console.error(`❌ Admin: Error details:`, JSON.stringify(error, null, 2));
    });

    const handleOrderCreated = (data: any) => {
      console.log("📦📦📦 Admin: [order.created] Event received!");
      console.log("📦 Admin: Full event data:", JSON.stringify(data, null, 2));
      console.log("📦 Admin: Event timestamp:", new Date().toISOString());

      const order = data.order || data;

      if (!order || !order.order_id) {
        console.warn(
          "⚠️ Admin: [order.created] event received but no order data found"
        );
        console.warn("⚠️ Admin: Data structure:", Object.keys(data || {}));
        return;
      }

      console.log("📦 Admin: Order data:", {
        order_id: order.order_id,
        status_id: order.status_id,
        order_total: order.order_total,
        location_name: order.location_name,
      });

      // Refetch orders from API to get complete, up-to-date data
      fetchOrders();

      // Play sound and show toast with order info from event
      playNotificationSound();
      showOrderCreatedToast(order);
    };

    const orderCreatedEvents = ["order.created", "orderCreated"];
    orderCreatedEvents.forEach((eventName) =>
      channel.bind(eventName, handleOrderCreated)
    );

    const handleOrderUpdated = (data: any) => {
      console.log("🔄🔄🔄 Admin: [order.updated] Event received!");
      console.log("🔄 Admin: Full event data:", JSON.stringify(data, null, 2));
      console.log("🔄 Admin: Event timestamp:", new Date().toISOString());

      const order = data.order || data;

      if (!order || !order.order_id) {
        console.warn(
          "⚠️ Admin: [order.updated] event received but no order data found"
        );
        console.warn("⚠️ Admin: Data structure:", Object.keys(data || {}));
        return;
      }

      console.log("🔄 Admin: Updating order #" + order.order_id);
      console.log("🔄 Admin: Order update details:", {
        order_id: order.order_id,
        status_id: order.status_id,
        status_name: order.status_name,
      });

      // Refetch orders from API to get complete, up-to-date data
      fetchOrders();
    };

    channel.bind("order.updated", handleOrderUpdated);

    const handleOrderStatusChanged = (data: any) => {
      console.log("🔄📊🔄 Admin: [order.status.changed] Event received!");
      console.log("🔄 Admin: Full event data:", JSON.stringify(data, null, 2));
      console.log("🔄 Admin: Event timestamp:", new Date().toISOString());

      if (!data.order_id) {
        console.warn(
          "⚠️ Admin: [order.status.changed] event received but missing order_id"
        );
        console.warn("⚠️ Admin: Data structure:", Object.keys(data || {}));
        return;
      }

      console.log("🔄 Admin: Changing status for order #" + data.order_id);
      console.log("🔄 Admin: Status change:", {
        order_id: data.order_id,
        new_status_id: data.status_id,
        new_status_name: data.status_name,
      });

      // Refetch orders from API to get complete, up-to-date data
      fetchOrders();
    };

    channel.bind("order.status.changed", handleOrderStatusChanged);

    const handleOrderDeleted = (data: any) => {
      console.log("🗑️🗑️🗑️ Admin: [order.deleted] Event received!");
      console.log("🗑️ Admin: Full event data:", JSON.stringify(data, null, 2));
      console.log("🗑️ Admin: Event timestamp:", new Date().toISOString());

      if (data.order_id) {
        console.log("🗑️ Admin: Deleting order #" + data.order_id);

        setOrders((prev) => {
          const beforeCount = prev.length;
          const filtered = prev.filter(
            (order) => order.order_id !== data.order_id
          );
          console.log(
            `📊 Admin: Orders before: ${beforeCount}, after: ${filtered.length}`
          );
          console.log(`✅ Admin: Order #${data.order_id} removed from list`);
          return filtered;
        });

        const currentSelectedOrder = selectedOrderRef.current;
        if (
          currentSelectedOrder &&
          currentSelectedOrder.order_id === data.order_id
        ) {
          console.log("🗑️ Admin: Closing modal for deleted order");
          setIsModalOpen(false);
          setSelectedOrder(null);
        }
      } else {
        console.warn(
          "⚠️ Admin: [order.deleted] event received but no order_id found"
        );
        console.warn("⚠️ Admin: Data structure:", Object.keys(data || {}));
      }
    };

    channel.bind("order.deleted", handleOrderDeleted);

    console.log(`🔗 Admin: Channel ${channelName} binding complete`);
    console.log(
      `🔗 Admin: Listening for events: order.created, order.updated, order.status.changed, order.deleted`
    );

    return () => {
      console.log(`🔌 Admin: Unsubscribing from ${channelName}`);
      console.log(`🔌 Admin: Cleaning up event listeners`);

      orderCreatedEvents.forEach((eventName) =>
        channel.unbind(eventName, handleOrderCreated)
      );
      channel.unbind("order.updated", handleOrderUpdated);
      channel.unbind("order.status.changed", handleOrderStatusChanged);
      channel.unbind("order.deleted", handleOrderDeleted);

      unsubscribe(channelName);
    };
  }, [
    isAuthenticated,
    isConnected,
    subscribe,
    unsubscribe,
    fetchOrders,
    playNotificationSound,
    showOrderCreatedToast,
  ]);

  const OrderCard = ({
    order,
    actions,
    statusControl,
  }: {
    order: AdminOrder;
    actions?: React.ReactNode;
    statusControl?: React.ReactNode;
  }) => (
    <div
      onClick={() => handleOrderClick(order)}
      className="bg-[#1a1a1a] rounded-lg p-4 border border-gray-700 hover:border-gray-600 hover:border-[#009DE0] transition-colors cursor-pointer"
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-white font-semibold text-lg">
            Παραγγελία #{order.order_id}
          </h3>
          <p className="text-gray-400 text-sm">{order.location_name}</p>
        </div>
        <span className="bg-[#009DE0]/20 text-[#009DE0] px-3 py-1 rounded-full text-xs font-medium">
          {order.status_name}
        </span>
      </div>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between text-gray-300">
          <span>Ημερομηνία:</span>
          <span>{formatDate(order.order_date)}</span>
        </div>
        <div className="flex justify-between text-gray-300">
          <span>Ώρα:</span>
          <span>{formatTime(order.order_time)}</span>
        </div>
        <div className="flex justify-between text-white font-semibold pt-2 border-t border-gray-700">
          <span>Σύνολο:</span>
          <span>
            {order.order_total} {order.currency}
          </span>
        </div>
      </div>
      {actions && (
        <div
          className="mt-4 flex flex-wrap gap-3"
          onClick={(event) => event.stopPropagation()}
        >
          {actions}
        </div>
      )}
      {statusControl && (
        <div className="mt-4" onClick={(event) => event.stopPropagation()}>
          {statusControl}
        </div>
      )}
    </div>
  );

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
      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 h-full bg-[#2a2a2a] border-r border-gray-700 z-50 transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } w-64`}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <h2 className="text-xl font-bold text-white">Admin Menu</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(false)}
              className="text-white hover:bg-[#3a3a3a]"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Sidebar Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            <Link
              href="/admin/orders"
              onClick={() => setIsSidebarOpen(false)}
              className="block w-full text-left px-4 py-3 rounded-lg text-white hover:bg-[#3a3a3a] transition-colors"
            >
              Παραγγελιες
            </Link>
            <Link
              href="/admin/menu"
              onClick={() => setIsSidebarOpen(false)}
              className="block w-full text-left px-4 py-3 rounded-lg text-white hover:bg-[#3a3a3a] transition-colors"
            >
              Menu
            </Link>
            <button
              onClick={() => {
                setIsSidebarOpen(false);
                // Handle Order History navigation
              }}
              className="w-full text-left px-4 py-3 rounded-lg text-white hover:bg-[#3a3a3a] transition-colors"
            >
              Ιστορικο παραγγελιων
            </button>
            <Link
              href="/admin/intervals"
              onClick={() => setIsSidebarOpen(false)}
              className="block w-full text-left px-4 py-3 rounded-lg text-white hover:bg-[#3a3a3a] transition-colors"
            >
              Χρονος παραγγελιας
            </Link>
          </nav>
        </div>
      </div>

      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-start mb-8">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSidebarOpen(true)}
                className="text-white hover:bg-[#2a2a2a]"
              >
                <Menu className="w-6 h-6" />
              </Button>
              <h1 className="text-4xl font-bold text-white">
                Welcome to the dashboard page
              </h1>
            </div>
            <div className="flex flex-col gap-2 items-end">
              <Button
                onClick={handleLogout}
                variant="outline"
                className="bg-[#2a2a2a] border-gray-600 text-white hover:bg-[#3a3a3a]"
              >
                Logout
              </Button>
              <div className="flex gap-2">
                <Button
                  onClick={handleOpenStore}
                  className={`${
                    locationStatus?.is_open === true
                      ? "bg-green-600 hover:bg-green-700 text-white ring-2 ring-green-400 ring-offset-2 ring-offset-[#1a1a1a] shadow-lg shadow-green-500/50"
                      : "bg-green-600/50 hover:bg-green-700/70 text-white/70"
                  }`}
                  disabled={locationStatusLoading}
                >
                  Ανοικτό
                </Button>
                <Button
                  onClick={handleCloseStore}
                  className={`${
                    locationStatus?.is_open === false
                      ? "bg-red-600 hover:bg-red-700 text-white ring-2 ring-red-400 ring-offset-2 ring-offset-[#1a1a1a] shadow-lg shadow-red-500/50"
                      : "bg-red-600/50 hover:bg-red-700/70 text-white/70"
                  }`}
                  disabled={locationStatusLoading}
                >
                  Κλειστό
                </Button>
              </div>
            </div>
          </div>

          {/* Live Orders Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-6">
              Ζωντανές Παραγγελίες
            </h2>

            {ordersLoading ? (
              <div className="bg-[#2a2a2a] rounded-lg p-8 text-center">
                <p className="text-gray-400">Φόρτωση παραγγελιών...</p>
              </div>
            ) : ordersError ? (
              <div className="bg-[#2a2a2a] rounded-lg p-8 text-center">
                <p className="text-red-400">{ordersError}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pending Orders Column */}
                <div>
                  <div className="bg-[#2a2a2a] rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-semibold text-white">
                        Εκκρεμείς Παραγγελίες
                      </h3>
                      <span className="bg-[#009DE0] text-white px-3 py-1 rounded-full text-sm font-medium">
                        {pendingOrders.length}
                      </span>
                    </div>
                    <div className="space-y-4 max-h-[600px] overflow-y-auto admin-scrollbar">
                      {pendingOrders.length === 0 ? (
                        <p className="text-gray-400 text-center py-8">
                          Δεν υπάρχουν εκκρεμείς παραγγελίες
                        </p>
                      ) : (
                        pendingOrders.map((order) => (
                          <OrderCard
                            key={order.order_id}
                            order={order}
                            actions={
                              <>
                                <Button
                                  size="sm"
                                  className="bg-[#009DE0] hover:bg-[#0082b8] text-white"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    handleAcceptOrder(order.order_id);
                                  }}
                                >
                                  Αποδοχή
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    handleRejectOrder(order.order_id);
                                  }}
                                >
                                  Απόρριψη
                                </Button>
                              </>
                            }
                          />
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Other Orders Column */}
                <div>
                  <div className="bg-[#2a2a2a] rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-semibold text-white">
                        Άλλες Παραγγελίες
                      </h3>
                      <span className="bg-gray-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                        {otherOrders.length}
                      </span>
                    </div>
                    <div className="space-y-4 max-h-[600px] overflow-y-auto admin-scrollbar">
                      {otherOrders.length === 0 ? (
                        <p className="text-gray-400 text-center py-8">
                          Δεν υπάρχουν άλλες παραγγελίες
                        </p>
                      ) : (
                        otherOrders.map((order) => (
                          <OrderCard
                            key={order.order_id}
                            order={order}
                            statusControl={
                              <div className="flex flex-col gap-2">
                                <label className="text-xs font-medium text-gray-400">
                                  Ενημέρωση Κατάστασης
                                </label>
                                <select
                                  className="bg-[#0f0f0f] border border-gray-700 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#009DE0]"
                                  value={statusSelections[order.order_id] || ""}
                                  onChange={(event) => {
                                    event.stopPropagation();
                                    const value = event.target.value as
                                      | OrderStatusValue
                                      | "";
                                    if (!value) {
                                      return;
                                    }
                                    handleStatusChange(order.order_id, value);
                                  }}
                                >
                                  <option value="">Επιλέξτε κατάσταση</option>
                                  {ORDER_STATUS_OPTIONS.map((option) => (
                                    <option
                                      key={option.value}
                                      value={option.value}
                                    >
                                      {option.label}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            }
                          />
                        ))
                      )}
                    </div>
                  </div>
                </div>
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
