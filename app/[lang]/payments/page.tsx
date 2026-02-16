"use client";

import { CreditCard, ArrowLeft, ShieldCheck, Wallet, Banknote, Smartphone, Lock, ClipboardCheck } from "lucide-react";
import Link from "next/link";

export default function PaymentMethodsPage() {
  return (
    <main className="min-h-screen bg-black text-zinc-200 font-sans selection:bg-[var(--brand-border)]/30">

      {/* Header */}
      <div className="bg-zinc-900 border-b border-zinc-800">
        <div className="max-w-4xl mx-auto px-4 py-8 flex items-center gap-6">
          <Link
            href="/"
            className="p-2 bg-black border border-zinc-800 rounded-xl hover:border-[var(--brand-border)] transition-all text-zinc-400 hover:text-white shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>

          <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center shrink-0 border-4 border-zinc-900 shadow-xl">
            <CreditCard className="w-6 h-6 text-[var(--brand-border)]" />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight mb-1">
              Τρόποι Πληρωμής
            </h1>
            <p className="text-zinc-400 text-sm">
              Ενημερωθείτε για τις επιλογές ασφαλών συναλλαγών στο perfetta.gr
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-12 text-lg leading-relaxed text-zinc-400 space-y-12">

        <section className="space-y-6">
          <p>
            Πραγματοποιώντας την online παραγγελία σου από το <strong className="text-white">perfetta.gr</strong> μπορείς να επιλέξεις έναν από τους παρακάτω τρόπους πληρωμής:
          </p>
        </section>

        {/* Cash Payment */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white border-l-4 border-[var(--brand-border)] pl-4 flex items-center gap-2">
            <Banknote className="w-5 h-5 text-[var(--brand-border)]" />
            Με μετρητά
          </h2>
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
            <p>
              Ο κλασικός τρόπος πληρωμής κατά την διάρκεια της παράδοσης. Για να είμαστε σίγουροι πως οι διανομείς μας θα επιστρέψουν στο μαγαζί πάντα με ασφάλεια, <strong className="text-zinc-200">δεν μεταφέρουν ποτέ πάνω από 50€</strong>. Για το λόγο αυτό, αν τυχόν θέλετε ρέστα από χαρτονόμισμα των 50€, είναι επιθυμητό να μας το αναφέρετε <span className="italic text-zinc-300 underline underline-offset-8 decoration-[var(--brand-border)]/50">στα σχόλια της παραγγελίας σας</span>.
            </p>
          </div>
        </section>

        {/* Viva.com / Credit Card Payment */}
        <section className="space-y-6">
          <h2 className="text-xl font-bold text-white border-l-4 border-[var(--brand-border)] pl-4 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[var(--brand-border)]" />
            Με πιστωτική κάρτα
          </h2>
          <p>
            Η online παραγγελία και η πληρωμή μέσω πιστωτικής κάρτας στο perfetta.gr είναι τόσο απολαυστική όσο και τα φαγητά του Perfetta! Παράλληλα, συνεργαζόμαστε με τη <strong className="text-white">Viva.com</strong>, την πρώτη Tech Bank στην Ευρώπη, διασφαλίζοντας τις συναλλαγές σας με τις πιο σύγχρονες μεθόδους προστασίας.
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4 hover:border-[var(--brand-border)] transition-colors">
              <h3 className="text-zinc-100 font-bold flex items-center gap-2 text-sm uppercase tracking-wider">
                <Lock className="w-4 h-4 text-[var(--brand-border)]" />
                3D Secure & SCA
              </h3>
              <p className="text-sm leading-relaxed">
                Εφαρμογή πρωτοκόλλου Ισχυρής Ταυτοποίησης Πελατών (SCA) σύμφωνα με την οδηγία PSD2 για την απόλυτη πρόληψη απάτης.
              </p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4 hover:border-[var(--brand-border)] transition-colors">
              <h3 className="text-zinc-100 font-bold flex items-center gap-2 text-sm uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4 text-[var(--brand-border)]" />
                PCI DSS
              </h3>
              <p className="text-sm leading-relaxed">
                Πλήρης συμμόρφωση με το αυστηρό διεθνές πρότυπο ασφαλείας PCI Data Security Standard για τη διαχείριση δεδομένων καρτών.
              </p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4 hover:border-[var(--brand-border)] transition-colors">
              <h3 className="text-zinc-100 font-bold flex items-center gap-2 text-sm uppercase tracking-wider">
                <Smartphone className="w-4 h-4 text-[var(--brand-border)]" />
                Κρυπτογράφηση
              </h3>
              <p className="text-sm leading-relaxed">
                Χρήση πρωτοκόλλου TLS με ισχυρούς αλγορίθμους για την απόλυτα ασφαλή μεταφορά των δεδομένων σας.
              </p>
            </div>
          </div>
        </section>

        {/* Instructions Section */}
        <section className="space-y-8">
          <h2 className="text-xl font-bold text-white border-l-4 border-[var(--brand-border)] pl-4">
            Οδηγίες Χρήσης Κάρτας Viva.com
          </h2>

          <div className="grid gap-6 text-base">
            {[
              {
                step: "01",
                title: "Προετοιμασία:",
                desc: "Βεβαιωθείτε ότι υπάρχει διαθέσιμο υπόλοιπο στον κύριο λογαριασμό (Primary) και ότι η κάρτα δεν είναι κλειδωμένη στην εφαρμογή."
              },
              {
                step: "02",
                title: "Στοιχεία Κάρτας:",
                desc: "Εισάγετε τον 16ψήφιο αριθμό, τη λήξη και το CVV (διαθέσιμα στο Viva app -> Περισσότερα -> Λεπτομέρειες κάρτας)."
              },
              {
                step: "03",
                title: "Έγκριση Συναλλαγής:",
                desc: "Θα λάβετε push notification στο κινητό σας. Ανοίξτε την εφαρμογή και εγκρίνετε με Face ID, δακτυλικό αποτύπωμα ή PIN."
              }
            ].map((item, idx) => (
              <div key={idx} className="flex gap-6 group">
                {/* Πιο φωτεινό κόκκινο για τα νούμερα (text-[var(--brand-border)]) */}
                <div className="text-[var(--brand-border)] font-black text-3xl opacity-80 group-hover:opacity-100 transition-opacity tabular-nums">
                  {item.step}
                </div>
                <div>
                  <p className="text-zinc-100 font-bold mb-1">{item.title}</p>
                  <p className="text-zinc-400">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Safety Tips Banner */}
        {/* Πιο ανοιχτό border και ελαφρώς πιο έντονο gradient */}
        <section className="bg-gradient-to-br from-[var(--brand-border)]/20 to-transparent border border-[#A32E35] rounded-2xl p-8 space-y-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-[var(--brand-border)]" />
            Σημαντικές Σημειώσεις
          </h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3 text-sm">
              <div className="p-1 bg-[var(--brand-border)]/40 rounded-md text-[var(--brand-border)] shrink-0">✓</div>
              <p>Σε περίπτωση αποτυχίας, ελέγξτε αν τα στοιχεία είναι σωστά ή αν απαιτείται έγκριση μέσω του Viva app.</p>
            </div>
            <div className="flex items-start gap-3 text-sm">
              <div className="p-1 bg-[var(--brand-border)]/40 rounded-md text-[var(--brand-border)] shrink-0">✓</div>
              <p>Χρησιμοποιείτε ψηφιακά πορτοφόλια για ταχύτερες και ασφαλέστερες πληρωμές.</p>
            </div>

            {/* Inner box with better contrast */}
            <div className="mt-4 p-4 bg-black/60 rounded-lg border border-zinc-800/80 text-sm italic">
              <strong className="text-[var(--brand-border)] not-italic block mb-1">Ασφάλεια Δεδομένων:</strong>
              Το perfetta.gr δεν αποθηκεύει ποτέ κανένα στοιχείο της κάρτας σας. Η συναλλαγή ολοκληρώνεται αποκλειστικά στο ασφαλές περιβάλλον της Viva.com.
            </div>
          </div>
        </section>

      </div>
    </main>
  );
}