"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function AdminIntervalsPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [collectionInterval, setCollectionInterval] = useState<string>("15");
  const [deliveryInterval, setDeliveryInterval] = useState<string>("15");
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSavingCollection, setIsSavingCollection] = useState(false);
  const [isSavingDelivery, setIsSavingDelivery] = useState(false);
  const hasFetchedRef = useRef(false);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchIntervals = useCallback(async () => {
    try {
      setIsLoadingData(true);
      const response = await fetch("/api/admin/get-location-options", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          location_id: process.env.NEXT_LOCATION_ID,
        }),
        credentials: "include",
      });

      const result = await response.json();

      if (result.success && result.data) {
        // Round to nearest option (10, 20, 30, etc.)
        const collectionValue =
          Math.round((result.data.collection_time_interval || 10) / 10) * 10;
        const deliveryValue =
          Math.round((result.data.delivery_time_interval || 10) / 10) * 10;
        // Ensure values are within valid range (10-70)
        const finalCollection = Math.max(10, Math.min(70, collectionValue));
        const finalDelivery = Math.max(10, Math.min(70, deliveryValue));
        setCollectionInterval(finalCollection.toString());
        setDeliveryInterval(finalDelivery.toString());
      }
    } catch (error) {
      toast.error("Σφάλμα κατά την φόρτωση των διαστημάτων");
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchIntervals();
    }
  }, [isAuthenticated, fetchIntervals]);

  const handleSaveCollection = async () => {
    try {
      setIsSavingCollection(true);
      const response = await fetch("/api/admin/save-collection-interval", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          collection_time_interval: parseInt(collectionInterval),
          location_id: process.env.NEXT_LOCATION_ID,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Η αλλαγή αποθηκεύτηκε επιτυχώς");
      } else {
        toast.error(result.error || "Σφάλμα κατά την αποθήκευση");
      }
    } catch (error) {
      toast.error("Σφάλμα κατά την αποθήκευση");
    } finally {
      setIsSavingCollection(false);
    }
  };

  const handleSaveDelivery = async () => {
    try {
      setIsSavingDelivery(true);
      const response = await fetch("/api/admin/save-delivery-interval", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          delivery_time_interval: parseInt(deliveryInterval),
          location_id: process.env.NEXT_LOCATION_ID,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Η αλλαγή αποθηκεύτηκε επιτυχώς");
      } else {
        toast.error(result.error || "Σφάλμα κατά την αποθήκευση");
      }
    } catch (error) {
      toast.error("Σφάλμα κατά την αποθήκευση");
    } finally {
      setIsSavingDelivery(false);
    }
  };

  // Generate options from 10 to 70 in increments of 10
  const intervalOptions = useMemo(() => {
    const options = [];
    for (let i = 10; i <= 70; i += 10) {
      options.push(i);
    }
    return options;
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    // Clear remembered credentials on manual logout
    if (typeof window !== "undefined") {
      localStorage.removeItem("admin_remembered_credentials");
    }
    router.push("/admin/login");
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
              <h1 className="text-4xl font-bold text-white">
                Χρόνος παραλαβής και παράδοσης
              </h1>
            </div>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="bg-[#2a2a2a] border-gray-600 text-white hover:bg-[#3a3a3a]"
            >
              Logout
            </Button>
          </div>

          {/* Interval Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Collection Time Interval Card */}
            <div className="bg-[#2a2a2a] rounded-lg p-6 border border-gray-700">
              <h2 className="text-xl font-semibold text-white mb-4">
                Χρονος Παραλαβής (Collection Time)
              </h2>
              {isLoadingData ? (
                <p className="text-gray-400">Φόρτωση...</p>
              ) : (
                <>
                  <div className="mb-4">
                    <label
                      htmlFor="collection-interval"
                      className="block text-sm font-medium text-gray-300 mb-2"
                    >
                      Διάστημα (λεπτά)
                    </label>
                    <select
                      id="collection-interval"
                      value={collectionInterval}
                      onChange={(e) => setCollectionInterval(e.target.value)}
                      className="w-full bg-[#1a1a1a] border border-gray-600 text-white rounded-md px-3 py-2 h-12 focus:outline-none focus:ring-2 focus:ring-[#009DE0] focus:border-transparent"
                    >
                      {intervalOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Button
                    onClick={handleSaveCollection}
                    disabled={isSavingCollection}
                    className="w-full bg-[var(--brand-border)] hover:bg-[var(--brand-hover)] text-white"
                  >
                    {isSavingCollection ? "Αποθήκευση..." : "Αποθηκευση"}
                  </Button>
                </>
              )}
            </div>

            {/* Delivery Time Interval Card */}
            <div className="bg-[#2a2a2a] rounded-lg p-6 border border-gray-700">
              <h2 className="text-xl font-semibold text-white mb-4">
                Χρονος Παράδοσης (Delivery Time)
              </h2>
              {isLoadingData ? (
                <p className="text-gray-400">Φόρτωση...</p>
              ) : (
                <>
                  <div className="mb-4">
                    <label
                      htmlFor="delivery-interval"
                      className="block text-sm font-medium text-gray-300 mb-2"
                    >
                      Διάστημα (λεπτά)
                    </label>
                    <select
                      id="delivery-interval"
                      value={deliveryInterval}
                      onChange={(e) => setDeliveryInterval(e.target.value)}
                      className="w-full bg-[#1a1a1a] border border-gray-600 text-white rounded-md px-3 py-2 h-12 focus:outline-none focus:ring-2 focus:ring-[#009DE0] focus:border-transparent"
                    >
                      {intervalOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Button
                    onClick={handleSaveDelivery}
                    disabled={isSavingDelivery}
                    className="w-full bg-[var(--brand-border)] hover:bg-[var(--brand-hover)] text-white"
                  >
                    {isSavingDelivery ? "Αποθήκευση..." : "Αποθηκευση"}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
