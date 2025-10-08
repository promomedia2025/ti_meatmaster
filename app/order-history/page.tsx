"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  Order,
  OrdersResponse,
  OrderDetails,
  OrderDetailsResponse,
} from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ArrowLeft,
  Loader2,
  Calendar,
  Clock,
  MapPin,
  CheckCircle,
  XCircle,
  AlertCircle,
  X,
  ShoppingCart,
  Receipt,
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function OrderHistoryPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<OrderDetails | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingOrderId, setLoadingOrderId] = useState<number | null>(null);

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      fetchOrders();
    } else {
      router.push("/");
    }
  }, [isAuthenticated, user?.id, currentPage]);

  const fetchOrders = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/orders?user_id=${user.id}&page=${currentPage}`
      );
      const data: OrdersResponse = await response.json();

      if (data.success) {
        setOrders(data.data);
        setTotalPages(data.pagination.last_page);
      } else {
        setError("Failed to fetch orders");
      }
    } catch (err) {
      console.error("Error fetching orders:", err);
      setError("Network error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (statusName: string) => {
    switch (statusName.toLowerCase()) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "canceled":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "received":
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (statusName: string) => {
    switch (statusName.toLowerCase()) {
      case "completed":
        return "text-green-600 bg-green-50 border-green-200";
      case "canceled":
        return "text-red-600 bg-red-50 border-red-200";
      case "received":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("el-GR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (timeString: string) => {
    return timeString;
  };

  const fetchOrderDetails = async (orderId: number) => {
    if (!user?.id) return;

    setLoadingOrderId(orderId);
    try {
      const response = await fetch(
        `https://multitake.bettersolution.gr/api/user/${user.id}/orders/${orderId}`
      );
      const data: OrderDetailsResponse = await response.json();

      if (data.success) {
        setSelectedOrder(data.data);
        setIsModalOpen(true);
      } else {
        alert("Αποτυχία φόρτωσης λεπτομερειών παραγγελίας");
      }
    } catch (err) {
      console.error("Error fetching order details:", err);
      alert("Σφάλμα δικτύου");
    } finally {
      setLoadingOrderId(null);
    }
  };

  const handleOrderAgain = () => {
    // TODO: Implement order again functionality
    alert("Η λειτουργία 'Παράγγειλε Ξανά' θα υλοποιηθεί σύντομα");
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="hover:bg-muted"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Ιστορικό Παραγγελιών
            </h1>
            <p className="text-muted-foreground mt-1">
              Όλες οι παραγγελίες σας
            </p>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">
              Φόρτωση παραγγελιών...
            </span>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Σφάλμα
            </h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={fetchOrders}>Δοκιμή ξανά</Button>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Δεν υπάρχουν παραγγελίες
            </h3>
            <p className="text-muted-foreground">
              Δεν έχετε κάνει ακόμα καμία παραγγελία
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card
                key={order.order_id}
                className="p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-primary font-semibold">
                        #{order.order_id}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">
                        Παραγγελία #{order.order_id}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {order.location_name}
                      </p>
                    </div>
                  </div>
                  <div
                    className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1 ${getStatusColor(
                      order.status_name
                    )}`}
                  >
                    {getStatusIcon(order.status_name)}
                    {order.status_name}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(order.order_date)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>{formatTime(order.order_time)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-foreground font-semibold">
                    <span className="text-sm font-medium">EUR</span>
                    <span>
                      {order.order_total} {order.currency}
                    </span>
                  </div>
                </div>

                {/* Order Details Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchOrderDetails(order.order_id)}
                  disabled={loadingOrderId === order.order_id}
                  className="w-full md:w-auto"
                >
                  {loadingOrderId === order.order_id ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Φόρτωση...
                    </>
                  ) : (
                    <>
                      <Receipt className="w-4 h-4 mr-2" />
                      Λεπτομέρειες παραγγελίας
                    </>
                  )}
                </Button>
              </Card>
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  disabled={currentPage === 1}
                >
                  Προηγούμενη
                </Button>
                <span className="text-sm text-muted-foreground px-4">
                  Σελίδα {currentPage} από {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  Επόμενη
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {isModalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-background border-b p-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-foreground">
                  Λεπτομέρειες Παραγγελίας #{selectedOrder.order_id}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedOrder.location_name}
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Order Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-6 border-b">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Ημερομηνία
                  </p>
                  <p className="text-sm font-medium">
                    {formatDate(selectedOrder.order_date)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Ώρα</p>
                  <p className="text-sm font-medium">
                    {formatTime(selectedOrder.order_time)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Κατάσταση
                  </p>
                  <div
                    className={`px-2 py-1 rounded text-xs font-medium inline-flex items-center gap-1 ${getStatusColor(
                      selectedOrder.status_name
                    )}`}
                  >
                    {getStatusIcon(selectedOrder.status_name)}
                    {selectedOrder.status_name}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Σύνολο</p>
                  <p className="text-sm font-bold">
                    {selectedOrder.order_total} {selectedOrder.currency}
                  </p>
                </div>
              </div>

              {/* Menu Items */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  Προϊόντα Παραγγελίας
                </h3>
                <div className="space-y-3">
                  {selectedOrder.menu_items.map((item, index) => (
                    <Card key={index} className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-medium text-foreground">
                            {item.menu_name}
                          </h4>
                          {item.menu_options && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {item.menu_options}
                            </p>
                          )}
                          {item.menu_comment && (
                            <p className="text-sm text-muted-foreground italic mt-1">
                              Σχόλιο: {item.menu_comment}
                            </p>
                          )}
                          <p className="text-sm text-muted-foreground mt-2">
                            {item.menu_price} {selectedOrder.currency} ×{" "}
                            {item.menu_quantity}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-foreground">
                            {item.menu_subtotal} {selectedOrder.currency}
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Order Totals */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Σύνολο</h3>
                <div className="space-y-2">
                  {selectedOrder.order_totals.map((total, index) => (
                    <div
                      key={index}
                      className={`flex justify-between ${
                        total.title === "Order Total"
                          ? "text-lg font-bold text-foreground pt-2 border-t"
                          : "text-sm text-muted-foreground"
                      }`}
                    >
                      <span>{total.title}</span>
                      <span>
                        {total.value} {selectedOrder.currency}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Again Button */}
              <Button
                onClick={handleOrderAgain}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                size="lg"
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                Παράγγειλε Ξανά
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
