"use client";

import { FileText, ArrowLeft, Scale, ShieldAlert, UserCircle, Mail } from "lucide-react";
import Link from "next/link";

export default function TermsOfUsePage() {
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
            <FileText className="w-6 h-6 text-[var(--brand-border)]" />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight mb-1">
              Όροι Χρήσης
            </h1>
            <p className="text-zinc-400 text-sm">
              Νομικοί όροι χρήσης της ιστοσελίδας και του ηλεκτρονικού καταστήματος
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-12 text-lg leading-relaxed text-zinc-400 space-y-12">
        
        {/* Introduction */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white border-l-4 border-[var(--brand-border)] pl-4">Εισαγωγή</h2>
          <p>
            Η πρόσβαση και χρήση της ιστοσελίδας διέπονται από τους παρόντες Όρους
            Χρήσης, οι οποίοι είναι δεσμευτικοί και ισχύουν για κάθε επίσκεψη και
            συναλλαγή που πραγματοποιείται μέσω της ιστοσελίδας.
          </p>
        </section>

        {/* Definitions */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white border-l-4 border-[var(--brand-border)] pl-4">Ορισμοί</h2>
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
            <ul className="space-y-4">
              <li className="flex gap-3">
                <span className="text-[var(--brand-border)] font-bold">•</span>
                <span><strong className="text-zinc-200">Εταιρεία:</strong> ΓΕΝΙΤΣΑΡΙΔΟΥ ΒΑΣΙΛΙΚΗ ΛΑΖΑΡΟΣ, ΑΦΜ 101136205</span>
              </li>
              <li className="flex gap-3">
                <span className="text-[var(--brand-border)] font-bold">•</span>
                <span><strong className="text-zinc-200">Ιστοσελίδα:</strong> Το ηλεκτρονικό κατάστημα Perfetta.gr (www.Perfetta.gr)</span>
              </li>
              <li className="flex gap-3">
                <span className="text-[var(--brand-border)] font-bold">•</span>
                <span><strong className="text-zinc-200">Χρήστης:</strong> Κάθε επισκέπτης ή/και πελάτης της Ιστοσελίδας</span>
              </li>
            </ul>
          </div>
        </section>

        {/* General Terms */}
        <section className="space-y-6">
          <h2 className="text-xl font-bold text-white border-l-4 border-[var(--brand-border)] pl-4 flex items-center gap-2">
            <Scale className="w-5 h-5 text-[var(--brand-border)]" />
            Γενικοί Όροι
          </h2>
          <p>
            Ιδιοκτήτης και φορέας εκμετάλλευσης του ηλεκτρονικού καταστήματος είναι
            η Εταιρεία:
          </p>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 space-y-4 shadow-xl">
            <div className="space-y-1">
              <p className="text-[var(--brand-border)] font-black text-lg tracking-tight">
                ΓΕΝΙΤΣΑΡΙΔΟΥ ΒΑΣΙΛΙΚΗ ΛΑΖΑΡΟΣ
              </p>
              <p className="text-zinc-500 text-sm font-medium">ΑΦΜ: 101136205</p>
            </div>
            <div className="text-sm space-y-1 text-zinc-300">
              <p>Φιλικής Εταιρείας 13, Κορυδαλλός, 18120, Αττική</p>
              <p>Τηλ.: 210 4952489</p>
              <p>Email: perfetta@gmail.com</p>
            </div>
          </div>

          <p>
            Η πλοήγηση, εγγραφή ή συναλλαγή στην Ιστοσελίδα συνεπάγεται ανεπιφύλακτη
            αποδοχή των παρόντων Όρων Χρήσης. Σε περίπτωση διαφωνίας, ο Χρήστης
            οφείλει να απέχει από οποιαδήποτε χρήση της Ιστοσελίδας.
          </p>
        </section>

        {/* Products & Info */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white border-l-4 border-[var(--brand-border)] pl-4">
            Παρεχόμενες Πληροφορίες & Προϊόντα
          </h2>
          <p>
            Η Εταιρεία καταβάλλει κάθε δυνατή προσπάθεια για την ακρίβεια και
            πληρότητα των πληροφοριών που παρατίθενται στην Ιστοσελίδα. Οι τιμές
            των προϊόντων περιλαμβάνουν Φ.Π.Α., με την επιφύλαξη τυπογραφικών ή
            τεχνικών λαθών.
          </p>
        </section>

        {/* Liability */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white border-l-4 border-[var(--brand-border)] pl-4 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-[var(--brand-border)]" />
            Περιορισμός Ευθύνης
          </h2>
          <div className="space-y-4 bg-zinc-900/30 p-6 rounded-xl border border-zinc-800">
            <p>
              Η Εταιρεία δεν ευθύνεται για τεχνικά προβλήματα που οφείλονται στη
              συμβατότητα του εξοπλισμού ή του λογισμικού του Χρήστη.
            </p>
            <p>
              Σύνδεσμοι προς τρίτες ιστοσελίδες παρέχονται αποκλειστικά για
              διευκόλυνση και η Εταιρεία δεν φέρει ευθύνη για το περιεχόμενο ή τις
              πολιτικές τους.
            </p>
          </div>
        </section>

        {/* User Account */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white border-l-4 border-[var(--brand-border)] pl-4 flex items-center gap-2">
            <UserCircle className="w-5 h-5 text-[var(--brand-border)]" />
            Λογαριασμός Χρήστη
          </h2>
          <p>
            Η δημιουργία λογαριασμού είναι προαιρετική και επιτρέπει την
            παρακολούθηση παραγγελιών και τη διαχείριση προσωπικών στοιχείων. Ο Χρήστης είναι αποκλειστικά υπεύθυνος για τη διατήρηση της μυστικότητας των κωδικών πρόσβασης.
          </p>
        </section>

        {/* Newsletter */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white border-l-4 border-[var(--brand-border)] pl-4 flex items-center gap-2">
            <Mail className="w-5 h-5 text-[var(--brand-border)]" />
            Newsletter & Επικοινωνία
          </h2>
          <p>
            Η Εταιρεία δύναται να αποστέλλει ενημερωτικά και προωθητικά μηνύματα.
            Ο Χρήστης μπορεί οποτεδήποτε να ανακαλέσει τη συγκατάθεσή του μέσω των
            σχετικών επιλογών.
          </p>
        </section>

        {/* User Responsibility */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white border-l-4 border-[var(--brand-border)] pl-4">Ευθύνη Χρήστη</h2>
          <p>
            Ο Χρήστης οφείλει να χρησιμοποιεί την Ιστοσελίδα νόμιμα και υπεύθυνα.
            <strong className="text-zinc-200"> Απαγορεύεται η χρήση από ανηλίκους κάτω των 18 ετών.</strong>
          </p>
        </section>

        {/* Dispute Resolution */}
        <section className="bg-gradient-to-br from-[var(--brand-border)]/10 to-transparent border border-[var(--brand-border)]/20 rounded-2xl p-8 space-y-4">
          <h2 className="text-xl font-bold text-white">Επίλυση Διαφορών</h2>
          <p className="text-sm">
            Οι παρόντες Όροι διέπονται από το ελληνικό δίκαιο και αρμόδια είναι τα
            Δικαστήρια Αθηνών. Παρέχεται επίσης η δυνατότητα εξωδικαστικής
            επίλυσης διαφορών μέσω της ευρωπαϊκής πλατφόρμας ΗΕΔ.
          </p>
        </section>

      </div>
    </main>
  );
}