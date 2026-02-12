"use client";

import { X, Home, Plus, Edit3, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { Skeleton } from "@/components/ui/skeleton";

interface Address {
  id: string;
  label: string;
  address: string;
  isDefault?: boolean;
  bell_name?: string | null;
  floor?: string | null;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

interface AddressBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddressSelect?: (address: Address) => void;
  onAddNewAddress?: () => void;
  onEditAddress?: (address: Address) => void;
}

export function AddressBookModal({
  isOpen,
  onClose,
  onAddressSelect,
  onAddNewAddress,
  onEditAddress,
}: AddressBookModalProps) {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(false);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isOpen) {
      loadAddresses();
    }
  }, [isOpen]);

  const loadAddresses = async () => {
    setLoading(true);
    try {
      let addressList: Address[] = [];

      // First, try to fetch addresses from the API
      try {
        let userData = null;
        const storedUser =
          localStorage.getItem("user") || sessionStorage.getItem("user");

        if (storedUser) {
          userData = JSON.parse(storedUser);
        } else if (user && isAuthenticated) {
          userData = user;
        }

        if (userData && userData.id) {
          const apiUrl = `/api/address-book/${userData.id}`;
          
          const response = await fetch(apiUrl, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          });

          if (response.ok) {
            const data = await response.json();
            
            if (data.success && data.data && data.data.addresses) {
              // Transform API addresses to our format
              addressList = data.data.addresses.map((apiAddress: any) => {
                // Handle coordinates
                let coordinates: { latitude: number; longitude: number } | undefined;
                if (apiAddress.latitude !== undefined && apiAddress.longitude !== undefined) {
                  coordinates = {
                    latitude: parseFloat(apiAddress.latitude),
                    longitude: parseFloat(apiAddress.longitude),
                  };
                } else if (apiAddress.coordinates) {
                  coordinates = {
                    latitude: parseFloat(apiAddress.coordinates.latitude),
                    longitude: parseFloat(apiAddress.coordinates.longitude),
                  };
                }

                return {
                  id: apiAddress.id?.toString() || `api-${Math.random()}`,
                  label: apiAddress.is_default ? "Σπίτι" : "Διεύθυνση",
                  address:
                    apiAddress.formatted_address ||
                    `${apiAddress.address_1}, ${apiAddress.city} ${
                      apiAddress.postcode
                    }, ${apiAddress.country?.name || "Greece"}`,
                  isDefault: apiAddress.is_default || false,
                  bell_name: apiAddress.bell_name || null,
                  floor: apiAddress.floor || null,
                  coordinates,
                  // Include original API fields for checkout
                  address_1: apiAddress.address_1 || null,
                  city: apiAddress.city || null,
                  postcode: apiAddress.postcode || null,
                  latitude: apiAddress.latitude,
                  longitude: apiAddress.longitude,
                };
              });
            }
          }
        }
      } catch (apiError) {
        console.error("Error fetching addresses from API:", apiError);
      }

      // Fallback: Load addresses from localStorage
      const savedAddresses = localStorage.getItem("savedAddresses");
      if (savedAddresses && addressList.length === 0) {
        addressList = JSON.parse(savedAddresses);
      }

      // Add current location if it exists and isn't already in the list
      const savedLocation = localStorage.getItem("userLocation");
      if (savedLocation) {
        const currentLocation = JSON.parse(savedLocation);
        const existingAddress = addressList.find(
          (addr) => addr.address === currentLocation.fullAddress
        );

        if (!existingAddress) {
          addressList.unshift({
            id: "current-location",
            label: "Τρέχουσα Τοποθεσία",
            address: currentLocation.fullAddress,
            isDefault: true,
            coordinates: currentLocation.coordinates,
          });
        }
      }

      setAddresses(addressList);
    } catch (error) {
      console.error("Error loading addresses:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddressSelect = async (address: Address) => {
    if (onAddressSelect) {
      onAddressSelect(address);
    }

    // Save the selected address to localStorage for quick access
    try {
      const user = localStorage.getItem("user");
      if (user) {
        const finalCoordinates = address.coordinates || {
          latitude: 37.9755,
          longitude: 23.7348,
        }; // Default Athens coordinates
        
        const locationData = {
          city:
            address.address.split(",")[1]?.trim() ||
            address.address.split(",")[0]?.trim() ||
            "Athens",
          fullAddress: address.address,
          coordinates: finalCoordinates,
          addressDetails: {
            street: address.address.split(",")[0]?.trim(),
            postalCode: address.address.match(/\d{5}/)?.[0] || "",
            locality: address.address.split(",")[1]?.trim(),
            country: "Greece",
          },
        };
        localStorage.setItem("userLocation", JSON.stringify(locationData));
      }
    } catch (error) {
      console.error("Error saving selected address:", error);
    }

    onClose();
  };

  const handleAddNewAddress = () => {
    if (onAddNewAddress) {
      onAddNewAddress();
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .address-modal-scroll::-webkit-scrollbar {
              width: 6px;
            }
            .address-modal-scroll::-webkit-scrollbar-track {
              background: #18181b; /* zinc-900 */
              border-radius: 4px;
            }
            .address-modal-scroll::-webkit-scrollbar-thumb {
              background: #3f3f46; /* zinc-700 */
              border-radius: 4px;
            }
            .address-modal-scroll::-webkit-scrollbar-thumb:hover {
              background: #52525b; /* zinc-600 */
            }
            .address-modal-scroll {
              scrollbar-width: thin;
              scrollbar-color: #3f3f46 #18181b;
            }
          `,
        }}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

        <div className="relative bg-zinc-900 rounded-xl w-full max-w-md max-h-[85vh] flex flex-col shadow-2xl border border-zinc-800 text-zinc-200">
          
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-zinc-800 flex-shrink-0 bg-zinc-900 rounded-t-xl">
            <h2 className="text-xl font-bold text-white">Επιλογή Διεύθυνσης</h2>
            <Button
              variant="ghost"
              size="icon"
              className="text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg"
              onClick={onClose}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Content - Scrollable */}
          <div className="p-4 overflow-y-auto flex-1 min-h-0 address-modal-scroll bg-black/20">
            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-zinc-900 rounded-xl border border-zinc-800"
                  >
                    <div className="flex items-center gap-4">
                      <Skeleton className="w-10 h-10 rounded-full bg-zinc-800" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-32 bg-zinc-800" />
                        <Skeleton className="h-3 w-48 bg-zinc-800" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {addresses.length > 0 && (
                  <div className="space-y-3">
                    {addresses.map((address) => (
                      <div
                        key={address.id}
                        className="group flex items-start gap-4 p-4 bg-black rounded-xl cursor-pointer hover:border-[var(--brand-border)] border border-zinc-800 transition-all duration-200 relative overflow-hidden"
                        onClick={() => handleAddressSelect(address)}
                      >
                         {/* Hover highlight effect */}
                         <div className="absolute inset-0 bg-[var(--brand-border)]/0 group-hover:bg-[var(--brand-border)]/5 transition-colors pointer-events-none" />

                        <div className="w-10 h-10 bg-zinc-900 rounded-full flex items-center justify-center border border-zinc-800 group-hover:border-[var(--brand-border)]/30 transition-colors shrink-0 z-10">
                          <MapPin className="w-5 h-5 text-zinc-400 group-hover:text-[var(--brand-border)] transition-colors" />
                        </div>
                        
                        <div className="flex-1 min-w-0 z-10">
                          <div className="flex items-center justify-between mb-0.5">
                              <span className="text-white font-bold text-sm group-hover:text-[var(--brand-border)] transition-colors">
                                {address.label}
                              </span>
                          </div>
                          <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed line-clamp-2">
                            {address.address}
                          </p>
                          
                          {(address.bell_name || address.floor) && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {address.bell_name && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-900 text-zinc-400 border border-zinc-800">
                                 {address.bell_name}
                                </span>
                              )}
                              {address.floor && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-900 text-zinc-400 border border-zinc-800">
                                  {address.floor}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        
                        {/* Chevron/Select indicator */}
                        <div className="self-center opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 duration-200">

                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Empty State */}
                {addresses.length === 0 && (
                  <div className="text-center py-12 flex flex-col items-center">
                    <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mb-4 border border-zinc-800">
                      <Home className="w-8 h-8 text-zinc-600" />
                    </div>
                    <p className="text-zinc-400 mb-6 font-medium">
                      Δεν έχετε αποθηκευμένες διευθύνσεις
                    </p>
                    <Button
                      onClick={handleAddNewAddress}
                        className="bg-[var(--brand-border)] hover:bg-[var(--brand-hover)] text-white shadow-lg shadow-[var(--brand-shadow)]"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Προσθήκη πρώτης διεύθυνσης
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  );
}