import { RotateCcw } from "lucide-react";
import Link from "next/link";

export default function RefundPolicyPage() {
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

          <div className="w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center">
            <RotateCcw className="w-6 h-6 text-white" />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-white">
              Πολιτική Επιστροφής Χρημάτων
            </h1>
            <p className="text-gray-400">
              Διαφάνεια και ασφάλεια στις συναλλαγές σας
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-16 text-lg leading-7 text-gray-300 space-y-10">
        <p>
          Σε περίπτωση που δεν εξυπηρετηθεί η παραγγελία σας και έχετε πληρώσει με
          πιστωτική κάρτα, το ποσό που καταβλήθηκε επιστρέφεται.
        </p>

        <p>
          Η επιστροφή χρημάτων πραγματοποιείται από την ομόρρυθμη εταιρεία{" "}
          <strong>ΑΝΑΣΤΑΣΙΟΣ ΤΡΥΠΟΣΚΟΥΦΗΣ & ΣΙΑ ΟΕ</strong>, ΑΦΜ{" "}
          <strong>998154126</strong>, η οποία φέρει τη μοναδική ευθύνη για την
          επιστροφή του ποσού στην κάρτα που χρησιμοποιήθηκε για τη συναλλαγή.
          Ο καταναλωτής δεν επιβαρύνεται με έξοδα επιστροφής.
        </p>

        {/* FAQ */}
        <section className="space-y-6">
          <h2 className="text-xl font-semibold text-white">
            Συχνές Ερωτήσεις
          </h2>

          <div className="space-y-2">
            <h3 className="font-semibold text-white">
              α) Τι γίνεται αν γίνει λάθος κατά την πληρωμή;
            </h3>
            <p>
              Ακόμα και σε περίπτωση διακοπής σύνδεσης ή επιλογής “Cancel”, η
              συναλλαγή έχει καταγραφεί. Εφόσον το ποσό έχει δεσμευτεί, τα χρήματα
              δεν χάνονται. Η διαδικασία είναι αυτοματοποιημένη και πλήρως
              ελεγχόμενη.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-white">
              β) Πόσο ασφαλής είναι η πληρωμή με πιστωτική κάρτα;
            </h3>
            <p>
              Η πληρωμή είναι απολύτως ασφαλής και δεν πραγματοποιείται
              απευθείας στην εταιρεία. Ο χρήστης μεταφέρεται σε ασφαλές
              περιβάλλον της <strong>Τράπεζας Πειραιώς</strong>.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-white">
              γ) Τι είναι το CVC / CVV;
            </h3>
            <p>
              Πρόκειται για τον τριψήφιο αριθμό που βρίσκεται στο πίσω μέρος της
              πιστωτικής σας κάρτας και ζητείται για επιπλέον ασφάλεια των
              συναλλαγών.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
