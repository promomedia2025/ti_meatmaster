import { Plus } from "lucide-react"
import Image from "next/image"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface MenuSectionProps {
  title: string
  isOffers?: boolean
}

export default function MenuSection({ title, isOffers = false }: MenuSectionProps) {
  if (isOffers) {
    return (
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">{title}</h2>
          <div className="flex gap-2">
            <button className="p-2 rounded-full bg-gray-800 text-gray-400 hover:text-white">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button className="p-2 rounded-full bg-gray-800 text-gray-400 hover:text-white">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">%</span>
              </div>
              <div>
                <h3 className="text-white font-medium">-10% Boneless Bucket | -30% με W+</h3>
                <p className="text-blue-400 text-sm">Έμπειρη λεπτομέρεια</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">%</span>
              </div>
              <div>
                <h3 className="text-white font-medium">Bucket Offer -3.10€</h3>
                <p className="text-blue-400 text-sm">Έμπειρη λεπτομέρεια</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">%</span>
              </div>
              <div>
                <h3 className="text-white font-medium">Bucket for 1 μόνο με 5.90€</h3>
                <p className="text-blue-400 text-sm">Έμπειρη λεπτομέρεια</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white">{title}</h2>
        <div className="flex gap-2">
          <button className="p-2 rounded-full bg-gray-800 text-gray-400 hover:text-white">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button className="p-2 rounded-full bg-gray-800 text-gray-400 hover:text-white">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-900 rounded-lg overflow-hidden border border-gray-800">
          <div className="relative h-32">
            <Image src="/kfc-fries.jpg" alt="French Fries" fill className="object-cover" />
          </div>
          <div className="p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="text-white font-medium mb-1">French Fries</h3>
                <p className="text-gray-400 text-sm">Επιλογές μεγέθους</p>
              </div>
              <button className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors">
                <Plus className="w-4 h-4 text-white" />
              </button>
            </div>
            <p className="text-blue-400 font-bold">3.30 €</p>
          </div>
        </div>

        <div className="bg-gray-900 rounded-lg overflow-hidden border border-gray-800">
          <div className="relative h-32">
            <Image src="/kfc-bucket.jpg" alt="Hot Bucket" fill className="object-cover" />
          </div>
          <div className="p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="text-white font-medium mb-1">Hot Bucket</h3>
                <p className="text-gray-400 text-sm">
                  Καυτερές φτερούγες κοτόπουλο (Hot Wings). Το προϊόν περιλαμβάνει περιβαλλοντικό τέλος 0.05€
                </p>
              </div>
              <button className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors">
                <Plus className="w-4 h-4 text-white" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-blue-400 font-bold">11.90 €</p>
              <p className="text-gray-500 text-sm">Περιλαμβάνεται 0.05 € επιβάρυνση τέλ...</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 rounded-lg overflow-hidden border border-gray-800">
          <div className="relative h-32">
            <Image src="/kfc-feast.jpg" alt="Feast for 2" fill className="object-cover" />
          </div>
          <div className="p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="text-white font-medium mb-1">Feast for 2</h3>
                <p className="text-gray-400 text-sm">
                  1 Bucket Boneless (8 crispy Strips + 14 nuggets) η Duo (10 hot wings + 8 crispy strip...
                </p>
              </div>
              <button className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors">
                <Plus className="w-4 h-4 text-white" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <div className="bg-red-600 text-white text-xs px-2 py-1 rounded">Feast for 2</div>
              <p className="text-blue-400 font-bold">19.90 €</p>
              <p className="text-gray-500 text-sm line-through">31.60 €</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
