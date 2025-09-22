"use client"

import { X, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface LocationModalProps {
  isOpen: boolean
  onClose: () => void
}

export function LocationModal({ isOpen, onClose }: LocationModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-[#1a1a1a] rounded-lg p-6 w-full max-w-md mx-4 text-white">
        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
          onClick={onClose}
        >
          <X className="w-5 h-5" />
        </Button>

        {/* Title */}
        <h2 className="text-xl font-semibold mb-6 text-white">Προσθήκη νέας διεύθυνσης</h2>

        {/* Country dropdown */}
        <div className="mb-4">
          <label className="block text-sm text-gray-400 mb-2">Χώρα</label>
          <Select defaultValue="greece">
            <SelectTrigger className="w-full bg-[#2a2a2a] border-gray-600 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#2a2a2a] border-gray-600">
              <SelectItem value="greece" className="text-white">
                Ελλάδα
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Address input */}
        <div className="mb-6">
          <label className="block text-sm text-gray-400 mb-2">Οδός και αριθμός</label>
          <div className="relative">
            <Input
              placeholder="Εισάγετε τη διεύθυνσή σας"
              className="w-full bg-[#2a2a2a] border-gray-600 text-white placeholder:text-gray-500 pr-10"
            />
            <MapPin className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-primary" />
          </div>
        </div>

        {/* Continue button */}
        <Button className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-3">Συνέχεια</Button>

        {/* Decorative illustration */}
        <div className="mt-8 flex justify-center">
          <div className="relative">
            {/* Buildings illustration */}
            <svg width="200" height="120" viewBox="0 0 200 120" className="opacity-80">
              {/* Sky and clouds */}
              <rect width="200" height="60" fill="#2a2a2a" />
              <ellipse cx="50" cy="20" rx="15" ry="8" fill="#4a9eff" opacity="0.6" />
              <ellipse cx="120" cy="15" rx="12" ry="6" fill="#4a9eff" opacity="0.6" />
              <ellipse cx="170" cy="25" rx="18" ry="9" fill="#4a9eff" opacity="0.6" />

              {/* Buildings */}
              <rect x="20" y="60" width="40" height="60" fill="#4ade80" />
              <rect x="20" y="60" width="40" height="10" fill="#22c55e" />
              <rect x="25" y="70" width="8" height="8" fill="#ffffff" opacity="0.8" />
              <rect x="37" y="70" width="8" height="8" fill="#ffffff" opacity="0.8" />
              <rect x="25" y="85" width="8" height="8" fill="#ffffff" opacity="0.8" />
              <rect x="37" y="85" width="8" height="8" fill="#ffffff" opacity="0.8" />

              <rect x="70" y="45" width="35" height="75" fill="#3b82f6" />
              <rect x="70" y="45" width="35" height="10" fill="#2563eb" />
              <rect x="75" y="60" width="6" height="6" fill="#ffffff" opacity="0.8" />
              <rect x="85" y="60" width="6" height="6" fill="#ffffff" opacity="0.8" />
              <rect x="95" y="60" width="6" height="6" fill="#ffffff" opacity="0.8" />

              <rect x="115" y="70" width="30" height="50" fill="#f97316" />
              <rect x="115" y="70" width="30" height="8" fill="#ea580c" />
              <rect x="120" y="85" width="6" height="6" fill="#ffffff" opacity="0.8" />
              <rect x="130" y="85" width="6" height="6" fill="#ffffff" opacity="0.8" />

              <rect x="155" y="55" width="35" height="65" fill="#06b6d4" />
              <rect x="155" y="55" width="35" height="10" fill="#0891b2" />
              <rect x="160" y="70" width="6" height="6" fill="#ffffff" opacity="0.8" />
              <rect x="170" y="70" width="6" height="6" fill="#ffffff" opacity="0.8" />
              <rect x="180" y="70" width="6" height="6" fill="#ffffff" opacity="0.8" />

              {/* Location pin */}
              <circle cx="175" cy="85" r="12" fill="#primary" />
              <circle cx="175" cy="85" r="8" fill="#ffffff" />
              <circle cx="175" cy="85" r="4" fill="#primary" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}
