"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface CartSidebarContextType {
  isCartSidebarOpen: boolean;
  setIsCartSidebarOpen: (open: boolean) => void;
  cartViewLocationId: number | undefined;
  setCartViewLocationId: (locationId: number | undefined) => void;
}

const CartSidebarContext = createContext<CartSidebarContextType | undefined>(
  undefined
);

export function CartSidebarProvider({ children }: { children: ReactNode }) {
  const [isCartSidebarOpen, setIsCartSidebarOpen] = useState(false);
  const [cartViewLocationId, setCartViewLocationId] = useState<
    number | undefined
  >(undefined);

  return (
    <CartSidebarContext.Provider
      value={{
        isCartSidebarOpen,
        setIsCartSidebarOpen,
        cartViewLocationId,
        setCartViewLocationId,
      }}
    >
      {children}
    </CartSidebarContext.Provider>
  );
}

export function useCartSidebar() {
  const context = useContext(CartSidebarContext);
  if (context === undefined) {
    throw new Error("useCartSidebar must be used within CartSidebarProvider");
  }
  return context;
}

