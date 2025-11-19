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

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-10 md:hidden"
      style={{ position: "fixed", bottom: 0, left: 0, right: 0 }}
    >
      <div className="bg-[#1a1a1a] border-t border-border shadow-lg">
        <div className="flex items-center gap-2 justify-around py-3">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex flex-col items-center justify-center py-2 px-3 min-w-0 flex-1 cursor-pointer"
              >
                <Icon
                  className={`w-6 h-6 mb-1 transition-colors ${
                    isActive ? "text-[#009DE0]" : "text-white"
                  }`}
                />
                <span
                  className={`text-xs font-medium transition-colors ${
                    isActive ? "text-[#009DE0]" : "text-white"
                  }`}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
