"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AdminOrderDetailsModal } from "@/components/admin-order-details-modal";
import { AdminDeliveryTimeModal } from "@/components/admin-delivery-time-modal";
import { usePusher } from "@/lib/pusher-context";
import { toast } from "sonner";
import { Menu, X, Play } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { playNotificationSound } from "@/lib/electron-utils";

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
  bell_name?: string | null;
  floor?: string | null;
}

const PENDING_STATUS_ID = 2;

const ORDER_STATUS_OPTIONS = [
  { label: "Ελήφθη", value: "RECEIVED", statusId: 1 },
  { label: "Προετοιμασία", value: "PREPARATION", statusId: 3 },
  { label: "Προς παράδοση", value: "DELIVERY", statusId: 4 },
  { label: "Ολοκληρώθηκε", value: "COMPLETED", statusId: 5 },
  { label: "Ακυρώθηκε", value: "CANCELLED", statusId: 9 },
  { label: "Έτοιμη προς παραλαβή", value: "PICK_UP", statusId: 10 },
] as const;

type OrderStatusValue = (typeof ORDER_STATUS_OPTIONS)[number]["value"];

// Helper functions to control which status actions are visible per order type
const isDeliveryOrder = (order: AdminOrder): boolean => {
  const type = (order.order_type || order.order_type_name || "")
    .toString()
    .toLowerCase();
  return (
    type.includes("delivery") ||
    type.includes("διανομή") ||
    type.includes("courier")
  );
};

const isPickupOrder = (order: AdminOrder): boolean => {
  const type = (order.order_type || order.order_type_name || "")
    .toString()
    .toLowerCase();
  return (
    type === "collection" ||
    type.includes("pick") ||
    type.includes("παραλαβ") ||
    type.includes("take away") ||
    type.includes("takeaway")
  );
};

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
  const [removingOrders, setRemovingOrders] = useState<Set<number>>(new Set());
  const selectedOrderRef = useRef<AdminOrder | null>(null);
  const [locationStatus, setLocationStatus] = useState<{
    is_open: boolean;
  } | null>(null);
  const [locationStatusLoading, setLocationStatusLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [autoPrintOrderId, setAutoPrintOrderId] = useState<number | null>(null);
  const [isDeliveryTimeModalOpen, setIsDeliveryTimeModalOpen] = useState(false);
  const [deliveryTimeModalOrderId, setDeliveryTimeModalOrderId] = useState<
    number | null
  >(null);
  const orderChannelsRef = useRef<Map<number, any>>(new Map());
  // Debounce timer for order created events (batch multiple orders into one fetch)
  const orderCreatedDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    selectedOrderRef.current = selectedOrder;
  }, [selectedOrder]);

  // Log session cookie expiration info
  useEffect(() => {
    const getCookieExpiration = (cookieName: string) => {
      const cookies = document.cookie.split(";");
      for (let cookie of cookies) {
        const [name, value] = cookie.trim().split("=");
        if (name === cookieName) {
          // Get all cookie attributes from the browser
          // Note: We can't directly read Max-Age or Expires from document.cookie
          // But we can check if it's a session cookie (no expiration)
          return value;
        }
      }
      return null;
    };

    // Check for common session cookie names
    const sessionCookieNames = [
      "tastyigniter_session",
      "session",
      "laravel_session",
    ];

    for (const cookieName of sessionCookieNames) {
      const cookieValue = getCookieExpiration(cookieName);
      if (cookieValue) {
        console.log(`🍪 Found session cookie: ${cookieName}`);
        console.log(
          `💡 To see expiration: Open Dev Tools → Application → Cookies → Check "Expires / Max-Age" column`
        );
        console.log(
          `💡 If it says "Session", it expires when browser closes. If it shows a date, that's when it expires.`
        );
        break;
      }
    }
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      const adminToken = localStorage.getItem("admin_token");
      if (!adminToken) {
        router.replace("/admin/login");
        return;
      }

      // Use get-menu-categories endpoint as token check
      try {
        const response = await fetch("/api/admin/get-menu-categories", {
          method: "GET",
          credentials: "include",
        });

        // If 500 or 401/403, redirect to login
        if (
          response.status === 500 ||
          response.status === 401 ||
          response.status === 403
        ) {
          console.error("Token check failed - redirecting to login");
          localStorage.removeItem("admin_token");
          router.replace("/admin/login");
          return;
        }

        // If request succeeded, token is valid
        if (response.ok) {
          setIsAuthenticated(true);
          setIsLoading(false);
        } else {
          // Other errors - redirect to login
          console.error("Token check failed with status:", response.status);
          localStorage.removeItem("admin_token");
          router.replace("/admin/login");
        }
      } catch (error) {
        console.error("Error checking token:", error);
        localStorage.removeItem("admin_token");
        router.replace("/admin/login");
      }
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

  const fetchOrders = useCallback(
    async (delay = 500) => {
      if (!isAuthenticated) return;

      // Add delay if specified (useful when waiting for backend to process new orders)
      if (delay > 0) {
        console.log(
          `⏳ Frontend - Waiting ${delay}ms before fetching orders...`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }

      try {
        setOrdersLoading(true);
        setOrdersError(null);
        console.log("🔍 Frontend - Fetching orders from /api/admin/orders");

        const response = await fetch("/api/admin/orders", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
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
          // Sort orders by order_id descending (newest first) to ensure latest orders appear first
          const sortedOrders = [...ordersArray].sort((a, b) => {
            const aId = a.order_id || 0;
            const bId = b.order_id || 0;
            return bId - aId; // Descending order (newest first)
          });
          console.log(
            "✅ Frontend - Setting orders, count:",
            sortedOrders.length
          );
          console.log(
            "📊 Frontend - Order IDs (first 10):",
            sortedOrders
              .slice(0, 10)
              .map((o) => o.order_id)
              .join(", ")
          );
          console.log(
            "📊 Frontend - Pending orders (first 5):",
            sortedOrders
              .filter((o) => o.status_id === 2)
              .slice(0, 5)
              .map((o) => o.order_id)
              .join(", ")
          );
          setOrders(sortedOrders);
        } else {
          console.error("❌ Frontend - Invalid response structure");
          console.error("❌ result.success:", result.success);
          console.error("❌ result.data:", result.data);
          console.error("❌ result.error:", result.error);
          setOrdersError(
            result.error ||
              "Failed to fetch orders - invalid response structure"
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
    },
    [isAuthenticated]
  );

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

  // Separate orders by status and sort by order_id descending (newest first)
  const pendingOrders = orders
    .filter((order) => order.status_id === 2)
    .sort((a, b) => (b.order_id || 0) - (a.order_id || 0));
  const otherOrders = orders
    .filter((order) => {
      // Keep orders that are animating out
      if (removingOrders.has(order.order_id)) {
        return true;
      }
      // Filter out pending orders (status_id === 2)
      if (order.status_id === 2) return false;
      // Filter out cancelled orders (status_id === 9 or status_name contains "Ακυρώθηκε" or "cancelled")
      if (order.status_id === 9) return false;
      const statusLower = order.status_name?.toLowerCase() || "";
      if (
        statusLower.includes("ακυρώθηκε") ||
        statusLower.includes("cancelled") ||
        statusLower.includes("canceled")
      ) {
        return false;
      }
      // Filter out completed orders (status_id === 5 or status_name contains "Ολοκληρώθηκε" or "completed")
      if (order.status_id === 5) return false;
      if (
        statusLower.includes("ολοκληρώθηκε") ||
        statusLower.includes("completed")
      ) {
        return false;
      }
      return true;
    })
    .sort((a, b) => (b.order_id || 0) - (a.order_id || 0));

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

  const formatLocationName = (locationName: string) => {
    if (!locationName) return locationName;
    // Remove duplicate commas (replace multiple commas with single comma)
    const cleaned = locationName.replace(/,+/g, ",");
    // Split into array
    const parts = cleaned
      .split(",")
      .map((part) => part.trim())
      .filter((part) => part);
    // Remove last 2 indices
    if (parts.length > 2) {
      parts.splice(-2);
    }
    // Join back to string
    return parts.join(", ");
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
    setAutoPrintOrderId(null); // Reset auto-print flag when closing
  };

  const showOrderCreatedToast = useCallback(
    (order: AdminOrder) => {
      toast.success("Νέα Παραγγελία", {
        description: `Παραγγελία #${order.order_id} από ${
          formatLocationName(order.location_name) || "άγνωστη τοποθεσία"
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

    // If status is COMPLETED or CANCELLED, trigger removal animation
    if (statusValue === "COMPLETED" || statusValue === "CANCELLED") {
      setRemovingOrders((prev) => new Set(prev).add(orderId));
      // Remove from list after animation completes (500ms)
      setTimeout(() => {
        setOrders((prev) => prev.filter((order) => order.order_id !== orderId));
        setRemovingOrders((prev) => {
          const next = new Set(prev);
          next.delete(orderId);
          return next;
        });
      }, 500);
    }

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

        // Open delivery time modal
        setDeliveryTimeModalOrderId(orderId);
        setIsDeliveryTimeModalOpen(true);

        // Find the order and open modal with auto-print
        const acceptedOrder = orders.find((o) => o.order_id === orderId);
        if (acceptedOrder) {
          setSelectedOrder(acceptedOrder);
          setIsModalOpen(true);
          setAutoPrintOrderId(orderId); // Trigger auto-print
        }

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

  const handleUpdateDeliveryTime = async (
    orderId: number,
    estimatedTime: number
  ) => {
    try {
      console.log("🕐 [ADMIN] handleUpdateDeliveryTime called:", {
        orderId,
        estimatedTime,
        pusherConnected: !!pusher && isConnected,
      });

      if (!pusher || !isConnected) {
        console.error("❌ [ADMIN] Pusher not connected");
        toast.error("Σφάλμα", {
          description: "Δεν είστε συνδεδεμένοι. Παρακαλώ δοκιμάστε ξανά.",
        });
        return;
      }

      // Get or create subscription to the order channel
      const channelName = `order.${orderId}`;
      console.log(`📡 [ADMIN] Getting channel: ${channelName}`);

      let channel = orderChannelsRef.current.get(orderId);
      console.log(`📡 [ADMIN] Cached channel exists: ${!!channel}`);

      if (!channel) {
        console.log(`📡 [ADMIN] Subscribing to new channel: ${channelName}`);
        channel = subscribe(channelName);
        if (channel) {
          orderChannelsRef.current.set(orderId, channel);
          console.log(
            `✅ [ADMIN] Channel subscribed and cached: ${channelName}`
          );
        } else {
          console.error(
            `❌ [ADMIN] Failed to subscribe to channel: ${channelName}`
          );
        }
      }

      if (!channel) {
        toast.error("Σφάλμα", {
          description: "Αποτυχία συνδέσης με το κανάλι παραγγελίας",
        });
        return;
      }

      const eventData = {
        order_id: orderId,
        estimated_delivery_time: estimatedTime,
      };

      console.log(`📤 [ADMIN] Triggering client event on ${channelName}:`, {
        eventName: "client-delivery-time-updated",
        data: eventData,
        channelSubscribed: channel.subscribed,
      });

      // Trigger client event to broadcast delivery time update
      channel.trigger("client-delivery-time-updated", eventData);

      console.log(
        `✅ [ADMIN] Client event triggered successfully on ${channelName}`
      );

      toast.success("Ενημέρωση Χρόνου", {
        description: `Ο χρόνος παραγγελίας #${orderId} ενημερώθηκε σε ${estimatedTime} λεπτά`,
      });
    } catch (error) {
      console.error("❌ [ADMIN] Error updating delivery time:", error);
      toast.error("Σφάλμα", {
        description: "Αποτυχία ενημέρωσης χρόνου",
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

      // Show toast with order info from event
      // Note: Sound is handled by AdminGlobalNotifications component
      showOrderCreatedToast(order);

      // Clear any existing debounce timer
      if (orderCreatedDebounceTimerRef.current) {
        clearTimeout(orderCreatedDebounceTimerRef.current);
        console.log(`⏱️ Admin: Previous debounce timer cleared, resetting...`);
      }

      // Set a new debounce timer - wait 2 seconds after the last order notification
      // This batches multiple orders that arrive quickly into a single fetch
      orderCreatedDebounceTimerRef.current = setTimeout(() => {
        console.log(`📦 Admin: Debounce period ended, fetching all new orders`);
        orderCreatedDebounceTimerRef.current = null;
        // Add delay to ensure backend has processed all orders
        // This prevents race conditions where the API is called before orders are fully committed
        fetchOrders(500);
      }, 2000);
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

      // Clear debounce timer on cleanup
      if (orderCreatedDebounceTimerRef.current) {
        clearTimeout(orderCreatedDebounceTimerRef.current);
        orderCreatedDebounceTimerRef.current = null;
      }
      unsubscribe(channelName);
    };
  }, [
    isAuthenticated,
    isConnected,
    subscribe,
    unsubscribe,
    fetchOrders,
    showOrderCreatedToast,
  ]);

  const OrderCard = ({
    order,
    actions,
    statusControl,
    isRemoving,
  }: {
    order: AdminOrder;
    actions?: React.ReactNode;
    statusControl?: React.ReactNode;
    isRemoving?: boolean;
  }) => (
    <div
      onClick={() => handleOrderClick(order)}
      className={`bg-[#1a1a1a] rounded-lg p-4 border border-gray-700 hover:border-gray-600 hover:border-[#009DE0] transition-all duration-500 cursor-pointer ${
        isRemoving ? "opacity-0 -translate-x-full" : "opacity-100 translate-x-0"
      }`}
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-white font-semibold text-lg">
            Παραγγελία #{order.order_id}
          </h3>
          <p className="text-gray-400 text-sm">
            {formatLocationName(order.location_name)}
          </p>
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
      <div className="h-screen bg-[#1a1a1a] flex">
        <div className="flex-1 px-8">
          <div className="max-w-7xl mx-auto pt-8">
            <div className="flex justify-between items-start mb-8">
              <Skeleton className="h-10 w-80" />
              <div className="flex flex-col gap-2 items-end">
                <Skeleton className="h-10 w-24" />
                <div className="flex gap-2">
                  <Skeleton className="h-10 w-24" />
                  <Skeleton className="h-10 w-24" />
                </div>
              </div>
            </div>
            <div className="mb-8">
              <Skeleton className="h-8 w-64 mb-6" />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {[...Array(4)].map((_, index) => (
                  <div
                    key={index}
                    className="bg-[#1a1a1a] rounded-lg p-4 border border-gray-700"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <Skeleton className="h-6 w-40 mb-2" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                      <Skeleton className="h-6 w-20 rounded-full" />
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                      <div className="flex justify-between">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                      <div className="flex justify-between pt-2 border-t border-gray-700">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="h-screen bg-[#1a1a1a] flex">
      {/* Main Content */}
      <div className="flex-1 px-8">
        <div className="max-w-7xl mx-auto pt-8">
          <div className="flex justify-between items-start mb-8">
            <div className="flex items-center gap-4 ">
              <h1 className="text-4xl font-bold text-white">
                Καλώς ήρθατε στο διαχειριστικό
              </h1>
            </div>
            <div className="flex flex-col gap-2 items-end">
              <div className="flex gap-2">
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  className="bg-[#ff9328ff] border-gray-600 text-white hover:bg-[#ff9328ff]"
                >
                  Logout
                </Button>
              </div>
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
          <div className="mb-8 overflow-hidden">
            <h2 className="text-2xl font-bold text-white mb-6">
              Ζωντανές Παραγγελίες
            </h2>

            {ordersLoading ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {[...Array(4)].map((_, index) => (
                  <div
                    key={index}
                    className="bg-[#1a1a1a] rounded-lg p-4 border border-gray-700"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <Skeleton className="h-6 w-40 mb-2" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                      <Skeleton className="h-6 w-20 rounded-full" />
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                      <div className="flex justify-between">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                      <div className="flex justify-between pt-2 border-t border-gray-700">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <Skeleton className="h-8 w-24" />
                      <Skeleton className="h-8 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            ) : ordersError ? (
              <div className="bg-[#2a2a2a] rounded-lg p-8 text-center">
                <p className="text-red-400">{ordersError}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-hidden">
                {/* Pending Orders Column */}
                <div>
                  <div className="bg-[#2a2a2a] rounded-lg p-6 max-h-[70vh]">
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
                                <Button
                                  size="sm"
                                  className="border-gray-700 bg-green-700 hover:bg-green-700 text-white"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    setDeliveryTimeModalOrderId(order.order_id);
                                    setIsDeliveryTimeModalOpen(true);
                                  }}
                                >
                                  Χρόνος παραγγελίας
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
                  <div className="bg-[#2a2a2a] rounded-lg p-6 max-h-[70vh]">
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
                            isRemoving={removingOrders.has(order.order_id)}
                            actions={
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-gray-700 text-gray-300 hover:bg-gray-800"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setDeliveryTimeModalOrderId(order.order_id);
                                  setIsDeliveryTimeModalOpen(true);
                                }}
                              >
                                Χρόνος παραγγελίας
                              </Button>
                            }
                            statusControl={
                              <div className="flex flex-col gap-2">
                                <label className="text-xs font-medium text-gray-400">
                                  Ενημέρωση Κατάστασης
                                </label>
                                {(() => {
                                  // Filter and organize statuses into two rows
                                  const availableStatuses =
                                    ORDER_STATUS_OPTIONS.filter((option) => {
                                      if (option.value === "DELIVERY") {
                                        return isDeliveryOrder(order);
                                      }
                                      if (option.value === "PICK_UP") {
                                        return isPickupOrder(order);
                                      }
                                      return true;
                                    });

                                  // First row: RECEIVED, PREPARATION, DELIVERY/PICK_UP
                                  const firstRow = availableStatuses.filter(
                                    (option) =>
                                      option.value === "RECEIVED" ||
                                      option.value === "PREPARATION" ||
                                      option.value === "DELIVERY" ||
                                      option.value === "PICK_UP"
                                  );

                                  // Second row: COMPLETED, CANCELLED
                                  const secondRow = availableStatuses.filter(
                                    (option) =>
                                      option.value === "COMPLETED" ||
                                      option.value === "CANCELLED"
                                  );

                                  const renderButton = (
                                    option: (typeof ORDER_STATUS_OPTIONS)[number]
                                  ) => {
                                    const isActive =
                                      (statusSelections[order.order_id] ||
                                        normalizeStatusNameToValue(
                                          order.status_name
                                        )) === option.value;

                                    // Special colors for completed and cancelled
                                    let buttonClassName = "";
                                    if (option.value === "COMPLETED") {
                                      buttonClassName = isActive
                                        ? "bg-green-600 hover:bg-green-700 text-white"
                                        : "bg-green-600/20 hover:bg-green-600/30 text-green-400 border border-green-600/50";
                                    } else if (option.value === "CANCELLED") {
                                      buttonClassName = isActive
                                        ? "bg-red-600 hover:bg-red-700 text-white"
                                        : "bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-600/50";
                                    } else {
                                      buttonClassName = isActive
                                        ? "bg-[#009DE0] hover:bg-[#0082b8] text-white"
                                        : "bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white border border-gray-700";
                                    }

                                    return (
                                      <Button
                                        key={option.value}
                                        size="sm"
                                        className={buttonClassName}
                                        onClick={(event) => {
                                          event.stopPropagation();
                                          handleStatusChange(
                                            order.order_id,
                                            option.value
                                          );
                                        }}
                                      >
                                        {option.label}
                                      </Button>
                                    );
                                  };

                                  return (
                                    <>
                                      {/* First row */}
                                      <div className="flex flex-wrap gap-2">
                                        {firstRow.map(renderButton)}
                                      </div>
                                      {/* Second row */}
                                      <div className="flex flex-wrap gap-2">
                                        {secondRow.map(renderButton)}
                                      </div>
                                    </>
                                  );
                                })()}
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
        autoPrintOnAccept={autoPrintOrderId === selectedOrder?.order_id}
      />

      {/* Delivery Time Modal */}
      {deliveryTimeModalOrderId && (
        <AdminDeliveryTimeModal
          isOpen={isDeliveryTimeModalOpen}
          onClose={() => {
            setIsDeliveryTimeModalOpen(false);
            setDeliveryTimeModalOrderId(null);
          }}
          orderId={deliveryTimeModalOrderId}
          onUpdate={handleUpdateDeliveryTime}
        />
      )}
    </div>
  );
}
