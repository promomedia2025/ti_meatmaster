"use client";

import { useState, useEffect, useCallback } from "react";
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

  const fetchOrders = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      setOrdersLoading(true);
      setOrdersError(null);

      const response = await fetch("/api/admin/orders", {
        method: "GET",
        credentials: "include",
      });

      const result = await response.json();

      if (result.success && result.data) {
        const ordersArray = Array.isArray(result.data) ? result.data : [];
        setOrders(ordersArray);
      } else {
        setOrdersError(
          result.error || "Failed to fetch orders - invalid response structure"
        );
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      setOrdersError("An error occurred while fetching orders");
    } finally {
      setOrdersLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders();
    }
  }, [isAuthenticated]);

  // Listen for global order events to refresh data
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleOrderCreated = () => {
      console.log("📦 [AdminOrders] Order created event received, refreshing orders");
      fetchOrders();
    };

    const handleOrderUpdated = () => {
      console.log("🔄 [AdminOrders] Order updated event received, refreshing orders");
      fetchOrders();
    };

    const handleOrderStatusChanged = () => {
      console.log("🔄 [AdminOrders] Order status changed event received, refreshing orders");
      fetchOrders();
    };

    const handleOrderDeleted = () => {
      console.log("🗑️ [AdminOrders] Order deleted event received, refreshing orders");
      fetchOrders();
    };

    // Listen for custom events from global notification component
    window.addEventListener("admin:order-created", handleOrderCreated);
    window.addEventListener("admin:order-updated", handleOrderUpdated);
    window.addEventListener("admin:order-status-changed", handleOrderStatusChanged);
    window.addEventListener("admin:order-deleted", handleOrderDeleted);

    return () => {
      window.removeEventListener("admin:order-created", handleOrderCreated);
      window.removeEventListener("admin:order-updated", handleOrderUpdated);
      window.removeEventListener("admin:order-status-changed", handleOrderStatusChanged);
      window.removeEventListener("admin:order-deleted", handleOrderDeleted);
    };
  }, [isAuthenticated, fetchOrders]);

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
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
                    {orders.map((order) => (
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
                          <span className="bg-[#009DE0]/20 text-[#009DE0] px-3 py-1 rounded-full text-xs font-medium">
                            {order.status_name}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-white font-semibold">
                          {order.order_total} {order.currency}
                        </td>
                      </tr>
                    ))}
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
