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
    if (segments[0] === "el" || segments[0] === "en") {
      return segments[0];
    }
    return "el";
  }, [pathname]);

  const locationId = searchParams.get("locationId");
  const locationCart = locationId
    ? getLocationCart(parseInt(locationId))
    : null;

  // Redirect to main page if there's no cart
  useEffect(() => {
    if (!locationId) {
      router.push(`/${currentLang}`);
      return;
    }

    if (isCartLoading) {
      return;
    }

    if (locationId && !locationCart) {
      const timer = setTimeout(() => {
        const currentCart = getLocationCart(parseInt(locationId));
        if (!currentCart) {
          router.push(`/${currentLang}`);
        }
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [locationCart, locationId, currentLang, router, isCartLoading, getLocationCart]);

  const [locationData, setLocationData] = useState<Location | null>(null);

  const { status: restaurantStatus, isLoading: isLoadingRestaurantStatus } =
    useRestaurantStatus(locationId ? parseInt(locationId) : null);

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

  const handleRemoveItem = async (item: CartItem) => {
    if (!locationCart) return;
    const success = await removeItem(locationCart.locationId, item.rowId);
    if (success && locationCart.items.length === 1) {
      router.push(`/${currentLang}`);
    }
  };

  const handleQuantityChange = async (item: CartItem, newQuantity: number) => {
    if (!locationCart || newQuantity < 1) return;
    await updateQuantity(locationCart.locationId, item.rowId, newQuantity);
  };

  const handleItemClick = async (item: CartItem) => {
    if (!locationCart) return;

    setIsLoadingMenuItem(true);
    setEditingItem(item);
    setIsMenuOptionsModalOpen(true);
    setMenuItemForEdit(null);

    try {
      const response = await fetch(`/api/menu-items/${item.id}/options`);

      if (!response.ok) {
        throw new Error("Failed to fetch menu item options");
      }

      const data = await response.json();
      
      if (data.success && data.data && data.data.options) {
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

  const handleMenuOptionsSubmit = async (
    menuItem: any,
    optionValues: any[],
    quantity: number,
    comment: string
  ) => {
    if (!editingItem || !locationCart || !user?.id) return;

    setIsUpdatingItem(true);

    try {
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

  const handleResetAddress = () => {
    setUserLocation(null);
    setBellName("");
    setFloor("");
    setAddressInput("");
    setSaveAddress(false);
    toast.success("Η διεύθυνση διαγράφηκε");
  };

  const handleAutocompleteFromNavbar = async () => {
    if (!coordinates) {
      toast.error("Δεν υπάρχει τοποθεσία στην γραμμή πλοήγησης");
      return;
    }

    setIsLoadingLocation(true);
    try {
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
        bell_name: formattedAddress?.bell_name || null,
        floor: formattedAddress?.floor || null,
        addressId: null,
      };

      setUserLocation(location);

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

  const handleAddressBookSelect = async (address: any) => {
    let latitude: number | undefined;
    let longitude: number | undefined;

    if (address.latitude !== undefined && address.longitude !== undefined) {
      latitude =
        typeof address.latitude === "string"
          ? parseFloat(address.latitude)
          : address.latitude;
      longitude =
        typeof address.longitude === "string"
          ? parseFloat(address.longitude)
          : address.longitude;
    } else if (address.coordinates) {
      latitude =
        typeof address.coordinates.latitude === "string"
          ? parseFloat(address.coordinates.latitude)
          : address.coordinates.latitude;
      longitude =
        typeof address.coordinates.longitude === "string"
          ? parseFloat(address.coordinates.longitude)
          : address.coordinates.longitude;
    }

    setIsLoadingLocation(true);
    try {
      let location: UserLocation;

      const hasApiFields =
        address.address_1 && address.city && address.postcode;

      if (latitude !== undefined && longitude !== undefined) {
        const geocoded = await reverseGeocode(latitude, longitude, currentLang);

        if (geocoded && !hasApiFields) {
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
        location = {
          city:
            address.city ||
            address.address.split(",")[1]?.trim() ||
            address.address.split(",")[0]?.trim() ||
            "Unknown Location",
          fullAddress: address.address,
          coordinates: {
            latitude: 37.9755,
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

      if (address.bell_name) {
        setBellName(address.bell_name);
      }
      if (address.floor) {
        setFloor(address.floor);
      }

      if (
        latitude !== undefined &&
        longitude !== undefined &&
        locationCart?.locationId
      ) {
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

          if (deliveryData.success && deliveryData.data) {
            const deliveryAvailabilityData = {
              is_delivery_available: deliveryData.data.is_delivery_available,
              is_within_delivery_area:
                deliveryData.data.is_within_delivery_area,
              delivery_enabled: deliveryData.data.delivery_enabled,
              distance: deliveryData.data.distance,
            };

            setDeliveryData(locationCart.locationId, deliveryAvailabilityData);
          }
        } catch (deliveryError) {
          console.error(
            "Error checking delivery availability for selected address:",
            deliveryError
          );
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

  const handleGooglePlaceSelect = async (place: any) => {
    if (!place.formatted_address || !place.geometry?.location) {
      toast.error("Παρακαλώ επιλέξτε μια έγκυρη διεύθυνση");
      return;
    }

    const lat = place.geometry.location.lat();
    const lng = place.geometry.location.lng();

    setIsLoadingLocation(true);
    try {
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
          bell_name: geocoded.bell_name || null,
          floor: geocoded.floor || null,
          addressId: null,
        };

        setUserLocation(location);
        if (geocoded.bell_name) {
          setBellName(geocoded.bell_name);
        }
        if (geocoded.floor) {
          setFloor(geocoded.floor);
        }
        setAddressInput("");

        if (locationCart?.locationId) {
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
            }
          } catch (deliveryError) {
            console.error(
              "Error checking delivery availability for Google Places address:",
              deliveryError
            );
          }
        }

        toast.success("Η διεύθυνση ορίστηκε");
      } else {
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
          addressId: null,
        };
        setUserLocation(location);
        setAddressInput("");

        if (locationCart?.locationId) {
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

  useEffect(() => {
    if (orderType === "delivery" && coordinates && !userLocation) {
      handleAutocompleteFromNavbar();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderType, coordinates]);

  useEffect(() => {
    const checkDeliveryAvailability = async () => {
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
        return;
      }

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

        if (data.success && data.data) {
          const deliveryAvailabilityData = {
            is_delivery_available: data.data.is_delivery_available,
            is_within_delivery_area: data.data.is_within_delivery_area,
            delivery_enabled: data.data.delivery_enabled,
            distance: data.data.distance,
          };

          setDeliveryData(locationCart.locationId, deliveryAvailabilityData);
        }
      } catch (error) {
        console.error(
          "🛒 [CHECKOUT] Error checking delivery availability:",
          error
        );
      } finally {
        setIsCheckingDelivery(false);
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

  useEffect(() => {
    if (formattedAddress) {
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

  useEffect(() => {
    if (userLocation) {
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

  useEffect(() => {
    if (!isConnected) return;
    if (!orderId) return;

    const channelName = `order.${orderId}`;
    const channel = subscribe(channelName);

    if (channel) {
      channel.bind("pusher:subscription_succeeded", () => {});
      channel.bind("pusher:subscription_error", (error: any) => {
        console.error(`❌ Failed to subscribe to ${channelName}:`, error);
      });
      channel.bind("orderStatusUpdated", (data: any) => {
        console.log(`📦 Order ${orderId} status updated:`, data);
      });
    }

    return () => {
      unsubscribe(channelName);
    };
  }, [isConnected, orderId, subscribe, unsubscribe]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      
      if (event.data?.type === "PAYMENT_STATUS") {
        if (event.data.paymentVerified === true) {
          if (locationCart) {
            clearLocationCart(locationCart.locationId);
          }
          toast.success("Η πληρωμή επιβεβαιώθηκε επιτυχώς!");
          if (orderId) {
            router.push(`/${currentLang}/order/${orderId}`);
          }
        } else {
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
    if (!isAuthenticated || !user) {
      alert("Παρακαλώ συνδεθείτε για να ολοκληρώσετε την παραγγελία.");
      return;
    }

    // Open payment window synchronously on user click (required for Safari)
    let paymentWin: Window | null = null;
    if (paymentMethod === "card") {
      paymentWin = window.open("", "_blank");
      if (paymentWin) {
        setPaymentWindow(paymentWin);
        // Show loading message immediately
        paymentWin.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Πληρωμή</title>
              <meta charset="UTF-8">
              <style>
                body {
                  margin: 0;
                  padding: 0;
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  min-height: 100vh;
                  background: #000;
                  color: #fff;
                }
                .loading-container {
                  text-align: center;
                }
                .spinner {
                  border: 3px solid #333;
                  border-top: 3px solid #ff9328;
                  border-radius: 50%;
                  width: 40px;
                  height: 40px;
                  animation: spin 1s linear infinite;
                  margin: 0 auto 20px;
                }
                @keyframes spin {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
                .message {
                  font-size: 16px;
                  color: #ccc;
                }
              </style>
            </head>
            <body>
              <div class="loading-container">
                <div class="spinner"></div>
                <div class="message">Προετοιμασία πληρωμής...</div>
              </div>
            </body>
          </html>
        `);
        paymentWin.document.close();
      }
    }

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

    if (orderType === "delivery" && locationCart) {
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

    if (!locationId || !locationCart) {
      toast.error("Σφάλμα: Δεν βρέθηκε τοποθεσία");
      return;
    }

    setIsSubmitting(true);

    try {
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

      const location = statusData.data.locations.find(
        (loc: any) => loc.id === parseInt(locationId)
      );

      if (!location) {
        setIsSubmitting(false);
        toast.error("Σφάλμα: Δεν βρέθηκε τοποθεσία");
        return;
      }

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
      const formattedItems = locationCart.items.map((item) => {
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
          telephone: user?.telephone || user?.phone || "",
          name:
            user.name ||
            `${user.first_name || ""} ${user.last_name || ""}`.trim(),
        },
      };

      if (orderType === "delivery" && userLocation?.addressId && !orderData.address_id) {
        orderData.address_id = userLocation.addressId;
      }

      if (orderType === "delivery" && userLocation) {
        let address_1 = userLocation.addressDetails?.street || "";
        let postalCode = userLocation.addressDetails?.postalCode || "";

        if (!address_1 || !postalCode) {
          const fullAddr = userLocation.fullAddress || "";
          
          const postalCodeMatch = fullAddr.match(/(\d+\s+\d+|\d{5,})(?=\s*$)/);
          if (postalCodeMatch) {
            postalCode = postalCodeMatch[0].replace(/\s+/g, "");
          }

          let addressPart = fullAddr;
          if (postalCodeMatch && postalCodeMatch.index !== undefined) {
            addressPart = fullAddr.substring(0, postalCodeMatch.index).trim();
          }
          
          const commaIndex = addressPart.lastIndexOf(",");
          if (commaIndex !== -1) {
            address_1 = addressPart.substring(0, commaIndex).trim();
          } else {
            address_1 = addressPart.trim();
          }

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

      if (
        saveAddress === true &&
        isAuthenticated &&
        user?.id &&
        orderType === "delivery" &&
        userLocation
      ) {
        try {
          const csrfResponse = await fetch("/api/csrf");
          const csrfData = await csrfResponse.json();

          if (csrfData.csrfToken) {
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

            const addressResponse = await fetch("/api/address-book/create", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-csrf-token": csrfData.csrfToken,
              },
              body: JSON.stringify(addressPayload),
            });

            if (addressResponse.ok) {
              toast.success("Η διεύθυνση αποθηκεύτηκε στο βιβλίο διευθύνσεων");
            }
          }
        } catch (error) {
          console.error("⚠️ Error saving address:", error);
        }
      }

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

      const contentType = response.headers.get("content-type") || "";
      let orderId: number | null = null;

      if (contentType.includes("text/html")) {
        // HTML response means card payment - extract order ID from response
        try {
          const paymentFormHtml = await response.text();
          
          // Extract order ID from the form
          const orderIdMatch = paymentFormHtml.match(/name="MerchantReference"[^>]*value="(\d+)"/);
          if (orderIdMatch) {
            orderId = parseInt(orderIdMatch[1]);
            setOrderId(orderId);
            addActiveOrder(orderId, locationCart.locationName);
          }

          // Don't clear cart yet - wait for payment confirmation
          // Cart will be cleared when payment status is received

          // Redirect the already-opened window to payment redirect page with orderId
          if (paymentWin && !paymentWin.closed) {
            const redirectUrl = `/${currentLang}/payment/redirect?orderId=${orderId || ""}&lang=${currentLang}`;
            paymentWin.location.href = redirectUrl;
          } else {
            throw new Error("Payment window was closed or blocked");
          }

        } catch (paymentError) {
          console.error("Error handling card payment:", paymentError);
          toast.error(
            "Σφάλμα κατά το άνοιγμα της φόρμας πληρωμής. Η παραγγελία δημιουργήθηκε. Παρακαλώ επικοινωνήστε με την εξυπηρέτηση."
          );
        }
        return;
      }

      const result = await response.json();

      orderId =
        result.data?.order_id || result.data?.id || result.order_id;
      if (orderId) {
        setOrderId(orderId);

        addActiveOrder(orderId, locationCart.locationName);

        if (paymentMethod === "card") {
          // Don't clear cart yet - wait for payment confirmation
          // Cart will be cleared when payment status is received
          try {
            // Redirect the already-opened window to payment redirect page with orderId
            if (paymentWin && !paymentWin.closed) {
              const redirectUrl = `/${currentLang}/payment/redirect?orderId=${orderId || ""}&lang=${currentLang}`;
              paymentWin.location.href = redirectUrl;
            } else {
              throw new Error("Payment window was closed or blocked");
            }
          } catch (paymentError) {
            console.error("Error opening payment form:", paymentError);
            toast.error(
              "Σφάλμα κατά το άνοιγμα της φόρμας πληρωμής. Η παραγγελία δημιουργήθηκε. Παρακαλώ επικοινωνήστε με την εξυπηρέτηση."
            );
          }
        } else if (paymentMethod === "cash") {
          // For cash payments, clear cart immediately since there's no payment gateway
          clearLocationCart(locationCart.locationId);
          toast.success("Η παραγγελία υποβλήθηκε επιτυχώς!");
          router.push(`/${currentLang}/order/${orderId}`);
        }
      } else {
        alert(
          "Η παραγγελία υποβλήθηκε αλλά δεν μπορέσαμε να λάβουμε το αναγνωριστικό."
        );
      }
    } catch (error) {
      console.error("Error submitting order:", error);

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
    <div className="min-h-screen bg-black flex flex-col font-sans">
      {/* Header */}
      <div className="bg-zinc-900 border-b border-zinc-800 flex-shrink-0 sticky top-0 z-20">
        <div className="container mx-auto px-3 sm:px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-1.5 sm:p-2 rounded-full bg-black border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
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
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-6 max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 sm:gap-6 lg:gap-8">
            {/* Left Column - Form */}
            <div className="lg:col-span-2 space-y-3 sm:space-y-6">
              {/* Delivery Address (only if delivery is selected) */}
              {orderType === "delivery" && (
                <Card className="bg-zinc-900 border-zinc-800 p-4 sm:p-6 shadow-xl rounded-xl">
                  <h3 className="text-base sm:text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-[#ff9328]" />
                    Διεύθυνση παράδοσης
                  </h3>
                  {userLocation ? (
                    <div className="space-y-4">
                      <div className="flex gap-2">
                        {isAuthenticated && (
                          <Button
                            onClick={() => setIsAddressBookModalOpen(true)}
                            className="flex-1 bg-zinc-800 text-white hover:bg-zinc-700 h-10 text-xs sm:text-sm border border-zinc-700"
                          >
                            <span className="truncate">
                              Επιλέξτε αποθηκευμένες
                            </span>
                          </Button>
                        )}
                        <Button
                          onClick={handleResetAddress}
                          variant="outline"
                          className={`bg-black border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-white h-10 ${
                            isAuthenticated ? "px-3 sm:px-4" : "flex-1"
                          }`}
                          title="Επαναφορά διεύθυνσης"
                        >
                          <X className="w-4 h-4 mr-2" />
                          <span className="text-xs sm:text-sm">Επαναφορά</span>
                        </Button>
                      </div>
                      <div>
                        <label className="block text-zinc-400 text-xs sm:text-sm mb-1.5 font-medium">
                          Διεύθυνση
                        </label>
                        <Input
                          value={`${
                            userLocation.addressDetails.street || ""
                          }`.trim()}
                          readOnly
                          className="bg-black border-zinc-800 text-white h-10 text-sm focus:ring-[#ff9328] focus:border-[#ff9328]"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-zinc-400 text-xs sm:text-sm mb-1.5 font-medium">
                            Πόλη
                          </label>
                          <Input
                            value={userLocation.city}
                            readOnly
                            className="bg-black border-zinc-800 text-white h-10 text-sm focus:ring-[#ff9328] focus:border-[#ff9328]"
                          />
                        </div>
                        <div>
                          <label className="block text-zinc-400 text-xs sm:text-sm mb-1.5 font-medium">
                            Τ.Κ.
                          </label>
                          <Input
                            value={userLocation.addressDetails.postalCode || ""}
                            readOnly
                            className="bg-black border-zinc-800 text-white h-10 text-sm focus:ring-[#ff9328] focus:border-[#ff9328]"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-zinc-400 text-xs sm:text-sm mb-1.5 font-medium">
                            Κουδούνι
                          </label>
                          <Input
                            value={bellName}
                            onChange={(e) => setBellName(e.target.value)}
                            placeholder="π.χ. Παππάς"
                            className="bg-black border-zinc-800 text-white h-10 text-sm focus:ring-[#ff9328] focus:border-[#ff9328]"
                          />
                        </div>
                        <div>
                          <label className="block text-zinc-400 text-xs sm:text-sm mb-1.5 font-medium">
                            Όροφος
                          </label>
                          <Input
                            value={floor}
                            onChange={(e) => setFloor(e.target.value)}
                            placeholder="π.χ. 3"
                            className="bg-black border-zinc-800 text-white h-10 text-sm focus:ring-[#ff9328] focus:border-[#ff9328]"
                          />
                        </div>
                      </div>
                      {isAuthenticated && (
                        <div className="flex items-center space-x-2 pt-1">
                          
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-zinc-500 text-sm">
                        Χρησιμοποιήστε την τοποθεσία από τη γραμμή πλοήγησης ή
                        εισάγετε μια νέα διεύθυνση
                      </p>
                      {isAuthenticated && (
                        <Button
                          onClick={() => setIsAddressBookModalOpen(true)}
                          disabled={isLoadingLocation}
                          className="w-full bg-zinc-800 text-white hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed h-10 text-sm border border-zinc-700"
                        >
                          <span className="truncate">
                            Επιλέξτε αποθηκευμένες
                          </span>
                        </Button>
                      )}
                      <Button
                        onClick={handleAutocompleteFromNavbar}
                        disabled={!coordinates || isLoadingLocation}
                        className="w-full bg-[#ff9328] text-white hover:bg-[#915316] disabled:opacity-50 disabled:cursor-not-allowed h-10 text-sm"
                      >
                        {isLoadingLocation ? (
                          <>
                            <div className="w-4 h-4 mr-2 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                            Φόρτωση...
                          </>
                        ) : (
                          <>
                            <MapPin className="w-4 h-4 mr-2" />
                            <span className="truncate">
                              Χρησιμοποίησε τοποθεσία
                            </span>
                          </>
                        )}
                      </Button>
                      <div>
                        <label className="block text-zinc-400 text-xs sm:text-sm mb-1.5 font-medium">
                          Ή εισάγετε διεύθυνση
                        </label>
                        <GooglePlacesCustom
                          onPlaceSelect={handleGooglePlaceSelect}
                          value={addressInput}
                          onChange={setAddressInput}
                          placeholder="Εισάγετε διεύθυνση παράδοσης..."
                          className="bg-black border-zinc-800 text-white h-10 text-sm focus:ring-[#ff9328] focus:border-[#ff9328]"
                        />
                      </div>
                    </div>
                  )}
                </Card>
              )}

              
              {/* Order Comments */}
              <Card className="bg-zinc-900 border-zinc-800 p-4 sm:p-6 shadow-xl rounded-xl">
                <h3 className="text-base sm:text-lg font-bold text-white mb-4">
                  Σχόλια παραγγελίας
                </h3>
                <textarea
                  value={orderComments}
                  onChange={(e) => setOrderComments(e.target.value)}
                  placeholder="Προσθέστε σχόλια για την παραγγελία σας..."
                  className="w-full h-24 bg-black border border-zinc-800 rounded-lg p-3 text-white placeholder-zinc-500 resize-none focus:outline-none focus:border-[#ff9328] focus:ring-1 focus:ring-[#ff9328] text-sm transition-all"
                />
              </Card>

              {/* Delivery / Pickup Toggle */}
              <Card className="bg-zinc-900 border-zinc-800 p-4 sm:p-6 shadow-xl rounded-xl">
                <h3 className="text-base sm:text-lg font-bold text-white mb-4">
                  Τρόπος παραλαβής
                </h3>
                <div className="space-y-4">
                  {(() => {
                    const deliveryMinOrder = locationData?.options?.delivery_min_order_amount
                      ? parseFloat(locationData.options.delivery_min_order_amount)
                      : 0;
                    const cartTotal = locationCart?.summary.total || 0;
                    const isDeliveryDisabledByMinOrder =
                      deliveryMinOrder > 0 && cartTotal < deliveryMinOrder;
                    const isDeliveryDisabled = isDeliveryDisabledByMinOrder;

                    const deliveryInterval =
                      locationData?.options?.delivery_time_interval || 0;

                    return (
                      <label
                        className={`flex items-center gap-3 p-3 rounded-lg border border-transparent transition-all ${
                          isDeliveryDisabled
                            ? "cursor-not-allowed opacity-50 bg-black/50"
                            : "cursor-pointer hover:bg-black hover:border-zinc-800"
                        } ${orderType === "delivery" ? "bg-black border-zinc-800 ring-1 ring-[#ff9328]" : ""}`}
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
                          className="w-4 h-4 accent-[#ff9328] bg-zinc-800 border-zinc-600 focus:ring-[#ff9328]"
                        />
                        <div className="flex items-center gap-3 flex-1">
                          <div className={`p-2 rounded-full ${orderType === "delivery" ? "bg-[#ff9328]/20 text-[#ff9328]" : "bg-zinc-800 text-zinc-400"}`}>
                             <MapPin className="w-4 h-4" />
                          </div>
                          <span className="text-white font-medium">Παράδοση</span>
                          {!isDeliveryDisabled && deliveryInterval > 0 && (
                            <span className="text-zinc-500 text-xs sm:text-sm ml-auto">
                              ~{deliveryInterval} λεπτά
                            </span>
                          )}
                          {isDeliveryDisabledByMinOrder && (
                            <span className="text-red-400 text-xs ml-auto">
                              Ελάχιστη: {deliveryMinOrder.toFixed(2)} €
                            </span>
                          )}
                        </div>
                      </label>
                    );
                  })()}
                  
                  {(() => {
                    const pickupMinOrder = locationData?.options?.collection_min_order_amount
                      ? parseFloat(locationData.options.collection_min_order_amount)
                      : 0;
                    const cartTotal = locationCart?.summary.total || 0;
                    const isPickupDisabledByMinOrder =
                      pickupMinOrder > 0 && cartTotal < pickupMinOrder;

                    return (
                      <label
                        className={`flex items-center gap-3 p-3 rounded-lg border border-transparent transition-all ${
                          isPickupDisabledByMinOrder
                            ? "cursor-not-allowed opacity-50 bg-black/50"
                            : "cursor-pointer hover:bg-black hover:border-zinc-800"
                        } ${orderType === "pickup" ? "bg-black border-zinc-800 ring-1 ring-[#ff9328]" : ""}`}
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
                          className="w-4 h-4 accent-[#ff9328] bg-zinc-800 border-zinc-600 focus:ring-[#ff9328]"
                        />
                        <div className="flex items-center gap-3 flex-1">
                          <div className={`p-2 rounded-full ${orderType === "pickup" ? "bg-[#ff9328]/20 text-[#ff9328]" : "bg-zinc-800 text-zinc-400"}`}>
                             <Package className="w-4 h-4" />
                          </div>
                          <span className="text-white font-medium">
                            Παραλαβή
                          </span>
                          {!isPickupDisabledByMinOrder &&
                            locationData?.options?.collection_time_interval && (
                              <span className="text-zinc-500 text-xs sm:text-sm ml-auto">
                                ~{locationData.options.collection_time_interval}{" "}
                                λεπτά
                              </span>
                            )}
                          {isPickupDisabledByMinOrder && (
                            <span className="text-red-400 text-xs ml-auto">
                              Ελάχιστη: {pickupMinOrder.toFixed(2)}€
                            </span>
                          )}
                        </div>
                      </label>
                    );
                  })()}
                </div>
              </Card>
            </div>

            {/* Right Column - Order Summary */}
            <div className="lg:col-span-3 space-y-4">
                {/* Payment Method */}
                <Card className="bg-zinc-900 border-zinc-800 p-4 sm:p-6 shadow-xl rounded-xl">
                  <h3 className="text-base sm:text-lg font-bold text-white mb-4">
                    Τρόπος πληρωμής
                  </h3>
                  <div className="space-y-3">
                  {/* Cash Payment Option */}
                  <label className={`flex items-center gap-3 cursor-pointer p-4 rounded-xl border transition-all ${paymentMethod === "cash"
                      ? "bg-zinc-900 border-[#ff9328] ring-1 ring-[#ff9328]"
                      : "border-zinc-800 hover:bg-zinc-900/50 hover:border-zinc-700"
                    }`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cash"
                      checked={paymentMethod === "cash"}
                      onChange={(e) => setPaymentMethod(e.target.value as "cash" | "card")}
                      className="w-4 h-4 accent-[#ff9328] bg-zinc-800 border-zinc-600 focus:ring-[#ff9328]"
                    />
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 ${paymentMethod === "cash" ? "text-[#ff9328]" : "text-zinc-500"}`} />
                      <span className="text-white font-medium text-sm">
                        Πληρωμή στην παράδοση/παραλαβή
                      </span>
                    </div>
                  </label>

                  {/* Card Payment Option */}
                  <label className={`flex items-center gap-3 cursor-pointer p-4 rounded-xl border transition-all ${paymentMethod === "card"
                      ? "bg-zinc-900 border-[#ff9328] ring-1 ring-[#ff9328]"
                      : "border-zinc-800 hover:bg-zinc-900/50 hover:border-zinc-700"
                    }`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="card"
                      checked={paymentMethod === "card"}
                      onChange={(e) => setPaymentMethod(e.target.value as "cash" | "card")}
                      className="w-4 h-4 accent-[#ff9328] bg-zinc-800 border-zinc-600 focus:ring-[#ff9328]"
                    />
                    <div className="flex items-center gap-2">
                      <CreditCard className={`w-4 h-4 ${paymentMethod === "card" ? "text-[#ff9328]" : "text-zinc-500"}`} />
                      <span className="text-white font-medium text-sm sm:text-base">
                        Πληρωμή με κάρτα 
                      </span>
                    </div>
                  </label>

                  </div>
                </Card>
                  
                {/* User Info */}
                <Card className="bg-zinc-900 border-zinc-800 p-4 sm:p-6 shadow-xl rounded-xl">
                <h3 className="text-base sm:text-lg font-bold text-white mb-4">
                  Στοιχεία πελάτη
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-zinc-400 text-xs sm:text-sm mb-1.5 font-medium">
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
                      className="bg-black border-zinc-800 text-white h-10 text-sm focus:ring-[#ff9328] focus:border-[#ff9328]"
                      placeholder="Όνομα"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 text-xs sm:text-sm mb-1.5 font-medium">
                      Email
                    </label>
                    <Input
                      value={user?.email || ""}
                      readOnly
                      className="bg-black border-zinc-800 text-white h-10 text-sm focus:ring-[#ff9328] focus:border-[#ff9328]"
                      placeholder="Email"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 text-xs sm:text-sm mb-1.5 font-medium">
                      Τηλέφωνο
                    </label>
                    <Input
                      value={user?.telephone || user?.phone || ""}
                      readOnly
                      className="bg-black border-zinc-800 text-white h-10 text-sm focus:ring-[#ff9328] focus:border-[#ff9328]"
                      placeholder="Τηλέφωνο"
                    />
                  </div>
                </div>
              </Card>

              {/* Order Summary Items */}
              <Card className="bg-zinc-900 border-zinc-800 p-4 sm:p-6 shadow-xl rounded-xl sticky top-4">
                <h3 className="text-base sm:text-lg font-bold text-white mb-4">
                  Σύνοψη παραγγελίας
                </h3>
                <div className="space-y-4 max-h-[calc(100vh-350px)] overflow-y-auto custom-scrollbar pr-1">
                  {locationCart.items.map((item) => (
                    <div
                      key={item.rowId}
                      onClick={() => handleItemClick(item)}
                      className="border-b border-zinc-800 pb-4 last:border-b-0 cursor-pointer hover:bg-black/40 rounded-lg p-2 transition-colors -mx-2"
                    >
                      {/* Title Row with Controls */}
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex flex-col gap-1 flex-1">
                          <span className="text-white text-base font-bold leading-tight">
                            {item.name}
                          </span>
                          
                          {/* Display menu options if any */}
                          {item.options && item.options.length > 0 && (
                            <div className="text-xs text-zinc-400 space-y-0.5">
                              {item.options.flatMap((opt) =>
                                opt.values.map((val, index) => (
                                  <div
                                    key={`${item.rowId}-${opt.menu_option_id}-${val.menu_option_value_id}-${index}`}
                                    className="flex justify-between items-center"
                                  >
                                    <span>
                                      + {val.option_value_name}
                                      {val.price > 0 && ` (€${val.price.toFixed(2)})`}
                                    </span>
                                  </div>
                                ))
                              )}
                            </div>
                          )}

                          {/* Display item comment if any */}
                          {item.comment && (
                            <div className="text-zinc-500 text-xs italic mt-1">
                              "{item.comment}"
                            </div>
                          )}
                        </div>
                        
                        <span className="text-white font-bold text-sm whitespace-nowrap">
                          €{item.subtotal.toFixed(2)}
                        </span>
                      </div>

                      {/* Controls Row */}
                      <div className="flex items-center justify-end gap-3 mt-3">
                          {/* Quantity Controls */}
                          <div className="flex items-center gap-1 bg-black rounded-lg p-1 border border-zinc-800">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleQuantityChange(item, item.qty - 1);
                              }}
                              disabled={item.qty <= 1}
                              className="w-7 h-7 rounded flex items-center justify-center bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-white text-sm font-bold min-w-[1.5rem] text-center">
                              {item.qty}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleQuantityChange(item, item.qty + 1);
                              }}
                              className="w-7 h-7 rounded flex items-center justify-center bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          {/* Remove Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveItem(item);
                            }}
                            className="p-1.5 rounded bg-zinc-900 border border-zinc-800 hover:border-red-900/50 hover:bg-red-900/10 text-zinc-500 hover:text-red-400 transition-colors group"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                      </div>
                    </div>
                  ))}
                  
                  <div className="border-t border-zinc-800 pt-4 mt-2 space-y-2">
                    <div className="flex justify-between items-center text-zinc-400 text-sm">
                        <span>Υποσύνολο</span>
                        <span>€{locationCart.summary.total.toFixed(2)}</span>
                    </div>
                    {/* Add delivery fee logic here if needed */}
                    <div className="flex justify-between items-center pt-2 border-t border-zinc-800">
                      <span className="text-white font-bold text-lg">
                        Σύνολο
                      </span>
                      <span className="text-[#ff9328] font-bold text-xl">
                        €{locationCart.summary.total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                {(() => {
                  const deliveryData = locationCart
                    ? getDeliveryData(locationCart.locationId)
                    : null;
                  const isOutsideDeliveryArea =
                    orderType === "delivery" &&
                    deliveryData &&
                    !deliveryData.is_within_delivery_area;

                  const isRestaurantOpen =
                    restaurantStatus?.is_open ??
                    locationCart?.restaurantStatus?.isOpen ??
                    true;
                  const isRestaurantClosed = !isRestaurantOpen;

                  const statusMessage =
                    restaurantStatus?.status_message ||
                    locationCart?.restaurantStatus?.statusMessage ||
                    "Το εστιατόριο είναι κλειστό. Δεν μπορείτε να υποβάλετε παραγγελία.";

                  const deliveryMinOrder = locationData?.options?.delivery_min_order_amount
                    ? parseFloat(locationData.options.delivery_min_order_amount)
                    : 0;
                  const pickupMinOrder = locationData?.options?.collection_min_order_amount
                    ? parseFloat(locationData.options.collection_min_order_amount)
                    : 0;
                  const cartTotal = locationCart?.summary.total || 0;

                  const deliveryMeetsMin =
                    deliveryMinOrder === 0 || cartTotal >= deliveryMinOrder;
                  const pickupMeetsMin =
                    pickupMinOrder === 0 || cartTotal >= pickupMinOrder;

                  const currentOrderTypeMeetsMin =
                    orderType === "delivery"
                      ? deliveryMeetsMin
                      : pickupMeetsMin;

                  const isBlockedByMinOrder =
                    !deliveryMeetsMin && !pickupMeetsMin;

                  const isDeliveryBlockedForCheckout =
                    orderType === "delivery" &&
                    locationCart &&
                    isDeliveryBlocked(locationCart.locationId);

                  return (
                    <div className="space-y-3 mt-6">
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
                        className={`w-full py-6 text-base font-bold shadow-lg transition-all duration-200 ${
                          isRestaurantClosed ||
                          isBlockedByMinOrder ||
                          isDeliveryBlockedForCheckout ||
                          !currentOrderTypeMeetsMin
                            ? "bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700"
                            : "bg-[#ff9328] text-white hover:bg-[#915316] border border-transparent shadow-red-900/20 active:scale-[0.98]"
                        }`}
                      >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                Υποβολή...
                            </>
                        ) : isLoadingRestaurantStatus ? (
                          "Ελέγχοντας..."
                        ) : isRestaurantClosed ? (
                          "Το εστιατόριο είναι κλειστό"
                        ) : isBlockedByMinOrder ? (
                          "Ελάχιστη παραγγελία δεν έχει συμπληρωθεί"
                        ) : isDeliveryBlockedForCheckout ? (
                          "Διεύθυνση εκτός εύρους"
                        ) : !currentOrderTypeMeetsMin ? (
                          "Ελάχιστη παραγγελία δεν έχει συμπληρωθεί"
                        ) : (
                          "Υποβολή παραγγελίας"
                        )}
                      </Button>
                      
                      {isRestaurantClosed && !isLoadingRestaurantStatus && (
                        <p className="text-red-400 text-xs text-center font-medium bg-red-900/10 p-2 rounded border border-red-900/30">
                          {statusMessage}
                        </p>
                      )}
                      {isBlockedByMinOrder && !isRestaurantClosed && (
                        <p className="text-red-400 text-xs text-center font-medium">
                          Ελάχιστη παραγγελία δεν έχει συμπληρωθεί
                        </p>
                      )}
                      {isDeliveryBlockedForCheckout &&
                        !isRestaurantClosed &&
                        !isBlockedByMinOrder && (
                          <p className="text-red-400 text-xs text-center font-medium bg-red-900/10 p-2 rounded border border-red-900/30">
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
            <Loader2 className="w-10 h-10 text-[#ff9328] animate-spin mx-auto mb-4" />
            <div className="text-white text-lg font-medium">Φόρτωση...</div>
          </div>
        </div>
      }
    >
      <CheckoutPageContent />
    </Suspense>
  );
}