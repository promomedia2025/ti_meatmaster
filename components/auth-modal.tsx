"use client"

import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a1a] rounded-lg w-full max-w-md p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors">
          <X className="w-6 h-6" />
        </button>

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">Δημιούργησε λογαριασμό ή συνδέσου</h2>
          <p className="text-gray-400 text-sm">Συνδέσου παρακάτω ή δημιούργησε έναν νέο λογαριασμό Wolt.</p>
        </div>

        <div className="space-y-3 mb-6">
          {/* Google Sign In */}
          <Button
            variant="outline"
            className="w-full bg-[#2a2a2a] border-gray-600 text-white hover:bg-[#3a3a3a] flex items-center justify-center gap-3 h-12"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Συνέχεια με Google
          </Button>

          {/* Apple Sign In */}
          <Button
            variant="outline"
            className="w-full bg-white border-gray-300 text-black hover:bg-gray-100 flex items-center justify-center gap-3 h-12"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
            </svg>
            Συνέχεια με Apple
          </Button>

          {/* Facebook Sign In */}
          <Button className="w-full bg-[#1877F2] hover:bg-[#166FE5] text-white flex items-center justify-center gap-3 h-12">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            Συνέχεια με Facebook
          </Button>
        </div>

        <div className="mb-4">
          <p className="text-gray-400 text-sm mb-3">Σύνδεση μέσω email</p>
          <Input
            type="email"
            placeholder="Email"
            className="bg-[#2a2a2a] border-gray-600 text-white placeholder:text-gray-500 h-12"
          />
        </div>

        <Button className="w-full bg-[#009DE0] hover:bg-[#0088CC] text-white h-12 mb-4">Επόμενο</Button>

        <div className="text-xs text-gray-500 leading-relaxed">
          Δες τη{" "}
          <a href="#" className="text-[#009DE0] hover:underline">
            Δήλωση Προστασίας Προσωπικών Δεδομένων Wolt
          </a>{" "}
          στα Αγγλικά, ώστε να μάθεις σχετικά με την επεξεργασία προσωπικών δεδομένων στη Wolt. Μπορείς να δεις επίσης
          στην ενότητα Ιδιωτικότητα. Ισχύει η{" "}
          <a href="#" className="text-[#009DE0] hover:underline">
            Πολιτική Απορρήτου
          </a>{" "}
          που σχετίζεται με τον λογαριασμό σου στη Wolt στην επόμενη φάση της εγγραφής σου, όταν θα λάβεις δηλώσεις
          δικαιωμάτων. Ισχύουν οι προϋποθέσεις χώρας και γλώσσας που ισχύουν σε εσένα. Η ιστοσελίδα προστατεύεται από το
          reCaptcha. Ισχύει η{" "}
          <a href="#" className="text-[#009DE0] hover:underline">
            Πολιτική Απορρήτου
          </a>{" "}
          και οι{" "}
          <a href="#" className="text-[#009DE0] hover:underline">
            Όροι χρήσης
          </a>{" "}
          του reCaptcha.
        </div>
      </div>
    </div>
  )
}
