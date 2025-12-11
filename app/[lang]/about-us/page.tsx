
import { Store } from "lucide-react";
import Link from "next/link";

export default function AboutUsPage() {
  return (
    <main className="min-h-screen bg-gray-950">
      <div className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-6 flex items-center gap-4">
          <Link
            href="/"
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            ←
          </Link>

          <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
            <Store className="w-6 h-6 text-white" />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-white">
              Σχετικά με εμάς
            </h1>
            <p className="text-gray-400">
              ΤΟ ΑΥΘΕΝΤΙΚΟ ΣΠΙΤΙΚΟ από το 1990
            </p>
          </div>
        </div>
      </div>

     <div className="max-w-4xl mx-auto px-6 py-16 text-lg leading-7 text-gray-300 space-y-6"> 
        <p>
          Tο Αυθεντικό Σπιτικό, όλα μας τα είδη διατίθενται και σε μεγάλες ποσότητες για κάθε είδους κοινωνική εκδήλωση.
        </p>

        <p>
          Με ένα click όλο το μενού μας φτάνει στην πόρτα σας σε λίγα μόνο λεπτά,
          με την ίδια ποιότητα και φροντίδα που θα βρίσκατε στο κατάστημά μας.
        </p>

        <p>
          Δουλεύουμε καθημερινά με υπευθυνότητα, ταχύτητα και σεβασμό απέναντι
          στον πελάτη, γιατί για εμάς κάθε παραγγελία έχει όνομα.
        </p>

         <p>
         Οι πίτες ψήνονται στα κάρβουνα. Τα κρεατικά είναι φρέσκα άριστης ποιότητας και ψήνονται στα κάρβουνα κατόπιν παραγγελίας σας. 
         Οι σαλάτες είναι όλες με αγνά υλικά, φρεσκοκομμένες κατόπιν παραγγελίας σας, αλατίζονται και περιέχουν ελαιόλαδο παραγωγής μας. 
         Οι γύροι μας είναι καθημερινά χειροποίητοι από καθαρό φρέσκο κρέας. 
         Το κεμπάπ είναι κατεψυγμένο. 
         Οι πατάτες είναι κατεψυγμένες και τηγανίζονται σε ηλιέλαιο. 
         Η φέτα είναι Π.Ο.Π.
        </p>
      </div>
    </main>
  );
}
