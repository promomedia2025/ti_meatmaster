import { Cookie } from "lucide-react";
import Link from "next/link";

export default function CookiesPolicyPage() {
  return (
    <main className="min-h-screen bg-gray-950 overflow-x-hidden">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-6 flex items-center gap-4">
          <Link
            href="/"
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-white"
          >
            ←
          </Link>

          <div className="w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center shrink-0">
            <Cookie className="w-6 h-6 text-white" />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-white">Πολιτική Cookies</h1>
            <p className="text-gray-400">
              Πληροφορίες για τη χρήση cookies και τεχνολογιών παρακολούθησης
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-16 text-lg leading-7 text-gray-300 space-y-12">
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

        {/* Google AdWords */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">Google AdWords</h2>
          <p>
            Χρησιμοποιούμε την υπηρεσία <strong>Google AdWords Conversion Tracking</strong>,
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
            <strong> googleadservices.com</strong>.
          </p>
        </section>

        {/* Google Analytics */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">Google Analytics</h2>
          <p>
            Η ιστοσελίδα χρησιμοποιεί την υπηρεσία <strong>Google Analytics</strong>,
            η οποία συλλέγει ανώνυμα δεδομένα χρήσης μέσω cookies. Οι πληροφορίες
            αποθηκεύονται σε διακομιστές της Google στις ΗΠΑ.
          </p>
          <p>
            Έχουμε ενεργοποιήσει την ανωνυμοποίηση IP, ώστε η διεύθυνση IP να
            συντομεύεται πριν την αποθήκευση. Τα δεδομένα χρησιμοποιούνται
            αποκλειστικά για την αξιολόγηση της χρήσης της ιστοσελίδας και τη
            δημιουργία στατιστικών αναφορών.
          </p>
          <p>
            Μπορείτε να αποτρέψετε τη συλλογή δεδομένων εγκαθιστώντας το πρόσθετο
            περιηγητή της Google:
            <br />
            {/* Added break-all here */}
            <a
              href="http://tools.google.com/dlpage/gaoptout?hl=en"
              className="text-amber-500 underline break-all"
              target="_blank"
            >
              tools.google.com/dlpage/gaoptout
            </a>
          </p>
        </section>

        {/* Bing Ads */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">Bing Ads</h2>
          <p>
            Χρησιμοποιούμε την υπηρεσία <strong>Bing Ads Conversion Tracking</strong>,
            που παρέχεται από τη Microsoft Corporation (ΗΠΑ). Μέσω cookies,
            καταγράφεται ανώνυμα η αλληλεπίδραση χρηστών με τις διαφημίσεις Bing.
          </p>
          <p>
            Δεν συλλέγονται προσωπικά δεδομένα και έχετε τη δυνατότητα
            απενεργοποίησης μέσω των ρυθμίσεων του περιηγητή σας.
          </p>
        </section>

        {/* Criteo & Mediaplex */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">
            Criteo & Mediaplex (Conversant)
          </h2>
          <p>
            Χρησιμοποιούμε τεχνολογίες των εταιρειών <strong>Criteo</strong> και{" "}
            <strong>Conversant</strong> για ανώνυμη ανάλυση συμπεριφοράς
            περιήγησης και προβολή στοχευμένων διαφημίσεων.
          </p>
          <p>
            Τα δεδομένα αποθηκεύονται με ψευδωνυμοποίηση και δεν επιτρέπουν
            προσωπική ταυτοποίηση.
          </p>
        </section>

        {/* Facebook Retargeting */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">
            Facebook Retargeting
          </h2>
          <p>
            Χρησιμοποιούμε το εργαλείο επαναστοχοποίησης κοινού της Facebook Inc.
            (ΗΠΑ). Μέσω cookies και κρυπτογραφημένων δεδομένων, προβάλλονται
            προσωποποιημένες διαφημίσεις στο Facebook.
          </p>
          <p>
            Μπορείτε να εξαιρεθείτε από τη χρήση αυτής της υπηρεσίας στον
            ακόλουθο σύνδεσμο:
            <br />
            {/* Added break-all here */}
            <a
              href="https://www.facebook.com/ads/website_custom_audiences"
              className="text-amber-500 underline break-all"
              target="_blank"
            >
              facebook.com/ads/website_custom_audiences
            </a>
          </p>
        </section>

        {/* Hotjar */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">Hotjar</h2>
          <p>
            Χρησιμοποιούμε την υπηρεσία <strong>Hotjar</strong> για την ανώνυμη
            ανάλυση της συμπεριφοράς χρηστών (κινήσεις κέρσορα, clicks κ.λπ.) με
            σκοπό τη βελτίωση της ιστοσελίδας.
          </p>
          <p>
            Οι διευθύνσεις IP ανωνυμοποιούνται πλήρως. Μπορείτε να απενεργοποιήσετε
            την καταγραφή εδώ:
            <br />
            {/* Added break-all here */}
            <a
              href="https://www.hotjar.com/opt-out"
              className="text-amber-500 underline break-all"
              target="_blank"
            >
              hotjar.com/opt-out
            </a>
          </p>
        </section>

        {/* ADEX */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">ADEX</h2>
          <p>
            Χρησιμοποιούμε τις υπηρεσίες της <strong>ADEX GmbH</strong> για
            στοχευμένη προβολή διαφημίσεων βάσει ανώνυμης συμπεριφοράς χρήσης.
          </p>
          <p>
            Τα δεδομένα αποθηκεύονται με ψευδώνυμο και δεν επιτρέπουν προσωπική
            ταυτοποίηση. Μπορείτε να εξαιρεθείτε από την επεξεργασία:
            <br />
            {/* Added break-all here */}
            <a
              href="http://de.theadex.com/company/consumer-opt-out"
              className="text-amber-500 underline break-all"
              target="_blank"
            >
              theadex.com/consumer-opt-out
            </a>
          </p>
        </section>
      </div>
    </main>
  );
}