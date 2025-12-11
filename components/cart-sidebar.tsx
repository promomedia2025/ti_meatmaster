"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  X,
  ShoppingCart,
  Clock,
  RotateCcw,
  Loader2,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import {
  useServerCart,
  CartItem,
  CartItemOption,
  LocationCart as ServerLocationCart,
} from "@/lib/server-cart-context";
import { useAuth } from "@/lib/auth-context";
import { useDeliveryAvailability } from "@/lib/delivery-availability-context";
import { MenuOptionsModal, SelectedOption } from "./menu-options-modal";
import { toast } from "sonner";

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  locationId?: number; // Optional: if provided, show only this location's cart
}

interface Order {
  order_id: number;
  order_date: string;
  order_time: string;
  order_total: string;
  currency: string;
  status_id: number;
  created_at: string;
  location_name: string;
  status_name: string;
}

interface MenuOptionValueData {
  menu_option_value_id: number;
  option_value_id: number;
  name: string;
  price: number;
  quantity: number | null;
  is_default: boolean | null;
  priority: number;
  available?: boolean | null;
}

interface MenuOptionData {
  menu_option_id: number;
  option_id: number;
  option_name: string;
  display_type: string;
  priority: number;
  required: boolean;
  min_selected: number;
  max_selected: number;
  option_values: MenuOptionValueData[];
}

interface LocationMenuItem {
  menu_id: number;
  menu_name: string;
  menu_description: string;
  menu_price: number;
  minimum_qty: number;
  menu_priority: number;
  order_restriction: string | null;
  currency: string;
  categories: Array<{
    category_id: number;
    name: string;
    description: string;
    priority: number;
    permalink_slug: string;
  }>;
  menu_options?: MenuOptionData[];
  image?: {
    url: string;
    path: string;
    name: string;
    size: number | null;
    type: string;
    width: number | null;
    height: number | null;
  };
}

export function CartSidebar({ isOpen, onClose, locationId }: CartSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();

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

  const {
    locationCarts,
    globalSummary,
    removeItem,
    updateQuantity,
    addItem,
    fetchAllUserCarts,
    clearLocationCart,
    refreshCart,
  } = useServerCart();
  const { user, isAuthenticated } = useAuth();
  const { isDeliveryBlocked } = useDeliveryAvailability();
  const [activeCartTab, setActiveCartTab] = useState<"carts" | "orders">(
    "carts"
  );
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [removingItems, setRemovingItems] = useState<Set<string>>(new Set());
  const [isRemoving, setIsRemoving] = useState(false);
  const [clearingCarts, setClearingCarts] = useState<Set<number>>(new Set());
  const [locationImages, setLocationImages] = useState<Map<number, string>>(
    new Map()
  );
  const [menuItemImages, setMenuItemImages] = useState<Map<number, string>>(
    new Map()
  );
  const [expandedQuantityItems, setExpandedQuantityItems] = useState<
    Set<string>
  >(new Set());
  const [isMenuOptionsModalOpen, setIsMenuOptionsModalOpen] = useState(false);
  const [modalMenuItem, setModalMenuItem] = useState<LocationMenuItem | null>(
    null
  );
  const [modalCartItem, setModalCartItem] = useState<CartItem | null>(null);
  const [modalLocationId, setModalLocationId] = useState<number | null>(null);
  const [modalInitialSelections, setModalInitialSelections] = useState<
    SelectedOption[]
  >([]);
  const [modalInitialQuantity, setModalInitialQuantity] = useState<number>(1);
  const [modalInitialComment, setModalInitialComment] = useState<string>("");
  const [isLoadingMenuOptions, setIsLoadingMenuOptions] = useState(false);
  const [isSubmittingMenuOptions, setIsSubmittingMenuOptions] = useState(false);
  const [modalRestaurantStatus, setModalRestaurantStatus] =
    useState<ServerLocationCart["restaurantStatus"]>();
  const menuItemsCacheRef = useRef<Map<number, LocationMenuItem[]>>(new Map());
  // Map cache for O(1) menu item lookup by ID: locationId -> Map<menu_id, menuItem>
  const menuItemsMapCacheRef = useRef<
    Map<number, Map<number, LocationMenuItem>>
  >(new Map());

  // Handle clearing individual cart with optimistic UI
  const handleClearCart = useCallback(
    async (locationId: number) => {
      if (!user?.id) return;

      // Optimistic UI: immediately remove the cart from display
      setClearingCarts((prev) => new Set(prev).add(locationId));

      try {
        // Use the server-side clearLocationCart function
        await clearLocationCart(locationId);
      } catch (error) {
        // On error, refresh to restore the cart
        await fetchAllUserCarts();
      } finally {
        setClearingCarts((prev) => {
          const newSet = new Set(prev);
          newSet.delete(locationId);
          return newSet;
        });
      }
    },
    [user?.id, clearLocationCart, fetchAllUserCarts]
  );

  // Handle animated item removal with loading state
  const handleRemoveItem = useCallback(
    async (locationId: number, rowId: string) => {
      if (isRemoving) return; // Prevent multiple simultaneous removals

      setIsRemoving(true);
      // Add item to removing set to trigger animation
      setRemovingItems((prev) => new Set(prev).add(rowId));

      try {
        // Wait for animation to complete (300ms)
        await new Promise((resolve) => setTimeout(resolve, 300));

        // Actually remove the item
        await removeItem(locationId, rowId);
      } finally {
        // Remove from removing set
        setRemovingItems((prev) => {
          const newSet = new Set(prev);
          newSet.delete(rowId);
          return newSet;
        });
        setIsRemoving(false);
      }
    },
    [isRemoving, removeItem]
  );

  // Filter carts to show only the specified location if locationId is provided
  // Also filter out carts that are being cleared for optimistic UI
  const displayCarts = useMemo(() => {
    const filtered = locationId
      ? locationCarts.filter((cart) => cart.locationId === locationId)
      : locationCarts;

    // Optimistic UI: hide carts that are being cleared
    return filtered.filter((cart) => !clearingCarts.has(cart.locationId));
  }, [locationCarts, locationId, clearingCarts]);

  // Fetch location images for carts
  useEffect(() => {
    const fetchLocationImages = async () => {
      if (displayCarts.length === 0) return;

      const locationIds = displayCarts.map((cart) => cart.locationId);
      const missingIds = locationIds.filter(
        (id) =>
          !locationImages.has(id) &&
          !displayCarts.find((c) => c.locationId === id)?.locationImage
      );

      if (missingIds.length === 0) return;

      try {
        // Fetch all locations and filter by the ones we need
        const response = await fetch("/api/locations");
        const data = await response.json();

        if (data.success && data.data?.locations) {
          const newImages = new Map(locationImages);
          data.data.locations.forEach((location: any) => {
            if (
              missingIds.includes(location.id) &&
              location.images?.thumbnail?.url
            ) {
              newImages.set(location.id, location.images.thumbnail.url);
            }
          });
          setLocationImages(newImages);
        }
      } catch (error) {
        console.error("Error fetching location images:", error);
      }
    };

    fetchLocationImages();
  }, [displayCarts, locationImages]);

  // Fetch menu item images for cart items
  useEffect(() => {
    const fetchMenuItemImages = async () => {
      if (displayCarts.length === 0) return;

      // Collect all menu item IDs that need images
      const menuItemIds = new Set<number>();
      displayCarts.forEach((cart) => {
        cart.items.forEach((item) => {
          if (!item.image && !menuItemImages.has(item.id)) {
            menuItemIds.add(item.id);
          }
        });
      });

      if (menuItemIds.size === 0) return;

      // Group items by locationId to fetch menu items per location
      const locationMenuMap = new Map<number, Set<number>>();
      displayCarts.forEach((cart) => {
        cart.items.forEach((item) => {
          if (!item.image && !menuItemImages.has(item.id)) {
            if (!locationMenuMap.has(cart.locationId)) {
              locationMenuMap.set(cart.locationId, new Set());
            }
            locationMenuMap.get(cart.locationId)!.add(item.id);
          }
        });
      });

      try {
        const newMenuItemImages = new Map(menuItemImages);

        // Fetch menu items for each location
        for (const [locationId, menuIds] of locationMenuMap.entries()) {
          try {
            const response = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/api/locations/${locationId}/menu-items`
            );
            const data = await response.json();

            if (data.success && data.data?.menu_items) {
              data.data.menu_items.forEach((menuItem: any) => {
                if (
                  menuIds.has(menuItem.menu_id) &&
                  menuItem.image?.url &&
                  !newMenuItemImages.has(menuItem.menu_id)
                ) {
                  newMenuItemImages.set(menuItem.menu_id, menuItem.image.url);
                }
              });
            }
          } catch (error) {
            console.error(
              `Error fetching menu items for location ${locationId}:`,
              error
            );
          }
        }

        if (newMenuItemImages.size > menuItemImages.size) {
          setMenuItemImages(newMenuItemImages);
        }
      } catch (error) {
        console.error("Error fetching menu item images:", error);
      }
    };

    fetchMenuItemImages();
  }, [displayCarts, menuItemImages]);

  // Fetch all user carts when sidebar opens
  useEffect(() => {
    if (isOpen && isAuthenticated && user?.id && !locationId) {
      fetchAllUserCarts();
    }
  }, [isOpen, isAuthenticated, user?.id, locationId, fetchAllUserCarts]);

  const fetchOrders = useCallback(async () => {
    if (!user?.id) return;

    try {
      setIsLoadingOrders(true);
      setOrdersError(null);

      const response = await fetch(`/api/orders?user_id=${user.id}`);
      const data = await response.json();

      if (data.success && data.data && Array.isArray(data.data)) {
        setOrders(data.data);
      } else {
        setOrders([]);
        setOrdersError(data.message || "Failed to load orders");
      }
    } catch (err) {
      setOrdersError("Failed to load orders");
      setOrders([]);
    } finally {
      setIsLoadingOrders(false);
    }
  }, [user?.id]);

  // Fetch orders when orders tab is active
  useEffect(() => {
    if (
      activeCartTab === "orders" &&
      isAuthenticated &&
      user?.id &&
      !locationId
    ) {
      fetchOrders();
    }
  }, [activeCartTab, isAuthenticated, user?.id, locationId, fetchOrders]);

  const handleOrderAgain = async (order: Order) => {
    // For now, we'll just show a message since we don't have the detailed order items
    // In a real implementation, you'd need to fetch the order details first
    alert(
      `Παραγγελία ξανά για ${order.location_name} - Σύνολο: ${order.order_total} ${order.currency}`
    );

    // TODO: Implement actual order again functionality
    // This would involve:
    // 1. Fetching the detailed order items from the API
    // 2. Adding those items to the cart
    // 3. Navigating to the restaurant page
  };

  const formatDate = (orderDate: string, orderTime: string) => {
    const dateTimeString = `${orderDate}T${orderTime}`;
    const date = new Date(dateTimeString);
    return date.toLocaleDateString("el-GR", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Helper function to generate a slug from the restaurant name
  const generateSlug = (name: string, id: number) => {
    return (
      name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim() + `-${id}`
    );
  };

  const handleCartClick = (locationCart: {
    locationId: number;
    locationName: string;
  }) => {
    const locationSlug = generateSlug(
      locationCart.locationName,
      locationCart.locationId
    );
    router.push(`/${currentLang}/location/${locationSlug}`);
    onClose();
  };

  // Toggle quantity controls expansion
  const toggleQuantityControls = useCallback(
    (rowId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setExpandedQuantityItems((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(rowId)) {
          newSet.delete(rowId);
        } else {
          newSet.add(rowId);
        }
        return newSet;
      });
    },
    []
  );

  const isSingleSelectMenuOption = useCallback((option: MenuOptionData) => {
    const type = (option.display_type || "").toLowerCase();
    if (["radio", "single", "single_choice", "buttons"].includes(type)) {
      return true;
    }
    return (option.max_selected || 0) === 1;
  }, []);

  const buildInitialSelections = useCallback(
    (menuItem: LocationMenuItem, cartItem: CartItem): SelectedOption[] => {
      if (!menuItem.menu_options || !cartItem.options) {
        console.log("No menu options or cart item options found:", {
          hasMenuOptions: !!menuItem.menu_options,
          hasCartOptions: !!cartItem.options,
        });
        return [];
      }

      // Optimized: Create Maps for O(1) lookups instead of O(N) linear searches
      const cartOptionsMap = new Map<number, CartItemOption>(
        cartItem.options.map((opt) => [opt.menu_option_id, opt])
      );

      const selections: SelectedOption[] = [];

      // O(M) where M = menu options count
      menuItem.menu_options.forEach((option) => {
        // O(1) lookup instead of O(C) linear search
        const cartOption = cartOptionsMap.get(option.menu_option_id);
        if (!cartOption) return;

        // Create Map for option values for O(1) lookup
        const optionValuesMap = new Map<number, MenuOptionValueData>(
          option.option_values.map((val) => [val.menu_option_value_id, val])
        );

        // O(V) where V = cart values count (was O(V × OV))
        const matchingValues = cartOption.values
          .map((value) => {
            // O(1) lookup instead of O(OV) linear search
            const optValue = optionValuesMap.get(value.menu_option_value_id);
            return optValue && optValue.available !== false ? optValue : null;
          })
          .filter(
            (optValue): optValue is MenuOptionValueData => optValue !== null
          );

        if (!matchingValues.length) {
          console.log(
            `No matching values found for option ${option.option_name}`
          );
          return;
        }

        let limitedValues = matchingValues;
        if (isSingleSelectMenuOption(option)) {
          limitedValues = matchingValues.slice(0, 1);
        } else if (option.max_selected > 0) {
          limitedValues = matchingValues.slice(0, option.max_selected);
        }

        selections.push({
          menu_option_id: option.menu_option_id,
          option_name: option.option_name,
          selected_values: limitedValues.map((value) => ({
            menu_option_value_id: value.menu_option_value_id,
            name: value.name,
            price: value.price,
          })),
        });
      });

      console.log(
        `Built ${selections.length} initial selections from ${cartItem.options.length} cart options`
      );
      return selections;
    },
    [isSingleSelectMenuOption]
  );

  const getStatusColor = (statusName: string) => {
    switch (statusName.toLowerCase()) {
      case "delivery":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "received":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "pending":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "cancelled":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getStatusText = (statusName: string) => {
    switch (statusName.toLowerCase()) {
      case "delivery":
        return "Παραδόθηκε";
      case "received":
        return "Ελήφθη";
      case "pending":
        return "Εκκρεμεί";
      case "cancelled":
        return "Ακυρώθηκε";
      default:
        return statusName;
    }
  };

  const closeMenuOptionsModal = useCallback(() => {
    setIsMenuOptionsModalOpen(false);
    setModalMenuItem(null);
    setModalCartItem(null);
    setModalLocationId(null);
    setModalInitialSelections([]);
    setModalInitialQuantity(1);
    setModalInitialComment("");
    setModalRestaurantStatus(undefined);
  }, []);

  const handleCartItemOptionsClick = useCallback(
    async (cart: ServerLocationCart, cartItem: CartItem) => {
      console.log("Cart item clicked:", cartItem);

      if (
        !locationId ||
        isLoadingMenuOptions ||
        isSubmittingMenuOptions ||
        clearingCarts.has(cart.locationId)
      ) {
        return;
      }

      // Open modal immediately with loading state
      setModalCartItem(cartItem);
      setModalLocationId(cart.locationId);
      setModalInitialQuantity(cartItem.qty);
      setModalInitialComment(cartItem.comment || "");
      setModalRestaurantStatus(cart.restaurantStatus);
      setIsMenuOptionsModalOpen(true);
      setIsLoadingMenuOptions(true);
      // Set menuItem to null initially - modal will show loading state
      setModalMenuItem(null);
      setModalInitialSelections([]);

      try {
        let menuItems = menuItemsCacheRef.current.get(cart.locationId);
        let menuItemsMap = menuItemsMapCacheRef.current.get(cart.locationId);

        if (!menuItems) {
          // Fetch all menu items with pagination support
          let allMenuItems: LocationMenuItem[] = [];
          let page = 1;
          const perPage = 100;

          while (true) {
            const baseUrl = process.env.NEXT_PUBLIC_API_URL;
            const response = await fetch(
              `${baseUrl}/api/locations/${cart.locationId}/menu-items?page=${page}&per_page=${perPage}`
            );
            const data = await response.json();

            if (!data.success || !Array.isArray(data.data?.menu_items)) {
              throw new Error("Invalid menu data response");
            }

            allMenuItems.push(...(data.data.menu_items as LocationMenuItem[]));

            // Check if there are more pages
            const pagination = data.data?.pagination;
            if (
              !pagination ||
              !pagination.last_page ||
              page >= pagination.last_page
            ) {
              break;
            }

            page++;
          }

          menuItems = allMenuItems;
          menuItemsCacheRef.current.set(cart.locationId, menuItems);

          // Create Map for O(1) lookup by menu_id
          menuItemsMap = new Map<number, LocationMenuItem>();
          menuItems.forEach((item) => {
            menuItemsMap.set(item.menu_id, item);
          });
          menuItemsMapCacheRef.current.set(cart.locationId, menuItemsMap);
        } else if (!menuItemsMap) {
          // If we have menuItems from cache but no Map, create it
          menuItemsMap = new Map<number, LocationMenuItem>();
          menuItems.forEach((item) => {
            menuItemsMap.set(item.menu_id, item);
          });
          menuItemsMapCacheRef.current.set(cart.locationId, menuItemsMap);
        }

        console.log("Looking for menu item with id:", cartItem.id);
        console.log("Available menu items count:", menuItems.length);
        console.log(
          "Available menu item IDs:",
          menuItems.map((item) => item.menu_id)
        );

        // Optimized: Use Map for O(1) lookup instead of O(N) linear search
        let menuItem: LocationMenuItem | undefined;

        if (menuItemsMap) {
          // O(1) lookup - try with cartItem.id as-is (assuming it's a number)
          const cartItemId =
            typeof cartItem.id === "number" ? cartItem.id : Number(cartItem.id);
          menuItem = menuItemsMap.get(cartItemId);

          // If not found and we have a valid number, the item doesn't exist
          // (No need for additional type coercion since Map keys are numbers)
        } else {
          // Fallback to linear search if Map doesn't exist (shouldn't happen)
          console.warn(
            "Menu items Map cache not found, falling back to linear search"
          );
          menuItem = menuItems.find((item) => item.menu_id === cartItem.id);
          if (!menuItem) {
            menuItem = menuItems.find(
              (item) => Number(item.menu_id) === Number(cartItem.id)
            );
          }
        }

        if (!menuItem) {
          console.error("Menu item not found:", {
            cartItemId: cartItem.id,
            cartItemIdType: typeof cartItem.id,
            cartItemName: cartItem.name,
            locationId: cart.locationId,
            availableMenuIds: menuItems.map((item) => item.menu_id),
            availableMenuIdTypes: menuItems.map((item) => typeof item.menu_id),
            menuItemsCount: menuItems.length,
            firstFewMenuItems: menuItems.slice(0, 3).map((item) => ({
              id: item.menu_id,
              name: item.menu_name,
              type: typeof item.menu_id,
            })),
          });
          toast.error(
            `Δεν βρέθηκε το προϊόν "${cartItem.name}" στο μενού. Ίσως έχει αφαιρεθεί.`
          );
          setIsMenuOptionsModalOpen(false);
          return;
        }

        const initialSelections = buildInitialSelections(menuItem, cartItem);
        console.log("Initial selections built:", initialSelections);
        console.log("Cart item options:", cartItem.options);
        console.log("Menu item options:", menuItem.menu_options);

        // Update modal with menu item data
        setModalMenuItem(menuItem);
        setModalInitialSelections(initialSelections);
      } catch (error) {
        console.error("Error loading menu item details:", error);
        toast.error("Δεν ήταν δυνατή η φόρτωση των επιλογών του προϊόντος.");
        setIsMenuOptionsModalOpen(false);
      } finally {
        setIsLoadingMenuOptions(false);
      }
    },
    [
      locationId,
      buildInitialSelections,
      isLoadingMenuOptions,
      isSubmittingMenuOptions,
      clearingCarts,
    ]
  );

  const handleMenuOptionsSubmit = useCallback(
    async (
      menuItem: LocationMenuItem,
      optionValues: any[],
      quantity: number,
      comment: string
    ) => {
      if (!modalCartItem || modalLocationId === null || !user?.id) {
        return;
      }

      setIsSubmittingMenuOptions(true);

      try {
        // Transform optionValues from flat array to grouped format required by API
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

        // Call server-side API route to update cart item
        const response = await fetch("/api/cart/update", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            row_id: modalCartItem.rowId,
            quantity: quantity,
            options: transformedOptions,
            comment: comment || "",
            user_id: user.id,
            location_id: modalLocationId,
          }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          toast.error(
            data.message || "Δεν ήταν δυνατή η ενημέρωση του προϊόντος."
          );
          return;
        }

        // Refresh cart to get updated data
        await refreshCart();

        toast.success("Το προϊόν ενημερώθηκε επιτυχώς");
        closeMenuOptionsModal();
      } catch (error) {
        console.error("Error updating cart item:", error);
        toast.error("Δεν ήταν δυνατή η ενημέρωση του προϊόντος.");
      } finally {
        setIsSubmittingMenuOptions(false);
      }
    },
    [
      modalCartItem,
      modalLocationId,
      user?.id,
      refreshCart,
      closeMenuOptionsModal,
    ]
  );

  return (
    <div
      className={`fixed inset-0 z-50 transition-opacity duration-500 ease-out ${
        isOpen
          ? "opacity-100 pointer-events-auto"
          : "opacity-0 pointer-events-none"
      }`}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Sidebar with responsive animation */}
      <div
        className={`fixed bg-[#1a1a1a] border-border shadow-xl transition-all duration-500 ease-out flex flex-col
          /* Mobile: bottom-to-top animation, full width */
          bottom-0 left-0 right-0 ${locationId ? "h-screen" : "h-[91vh]"} ${
          locationId ? "" : "rounded-t-2xl border-t"
        }
          /* Desktop: right-to-left animation, 30vw width */
          md:bottom-auto md:left-auto md:right-0 md:top-0 md:h-full md:w-[30vw] md:border-l md:rounded-none
          ${
            isOpen
              ? "translate-y-0 md:translate-y-0 md:translate-x-0"
              : "translate-y-full md:translate-y-0 md:translate-x-full"
          }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-bold text-white">Οι παραγγελίες σου</h2>
          <button
            onClick={onClose}
            className="p-2 bg-[#3f3f3f] rounded-full hover:bg-[#4f4f4f] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Tabs - only show when not in a specific restaurant */}
        {!locationId && (
          <div className="flex border-b border-border">
            <button
              onClick={() => setActiveCartTab("carts")}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeCartTab === "carts"
                  ? "bg-gray-700 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Καλάθια αγορών
            </button>
            <button
              onClick={() => setActiveCartTab("orders")}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeCartTab === "orders"
                  ? "bg-gray-700 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Παραγγελία ξανά
            </button>
          </div>
        )}

        {/* Content */}
        <div className="py-4 px-3 flex-1 overflow-y-auto cart-scrollbar flex flex-col">
          {!locationId && activeCartTab === "orders" ? (
            <div className=" ">
              {isLoadingOrders ? (
                <div className="text-center text-gray-400 py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p>Φόρτωση παραγγελιών...</p>
                </div>
              ) : ordersError ? (
                <div className="text-center text-red-400 py-8">
                  <p>{ordersError}</p>
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center text-gray-400 py-8">
                  <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Δεν υπάρχουν προηγούμενες παραγγελίες</p>
                </div>
              ) : (
                <div className="cart-scrollbar">
                  {Array.isArray(orders) &&
                    orders.map((order) => (
                      <div
                        key={order.order_id}
                        className="bg-[#3f3f3f] rounded-lg p-2 border border-gray-700"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="text-white font-medium text-sm mb-1">
                              {order.location_name}
                            </h3>
                            <p className="text-gray-400 text-xs mb-2">
                              #{order.order_id} •{" "}
                              {formatDate(order.order_date, order.order_time)}
                            </p>
                            <div className="flex items-center gap-2">
                              <span className="text-white font-semibold text-sm">
                                {parseFloat(order.order_total).toFixed(2)}{" "}
                                {order.currency}
                              </span>
                              <span
                                className={`inline-block px-2 py-1 rounded text-xs border ${getStatusColor(
                                  order.status_name
                                )}`}
                              >
                                {getStatusText(order.status_name)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => handleOrderAgain(order)}
                          className="w-full bg-primary text-primary-foreground py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors text-sm flex items-center justify-center gap-2"
                        >
                          <RotateCcw className="w-4 h-4" />
                          Παραγγελία ξανά
                        </button>
                      </div>
                    ))}
                </div>
              )}
            </div>
          ) : (!locationId && activeCartTab === "carts") || locationId ? (
            <div className="flex flex-col flex-1 min-h-0">
              {displayCarts.length === 0 ? (
                <div className="text-center text-gray-400 py-8">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>
                    {locationId
                      ? "Το καλάθι είναι άδειο"
                      : "Δεν υπάρχουν καλάθια αγορών"}
                  </p>
                </div>
              ) : (
                <>
                  {/* Location Carts */}
                  <div
                    className={`space-y-4 flex-1 overflow-y-auto cart-scrollbar min-h-0 ${
                      locationId ? "pb-24" : ""
                    }`}
                  >
                    {Array.isArray(displayCarts) &&
                      displayCarts.map((locationCart) => (
                        <div
                          key={locationCart.locationId}
                          onClick={
                            locationId
                              ? undefined
                              : () => handleCartClick(locationCart)
                          }
                          className={`${
                            locationId ? "" : "border border-[#505050]"
                          } rounded-lg p-4 ${
                            locationId
                              ? ""
                              : "cursor-pointer hover:border-[#606060] hover:bg-[#2a2a2a]"
                          } transition-colors`}
                        >
                          {/* Location Header */}
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              {(locationCart.locationImage ||
                                locationImages.get(
                                  locationCart.locationId
                                )) && (
                                <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                                  <Image
                                    src={
                                      locationCart.locationImage ||
                                      locationImages.get(
                                        locationCart.locationId
                                      ) ||
                                      ""
                                    }
                                    alt={locationCart.locationName}
                                    fill
                                    className="object-cover"
                                    sizes="48px"
                                  />
                                </div>
                              )}

                              <h3 className="text-white font-medium truncate">
                                {locationCart.locationName}
                              </h3>
                            </div>
                            <div className="flex items-center gap-3 flex-shrink-0">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleClearCart(locationCart.locationId);
                                }}
                                disabled={clearingCarts.has(
                                  locationCart.locationId
                                )}
                                className={`text-red-400 hover:text-red-300 transition-colors ${
                                  clearingCarts.has(locationCart.locationId)
                                    ? "opacity-50 cursor-not-allowed"
                                    : ""
                                }`}
                                title="Διαγραφή καλαθιού"
                              >
                                {clearingCarts.has(locationCart.locationId) ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4 text-white bg-[#3f3f3f] rounded-full cursor-pointer" />
                                )}
                              </button>
                            </div>
                          </div>

                          {/* Location Items */}
                          <div
                            className={locationId ? "space-y-2" : "flex gap-2"}
                          >
                            {Array.isArray(locationCart.items) &&
                              locationCart.items.map((item) => (
                                <div
                                  key={item.rowId}
                                  onClick={() =>
                                    locationId
                                      ? handleCartItemOptionsClick(
                                          locationCart,
                                          item
                                        )
                                      : undefined
                                  }
                                  className={`${
                                    locationId
                                      ? "flex items-start gap-3 py-2 rounded-lg cursor-pointer hover:bg-[#2a2a2a]"
                                      : "flex items-center rounded"
                                  } transition-all duration-300 ease-in-out ${
                                    removingItems.has(item.rowId)
                                      ? "opacity-0 scale-95 -translate-x-4"
                                      : "opacity-100 scale-100 translate-x-0"
                                  }`}
                                >
                                  {item.image || menuItemImages.get(item.id) ? (
                                    <div
                                      className={`relative ${
                                        locationId ? "w-16 h-16" : "w-16 h-12"
                                      } rounded-lg overflow-hidden flex-shrink-0`}
                                    >
                                      <Image
                                        src={
                                          item.image ||
                                          menuItemImages.get(item.id) ||
                                          ""
                                        }
                                        alt={item.name}
                                        fill
                                        className="object-cover"
                                        sizes="64px"
                                      />
                                    </div>
                                  ) : (
                                    <div
                                      className={`${
                                        locationId ? "w-16 h-12" : "w-16 h-16"
                                      } rounded-lg bg-gray-600 flex items-center justify-center flex-shrink-0`}
                                    >
                                      <span className="text-white text-xs font-medium text-center px-2 line-clamp-2">
                                        {item.name}
                                      </span>
                                    </div>
                                  )}
                                  {locationId && (
                                    <div className="flex flex-row flex-1 justify-between items-center">
                                      <div className="flex flex-col">
                                        <h4 className="text-white text-sm font-medium flex-1">
                                          {item.name}
                                        </h4>
                                        <p className="text-gray-400 text-sm mt-1">
                                          {item.price.toFixed(2)}€
                                        </p>
                                      </div>
                                      <div>
                                        {expandedQuantityItems.has(
                                          item.rowId
                                        ) ? (
                                          <div className="flex items-center gap-2">
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                updateQuantity(
                                                  locationCart.locationId,
                                                  item.rowId,
                                                  item.qty - 1
                                                );
                                                // Collapse after a short delay
                                                setTimeout(() => {
                                                  setExpandedQuantityItems(
                                                    (prev) => {
                                                      const newSet = new Set(
                                                        prev
                                                      );
                                                      newSet.delete(item.rowId);
                                                      return newSet;
                                                    }
                                                  );
                                                }, 300);
                                              }}
                                              className="w-8 h-8 rounded-full bg-gray-600 text-white hover:bg-gray-500 flex items-center justify-center text-sm transition-colors"
                                            >
                                              -
                                            </button>
                                            <span className="text-white text-sm w-8 text-center">
                                              {item.qty}
                                            </span>
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                updateQuantity(
                                                  locationCart.locationId,
                                                  item.rowId,
                                                  item.qty + 1
                                                );
                                                // Collapse after a short delay
                                                setTimeout(() => {
                                                  setExpandedQuantityItems(
                                                    (prev) => {
                                                      const newSet = new Set(
                                                        prev
                                                      );
                                                      newSet.delete(item.rowId);
                                                      return newSet;
                                                    }
                                                  );
                                                }, 300);
                                              }}
                                              className="w-8 h-8 rounded-full bg-gray-600 text-white hover:bg-gray-500 flex items-center justify-center text-sm transition-colors"
                                            >
                                              +
                                            </button>
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleRemoveItem(
                                                  locationCart.locationId,
                                                  item.rowId
                                                );
                                                setExpandedQuantityItems(
                                                  (prev) => {
                                                    const newSet = new Set(
                                                      prev
                                                    );
                                                    newSet.delete(item.rowId);
                                                    return newSet;
                                                  }
                                                );
                                              }}
                                              disabled={
                                                removingItems.has(item.rowId) ||
                                                isRemoving
                                              }
                                              className={`text-red-400 hover:text-red-300 transition-colors ${
                                                removingItems.has(item.rowId) ||
                                                isRemoving
                                                  ? "opacity-50 cursor-not-allowed"
                                                  : ""
                                              }`}
                                            >
                                              {removingItems.has(item.rowId) ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                              ) : (
                                                <Trash2 className="w-4 h-4" />
                                              )}
                                            </button>
                                          </div>
                                        ) : (
                                          <div
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              toggleQuantityControls(
                                                item.rowId,
                                                e
                                              );
                                            }}
                                            className="border-2 border-[#505050] hover:border-blue-400 text-blue-400 text-center cursor-pointer transition-colors text-xs font-medium p-2 rounded w-[40px] h-[40px] flex items-center justify-center"
                                          >
                                            {item.qty}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                          </div>

                          {/* Location Summary */}
                          <div
                            className={`${
                              locationId
                                ? "fixed bottom-0 left-0 right-0 bg-[#1a1a1a] border-t border-gray-600 p-4"
                                : "mt-3 pt-3 border-t border-gray-600"
                            }`}
                          >
                            <div className="flex justify-between items-center mb-3">
                              <span className="text-gray-300 text-sm">
                                Σύνολο:
                              </span>
                              <span className="text-white font-medium">
                                {locationCart.summary.total.toFixed(2)}€
                              </span>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (
                                  isDeliveryBlocked(locationCart.locationId)
                                ) {
                                  toast.error(
                                    "Η διεύθυνσή σας είναι εκτός περιοχής παράδοσης"
                                  );
                                  return;
                                }
                                router.push(
                                  `/${currentLang}/checkout?locationId=${locationCart.locationId}`
                                );
                                onClose();
                              }}
                              disabled={isDeliveryBlocked(
                                locationCart.locationId
                              )}
                              className={`w-full font-medium py-4 px-6 rounded-2xl transition-all duration-200 flex items-center justify-center shadow-2xl backdrop-blur-sm ${
                                isDeliveryBlocked(locationCart.locationId)
                                  ? "bg-gray-600 text-gray-400 cursor-not-allowed opacity-50"
                                  : "bg-[#9E2E29] hover:bg-[#601B19] text-white shadow-blue-500/25"
                              }`}
                            >
                              Ολοκλήρωση παραγγελίας
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="text-center text-gray-400 py-8">
              <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Δεν υπάρχουν προηγούμενες παραγγελίες</p>
            </div>
          )}
        </div>
      </div>
      <MenuOptionsModal
        isOpen={isMenuOptionsModalOpen}
        onClose={closeMenuOptionsModal}
        menuItem={modalMenuItem}
        onAddToCart={handleMenuOptionsSubmit}
        initialSelectedOptions={modalInitialSelections}
        initialQuantity={modalInitialQuantity}
        initialComment={modalInitialComment}
        confirmLabel="Ενημέρωση αντικειμένου"
        isSubmitting={isSubmittingMenuOptions}
      />
    </div>
  );
}
