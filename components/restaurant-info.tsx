import { MapPin, Star, Clock, Euro, Info } from "lucide-react"

interface Restaurant {
  rating: number
  deliveryTime: string
  deliveryFee: string
  minOrder: string
}

interface RestaurantInfoProps {
  restaurant: Restaurant
}

export default function RestaurantInfo({ restaurant }: RestaurantInfoProps) {
  return (
    <div className="bg-gray-900 border-b border-gray-800 px-4 py-3">
      <div className="flex items-center gap-6 text-sm text-gray-300">
        <div className="flex items-center gap-1">
          <MapPin className="w-4 h-4 text-blue-400" />
          <span>Επιλογή τοποθεσίας</span>
        </div>

        <div className="flex items-center gap-1">
          <Star className="w-4 h-4 text-yellow-400" />
          <span>{restaurant.rating}</span>
        </div>

        <div className="flex items-center gap-1">
          <Clock className="w-4 h-4" />
          <span>Άνοιχτό μέχρι 1:00 π.μ.</span>
        </div>

        <div className="flex items-center gap-1">
          <Euro className="w-4 h-4" />
          <span>Ελάχιστη παραγγελία {restaurant.minOrder}€</span>
        </div>

        <button className="flex items-center gap-1 text-blue-400 hover:text-blue-300">
          <span>Περισσότερα</span>
          <Info className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
