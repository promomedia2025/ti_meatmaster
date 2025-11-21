"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import { toast } from "sonner";
import { useAuth } from "./auth-context";
import { useLocationFromUrl } from "./use-location-from-url";

export interface CartItemOptionValue {
  menu_option_value_id: number;
  option_value_name: string;
  price: number;
  qty: number;
}

export interface CartItemOption {
  menu_option_id: number;
  option_name: string;
  values: CartItemOptionValue[];
}

export interface CartItem {
  rowId: string;
  id: number;
  name: string;
  qty: number;
  price: number;
  subtotal: number;
  options: CartItemOption[];
  comment: string;
  image?: string; // URL to menu item image
}

export interface LocationCart {
  locationId: number;
  locationName: string;
  locationImage?: string; // URL to restaurant image
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

interface ServerCartContextType {
  locationCarts: LocationCart[];
  globalSummary: GlobalCartSummary;
  isLoading: boolean;
  addItem: (
    menuId: number,
    quantity: number,
    optionValues?: CartItemOptionValue[],
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
  removeItem: (locationId: number, rowId: string) => Promise<boolean>;
  updateQuantity: (
    locationId: number,
    rowId: string,
    quantity: number
  ) => Promise<boolean>;
  clearLocationCart: (locationId: number) => Promise<boolean>;
  clearAllCarts: () => Promise<boolean>;
  refreshCart: () => Promise<void>;
  fetchAllUserCarts: () => Promise<void>;
  getLocationCart: (locationId: number) => LocationCart | undefined;
}

const ServerCartContext = createContext<ServerCartContextType | undefined>(
  undefined
);

export function ServerCartProvider({ children }: { children: ReactNode }) {
  const [locationCarts, setLocationCarts] = useState<LocationCart[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [optimisticUpdates, setOptimisticUpdates] = useState<Map<string, any>>(
    new Map()
  );
  const { user, isAuthenticated } = useAuth();
  const { locationId, locationName } = useLocationFromUrl();

  // Calculate global summary using useMemo for better performance
  const globalSummary = useMemo(() => {
    const totalLocations = locationCarts.length;
    const totalItems = locationCarts.reduce(
      (sum, cart) => sum + cart.summary.count,
      0
    );
    const totalAmount = locationCarts.reduce(
      (sum, cart) => sum + cart.summary.total,
      0
    );

    const summary = {
      totalLocations,
      totalItems,
      totalAmount,
    };

    return summary;
  }, [locationCarts]);

  const loadCartFromServer = useCallback(async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);

      const response = await fetch(`/api/cart/user/${user.id}`);
      const data = await response.json();

      if (data.success && data.data) {
        // Transform server cart data to our format
        const serverCarts = (data.data.locationCarts || []).map((cart: any) => {
          // Convert items object to array if needed
          const itemsArray = (
            cart.items && typeof cart.items === "object"
              ? Object.values(cart.items)
              : cart.items || []
          ).map((item: any) => ({
            ...item,
            image:
              item.image?.url ||
              item.image_url ||
              item.menu_image ||
              item.image ||
              undefined,
          }));

          return {
            locationId: cart.location_id || cart.locationId,
            locationName: cart.location_name || cart.locationName,
            locationImage:
              cart.location_image ||
              cart.locationImage ||
              cart.images?.thumbnail?.url,
            items: itemsArray,
            summary: {
              count: cart.count || 0,
              subtotal: cart.subtotal || 0,
              total: cart.total || 0,
            },
            restaurantStatus: cart.restaurantStatus,
          };
        });

        // Filter out empty carts (carts with no items or 0 items)
        const nonEmptyCarts = serverCarts.filter((cart: any) => {
          const hasItems =
            cart.items && Array.isArray(cart.items) && cart.items.length > 0;
          return hasItems;
        });

        setLocationCarts(nonEmptyCarts);
      } else {
        setLocationCarts([]);
      }
    } catch (error) {
      setLocationCarts([]);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Cart will be loaded on-demand when user opens cart or navigates to cart page

  // Optimistic update helpers
  const applyOptimisticUpdate = useCallback(
    (updateId: string, updateFn: (carts: LocationCart[]) => LocationCart[]) => {
      setLocationCarts((prevCarts) => {
        const updatedCarts = updateFn([...prevCarts]);
        setOptimisticUpdates((prev) =>
          new Map(prev).set(updateId, {
            timestamp: Date.now(),
            originalCarts: prevCarts,
          })
        );
        return updatedCarts;
      });
    },
    []
  );

  const rollbackOptimisticUpdate = useCallback((updateId: string) => {
    setOptimisticUpdates((prev) => {
      const update = prev.get(updateId);
      if (update) {
        setLocationCarts(update.originalCarts);
        const newMap = new Map(prev);
        newMap.delete(updateId);
        return newMap;
      }
      return prev;
    });
  }, []);

  const clearOptimisticUpdate = useCallback((updateId: string) => {
    setOptimisticUpdates((prev) => {
      const newMap = new Map(prev);
      newMap.delete(updateId);
      return newMap;
    });
  }, []);

  const refreshCart = useCallback(async (): Promise<void> => {
    if (!isAuthenticated || !user?.id) return;

    try {
      await loadCartFromServer();
    } catch (error) {
      // Error handling without logging
    }
  }, [isAuthenticated, user?.id, loadCartFromServer]);

  const addItem = useCallback(
    async (
      menuId: number,
      quantity: number,
      optionValues: CartItemOptionValue[] = [],
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
      console.log("🛒 [ADD ITEM] Starting optimistic addItem function");
      console.log("🛒 [ADD ITEM] Params:", {
        menuId,
        quantity,
        optionValues,
        comment,
        menuItemData,
      });

      if (!isAuthenticated || !user?.id) {
        toast.error("Παρακαλώ συνδεθείτε για να προσθέσετε προϊόν στο καλάθι");
        return false;
      }

      if (!locationId) {
        console.log("🛒 [ADD ITEM] LOCATION ERROR", {
          locationId,
          locationName,
          pathname:
            typeof window !== "undefined" ? window.location.pathname : "n/a",
          user,
          isAuthenticated,
        });
        toast.error(
          "Δεν μπορείτε να προσθέσετε προϊόν στο καλάθι - δεν βρέθηκε τοποθεσία"
        );
        return false;
      }

      // Generate unique ID for this optimistic update
      const updateId = `add-${menuId}-${Date.now()}`;

      // Group optionValues by menu_option_id to create options array
      const optionsMap = new Map<
        number,
        {
          menu_option_id: number;
          option_name: string;
          values: CartItemOptionValue[];
        }
      >();

      optionValues.forEach((opt: any) => {
        const key = opt.menu_option_id || 0;
        if (!optionsMap.has(key)) {
          optionsMap.set(key, {
            menu_option_id: opt.menu_option_id || 0,
            option_name: opt.option_name || "",
            values: [],
          });
        }
        optionsMap.get(key)!.values.push({
          menu_option_value_id: opt.menu_option_value_id,
          option_value_name: opt.option_value_name,
          price: opt.price,
          qty: 1,
        });
      });

      // Create optimistic item
      const optimisticItem: CartItem = {
        rowId: `temp-${Date.now()}`,
        id: menuId,
        name: menuItemData?.name || `Menu Item ${menuId}`,
        qty: quantity,
        price: menuItemData?.price || 0,
        subtotal: (menuItemData?.price || 0) * quantity,
        options: Array.from(optionsMap.values()),
        comment,
      };

      // Apply optimistic update immediately
      applyOptimisticUpdate(updateId, (carts) => {
        const existingCartIndex = carts.findIndex(
          (cart) => cart.locationId === locationId
        );

        if (existingCartIndex >= 0) {
          // Add to existing cart
          const updatedCarts = [...carts];
          updatedCarts[existingCartIndex] = {
            ...updatedCarts[existingCartIndex],
            items: [...updatedCarts[existingCartIndex].items, optimisticItem],
            summary: {
              ...updatedCarts[existingCartIndex].summary,
              count: updatedCarts[existingCartIndex].summary.count + quantity,
              subtotal:
                updatedCarts[existingCartIndex].summary.subtotal +
                optimisticItem.subtotal,
              total:
                updatedCarts[existingCartIndex].summary.total +
                optimisticItem.subtotal,
            },
          };
          return updatedCarts;
        } else {
          // Create new cart
          const newCart: LocationCart = {
            locationId,
            locationName: locationName || `Location ${locationId}`,
            items: [optimisticItem],
            summary: {
              count: quantity,
              subtotal: optimisticItem.subtotal,
              total: optimisticItem.subtotal,
            },
            restaurantStatus,
          };
          return [...carts, newCart];
        }
      });

      // Show success toast immediately
      toast.success(
        `${menuItemData?.name || `Menu Item ${menuId}`} προστέθηκε στο καλάθι`,
        {
          description: `${
            locationName || `Location ${locationId}`
          } • Ποσότητα: ${quantity}`,
        }
      );

      // Silent server update in background
      try {
        const requestBody = {
          menu_id: menuId,
          quantity,
          options: optionValues || [],
          comment,
          location_id: locationId,
          user_id: user.id,
        };

        const response = await fetch("/api/cart/add", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        });

        const data = await response.json();

        if (data.success) {
          // Server update successful - clear optimistic update
          clearOptimisticUpdate(updateId);

          // For add operations, we might need to get the real rowId from server
          // But let's be conservative and only refresh if necessary
          console.log(
            "🛒 [ADD ITEM] ✅ Server sync successful - keeping optimistic state"
          );
        } else {
          // Server update failed - rollback optimistic update
          rollbackOptimisticUpdate(updateId);
          toast.error(data.message || "Αποτυχία συγχρονισμού με τον server");
          console.log("🛒 [ADD ITEM] ❌ Server sync failed, rolled back");
          return false;
        }
      } catch (error) {
        // Server update failed - rollback optimistic update
        rollbackOptimisticUpdate(updateId);
        toast.error("Αποτυχία συγχρονισμού με τον server");
        console.error("🛒 [ADD ITEM] ❌ Server sync error:", error);
        return false;
      }

      return true;
    },
    [
      isAuthenticated,
      user?.id,
      locationId,
      locationName,
      applyOptimisticUpdate,
      clearOptimisticUpdate,
      rollbackOptimisticUpdate,
      refreshCart,
    ]
  );

  const removeItem = useCallback(
    async (locationId: number, rowId: string): Promise<boolean> => {
      console.log("🛒 [REMOVE ITEM] Starting optimistic removeItem function");

      if (!isAuthenticated || !user?.id) {
        toast.error(
          "Παρακαλώ συνδεθείτε για να αφαιρέσετε προϊόν από το καλάθι"
        );
        return false;
      }

      // Generate unique ID for this optimistic update
      const updateId = `remove-${rowId}-${Date.now()}`;

      // Find the item to remove for optimistic update
      const cartIndex = locationCarts.findIndex(
        (cart) => cart.locationId === locationId
      );
      if (cartIndex === -1) {
        toast.error("Καλάθι δεν βρέθηκε");
        return false;
      }

      const itemToRemove = locationCarts[cartIndex].items.find(
        (item) => item.rowId === rowId
      );
      if (!itemToRemove) {
        toast.error("Προϊόν δεν βρέθηκε στο καλάθι");
        return false;
      }

      // Apply optimistic update immediately
      applyOptimisticUpdate(updateId, (carts) => {
        const updatedCarts = [...carts];
        const cart = updatedCarts[cartIndex];

        // Remove the item
        const updatedItems = cart.items.filter((item) => item.rowId !== rowId);

        // Recalculate summary
        const newSummary = {
          count: updatedItems.reduce((sum, item) => sum + item.qty, 0),
          subtotal: updatedItems.reduce((sum, item) => sum + item.subtotal, 0),
          total: updatedItems.reduce((sum, item) => sum + item.subtotal, 0),
        };

        updatedCarts[cartIndex] = {
          ...cart,
          items: updatedItems,
          summary: newSummary,
        };

        // Remove cart if it becomes empty
        if (updatedItems.length === 0) {
          console.log("🛒 [REMOVE ITEM] Cart is now empty, removing from UI");
          return updatedCarts.filter((_, index) => index !== cartIndex);
        }

        return updatedCarts;
      });

      // Show success toast immediately
      toast.success("Προϊόν αφαιρέθηκε από το καλάθι");

      // Silent server update in background
      try {
        const response = await fetch("/api/cart/remove", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            row_id: rowId,
            user_id: user.id,
            location_id: locationId,
          }),
        });

        const data = await response.json();

        if (data.success) {
          // Server update successful - clear optimistic update
          clearOptimisticUpdate(updateId);

          // Check if the cart is now empty and remove it if so
          setLocationCarts((prevCarts) => {
            const updatedCarts = prevCarts.filter((cart) => {
              if (cart.locationId === locationId) {
                const hasItems = cart.items && cart.items.length > 0;
                if (!hasItems) {
                  console.log(
                    "🛒 [REMOVE ITEM] Server confirmed cart is empty, removing from UI"
                  );
                  return false; // Remove this cart
                }
              }
              return true; // Keep this cart
            });

            return updatedCarts;
          });

          console.log(
            "🛒 [REMOVE ITEM] ✅ Server sync successful - cart removed if empty"
          );
        } else {
          // Server update failed - rollback optimistic update
          rollbackOptimisticUpdate(updateId);
          toast.error(data.message || "Αποτυχία συγχρονισμού με τον server");
          console.log("🛒 [REMOVE ITEM] ❌ Server sync failed, rolled back");
          return false;
        }
      } catch (error) {
        // Server update failed - rollback optimistic update
        rollbackOptimisticUpdate(updateId);
        toast.error("Αποτυχία συγχρονισμού με τον server");
        console.error("🛒 [REMOVE ITEM] ❌ Server sync error:", error);
        return false;
      }

      return true;
    },
    [
      isAuthenticated,
      user?.id,
      locationCarts,
      applyOptimisticUpdate,
      clearOptimisticUpdate,
      rollbackOptimisticUpdate,
      refreshCart,
    ]
  );

  const updateQuantity = useCallback(
    async (
      locationId: number,
      rowId: string,
      quantity: number
    ): Promise<boolean> => {
      console.log(
        "🛒 [UPDATE QUANTITY] Starting optimistic updateQuantity function"
      );

      if (!isAuthenticated || !user?.id) {
        toast.error("Παρακαλώ συνδεθείτε για να ενημερώσετε το καλάθι");
        return false;
      }

      if (quantity <= 0) {
        // Find the cart that contains the item with the given rowId
        const cartIndex = locationCarts.findIndex((cart) =>
          cart.items.some((item) => item.rowId === rowId)
        );

        if (cartIndex === -1) {
          toast.error("Προϊόν δεν βρέθηκε σε κανένα καλάθι");
          return false;
        }

        const actualLocationId = locationCarts[cartIndex].locationId;
        return await removeItem(actualLocationId, rowId);
      }

      // Generate unique ID for this optimistic update
      const updateId = `update-${rowId}-${Date.now()}`;

      // Find the cart that contains the item with the given rowId
      const cartIndex = locationCarts.findIndex((cart) =>
        cart.items.some((item) => item.rowId === rowId)
      );

      if (cartIndex === -1) {
        toast.error("Προϊόν δεν βρέθηκε σε κανένα καλάθι");
        return false;
      }

      // Get the actual locationId from the found cart
      const actualLocationId = locationCarts[cartIndex].locationId;
      console.log(
        "🛒 [UPDATE QUANTITY] Found cart with locationId:",
        actualLocationId
      );

      const itemToUpdate = locationCarts[cartIndex].items.find(
        (item) => item.rowId === rowId
      );
      if (!itemToUpdate) {
        toast.error("Προϊόν δεν βρέθηκε στο καλάθι");
        return false;
      }

      // Apply optimistic update immediately
      applyOptimisticUpdate(updateId, (carts) => {
        const updatedCarts = [...carts];
        const cart = updatedCarts[cartIndex];

        // Update the item quantity
        const updatedItems = cart.items.map((item) =>
          item.rowId === rowId
            ? { ...item, qty: quantity, subtotal: item.price * quantity }
            : item
        );

        // Recalculate summary
        const newSummary = {
          count: updatedItems.reduce((sum, item) => sum + item.qty, 0),
          subtotal: updatedItems.reduce((sum, item) => sum + item.subtotal, 0),
          total: updatedItems.reduce((sum, item) => sum + item.subtotal, 0),
        };

        updatedCarts[cartIndex] = {
          ...cart,
          items: updatedItems,
          summary: newSummary,
        };

        return updatedCarts;
      });

      // Silent server update in background
      try {
        console.log("🛒 [UPDATE QUANTITY] Calling server-side API:", {
          row_id: rowId,
          quantity,
          user_id: user.id,
          location_id: actualLocationId,
        });

        console.log("🛒 [UPDATE QUANTITY] Request body being sent:", {
          row_id: rowId,
          quantity,
          user_id: user.id,
          location_id: actualLocationId,
        });

        console.log("🛒 [UPDATE QUANTITY] actualLocationId value check:", {
          actualLocationId,
          actualLocationId_type: typeof actualLocationId,
          actualLocationId_undefined: actualLocationId === undefined,
          actualLocationId_null: actualLocationId === null,
        });

        const response = await fetch("/api/cart/update", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            row_id: rowId,
            quantity,
            user_id: user.id,
            location_id: actualLocationId,
          }),
        });

        const data = await response.json();

        if (data.success) {
          // Server update successful - clear optimistic update
          clearOptimisticUpdate(updateId);

          // For update operations, the optimistic update is usually correct
          console.log(
            "🛒 [UPDATE QUANTITY] ✅ Server sync successful - keeping optimistic state"
          );
        } else {
          // Server update failed - rollback optimistic update
          rollbackOptimisticUpdate(updateId);
          toast.error(data.message || "Αποτυχία συγχρονισμού με τον server");
          console.log(
            "🛒 [UPDATE QUANTITY] ❌ Server sync failed, rolled back"
          );
          return false;
        }
      } catch (error) {
        // Server update failed - rollback optimistic update
        rollbackOptimisticUpdate(updateId);
        toast.error("Αποτυχία συγχρονισμού με τον server");
        console.error("🛒 [UPDATE QUANTITY] ❌ Server sync error:", error);
        return false;
      }

      return true;
    },
    [
      isAuthenticated,
      user?.id,
      locationCarts,
      removeItem,
      applyOptimisticUpdate,
      clearOptimisticUpdate,
      rollbackOptimisticUpdate,
      refreshCart,
    ]
  );

  const clearLocationCart = useCallback(
    async (locationId: number): Promise<boolean> => {
      if (!isAuthenticated || !user?.id) {
        toast.error("Παρακαλώ συνδεθείτε για να αδειάσετε το καλάθι");
        return false;
      }

      setIsLoading(true);

      try {
        console.log("🛒 Clearing location cart on server:", {
          locationId,
          userId: user.id,
        });

        const response = await fetch("/api/cart/clear", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: user.id,
            location_id: locationId,
          }),
        });

        const data = await response.json();

        if (data.success) {
          // Refresh cart from server to get updated state
          await refreshCart();

          toast.success("Καλάθι άδειασε");
          return true;
        } else {
          toast.error(data.message || "Αποτυχία αδειάσματος καλαθιού");
          return false;
        }
      } catch (error) {
        console.error("Error clearing location cart:", error);
        toast.error("Αποτυχία αδειάσματος καλαθιού");
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [isAuthenticated, user?.id, refreshCart]
  );

  const clearAllCarts = useCallback(async (): Promise<boolean> => {
    if (!isAuthenticated || !user?.id) {
      toast.error("Παρακαλώ συνδεθείτε για να αδειάσετε όλα τα καλάθια");
      return false;
    }

    setIsLoading(true);

    try {
      console.log("🛒 Clearing all carts on server:", { userId: user.id });

      const response = await fetch("/api/cart/clear", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: user.id,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Refresh cart from server to get updated state
        await refreshCart();

        toast.success("Όλα τα καλάθια αδειάστηκαν");
        return true;
      } else {
        toast.error(data.message || "Αποτυχία αδειάσματος καλαθιών");
        return false;
      }
    } catch (error) {
      console.error("Error clearing all carts:", error);
      toast.error("Αποτυχία αδειάσματος καλαθιών");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user?.id, refreshCart]);

  const fetchAllUserCarts = useCallback(async (): Promise<void> => {
    if (!isAuthenticated || !user?.id) return;

    try {
      setIsLoading(true);
      console.log("🛒 Fetching all user carts for user:", user.id);

      const response = await fetch(
        `https://cocofino.bettersolution.gr/api/cart/user/${user.id}/all`
      );
      const data = await response.json();

      if (data.success && data.data) {
        console.log("🛒 All user carts fetched:", data.data);

        // Transform the API response to our format if needed
        // The API returns: { success: true, data: { user_id: "3", carts: [], total_carts: 0 } }
        if (data.data.carts && Array.isArray(data.data.carts)) {
          // Transform server cart data to our format
          const serverCarts = data.data.carts.map((cart: any) => {
            // Convert items object to array
            const itemsArray = (
              cart.items && typeof cart.items === "object"
                ? Object.values(cart.items)
                : []
            ).map((item: any) => ({
              ...item,
              image:
                item.image?.url ||
                item.image_url ||
                item.menu_image ||
                item.image ||
                undefined,
            }));

            return {
              locationId: cart.location_id || cart.locationId,
              locationName: cart.location_name || cart.locationName,
              locationImage:
                cart.location_image ||
                cart.locationImage ||
                cart.images?.thumbnail?.url,
              items: itemsArray,
              summary: {
                count: cart.count || 0,
                subtotal: cart.subtotal || 0,
                total: cart.total || 0,
              },
              restaurantStatus: cart.restaurantStatus,
            };
          });

          // Filter out empty carts (carts with no items or 0 items)
          const nonEmptyCarts = serverCarts.filter((cart: any) => {
            const hasItems =
              cart.items && Array.isArray(cart.items) && cart.items.length > 0;
            if (!hasItems) {
              console.log(
                "🛒 [FETCH ALL CARTS] Filtering out empty cart for location:",
                cart.locationId
              );
            }
            return hasItems;
          });

          setLocationCarts(nonEmptyCarts);
          console.log(
            "🛒 All carts loaded (empty carts filtered):",
            nonEmptyCarts
          );
        } else {
          console.log("🛒 No carts found for user");
          setLocationCarts([]);
        }
      } else {
        console.log("🛒 No cart data from API");
        setLocationCarts([]);
      }
    } catch (error) {
      console.error("Error fetching all user carts:", error);
      setLocationCarts([]);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user?.id]);

  const getLocationCart = useCallback(
    (locationId: number): LocationCart | undefined => {
      return locationCarts.find((cart) => cart.locationId === locationId);
    },
    [locationCarts]
  );

  const value: ServerCartContextType = useMemo(
    () => ({
      locationCarts,
      globalSummary,
      isLoading,
      addItem,
      removeItem,
      updateQuantity,
      clearLocationCart,
      clearAllCarts,
      refreshCart,
      fetchAllUserCarts,
      getLocationCart,
    }),
    [
      locationCarts,
      globalSummary,
      isLoading,
      addItem,
      removeItem,
      updateQuantity,
      clearLocationCart,
      clearAllCarts,
      refreshCart,
      fetchAllUserCarts,
      getLocationCart,
    ]
  );

  return (
    <ServerCartContext.Provider value={value}>
      {children}
    </ServerCartContext.Provider>
  );
}

export function useServerCart() {
  const context = useContext(ServerCartContext);
  if (context === undefined) {
    throw new Error("useServerCart must be used within a ServerCartProvider");
  }
  return context;
}
