"use client";

import { useState, useEffect } from "react";
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
    if (isAuthenticated) {
      fetchIntervals();
    }
  }, [isAuthenticated]);

  const fetchIntervals = async () => {
    try {
      setIsLoadingData(true);
      const response = await fetch("/api/admin/get-location-options", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          location_id: 13,
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
  };

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
          location_id: 13,
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
          location_id: 13,
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
  const intervalOptions = [];
  for (let i = 10; i <= 70; i += 10) {
    intervalOptions.push(i);
  }

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
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
              href="/admin"
              onClick={() => setIsSidebarOpen(false)}
              className="block w-full text-left px-4 py-3 rounded-lg text-white hover:bg-[#3a3a3a] transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/admin/orders"
              onClick={() => setIsSidebarOpen(false)}
              className="block w-full text-left px-4 py-3 rounded-lg text-white hover:bg-[#3a3a3a] transition-colors"
            >
              Παραγγελιες
            </Link>
            <button
              onClick={() => {
                setIsSidebarOpen(false);
              }}
              className="w-full text-left px-4 py-3 rounded-lg text-white hover:bg-[#3a3a3a] transition-colors"
            >
              Menu
            </button>
            <button
              onClick={() => {
                setIsSidebarOpen(false);
              }}
              className="w-full text-left px-4 py-3 rounded-lg text-white hover:bg-[#3a3a3a] transition-colors"
            >
              Ιστορικο παραγγελιων
            </button>
            <Link
              href="/admin/intervals"
              onClick={() => setIsSidebarOpen(false)}
              className="block w-full text-left px-4 py-3 rounded-lg text-white bg-[#3a3a3a] transition-colors"
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
                Χρονος παραγγελιας
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
                    className="w-full bg-[#009DE0] hover:bg-[#0082b8] text-white"
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
                    className="w-full bg-[#009DE0] hover:bg-[#0082b8] text-white"
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
