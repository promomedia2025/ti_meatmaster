"use client";

import { ShoppingCart } from "lucide-react";
import { useServerCart } from "@/lib/server-cart-context";
import { useCartSidebar } from "@/lib/cart-sidebar-context";

interface Props {
  locationId?: number;
}

export default function LocationCartCTA({ locationId }: Props) {
  const { getLocationCart } = useServerCart();
  const { setIsCartSidebarOpen, setCartViewLocationId } = useCartSidebar();

  const cart = locationId ? getLocationCart(locationId) : undefined;
  console.log(cart);
  const count = cart?.summary?.count ?? 0;
  const total = cart?.summary?.total ?? 0;

  return (
    <button
      onClick={() => {
        setCartViewLocationId(locationId);
        setIsCartSidebarOpen(true);
      }}
      className="
        flex items-center gap-3 bg-[var(--brand-border)] hover:bg-[var(--brand-hover)]
        text-white font-medium py-3 px-5 rounded-2xl
        transition-all duration-200 shadow-lg
      "
    >
      <span
        className="
          bg-white text-[var(--brand-border)] text-sm font-bold px-2 py-1
          rounded-full min-w-[20px] h-5 flex items-center justify-center
        "
      >
        {count}
      </span>

      <div className="flex items-center gap-2">
        <ShoppingCart className="w-4 h-4" />
        <span>Δες την παραγγελία σου</span>
      </div>

      <div className="font-bold">€{total.toFixed(2)}</div>
    </button>
  );
}
