"use client";

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
            <div className="text-2xl font-bold text-white mb-6">Cocofino</div>
            <div className="space-y-3"></div>
          </div>

          {/* Company Column */}
          <div>
            <h3 className="text-white font-semibold mb-4">Εταιρεία</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/about-us" className="hover:text-white transition-colors">
                  Σχετικά με εμάς
                </a>
              </li>
            </ul>
          </div>

          {/* Policies Column */}
          <div>
            <h3 className="text-white font-semibold mb-4">Πολιτικές</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/refund-policy" className="hover:text-white transition-colors">
                  Πολιτική επιστροφής χρημάτων
                </a>
              </li>
              <li>
                <a href="/gdpr" className="hover:text-white transition-colors">
                  Πολιτική προστασίας προσωπικών δεδομένων - GDPR
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Column */}
          <div>
            <h3 className="text-white font-semibold mb-4">Επικοινωνία</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/contact-us" className="hover:text-white transition-colors">
                  Επικοινωνήστε μαζί μας
                </a>
              </li>
            </ul>
          </div>

          {/* Follow Us Column */}
          <div>
            <h3 className="text-white font-semibold mb-4">Ακολουθήστε μας</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="https://www.instagram.com/cocofino_delivery" className="hover:text-white transition-colors">
                  Instagram
                </a>
              </li>
              <li>
                <a href="https://www.facebook.com/cocofino.gr/?locale=el_GR" className="hover:text-white transition-colors">
                  Facebook
                </a>
              </li>
              <li>
                <a href="https://g.page/r/CYGezXFudNWFEBE/review" className="hover:text-white transition-colors">
                  Google Reviews
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-700 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            
            {/* Left: Links */}
            <div className="flex flex-wrap gap-6 text-sm">
              <a href="/cookies" className="hover:text-white transition-colors">
                🍪 Cookies
              </a>
              <a href="/terms-of-use" className="hover:text-white transition-colors">
                Οροι Χρησης
              </a>
            </div>

            {/* Center: Payment Logos Group (Visa, Master, Epay) */}
            <a 
              href="/payments" 
              className="flex flex-col sm:flex-row items-center gap-3 group hover:opacity-80 transition-opacity"
            >
               <span className="text-xs text-gray-500 group-hover:text-gray-400">Πληρωμές με</span>
               
               <div className="flex items-center gap-4">
                 {/* Visa */}
                 <img 
                   src="/banks/visa.png" 
                   alt="Visa" 
                   className="h-5 w-auto object-contain" 
                 />
                 
                 {/* MasterCard */}
                 <img 
                   src="/banks/master.png" 
                   alt="MasterCard" 
                   className="h-6 w-auto object-contain" 
                 />

                 {/* Epay */}
                 <img 
                   src="/banks/epay.png" 
                   alt="epay" 
                   className="h-6 w-auto object-contain" 
                 />
               </div>
            </a>

            {/* Right: Copyright */}
            <div className="text-sm text-gray-400">© Cocofino 2026</div>
          </div>
        </div>
      </div>
    </footer>
  );
}