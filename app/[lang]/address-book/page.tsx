"use client";

import { useAuth } from "@/lib/auth-context";
import { useLocation } from "@/lib/location-context";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { MapPin, Plus, Trash2, ArrowLeft, Loader2, Home } from "lucide-react";
import Link from "next/link";
import { AddAddressModal } from "@/components/add-address-modal";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { Skeleton } from "@/components/ui/skeleton";

interface Address {
  id: number;
  customer_id: number;
  address_1: string;
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
  const { user, isAuthenticated, isLoading: authLoading } = useAuth() as any;
  const { refreshDefaultAddress } = useLocation();
  const router = useRouter();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // --- Auth Check ---
  useEffect(() => {
    if (!authLoading && isAuthenticated === false) {
      router.push("/");
    }
  }, [isAuthenticated, authLoading, router]);

  // --- Fetch Addresses ---
  useEffect(() => {
    if (user?.id) {
      fetchAddresses();
    } else if (!authLoading && !isAuthenticated) {
      setIsLoadingAddresses(false);
    }
  }, [user?.id, authLoading, isAuthenticated]);

  const fetchAddresses = async () => {
    try {
      setIsLoadingAddresses(true);
      setError(null);
      const response = await fetch(`/api/address-book?customer_id=${user?.id}`);
      const data = await response.json();

      if (data.success && data.data?.addresses) {
        setAddresses(data.data.addresses);
      } else {
        setAddresses([]);
        if (!data.success) setError(data.message || "Αποτυχία φόρτωσης διευθύνσεων");
      }
    } catch (err) {
<<<<<<< HEAD
      setError("Failed to load addresses");
      setAddresses([]); // Ensure addresses is always an array
=======
      setError("Σφάλμα κατά τη σύνδεση");
      setAddresses([]);
>>>>>>> d247a5fbfbf81f219b33b9d15b7e0ba36a940c8b
    } finally {
      setIsLoadingAddresses(false);
    }
  };

  const handleAddressAdded = () => fetchAddresses();

  const handleDeleteAddress = async (addressId: number) => {
    if (!confirm("Είστε σίγουροι ότι θέλετε να διαγράψετε αυτή τη διεύθυνση;")) return;
    try {
      const csrfResponse = await fetch("/api/csrf");
      const csrfData = await csrfResponse.json();
      const response = await fetch(`/api/address-book/delete?address_id=${addressId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", "x-csrf-token": csrfData.csrfToken },
      });
      const result = await response.json();
<<<<<<< HEAD

      if (result.success) {
        // Refresh the addresses list
        fetchAddresses();
      } else {
        alert(`Failed to delete address: ${result.message}`);
      }
    } catch (error) {
      alert("An error occurred while deleting the address");
=======
      if (result.success) fetchAddresses();
    } catch (error) {
      console.error(error);
>>>>>>> d247a5fbfbf81f219b33b9d15b7e0ba36a940c8b
    }
  };

  const handleSetAsDefault = async (addressId: number) => {
    try {
      const csrfResponse = await fetch("/api/csrf");
      const csrfData = await csrfResponse.json();
      const response = await fetch(`/api/address-book/set-default?address_id=${addressId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-csrf-token": csrfData.csrfToken },
      });
      const result = await response.json();
      if (result.success) {
        fetchAddresses();
<<<<<<< HEAD

        // Refresh the default address in location context to update Wolt navbar
        await refreshDefaultAddress();
      } else {
        alert(`Failed to set address as default: ${result.message}`);
      }
    } catch (error) {
      alert("An error occurred while setting the address as default");
=======
        await refreshDefaultAddress();
      }
    } catch (error) {
      console.error(error);
>>>>>>> d247a5fbfbf81f219b33b9d15b7e0ba36a940c8b
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#ff9328] animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-black">
      
      {/* Header */}
      <div className="bg-zinc-900 border-b border-zinc-800">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center border-4 border-zinc-900 shadow-xl shrink-0">
              {/* Brand Color Icon */}
              <MapPin className="w-8 h-8 text-[#ff9328]" />
            </div>
            <div className="overflow-hidden">
              <h1 className="text-3xl font-bold text-white mb-1">Βιβλίο Διευθύνσεων</h1>
              <p className="text-zinc-400">Διαχείριση των διευθύνσεων παράδοσης</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        
        {/* Action Bar */}
        <div className="flex items-center justify-between mb-8 gap-4">
          <Link 
            href="/user" 
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 text-sm font-medium hover:text-white hover:border-zinc-600 hover:bg-zinc-800 transition-all duration-200"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Πίσω</span>
          </Link>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full font-bold text-sm bg-[#ff9328] hover:bg-[#915316] text-white shadow-[0_0_20px_rgba(255,147,40,0.2)] transition-all"
          >
            <Plus className="w-5 h-5" />
            <span>Προσθήκη Διεύθυνσης</span>
          </button>
        </div>

        {/* Loading State */}
        {isLoadingAddresses && (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <div className="flex gap-4">
                  <Skeleton className="h-12 w-12 rounded-full bg-zinc-800" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-1/3 bg-zinc-800" />
                    <Skeleton className="h-4 w-2/3 bg-zinc-800" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Address List */}
        {!isLoadingAddresses && !error && (
          <div className="space-y-4">
            {addresses.length === 0 ? (
              <div className="text-center py-16 bg-zinc-900/50 border border-zinc-800 rounded-xl border-dashed">
                <MapPin className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Δεν υπάρχουν διευθύνσεις</h3>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="mt-4 bg-[#ff9328] text-white px-6 py-2 rounded-full font-bold text-sm"
                >
                  Προσθήκη Διεύθυνσης
                </button>
              </div>
            ) : (
              addresses.map((address) => (
                <div
                  key={address.id}
                  className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-zinc-700 transition-all group"
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className={`mt-1 w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${address.is_default ? 'bg-[#ff9328] text-white' : 'bg-black text-zinc-500 border border-zinc-800'}`}>
                        {address.is_default ? <MapPin className="w-5 h-5 fill-current" /> : <Home className="w-5 h-5" />}
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-3 mb-1">
                          <h3 className="text-lg font-bold text-white">{address.address_1}</h3>
                          {address.is_default && (
                            <span className="bg-[#ff9328]/10 text-[#ff9328] border border-[#ff9328]/30 text-[10px] font-bold px-2 py-0.5 rounded-full ">
                              Προεπιλογή
                            </span>
                          )}
                        </div>
                        <p className="text-zinc-400 text-sm leading-relaxed">{address.formatted_address}</p>
                        
                        {(address.bell_name || address.floor) && (
                          <div className="mt-3 flex flex-wrap gap-4 text-xs">
                            {address.bell_name && (
                              <div className="flex items-center gap-1.5 bg-black px-2 py-1 rounded border border-zinc-800">
                                <span className="text-zinc-500">Κουδούνι:</span>
                                <span className="text-zinc-200 font-medium">{address.bell_name}</span>
                              </div>
                            )}
                            {address.floor && (
                              <div className="flex items-center gap-1.5 bg-black px-2 py-1 rounded border border-zinc-800">
                                <span className="text-zinc-500">Όροφος:</span>
                                <span className="text-zinc-200 font-medium">{address.floor}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-start">
                      {!address.is_default && (
                        <button
                          onClick={() => handleSetAsDefault(address.id)}
                          className="px-3 py-1.5 text-xs font-medium bg-zinc-800 hover:bg-[#ff9328] hover:text-white text-zinc-300 rounded-lg transition-all"
                        >
                          Ορισμός προεπιλογής
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteAddress(address.id)}
                        className="p-2 bg-black hover:bg-red-500/10 border border-zinc-800 hover:border-red-500/50 rounded-lg transition-all group/trash"
                      >
                        <Trash2 className="w-4 h-4 text-zinc-500 group-hover/trash:text-red-500 transition-colors" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <AddAddressModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddressAdded={handleAddressAdded}
      />
      <MobileBottomNav />
    </div>
  );
}