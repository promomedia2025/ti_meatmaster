import { Header } from "@/components/header"
import { Navigation } from "@/components/navigation"
import { CategoryGrid } from "@/components/category-grid"
import { RestaurantGrid } from "@/components/restaurant-grid"
import { Footer } from "@/components/footer"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Navigation />
      <main className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-foreground">Εστιατόρια κοντά μου</h1>
          <button className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors">
            <span className="text-sm">Ταξινόμηση με βάση Προτεινόμενα</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
        <CategoryGrid />
        <RestaurantGrid />
      </main>
      <Footer />
    </div>
  )
}
