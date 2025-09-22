import { Apple, Play } from "lucide-react"

export function Footer() {
  return (
    <footer className="text-gray-300 py-12 mt-16" style={{ backgroundColor: "#141414" }}>
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-8">
          {/* Logo and App Downloads */}
          <div className="md:col-span-1">
            <div className="text-2xl font-bold text-white mb-6">Wolt</div>
            <div className="space-y-3">
              <button className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors w-full">
                <Apple className="w-5 h-5" />
                <div className="text-left">
                  <div className="text-xs">Download on the</div>
                  <div className="text-sm font-semibold">App Store</div>
                </div>
              </button>
              <button className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors w-full">
                <Play className="w-5 h-5" />
                <div className="text-left">
                  <div className="text-xs">Get it on</div>
                  <div className="text-sm font-semibold">Google Play</div>
                </div>
              </button>
            </div>
          </div>

          {/* Partnership Column */}
          <div>
            <h3 className="text-white font-semibold mb-4">Συνεργασία με τη Wolt</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Για συνεργάτες διανομείς
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Για εμπόρους
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Για συνεργάτες
                </a>
              </li>
            </ul>
          </div>

          {/* Company Column */}
          <div>
            <h3 className="text-white font-semibold mb-4">Εταιρεία</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Σχετικά με εμάς
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Τι αντιπροσωπεύουμε
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Εργασία
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Υπευθυνότητα
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Ασφάλεια
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Επενδυτές
                </a>
              </li>
            </ul>
          </div>

          {/* Products Column */}
          <div>
            <h3 className="text-white font-semibold mb-4">Προϊόντα</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Wolt Drive
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Αγορά Wolt
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Wolt+
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Wolt for Work
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Wolt Ads
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Βιτρίνα καταστήματος
                </a>
              </li>
            </ul>
          </div>

          {/* Useful Links Column */}
          <div>
            <h3 className="text-white font-semibold mb-4">Χρήσιμα links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Υποστήριξη
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Media
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Επικοινωνία
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Μίλα πιο δυνατά
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Κωδικοί
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Προγραμματιστές
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Ανάλυση προϊόντων για την ασφάλεια
                </a>
              </li>
            </ul>
          </div>

          {/* Follow Us Column */}
          <div>
            <h3 className="text-white font-semibold mb-4">Ακολουθήστε μας</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Blog
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Σχεδιαστικό Blog
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Instagram
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Facebook
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  X
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  LinkedIn
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Wolt Life
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-700 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex flex-wrap gap-6 text-sm">
              <button className="hover:text-white transition-colors">🇬🇷 Ελλάδα</button>
              <button className="hover:text-white transition-colors">🌐 Ελληνικά</button>
              <button className="hover:text-white transition-colors">📍 Αποδοχές</button>
              <button className="hover:text-white transition-colors">🍪 Cookies</button>
            </div>
            <div className="flex flex-wrap gap-6 text-sm">
              <a href="#" className="hover:text-white transition-colors">
                Δήλωση προσβασιμότητας
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Όροι Χρήσης Υπηρεσίας
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Δήλωση προστασίας προσωπικών δεδομένων
              </a>
            </div>
            <div className="text-sm text-gray-400">© Wolt 2025</div>
          </div>
        </div>
      </div>
    </footer>
  )
}
