import { notFound } from "next/navigation"
import RestaurantHeader from "@/components/restaurant-header"
import RestaurantInfo from "@/components/restaurant-info"
import RestaurantMenu from "@/components/restaurant-menu"

// Mock restaurant data - in a real app this would come from a database
const restaurants = {
  "kfc-syntagma": {
    id: "kfc-syntagma",
    name: "KFC Σύνταγμα",
    description: "Το πιο διάσημο τηγανητό κοτόπουλο, στη πόρτα σου!",
    image: "/kfc-bucket.jpg",
    heroImage: "/kfc-hero.jpg",
    rating: 8.4,
    deliveryTime: "20-30",
    deliveryFee: "0.00",
    minOrder: "6.00",
    categories: [
      "Δημοφιλή",
      "OFFERS",
      "BUCKET FOR 1",
      "BURGER MENU",
      "BURGERS",
      "WRAP MENU",
      "WRAPS",
      "CHICKEN MENU",
      "CHICKEN",
      "BUCKET MENU",
    ],
  },
  "mcdonalds-syntagma": {
    id: "mcdonalds-syntagma",
    name: "McDonald's Σύνταγμα",
    description: "Τα πιο νόστιμα γεύματα!",
    image: "/mcdonalds-meal.jpg",
    heroImage: "/mcdonalds-hero.jpg",
    rating: 8.6,
    deliveryTime: "15-25",
    deliveryFee: "0.50",
    minOrder: "5.00",
    categories: ["Δημοφιλή", "OFFERS", "BURGERS", "CHICKEN", "BREAKFAST", "DESSERTS", "DRINKS"],
  },
}

interface RestaurantPageProps {
  params: {
    slug: string
  }
}

export default function RestaurantPage({ params }: RestaurantPageProps) {
  const restaurant = restaurants[params.slug as keyof typeof restaurants]

  if (!restaurant) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-black">
      <RestaurantHeader restaurant={restaurant} />
      <RestaurantInfo restaurant={restaurant} />
      <RestaurantMenu restaurant={restaurant} />
    </div>
  )
}
