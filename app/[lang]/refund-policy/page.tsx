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

          <div className="w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center shrink-0">
           <RotateCcw className="w-6 h-6 text-white" />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-white">
              Πολιτική Επιστροφής Χρημάτων
            </h1>
            <p className="text-gray-400">
              Όροι και προϋποθέσεις επιστροφής χρημάτων
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-16 text-lg leading-7 text-gray-300 space-y-10">
        <p>
          Σε περίπτωση που δεν εξυπηρετηθεί η παραγγελία σας και έχετε πληρώσει με
          πιστωτική κάρτα, τα χρήματα σάς επιστρέφονται.
        </p>

        <p>
          Η επιστροφή χρημάτων πραγματοποιείται από την ομόρρυθμη εταιρεία{" "}
          <strong>ΑΝΑΣΤΑΣΙΟΣ ΤΡΥΠΟΣΚΟΥΦΗΣ & ΣΙΑ ΟΕ</strong>, ΑΦΜ{" "}
          <strong>998154126</strong>, η οποία φέρει τη μοναδική ευθύνη για την
          επιστροφή των χρημάτων στην κάρτα που χρησιμοποιήθηκε για τη συναλλαγή.
          Ο καταναλωτής δεν επιβαρύνεται σε καμία περίπτωση με έξοδα επιστροφής.
        </p>

        {/* FAQ */}
        <section className="space-y-6">
          <h2 className="text-xl font-semibold text-white">
            Συχνές Ερωτήσεις
          </h2>

          <div className="space-y-2">
            <h3 className="font-semibold text-white">
              α) Τι γίνεται αν γίνει κάποιο λάθος κατά την πληρωμή;
            </h3>
            <p>
              Σε περίπτωση διακοπής σύνδεσης ή επιλογής «Cancel» κατά τη μεταφορά,
              η συναλλαγή έχει καταγραφεί από το σύστημά μας. Εφόσον έχει δοθεί
              έγκριση από την τράπεζα και το ποσό έχει δεσμευθεί, τα χρήματα δεν
              χάνονται. Η διαδικασία είναι πλήρως αυτοματοποιημένη και ελεγχόμενη.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-white">
              β) Πόσο ασφαλής είναι η διαδικασία πληρωμής με πιστωτική κάρτα;
            </h3>
            <p>
              Η διαδικασία πληρωμής είναι απολύτως ασφαλής. Η πληρωμή δεν
              πραγματοποιείται απευθείας στην ομόρρυθμη εταιρεία{" "}
              <strong>ΑΝΑΣΤΑΣΙΟΣ ΤΡΥΠΟΣΚΟΥΦΗΣ & ΣΙΑ ΟΕ</strong>, αλλά ο χρήστης
              μεταφέρεται σε ασφαλές περιβάλλον της{" "}
              <strong>Τράπεζας Πειραιώς</strong>.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-white">
              γ) Τι είναι το πεδίο CVC / CVV;
            </h3>
            <p>
              Το πεδίο CVC / CVV βρίσκεται στο πίσω μέρος της πιστωτικής σας
              κάρτας και αποτελείται από έναν τριψήφιο αριθμό. Ζητείται για
              επιπλέον ασφάλεια των συναλλαγών και προστατεύει τον κάτοχο της
              κάρτας, καθώς είναι εξαιρετικά δύσκολο να το γνωρίζει τρίτο
              πρόσωπο.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
