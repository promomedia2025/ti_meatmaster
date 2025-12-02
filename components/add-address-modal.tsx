"use client";

import { X, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import GooglePlacesCustom from "./google-places-custom";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";

interface AddAddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddressAdded?: () => void;
}

export function AddAddressModal({
  isOpen,
  onClose,
  onAddressAdded,
}: AddAddressModalProps) {
  const { user } = useAuth();
  const [address, setAddress] = useState("");
  const [selectedPlace, setSelectedPlace] = useState<any>(null);
  const [bellName, setBellName] = useState("");
  const [floor, setFloor] = useState("");

  // Handle address input change
  const handleAddressChange = (value: string) => {
    setAddress(value);
  };

  // Handle Google Places selection
  const handleGooglePlaceSelect = (place: any) => {
    console.log("🗺️ Full Google Place Object:", place);
    console.log("📍 Formatted Address:", place.formatted_address);
    console.log("🏠 Address Components:", place.address_components);
    console.log("📍 Geometry:", place.geometry);

    setSelectedPlace(place);
    setAddress(place.formatted_address);

    if (place.formatted_address) {
      console.log("✅ Place selected successfully!");
    }
  };

  // Generate Google Maps embed URL
  const getMapsEmbedUrl = (place: any) => {
    if (!place?.geometry?.location) return null;

    const lat = place.geometry.location.lat();
    const lng = place.geometry.location.lng();
    const address = encodeURIComponent(place.formatted_address);

    return `https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=${address}&center=${lat},${lng}&zoom=15`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-lg w-full max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">
                Προσθήκη Διεύθυνσης
              </h2>
              <p className="text-gray-400 text-sm">
                Προσθέστε μια νέα διεύθυνση παράδοσης
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-400 hover:text-white hover:bg-gray-800"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-6">
          {/* Google Places Autocomplete */}
          <div className="space-y-2">
            <label className="text-base font-medium text-white">
              Διεύθυνση *
            </label>
            <GooglePlacesCustom
              value={address}
              onChange={handleAddressChange}
              onPlaceSelect={handleGooglePlaceSelect}
              placeholder="Αναζήτηση διεύθυνσης..."
              className="w-full"
            />
          </div>

          {/* Google Maps Preview */}
          {selectedPlace && (
            <div className="space-y-2">
              <label className="text-base font-medium text-white">
                Προεπισκόπηση
              </label>
              <div className="w-full h-64 bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
                {getMapsEmbedUrl(selectedPlace) ? (
                  <iframe
                    src={getMapsEmbedUrl(selectedPlace)}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Selected Address Preview"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center">
                      <MapPin className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                      <p className="text-xs text-gray-400">Map Preview</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Bell Name Field */}
          {selectedPlace && (
            <div className="space-y-2">
              <label htmlFor="bellName" className="text-base font-medium text-white">
                Όνομα στο Κουδούνι
              </label>
              <Input
                id="bellName"
                type="text"
                value={bellName}
                onChange={(e) => setBellName(e.target.value)}
                placeholder="π.χ. Παππάς"
                className="w-full bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
              />
            </div>
          )}

          {/* Floor Field */}
          {selectedPlace && (
            <div className="space-y-2">
              <label htmlFor="floor" className="text-base font-medium text-white">
                Όροφος
              </label>
              <Input
                id="floor"
                type="text"
                value={floor}
                onChange={(e) => setFloor(e.target.value)}
                placeholder="π.χ. 3"
                className="w-full bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 bg-transparent border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white py-3 text-base"
            >
              Κλείσιμο
            </Button>
            <Button
              type="button"
              onClick={async () => {
                if (!selectedPlace) {
                  console.log("❌ No address selected");
                  return;
                }

                try {
                  // Extract address components from Google Places
                  const addressComponents =
                    selectedPlace.address_components || [];
                  let streetNumber = "";
                  let route = "";
                  let city = "";
                  let state = "";
                  let postcode = "";
                  let country = "";

                  addressComponents.forEach((component: any) => {
                    const types = component.types;
                    if (types.includes("street_number")) {
                      streetNumber = component.long_name;
                    } else if (types.includes("route")) {
                      route = component.long_name;
                    } else if (
                      types.includes("locality") ||
                      types.includes("administrative_area_level_2")
                    ) {
                      city = component.long_name;
                    } else if (types.includes("administrative_area_level_1")) {
                      state = component.long_name;
                    } else if (types.includes("postal_code")) {
                      postcode = component.long_name;
                    } else if (types.includes("country")) {
                      country = component.long_name;
                    }
                  });

                  // Construct address_1 (route + street number) - Greek format
                  const address1 = route && streetNumber 
                    ? `${route} ${streetNumber}`.trim()
                    : route || streetNumber || selectedPlace.formatted_address;

                  // API body structure
                  const apiBody = {
                    customer_id: user?.id || 3, // Use actual user ID from auth context
                    address_1: address1 || selectedPlace.formatted_address,
                    address_2: "",
                    city: city || "",
                    state: state || "",
                    postcode: postcode || "",
                    country: country || "Ελλάδα",
                    bell_name: bellName || "",
                    floor: floor || "",
                    is_default: false,
                  };

                  console.log("📤 API Body for address creation:", apiBody);

                  // Get CSRF token
                  const csrfResponse = await fetch("/api/csrf");
                  const csrfData = await csrfResponse.json();

                  if (!csrfData.csrfToken) {
                    throw new Error("Failed to get CSRF token");
                  }

                  // Make API call to create address
                  const response = await fetch("/api/address-book/create", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      "x-csrf-token": csrfData.csrfToken,
                    },
                    body: JSON.stringify(apiBody),
                  });

                  const result = await response.json();

                  if (result.success) {
                    console.log("✅ Address created successfully:", result);
                    // Call the callback to refresh addresses
                    if (onAddressAdded) {
                      console.log(
                        "🔄 Calling onAddressAdded to refresh address list"
                      );
                      onAddressAdded();
                    }
                    // Close the modal
                    onClose();
                  } else {
                    console.error("❌ Failed to create address:", result);
                    alert(`Failed to create address: ${result.message}`);
                  }
                } catch (error) {
                  console.error("❌ Error creating address:", error);
                  alert("An error occurred while creating the address");
                }
              }}
              disabled={!selectedPlace}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Αποθήκευση Διεύθυνσης
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
