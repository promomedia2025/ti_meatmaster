"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { usePusher } from "@/lib/pusher-context";
import { Package, Clock, CheckCircle, XCircle, ArrowRight, Loader2 } from "lucide-react";
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

  useEffect(() => {
    if (isOpen && isAuthenticated && user?.id) {
      fetchActiveOrders();
    }
  }, [isOpen, isAuthenticated, user?.id]);

  useEffect(() => {
    if (!isConnected || !isOpen || orders.length === 0) return;

    orders.forEach((order) => {
      const channelName = `order.${order.order_id}`;
      if (!subscribedChannelsRef.current.has(channelName)) {
        const channel = subscribe(channelName);
        if (channel) {
          subscribedChannelsRef.current.add(channelName);
          channel.bind("orderStatusUpdated", (data: any) => {
            const newStatus = data.status_name || data.statusName;
            const isOrderCompleted = newStatus && ["Completed", "Canceled", "Cancelled"].includes(newStatus);

            if (isOrderCompleted) {
              setOrders((prev) => prev.filter((o) => o.order_id !== order.order_id));
            } else {
              setOrders((prev) =>
                prev.map((o) =>
                  o.order_id === order.order_id
                    ? { ...o, status_id: data.status_id || o.status_id, status_name: newStatus || o.status_name }
                    : o
                )
              );
            }
          });
        }
      }
    });

    return () => {
      subscribedChannelsRef.current.forEach((channelName) => unsubscribe(channelName));
      subscribedChannelsRef.current.clear();
    };
  }, [isConnected, isOpen, orders, subscribe, unsubscribe]);

  const fetchActiveOrders = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(
        `/api/orders?user_id=${user?.id}&_t=${Date.now()}`,
        { headers: { "Cache-Control": "no-cache" } }
      );
      const data = await response.json();

      if (data.success && data.data && Array.isArray(data.data)) {
        const activeOrders = data.data.filter((order: Order) => {
          const status = order.status_name?.toLowerCase();
          return status !== "completed" && status !== "canceled" && status !== "cancelled";
        });
        setOrders(activeOrders);
      } else {
        setOrders([]);
        if (!data.success) setError(data.message);
      }
    } catch (err) {
      setError("Failed to load orders");
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  // --- LOCALIZATION & STYLING ---
  const getStatusLabel = (statusName: string) => {
    const s = statusName.toLowerCase();
    if (s.includes("pending")) return "Εκκρεμεί";
    if (s.includes("delivery") || s.includes("road")) return "Στο δρόμο";
    if (s.includes("received")) return "Ελήφθη";
    if (s.includes("process")) return "Ετοιμάζεται";
    return statusName;
  };

  const getStatusStyle = (statusName: string) => {
    const s = statusName.toLowerCase();
    if (s.includes("pending") || s.includes("process")) return { icon: <Clock className="w-4 h-4 text-[var(--brand-border)]" />, color: "text-[var(--brand-border)]" };
    if (s.includes("delivery")) return { icon: <Package className="w-4 h-4 text-blue-500" />, color: "text-blue-500" };
    if (s.includes("received")) return { icon: <CheckCircle className="w-4 h-4 text-green-500" />, color: "text-green-500" };
    return { icon: <Clock className="w-4 h-4 text-muted-foreground" />, color: "text-muted-foreground" };
  };

  const formatDate = (orderDate: string, orderTime: string) => {
    try {
      const date = new Date(`${orderDate}T${orderTime}`);
      return date.toLocaleTimeString("el-GR", { hour: "2-digit", minute: "2-digit" });
    } catch {
      return orderTime;
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="absolute top-14 right-0 w-80 bg-popover text-popover-foreground border border-border rounded-xl shadow-xl z-[70] overflow-hidden origin-top-right animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-200"
    >
      {/* Triangle Indicator */}
      <div className="absolute -top-1.5 right-4 w-3 h-3 bg-popover border-l border-t border-border transform rotate-45 z-10"></div>

      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-popover relative z-20">
        <div className="flex items-center gap-2">
          <div className="bg-[var(--brand-border)]/10 p-1.5 rounded-full">
            <Package className="w-4 h-4 text-[var(--brand-border)]" />
          </div>
          <h3 className="font-bold text-sm">Ενεργές Παραγγελίες</h3>
        </div>
        <div className="bg-[var(--brand-border)] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            {orders.length}
        </div>
      </div>

      {/* Content List */}
      <div className="max-h-[400px] overflow-y-auto bg-popover relative z-20 custom-scrollbar">
        {isLoading ? (
          <div className="p-4 space-y-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex gap-3">
                 <Skeleton className="h-10 w-10 rounded-full bg-muted" />
                 <div className="space-y-2 flex-1">
                   <Skeleton className="h-4 w-3/4 bg-muted" />
                   <Skeleton className="h-3 w-1/2 bg-muted" />
                 </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-red-500 text-sm font-medium">Σφάλμα φόρτωσης</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-8 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-3">
                <Package className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-foreground font-medium text-sm">Καμία ενεργή παραγγελία</p>
            <p className="text-muted-foreground text-xs mt-1">Κάντε την παραγγελία σας τώρα!</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {orders.map((order) => {
              const statusStyle = getStatusStyle(order.status_name);
              return (
                <div
                  key={order.order_id}
                  onClick={() => {
                    router.push(`/order/${order.order_id}`);
                    onClose();
                  }}
                  className="group flex items-center justify-between p-4 hover:bg-muted/50 transition-colors cursor-pointer border-b border-border/50 last:border-0"
                >
                  <div className="flex items-start gap-3">
                    {/* Status Icon */}
                    <div className="mt-1">
                      {statusStyle.icon}
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-sm text-foreground group-hover:text-[var(--brand-border)] transition-colors line-clamp-1">
                        {order.location_name}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        <span className="font-mono">#{order.order_id}</span>
                        <span>•</span>
                        <span>{formatDate(order.order_date, order.order_time)}</span>
                      </div>
                      <p className={`text-xs font-bold mt-1 ${statusStyle.color}`}>
                          {getStatusLabel(order.status_name)}
                      </p>
                    </div>
                  </div>

                  <div className="text-right pl-2">
                     <span className="block font-bold text-sm text-foreground whitespace-nowrap">
                       {parseFloat(order.order_total).toFixed(2)} {order.currency}
                     </span>
                     <ArrowRight className="w-4 h-4 text-[var(--brand-border)] ml-auto mt-2 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      {orders.length > 0 && (
        <div className="p-3 bg-muted/30 border-t border-border relative z-20">
          <button
            onClick={() => {
              router.push("/order-history");
              onClose();
            }}
            className="w-full py-2 text-center text-sm font-medium text-foreground hover:text-[var(--brand-border)] transition-colors rounded-lg hover:bg-muted"
          >
            Ιστορικό Παραγγελιών
          </button>
        </div>
      )}
    </div>
  );
}