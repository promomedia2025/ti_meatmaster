"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { useEffect, useState } from "react";
import { Clock, ArrowLeft, Package, MapPin } from "lucide-react";
import Link from "next/link";

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

export default function OrderHistoryPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/");
      return;
    }

    if (user?.id) {
      fetchOrders();
    }
  }, [isAuthenticated, user?.id, router]);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/orders?user_id=${user?.id}`);
      const data = await response.json();

      console.log("Orders API response:", data);

      // Handle the specific API response structure
      if (data.success && data.data && Array.isArray(data.data)) {
        setOrders(data.data);
      } else {
        setOrders([]);
        setError(data.message || "Failed to load orders");
      }
    } catch (err) {
      console.error("Error fetching orders:", err);
      setError("Failed to load orders");
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (statusName: string) => {
    switch (statusName.toLowerCase()) {
      case "delivery":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "received":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "pending":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "cancelled":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getStatusText = (statusName: string) => {
    switch (statusName.toLowerCase()) {
      case "delivery":
        return "Παραδόθηκε";
      case "received":
        return "Ελήφθη";
      case "pending":
        return "Εκκρεμεί";
      case "cancelled":
        return "Ακυρώθηκε";
      default:
        return statusName;
    }
  };

  const formatDate = (orderDate: string, orderTime: string) => {
    // Combine date and time to create a proper datetime string
    const dateTimeString = `${orderDate}T${orderTime}`;
    const date = new Date(dateTimeString);
    return date.toLocaleDateString("el-GR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-white">Redirecting...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Link
              href="/user"
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-white" />
            </Link>
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">
                Ιστορικό Παραγγελιών
              </h1>
              <p className="text-gray-400">
                Προβολή των προηγούμενων παραγγελιών σας
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-gray-400">Φόρτωση παραγγελιών...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 mb-6">
            <p className="text-red-200">{error}</p>
          </div>
        )}

        {/* Orders List */}
        {!isLoading && !error && (
          <div className="space-y-4">
            {orders.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">
                  Δεν υπάρχουν παραγγελίες
                </h3>
                <p className="text-gray-400">
                  Οι παραγγελίες σας θα εμφανίζονται εδώ
                </p>
              </div>
            ) : (
              orders.map((order) => (
                <div
                  key={order.order_id}
                  className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-1">
                        {order.location_name}
                      </h3>
                      <p className="text-gray-400 text-sm">
                        #{order.order_id} •{" "}
                        {formatDate(order.order_date, order.order_time)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-semibold text-lg">
                        {parseFloat(order.order_total).toFixed(2)}{" "}
                        {order.currency}
                      </p>
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs border ${getStatusColor(
                          order.status_name
                        )}`}
                      >
                        {getStatusText(order.status_name)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Clock className="w-4 h-4" />
                    <span>
                      Σύνολο: {parseFloat(order.order_total).toFixed(2)}{" "}
                      {order.currency}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}
