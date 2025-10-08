"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { toast } from "sonner";
import { useLocationFromUrl } from "./use-location-from-url";

export interface CartItem {
  rowId: string;
  id: number;
  name: string;
  qty: number;
  price: number;
  subtotal: number;
  options: any[];
  comment: string;
}

export interface LocationCart {
  locationId: number;
  locationName: string;
  items: CartItem[];
  summary: {
    count: number;
    subtotal: number;
    total: number;
  };
  restaurantStatus?: {
    isOpen: boolean;
    deliveryAvailable: boolean;
    pickupAvailable: boolean;
    statusMessage: string;
    nextOpeningTime?: string | null;
  };
}

export interface GlobalCartSummary {
  totalLocations: number;
  totalItems: number;
  totalAmount: number;
}

interface CartContextType {
  locationCarts: LocationCart[];
  globalSummary: GlobalCartSummary;
  isLoading: boolean;
  addItem: (
    menuId: number,
    quantity: number,
    options?: any[],
    comment?: string,
    menuItemData?: { name: string; price: number },
    restaurantStatus?: {
      isOpen: boolean;
      deliveryAvailable: boolean;
      pickupAvailable: boolean;
      statusMessage: string;
      nextOpeningTime?: string | null;
    }
  ) => Promise<boolean>;
  removeItem: (locationId: number, rowId: string) => void;
  updateQuantity: (locationId: number, rowId: string, quantity: number) => void;
  clearLocationCart: (locationId: number) => void;
  clearAllCarts: () => void;
  refreshCart: () => void;
  getLocationCart: (locationId: number) => LocationCart | undefined;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [locationCarts, setLocationCarts] = useState<LocationCart[]>([]);
  const [globalSummary, setGlobalSummary] = useState<GlobalCartSummary>({
    totalLocations: 0,
    totalItems: 0,
    totalAmount: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const { locationId, locationName } = useLocationFromUrl();

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      try {
        const cartData = JSON.parse(savedCart);

        // Handle both old format (backward compatibility) and new format
        if (cartData.locationCarts) {
          // New multi-location format
          const loadedLocationCarts = cartData.locationCarts || [];
          setLocationCarts(loadedLocationCarts);

          // Calculate global summary
          const totalLocations = loadedLocationCarts.length;
          const totalItems = loadedLocationCarts.reduce(
            (sum: number, cart: LocationCart) => sum + cart.summary.count,
            0
          );
          const totalAmount = loadedLocationCarts.reduce(
            (sum: number, cart: LocationCart) => sum + cart.summary.total,
            0
          );

          setGlobalSummary({
            totalLocations,
            totalItems,
            totalAmount,
          });

          console.log("🛒 Multi-location cart loaded from localStorage:", {
            locations: totalLocations,
            totalItems,
            totalAmount,
          });
        } else if (cartData.items) {
          // Old single cart format - migrate to new format
          const loadedItems = cartData.items || [];
          if (loadedItems.length > 0) {
            // Create a default location cart for existing items
            const defaultLocationCart: LocationCart = {
              locationId: 0, // Default location ID
              locationName: "Default Location",
              items: loadedItems,
              summary: {
                count: loadedItems.length,
                subtotal: loadedItems.reduce(
                  (sum: number, item: CartItem) => sum + item.subtotal,
                  0
                ),
                total: loadedItems.reduce(
                  (sum: number, item: CartItem) => sum + item.subtotal,
                  0
                ),
              },
            };

            setLocationCarts([defaultLocationCart]);
            setGlobalSummary({
              totalLocations: 1,
              totalItems: loadedItems.length,
              totalAmount: defaultLocationCart.summary.total,
            });

            console.log(
              "🔄 Migrated old cart format to new multi-location format"
            );
          }
        }
      } catch (error) {
        console.error("Error loading cart from localStorage:", error);
        // Clear corrupted data
        localStorage.removeItem("cart");
      }
    } else {
      console.log("🛒 Cart - No saved cart found");
    }

    // Mark as initialized after loading attempt
    setIsInitialized(true);
  }, []);

  // Save cart to localStorage whenever locationCarts change (but only after initialization)
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem(
        "cart",
        JSON.stringify({ locationCarts, globalSummary })
      );
      console.log("💾 Multi-location cart saved to localStorage:", {
        locations: locationCarts.length,
        totalItems: globalSummary.totalItems,
        totalAmount: globalSummary.totalAmount,
      });
    }
  }, [locationCarts, globalSummary, isInitialized]);

  const addItem = async (
    menuId: number,
    quantity: number,
    options: any[] = [],
    comment: string = "",
    menuItemData?: { name: string; price: number },
    restaurantStatus?: {
      isOpen: boolean;
      deliveryAvailable: boolean;
      pickupAvailable: boolean;
      statusMessage: string;
      nextOpeningTime?: string | null;
    }
  ): Promise<boolean> => {
    setIsLoading(true);

    try {
      // Get location from URL
      if (!locationId) {
        console.error("No location found in URL - cannot add item to cart");
        toast.error(
          "Δεν μπορείτε να προσθέσετε προϊόν στο καλάθι - δεν βρέθηκε τοποθεσία"
        );
        return false;
      }

      // Generate a unique row ID for the cart item
      const rowId = `${locationId}_${menuId}_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      // Use provided menu item data or fallback to mock data
      const menuItem = menuItemData || {
        name: `Menu Item ${menuId}`,
        price: 10.99,
      };

      const newItem: CartItem = {
        rowId,
        id: menuId,
        name: menuItem.name,
        qty: quantity,
        price: menuItem.price,
        subtotal: menuItem.price * quantity,
        options: options || [],
        comment: comment || "",
      };

      setLocationCarts((prevCarts) => {
        // Find existing location cart
        const existingLocationIndex = prevCarts.findIndex(
          (cart) => cart.locationId === locationId
        );

        if (existingLocationIndex >= 0) {
          // Location cart exists - update it
          const updatedCarts = [...prevCarts];
          const locationCart = updatedCarts[existingLocationIndex];

          // Check if item already exists in this location's cart
          const existingItemIndex = locationCart.items.findIndex(
            (item) => item.id === newItem.id
          );

          if (existingItemIndex >= 0) {
            // Update existing item quantity
            locationCart.items[existingItemIndex].qty += newItem.qty;
            locationCart.items[existingItemIndex].subtotal =
              locationCart.items[existingItemIndex].qty *
              locationCart.items[existingItemIndex].price;
          } else {
            // Add new item to location cart
            locationCart.items.push(newItem);
          }

          // Recalculate location cart summary
          locationCart.summary.count = locationCart.items.length;
          locationCart.summary.subtotal = locationCart.items.reduce(
            (sum, item) => sum + item.subtotal,
            0
          );
          locationCart.summary.total = locationCart.summary.subtotal;

          // Update restaurant status if provided
          if (restaurantStatus) {
            locationCart.restaurantStatus = restaurantStatus;
          }

          return updatedCarts;
        } else {
          // Create new location cart
          const newLocationCart: LocationCart = {
            locationId,
            locationName: locationName || `Location ${locationId}`,
            items: [newItem],
            summary: {
              count: 1,
              subtotal: newItem.subtotal,
              total: newItem.subtotal,
            },
            restaurantStatus: restaurantStatus,
          };

          return [...prevCarts, newLocationCart];
        }
      });

      // Update global summary
      setGlobalSummary((prevSummary) => {
        const updatedCarts = locationCarts;
        const totalLocations = updatedCarts.length;
        const totalItems = updatedCarts.reduce(
          (sum, cart) => sum + cart.summary.count,
          0
        );
        const totalAmount = updatedCarts.reduce(
          (sum, cart) => sum + cart.summary.total,
          0
        );

        return {
          totalLocations,
          totalItems,
          totalAmount,
        };
      });

      console.log("🛒 Item added to location cart:", {
        locationId,
        locationName,
        itemName: newItem.name,
        quantity: newItem.qty,
      });

      // Show success toast
      toast.success(`${newItem.name} προστέθηκε στο καλάθι`, {
        description: `${locationName || `Location ${locationId}`} • Ποσότητα: ${
          newItem.qty
        }`,
        action: {
          label: "Προβολή καλαθιού",
          onClick: () => {
            // You can add logic here to open the cart sidebar
            console.log("Open cart sidebar");
          },
        },
      });

      return true;
    } catch (error) {
      console.error("Error adding item to cart:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const removeItem = (locationId: number, rowId: string) => {
    setLocationCarts((prevCarts) => {
      const updatedCarts = prevCarts.map((cart) => {
        if (cart.locationId === locationId) {
          const updatedItems = cart.items.filter(
            (item) => item.rowId !== rowId
          );
          return {
            ...cart,
            items: updatedItems,
            summary: {
              count: updatedItems.length,
              subtotal: updatedItems.reduce(
                (sum, item) => sum + item.subtotal,
                0
              ),
              total: updatedItems.reduce((sum, item) => sum + item.subtotal, 0),
            },
          };
        }
        return cart;
      });

      // Remove empty location carts
      return updatedCarts.filter((cart) => cart.items.length > 0);
    });

    // Update global summary
    setGlobalSummary((prevSummary) => {
      const updatedCarts = locationCarts;
      const totalLocations = updatedCarts.length;
      const totalItems = updatedCarts.reduce(
        (sum, cart) => sum + cart.summary.count,
        0
      );
      const totalAmount = updatedCarts.reduce(
        (sum, cart) => sum + cart.summary.total,
        0
      );

      return {
        totalLocations,
        totalItems,
        totalAmount,
      };
    });
  };

  const updateQuantity = (
    locationId: number,
    rowId: string,
    quantity: number
  ) => {
    if (quantity <= 0) {
      removeItem(locationId, rowId);
      return;
    }

    setLocationCarts((prevCarts) => {
      return prevCarts.map((cart) => {
        if (cart.locationId === locationId) {
          const updatedItems = cart.items.map((item) =>
            item.rowId === rowId
              ? { ...item, qty: quantity, subtotal: item.price * quantity }
              : item
          );

          return {
            ...cart,
            items: updatedItems,
            summary: {
              count: updatedItems.length,
              subtotal: updatedItems.reduce(
                (sum, item) => sum + item.subtotal,
                0
              ),
              total: updatedItems.reduce((sum, item) => sum + item.subtotal, 0),
            },
          };
        }
        return cart;
      });
    });

    // Update global summary
    setGlobalSummary((prevSummary) => {
      const updatedCarts = locationCarts;
      const totalLocations = updatedCarts.length;
      const totalItems = updatedCarts.reduce(
        (sum, cart) => sum + cart.summary.count,
        0
      );
      const totalAmount = updatedCarts.reduce(
        (sum, cart) => sum + cart.summary.total,
        0
      );

      return {
        totalLocations,
        totalItems,
        totalAmount,
      };
    });
  };

  const clearLocationCart = (locationId: number) => {
    setLocationCarts((prevCarts) => {
      const updatedCarts = prevCarts.filter(
        (cart) => cart.locationId !== locationId
      );
      return updatedCarts;
    });

    // Update global summary
    setGlobalSummary((prevSummary) => {
      const updatedCarts = locationCarts.filter(
        (cart) => cart.locationId !== locationId
      );
      const totalLocations = updatedCarts.length;
      const totalItems = updatedCarts.reduce(
        (sum, cart) => sum + cart.summary.count,
        0
      );
      const totalAmount = updatedCarts.reduce(
        (sum, cart) => sum + cart.summary.total,
        0
      );

      return {
        totalLocations,
        totalItems,
        totalAmount,
      };
    });

    console.log("🗑️ Location cart cleared:", locationId);
  };

  const clearAllCarts = () => {
    setLocationCarts([]);
    setGlobalSummary({
      totalLocations: 0,
      totalItems: 0,
      totalAmount: 0,
    });
    localStorage.removeItem("cart");
    console.log("🗑️ All carts cleared");
  };

  const refreshCart = () => {
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      try {
        const cartData = JSON.parse(savedCart);

        if (cartData.locationCarts) {
          const loadedLocationCarts = cartData.locationCarts || [];
          setLocationCarts(loadedLocationCarts);

          // Calculate global summary
          const totalLocations = loadedLocationCarts.length;
          const totalItems = loadedLocationCarts.reduce(
            (sum: number, cart: LocationCart) => sum + cart.summary.count,
            0
          );
          const totalAmount = loadedLocationCarts.reduce(
            (sum: number, cart: LocationCart) => sum + cart.summary.total,
            0
          );

          setGlobalSummary({
            totalLocations,
            totalItems,
            totalAmount,
          });

          console.log("🔄 Multi-location cart refreshed from localStorage:", {
            locations: totalLocations,
            totalItems,
            totalAmount,
          });
        }
      } catch (error) {
        console.error("Error refreshing cart from localStorage:", error);
      }
    }
  };

  const getLocationCart = (locationId: number): LocationCart | undefined => {
    return locationCarts.find((cart) => cart.locationId === locationId);
  };

  const value: CartContextType = {
    locationCarts,
    globalSummary,
    isLoading,
    addItem,
    removeItem,
    updateQuantity,
    clearLocationCart,
    clearAllCarts,
    refreshCart,
    getLocationCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
