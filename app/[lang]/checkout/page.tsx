"use client";

import { useState, useEffect, Suspense, useMemo } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useServerCart } from "@/lib/server-cart-context";
import { useAuth } from "@/lib/auth-context";
import { usePusher } from "@/lib/pusher-context";
import { useDeliveryAvailability } from "@/lib/delivery-availability-context";
import { useLocation } from "@/lib/location-context";
import { useRestaurantStatus } from "@/lib/use-restaurant-status";
import { addActiveOrder } from "@/lib/active-orders";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ArrowLeft,
  MapPin,
  CreditCard,
  Package,
  Loader2,
  X,
  Trash2,
  Plus,
  Minus,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import GooglePlacesCustom from "@/components/google-places-custom";
import { AddressBookModal } from "@/components/address-book-modal";
import { MenuOptionsModal } from "@/components/menu-options-modal";
import { Location } from "@/lib/types";
import { CartItem } from "@/lib/server-cart-context";

interface UserLocation {
  city: string;
  fullAddress: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  addressDetails: {
    street?: string;
    houseNumber?: string;
    postalCode?: string;
    locality?: string;
    country?: string;
  };
  bell_name?: string | null;
  floor?: string | null;
  addressId?: string | null;
}

function CheckoutPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuth();
  const {
    locationCarts,
    getLocationCart,
    clearLocationCart,
    removeItem,
    updateQuantity,
    refreshCart,
    isLoading: isCartLoading,
  } = useServerCart();
  const { subscribe, unsubscribe, isConnected } = usePusher();
  const { isDeliveryBlocked, setDeliveryData, getDeliveryData } =
    useDeliveryAvailability();
  const { coordinates, formattedAddress, reverseGeocode } = useLocation();

  // Extract current language from pathname (first segment)
  const currentLang = useMemo(() => {
    const segments = pathname.split("/").filter(Boolean);
    // Check if first segment is a language code (el, en)
    if (segments[0] === "el" || segments[0] === "en") {
      return segments[0];
    }
    // Default to Greek if no language found
    return "el";
  }, [pathname]);

  const locationId = searchParams.get("locationId");
  const locationCart = locationId
    ? getLocationCart(parseInt(locationId))
    : null;

  // Redirect to main page if there's no cart
  useEffect(() => {
    // If no locationId in URL, redirect immediately
    if (!locationId) {
      router.push(`/${currentLang}`);
      return;
    }

    // Wait for cart to finish loading before checking
    if (isCartLoading) {
      return; // Don't redirect while cart is still loading
    }

    // If locationId exists but no cart after loading is complete, redirect
    if (locationId && !locationCart) {
      const timer = setTimeout(() => {
        // Double-check that cart still doesn't exist after delay
        const currentCart = getLocationCart(parseInt(locationId));
        if (!currentCart) {
          router.push(`/${currentLang}`);
        }
      }, 1000); // 1 second delay to ensure cart has been fetched

      return () => clearTimeout(timer);
    }
  }, [locationCart, locationId, currentLang, router, isCartLoading, getLocationCart]);

  // State for location data (needed for minimum order checks)
  const [locationData, setLocationData] = useState<Location | null>(null);

  // Fetch restaurant status using the custom hook
  const { status: restaurantStatus, isLoading: isLoadingRestaurantStatus } =
    useRestaurantStatus(locationId ? parseInt(locationId) : null);

  // Log restaurant status when it loads or changes
  useEffect(() => {
    console.log("🍽️ [CHECKOUT] Restaurant Status:", {
      locationId: locationId ? parseInt(locationId) : null,
      isLoading: isLoadingRestaurantStatus,
      restaurantStatus,
      isOpen: restaurantStatus?.is_open,
      pickupAvailable: restaurantStatus?.pickup_available,
      deliveryAvailable: restaurantStatus?.delivery_available,
      statusMessage: restaurantStatus?.status_message,
      nextOpeningTime: restaurantStatus?.next_opening_time,
    });
  }, [locationId, restaurantStatus, isLoadingRestaurantStatus]);

  // Fetch location data to get intervals
  useEffect(() => {
    const fetchLocationData = async () => {
      if (!locationId) {
        setLocationData(null);
        return;
      }

      try {
        const response = await fetch("/api/locations", {
          method: "GET",
          cache: "no-store",
        });

        if (!response.ok) {
          console.error("Failed to fetch location data");
          return;
        }

        const data = await response.json();

        if (data.success && data.data?.locations) {
          const location = data.data.locations.find(
            (loc: Location) => loc.id === parseInt(locationId)
          );
          if (location) {
            setLocationData(location);
          }
        }
      } catch (error) {
        console.error("Error fetching location data:", error);
      }
    };

    fetchLocationData();
  }, [locationId]);

  const [orderType, setOrderType] = useState<"pickup" | "delivery">("delivery");

  // Auto-switch order type if current selection doesn't meet minimum order
  useEffect(() => {
    if (!locationCart || !locationData) return;

    const deliveryMinOrder = locationData.options?.delivery_min_order_amount
      ? parseFloat(locationData.options.delivery_min_order_amount)
      : 0;
    const pickupMinOrder = locationData.options?.collection_min_order_amount
      ? parseFloat(locationData.options.collection_min_order_amount)
      : 0;
    const cartTotal = locationCart.summary.total || 0;

    const deliveryMeetsMin =
      deliveryMinOrder === 0 || cartTotal >= deliveryMinOrder;
    const pickupMeetsMin = pickupMinOrder === 0 || cartTotal >= pickupMinOrder;

    // If current order type doesn't meet minimum, switch to the one that does
    // Don't switch based on delivery availability - let user choose delivery option
    if (orderType === "delivery") {
      if (!deliveryMeetsMin && pickupMeetsMin) {
        setOrderType("pickup");
      }
    } else if (orderType === "pickup") {
      if (!pickupMeetsMin && deliveryMeetsMin) {
        setOrderType("delivery");
      }
    }
  }, [locationCart, locationData, orderType]);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card">("cash");
  const [orderComments, setOrderComments] = useState("");
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderId, setOrderId] = useState<number | null>(null);
  const [paymentWindow, setPaymentWindow] = useState<Window | null>(null);
  const [isCheckingDelivery, setIsCheckingDelivery] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [addressInput, setAddressInput] = useState("");
  const [bellName, setBellName] = useState("");
  const [floor, setFloor] = useState("");
  const [saveAddress, setSaveAddress] = useState(false);
  const [isAddressBookModalOpen, setIsAddressBookModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CartItem | null>(null);
  const [isMenuOptionsModalOpen, setIsMenuOptionsModalOpen] = useState(false);
  const [menuItemForEdit, setMenuItemForEdit] = useState<any>(null);
  const [isLoadingMenuItem, setIsLoadingMenuItem] = useState(false);
  const [isUpdatingItem, setIsUpdatingItem] = useState(false);

  // Handle remove item
  const handleRemoveItem = async (item: CartItem) => {
    if (!locationCart) return;
    const success = await removeItem(locationCart.locationId, item.rowId);
    if (success && locationCart.items.length === 1) {
      // If this was the last item, redirect to main page
      router.push(`/${currentLang}`);
    }
  };

  // Handle quantity update
  const handleQuantityChange = async (item: CartItem, newQuantity: number) => {
    if (!locationCart || newQuantity < 1) return;
    await updateQuantity(locationCart.locationId, item.rowId, newQuantity);
  };

  // Handle item click - open menu options modal
  const handleItemClick = async (item: CartItem) => {
    if (!locationCart) return;

    setIsLoadingMenuItem(true);
    setEditingItem(item);
    setIsMenuOptionsModalOpen(true);
    setMenuItemForEdit(null); // Clear previous data

    try {
      // Fetch menu item options using the new endpoint
      const response = await fetch(`/api/menu-items/${item.id}/options`);

      if (!response.ok) {
        throw new Error("Failed to fetch menu item options");
      }

      const data = await response.json();
      
      if (data.success && data.data && data.data.options) {
        // Transform the response to match MenuOptionsModal's expected format
        const menuItem = {
          menu_id: data.data.menu_id,
          menu_name: data.data.menu_name,
          menu_description: "",
          menu_price: item.price,
          minimum_qty: 1,
          menu_priority: 0,
          order_restriction: null,
          currency: "EUR",
          categories: [],
          menu_options: data.data.options.map((opt: any) => ({
            menu_option_id: opt.menu_option_id,
            option_id: opt.option_id,
            option_name: opt.option_name,
            display_type: opt.display_type,
            priority: opt.priority,
            required: opt.required,
            min_selected: opt.min_selected,
            max_selected: opt.max_selected,
            is_enabled: opt.is_enabled,
            available: opt.available,
            free_count: opt.free_count,
            free_order_by: opt.free_order_by,
            option_values: opt.values.map((val: any) => ({
              menu_option_value_id: val.menu_option_value_id,
              option_value_id: val.option_value_id,
              name: val.name,
              price: val.price,
              quantity: val.quantity,
              is_default: val.is_default,
              priority: val.priority,
              is_enabled: val.is_enabled,
              available: val.available,
            })),
          })),
        };
        
        setMenuItemForEdit(menuItem);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.error("Error fetching menu item options:", error);
      toast.error("Δεν ήταν δυνατή η φόρτωση των επιλογών του προϊόντος");
      setIsMenuOptionsModalOpen(false);
      setEditingItem(null);
    } finally {
      setIsLoadingMenuItem(false);
    }
  };

  // Handle menu options submit (update item)
  const handleMenuOptionsSubmit = async (
    menuItem: any,
    optionValues: any[],
    quantity: number,
    comment: string
  ) => {
    if (!editingItem || !locationCart || !user?.id) return;

    setIsUpdatingItem(true);

    try {
      // Transform optionValues from flat array to grouped format required by API
      // Same transformation as cart-sidebar
      const transformedOptions = (optionValues || []).reduce(
        (acc: any[], optionValue: any) => {
          const existingOption = acc.find(
            (opt) => opt.id === optionValue.menu_option_id
          );

          const valueObj = {
            id: optionValue.menu_option_value_id,
            name: optionValue.option_value_name,
            price: optionValue.price,
            qty: 1,
          };

          if (existingOption) {
            existingOption.values.push(valueObj);
          } else {
            acc.push({
              id: optionValue.menu_option_id,
              name: optionValue.option_name,
              values: [valueObj],
            });
          }

          return acc;
        },
        []
      );

      // Update everything (quantity, options, comment) in a single API call
      const response = await fetch("/api/cart/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          row_id: editingItem.rowId,
          quantity: quantity,
          options: transformedOptions,
          comment: comment || "",
          user_id: user.id,
          location_id: locationCart.locationId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Refresh the cart to get updated data from server
        await refreshCart();
        toast.success("Το προϊόν ενημερώθηκε");
        setIsMenuOptionsModalOpen(false);
        setEditingItem(null);
        setMenuItemForEdit(null);
      } else {
        throw new Error(data.message || "Failed to update item");
      }
    } catch (error) {
      console.error("Error updating cart item:", error);
      toast.error("Αποτυχία ενημέρωσης του προϊόντος");
    } finally {
      setIsUpdatingItem(false);
    }
  };

  // Function to reset address form
  const handleResetAddress = () => {
    setUserLocation(null);
    setBellName("");
    setFloor("");
    setAddressInput("");
    setSaveAddress(false);
    // Delivery availability data will be cleared/updated when a new address is selected
    toast.success("Η διεύθυνση διαγράφηκε");
  };

  // Function to autocomplete location from navbar
  const handleAutocompleteFromNavbar = async () => {
    if (!coordinates) {
      toast.error("Δεν υπάρχει τοποθεσία στην γραμμή πλοήγησης");
      return;
    }

    setIsLoadingLocation(true);
    try {
      // If we have formattedAddress from context, use it
      let addressInfo;
      if (formattedAddress) {
        addressInfo = {
          city: formattedAddress.area || "Unknown Location",
          fullAddress: formattedAddress.fullAddress || "Unknown Location",
          addressDetails: {
            street: formattedAddress.street || "",
            postalCode: formattedAddress.postcode || "",
            locality: formattedAddress.area || "",
          },
        };
      } else {
        // Otherwise, reverse geocode the coordinates
        const geocoded = await reverseGeocode(
          coordinates.latitude,
          coordinates.longitude,
          currentLang
        );
        if (geocoded) {
          addressInfo = {
            city: geocoded.area || "Unknown Location",
            fullAddress: geocoded.fullAddress || "Unknown Location",
            addressDetails: {
              street: geocoded.street || "",
              postalCode: geocoded.postcode || "",
              locality: geocoded.area || "",
            },
          };
        } else {
          throw new Error("Failed to get address information");
        }
      }

      const location: UserLocation = {
        ...addressInfo,
        coordinates: {
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
        },
        // Include bell_name and floor from formattedAddress if available
        bell_name: formattedAddress?.bell_name || null,
        floor: formattedAddress?.floor || null,
        addressId: null, // Not a saved address
      };

      setUserLocation(location);

      // Autofill bell_name and floor fields if they exist in formattedAddress
      if (formattedAddress?.bell_name) {
        setBellName(formattedAddress.bell_name);
      }
      if (formattedAddress?.floor) {
        setFloor(formattedAddress.floor);
      }

      toast.success("Η διεύθυνση συμπληρώθηκε αυτόματα");
    } catch (error) {
      console.error("Error autocompleting location:", error);
      toast.error("Σφάλμα κατά τη συμπλήρωση της διεύθυνσης");
    } finally {
      setIsLoadingLocation(false);
    }
  };

  // Handle address selection from address book
  const handleAddressBookSelect = async (address: any) => {
    // Extract coordinates - handle both direct properties and nested coordinates object
    let latitude: number | undefined;
    let longitude: number | undefined;

    if (address.latitude !== undefined && address.longitude !== undefined) {
      // Direct properties (from API response)
      latitude =
        typeof address.latitude === "string"
          ? parseFloat(address.latitude)
          : address.latitude;
      longitude =
        typeof address.longitude === "string"
          ? parseFloat(address.longitude)
          : address.longitude;
    } else if (address.coordinates) {
      // Nested in coordinates object (legacy format)
      latitude =
        typeof address.coordinates.latitude === "string"
          ? parseFloat(address.coordinates.latitude)
          : address.coordinates.latitude;
      longitude =
        typeof address.coordinates.longitude === "string"
          ? parseFloat(address.coordinates.longitude)
          : address.coordinates.longitude;
    }

    // Log longitude and latitude specifically
    console.log("📍 [CHECKOUT] Address selected from address book:", {
      address,
      hasCoordinates: latitude !== undefined && longitude !== undefined,
      latitude,
      longitude,
    });

    if (latitude !== undefined && longitude !== undefined) {
      console.log("📍 [CHECKOUT] Address coordinates (latitude, longitude):", {
        latitude,
        longitude,
      });
      console.log(
        `📍 [CHECKOUT] Latitude: ${latitude}, Longitude: ${longitude}`
      );
    } else {
      console.log("📍 [CHECKOUT] No coordinates found in address");
    }

    setIsLoadingLocation(true);
    try {
      let location: UserLocation;

      // Use API fields directly if available (address_1, city, postcode)
      const hasApiFields =
        address.address_1 && address.city && address.postcode;

      // If address has coordinates, use them
      if (latitude !== undefined && longitude !== undefined) {
        console.log("📍 [CHECKOUT] Using address coordinates:", {
          latitude,
          longitude,
        });
        const geocoded = await reverseGeocode(latitude, longitude, currentLang);

        if (geocoded && !hasApiFields) {
          // Use geocoded data only if we don't have API fields
          location = {
            city:
              geocoded.area ||
              address.city ||
              address.address.split(",")[1]?.trim() ||
              "Unknown Location",
            fullAddress: geocoded.fullAddress || address.address,
            coordinates: {
              latitude,
              longitude,
            },
            addressDetails: {
              street:
                geocoded.street ||
                address.address_1 ||
                address.address.split(",")[0]?.trim() ||
                "",
              postalCode:
                geocoded.postcode ||
                address.postcode ||
                address.address.match(/\d{5}/)?.[0] ||
                "",
              locality:
                geocoded.area ||
                address.city ||
                address.address.split(",")[1]?.trim() ||
                "",
            },
            bell_name: address.bell_name || null,
            floor: address.floor || null,
            addressId: address.id || null,
          };
        } else {
          // Use API fields directly
          location = {
            city:
              address.city ||
              geocoded?.area ||
              address.address.split(",")[1]?.trim() ||
              "Unknown Location",
            fullAddress: address.address || geocoded?.fullAddress || "",
            coordinates: {
              latitude,
              longitude,
            },
            addressDetails: {
              street:
                address.address_1 ||
                geocoded?.street ||
                address.address.split(",")[0]?.trim() ||
                "",
              postalCode:
                address.postcode ||
                geocoded?.postcode ||
                address.address.match(/\d{5}/)?.[0] ||
                "",
              locality:
                address.city ||
                geocoded?.area ||
                address.address.split(",")[1]?.trim() ||
                "",
            },
            bell_name: address.bell_name || null,
            floor: address.floor || null,
            addressId: address.id || null,
          };
        }
      } else {
        // If no coordinates, use API fields or parse the address string
        location = {
          city:
            address.city ||
            address.address.split(",")[1]?.trim() ||
            address.address.split(",")[0]?.trim() ||
            "Unknown Location",
          fullAddress: address.address,
          coordinates: {
            latitude: 37.9755, // Default Athens coordinates
            longitude: 23.7348,
          },
          addressDetails: {
            street:
              address.address_1 || address.address.split(",")[0]?.trim() || "",
            postalCode:
              address.postcode || address.address.match(/\d{5}/)?.[0] || "",
            locality:
              address.city || address.address.split(",")[1]?.trim() || "",
          },
          bell_name: address.bell_name || null,
          floor: address.floor || null,
          addressId: address.id || null,
        };
      }

      setUserLocation(location);

      // Set bell_name and floor if they exist
      if (address.bell_name) {
        setBellName(address.bell_name);
      }
      if (address.floor) {
        setFloor(address.floor);
      }

      // Check delivery availability when address is selected with coordinates
      if (
        latitude !== undefined &&
        longitude !== undefined &&
        locationCart?.locationId
      ) {
        console.log(
          "🛒 [CHECKOUT] Checking delivery availability for selected address:",
          {
            locationId: locationCart.locationId,
            latitude,
            longitude,
          }
        );

        try {
          const deliveryResponse = await fetch(
            `/api/locations/${locationCart.locationId}/delivery-availability`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                latitude,
                longitude,
              }),
            }
          );

          const deliveryData = await deliveryResponse.json();

          console.log(
            "🛒 [CHECKOUT] Delivery availability response for selected address:",
            {
              success: deliveryData.success,
              data: deliveryData.data,
              isDeliveryAvailable: deliveryData.data?.is_delivery_available,
              isWithinDeliveryArea: deliveryData.data?.is_within_delivery_area,
              deliveryEnabled: deliveryData.data?.delivery_enabled,
            }
          );

          if (deliveryData.success && deliveryData.data) {
            // Store delivery data in context
            const deliveryAvailabilityData = {
              is_delivery_available: deliveryData.data.is_delivery_available,
              is_within_delivery_area:
                deliveryData.data.is_within_delivery_area,
              delivery_enabled: deliveryData.data.delivery_enabled,
              distance: deliveryData.data.distance,
            };

            setDeliveryData(locationCart.locationId, deliveryAvailabilityData);
            console.log(
              "🛒 [CHECKOUT] Delivery data stored in context for selected address",
              {
                locationId: locationCart.locationId,
                isDeliveryAvailable: deliveryData.data.is_delivery_available,
                isWithinDeliveryArea: deliveryData.data.is_within_delivery_area,
                isDeliveryBlocked:
                  !deliveryData.data.is_delivery_available ||
                  !deliveryData.data.is_within_delivery_area,
              }
            );

            // Don't show toast or switch to pickup automatically - button will be disabled and message shown
            // User can manually switch to pickup if they want
          }
        } catch (deliveryError) {
          console.error(
            "Error checking delivery availability for selected address:",
            deliveryError
          );
          // Don't show error toast, just log it
        }
      }

      toast.success("Η διεύθυνση συμπληρώθηκε");
    } catch (error) {
      console.error("Error setting address from address book:", error);
      toast.error("Σφάλμα κατά τη συμπλήρωση της διεύθυνσης");
    } finally {
      setIsLoadingLocation(false);
    }
  };

  // Handle Google Places address selection
  const handleGooglePlaceSelect = async (place: any) => {
    if (!place.formatted_address || !place.geometry?.location) {
      toast.error("Παρακαλώ επιλέξτε μια έγκυρη διεύθυνση");
      return;
    }

    const lat = place.geometry.location.lat();
    const lng = place.geometry.location.lng();

    setIsLoadingLocation(true);
    try {
      // Reverse geocode to get formatted address details
      const geocoded = await reverseGeocode(lat, lng, currentLang);

      if (geocoded) {
        const location: UserLocation = {
          city: geocoded.area || "Unknown Location",
          fullAddress: geocoded.fullAddress || place.formatted_address,
          coordinates: {
            latitude: lat,
            longitude: lng,
          },
          addressDetails: {
            street: geocoded.street || "",
            postalCode: geocoded.postcode || "",
            locality: geocoded.area || "",
          },
          // Include bell_name and floor from formattedAddress if available
          bell_name: geocoded.bell_name || null,
          floor: geocoded.floor || null,
          addressId: null, // Not a saved address
        };

        setUserLocation(location);
        // Autofill bell_name and floor if they exist
        if (geocoded.bell_name) {
          setBellName(geocoded.bell_name);
        }
        if (geocoded.floor) {
          setFloor(geocoded.floor);
        }
        setAddressInput(""); // Clear the input after selection

        // Check delivery availability when address is selected with coordinates
        if (locationCart?.locationId) {
          console.log(
            "🛒 [CHECKOUT] Checking delivery availability for Google Places address:",
            {
              locationId: locationCart.locationId,
              latitude: lat,
              longitude: lng,
            }
          );

          try {
            const deliveryResponse = await fetch(
              `/api/locations/${locationCart.locationId}/delivery-availability`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  latitude: lat,
                  longitude: lng,
                }),
              }
            );

            const deliveryData = await deliveryResponse.json();

            console.log(
              "🛒 [CHECKOUT] Delivery availability response for Google Places address:",
              {
                success: deliveryData.success,
                data: deliveryData.data,
                isDeliveryAvailable: deliveryData.data?.is_delivery_available,
                isWithinDeliveryArea:
                  deliveryData.data?.is_within_delivery_area,
                deliveryEnabled: deliveryData.data?.delivery_enabled,
              }
            );

            if (deliveryData.success && deliveryData.data) {
              // Store delivery data in context
              const deliveryAvailabilityData = {
                is_delivery_available: deliveryData.data.is_delivery_available,
                is_within_delivery_area:
                  deliveryData.data.is_within_delivery_area,
                delivery_enabled: deliveryData.data.delivery_enabled,
                distance: deliveryData.data.distance,
              };

              setDeliveryData(
                locationCart.locationId,
                deliveryAvailabilityData
              );
              console.log(
                "🛒 [CHECKOUT] Delivery data stored in context for Google Places address",
                {
                  locationId: locationCart.locationId,
                  isDeliveryAvailable: deliveryData.data.is_delivery_available,
                  isWithinDeliveryArea:
                    deliveryData.data.is_within_delivery_area,
                  isDeliveryBlocked:
                    !deliveryData.data.is_delivery_available ||
                    !deliveryData.data.is_within_delivery_area,
                }
              );

              // Don't show toast or switch to pickup automatically - button will be disabled and message shown
              // User can manually switch to pickup if they want
            }
          } catch (deliveryError) {
            console.error(
              "Error checking delivery availability for Google Places address:",
              deliveryError
            );
            // Don't show error toast, just log it
          }
        }

        toast.success("Η διεύθυνση ορίστηκε");
      } else {
        // Fallback to basic address if reverse geocoding fails
        const location: UserLocation = {
          city: "Unknown Location",
          fullAddress: place.formatted_address,
          coordinates: {
            latitude: lat,
            longitude: lng,
          },
          addressDetails: {},
          bell_name: null,
          floor: null,
          addressId: null, // Not a saved address
        };
        setUserLocation(location);
        setAddressInput(""); // Clear the input after selection

        // Check delivery availability for fallback address too
        if (locationCart?.locationId) {
          console.log(
            "🛒 [CHECKOUT] Checking delivery availability for Google Places fallback address:",
            {
              locationId: locationCart.locationId,
              latitude: lat,
              longitude: lng,
            }
          );

          try {
            const deliveryResponse = await fetch(
              `/api/locations/${locationCart.locationId}/delivery-availability`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  latitude: lat,
                  longitude: lng,
                }),
              }
            );

            const deliveryData = await deliveryResponse.json();

            if (deliveryData.success && deliveryData.data) {
              const deliveryAvailabilityData = {
                is_delivery_available: deliveryData.data.is_delivery_available,
                is_within_delivery_area:
                  deliveryData.data.is_within_delivery_area,
                delivery_enabled: deliveryData.data.delivery_enabled,
                distance: deliveryData.data.distance,
              };

              setDeliveryData(
                locationCart.locationId,
                deliveryAvailabilityData
              );

              // Don't show toast or switch to pickup automatically - button will be disabled and message shown
              // User can manually switch to pickup if they want
            }
          } catch (deliveryError) {
            console.error(
              "Error checking delivery availability for Google Places fallback address:",
              deliveryError
            );
          }
        }

        toast.success("Η διεύθυνση ορίστηκε");
      }
    } catch (error) {
      console.error("Error setting location from Google Places:", error);
      toast.error("Σφάλμα κατά τον ορισμό της διεύθυνσης");
    } finally {
      setIsLoadingLocation(false);
    }
  };

  // Check delivery availability when locationId, coordinates, and orderType change
  useEffect(() => {
    const checkDeliveryAvailability = async () => {
      console.log("🛒 [CHECKOUT] Delivery availability check triggered", {
        locationId: locationCart?.locationId,
        hasCoordinates: !!coordinates,
        coordinates: coordinates
          ? { lat: coordinates.latitude, lng: coordinates.longitude }
          : null,
        orderType,
        isCheckingDelivery,
      });

      // Check if delivery is available from restaurant status (use hook status first)
      const isDeliveryAvailable =
        restaurantStatus?.delivery_available ??
        locationCart?.restaurantStatus?.deliveryAvailable ??
        true;

      if (
        !locationCart?.locationId ||
        !coordinates ||
        orderType !== "delivery" ||
        isCheckingDelivery ||
        !isDeliveryAvailable
      ) {
        console.log("🛒 [CHECKOUT] Skipping delivery check:", {
          reason: !locationCart?.locationId
            ? "No location cart"
            : !coordinates
            ? "No coordinates"
            : orderType !== "delivery"
            ? "Not delivery order"
            : !isDeliveryAvailable
            ? "Delivery not available"
            : "Already checking",
        });
        return;
      }

      console.log("🛒 [CHECKOUT] Starting delivery availability check", {
        locationId: locationCart.locationId,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
      });

      setIsCheckingDelivery(true);

      try {
        const response = await fetch(
          `/api/locations/${locationCart.locationId}/delivery-availability`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              latitude: coordinates.latitude,
              longitude: coordinates.longitude,
            }),
          }
        );

        const data = await response.json();

        console.log("🛒 [CHECKOUT] Delivery availability response:", {
          success: data.success,
          data: data.data,
          fullResponse: JSON.stringify(data, null, 2),
          isDeliveryAvailable: data.data?.is_delivery_available,
          isWithinDeliveryArea: data.data?.is_within_delivery_area,
          deliveryEnabled: data.data?.delivery_enabled,
        });

        if (data.success && data.data) {
          // Store delivery data in context - map the response structure
          const deliveryAvailabilityData = {
            is_delivery_available: data.data.is_delivery_available,
            is_within_delivery_area: data.data.is_within_delivery_area,
            delivery_enabled: data.data.delivery_enabled,
            distance: data.data.distance,
          };

          setDeliveryData(locationCart.locationId, deliveryAvailabilityData);
          console.log("🛒 [CHECKOUT] Delivery data stored in context", {
            locationId: locationCart.locationId,
            isDeliveryAvailable: data.data.is_delivery_available,
            isWithinDeliveryArea: data.data.is_within_delivery_area,
            deliveryEnabled: data.data.delivery_enabled,
            isDeliveryBlocked:
              !data.data.is_delivery_available ||
              !data.data.is_within_delivery_area,
          });

          // Don't switch to pickup automatically - let user choose delivery option
          // Submit button will be disabled with message if address is outside delivery area
        }
      } catch (error) {
        console.error(
          "🛒 [CHECKOUT] Error checking delivery availability:",
          error
        );
      } finally {
        setIsCheckingDelivery(false);
        console.log("🛒 [CHECKOUT] Delivery availability check completed");
      }
    };

    checkDeliveryAvailability();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    locationCart?.locationId,
    coordinates?.latitude,
    coordinates?.longitude,
    orderType,
  ]);

  // Load bell_name and floor from formattedAddress when it changes or on mount
  useEffect(() => {
    if (formattedAddress) {
      // Only update if values exist - don't clear if not present (user might have typed manually)
      if (
        formattedAddress.bell_name !== undefined &&
        formattedAddress.bell_name !== null
      ) {
        setBellName(formattedAddress.bell_name);
      }
      if (
        formattedAddress.floor !== undefined &&
        formattedAddress.floor !== null
      ) {
        setFloor(formattedAddress.floor);
      }
    }
  }, [formattedAddress]);

  // Load bell_name and floor from userLocation when it changes
  useEffect(() => {
    if (userLocation) {
      // Only update if values exist
      if (
        userLocation.bell_name !== undefined &&
        userLocation.bell_name !== null
      ) {
        setBellName(userLocation.bell_name);
      }
      if (userLocation.floor !== undefined && userLocation.floor !== null) {
        setFloor(userLocation.floor);
      }
    }
  }, [userLocation]);

  // Listen to specific order channel for order status updates
  useEffect(() => {
    console.log("🔍 Pusher connection state:", {
      isConnected,
      orderId,
    });

    if (!isConnected) {
      console.log("⚠️ Pusher not connected yet");
      return;
    }

    if (!orderId) {
      console.log("⚠️ No order ID available yet");
      return;
    }

    const channelName = `order.${orderId}`;
    console.log(`📡 Attempting to subscribe to channel: ${channelName}`);
    const channel = subscribe(channelName);

    if (channel) {
      // Listen for successful subscription
      channel.bind("pusher:subscription_succeeded", () => {
        console.log(`✅ Successfully subscribed to ${channelName}`);
      });

      // Listen for subscription errors
      channel.bind("pusher:subscription_error", (error: any) => {
        console.error(`❌ Failed to subscribe to ${channelName}:`, error);
      });

      // Listen for order status updates
      channel.bind("orderStatusUpdated", (data: any) => {
        console.log(`📦 Order ${orderId} status updated:`, data);
      });

      console.log(`🔗 Channel ${channelName} binding complete`);
    } else {
      console.error(`❌ Failed to create channel: ${channelName}`);
    }

    return () => {
      console.log(`🔌 Unsubscribing from ${channelName}`);
      unsubscribe(channelName);
    };
  }, [isConnected, orderId, subscribe, unsubscribe]);

  // Listen for payment status messages from authorize page
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Verify message is from authorize page (check origin for security)
      if (event.origin !== window.location.origin) return;
      
      if (event.data?.type === "PAYMENT_STATUS") {
        console.log("💳 [CHECKOUT] Received payment status:", event.data);
        
        if (event.data.paymentVerified === true) {
          // Payment successful - clear cart and redirect
          if (locationCart) {
            clearLocationCart(locationCart.locationId);
            console.log(`🛒 Cleared cart for location ${locationCart.locationId} after payment verification`);
          }
          
          toast.success("Η πληρωμή επιβεβαιώθηκε επιτυχώς!");
          
          if (orderId) {
            router.push(`/${currentLang}/order/${orderId}`);
          }
        } else {
          // Payment failed - stay on checkout page
          toast.error("Η πληρωμή απέτυχε. Μπορείτε να δοκιμάσετε ξανά.");
          setIsSubmitting(false);
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [locationCart, orderId, currentLang, router]);

  if (!locationCart) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-white text-lg mb-2">Ανακατεύθυνση...</div>
        </div>
      </div>
    );
  }

  const handleSubmitOrder = async () => {
    // Check if user is authenticated
    if (!isAuthenticated || !user) {
      alert("Παρακαλώ συνδεθείτε για να ολοκληρώσετε την παραγγελία.");
      return;
    }

    // Check if restaurant is closed using the hook status (most up-to-date)
    const isRestaurantOpen =
      restaurantStatus?.is_open ??
      locationCart?.restaurantStatus?.isOpen ??
      true;

    if (!isRestaurantOpen) {
      const statusMessage =
        restaurantStatus?.status_message ||
        locationCart?.restaurantStatus?.statusMessage ||
        "Το εστιατόριο είναι κλειστό. Δεν μπορείτε να υποβάλετε παραγγελία.";
      toast.error(statusMessage);
      return;
    }

    // Check if delivery is blocked for delivery orders
    if (orderType === "delivery" && locationCart) {
      // Check if user has set a delivery address
      if (!userLocation) {
        toast.error(
          "Παρακαλώ ορίστε διεύθυνση παράδοσης για παραγγελίες παράδοσης."
        );
        return;
      }

      const deliveryData = getDeliveryData(locationCart.locationId);
      if (
        deliveryData &&
        (!deliveryData.is_delivery_available ||
          !deliveryData.is_within_delivery_area)
      ) {
        toast.error(
          "Η διεύθυνσή σας είναι εκτός περιοχής παράδοσης. Παρακαλώ επιλέξτε παραλαβή ή αλλάξτε διεύθυνση."
        );
        return;
      }
    }

    // Fetch current restaurant status right before submitting order
    if (!locationId || !locationCart) {
      toast.error("Σφάλμα: Δεν βρέθηκε τοποθεσία");
      return;
    }

    setIsSubmitting(true);

    try {
      // Fetch fresh restaurant status before submitting
      const statusResponse = await fetch("/api/locations", {
        method: "GET",
        cache: "no-store",
      });

      if (!statusResponse.ok) {
        setIsSubmitting(false);
        toast.error(
          "Σφάλμα κατά τον έλεγχο κατάστασης. Παρακαλώ δοκιμάστε ξανά."
        );
        return;
      }

      const statusData = await statusResponse.json();

      if (!statusData.success || !statusData.data?.locations) {
        setIsSubmitting(false);
        toast.error(
          "Σφάλμα κατά τον έλεγχο κατάστασης. Παρακαλώ δοκιμάστε ξανά."
        );
        return;
      }

      // Find the location with matching ID
      const location = statusData.data.locations.find(
        (loc: any) => loc.id === parseInt(locationId)
      );

      if (!location) {
        setIsSubmitting(false);
        toast.error("Σφάλμα: Δεν βρέθηκε τοποθεσία");
        return;
      }

      // Check if restaurant is open
      const currentRestaurantStatus = location.restaurant_status;
      if (!currentRestaurantStatus || !currentRestaurantStatus.is_open) {
        setIsSubmitting(false);
        toast.error("Έχουμε κλείσει");
        return;
      }
    } catch (error) {
      console.error("Error checking restaurant status:", error);
      setIsSubmitting(false);
      toast.error(
        "Σφάλμα κατά τον έλεγχο κατάστασης. Παρακαλώ δοκιμάστε ξανά."
      );
      return;
    }

    try {
      // Transform cart items to match the expected API format
      const formattedItems = locationCart.items.map((item) => {
        // Transform options array to option_values array for API
        // Each option has: menu_option_id, option_name, and values array
        const optionValues = item.options
          ? item.options.flatMap((opt) =>
              opt.values.map((val) => ({
                menu_option_id: opt.menu_option_id,
                menu_option_value_id: val.menu_option_value_id,
                option_name: opt.option_name,
                option_value_name: val.option_value_name,
                price: val.price,
              }))
            )
          : [];

        return {
          id: item.id,
          name: item.name,
          qty: item.qty,
          price: item.price,
          subtotal: item.subtotal,
          option_values: optionValues,
          comment: item.comment,
        };
      });

      // Prepare order data in the expected API format
      const orderData: any = {
        locationId: locationCart.locationId,
        locationName: locationCart.locationName,
        items: formattedItems,
        total: locationCart.summary.total,
        orderType: orderType === "delivery" ? "delivery" : "collection",
        paymentMethod: paymentMethod === "cash" ? "cod" : "card",
        orderComments,
        user: {
          id: user.id,
          email: user.email,
          name:
            user.name ||
            `${user.first_name || ""} ${user.last_name || ""}`.trim(),
        },
      };

      // Add address_id as top-level property if a saved address is selected
      // Only set it once to avoid any potential duplicates
      if (orderType === "delivery" && userLocation?.addressId && !orderData.address_id) {
        orderData.address_id = userLocation.addressId;
      }

      // Add deliveryAddress for delivery orders
      if (orderType === "delivery" && userLocation) {
        // Parse fullAddress to extract address_1 and postalCode
        // Example: 'Σχολείου 3, Αγ. Παρασκευή 153 42'
        // address_1: 'Σχολειου 3', postalCode: '15342'
        let address_1 = userLocation.addressDetails?.street || "";
        let postalCode = userLocation.addressDetails?.postalCode || "";

        // If addressDetails are not available, parse from fullAddress
        if (!address_1 || !postalCode) {
          const fullAddr = userLocation.fullAddress || "";
          
          // Extract postal code (numbers at the end, remove spaces)
          // Pattern: find numbers at the end like "153 42" or "15342"
          const postalCodeMatch = fullAddr.match(/(\d+\s+\d+|\d{5,})(?=\s*$)/);
          if (postalCodeMatch) {
            postalCode = postalCodeMatch[0].replace(/\s+/g, ""); // Remove spaces
          }

          // Extract address_1 (everything before the comma)
          // Remove the postal code and city from the end
          let addressPart = fullAddr;
          if (postalCodeMatch && postalCodeMatch.index !== undefined) {
            // Remove postal code and everything after it
            addressPart = fullAddr.substring(0, postalCodeMatch.index).trim();
          }
          
          // Remove city name if it appears at the end (after comma)
          const commaIndex = addressPart.lastIndexOf(",");
          if (commaIndex !== -1) {
            address_1 = addressPart.substring(0, commaIndex).trim();
          } else {
            address_1 = addressPart.trim();
          }

          // Fallback: if we still don't have address_1, use the full address without postal code
          if (!address_1) {
            address_1 = addressPart || fullAddr;
          }
        }

        orderData.deliveryAddress = {
          city: userLocation.city,
          address_1: address_1 || userLocation.fullAddress,
          postalCode: postalCode,
          coordinates: {
            latitude: userLocation.coordinates.latitude,
            longitude: userLocation.coordinates.longitude,
          },
          bell_name: bellName || "",
          floor: floor || "",
          ...(userLocation.addressId && { addressId: userLocation.addressId }),
        };
      }

      // Save address to address book ONLY if checkbox is explicitly checked
      // Do NOT save if checkbox is not checked
      if (
        saveAddress === true &&
        isAuthenticated &&
        user?.id &&
        orderType === "delivery" &&
        userLocation
      ) {
        try {
          // Get CSRF token
          const csrfResponse = await fetch("/api/csrf");
          const csrfData = await csrfResponse.json();

          if (csrfData.csrfToken) {
            // Construct address payload
            const addressPayload = {
              customer_id: user.id,
              address_1:
                userLocation.addressDetails.street ||
                userLocation.fullAddress ||
                "",
              city: userLocation.city || "",
              state: "",
              postcode: userLocation.addressDetails.postalCode || "",
              country: userLocation.addressDetails.country || "Ελλάδα",
              bell_name: bellName || "",
              floor: floor || "",
              is_default: false,
            };

            // Save address to address book (only once, before order submission)
            const addressResponse = await fetch("/api/address-book/create", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-csrf-token": csrfData.csrfToken,
              },
              body: JSON.stringify(addressPayload),
            });

            if (addressResponse.ok) {
              const addressResult = await addressResponse.json();
              console.log("✅ Address saved to address book:", addressResult);
              toast.success("Η διεύθυνση αποθηκεύτηκε στο βιβλίο διευθύνσεων");
            } else {
              console.error(
                "⚠️ Failed to save address:",
                await addressResponse.json()
              );
              // Don't fail the order if address save fails
            }
          }
        } catch (error) {
          console.error("⚠️ Error saving address:", error);
          // Don't fail the order if address save fails
        }
      }

      console.log("📦 Submitting order with data:", orderData);

      // Submit order via server-side API route (Safari-safe)
      // IMPORTANT: Using /api/orders/submit to avoid CORS issues in Safari
      const response = await fetch("/api/orders/submit", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType?.includes("application/json")) {
          const errorData = await response.json();
          throw new Error(
            errorData.error ||
              `API request failed with status: ${response.status}`
          );
        } else {
          const errorText = await response.text();
          throw new Error(
            `API request failed with status: ${response.status}: ${errorText}`
          );
        }
      }

      // Check content type to handle both HTML (card payment) and JSON responses
      const contentType = response.headers.get("content-type") || "";
      let orderId: number | null = null;

      if (contentType.includes("text/html")) {
        // Card payment - backend returns HTML form directly
        try {
          console.log("💳 Card payment - received HTML form");
          const paymentFormHtml = await response.text();
          
          // Log the HTML response
          console.log("📄 HTML Response:", paymentFormHtml);
          
          // Extract order ID from the form (MerchantReference field)
          const orderIdMatch = paymentFormHtml.match(/name="MerchantReference"[^>]*value="(\d+)"/);
          if (orderIdMatch) {
            orderId = parseInt(orderIdMatch[1]);
            console.log(`🆔 Extracted order ID from payment form: ${orderId}`);
            setOrderId(orderId);
            addActiveOrder(orderId, locationCart.locationName);
          }

          // Don't clear cart yet - wait for payment verification

          // Parse the payment form HTML to extract form data
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = paymentFormHtml;
          const form = tempDiv.querySelector('form');
          
          if (!form) {
            throw new Error("Could not find payment form in response");
          }

          // Extract form action and method
          const formAction = form.getAttribute('action') || '';
          const formMethod = form.getAttribute('method') || 'POST';
          
          // Create a hidden form element
          const hiddenForm = document.createElement('form');
          hiddenForm.method = formMethod;
          hiddenForm.action = formAction;
          hiddenForm.target = '_blank';
          hiddenForm.style.display = 'none';
          
          // Copy all input fields from the payment form
          form.querySelectorAll('input').forEach((input) => {
            const htmlInput = input as HTMLInputElement;
            const newInput = document.createElement('input');
            newInput.type = htmlInput.type || 'hidden';
            newInput.name = htmlInput.name;
            newInput.value = htmlInput.value;
            hiddenForm.appendChild(newInput);
          });
          
          // Append to body and submit (this works reliably on all browsers including iPhone Safari)
          document.body.appendChild(hiddenForm);
          
          // Submit the form - this will open the payment gateway in a new tab/window
          hiddenForm.submit();
          
          // Store a reference to indicate payment window is open
          setPaymentWindow(window);
          
          // Clean up the form after a short delay
          setTimeout(() => {
            try {
              if (document.body.contains(hiddenForm)) {
                document.body.removeChild(hiddenForm);
              }
            } catch (e) {
              // Ignore cleanup errors
            }
          }, 1000);

          // TEMPORARILY REMOVED: Redirect to order tracking page
          // if (orderId) {
          //   router.push(`/${currentLang}/order/${orderId}`);
          // } else {
          //   router.push(`/${currentLang}`);
          // }
        } catch (paymentError) {
          console.error("Error handling card payment:", paymentError);
          toast.error(
            "Σφάλμα κατά το άνοιγμα της φόρμας πληρωμής. Η παραγγελία δημιουργήθηκε. Παρακαλώ επικοινωνήστε με την εξυπηρέτηση."
          );
          // TEMPORARILY REMOVED: Redirect to order tracking page
          // if (orderId) {
          //   router.push(`/${currentLang}/order/${orderId}`);
          // } else {
          //   router.push(`/${currentLang}`);
          // }
        }
        return; // Exit early for card payments
      }

      // Non-card payment - handle JSON response
      const result = await response.json();
      console.log("✅ Order created successfully:", result);

      // Set the order ID and save to active orders
      orderId =
        result.data?.order_id || result.data?.id || result.order_id;
      if (orderId) {
        console.log(`🆔 Setting order ID: ${orderId}`);
        setOrderId(orderId);

        // Save to active orders for tracking
        addActiveOrder(orderId, locationCart.locationName);

        // Clear the cart for this specific location
        clearLocationCart(locationCart.locationId);
        console.log(`🛒 Cleared cart for location ${locationCart.locationId}`);

        // Handle payment form if present in JSON response (fallback)
        if (paymentMethod === "card" && result.data?.payment_form) {
          try {
            console.log("💳 Opening payment form in new window (from JSON)");
            
            // Parse the payment form HTML to extract form data
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = result.data.payment_form;
            const form = tempDiv.querySelector('form');
            
            if (!form) {
              throw new Error("Could not find payment form in response");
            }

            // Extract form action and method
            const formAction = form.getAttribute('action') || '';
            const formMethod = form.getAttribute('method') || 'POST';
            
            // Create a hidden form element
            const hiddenForm = document.createElement('form');
            hiddenForm.method = formMethod;
            hiddenForm.action = formAction;
            hiddenForm.target = '_blank';
            hiddenForm.style.display = 'none';
            
            // Copy all input fields from the payment form
            form.querySelectorAll('input').forEach((input) => {
              const htmlInput = input as HTMLInputElement;
              const newInput = document.createElement('input');
              newInput.type = htmlInput.type || 'hidden';
              newInput.name = htmlInput.name;
              newInput.value = htmlInput.value;
              hiddenForm.appendChild(newInput);
            });
            
            // Append to body and submit (this works reliably on all browsers including iPhone Safari)
            document.body.appendChild(hiddenForm);
            
            // Submit the form - this will open the payment gateway in a new tab/window
            hiddenForm.submit();
            
            // Store a reference to indicate payment window is open
            setPaymentWindow(window);
            
            // Clean up the form after a short delay
            setTimeout(() => {
              try {
                if (document.body.contains(hiddenForm)) {
                  document.body.removeChild(hiddenForm);
                }
              } catch (e) {
                // Ignore cleanup errors
              }
            }, 1000);
          } catch (paymentError) {
            console.error("Error opening payment form:", paymentError);
            toast.error(
              "Σφάλμα κατά το άνοιγμα της φόρμας πληρωμής. Η παραγγελία δημιουργήθηκε. Παρακαλώ επικοινωνήστε με την εξυπηρέτηση."
            );
          }
        }

        // TEMPORARILY REMOVED: Redirect to order tracking page
        // router.push(`/${currentLang}/order/${orderId}`);
      } else {
        console.warn("⚠️ No orderId found in API response:", result);
        alert(
          "Η παραγγελία υποβλήθηκε αλλά δεν μπορέσαμε να λάβουμε το αναγνωριστικό."
        );
      }
    } catch (error) {
      console.error("Error submitting order:", error);

      // Safari-specific error handling
      let errorMessage =
        "Σφάλμα κατά την υποβολή της παραγγελίας. Παρακαλώ δοκιμάστε ξανά.";

      if (error instanceof TypeError) {
        if (
          error.message.includes("could not load") ||
          error.message.includes("Failed to fetch") ||
          error.message.includes("Load failed")
        ) {
          errorMessage =
            "Σφάλμα δικτύου. Παρακαλώ ελέγξτε τη σύνδεσή σας και δοκιμάστε ξανά. Αν το πρόβλημα επιμείνει, δοκιμάστε να ανανεώσετε τη σελίδα.";
        } else {
          errorMessage =
            "Σφάλμα υποβολής. Παρακαλώ ανανεώστε τη σελίδα και δοκιμάστε ξανά.";
        }
      } else if (error instanceof Error) {
        // Check for CORS-related errors
        if (
          error.message.includes("access control") ||
          error.message.includes("CORS") ||
          error.message.includes(process.env.NEXT_PUBLIC_API_URL || "")
        ) {
          errorMessage =
            "Σφάλμα ασφαλείας δικτύου. Παρακαλώ ανανεώστε τη σελίδα και δοκιμάστε ξανά.";
        } else {
          errorMessage = error.message || errorMessage;
        }
      }

      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 flex-shrink-0">
        <div className="container mx-auto px-3 sm:px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-1.5 sm:p-2 rounded-full bg-gray-800 text-white hover:bg-gray-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <h1 className="text-lg sm:text-xl font-bold text-white">
              Ολοκλήρωση παραγγελίας
            </h1>
          </div>
        </div>
      </div>

      {/* Main Content - Grid Layout */}
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
            {/* Left Column - Form */}
            <div className="lg:col-span-2 space-y-3 sm:space-y-4">
              {/* Customer Info */}
              <Card className="bg-gray-900 border-gray-800 p-3 sm:p-4">
                <h3 className="text-base sm:text-lg font-semibold text-white mb-3">
                  Στοιχεία πελάτη
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                  <div>
                    <label className="block text-gray-300 text-xs sm:text-sm mb-1">
                      Όνομα
                    </label>
                    <Input
                      value={
                        user?.name ||
                        `${user?.first_name || ""} ${
                          user?.last_name || ""
                        }`.trim() ||
                        ""
                      }
                      readOnly
                      className="bg-gray-800 border-gray-700 text-white h-9 sm:h-10 text-sm"
                      placeholder="Όνομα"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 text-xs sm:text-sm mb-1">
                      Email
                    </label>
                    <Input
                      value={user?.email || ""}
                      readOnly
                      className="bg-gray-800 border-gray-700 text-white h-9 sm:h-10 text-sm"
                      placeholder="Email"
                    />
                  </div>
                </div>
              </Card>

              {/* Order Type */}
              <Card className="bg-gray-900 border-gray-800 p-3 sm:p-4">
                <h3 className="text-base sm:text-lg font-semibold text-white mb-3">
                  Τρόπος παραλαβής
                </h3>
                <div className="space-y-2">
                  {(() => {
                    // Check minimum order for delivery
                    const deliveryMinOrder = locationData?.options
                      ?.delivery_min_order_amount
                      ? parseFloat(
                          locationData.options.delivery_min_order_amount
                        )
                      : 0;
                    const cartTotal = locationCart?.summary.total || 0;
                    const isDeliveryDisabledByMinOrder =
                      deliveryMinOrder > 0 && cartTotal < deliveryMinOrder;
                    // Don't disable delivery option based on availability - only based on minimum order
                    const isDeliveryDisabled = isDeliveryDisabledByMinOrder;

                    const deliveryInterval =
                      locationData?.options?.delivery_time_interval || 0;

                    return (
                      <label
                        className={`flex items-center gap-3 ${
                          isDeliveryDisabled
                            ? "cursor-not-allowed opacity-50"
                            : "cursor-pointer"
                        }`}
                      >
                        <input
                          type="radio"
                          name="orderType"
                          value="delivery"
                          checked={orderType === "delivery"}
                          onChange={(e) =>
                            setOrderType(e.target.value as "delivery")
                          }
                          disabled={isDeliveryDisabled}
                          className="w-4 h-4 text-primary disabled:cursor-not-allowed"
                        />
                        <div className="flex items-center gap-2 flex-1">
                          <MapPin className="w-4 h-4 text-blue-400" />
                          <span className="text-white">Παράδοση</span>
                          {!isDeliveryDisabled && deliveryInterval > 0 && (
                            <span className="text-gray-400 text-xs sm:text-sm ml-auto">
                              Εκτιμώμενος χρόνος: {deliveryInterval} λεπτά
                            </span>
                          )}
                          {isDeliveryDisabledByMinOrder && (
                            <span className="text-red-400 text-sm ml-auto">
                              Ελάχιστη παραγγελία: {deliveryMinOrder.toFixed(2)}
                              €
                            </span>
                          )}
                        </div>
                      </label>
                    );
                  })()}
                  {(() => {
                    // Check minimum order for pickup
                    const pickupMinOrder = locationData?.options
                      ?.collection_min_order_amount
                      ? parseFloat(
                          locationData.options.collection_min_order_amount
                        )
                      : 0;
                    const cartTotal = locationCart?.summary.total || 0;
                    const isPickupDisabledByMinOrder =
                      pickupMinOrder > 0 && cartTotal < pickupMinOrder;

                    return (
                      <label
                        className={`flex items-center gap-2 sm:gap-3 ${
                          isPickupDisabledByMinOrder
                            ? "cursor-not-allowed opacity-50"
                            : "cursor-pointer"
                        }`}
                      >
                        <input
                          type="radio"
                          name="orderType"
                          value="pickup"
                          checked={orderType === "pickup"}
                          onChange={(e) =>
                            setOrderType(e.target.value as "pickup")
                          }
                          disabled={isPickupDisabledByMinOrder}
                          className="w-4 h-4 text-primary disabled:cursor-not-allowed"
                        />
                        <div className="flex items-center gap-2 flex-1">
                          <Package className="w-4 h-4 text-green-400" />
                          <span className="text-white text-sm sm:text-base">
                            Παραλαβή
                          </span>
                          {!isPickupDisabledByMinOrder &&
                            locationData?.options?.collection_time_interval && (
                              <span className="text-gray-400 text-xs sm:text-sm ml-auto">
                                Εκτιμώμενος χρόνος:{" "}
                                {locationData.options.collection_time_interval}{" "}
                                λεπτά
                              </span>
                            )}
                          {isPickupDisabledByMinOrder && (
                            <span className="text-red-400 text-sm ml-auto">
                              Ελάχιστη παραγγελία: {pickupMinOrder.toFixed(2)}€
                            </span>
                          )}
                        </div>
                      </label>
                    );
                  })()}
                </div>
              </Card>

              {/* Delivery Address (only if delivery is selected) */}
              {orderType === "delivery" && (
                <Card className="bg-gray-900 border-gray-800 p-3 sm:p-4">
                  <h3 className="text-base sm:text-lg font-semibold text-white mb-3">
                    Διεύθυνση παράδοσης
                  </h3>
                  {userLocation ? (
                    <div className="space-y-2 sm:space-y-3">
                      <div className="flex gap-2">
                        {isAuthenticated && (
                          <Button
                            onClick={() => setIsAddressBookModalOpen(true)}
                            className="flex-1 bg-blue-600 text-white hover:bg-blue-700 h-9 sm:h-10 text-xs sm:text-sm"
                          >
                            <MapPin className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                            <span className="truncate">
                              Επιλεξτε αποθηκευμένες
                            </span>
                          </Button>
                        )}
                        <Button
                          onClick={handleResetAddress}
                          variant="outline"
                          className={`bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white h-9 sm:h-10 ${
                            isAuthenticated ? "px-3 sm:px-4" : "flex-1"
                          }`}
                          title="Επαναφορά διεύθυνσης"
                        >
                          <X className="w-4 h-4 mr-2" />
                          <span className="text-xs sm:text-sm">Επαναφορά</span>
                        </Button>
                      </div>
                      <div>
                        <label className="block text-gray-300 text-xs sm:text-sm mb-1">
                          Διεύθυνση
                        </label>
                        <Input
                          value={`${
                            userLocation.addressDetails.street || ""
                          }`.trim()}
                          readOnly
                          className="bg-gray-800 border-gray-700 text-white h-9 sm:h-10 text-sm"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2 sm:gap-3">
                        <div>
                          <label className="block text-gray-300 text-xs sm:text-sm mb-1">
                            Πόλη
                          </label>
                          <Input
                            value={userLocation.city}
                            readOnly
                            className="bg-gray-800 border-gray-700 text-white h-9 sm:h-10 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-300 text-xs sm:text-sm mb-1">
                            Τ.Κ.
                          </label>
                          <Input
                            value={userLocation.addressDetails.postalCode || ""}
                            readOnly
                            className="bg-gray-800 border-gray-700 text-white h-9 sm:h-10 text-sm"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 sm:gap-3">
                        <div>
                          <label className="block text-gray-300 text-xs sm:text-sm mb-1">
                            Κουδούνι
                          </label>
                          <Input
                            value={bellName}
                            onChange={(e) => setBellName(e.target.value)}
                            placeholder="π.χ. Παππάς"
                            className="bg-gray-800 border-gray-700 text-white h-9 sm:h-10 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-300 text-xs sm:text-sm mb-1">
                            Όροφος
                          </label>
                          <Input
                            value={floor}
                            onChange={(e) => setFloor(e.target.value)}
                            placeholder="π.χ. 3"
                            className="bg-gray-800 border-gray-700 text-white h-9 sm:h-10 text-sm"
                          />
                        </div>
                      </div>
                      {isAuthenticated && (
                        <div className="flex items-center space-x-2 pt-1">
                          
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2 sm:space-y-3">
                      <p className="text-gray-400 text-xs sm:text-sm">
                        Χρησιμοποιήστε την τοποθεσία από τη γραμμή πλοήγησης ή
                        εισάγετε μια νέα διεύθυνση
                      </p>
                      {isAuthenticated && (
                        <Button
                          onClick={() => setIsAddressBookModalOpen(true)}
                          disabled={isLoadingLocation}
                          className="w-full bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed h-9 sm:h-10 text-xs sm:text-sm"
                        >
                          <MapPin className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                          <span className="truncate">
                            Επιλεξτε αποθηκευμένες
                          </span>
                        </Button>
                      )}
                      <Button
                        onClick={handleAutocompleteFromNavbar}
                        disabled={!coordinates || isLoadingLocation}
                        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed h-9 sm:h-10 text-xs sm:text-sm"
                      >
                        {isLoadingLocation ? (
                          <>
                            <div className="w-3 h-3 sm:w-4 sm:h-4 mr-2 rounded bg-muted animate-pulse"></div>
                            Φόρτωση...
                          </>
                        ) : (
                          <>
                            <MapPin className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                            <span className="truncate">
                              Χρησιμοποίησε τοποθεσία
                            </span>
                          </>
                        )}
                      </Button>
                      <div>
                        <label className="block text-gray-300 text-xs sm:text-sm mb-1">
                          Ή εισάγετε διεύθυνση
                        </label>
                        <GooglePlacesCustom
                          onPlaceSelect={handleGooglePlaceSelect}
                          value={addressInput}
                          onChange={setAddressInput}
                          placeholder="Εισάγετε διεύθυνση παράδοσης..."
                          className="bg-gray-800 border-gray-700 text-white h-9 sm:h-10 text-sm"
                        />
                      </div>
                    </div>
                  )}
                </Card>
              )}
            </div>

            {/* Right Column - Order Summary (Sticky on desktop) */}
            <div className="lg:col-span-3">
              <div className="lg:sticky lg:top-4 space-y-3 sm:space-y-4">
                {/* Payment Method */}
                <Card className="bg-gray-900 border-gray-800 p-3 sm:p-4">
                  <h3 className="text-base sm:text-lg font-semibold text-white mb-3">
                    Τρόπος πληρωμής
                  </h3>
                  <div className="space-y-3">
                    <label className="flex items-center gap-2 sm:gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="cash"
                        checked={paymentMethod === "cash"}
                        onChange={(e) =>
                          setPaymentMethod(e.target.value as "cash" | "card")
                        }
                        className="w-4 h-4 text-primary"
                      />
                      <div className="flex items-center gap-2">
                        <span className="text-white text-sm sm:text-base">
                          Πληρωμή στην παράδοση/παραλαβή
                        </span>
                      </div>
                    </label>
                    <label className="flex items-center gap-2 sm:gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="card"
                        checked={paymentMethod === "card"}
                        onChange={(e) =>
                          setPaymentMethod(e.target.value as "cash" | "card")
                        }
                        className="w-4 h-4 text-primary"
                      />
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-blue-400" />
                        <span className="text-white text-sm sm:text-base">
                          ΔΟΚΙΜΑΣΤΙΚΗ ΜΕΘΟΔΟΣ (ΜΗΝ , ΔΕΝ ΘΑ ΛΑΒΟΥΜΕ ΠΑΡΑΓΓΕΛΙΑ)
                        </span>
                      </div>
                    </label>
                  </div>
                </Card>

                {/* Order Comments */}
                <Card className="bg-gray-900 border-gray-800 p-3 sm:p-4">
                  <h3 className="text-base sm:text-lg font-semibold text-white mb-3">
                    Σχόλια παραγγελίας
                  </h3>
                  <textarea
                    value={orderComments}
                    onChange={(e) => setOrderComments(e.target.value)}
                    placeholder="Προσθέστε σχόλια για την παραγγελία σας..."
                    className="w-full h-20 sm:h-24 bg-gray-800 border border-gray-700 rounded-lg p-2 sm:p-3 text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  />
                </Card>

                {/* Order Summary */}
                <Card className="bg-gray-900 border-gray-800 p-3 sm:p-4">
                  <h3 className="text-base sm:text-lg font-semibold text-white mb-3">
                    Σύνοψη παραγγελίας
                  </h3>
                  <div className="space-y-2 sm:space-y-3 max-h-[calc(100vh-250px)] overflow-y-auto">
                    {locationCart.items.map((item) => (
                      <div
                        key={item.rowId}
                        onClick={() => handleItemClick(item)}
                        className="border-b border-gray-700 pb-3 last:border-b-0 cursor-pointer hover:bg-gray-800/50 rounded-lg p-2 transition-colors"
                      >
                        {/* Title Row with Controls */}
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2 flex-1">
                            <span className="text-gray-300 text-[15px] font-medium">
                              {item.name}
                            </span>
                            
                            {/* Quantity Controls */}
                            <div className="flex items-center gap-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleQuantityChange(item, item.qty - 1);
                                }}
                                disabled={item.qty <= 1}
                                className="p-2 rounded bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                title="Μείωση ποσότητας"
                              >
                                <Minus className="w-4 h-4 text-white" />
                              </button>
                              <span className="text-white text-sm font-medium min-w-[1.5rem] text-center">
                                {item.qty}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleQuantityChange(item, item.qty + 1);
                                }}
                                className="p-2 rounded bg-gray-800 hover:bg-gray-700 transition-colors"
                                title="Αύξηση ποσότητας"
                              >
                                <Plus className="w-4 h-4 text-white" />
                              </button>
                            </div>

                            {/* Remove Button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveItem(item);
                              }}
                              className="p-2 rounded bg-red-600/20 hover:bg-red-600/30 text-red-400 hover:text-red-300 transition-colors"
                              title="Αφαίρεση"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <span className="text-white font-medium text-sm whitespace-nowrap">
                            €{item.subtotal.toFixed(2)}
                          </span>
                        </div>

                        {/* Display menu options if any */}
                        {item.options && item.options.length > 0 && (
                          <div className="ml-2 sm:ml-4 mt-1 space-y-0.5 sm:space-y-1 mb-2">
                            {item.options.flatMap((opt) =>
                              opt.values.map((val, index) => (
                                <div
                                  key={`${item.rowId}-${opt.menu_option_id}-${val.menu_option_value_id}-${index}`}
                                  className="flex justify-between items-center text-xs sm:text-sm"
                                >
                                  <span className="text-gray-400">
                                    + {val.option_value_name}
                                    {val.price > 0 &&
                                      ` (€${val.price.toFixed(2)})`}
                                  </span>
                                </div>
                              ))
                            )}
                          </div>
                        )}

                        {/* Display item comment if any */}
                        {item.comment && (
                          <div className="ml-2 sm:ml-4 mt-1 mb-2">
                            <span className="text-gray-400 text-xs sm:text-sm italic">
                              "{item.comment}"
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                    <div className="border-t border-gray-700 pt-2 mt-2">
                      <div className="flex justify-between items-center">
                        <span className="text-white font-semibold text-sm sm:text-base">
                          Σύνολο
                        </span>
                        <span className="text-white font-bold text-base sm:text-lg">
                          €{locationCart.summary.total.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Submit Button - Moved to summary card */}
                  {(() => {
                    const deliveryData = locationCart
                      ? getDeliveryData(locationCart.locationId)
                      : null;
                    const isOutsideDeliveryArea =
                      orderType === "delivery" &&
                      deliveryData &&
                      !deliveryData.is_within_delivery_area;

                    // Use hook status first (most up-to-date), fallback to locationCart status
                    const isRestaurantOpen =
                      restaurantStatus?.is_open ??
                      locationCart?.restaurantStatus?.isOpen ??
                      true;
                    const isRestaurantClosed = !isRestaurantOpen;

                    // Get status message from hook first, then fallback to locationCart
                    const statusMessage =
                      restaurantStatus?.status_message ||
                      locationCart?.restaurantStatus?.statusMessage ||
                      "Το εστιατόριο είναι κλειστό. Δεν μπορείτε να υποβάλετε παραγγελία.";

                    // Check minimum order requirements
                    const deliveryMinOrder = locationData?.options
                      ?.delivery_min_order_amount
                      ? parseFloat(
                          locationData.options.delivery_min_order_amount
                        )
                      : 0;
                    const pickupMinOrder = locationData?.options
                      ?.collection_min_order_amount
                      ? parseFloat(
                          locationData.options.collection_min_order_amount
                        )
                      : 0;
                    const cartTotal = locationCart?.summary.total || 0;

                    const deliveryMeetsMin =
                      deliveryMinOrder === 0 || cartTotal >= deliveryMinOrder;
                    const pickupMeetsMin =
                      pickupMinOrder === 0 || cartTotal >= pickupMinOrder;

                    // Check if current order type meets minimum
                    // Don't check delivery availability here - delivery option stays enabled
                    const currentOrderTypeMeetsMin =
                      orderType === "delivery"
                        ? deliveryMeetsMin
                        : pickupMeetsMin;

                    // Block checkout if neither option meets minimum
                    const isBlockedByMinOrder =
                      !deliveryMeetsMin && !pickupMeetsMin;

                    // Check if delivery is blocked
                    const isDeliveryBlockedForCheckout =
                      orderType === "delivery" &&
                      locationCart &&
                      isDeliveryBlocked(locationCart.locationId);

                    return (
                      <div className="space-y-2 mt-4">
                        <Button
                          onClick={handleSubmitOrder}
                          disabled={
                            isSubmitting ||
                            isLoadingRestaurantStatus ||
                            isRestaurantClosed ||
                            isBlockedByMinOrder ||
                            isDeliveryBlockedForCheckout ||
                            !currentOrderTypeMeetsMin
                          }
                          className={`w-full py-2.5 sm:py-3 text-sm sm:text-base font-medium transition-all duration-200 ${
                            isRestaurantClosed ||
                            isBlockedByMinOrder ||
                            isDeliveryBlockedForCheckout ||
                            !currentOrderTypeMeetsMin
                              ? "bg-gray-600 text-gray-400 cursor-not-allowed opacity-50"
                              : "bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                          }`}
                        >
                          {isSubmitting
                            ? "Υποβολή..."
                            : isLoadingRestaurantStatus
                            ? "Ελέγχοντας..."
                            : isRestaurantClosed
                            ? "Το εστιατόριο είναι κλειστό"
                            : isBlockedByMinOrder
                            ? "Ελάχιστη παραγγελία δεν έχει συμπληρωθεί"
                            : isDeliveryBlockedForCheckout
                            ? "Διεύθυνση εκτός εύρους"
                            : !currentOrderTypeMeetsMin
                            ? "Ελάχιστη παραγγελία δεν έχει συμπληρωθεί"
                            : "Υποβολή παραγγελίας"}
                        </Button>
                        {isRestaurantClosed && !isLoadingRestaurantStatus && (
                          <p className="text-red-400 text-xs sm:text-sm text-center">
                            {statusMessage}
                          </p>
                        )}
                        {isBlockedByMinOrder && !isRestaurantClosed && (
                          <p className="text-red-400 text-xs sm:text-sm text-center">
                            Ελάχιστη παραγγελία δεν έχει συμπληρωθεί
                          </p>
                        )}
                        {isDeliveryBlockedForCheckout &&
                          !isRestaurantClosed &&
                          !isBlockedByMinOrder && (
                            <p className="text-red-400 text-xs sm:text-sm text-center">
                              Το κατάστημα δεν εξυπηρετεί την συγκεκριμένη
                              διεύθυνση. Παρακαλώ επιλέξτε διαφορετική διεύθυνση
                              ή την επιλογή παραλαβή
                            </p>
                          )}
                      </div>
                    );
                  })()}
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Address Book Modal */}
      <AddressBookModal
        isOpen={isAddressBookModalOpen}
        onClose={() => setIsAddressBookModalOpen(false)}
        onAddressSelect={handleAddressBookSelect}
      />

      {/* Menu Options Modal for Editing */}
      {menuItemForEdit && (
        <MenuOptionsModal
          isOpen={isMenuOptionsModalOpen}
          onClose={() => {
            setIsMenuOptionsModalOpen(false);
            setEditingItem(null);
            setMenuItemForEdit(null);
          }}
          menuItem={menuItemForEdit}
          onAddToCart={handleMenuOptionsSubmit}
          initialSelectedOptions={
            editingItem?.options
              ? editingItem.options.map((opt) => ({
                  menu_option_id: opt.menu_option_id,
                  option_name: opt.option_name,
                  selected_values: opt.values.map((val) => ({
                    menu_option_value_id: val.menu_option_value_id,
                    name: val.option_value_name,
                    price: val.price,
                  })),
                }))
              : undefined
          }
          initialQuantity={editingItem?.qty}
          initialComment={editingItem?.comment || ""}
          confirmLabel="Ενημέρωση"
          isSubmitting={isUpdatingItem}
        />
      )}
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="text-center">
            <div className="text-white text-lg mb-2">Loading...</div>
          </div>
        </div>
      }
    >
      <CheckoutPageContent />
    </Suspense>
  );
}
