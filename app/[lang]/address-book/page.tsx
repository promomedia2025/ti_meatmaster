"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { MapPin, Plus, Edit, Trash2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { AddAddressModal } from "@/components/add-address-modal";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";

interface Address {
  id: number;
  customer_id: number;
  address_1: string;
  address_2: string;
  city: string;
  state: string;
  postcode: string;
  bell_name: string | null;
  floor: string | null;
  country: {
    id: number;
    name: string;
    iso_code_2: string;
    iso_code_3: string;
  };
  formatted_address: string;
  is_default: boolean;
  created_at: string | null;
  updated_at: string | null;
}

export default function AddressBookPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/");
      return;
    }

    if (user?.id) {
      fetchAddresses();
    }
  }, [isAuthenticated, user?.id, router]);

  const fetchAddresses = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/address-book?customer_id=${user?.id}`);
      const data = await response.json();

      console.log("Address book API response:", data);

      // Handle the specific API response structure
      if (data.success && data.data && data.data.addresses) {
        setAddresses(data.data.addresses);
      } else {
        setAddresses([]);
        setError(data.message || "Failed to load addresses");
      }
    } catch (err) {
      console.error("Error fetching addresses:", err);
      setError("Failed to load addresses");
      setAddresses([]); // Ensure addresses is always an array
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddressAdded = () => {
    // Refresh the addresses list
    fetchAddresses();
  };

  const handleDeleteAddress = async (addressId: number) => {
    if (
      !confirm("Είστε σίγουροι ότι θέλετε να διαγράψετε αυτή τη διεύθυνση;")
    ) {
      return;
    }

    try {
      // Get CSRF token
      const csrfResponse = await fetch("/api/csrf");
      const csrfData = await csrfResponse.json();

      if (!csrfData.csrfToken) {
        throw new Error("Failed to get CSRF token");
      }

      // Make DELETE request
      const response = await fetch(
        `/api/address-book/delete?address_id=${addressId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            "x-csrf-token": csrfData.csrfToken,
          },
        }
      );

      const result = await response.json();

      if (result.success) {
        console.log("✅ Address deleted successfully:", result);
        // Refresh the addresses list
        fetchAddresses();
      } else {
        console.error("❌ Failed to delete address:", result);
        alert(`Failed to delete address: ${result.message}`);
      }
    } catch (error) {
      console.error("❌ Error deleting address:", error);
      alert("An error occurred while deleting the address");
    }
  };

  const handleSetAsDefault = async (addressId: number) => {
    try {
      // Get CSRF token
      const csrfResponse = await fetch("/api/csrf");
      const csrfData = await csrfResponse.json();

      if (!csrfData.csrfToken) {
        throw new Error("Failed to get CSRF token");
      }

      // Make POST request
      const response = await fetch(
        `/api/address-book/set-default?address_id=${addressId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-csrf-token": csrfData.csrfToken,
          },
        }
      );

      const result = await response.json();

      if (result.success) {
        console.log("✅ Address set as default successfully:", result);
        // Refresh the addresses list
        fetchAddresses();
      } else {
        console.error("❌ Failed to set address as default:", result);
        alert(`Failed to set address as default: ${result.message}`);
      }
    } catch (error) {
      console.error("❌ Error setting address as default:", error);
      alert("An error occurred while setting the address as default");
    }
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
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
              <MapPin className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">
                Βιβλίο Διευθύνσεων
              </h1>
              <p className="text-gray-400">
                Διαχείριση των διευθύνσεων παράδοσης
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Add Address Button */}
        <div className="mb-6">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-3 bg-[#ff9328ff] hover:bg-[#915316] text-white px-6 py-3 rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Προσθήκη Διεύθυνσης</span>
          </button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-gray-400">Φόρτωση διευθύνσεων...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 mb-6">
            <p className="text-red-200">{error}</p>
          </div>
        )}

        {/* Addresses List */}
        {!isLoading && !error && (
          <div className="space-y-4">
            {!Array.isArray(addresses) || addresses.length === 0 ? (
              <div className="text-center py-12">
                <MapPin className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">
                  Δεν υπάρχουν διευθύνσεις
                </h3>
                <p className="text-gray-400 mb-6">
                  Προσθέστε την πρώτη σας διεύθυνση παράδοσης
                </p>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="bg-[#ff9328ff] hover:bg-[#915316] text-white px-6 py-3 rounded-lg transition-colors"
                >
                  Προσθήκη Διεύθυνσης
                </button>
              </div>
            ) : (
              Array.isArray(addresses) &&
              addresses.map((address) => (
                <div
                  key={address.id}
                  className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-white">
                          {address.address_1}
                        </h3>
                        {address.is_default && (
                          <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded">
                            Προεπιλογή
                          </span>
                        )}
                      </div>
                      <p className="text-gray-400">
                        {address.formatted_address}
                      </p>
                      {(address.bell_name || address.floor) && (
                        <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-300">
                          {address.bell_name && (
                            <div>
                              <span className="text-gray-500">Κουδούνι:</span>{" "}
                              <span className="font-medium">
                                {address.bell_name}
                              </span>
                            </div>
                          )}
                          {address.floor && (
                            <div>
                              <span className="text-gray-500">Όροφος:</span>{" "}
                              <span className="font-medium">{address.floor}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="p-2 hover:bg-gray-700 rounded-lg transition-colors">
                        <Edit className="w-4 h-4 text-gray-400 hover:text-white" />
                      </button>
                      <button
                        onClick={() => handleDeleteAddress(address.id)}
                        className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-400" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Add Address Modal */}
      <AddAddressModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddressAdded={handleAddressAdded}
      />

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}
