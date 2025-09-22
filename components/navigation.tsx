import { Utensils, Store } from "lucide-react"

export function Navigation() {
  return (
    <nav className="bg-background border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-center md:gap-8 gap-4 py-4 overflow-x-auto">
          <button className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap">
            <div className="w-5 h-5 rounded-full border border-current flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-current"></div>
            </div>
            <span className="text-sm md:text-base">Προτάσεις</span>
          </button>

          <button className="flex items-center gap-2 text-primary bg-primary/10 px-3 md:px-4 py-2 rounded-full whitespace-nowrap">
            <Utensils className="w-4 md:w-5 h-4 md:h-5" />
            <span className="font-medium text-sm md:text-base">Εστιατόρια</span>
          </button>

          <button className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap">
            <Store className="w-4 md:w-5 h-4 md:h-5" />
            <span className="text-sm md:text-base">Καταστήματα</span>
          </button>
        </div>
      </div>
    </nav>
  )
}
