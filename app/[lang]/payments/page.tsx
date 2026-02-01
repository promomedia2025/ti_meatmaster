"use client";

import { CreditCard, ArrowLeft, ShieldCheck, Wallet, Banknote } from "lucide-react";
import Link from "next/link";

export default function PaymentMethodsPage() {
  return (
    <main className="min-h-screen bg-black text-zinc-200 font-sans selection:bg-[#ff9328]/30">
      
      {/* Header */}
      <div className="bg-zinc-900 border-b border-zinc-800">
        <div className="max-w-4xl mx-auto px-4 py-8 flex items-center gap-6">
          <Link
            href="/"
            className="p-2 bg-black border border-zinc-800 rounded-xl hover:border-[#915316] transition-all text-zinc-400 hover:text-white shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>

          {/* Icon Circle: Custom Orange Brand Color */}
          <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center shrink-0 border-4 border-zinc-900 shadow-xl">
            <CreditCard className="w-6 h-6 text-[#ff9328]" />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight mb-1">
              Τρόποι Πληρωμής
            </h1>
            <p className="text-zinc-400 text-sm">
              Ενημερωθείτε για τις επιλογές ασφαλών συναλλαγών στο Cocofino.gr
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-12 text-lg leading-relaxed text-zinc-400 space-y-12">
        
        <section className="space-y-6">
          <p>
            Πραγματοποιώντας την online παραγγελία σου από το <strong className="text-white">Cocofino.gr</strong> μπορείς να επιλέξεις έναν από τους παρακάτω τρόπους πληρωμής:
          </p>
        </section>

        {/* Cash Payment */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white border-l-4 border-[#ff9328] pl-4 flex items-center gap-2">
            <Banknote className="w-5 h-5 text-[#ff9328]" />
            Με μετρητά
          </h2>
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
            <p>
              Ο κλασικός τρόπος πληρωμής κατά την διάρκεια της παράδοσης. Για να είμαστε σίγουροι πως οι διανομείς μας θα επιστρέψουν στο μαγαζί πάντα με ασφάλεια, <strong className="text-zinc-200">δεν μεταφέρουν ποτέ πάνω από 50€</strong>. Για το λόγο αυτό, αν τυχόν θέλετε ρέστα από χαρτονόμισμα των 50€, είναι επιθυμητό να μας το αναφέρετε <span className="italic text-zinc-300 underline underline-offset-8 decoration-[#ff9328]/50">στα σχόλια της παραγγελίας σας</span>.
            </p>
          </div>
        </section>

        {/* Credit Card Payment */}
        <section className="space-y-6">
          <h2 className="text-xl font-bold text-white border-l-4 border-[#ff9328] pl-4 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#ff9328]" />
            Με πιστωτική κάρτα
          </h2>
          <p>
            Η online παραγγελία και η πληρωμή μέσω πιστωτικής κάρτας στο Cocofino.gr είναι τόσο απολαυστική όσο και τα φαγητά του Cocofino! Παράλληλα, επειδή η ασφάλεια των συναλλαγών έχει εξαιρετική σημασία για εμάς έχουμε συνεργαστεί με την <strong className="text-white">Τράπεζα Πειραιώς</strong>, την καλύτερη Ψηφιακή Τράπεζα στην Ελλάδα (Greece’s Best Digital Bank).
          </p>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4 hover:border-[#915316] transition-colors">
              <h3 className="text-zinc-100 font-bold flex items-center gap-2">
                <div className="w-2 h-2 bg-[#ff9328] rounded-full shadow-[0_0_8px_#ff9328]" />
                (α) Firewall
              </h3>
              <p className="text-sm leading-relaxed">
                Η πρόσβαση στα συστήματα ελέγχεται από ειδικά προγράμματα που επιτρέπουν τη χρήση συγκεκριμένων υπηρεσιών απαγορεύοντας την πρόσβαση σε απόρρητα στοιχεία.
              </p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4 hover:border-[#915316] transition-colors">
              <h3 className="text-zinc-100 font-bold flex items-center gap-2">
                <div className="w-2 h-2 bg-[#ff9328] rounded-full shadow-[0_0_8px_#ff9328]" />
                (β) Κρυπτογράφηση
              </h3>
              <p className="text-sm leading-relaxed">
                Όλες οι πληροφορίες σας κρυπτογραφούνται με βάση το πρωτόκολλο κρυπτογράφησης <strong className="text-zinc-200">SSL-128-bit</strong> (Secure Sockets Layer).
              </p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4 hover:border-[#915316] transition-colors">
              <h3 className="text-zinc-100 font-bold flex items-center gap-2">
                <div className="w-2 h-2 bg-[#ff9328] rounded-full shadow-[0_0_8px_#ff9328]" />
                (γ) Ανίχνευση απάτης
              </h3>
              <p className="text-sm leading-relaxed">
                Συστήματα <strong className="text-zinc-200">Fraud Prevention</strong> για τον έγκαιρο εντοπισμό και την ενημέρωσή σας σε περίπτωση ύποπτων συναλλαγών.
              </p>
            </div>
          </div>
        </section>

        {/* Instructions Section */}
        <section className="space-y-8">
          <h2 className="text-xl font-bold text-white border-l-4 border-[#ff9328] pl-4">
            Οδηγίες Χρήσης Κάρτας
          </h2>
          
          <div className="grid gap-6 text-base">
            {[
              { 
                step: "01", 
                title: "Ενεργοποίηση/Έκδοση:", 
                desc: "Μέσω mobile ή web banking, μπορείτε να εκδώσετε ψηφιακή κάρτα ή να ενεργοποιήσετε τη φυσική, λαμβάνοντας PIN μέσω SMS." 
              },
              { 
                step: "02", 
                title: "Ρυθμίσεις Ασφαλείας:", 
                desc: "Βεβαιωθείτε ότι η επιλογή 'Ηλεκτρονικές Συναλλαγές' είναι ενεργοποιημένη στις ρυθμίσεις της κάρτας σας (π.χ. Alpha Bank, Piraeus)." 
              },
              { 
                step: "03", 
                title: "Πραγματοποίηση Αγοράς:", 
                list: [
                  "Επιλέξτε 'Πληρωμή με κάρτα'",
                  "Καταχωρίστε το Όνομα Κατόχου",
                  "Καταχωρίστε τον 16ψήφιο Αριθμό Κάρτας",
                  "Εισάγετε Ημερομηνία Λήξης (MM/YY) και CVV (3ψήφιος κωδικός)"
                ] 
              },
              { 
                step: "04", 
                title: "Έγκριση Συναλλαγής (SCA):", 
                desc: "Η τράπεζα θα ζητήσει επιβεβαίωση μέσω push notification στην εφαρμογή ή με κωδικό SMS." 
              }
            ].map((item, idx) => (
              <div key={idx} className="flex gap-6 group">
                <div className="text-[#ff9328] font-black text-2xl opacity-50 group-hover:opacity-100 transition-opacity">
                  {item.step}
                </div>
                <div>
                  <p className="text-zinc-100 font-bold mb-1">{item.title}</p>
                  {item.desc && <p>{item.desc}</p>}
                  {item.list && (
                    <ul className="mt-2 space-y-2">
                      {item.list.map((li, lIdx) => (
                        <li key={lIdx} className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-[#915316] rounded-full" />
                          {li}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Safety Tips Banner */}
        <section className="bg-gradient-to-br from-[#ff9328]/10 to-transparent border border-[#ff9328]/20 rounded-2xl p-8 space-y-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Wallet className="w-5 h-5 text-[#ff9328]" />
            Συμβουλές Ασφαλείας
          </h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-1 bg-[#ff9328]/20 rounded-md text-[#ff9328] shrink-0">✓</div>
              <p>Χρησιμοποιείτε το ψηφιακό πορτοφόλι <span className="text-white">Apple Pay ή Google Pay</span> για αυξημένη ασφάλεια μέσω βιομετρικών στοιχείων.</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-1 bg-[#ff9328]/20 rounded-md text-[#ff9328] shrink-0">✓</div>
              <p>Ελέγχετε τακτικά τις κινήσεις του λογαριασμού σας.</p>
            </div>
            <div className="mt-4 p-4 bg-black/40 rounded-lg border border-zinc-800 text-sm italic">
              <strong className="text-[#ff9328] not-italic block mb-1">Σημείωση:</strong>
              Το Cocofino.gr δεν αποθηκεύει ποτέ κανένα στοιχείο της πιστωτικής σας κάρτας. Η συναλλαγή γίνεται στο ασφαλές περιβάλλον της τράπεζας.
            </div>
          </div>
        </section>

      </div>
    </main>
  );
}