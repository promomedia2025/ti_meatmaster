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
  const { user } = useAuth();
  const [address, setAddress] = useState("");
  const [selectedPlace, setSelectedPlace] = useState<any>(null);
  const [bellName, setBellName] = useState("");
  const [floor, setFloor] = useState("");
  const [comments, setComments] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleAddressChange = (value: string) => {
    setAddress(value);
  };

  const handleGooglePlaceSelect = (place: any) => {
    console.log("🗺️ Google Place Selected:", place);
    setSelectedPlace(place);
    setAddress(place.formatted_address);
  };

  const getMapsEmbedUrl = (place: any) => {
    if (!place?.geometry?.location) return null;
    const lat = place.geometry.location.lat();
    const lng = place.geometry.location.lng();
    const address = encodeURIComponent(place.formatted_address);
    return `https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=${address}&center=${lat},${lng}&zoom=15`;
  };

  const handleSave = async () => {
    if (!selectedPlace) return;
    setIsSaving(true);

    try {
      // 1. Extract Coordinates
      let latitude: number | undefined;
      let longitude: number | undefined;

      if (selectedPlace?.geometry?.location) {
        latitude = typeof selectedPlace.geometry.location.lat === "function"
            ? selectedPlace.geometry.location.lat()
            : selectedPlace.geometry.location.lat;
        longitude = typeof selectedPlace.geometry.location.lng === "function"
            ? selectedPlace.geometry.location.lng()
            : selectedPlace.geometry.location.lng;
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
        customer_id: user?.id || 3,
        address_1: address1,
        city: city || "",
        state: state || "",
        postcode: postcode || "",
        country: country || "Ελλάδα",
        bell_name: bellName || "",
        floor: floor || "",
        comments: comments || "",
        is_default: false,
      };

      if (latitude && longitude) {
        apiBody.latitude = latitude;
        apiBody.longitude = longitude;
      }

      // 4. CSRF & Submit
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
      } else {
        alert(`Failed: ${result.message}`);
      }
    } catch (error) {
      console.error(error);
      alert("Error saving address");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Inject styles to make the Google Dropdown Dark Mode compatible.
        We do NOT force z-index here because we rely on the natural stacking context
        by keeping the modal z-index lower than Google's default.
      */}
      <style jsx global>{`
        .pac-container {
          background-color: #18181b !important; /* bg-zinc-900 */
          border: 1px solid #27272a !important; /* border-zinc-800 */
          border-radius: 0.5rem;
          margin-top: 4px;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5);
          font-family: inherit;
          /* Google default is z-index: 1000, which is higher than our modal's z-50 */
        }
        .pac-item {
          border-top: 1px solid #27272a !important;
          color: #a1a1aa !important; /* text-zinc-400 */
          padding: 12px 16px;
          cursor: pointer;
        }
        .pac-item:hover {
          background-color: #27272a !important; /* bg-zinc-800 */
        }
        .pac-item-query {
          color: #ffffff !important;
          font-weight: 600;
        }
        .pac-logo:after { display: none; } 
        .pac-icon { filter: invert(100%) opacity(0.5); }
      `}</style>

      {/* MODAL WRAPPER 
        - z-50: Lower than Google's 1000, so dropdown stays on top naturally.
      */}
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
        
        {/* MODAL CONTENT
          - Removed `overflow-hidden`, `overflow-y-auto`, `max-h`. 
          - This prevents clipping of the dropdown.
        */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-2xl shadow-2xl">
          
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-zinc-800">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center border border-zinc-800">
                <MapPin className="w-5 h-5 text-[#7C2429]" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Προσθήκη Διεύθυνσης</h2>
                <p className="text-zinc-400 text-sm">Προσθέστε μια νέα διεύθυνση παράδοσης</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-full">
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6">
            
            {/* GOOGLE PLACES INPUT */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">
                Διεύθυνση <span className="text-[#7C2429]">*</span>
              </label>
              <GooglePlacesCustom
                value={address}
                onChange={handleAddressChange}
                onPlaceSelect={handleGooglePlaceSelect}
                placeholder="Αναζήτηση διεύθυνσης..."
                className="w-full bg-black border-zinc-700 text-white placeholder:text-zinc-600 focus:border-white focus:ring-0 rounded-lg py-6"
              />
            </div>

            {/* PREVIEW & DETAILS (Visible only when selected) */}
            {selectedPlace && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                
                {/* Map Preview */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-300">Προεπισκόπηση</label>
                  <div className="w-full h-48 bg-black rounded-xl overflow-hidden border border-zinc-800">
                    {getMapsEmbedUrl(selectedPlace) ? (
                      <iframe
                        src={getMapsEmbedUrl(selectedPlace)!}
                        width="100%" height="100%" style={{ border: 0 }}
                        loading="lazy"
                        className="grayscale contrast-125 opacity-80"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-zinc-600 text-sm">No Preview</div>
                    )}
                  </div>
                </div>

                {/* Extra Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-300">Όνομα στο Κουδούνι</label>
                    <Input 
                      value={bellName} onChange={(e) => setBellName(e.target.value)} 
                      placeholder="π.χ. Παππάς"
                      className="bg-black border-zinc-700 text-white rounded-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-300">Όροφος</label>
                    <Input 
                      value={floor} onChange={(e) => setFloor(e.target.value)} 
                      placeholder="π.χ. 3"
                      className="bg-black border-zinc-700 text-white rounded-lg"
                    />
                  </div>
                </div>

                {/* Comments Field */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-300">Σχόλια</label>
                  <textarea
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    placeholder="Προσθέστε σχόλια για αυτή τη διεύθυνση..."
                    className="w-full h-20 bg-black border border-zinc-700 rounded-lg p-3 text-white placeholder-zinc-500 resize-none focus:outline-none focus:border-white focus:ring-0 text-sm"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-zinc-800 bg-zinc-900 rounded-b-xl flex gap-3">
            <Button onClick={onClose} className="flex-1 bg-transparent border border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white py-6 rounded-lg">
              Ακύρωση
            </Button>
            
            {/* BRAND RED BUTTON */}
            <Button 
              onClick={handleSave} 
              disabled={!selectedPlace || isSaving}
              className="flex-1 bg-[#7C2429] border border-[#7C2429] hover:bg-[#601D21] text-white py-6 rounded-lg font-bold text-base shadow-lg transition-colors"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Αποθήκευση"}
            </Button>
          </div>

        </div>
      </div>
    </>
  );
}