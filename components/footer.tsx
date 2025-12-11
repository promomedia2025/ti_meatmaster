import { Apple, Play } from "lucide-react";
import { type Locale } from "@/lib/i18n/config";

interface FooterProps {
  lang: Locale;
  dict: any;
}

export function Footer({ lang, dict }: FooterProps) {
  return (
    <footer
      className="text-gray-300 py-12 mt-16"
      style={{ backgroundColor: "#141414" }}
    >
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-8">
          {/* Logo and App Downloads */}
          <div className="md:col-span-1">
            <div className="text-2xl font-bold text-white mb-6">Το Σπιτικό</div>
            <div className="space-y-3">
            </div>
          </div>

          {/* Partnership Column */}
          <div>
            <h3 className="text-white font-semibold mb-4">Συνεργασία</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Γίνε συνεργάτης μας
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
            </ul>
          </div>

          {/* Column */}
          <div>
            <h3 className="text-white font-semibold mb-4">Πολιτικές</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Πολιτική Απορρήτου
                </a>
     
              </li>
                 <li>
                  <a href="#" className="hover:text-white transition-colors">
                  Πολιτική Επιστροφών
                 </a>
                </li>
            </ul>
          </div>

          {/* Follow Us Column */}
          <div>
            <h3 className="text-white font-semibold mb-4">Ακολουθήστε μας</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="https://www.instagram.com/tospitiko.1990/" className="hover:text-white transition-colors">
                  Instagram
                </a>
              </li>
              <li>
                <a href="https://www.facebook.com/tospitiko.1990/?locale=el_GR" className="hover:text-white transition-colors">
                  Facebook
                </a>
              </li>
              <li>
                <a href="https://share.google/lpnm0AbhkjeWVUQ5B" className="hover:text-white transition-colors">
                  Google Reviews
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-700 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex flex-wrap gap-6 text-sm">
              <button className="hover:text-white transition-colors">
                🍪 Cookies
              </button>
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
            <div className="text-sm text-gray-400">© Το Σπιτικό 2025</div>
          </div>
        </div>
      </div>
    </footer>
  );
}
