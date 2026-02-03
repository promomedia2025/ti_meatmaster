"use client";

import { Cookie, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function CookiesPolicyPage() {
  return (
    <main className="min-h-screen bg-black text-zinc-200 font-sans selection:bg-[#ff9328]/30">
      
      {/* Header */}
      <div className="bg-zinc-900 border-b border-zinc-800 top-0 z-1">
        <div className="max-w-4xl mx-auto px-4 py-8 flex items-center gap-6">
          <Link
            href="/"
            className="p-2 bg-black border border-zinc-800 rounded-xl hover:border-[#915316] transition-all text-zinc-400 hover:text-white shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>

          {/* Icon Circle */}
          <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center shrink-0 border-4 border-zinc-900 shadow-xl">
            <Cookie className="w-6 h-6 text-[#ff9328]" />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight mb-1">
              Πολιτική Cookies
            </h1>
            <p className="text-zinc-400 text-sm">
              Πληροφορίες για τη χρήση cookies και τεχνολογιών παρακολούθησης
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-12 text-lg leading-relaxed text-zinc-400 space-y-12">
        
        <section className="space-y-6">
          <p>
            Η ιστοσελίδα μας χρησιμοποιεί cookies και παρόμοιες τεχνολογίες για τη
            σωστή λειτουργία της, τη βελτίωση της εμπειρίας χρήστη και την προβολή
            διαφημίσεων σχετικών με τις υπηρεσίες που παρέχουμε.
          </p>

          <p>
            Τα cookies που χρησιμοποιούνται δεν αποσκοπούν στην προσωπική
            αναγνώριση των χρηστών, αλλά στη συλλογή ανώνυμων στατιστικών στοιχείων
            και στη βελτιστοποίηση των παρεχόμενων υπηρεσιών.
          </p>
        </section>

        {/* Google AdWords */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white border-l-4 border-[#ff9328] pl-4">
            Google AdWords
          </h2>
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 space-y-4">
            <p>
              Χρησιμοποιούμε την υπηρεσία <strong className="text-zinc-200">Google AdWords Conversion Tracking</strong>,
              η οποία παρέχεται από την Google Inc. (ΗΠΑ). Όταν επισκέπτεστε την
              ιστοσελίδα μας μέσω διαφήμισης Google, αποθηκεύεται στη συσκευή σας
              ένα cookie μετατροπής (conversion cookie), το οποίο λήγει μετά από 30
              ημέρες και δεν επιτρέπει την προσωπική αναγνώριση.
            </p>
            <p>
              Τα δεδομένα χρησιμοποιούνται αποκλειστικά για τη δημιουργία
              στατιστικών αναφορών σχετικά με την αποτελεσματικότητα των
              διαφημίσεων. Μπορείτε να απενεργοποιήσετε τη χρήση cookies μέσω των
              ρυθμίσεων του περιηγητή σας ή αποκλείοντας το domain
              <strong className="text-[#ff9328]"> googleadservices.com</strong>.
            </p>
          </div>
        </section>

        {/* Google Analytics */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white border-l-4 border-[#ff9328] pl-4">
            Google Analytics
          </h2>
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 space-y-4">
            <p>
              Η ιστοσελίδα χρησιμοποιεί την υπηρεσία <strong className="text-zinc-200">Google Analytics</strong>,
              η οποία συλλέγει ανώνυμα δεδομένα χρήσης μέσω cookies. Οι πληροφορίες
              αποθηκεύονται σε διακομιστές της Google στις ΗΠΑ.
            </p>
            <p>
              Έχουμε ενεργοποιήσει την ανωνυμοποίηση IP, ώστε η διεύθυνση IP να
              συντομεύεται πριν την αποθήκευση. Τα δεδομένα χρησιμοποιούνται
              αποκλειστικά για την αξιολόγηση της χρήσης της ιστοσελίδας.
            </p>
            <p className="pt-2">
              <span className="block text-sm text-zinc-500 mb-2 italic">Απενεργοποίηση συλλογής δεδομένων:</span>
              <a
                href="http://tools.google.com/dlpage/gaoptout?hl=en"
                className="text-[#ff9328] hover:text-[#915316] underline break-all font-medium transition-colors"
                target="_blank"
              >
                tools.google.com/dlpage/gaoptout
              </a>
            </p>
          </div>
        </section>

        {/* Bing Ads */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white border-l-4 border-[#ff9328] pl-4">
            Bing Ads
          </h2>
          <p>
            Χρησιμοποιούμε την υπηρεσία <strong className="text-zinc-200">Bing Ads Conversion Tracking</strong>,
            που παρέχεται από τη Microsoft Corporation (ΗΠΑ). Μέσω cookies,
            καταγράφεται ανώνυμα η αλληλεπίδραση χρηστών με τις διαφημίσεις Bing. Δεν συλλέγονται προσωπικά δεδομένα.
          </p>
        </section>

        {/* Criteo & Mediaplex */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white border-l-4 border-[#ff9328] pl-4">
            Criteo & Mediaplex (Conversant)
          </h2>
          <p>
            Χρησιμοποιούμε τεχνολογίες των εταιρειών <strong className="text-zinc-200">Criteo</strong> και{" "}
            <strong className="text-zinc-200">Conversant</strong> για ανώνυμη ανάλυση συμπεριφοράς
            περιήγησης και προβολή στοχευμένων διαφημίσεων. Τα δεδομένα αποθηκεύονται με ψευδωνυμοποίηση.
          </p>
        </section>

        {/* Facebook Retargeting */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white border-l-4 border-[#ff9328] pl-4">
            Facebook Retargeting
          </h2>
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 space-y-4">
            <p>
              Χρησιμοποιούμε το εργαλείο επαναστοχοποίησης κοινού της Facebook Inc.
              (ΗΠΑ). Μέσω cookies και κρυπτογραφημένων δεδομένων, προβάλλονται
              προσωποποιημένες διαφημίσεις στο Facebook.
            </p>
            <p>
              <span className="block text-sm text-zinc-500 mb-2 italic">Εξαίρεση από την υπηρεσία:</span>
              <a
                href="https://www.facebook.com/ads/website_custom_audiences"
                className="text-[#ff9328] hover:text-[#915316] underline break-all font-medium transition-colors"
                target="_blank"
              >
                facebook.com/ads/website_custom_audiences
              </a>
            </p>
          </div>
        </section>

        {/* Hotjar */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white border-l-4 border-[#ff9328] pl-4">
            Hotjar
          </h2>
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 space-y-4">
            <p>
              Χρησιμοποιούμε την υπηρεσία <strong className="text-zinc-200">Hotjar</strong> για την ανώνυμη
              ανάλυση της συμπεριφοράς χρηστών (κινήσεις κέρσορα, clicks κ.λπ.) με
              σκοπό τη βελτίωση της ιστοσελίδας.
            </p>
            <p>
              <span className="block text-sm text-zinc-500 mb-2 italic">Απενεργοποίηση καταγραφής:</span>
              <a
                href="https://www.hotjar.com/opt-out"
                className="text-[#ff9328] hover:text-[#915316] underline break-all font-medium transition-colors"
                target="_blank"
              >
                hotjar.com/opt-out
              </a>
            </p>
          </div>
        </section>

        {/* ADEX */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white border-l-4 border-[#ff9328] pl-4">
            ADEX
          </h2>
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 space-y-4">
            <p>
              Χρησιμοποιούμε τις υπηρεσίες της <strong className="text-zinc-200">ADEX GmbH</strong> για
              στοχευμένη προβολή διαφημίσεων βάσει ανώνυμης συμπεριφοράς χρήσης.
            </p>
            <p>
              <span className="block text-sm text-zinc-500 mb-2 italic">Εξαίρεση από την επεξεργασία:</span>
              <a
                href="http://de.theadex.com/company/consumer-opt-out"
                className="text-[#ff9328] hover:text-[#915316] underline break-all font-medium transition-colors"
                target="_blank"
              >
                theadex.com/consumer-opt-out
              </a>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}