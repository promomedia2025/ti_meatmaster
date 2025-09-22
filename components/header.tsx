"use client"

import { Search, MapPin, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { LocationModal } from "./location-modal"
import { AuthModal } from "./auth-modal"

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)

  return (
    <>
      <header className="bg-background border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo and Location */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-lg">W</span>
                </div>
                <span className="text-xl font-bold text-foreground">Wolt</span>
              </div>

              <button
                className="hidden md:flex items-center gap-1 text-sm hover:text-primary transition-colors"
                onClick={() => setIsLocationModalOpen(true)}
              >
                <MapPin className="w-4 h-4 text-primary" />
                <span className="text-foreground">Αθήνα</span>
                <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            <div className="hidden lg:flex flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Αναζήτηση στη Wolt..."
                  className="pl-10 bg-input border-border text-foreground placeholder:text-muted-foreground"
                />
              </div>
            </div>

            <div className="hidden md:flex items-center gap-3">
              <Button
                variant="ghost"
                className="text-foreground hover:text-primary"
                onClick={() => setIsAuthModalOpen(true)}
              >
                Σύνδεση
              </Button>
              <Button
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={() => setIsAuthModalOpen(true)}
              >
                Εγγραφή
              </Button>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>
          </div>

          {isMobileMenuOpen && (
            <div className="md:hidden mt-4 pb-4 border-t border-border">
              <div className="mt-4 mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Αναζήτηση στη Wolt..."
                    className="pl-10 bg-input border-border text-foreground placeholder:text-muted-foreground"
                  />
                </div>
              </div>

              <button
                className="flex items-center gap-1 text-sm mb-4 px-2 hover:text-primary transition-colors"
                onClick={() => setIsLocationModalOpen(true)}
              >
                <MapPin className="w-4 h-4 text-primary" />
                <span className="text-foreground">Αθήνα</span>
                <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              <div className="flex flex-col gap-2">
                <Button
                  variant="ghost"
                  className="text-foreground hover:text-primary justify-start"
                  onClick={() => setIsAuthModalOpen(true)}
                >
                  Σύνδεση
                </Button>
                <Button
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={() => setIsAuthModalOpen(true)}
                >
                  Εγγραφή
                </Button>
              </div>
            </div>
          )}
        </div>
      </header>

      <LocationModal isOpen={isLocationModalOpen} onClose={() => setIsLocationModalOpen(false)} />
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </>
  )
}
