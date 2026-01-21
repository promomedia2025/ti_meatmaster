import { Info } from "lucide-react";
import Link from "next/link";

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-gray-950">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-6 flex items-center gap-4">
          <Link
            href="/"
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            ←
          </Link>

          <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
            <Info className="w-6 h-6 text-white" />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-white">
              Πολιτική Απορρήτου
            </h1>
            <p className="text-gray-400">
              Πώς διαχειριζόμαστε τα προσωπικά σας δεδομένα
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-16 text-lg leading-7 text-gray-300 space-y-10">
        <p>
          Η <strong>ΑΝΑΣΤΑΣΙΟΣ ΤΡΥΠΟΣΚΟΥΦΗΣ & ΣΙΑ ΟΕ</strong>, ΑΦΜ{" "}
          <strong>998154126</strong>, ευχαριστεί για την επίσκεψή σας στην
          ιστοσελίδα και θεωρεί την προστασία των προσωπικών δεδομένων εξαιρετικά
          σημαντική.
        </p>

        <p>
          Με την αποδοχή της παρούσας πολιτικής, συμφωνείτε με τη συλλογή,
          επεξεργασία και χρήση των προσωπικών σας δεδομένων σύμφωνα με τον
          Γενικό Κανονισμό Προστασίας Δεδομένων (GDPR).
        </p>

        {/* Controller */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">
            Υπεύθυνος Επεξεργασίας
          </h2>
          <p>
            ΑΝΑΣΤΑΣΙΟΣ ΤΡΥΠΟΣΚΟΥΦΗΣ & ΣΙΑ ΟΕ<br />
            Φανερωμένης 1Α<br />
            15561 Χολαργός, Αττική<br />
            Τηλ.: 210 6543065<br />
            Email:{" "}
            <a
              href="mailto:info@cocofino.gr"
              className="text-blue-400 hover:underline"
            >
              info@cocofino.gr
            </a>
          </p>

          <p>
            Μπορείτε να επικοινωνήσετε για οποιοδήποτε αίτημα σχετικά με τα
            προσωπικά σας δεδομένα.
          </p>
        </section>

        {/* Marketing */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">
            Επικοινωνία & Marketing
          </h2>
          <p>
            Ενδέχεται να σας αποστέλλουμε email με κουπόνια, προσφορές και
            προωθητικές ενέργειες. Μπορείτε οποιαδήποτε στιγμή να διακόψετε τη
            λήψη τέτοιων μηνυμάτων μέσω σχετικού συνδέσμου ή επικοινωνώντας μαζί
            μας.
          </p>
        </section>

        {/* Cookies */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">
            Cookies & Εργαλεία Τρίτων
          </h2>

          <p>Η ιστοσελίδα χρησιμοποιεί cookies για:</p>

          <ul className="list-disc list-inside space-y-1 text-gray-400">
            <li>στατιστική ανάλυση</li>
            <li>βελτίωση εμπειρίας χρήστη</li>
            <li>στοχευμένη διαφήμιση</li>
          </ul>

          <p>Ενδεικτικά εργαλεία που χρησιμοποιούνται:</p>

          <ul className="list-disc list-inside space-y-1 text-gray-400">
            <li>Google Analytics</li>
            <li>Google Ads</li>
            <li>Facebook Retargeting</li>
            <li>Bing Ads</li>
            <li>Hotjar</li>
            <li>Criteo</li>
            <li>Mediaplex</li>
            <li>ADEX</li>
          </ul>

          <p>
            Μπορείτε να ρυθμίσετε ή να απενεργοποιήσετε τα cookies μέσω του
            browser σας.
          </p>
        </section>

        {/* Changes */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">
            Τροποποιήσεις Πολιτικής
          </h2>
          <p>
            Διατηρούμε το δικαίωμα τροποποίησης της παρούσας πολιτικής ώστε να
            συμμορφώνεται με τη νομοθεσία. Κάθε σημαντική αλλαγή θα
            γνωστοποιείται.
          </p>
        </section>
      </div>
    </main>
  );
}
