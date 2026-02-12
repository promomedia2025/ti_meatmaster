"use client";

import { RotateCcw, ArrowLeft, ShieldCheck, HelpCircle } from "lucide-react";
import Link from "next/link";

export default function RefundPolicyPage() {
  return (
    <main className="min-h-screen bg-black text-zinc-200 font-sans selection:bg-[var(--brand-border)]/30">
      
      {/* Header */}
      <div className="bg-zinc-900 border-b border-zinc-800 top-0 z-1">
        <div className="max-w-4xl mx-auto px-4 py-8 flex items-center gap-6">
          <Link
            href="/"
            className="p-2 bg-black border border-zinc-800 rounded-xl hover:border-[var(--brand-hover)] transition-all text-zinc-400 hover:text-white shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>

          {/* Icon Circle */}
          <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center shrink-0 border-4 border-zinc-900 shadow-xl">
            <RotateCcw className="w-6 h-6 text-[var(--brand-border)]" />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight mb-1">
              Πολιτική Επιστροφής Χρημάτων
            </h1>
            <p className="text-zinc-400 text-sm">
              Όροι και προϋποθέσεις επιστροφής χρημάτων
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-12 text-lg leading-relaxed text-zinc-400 space-y-12">
        
        <section className="bg-[var(--brand-border)]/5 border border-[var(--brand-border)]/20 rounded-2xl p-8 space-y-6">
          <p>
            Σε περίπτωση που δεν εξυπηρετηθεί η παραγγελία σας και έχετε πληρώσει με
            πιστωτική κάρτα, τα χρήματα σάς επιστρέφονται αυτόματα.
          </p>

          <p>
            Η επιστροφή χρημάτων πραγματοποιείται από την ομόρρυθμη εταιρεία{" "}
            <strong className="text-white">ΑΝΑΣΤΑΣΙΟΣ ΤΡΥΠΟΣΚΟΥΦΗΣ & ΣΙΑ ΟΕ</strong> (ΑΦΜ{" "}
            <strong className="text-[var(--brand-border)]">998154126</strong>), η οποία φέρει τη μοναδική ευθύνη για την
            επιστροφή των χρημάτων στην κάρτα που χρησιμοποιήθηκε για τη συναλλαγή.
            <span className="block mt-4 text-[var(--brand-border)] font-bold italic">
              Ο καταναλωτής δεν επιβαρύνεται σε καμία περίπτωση με έξοδα επιστροφής.
            </span>
          </p>
        </section>

        {/* FAQ Section */}
        <section className="space-y-8">
          <h2 className="text-xl font-bold text-white border-l-4 border-[var(--brand-border)] pl-4 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-[var(--brand-border)]" />
            Συχνές Ερωτήσεις
          </h2>

          <div className="grid gap-6">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-3 hover:border-[var(--brand-hover)] transition-colors">
              <h3 className="text-white font-bold flex items-start gap-3">
                <span className="text-[var(--brand-border)]">α)</span>
                Τι γίνεται αν γίνει κάποιο λάθος κατά την πληρωμή;
              </h3>
              <p className="text-sm leading-relaxed text-zinc-400">
                Σε περίπτωση διακοπής σύνδεσης ή επιλογής «Cancel» κατά τη μεταφορά,
                η συναλλαγή έχει καταγραφεί από το σύστημά μας. Εφόσον έχει δοθεί
                έγκριση από την τράπεζα και το ποσό έχει δεσμευθεί, τα χρήματα δεν
                χάνονται. Η διαδικασία είναι πλήρως αυτοματοποιημένη και ελεγχόμενη.
              </p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-3 hover:border-[var(--brand-hover)] transition-colors">
              <h3 className="text-white font-bold flex items-start gap-3">
                <span className="text-[var(--brand-border)]">β)</span>
                Πόσο ασφαλής είναι η διαδικασία πληρωμής με κάρτα;
              </h3>
              <p className="text-sm leading-relaxed text-zinc-400">
                Η διαδικασία πληρωμής είναι απολύτως ασφαλής. Η πληρωμή δεν
                πραγματοποιείται απευθείας στην ομόρρυθμη εταιρεία ΑΝΑΣΤΑΣΙΟΣ ΤΡΥΠΟΣΚΟΥΦΗΣ & ΣΙΑ ΟΕ, 
                αλλά ο χρήστης μεταφέρεται σε ασφαλές περιβάλλον της{" "}
                <strong className="text-zinc-200">Τράπεζας Πειραιώς</strong>.
              </p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-3 hover:border-[var(--brand-hover)] transition-colors">
              <h3 className="text-white font-bold flex items-start gap-3">
                <span className="text-[var(--brand-border)]">γ)</span>
                Τι είναι το πεδίο CVC / CVV;
              </h3>
              <div className="flex flex-col md:flex-row gap-4 items-start">
                <p className="text-sm leading-relaxed text-zinc-400">
                  Το πεδίο CVC / CVV βρίσκεται στο πίσω μέρος της πιστωτικής σας
                  κάρτας και αποτελείται από έναν τριψήφιο αριθμό. Ζητείται για
                  επιπλέον ασφάλεια των συναλλαγών και προστατεύει τον κάτοχο της
                  κάρτας, καθώς είναι εξαιρετικά δύσκολο να το γνωρίζει τρίτο
                  πρόσωπο.
                </p>
                <div className="bg-black p-3 rounded-lg border border-zinc-800 shrink-0">
                   <ShieldCheck className="w-8 h-8 text-[var(--brand-border)]" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer Note */}
        <section className="pt-8 text-center">
          <p className="text-sm text-zinc-500">
            Για οποιαδήποτε απορία σχετικά με την παραγγελία σας, καλέστε μας στο{" "}
            <a href="tel:2106543065" className="text-[var(--brand-border)] font-bold hover:underline">210 6543065</a>.
          </p>
        </section>

      </div>
    </main>
  );
}