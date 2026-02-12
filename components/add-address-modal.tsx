"use client";

import { X, MapPin, Loader2 } from "lucide-react";
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
  const { user } = useAuth() as any;
  const [address, setAddress] = useState("");
  const [selectedPlace, setSelectedPlace] = useState<any>(null);
  const [bellName, setBellName] = useState("");
  const [floor, setFloor] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleAddressChange = (value: string) => {
    setAddress(value);
  };

  const handleGooglePlaceSelect = (place: any) => {
    setSelectedPlace(place);
    setAddress(place.formatted_address);
  };

  const getMapsEmbedUrl = (place: any) => {
    if (!place?.geometry?.location) return null;
    const lat = typeof place.geometry.location.lat === "function" ? place.geometry.location.lat() : place.geometry.location.lat;
    const lng = typeof place.geometry.location.lng === "function" ? place.geometry.location.lng() : place.geometry.location.lng;
    const addr = encodeURIComponent(place.formatted_address);
    return `https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=${addr}&center=${lat},${lng}&zoom=15`;
  };

  const handleSave = async () => {
    if (!selectedPlace) return;
    setIsSaving(true);

    try {
      // 1. Extract Coordinates
      let latitude: number | undefined;
      let longitude: number | undefined;

      if (selectedPlace?.geometry?.location) {
        latitude = typeof selectedPlace.geometry.location.lat === "function" ? selectedPlace.geometry.location.lat() : selectedPlace.geometry.location.lat;
        longitude = typeof selectedPlace.geometry.location.lng === "function" ? selectedPlace.geometry.location.lng() : selectedPlace.geometry.location.lng;
      }

      // 2. Extract Components
      const components = selectedPlace.address_components || [];
      let streetNumber = "", route = "", city = "", state = "", postcode = "", country = "";

      components.forEach((c: any) => {
        if (c.types.includes("street_number")) streetNumber = c.long_name;
        if (c.types.includes("route")) route = c.long_name;
        if (c.types.includes("locality") || c.types.includes("administrative_area_level_2")) city = c.long_name;
        if (c.types.includes("administrative_area_level_1")) state = c.long_name;
        if (c.types.includes("postal_code")) postcode = c.long_name;
        if (c.types.includes("country")) country = c.long_name;
      });

      const address1 = route && streetNumber ? `${route} ${streetNumber}` : (route || streetNumber || selectedPlace.formatted_address);

      // 3. API Payload
      const apiBody: any = {
        customer_id: user?.id,
        address_1: address1,
        city: city || "",
        state: state || "",
        postcode: postcode || "",
        country: country || "Ελλάδα",
        bell_name: bellName || "",
        floor: floor || "",
        is_default: false,
      };

      if (latitude && longitude) {
        apiBody.latitude = latitude;
        apiBody.longitude = longitude;
      }

      const csrfResponse = await fetch("/api/csrf");
      const { csrfToken } = await csrfResponse.json();

      const response = await fetch("/api/address-book/create", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken },
        body: JSON.stringify(apiBody),
      });

      const result = await response.json();

      if (result.success) {
        if (onAddressAdded) onAddressAdded();
        onClose();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Dark Mode Google Places Styles */}
      <style jsx global>{`
        .pac-container {
          background-color: #18181b !important;
          border: 1px solid #27272a !important;
          border-radius: 0.75rem;
          margin-top: 8px;
          z-index: 9999 !important;
        }
        .pac-item {
          border-top: 1px solid #27272a !important;
          color: #a1a1aa !important;
          padding: 10px 14px;
        }
        .pac-item:hover { background-color: #27272a !important; }
        .pac-item-query { color: #ffffff !important; }
        .pac-logo:after { display: none; }
        .pac-icon { filter: invert(100%) opacity(0.5); }
      `}</style>

      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-xl shadow-2xl animate-in zoom-in-95 duration-200">
          
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-zinc-800">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-[var(--brand-border)]/10 rounded-full flex items-center justify-center border border-[var(--brand-border)]/20">
                <MapPin className="w-5 h-5 text-[var(--brand-border)]" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Προσθήκη Διεύθυνσης</h2>
                <p className="text-zinc-500 text-xs">Εισάγετε τα στοιχεία παράδοσης</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="text-zinc-500 hover:text-white rounded-full">
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="p-6 space-y-5">
            {/* Search Input */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400  tracking-wider">Διεύθυνση *</label>
              <GooglePlacesCustom
                value={address}
                onChange={handleAddressChange}
                onPlaceSelect={handleGooglePlaceSelect}
                placeholder="Αναζητήστε την οδό σας..."
              />
            </div>

            {selectedPlace && (
              <div className="space-y-5 animate-in fade-in slide-in-from-top-2 duration-300">
                {/* Map Preview */}
                <div className="w-full h-40 bg-black rounded-xl overflow-hidden border border-zinc-800 relative">
                  {getMapsEmbedUrl(selectedPlace) && (
                    <iframe
                      src={getMapsEmbedUrl(selectedPlace)!}
                      width="100%" height="100%" style={{ border: 0 }}
                      className="grayscale invert-[0.9] hue-rotate-180 contrast-125 opacity-60"
                    />
                  )}
                  <div className="absolute inset-0 pointer-events-none border-inner border-zinc-800/50" />
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-zinc-400 ">Κουδούνι</label>
                    <Input 
                      value={bellName} onChange={(e) => setBellName(e.target.value)} 
                      placeholder="π.χ. Παππάς"
                      className="bg-black border-zinc-800 text-white focus:border-[var(--brand-border)]"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-zinc-400 ">Όροφος</label>
                    <Input 
                      value={floor} onChange={(e) => setFloor(e.target.value)} 
                      placeholder="π.χ. 2ος"
                      className="bg-black border-zinc-800 text-white focus:border-[var(--brand-border)]"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="p-6 border-t border-zinc-800 flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1 border-zinc-800 text-zinc-400 hover:bg-zinc-800">
              Ακύρωση
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={!selectedPlace || isSaving}
              className="flex-1 bg-[var(--brand-border)] hover:bg-[var(--brand-hover)] text-white font-bold shadow-lg shadow-orange-900/20"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Αποθήκευση"}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}