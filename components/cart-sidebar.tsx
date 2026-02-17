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
  Minus,
  Plus,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
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
  is_enabled?: boolean;
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
  is_enabled?: boolean;
  available?: boolean;
  free_count: number;
  free_order_by: "selection_order" | "lowest_price" | "priority";
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
  
  // REMOVED: locationImages state and fetching logic (since we removed the header image)
  
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
    alert(
      `Παραγγελία ξανά για ${order.location_name} - Σύνολο: ${order.order_total} ${order.currency}`
    );
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
        return [];
      }

      const cartOptionsMap = new Map<number, CartItemOption>(
        cartItem.options.map((opt) => [opt.menu_option_id, opt])
      );

      const selections: SelectedOption[] = [];

      menuItem.menu_options.forEach((option) => {
        const cartOption = cartOptionsMap.get(option.menu_option_id);
        if (!cartOption) return;

        const optionValuesMap = new Map<number, MenuOptionValueData>(
          option.option_values.map((val) => [val.menu_option_value_id, val])
        );

        const matchingValues = cartOption.values
          .map((value) => {
            const optValue = optionValuesMap.get(value.menu_option_value_id);
            return optValue && optValue.available !== false ? optValue : null;
          })
          .filter(
            (optValue): optValue is MenuOptionValueData => optValue !== null
          );

        if (!matchingValues.length) {
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

      return selections;
    },
    [isSingleSelectMenuOption]
  );

  const getStatusColor = (statusName: string) => {
    switch (statusName.toLowerCase()) {
      case "delivery":
        return "bg-green-500/10 text-green-400 border-green-500/20";
      case "received":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "pending":
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
      case "cancelled":
        return "bg-[var(--brand-border)]/10 text-[var(--brand-border)] border-[var(--brand-border)]/20";
      default:
        return "bg-zinc-800 text-zinc-400 border-zinc-700";
    }
  };

  const getStatusText = (statusName: string) => {
    switch (statusName.toLowerCase()) {
      case "delivery": return "Στο δρόμο";
      case "received": return "Ολοκληρώθηκε";
      case "pending": return "Εκκρεμεί";
      case "cancelled": return "Ακυρώθηκε";
      default: return statusName;
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
      if (
        !locationId ||
        isLoadingMenuOptions ||
        isSubmittingMenuOptions ||
        clearingCarts.has(cart.locationId)
      ) {
        return;
      }

      setModalCartItem(cartItem);
      setModalLocationId(cart.locationId);
      setModalInitialQuantity(cartItem.qty);
      setModalInitialComment(cartItem.comment || "");
      setModalRestaurantStatus(cart.restaurantStatus);
      setIsMenuOptionsModalOpen(true);
      setIsLoadingMenuOptions(true);
      setModalMenuItem(null);
      setModalInitialSelections([]);

      try {
        let menuItems = menuItemsCacheRef.current.get(cart.locationId);
        let menuItemsMap = menuItemsMapCacheRef.current.get(cart.locationId);

        if (!menuItems) {
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

          menuItemsMap = new Map<number, LocationMenuItem>();
          menuItems.forEach((item) => {
            menuItemsMap!.set(item.menu_id, item);
          });
          menuItemsMapCacheRef.current.set(cart.locationId, menuItemsMap);
        } else if (!menuItemsMap) {
          menuItemsMap = new Map<number, LocationMenuItem>();
          menuItems.forEach((item) => {
            menuItemsMap!.set(item.menu_id, item);
          });
          menuItemsMapCacheRef.current.set(cart.locationId, menuItemsMap);
        }

        let menuItem: LocationMenuItem | undefined;

        if (menuItemsMap) {
          const cartItemId =
            typeof cartItem.id === "number" ? cartItem.id : Number(cartItem.id);
          menuItem = menuItemsMap.get(cartItemId);
        } else {
          menuItem = menuItems.find((item) => item.menu_id === cartItem.id);
          if (!menuItem) {
            menuItem = menuItems.find(
              (item) => Number(item.menu_id) === Number(cartItem.id)
            );
          }
        }

        if (!menuItem) {
          toast.error(
            `Δεν βρέθηκε το προϊόν "${cartItem.name}" στο μενού. Ίσως έχει αφαιρεθεί.`
          );
          setIsMenuOptionsModalOpen(false);
          return;
        }

        const initialSelections = buildInitialSelections(menuItem, cartItem);
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
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      {/* Sidebar with responsive animation */}
      <div
        className={`fixed bg-zinc-900 border-l border-zinc-800 shadow-2xl transition-all duration-500 ease-out flex flex-col
          /* Mobile: bottom-to-top animation, full width */
          bottom-0 left-0 right-0 ${locationId ? "h-screen" : "h-[95vh]"} ${
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
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <h2 className="text-xl font-bold text-white">Οι παραγγελίες σου</h2>
          <button
            onClick={onClose}
            className="p-2 bg-black rounded-full hover:bg-zinc-800 transition-colors cursor-pointer border border-zinc-800"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Tabs - only show when not in a specific restaurant */}
        {!locationId && (
          <div className="flex border-b border-zinc-800 bg-black">
            <button
              onClick={() => setActiveCartTab("carts")}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeCartTab === "carts"
                  ? "bg-zinc-900 text-white border-b-2 border-[var(--brand-border)]"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Καλάθια αγορών
            </button>
            <button
              onClick={() => setActiveCartTab("orders")}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeCartTab === "orders"
                  ? "bg-zinc-900 text-white border-b-2 border-[var(--brand-border)]"
                  : "text-zinc-400 hover:text-white"
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
                <div className="space-y-4">
                  {[...Array(3)].map((_, index) => (
                    <div
                      key={index}
                      className="bg-black rounded-xl p-4 border border-zinc-800"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <Skeleton className="h-4 w-32 mb-2 bg-zinc-800" />
                          <Skeleton className="h-3 w-48 mb-2 bg-zinc-800" />
                          <div className="flex items-center gap-2">
                            <Skeleton className="h-4 w-16 bg-zinc-800" />
                            <Skeleton className="h-5 w-20 rounded bg-zinc-800" />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : ordersError ? (
                <div className="text-center text-[var(--brand-border)] py-8 bg-[var(--brand-border)]/10 rounded-xl m-4 border border-[var(--brand-border)]/20">
                  <p>{ordersError}</p>
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center text-zinc-500 py-16 flex flex-col items-center">
                  <Clock className="w-12 h-12 mb-4 opacity-50" />
                  <p>Δεν υπάρχουν προηγούμενες παραγγελίες</p>
                </div>
              ) : (
                <div className="cart-scrollbar space-y-4">
                  {Array.isArray(orders) &&
                    orders.map((order) => (
                      <div
                        key={order.order_id}
                        className="bg-black rounded-xl p-4 border border-zinc-800 hover:border-zinc-700 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="text-white font-bold text-sm mb-1">
                              {order.location_name}
                            </h3>
                            <p className="text-zinc-400 text-xs mb-2 flex items-center gap-2">
                              <span>#{order.order_id}</span>
                              <span className="text-zinc-600">•</span>
                              <span>{formatDate(order.order_date, order.order_time)}</span>
                            </p>
                            <div className="flex items-center gap-3">
                              <span className="text-white font-bold text-sm">
                                {parseFloat(order.order_total).toFixed(2)}{" "}
                                {order.currency}
                              </span>
                              <span
                                className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getStatusColor(
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
                          className="w-full bg-zinc-900 text-zinc-300 py-2.5 rounded-lg font-medium hover:bg-zinc-800 hover:text-white transition-all text-sm flex items-center justify-center gap-2 border border-zinc-800"
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
                <div className="text-center text-zinc-500 py-16 flex flex-col items-center">
                  <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mb-4 border border-zinc-800">
                      <ShoppingCart className="w-8 h-8 text-zinc-600" />
                  </div>
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
                            locationId ? "" : "border border-zinc-800 bg-zinc-900"
                          } rounded-xl p-4 ${
                            locationId
                              ? ""
                              : "cursor-pointer hover:border-zinc-700 hover:bg-black transition-all"
                          }`}
                        >
                          {/* Location Header - NO IMAGE */}
                          <div className="flex items-center justify-between mb-4 border-b border-zinc-800/50 pb-3">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <h3 className="text-white font-bold truncate text-base">
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
                                className={`text-zinc-500 hover:text-[var(--brand-border)] transition-colors p-2 hover:bg-black rounded-full ${
                                  clearingCarts.has(locationCart.locationId)
                                    ? "opacity-50 cursor-not-allowed"
                                    : ""
                                }`}
                                title="Διαγραφή καλαθιού"
                              >
                                {clearingCarts.has(locationCart.locationId) ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </div>

                          {/* Location Items */}
                          <div
                            className={locationId ? "space-y-3" : "flex flex-col gap-2"}
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
                                      ? "flex flex-col gap-3 p-3 rounded-xl cursor-pointer bg-black border border-zinc-800 hover:border-zinc-700 transition-all"
                                      : "flex items-center justify-between p-2 rounded bg-black/50"
                                  } transition-all duration-300 ease-in-out ${
                                    removingItems.has(item.rowId)
                                      ? "opacity-0 scale-95 -translate-x-4"
                                      : "opacity-100 scale-100 translate-x-0"
                                  }`}
                                >
                                  {/* Item Header Row */}
                                  <div className="flex items-start justify-between w-full">
                                      <div className="flex gap-3 items-start flex-1">
                                          {/* Qty Badge (if no image or always visible) */}
                                          {!locationId && (
                                              <span className="text-zinc-500 font-bold text-xs pt-1">{item.qty}x</span>
                                          )}
                                          
                                          {/* Item Image */}
                                          {(item.image || menuItemImages.get(item.id)) ? (
                                            <div
                                              className={`relative ${
                                                locationId ? "w-16 h-16" : "w-10 h-10"
                                              } rounded-lg overflow-hidden flex-shrink-0 border border-zinc-800`}
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
                                                sizes="128px"
                                              />
                                            </div>
                                          ) : (
                                            <div
                                              className={`${
                                                locationId ? "w-16 h-12" : "w-10 h-10"
                                              } rounded-lg bg-zinc-800 flex items-center justify-center flex-shrink-0`}
                                            >
                                                <span className="text-[10px] text-zinc-600">IMG</span>
                                            </div>
                                          )}

                                          <div className="flex flex-col">
                                            <h4 className="text-white text-sm font-bold leading-tight">
                                              {item.name}
                                            </h4>
                                            
                                            {/* Options & Comments Preview */}
                                            {locationId && (
                                                <div className="text-xs text-zinc-500 mt-1 space-y-0.5">
                                                    {item.comment && <p className="italic">"{item.comment}"</p>}
                                                    {item.options && item.options.length > 0 && (
                                                        <p>{item.options.length} επιλογές</p>
                                                    )}
                                                </div>
                                            )}

                                            {!locationId && (
                                                <p className="text-zinc-500 text-xs mt-0.5">
                                                    {item.price.toFixed(2)}€
                                                </p>
                                            )}
                                          </div>
                                      </div>

                                      {/* Price (Location View) */}
                                      {locationId && (
                                          <div className="text-white font-bold text-sm">
                                              {item.subtotal.toFixed(2)}€
                                          </div>
                                      )}
                                  </div>

                                  {/* Controls (Only in Location View) */}
                                  {locationId && (
                                    <div className="flex items-center justify-between w-full pt-2 border-t border-zinc-800/50 mt-1">
                                      <div className="flex items-center gap-1 bg-zinc-900 rounded-lg p-1 border border-zinc-800">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            updateQuantity(
                                              locationCart.locationId,
                                              item.rowId,
                                              item.qty - 1
                                            );
                                          }}
                                          className="w-8 h-8 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
                                        >
                                          <Minus className="w-3 h-3" />
                                        </button>
                                        <span className="text-white font-bold text-sm w-6 text-center">
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
                                          }}
                                          className="w-8 h-8 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
                                        >
                                          <Plus className="w-3 h-3" />
                                        </button>
                                      </div>

                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleRemoveItem(
                                            locationCart.locationId,
                                            item.rowId
                                          );
                                        }}
                                        disabled={
                                          removingItems.has(item.rowId) ||
                                          isRemoving
                                        }
                                        className={`p-2 hover:bg-red-500/10 rounded-lg group/trash transition-colors ${
                                          removingItems.has(item.rowId) ||
                                          isRemoving
                                            ? "opacity-50 cursor-not-allowed"
                                            : ""
                                        }`}
                                      >
                                        {removingItems.has(item.rowId) ? (
                                          <Loader2 className="w-4 h-4 animate-spin text-[var(--brand-border)]" />
                                        ) : (
                                          <Trash2 className="w-4 h-4 text-zinc-600 group-hover/trash:text-[var(--brand-border)]" />
                                        )}
                                      </button>
                                    </div>
                                  )}
                                  
                                  {/* Qty Controls for Global Cart (Compact) */}
                                  {!locationId && (
                                      <div className="flex items-center gap-2">
                                          {expandedQuantityItems.has(item.rowId) ? (
                                              <div className="flex items-center gap-1 bg-black border border-zinc-800 rounded p-0.5">
                                                  <button
                                                      onClick={(e) => {
                                                          e.stopPropagation();
                                                          updateQuantity(locationCart.locationId, item.rowId, item.qty - 1);
                                                      }}
                                                      className="w-6 h-6 flex items-center justify-center hover:bg-zinc-800 rounded text-zinc-400"
                                                  >
                                                      -
                                                  </button>
                                                  <span className="text-xs text-white px-1">{item.qty}</span>
                                                  <button
                                                      onClick={(e) => {
                                                          e.stopPropagation();
                                                          updateQuantity(locationCart.locationId, item.rowId, item.qty + 1);
                                                      }}
                                                      className="w-6 h-6 flex items-center justify-center hover:bg-zinc-800 rounded text-zinc-400"
                                                  >
                                                      +
                                                  </button>
                                                  <button
                                                      onClick={(e) => {
                                                          e.stopPropagation();
                                                          handleRemoveItem(locationCart.locationId, item.rowId);
                                                      }}
                                                      className="w-6 h-6 flex items-center justify-center hover:bg-red-900/30 rounded text-red-400 ml-1"
                                                  >
                                                      <Trash2 className="w-3 h-3" />
                                                  </button>
                                              </div>
                                          ) : (
                                              <button
                                                  onClick={(e) => toggleQuantityControls(item.rowId, e)}
                                                  className="border border-zinc-700 hover:border-[var(--brand-border)] text-zinc-400 hover:text-white transition-colors text-xs p-1 rounded w-8 text-center"
                                              >
                                                  {item.qty}
                                              </button>
                                          )}
                                      </div>
                                  )}
                                </div>
                              ))}
                          </div>

                          {/* Location Summary */}
                          <div
                            className={`${
                              locationId
                                ? "fixed bottom-0 left-0 right-0 bg-[#1a1a1a] border-t border-zinc-800 p-4 md:absolute md:w-full"
                                : "mt-3 pt-3 border-t border-zinc-800"
                            }`}
                          >
                            <div className="flex justify-between items-center mb-4">
                              <span className="text-zinc-400 text-sm font-medium tracking-wide">
                                Σύνολο
                              </span>
                              <span className="text-white font-bold text-lg">
                                {locationCart.summary.total.toFixed(2)}€
                              </span>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(
                                  `/${currentLang}/checkout?locationId=${locationCart.locationId}`
                                );
                                onClose();
                              }}
                              className="w-full font-bold py-3.5 px-6 rounded-xl transition-all duration-200 flex items-center justify-center shadow-lg active:scale-[0.98] bg-[var(--brand-border)] hover:bg-[var(--brand-hover)] text-white"
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
            <div className="text-center text-zinc-500 py-16 flex flex-col items-center">
              <ShoppingCart className="w-12 h-12 mb-4 opacity-50" />
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