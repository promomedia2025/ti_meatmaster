"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
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
    if (!user?.id) {
      console.log("🔄 [LOAD CART] Skipping - no user ID");
      return;
    }

    try {
      setIsLoading(true);
      console.log(
        "🔄 [LOAD CART] Fetching cart from server for user:",
        user.id
      );

      const response = await fetch(`/api/cart/user/${user.id}`);
      const data = await response.json();

      console.log("🔄 [LOAD CART] Server response received:", {
        success: data.success,
        hasData: !!data.data,
        cartsCount: data.data?.carts?.length || 0,
      });
      console.log(
        "🔄 [LOAD CART] Full server response:",
        JSON.stringify(data, null, 2)
      );

      if (data.success && data.data) {
        // Transform server cart data to our format
        // The response contains an array 'carts' inside of data
        const serverCarts = (data.data.carts || []).map((cart: any) => {
          // Convert items object to array if needed
          const itemsArray = (
            cart.items && typeof cart.items === "object"
              ? Object.values(cart.items)
              : cart.items || []
          ).map((item: any) => {
            // Group options by menu_option_id to combine multiple values for the same option
            let groupedOptions: CartItemOption[] = [];
            if (item.options && Array.isArray(item.options)) {
              const optionsMap = new Map<number, CartItemOption>();

              item.options.forEach((option: any) => {
                const optionId = option.menu_option_id || option.menuOptionId;
                if (!optionId) return;

                if (optionsMap.has(optionId)) {
                  // Option already exists, add values to it
                  const existingOption = optionsMap.get(optionId)!;
                  if (option.values && Array.isArray(option.values)) {
                    existingOption.values.push(...option.values);
                  } else if (
                    option.menu_option_value_id ||
                    option.menuOptionValueId
                  ) {
                    // Single value, add it
                    existingOption.values.push({
                      menu_option_value_id:
                        option.menu_option_value_id || option.menuOptionValueId,
                      option_value_name:
                        option.option_value_name ||
                        option.optionValueName ||
                        option.name,
                      price: option.price || 0,
                      qty: option.qty || 1,
                    });
                  }
                } else {
                  // New option, create it
                  const values =
                    option.values && Array.isArray(option.values)
                      ? option.values.map((val: any) => ({
                          menu_option_value_id:
                            val.menu_option_value_id ||
                            val.menuOptionValueId ||
                            val.id,
                          option_value_name:
                            val.option_value_name ||
                            val.optionValueName ||
                            val.name,
                          price: val.price || 0,
                          qty: val.qty || 1,
                        }))
                      : option.menu_option_value_id || option.menuOptionValueId
                      ? [
                          {
                            menu_option_value_id:
                              option.menu_option_value_id ||
                              option.menuOptionValueId,
                            option_value_name:
                              option.option_value_name ||
                              option.optionValueName ||
                              option.name,
                            price: option.price || 0,
                            qty: option.qty || 1,
                          },
                        ]
                      : [];

                  optionsMap.set(optionId, {
                    menu_option_id: optionId,
                    option_name:
                      option.option_name || option.optionName || option.name,
                    values: values,
                  });
                }
              });

              groupedOptions = Array.from(optionsMap.values());
            }

            return {
              ...item,
              image:
                item.image?.url ||
                item.image_url ||
                item.menu_image ||
                item.image ||
                undefined,
              options: groupedOptions,
            };
          });

          return {
            locationId: cart.location_id || cart.locationId,
            locationName: cart.location_name || cart.locationName,
            locationImage:
              cart.location_image ||
              cart.locationImage ||
              cart.images?.thumbnail?.url,
            items: itemsArray,
            summary: {
              // Summary is nested in the response: cart.summary.count, etc.
              count: cart.summary?.count || cart.count || 0,
              subtotal: cart.summary?.subtotal || cart.subtotal || 0,
              total: cart.summary?.total || cart.total || 0,
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

        console.log("🔄 [LOAD CART] Processed carts:", {
          totalServerCarts: serverCarts.length,
          nonEmptyCarts: nonEmptyCarts.length,
          carts: nonEmptyCarts.map((cart: any) => ({
            locationId: cart.locationId,
            locationName: cart.locationName,
            itemsCount: cart.items?.length || 0,
            total: cart.summary?.total || 0,
          })),
        });

        // Replace state with server data to ensure UI reflects latest state
        console.log("🔄 [LOAD CART] Replacing cart state with server data:", {
          previousCartsCount: locationCarts.length,
          newCartsCount: nonEmptyCarts.length,
        });

        // Directly set the carts from server response - this ensures UI always reflects server state
        // When refresh cart response arrives, set the server cart context state to that new state
        const newCartState: LocationCart[] = nonEmptyCarts as LocationCart[];
        console.log("🔄 [LOAD CART] Setting new cart state:", {
          stateType: "LocationCart[]",
          itemsCount: newCartState.length,
          totalItems: newCartState.reduce(
            (sum, cart) => sum + (cart.items?.length || 0),
            0
          ),
        });

        setLocationCarts(newCartState);

        console.log("🔄 [LOAD CART] ✅ Cart state set from server response:", {
          finalCartsCount: newCartState.length,
          finalCarts: newCartState.map((cart) => ({
            locationId: cart.locationId,
            locationName: cart.locationName,
            itemsCount: cart.items?.length || 0,
            total: cart.summary?.total || 0,
          })),
        });
        console.log(
          "🔄 [LOAD CART] ✅ Full final cart state:",
          JSON.stringify(newCartState, null, 2)
        );
      } else {
        console.log("🔄 [LOAD CART] ⚠️ No data or unsuccessful response");
      }
      // Don't clear cart on error or empty response - preserve existing state
    } catch (error) {
      // Don't clear cart on error - preserve existing state
      console.error("🔄 [LOAD CART] ❌ Error loading cart from server:", error);
    } finally {
      setIsLoading(false);
      console.log("🔄 [LOAD CART] Loading state set to false");
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
    if (!isAuthenticated || !user?.id) {
      console.log(
        "🔄 [REFRESH CART] Skipping - user not authenticated or no user ID"
      );
      return;
    }

    console.log("🔄 [REFRESH CART] Starting cart refresh for user:", user.id);
    try {
      await loadCartFromServer();
      console.log("🔄 [REFRESH CART] ✅ Cart refresh completed successfully");
    } catch (error) {
      console.error("🔄 [REFRESH CART] ❌ Error during cart refresh:", error);
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

      setIsLoading(true);

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

      // Call server first to get real row ID
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
          console.log(
            "🛒 [ADD ITEM] ✅ Add endpoint returned successful response:",
            data
          );

          // Show success toast
          toast.success(
            `${
              menuItemData?.name || `Menu Item ${menuId}`
            } προστέθηκε στο καλάθι`,
            {
              description: `${
                locationName || `Location ${locationId}`
              } • Ποσότητα: ${quantity}`,
            }
          );

          setIsLoading(false);

          // Wait 500ms before refreshing cart to ensure server has processed the add
          console.log("🔄 [ADD ITEM] Waiting 500ms before refreshing cart...");
          await new Promise((resolve) => setTimeout(resolve, 500));

          // Refresh cart after delay
          console.log(
            "🔄 [ADD ITEM] Triggering cart refresh after successful add endpoint response"
          );
          await refreshCart();

          return true;
        } else {
          setIsLoading(false);
          toast.error(
            data.message || "Αποτυχία προσθήκης προϊόντος στο καλάθι"
          );
          console.log("🛒 [ADD ITEM] ❌ Server add failed");
          return false;
        }
      } catch (error) {
        setIsLoading(false);
        toast.error("Αποτυχία προσθήκης προϊόντος στο καλάθι");
        console.error("🛒 [ADD ITEM] ❌ Server add error:", error);
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

          // Refresh cart after successful remove
          console.log(
            "🔄 [REMOVE ITEM] Triggering cart refresh after successful remove"
          );
          await refreshCart();
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

      // Transform current item options to the format required by API
      const transformedOptions = (itemToUpdate.options || []).reduce(
        (acc: any[], option: CartItemOption) => {
          const valueObjs = option.values.map((val) => ({
            id: val.menu_option_value_id,
            name: val.option_value_name,
            price: val.price,
            qty: val.qty || 1,
          }));

          acc.push({
            id: option.menu_option_id,
            name: option.option_name,
            values: valueObjs,
          });

          return acc;
        },
        []
      );

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

      // Check if this is a temporary rowId - if so, refresh cart to get real rowId first
      let finalRowId = rowId;
      if (rowId.startsWith("temp-")) {
        console.log(
          "🛒 [UPDATE QUANTITY] ⚠️ Temporary rowId detected, refreshing cart to get real rowId"
        );
        // Refresh cart to replace temp IDs with real ones
        await refreshCart();

        // Find the item again by matching properties (id, options, comment) to get real rowId
        const refreshedCarts = locationCarts;
        const refreshedCart = refreshedCarts.find(
          (cart) => cart.locationId === actualLocationId
        );
        const refreshedItem = refreshedCart?.items.find(
          (item) =>
            item.id === itemToUpdate.id &&
            JSON.stringify(item.options || []) ===
              JSON.stringify(itemToUpdate.options || []) &&
            (item.comment || "") === (itemToUpdate.comment || "")
        );

        if (refreshedItem && !refreshedItem.rowId.startsWith("temp-")) {
          finalRowId = refreshedItem.rowId;
          console.log(
            `🛒 [UPDATE QUANTITY] ✅ Found real rowId: ${finalRowId} (was ${rowId})`
          );

          // Update the optimistic update to use real rowId
          applyOptimisticUpdate(`update-rowid-${updateId}`, (carts) => {
            const updatedCarts = carts.map((cart) => {
              if (cart.locationId === actualLocationId) {
                const updatedItems = cart.items.map((item) => {
                  if (item.rowId === rowId) {
                    return {
                      ...item,
                      rowId: finalRowId,
                      qty: quantity,
                      subtotal: item.price * quantity,
                    };
                  }
                  return item;
                });
                const newSummary = {
                  count: updatedItems.reduce((sum, item) => sum + item.qty, 0),
                  subtotal: updatedItems.reduce(
                    (sum, item) => sum + item.subtotal,
                    0
                  ),
                  total: updatedItems.reduce(
                    (sum, item) => sum + item.subtotal,
                    0
                  ),
                };
                return { ...cart, items: updatedItems, summary: newSummary };
              }
              return cart;
            });
            return updatedCarts;
          });
        } else {
          console.error(
            "🛒 [UPDATE QUANTITY] ❌ Could not find real rowId after refresh"
          );
          rollbackOptimisticUpdate(updateId);
          toast.error(
            "Δεν ήταν δυνατή η ενημέρωση. Παρακαλώ προσπαθήστε ξανά."
          );
          return false;
        }
      }

      // Silent server update in background
      try {
        console.log("🛒 [UPDATE QUANTITY] Calling server-side API:", {
          row_id: finalRowId,
          quantity,
          user_id: user.id,
          location_id: actualLocationId,
        });

        console.log("🛒 [UPDATE QUANTITY] Request body being sent:", {
          row_id: finalRowId,
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
            row_id: finalRowId,
            quantity,
            options: transformedOptions,
            comment: itemToUpdate.comment || "",
            user_id: user.id,
            location_id: actualLocationId,
          }),
        });

        const data = await response.json();

        if (data.success) {
          // Server update successful - clear optimistic update marker but keep the state
          // The optimistic update already has the correct state, so we just mark it as confirmed
          clearOptimisticUpdate(updateId);

          // If server response contains updated data, we could merge it, but optimistic state is usually correct
          console.log(
            "🛒 [UPDATE QUANTITY] ✅ Server sync successful - optimistic state confirmed"
          );

          // Refresh cart after successful update
          console.log(
            "🔄 [UPDATE QUANTITY] Triggering cart refresh after successful update"
          );
          await refreshCart();
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
    if (!isAuthenticated || !user?.id) {
      console.log(
        "🛒 [CART FETCH] Skipping - user not authenticated or no user ID"
      );
      return;
    }

    try {
      setIsLoading(true);
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/cart/user/${user.id}/all`;
      console.log(
        "🛒 [CART FETCH] Starting to fetch all user carts for user:",
        user.id
      );
      console.log("🛒 [CART FETCH] API URL:", apiUrl);

      const response = await fetch(apiUrl);
      console.log(
        "🛒 [CART FETCH] Response status:",
        response.status,
        response.ok
      );

      const data = await response.json();
      console.log("🛒 [CART FETCH] API response data:", data);

      if (data.success && data.data) {
        console.log("🛒 [CART FETCH] ✅ Successfully fetched cart data:", {
          user_id: data.data.user_id,
          total_carts: data.data.total_carts,
          carts_count: data.data.carts?.length || 0,
        });

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
                // Summary is nested in the response: cart.summary.count, etc.
                count: cart.summary?.count || cart.count || 0,
                subtotal: cart.summary?.subtotal || cart.subtotal || 0,
                total: cart.summary?.total || cart.total || 0,
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

          // Merge server data with existing state instead of replacing it
          setLocationCarts((prevCarts) => {
            // Create a map of server carts by locationId for easy lookup
            const serverCartsMap = new Map<number, LocationCart>(
              nonEmptyCarts.map((cart: any) => [
                cart.locationId,
                cart as LocationCart,
              ])
            );

            // Update existing carts with server data
            const updatedCarts = prevCarts.map((prevCart) => {
              const serverCart = serverCartsMap.get(prevCart.locationId);
              if (serverCart) {
                // Merge server data with existing cart, preserve optimistic updates
                const serverItemMap = new Map(
                  serverCart.items.map((item: any) => [item.rowId, item])
                );

                // Use server items directly - no temp IDs to preserve
                const mergedItems = serverCart.items;

                return {
                  ...prevCart,
                  locationName:
                    prevCart.locationName || serverCart.locationName,
                  locationImage:
                    serverCart.locationImage || prevCart.locationImage,
                  items: mergedItems,
                  summary: serverCart.summary,
                  restaurantStatus:
                    serverCart.restaurantStatus || prevCart.restaurantStatus,
                };
              }
              // Keep existing cart if not in server response (might have optimistic updates)
              return prevCart;
            });

            // Add any new carts from server
            const existingLocationIds = new Set(
              prevCarts.map((c) => c.locationId)
            );
            const newCarts = nonEmptyCarts
              .filter((cart: any) => !existingLocationIds.has(cart.locationId))
              .map((cart: any) => cart as LocationCart);

            return [...updatedCarts, ...newCarts];
          });
          console.log(
            "🛒 [CART FETCH] ✅ Carts loaded (empty carts filtered):",
            {
              total_carts: nonEmptyCarts.length,
              carts: nonEmptyCarts.map((cart: LocationCart) => ({
                locationId: cart.locationId,
                locationName: cart.locationName,
                items_count: cart.items.length,
                total: cart.summary.total,
              })),
            }
          );
        } else {
          console.log(
            "🛒 [CART FETCH] ℹ️ No carts array found in API response - preserving existing state"
          );
          // Don't clear - preserve existing state
        }
      } else {
        console.log(
          "🛒 [CART FETCH] ❌ API response not successful or no data - preserving existing state"
        );
        // Don't clear - preserve existing state
      }
    } catch (error) {
      console.error("🛒 [CART FETCH] ❌ Error fetching all user carts:", error);
      // Don't clear on error - preserve existing state
    } finally {
      setIsLoading(false);
      console.log("🛒 [CART FETCH] Fetch completed, loading set to false");
    }
  }, [isAuthenticated, user?.id]);

  const getLocationCart = useCallback(
    (locationId: number): LocationCart | undefined => {
      return locationCarts.find((cart) => cart.locationId === locationId);
    },
    [locationCarts]
  );

  // Fetch all user carts when user logs in
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      console.log(
        "🛒 [CART FETCH] User logged in, triggering cart fetch for user:",
        user.id
      );
      fetchAllUserCarts();
    } else {
      console.log(
        "🛒 [CART FETCH] User logged out or no user ID, clearing carts"
      );
      // Clear carts when user logs out
      setLocationCarts([]);
    }
  }, [isAuthenticated, user?.id, fetchAllUserCarts]);

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
