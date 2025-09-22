"use client"

import { useState } from "react"
import { Search, ShoppingCart } from "lucide-react"
import MenuSection from "./menu-section"

interface Restaurant {
  id: string
  name: string
  categories: string[]
}

interface RestaurantMenuProps {
  restaurant: Restaurant
}

export default function RestaurantMenu({ restaurant }: RestaurantMenuProps) {
  const [activeCategory, setActiveCategory] = useState("Δημοφιλή")
  const [cartItems] = useState(9) // Mock cart count

  return (
    <div className="bg-black">
      {/* Menu Navigation */}
      <div className="sticky top-0 bg-black border-b border-gray-800 z-10">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex-1 overflow-x-auto">
            <div className="flex gap-6 min-w-max">
              {restaurant.categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`text-sm font-medium whitespace-nowrap pb-2 border-b-2 transition-colors ${
                    activeCategory === category
                      ? "text-white border-blue-400"
                      : "text-gray-400 border-transparent hover:text-gray-300"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 ml-4">
            <div className="relative">
              <button className="flex items-center gap-2 bg-gray-800 text-white px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors">
                <ShoppingCart className="w-4 h-4" />
                <span>Περισσότερα ({cartItems})</span>
              </button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder={`Αναζήτηση σε${restaurant.name}`}
                className="bg-gray-800 text-white pl-10 pr-4 py-2 rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Menu Content */}
      <div className="px-4 py-6">
        {activeCategory === "Δημοφιλή" && <MenuSection title="Δημοφιλή" />}
        {activeCategory === "OFFERS" && <MenuSection title="Εκπτώσεις" isOffers />}
        {activeCategory === "BURGERS" && <MenuSection title="Burgers" />}
        {activeCategory === "CHICKEN" && <MenuSection title="Chicken" />}
      </div>
    </div>
  )
}
