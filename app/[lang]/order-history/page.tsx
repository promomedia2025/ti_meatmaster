"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { useEffect, useState } from "react";
import { Clock, ArrowLeft, Package, Receipt, Calendar, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { OrderDetailsModal } from "@/components/order-details-modal";

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
  const { user, isAuthenticated, isLoading: authLoading } = useAuth() as any;
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && isAuthenticated === false) {
      router.push("/");
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (user?.id) {
      fetchOrders();
    } else if (!authLoading && !isAuthenticated) {
      setIsLoading(false);
    }
  }, [user?.id, authLoading, isAuthenticated]);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(`/api/orders?user_id=${user?.id}`);
      const data = await response.json();

      if (data.success && data.data && Array.isArray(data.data)) {
        setOrders(data.data);
      } else {
        setOrders([]);
        if (!data.success) setError(data.message || "Αποτυχία φόρτωσης παραγγελιών");
      }
    } catch (err) {
      setError("Σφάλμα κατά τη φόρτωση του ιστορικού");
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  // --- GREEK STATUS MAPPING ---
  const getStatusDisplay = (statusName: string) => {
    const s = statusName.toLowerCase();
    if (s.includes("delivery") || s.includes("road") || s.includes("δρόμο")) 
      return { text: "Σε εξέλιξη", style: "bg-[var(--brand-border)]/10 text-[var(--brand-border)] border-[var(--brand-border)]/20" };
    if (s.includes("received") || s.includes("completed") || s.includes("ολοκληρώθηκε")) 
      return { text: "Ολοκληρώθηκε", style: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" };
    if (s.includes("pending") || s.includes("processing") || s.includes("εκκρεμεί")) 
      return { text: "Εκκρεμεί", style: "bg-amber-500/10 text-amber-400 border-amber-500/20" };
    if (s.includes("cancelled") || s.includes("canceled") || s.includes("ακυρώθηκε")) 
      return { text: "Ακυρώθηκε", style: "bg-red-500/10 text-red-400 border-red-500/20" };
    
    return { text: statusName, style: "bg-zinc-800 text-zinc-400 border-zinc-700" };
  };

  const formatDate = (orderDate: string, orderTime: string) => {
    const date = new Date(`${orderDate}T${orderTime}`);
    return date.toLocaleDateString("el-GR", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (authLoading || !isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="bg-zinc-900 border-b border-zinc-800">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center border-4 border-zinc-900 shadow-xl shrink-0">
              <Clock className="w-8 h-8 text-[var(--brand-border)]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">Ιστορικό Παραγγελιών</h1>
              <p className="text-zinc-400">Διαχειριστείτε τις προηγούμενες παραγγελίες σας</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Link 
            href="/user" 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 text-sm hover:text-white transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Πίσω στο προφίλ</span>
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <Skeleton className="h-6 w-1/3 bg-zinc-800 mb-4" />
                <Skeleton className="h-4 w-1/2 bg-zinc-800" />
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16 bg-zinc-900/50 border border-zinc-800 rounded-xl border-dashed">
            <Package className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-6">Δεν βρέθηκαν παραγγελίες</h3>
            <Link href="/" className="bg-[var(--brand-border)] text-white px-8 py-3 rounded-full font-bold transition-all hover:bg-[var(--brand-hover)]">
              Κάντε την πρώτη σας παραγγελία
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const status = getStatusDisplay(order.status_name);
              return (
                <div
                  key={order.order_id}
                  onClick={() => {
                    setSelectedOrderId(order.order_id);
                    setIsModalOpen(true);
                  }}
                  className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-[var(--brand-border)]/30 hover:bg-zinc-800/50 transition-all cursor-pointer group"
                >
                  <div className="flex flex-col sm:flex-row justify-between gap-4">
                    <div className="flex gap-4">
                      <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center border border-zinc-800 group-hover:border-[var(--brand-border)]/50 transition-colors">
                        <Receipt className="w-6 h-6 text-zinc-500 group-hover:text-[var(--brand-border)] transition-colors" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white group-hover:text-[var(--brand-border)] transition-colors">
                          {order.location_name}
                        </h3>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-500 mt-1">
                          <span className="font-mono">#{order.order_id}</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(order.order_date, order.order_time)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-[10px]  tracking-wider font-bold border ${status.style}`}>
                        {status.text}
                      </span>
                      <p className="text-white font-bold text-xl">
                        {parseFloat(order.order_total).toFixed(2)} {order.currency}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end pt-4 border-t border-zinc-800/50 mt-4 text-xs text-zinc-500 group-hover:text-zinc-300 transition-colors">
                    <span>Λεπτομέρειες παραγγελίας</span>
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <OrderDetailsModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedOrderId(null);
        }}
        orderId={selectedOrderId}
        userId={user?.id || null}
      />
      <MobileBottomNav />
    </div>
  );
}