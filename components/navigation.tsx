import { Utensils, Store } from "lucide-react";

export function Navigation() {
  return (
    <nav className="bg-background border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-center md:gap-8 gap-4 py-4 overflow-x-auto">
          <button className="flex items-center gap-2 text-primary bg-primary/10 px-3 md:px-4 py-2 rounded-full whitespace-nowrap">
            <Utensils className="w-4 md:w-5 h-4 md:h-5" />
            <span className="font-medium text-sm md:text-base">Εστιατόρια</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
