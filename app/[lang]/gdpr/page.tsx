"use client";

import { Shield, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function PrivacyPolicyPage() {
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

          {/* Icon Circle: Brand Orange */}
          <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center shrink-0 border-4 border-zinc-900 shadow-xl">
            <Shield className="w-6 h-6 text-[var(--brand-border)]" />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight mb-1">
              Πολιτική Προστασίας Προσωπικών Δεδομένων (GDPR)
            </h1>
            <p className="text-zinc-400 text-sm">
              Ενημέρωση για τη συλλογή και επεξεργασία προσωπικών δεδομένων
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-12 text-lg leading-relaxed text-zinc-400 space-y-12">
        
        <section className="space-y-6">
          <p>
            Η ομόρρυθμη εταιρεία{" "}
            <strong className="text-zinc-200">ΓΕΝΙΤΣΑΡΙΔΟΥ ΒΑΣΙΛΙΚΗ ΛΑΖΑΡΟΣ</strong>, ΑΦΜ{" "}
            <strong className="text-[var(--brand-border)]">101136205</strong>, σας ευχαριστεί για την επίσκεψή σας στην
            ιστοσελίδα και για το ενδιαφέρον σας στις υπηρεσίες και προσφορές μας.
          </p>

          <p>
            Η προστασία των προσωπικών σας δεδομένων αποτελεί προτεραιότητά μας.
            Στόχος μας είναι να αισθάνεστε ασφαλείς κατά την πλοήγησή σας στην
            ιστοσελίδα μας. Παρακάτω εξηγούμε ποια δεδομένα συλλέγουμε, πώς τα
            επεξεργαζόμαστε και για ποιο σκοπό.
          </p>

          <p>
            Η παρούσα πολιτική εφαρμόζεται αποκλειστικά στην ιστοσελίδα μας. Σε
            περίπτωση που περιλαμβάνονται υπερσύνδεσμοι προς ιστοσελίδες τρίτων,
            εφαρμόζονται οι αντίστοιχες πολιτικές προστασίας προσωπικών δεδομένων
            των τρίτων αυτών ιστότοπων.
          </p>

          <p>
            Με την αποδοχή της παρούσας πολιτικής, συμφωνείτε με τη συλλογή,
            επεξεργασία και χρήση των προσωπικών σας δεδομένων σύμφωνα με τον
            Γενικό Κανονισμό Προστασίας Δεδομένων (ΕΕ 2016/679 – GDPR) και τους
            όρους που ακολουθούν.
          </p>

          <p>
            Υπενθυμίζουμε ότι είστε οι ιδιοκτήτες των δεδομένων σας. Όσο λιγότερες
            πληροφορίες παρέχετε, τόσο μεγαλύτερο έλεγχο διατηρείτε. Εάν επιθυμείτε
            ανώνυμη περιήγηση και δεν θέλετε η συμπεριφορά σας να αναλύεται από
            τρίτους, μπορείτε να προσαρμόσετε τις ρυθμίσεις του περιηγητή σας ή να
            χρησιμοποιήσετε λειτουργία ανώνυμης περιήγησης.
          </p>
        </section>

        {/* Data Controller */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white border-l-4 border-[var(--brand-border)] pl-4">
            Υπεύθυνος Επεξεργασίας
          </h2>
          <p>
            Υπεύθυνος επεξεργασίας είναι το φυσικό ή νομικό πρόσωπο που καθορίζει
            τον σκοπό και τον τρόπο επεξεργασίας των δεδομένων προσωπικού
            χαρακτήρα.
          </p>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 space-y-4 shadow-xl">
            <div className="space-y-1">
              <p className="text-[var(--brand-border)] font-black text-lg tracking-tight">
                ΓΕΝΙΤΣΑΡΙΔΟΥ ΒΑΣΙΛΙΚΗ ΛΑΖΑΡΟΣ
              </p>
              <p className="text-zinc-500 text-sm font-medium">ΑΦΜ: 101136205</p>
            </div>
            
            <div className="grid gap-2 text-zinc-300">
              <p className="flex items-center gap-2">
                <span className="text-[var(--brand-border)]">•</span>
                Διεύθυνση: Φιλικής Εταιρείας 13, Κορυδαλλός, 18120, Αττική
              </p>
              <p className="flex items-center gap-2">
                <span className="text-[var(--brand-border)]">•</span>
                Τηλέφωνο: 210 4952489
              </p>
              <p className="flex items-center gap-2">
                <span className="text-[var(--brand-border)]">•</span>
                Email: <a href="mailto:perfetta@gmail.com" className="hover:text-[var(--brand-border)] transition-colors underline underline-offset-4 decoration-[var(--brand-border)]/30">perfetta@gmail.com</a>
              </p>
            </div>
          </div>
        </section>

        {/* User Rights */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white border-l-4 border-[var(--brand-border)] pl-4">
            Δικαιώματα Υποκειμένου των Δεδομένων
          </h2>
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 space-y-4">
            <p>
              Μπορείτε οποιαδήποτε στιγμή να επικοινωνήσετε μαζί μας εάν
              επιθυμείτε να εναντιωθείτε στη συλλογή, επεξεργασία ή χρήση των
              προσωπικών σας δεδομένων, σύμφωνα με την ισχύουσα νομοθεσία.
            </p>
            <p className="text-sm italic text-zinc-500">
              Σημείωση: Σε περίπτωση άρνησης ή ανάκλησης συγκατάθεσης, ενδέχεται η χρήση
              ορισμένων υπηρεσιών της ιστοσελίδας να μην είναι πλέον δυνατή για
              τεχνικούς λόγους.
            </p>
          </div>
        </section>

        {/* Policy Changes */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white border-l-4 border-[var(--brand-border)] pl-4">
            Τροποποίηση της Πολιτικής
          </h2>
          <p>
            Διατηρούμε το δικαίωμα να τροποποιούμε την παρούσα πολιτική προστασίας
            προσωπικών δεδομένων, ώστε να συμμορφωνόμαστε με τις εκάστοτε νομικές
            και κανονιστικές απαιτήσεις.
          </p>
          <p>
            Σε περίπτωση ουσιωδών αλλαγών ή μεταβολής του σκοπού επεξεργασίας,
            θα ενημερώνουμε τους χρήστες μέσω της ιστοσελίδας.
          </p>
        </section>

      </div>
    </main>
  );
}