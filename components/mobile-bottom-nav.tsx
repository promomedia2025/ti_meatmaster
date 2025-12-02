"use client";

import { useState } from "react";
import { Leaf, Utensils, Store } from "lucide-react";

export function MobileBottomNav() {
  const [activeTab, setActiveTab] = useState<
    "suggestions" | "restaurants" | "stores"
  >("restaurants");

  const tabs = [
    {
      id: "restaurants" as const,
      label: "Εστιατόρια",
      icon: Utensils,
      color: "text-white",
    },
  ];

  return <></>;
}
