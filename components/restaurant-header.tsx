import Image from "next/image"
import { ArrowLeft, Heart } from "lucide-react"
import Link from "next/link"

interface Restaurant {
  id: string
  name: string
  description: string
  heroImage: string
}

interface RestaurantHeaderProps {
  restaurant: Restaurant
}

export default function RestaurantHeader({ restaurant }: RestaurantHeaderProps) {
  return (
    <div className="relative h-64 md:h-80 overflow-hidden">
      {/* Hero Image */}
      <Image
        src={restaurant.heroImage || "/placeholder.svg"}
        alt={restaurant.name}
        fill
        className="object-cover"
        priority
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Header Navigation */}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between">
        <Link href="/" className="p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>

        <button className="p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors">
          <Heart className="w-5 h-5" />
        </button>
      </div>

      {/* Restaurant Info */}
      <div className="absolute bottom-0 left-0 right-0 p-6">
        <div className="flex items-center gap-4 mb-2">
          <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center">
            <Image src="/kfc-logo.jpg" alt={restaurant.name} width={40} height={40} className="object-contain" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">{restaurant.name}</h1>
            <p className="text-gray-200 text-sm md:text-base">{restaurant.description}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
