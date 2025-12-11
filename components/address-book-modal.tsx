"use client";

import { X, Home, Plus, Edit3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";

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
        // Get user ID from localStorage, sessionStorage, or auth context
        let userData = null;
        const storedUser =
          localStorage.getItem("user") || sessionStorage.getItem("user");
        console.log("🔍 User from localStorage:", localStorage.getItem("user"));
        console.log(
          "🔍 User from sessionStorage:",
          sessionStorage.getItem("user")
        );
        console.log("🔍 User from auth context:", user);
        console.log("🔍 Is authenticated:", isAuthenticated);

        if (storedUser) {
          userData = JSON.parse(storedUser);
        } else if (user && isAuthenticated) {
          userData = user;
        }

        console.log("🔍 Final user data:", userData);

        if (userData && userData.id) {
          console.log("🔍 User ID:", userData.id);

          const apiUrl = `/api/address-book/${userData.id}`;
          console.log("🔍 Making API request to:", apiUrl);

          const response = await fetch(apiUrl, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          });

          console.log("🔍 API Response status:", response.status);
          console.log("🔍 API Response ok:", response.ok);

          if (response.ok) {
            const data = await response.json();
            console.log("📚 Fetched addresses from API:", data);

            if (data.success && data.data && data.data.addresses) {
              console.log("📚 Found addresses:", data.data.addresses);
              // Transform API addresses to our format
              addressList = data.data.addresses.map((apiAddress: any) => ({
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
                coordinates: apiAddress.coordinates
                  ? {
                      latitude: parseFloat(apiAddress.coordinates.latitude),
                      longitude: parseFloat(apiAddress.coordinates.longitude),
                    }
                  : undefined,
                // Include original API fields for checkout
                address_1: apiAddress.address_1 || null,
                city: apiAddress.city || null,
                postcode: apiAddress.postcode || null,
              }));
              console.log("📚 Transformed address list:", addressList);
            } else {
              console.log(
                "📚 No addresses found in API response or invalid format"
              );
            }
          } else {
            const errorText = await response.text();
            console.error("📚 API Error:", response.status, errorText);
          }
        } else {
          console.log("📚 No user found in localStorage");
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
            label: "Σπίτι",
            address: currentLocation.fullAddress,
            isDefault: true,
            coordinates: currentLocation.coordinates,
          });
        }
      }

      console.log("📚 Final address list to display:", addressList);
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
        const userData = JSON.parse(user);
        const locationData = {
          city:
            address.address.split(",")[1]?.trim() ||
            address.address.split(",")[0]?.trim() ||
            "Athens",
          fullAddress: address.address,
          coordinates: address.coordinates || {
            latitude: 37.9755,
            longitude: 23.7348,
          }, // Default Athens coordinates
          addressDetails: {
            street: address.address.split(",")[0]?.trim(),
            postalCode: address.address.match(/\d{5}/)?.[0] || "",
            locality: address.address.split(",")[1]?.trim(),
            country: "Greece",
          },
        };
        localStorage.setItem("userLocation", JSON.stringify(locationData));

        console.log("📍 Address selected and saved:", address);
      }
    } catch (error) {
      console.error("Error saving selected address:", error);
    }

    onClose();
  };

  const handleEditAddress = (address: Address) => {
    if (onEditAddress) {
      onEditAddress(address);
    }
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
              width: 8px;
            }
            .address-modal-scroll::-webkit-scrollbar-track {
              background: #1a1a1a;
              border-radius: 10px;
            }
            .address-modal-scroll::-webkit-scrollbar-thumb {
              background: #4a4a4a;
              border-radius: 10px;
              border: 2px solid #1a1a1a;
            }
            .address-modal-scroll::-webkit-scrollbar-thumb:hover {
              background: #5a5a5a;
            }
            .address-modal-scroll {
              scrollbar-width: thin;
              scrollbar-color: #4a4a4a #1a1a1a;
            }
          `,
        }}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

        <div className="relative bg-[#1a1a1a] rounded-xl w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl border border-gray-800 text-white">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700 flex-shrink-0">
          <h2 className="text-2xl font-bold text-white">Πού;</h2>
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg"
            onClick={onClose}
          >
            <X className="w-6 h-6" />
          </Button>
        </div>

        {/* Content - Scrollable */}
        <div className="p-6 overflow-y-auto flex-1 min-h-0 address-modal-scroll">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Current/Default Address */}
              {addresses.length > 0 && (
                <div className="space-y-4">
                  {addresses.map((address, index) => (
                    <div key={address.id} className="space-y-4">
                      <div
                        className="flex items-center justify-between p-4 bg-[#2a2a2a] rounded-lg cursor-pointer hover:bg-[#3a3a3a] transition-colors border border-gray-700/50"
                        onClick={() => handleAddressSelect(address)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                            <Home className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="text-blue-400 font-medium">
                              {address.label}
                            </div>
                            <div className="text-gray-300 text-sm">
                              {address.address}
                            </div>
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
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-gray-400 hover:text-white"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditAddress(address);
                          }}
                        >
                          <Edit3 className="w-4 h-4" />
                        </Button>
                      </div>

                      {/* Separator line */}
                      {index < addresses.length - 1 && (
                        <div className="border-t border-gray-700"></div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Add New Address */}
              <div
                className="flex items-center gap-3 p-4 bg-[#2a2a2a] rounded-lg cursor-pointer hover:bg-[#3a3a3a] transition-colors border border-gray-700/50"
                onClick={handleAddNewAddress}
              >
                <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                  <Plus className="w-4 h-4 text-white" />
                </div>
                <div className="text-white font-medium">
                  Προσθήκη νέας διεύθυνσης
                </div>
              </div>

              {/* Empty State */}
              {addresses.length === 0 && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Home className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-400 mb-4">
                    Δεν έχετε αποθηκευμένες διευθύνσεις
                  </p>
                  <Button
                    onClick={handleAddNewAddress}
                    className="bg-[#9E2E29] hover:bg-[#601B19] text-white"
                  >
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
