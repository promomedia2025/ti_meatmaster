import { FileText } from "lucide-react";
import Link from "next/link";

export default function TermsOfUsePage() {
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
          <FileText className="w-6 h-6 text-white" />
         </div>
         
          <div>
            <h1 className="text-2xl font-bold text-white">Όροι Χρήσης</h1>
            <p className="text-gray-400">
              Νομικοί όροι χρήσης της ιστοσελίδας και του ηλεκτρονικού καταστήματος
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-16 text-lg leading-7 text-gray-300 space-y-14">
        {/* Introduction */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">Εισαγωγή</h2>
          <p>
            Η πρόσβαση και χρήση της ιστοσελίδας διέπονται από τους παρόντες Όρους
            Χρήσης, οι οποίοι είναι δεσμευτικοί και ισχύουν για κάθε επίσκεψη και
            συναλλαγή που πραγματοποιείται μέσω της ιστοσελίδας.
          </p>
        </section>

        {/* Definitions */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">Ορισμοί</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Εταιρεία:</strong> ΑΝΑΣΤΑΣΙΟΣ ΤΡΥΠΟΣΚΟΥΦΗΣ & ΣΙΑ ΟΕ, ΑΦΜ
              998154126
            </li>
            <li>
              <strong>Ιστοσελίδα:</strong> Το ηλεκτρονικό κατάστημα Cocofino.gr
              (www.cocofino.gr)
            </li>
            <li>
              <strong>Χρήστης:</strong> Κάθε επισκέπτης ή/και πελάτης της
              Ιστοσελίδας
            </li>
          </ul>
        </section>

        {/* General Terms */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">Γενικοί Όροι</h2>
          <p>
            Ιδιοκτήτης και φορέας εκμετάλλευσης του ηλεκτρονικού καταστήματος είναι
            η Εταιρεία:
          </p>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-1">
            <p><strong>ΑΝΑΣΤΑΣΙΟΣ ΤΡΥΠΟΣΚΟΥΦΗΣ & ΣΙΑ ΟΕ</strong></p>
            <p>ΑΦΜ: 998154126</p>
            <p>Φανερωμένης 1Α, Χολαργός 15561, Αττική</p>
            <p>Τηλ.: 210 6543065</p>
            <p>Email: cocofinowoltdrive@gmail.com</p>
          </div>

          <p>
            Η πλοήγηση, εγγραφή ή συναλλαγή στην Ιστοσελίδα συνεπάγεται ανεπιφύλακτη
            αποδοχή των παρόντων Όρων Χρήσης. Σε περίπτωση διαφωνίας, ο Χρήστης
            οφείλει να απέχει από οποιαδήποτε χρήση της Ιστοσελίδας.
          </p>

          <p>
            Η Εταιρεία διατηρεί το δικαίωμα να τροποποιεί οποτεδήποτε την
            Ιστοσελίδα ή τους παρόντες Όρους Χρήσης, χωρίς προηγούμενη ειδοποίηση,
            με την επιφύλαξη των παραγγελιών που έχουν ήδη ολοκληρωθεί.
          </p>
        </section>

        {/* Products & Info */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">
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
          <h2 className="text-xl font-semibold text-white">Περιορισμός Ευθύνης</h2>
          <p>
            Η Εταιρεία δεν ευθύνεται για τεχνικά προβλήματα που οφείλονται στη
            συμβατότητα του εξοπλισμού ή του λογισμικού του Χρήστη.
          </p>
          <p>
            Σύνδεσμοι προς τρίτες ιστοσελίδες παρέχονται αποκλειστικά για
            διευκόλυνση και η Εταιρεία δεν φέρει ευθύνη για το περιεχόμενο ή τις
            πολιτικές τους.
          </p>
        </section>

        {/* User Account */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">Λογαριασμός Χρήστη</h2>
          <p>
            Η δημιουργία λογαριασμού είναι προαιρετική και επιτρέπει την
            παρακολούθηση παραγγελιών και τη διαχείριση προσωπικών στοιχείων.
          </p>
          <p>
            Ο Χρήστης είναι αποκλειστικά υπεύθυνος για τη διατήρηση της
            μυστικότητας των κωδικών πρόσβασης και για κάθε ενέργεια που
            πραγματοποιείται μέσω του λογαριασμού του.
          </p>
        </section>

        {/* Newsletter */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">
            Newsletter & Επικοινωνία
          </h2>
          <p>
            Η Εταιρεία δύναται να αποστέλλει ενημερωτικά και προωθητικά μηνύματα.
            Ο Χρήστης μπορεί οποτεδήποτε να ανακαλέσει τη συγκατάθεσή του μέσω των
            σχετικών επιλογών ή επικοινωνώντας με την Εταιρεία.
          </p>
        </section>

        {/* User Responsibility */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">Ευθύνη Χρήστη</h2>
          <p>
            Ο Χρήστης οφείλει να χρησιμοποιεί την Ιστοσελίδα νόμιμα και υπεύθυνα.
            Απαγορεύεται η χρήση από ανηλίκους κάτω των 18 ετών.
          </p>
        </section>

        {/* Personal Data */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">
            Προστασία Προσωπικών Δεδομένων
          </h2>
          <p>
            Η επεξεργασία προσωπικών δεδομένων διέπεται από την Πολιτική
            Προστασίας Προσωπικών Δεδομένων, η οποία αποτελεί αναπόσπαστο μέρος
            των παρόντων Όρων Χρήσης.
          </p>
        </section>

        {/* Final Provisions */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">Τελικές Διατάξεις</h2>
          <p>
            Οι παρόντες Όροι Χρήσης αποτελούν τη συνολική συμφωνία μεταξύ Εταιρείας
            και Χρήστη. Τυχόν ακυρότητα όρου δεν επηρεάζει την ισχύ των υπολοίπων.
          </p>
        </section>

        {/* Dispute Resolution */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">Επίλυση Διαφορών</h2>
          <p>
            Οι παρόντες Όροι διέπονται από το ελληνικό δίκαιο και αρμόδια είναι τα
            Δικαστήρια Αθηνών. Παρέχεται επίσης η δυνατότητα εξωδικαστικής
            επίλυσης διαφορών μέσω της ευρωπαϊκής πλατφόρμας ΗΕΔ.
          </p>
        </section>
      </div>
    </main>
  );
}
