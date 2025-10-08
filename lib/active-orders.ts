/**
 * Utility functions for managing active orders in localStorage
 */

const ACTIVE_ORDERS_KEY = "activeOrders";

export interface ActiveOrder {
  orderId: number;
  createdAt: string;
  locationName?: string;
}

/**
 * Get all active orders from localStorage
 */
export function getActiveOrders(): ActiveOrder[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem(ACTIVE_ORDERS_KEY);
    if (!stored) return [];

    const orders: ActiveOrder[] = JSON.parse(stored);

    // Clean up orders older than 24 hours
    const oneDayAgo = new Date();
    oneDayAgo.setHours(oneDayAgo.getHours() - 24);

    const activeOrders = orders.filter(
      (order) => new Date(order.createdAt) > oneDayAgo
    );

    // Update localStorage if we removed any old orders
    if (activeOrders.length !== orders.length) {
      localStorage.setItem(ACTIVE_ORDERS_KEY, JSON.stringify(activeOrders));
    }

    return activeOrders;
  } catch (error) {
    console.error("Error getting active orders:", error);
    return [];
  }
}

/**
 * Add a new order to active orders
 */
export function addActiveOrder(orderId: number, locationName?: string): void {
  if (typeof window === "undefined") return;

  try {
    const orders = getActiveOrders();

    // Check if order already exists
    const existingIndex = orders.findIndex((o) => o.orderId === orderId);

    const newOrder: ActiveOrder = {
      orderId,
      createdAt: new Date().toISOString(),
      locationName,
    };

    if (existingIndex >= 0) {
      // Update existing order
      orders[existingIndex] = newOrder;
    } else {
      // Add new order
      orders.push(newOrder);
    }

    localStorage.setItem(ACTIVE_ORDERS_KEY, JSON.stringify(orders));
    console.log(`💾 Added order ${orderId} to active orders`);
  } catch (error) {
    console.error("Error adding active order:", error);
  }
}

/**
 * Remove an order from active orders
 */
export function removeActiveOrder(orderId: number): void {
  if (typeof window === "undefined") return;

  try {
    const orders = getActiveOrders();
    const filtered = orders.filter((o) => o.orderId !== orderId);

    localStorage.setItem(ACTIVE_ORDERS_KEY, JSON.stringify(filtered));
    console.log(`🗑️ Removed order ${orderId} from active orders`);
  } catch (error) {
    console.error("Error removing active order:", error);
  }
}

/**
 * Clear all active orders
 */
export function clearActiveOrders(): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(ACTIVE_ORDERS_KEY);
    console.log("🗑️ Cleared all active orders");
  } catch (error) {
    console.error("Error clearing active orders:", error);
  }
}

/**
 * Get order IDs only (useful for subscriptions)
 */
export function getActiveOrderIds(): number[] {
  return getActiveOrders().map((order) => order.orderId);
}

