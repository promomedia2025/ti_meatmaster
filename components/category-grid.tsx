import { Card } from "@/components/ui/card"

const categories = [
  {
    name: "Street Food",
    count: "247 καταστήματα",
    image: "/street-food-wrap-sandwich.jpg",
  },
  {
    name: "Κοτόπουλο",
    count: "111 καταστήματα",
    image: "/grilled-chicken-with-potatoes.jpg",
  },
  {
    name: "Καφέ",
    count: "807 καταστήματα",
    image: "/coffee-cup-with-pastries.jpg",
  },
  {
    name: "Burger",
    count: "215 καταστήματα",
    image: "/gourmet-burger-fries.png",
  },
  {
    name: "BBQ",
    count: "242 καταστήματα",
    image: "/bbq-grilled-meat-with-sides.jpg",
  },
  {
    name: "Φούρνοι",
    count: "148 καταστήματα",
    image: "/fresh-bread-and-pastries.jpg",
  },
]

export function CategoryGrid() {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-lg font-semibold text-foreground">Κατηγορίες</h2>
        <div className="w-4 h-4 rounded-full border border-muted-foreground flex items-center justify-center">
          <span className="text-xs text-muted-foreground">i</span>
        </div>
        <div className="ml-auto flex gap-2">
          <button className="w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center hover:bg-card/80 transition-colors">
            <svg className="w-4 h-4 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button className="w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center hover:bg-card/80 transition-colors">
            <svg className="w-4 h-4 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {categories.map((category, index) => (
          <Card
            key={index}
            className="group cursor-pointer overflow-hidden bg-card border-border hover:scale-105 transition-transform duration-200"
          >
            <div className="aspect-[4/3] relative overflow-hidden">
              <img
                src={category.image || "/placeholder.svg"}
                alt={category.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-3 left-3 right-3">
                <h3 className="text-white font-semibold text-sm mb-1">{category.name}</h3>
                <p className="text-white/80 text-xs">{category.count}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
