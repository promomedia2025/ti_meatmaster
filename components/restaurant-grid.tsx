import Image from "next/image"
import Link from "next/link"

const restaurants = [
  {
    id: 1,
    name: "McDonald's Σύνταγμα",
    slug: "mcdonalds-syntagma", // Added slug for routing
    description: "Τα πιο fit!",
    image: "/mcdonalds-meal.jpg",
    deliveryTime: "15-25",
    deliveryFee: "0.50",
    rating: "8.6",
    promotion: "10% Off | 30% with W+",
    promotionColor: "bg-blue-500",
  },
  {
    id: 2,
    name: "KFC Σύνταγμα",
    slug: "kfc-syntagma", // Added slug for routing
    description: "Το πιο διάσημο τηγανητό κοτόπουλο. σ...",
    image: "/kfc-bucket.jpg",
    deliveryTime: "20-30",
    deliveryFee: "0.00",
    rating: "8.4",
    promotion: "-15% στη παραγγελία σου",
    promotionColor: "bg-blue-500",
  },
  {
    id: 3,
    name: "Meat n Roses Κολωνάκι",
    slug: "meat-roses-kolonaki", // Added slug for routing
    description: "Αυθεντικό Σουβλάκι!",
    image: "/meat-roses-grill.jpg",
    deliveryTime: "30-40",
    deliveryFee: "1.00",
    rating: "9.2",
    promotion: "-4€ στη παραγγελία σου",
    promotionColor: "bg-blue-500",
  },
  {
    id: 4,
    name: "Hanoi",
    slug: "hanoi", // Added slug for routing
    description: "Βιετναμέζικα λαχταριστά πιάτα!",
    image: "/hanoi-vietnamese.jpg",
    deliveryTime: "30-40",
    deliveryFee: "0.00",
    rating: "9.2",
    promotion: "-4€ στη παραγγελία σου",
    promotionColor: "bg-blue-500",
  },
  {
    id: 5,
    name: "Shisan Σύνταγμα",
    slug: "shisan-syntagma", // Added slug for routing
    description: "Sushi bar!",
    image: "/shisan-sushi.jpg",
    deliveryTime: "35-45",
    deliveryFee: "0.00",
    rating: "9.0",
    promotion: "10% Off | 30% with W+",
    promotionColor: "bg-blue-500",
  },
  {
    id: 6,
    name: "Me Κολωνάκι",
    slug: "me-kolonaki", // Added slug for routing
    description: "Μοναδικές γεύσεις και απολαυστικός κα...",
    image: "/me-restaurant.jpg",
    deliveryTime: "30-40",
    deliveryFee: "0.00",
    rating: "9.4",
    promotion: "-4€ στη παραγγελία σου",
    promotionColor: "bg-blue-500",
  },
  {
    id: 7,
    name: "Jimmy's Valaoritou",
    slug: "jimmys-valaoritou", // Added slug for routing
    description: "Eatery and Drinks από το 1981 παραδοσια...",
    image: "/jimmys-restaurant.jpg",
    deliveryTime: "25-35",
    deliveryFee: "0.00",
    rating: "9.4",
    promotion: "-4€ στη παραγγελία σου",
    promotionColor: "bg-blue-500",
  },
  {
    id: 8,
    name: "Αθηναϊκόν",
    slug: "athinaikon", // Added slug for routing
    description: "Ελληνική-Μεσογειακή κουζίνα στην κολ...",
    image: "/athinaikon-greek.jpg",
    deliveryTime: "25-35",
    deliveryFee: "0.00",
    rating: "9.6",
    promotion: "-4€ στη παραγγελία σου",
    promotionColor: "bg-blue-500",
  },
]

export function RestaurantGrid() {
  return (
    <section className="mt-8">
      <h2 className="text-xl font-bold text-foreground mb-6">Όλα τα εστιατόρια</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {restaurants.map((restaurant) => (
          <Link
            key={restaurant.id}
            href={`/restaurant/${restaurant.slug}`}
            className="bg-card rounded-lg overflow-hidden hover:bg-card/80 transition-colors cursor-pointer block"
          >
            <div className="relative aspect-[4/3]">
              <Image src={restaurant.image || "/placeholder.svg"} alt={restaurant.name} fill className="object-cover" />
              <div
                className={`absolute top-3 left-3 ${restaurant.promotionColor} text-white px-2 py-1 rounded text-xs font-medium`}
              >
                {restaurant.promotion}
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-foreground mb-1">{restaurant.name}</h3>
              <p className="text-sm text-muted-foreground mb-3 line-clamp-1">{restaurant.description}</p>

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span>{restaurant.deliveryTime}</span>
                    <span className="text-primary">λεπτά</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                    <span>{restaurant.deliveryFee}€</span>
                    <span>• €€€</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <svg className="w-3 h-3 fill-yellow-400" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  <span>{restaurant.rating}</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
