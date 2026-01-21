import { 
  Store, 
  ArrowLeft, 
  UtensilsCrossed, 
  Bike, 
  Award, 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  Map, 
  CheckCircle2, 
  ChefHat 
} from "lucide-react";
import Link from "next/link";

export default function AboutUsPage() {
  
  const deliveryAreas = [
    "Χολαργός",
    "Παπάγου",
    "Αγία Παρασκευή",
    "Κάτω Χαλάνδρι",
    "Νέο Ψυχικό",
    "Πεντάγωνο"
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-gray-200 font-sans selection:bg-amber-500/30">
      
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-6 flex items-center gap-4">
          <Link
            href="/"
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-white"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>

          <div className="w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/20">
            <Store className="w-6 h-6 text-gray-950" />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Σχετικά με εμάς
            </h1>
            <p className="text-gray-400 text-sm">
              Λίγα λόγια για το Cocofino
            </p>
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-12 space-y-12">
        
        {/* Intro Section */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-white">Η ιστορία μας</h2>
          <div className="text-lg leading-relaxed text-gray-300 space-y-4">
            <p>
              Το <span className="text-amber-500 font-semibold">Cocofino</span> είναι το αγαπημένο σας ψητοπωλείο που προσφέρει κυρίως 
              κοτόπουλο (σούβλας, σχάρας, πανέ), αλλά και κρεατικά (γύρο, καλαμάκι, 
              παϊδάκια), σουβλάκια, burger, και μεγάλη ποικιλία καθημερινών 
              φρεσκομαγειρεμένων φαγητών.
            </p>
            <p>
              Δίνουμε έμφαση στην ποιότητα και την άμεση εξυπηρέτηση, διαθέτοντας 
              online delivery για πολλές περιοχές της Αθήνας.
            </p>
          </div>
        </section>

        {/* Key Features (Cards) */}
        <section className="grid md:grid-cols-2 gap-4">
          <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800 hover:border-amber-500/30 transition-colors">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-gray-800 rounded-lg text-amber-500 shrink-0">
                <UtensilsCrossed className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-2">Μεγάλη Ποικιλία</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Κοτόπουλο σούβλας, σχάρας, φτερούγες, καλαμάκια, γύρος, μπιφτέκια, σουβλάκια και μαγειρευτά.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800 hover:border-amber-500/30 transition-colors">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-gray-800 rounded-lg text-amber-500 shrink-0">
                <Bike className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-2">Ταχύτητα & Φροντίδα</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Online παραγγελίες και delivery με ταχύτητα και φροντίδα για κάθε γεύμα.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800 hover:border-amber-500/30 transition-colors">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-gray-800 rounded-lg text-amber-500 shrink-0">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-2">Κορυφαία Ποιότητα</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Δίνουμε έμφαση στην ποιότητα των υλικών και την φροντίδα σε κάθε παραγγελία.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800 hover:border-amber-500/30 transition-colors">
             <div className="flex items-start gap-4">
              <div className="p-3 bg-gray-800 rounded-lg text-amber-500 shrink-0">
                <ChefHat className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-2">Φρέσκο Φαγητό</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Καθημερινά φρεσκομαγειρεμένα φαγητά με αγνά υλικά.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Summary Quote */}
        <section className="bg-amber-500/10 border-l-4 border-amber-500 p-6 rounded-r-xl">
          <p className="text-lg text-amber-100 italic">
            "Αν ψάχνετε για γρήγορο, νόστιμο και ποιοτικό κοτόπουλο, 
            κρεατικά, σουβλάκια ή μαγειρευτά, το Cocofino είναι η καλύτερη επιλογή!!"
          </p>
        </section>

        <hr className="border-gray-800" />

        {/* Info Grid (Contact, Delivery, Hours) */}
        <div className="grid md:grid-cols-2 gap-8">
          
          {/* Contact Info */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Store className="w-5 h-5 text-amber-500" />
              Επικοινωνία
            </h3>
            <ul className="space-y-4">
               <li className="flex items-start gap-3 text-gray-300">
                <MapPin className="w-5 h-5 text-amber-500 shrink-0 mt-1" />
                <div>
                  <p className="font-medium text-white">Ψητοπωλείο Cocofino</p>
                  <p className="text-sm text-gray-400">Φανερωμένης 1Α, Χολαργός 15561, Αττική</p>
                </div>
              </li>
              <li className="flex items-center gap-3 text-gray-300">
                <Phone className="w-5 h-5 text-amber-500 shrink-0" />
                <p>210 6543065</p>
              </li>
              <li className="flex items-center gap-3 text-gray-300">
                <Mail className="w-5 h-5 text-amber-500 shrink-0" />
                <p className="break-all">cocofinowoltdrive@gmail.com</p>
              </li>
            </ul>

            <div className="bg-gray-900 p-5 rounded-xl border border-gray-800 mt-6">
              <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                <Phone className="w-4 h-4 text-amber-500" />
                Τηλεφωνικές Παραγγελίες
              </h4>
              <p className="text-sm text-gray-400 mb-3">
                Μπορείτε να παρακολουθείτε καθημερινά το ηλεκτρονικό μας κατάστημα για τα φαγητά ημέρας και να μας καλείτε.
              </p>
              <a href="tel:2106543065" className="text-amber-500 font-bold hover:underline">
                Καλέστε στο 210 6543065
              </a>
            </div>
          </div>

          {/* Delivery & Hours */}
          <div className="space-y-8">
            
            {/* Delivery Areas */}
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
                <Map className="w-5 h-5 text-amber-500" />
                Περιοχές Παράδοσης
              </h3>
              <div className="bg-gray-900 p-5 rounded-2xl border border-gray-800">
                <ul className="grid grid-cols-2 gap-y-2 gap-x-4">
                  {deliveryAreas.map((area) => (
                    <li key={area} className="flex items-center gap-2 text-gray-400 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0" />
                      {area}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Hours */}
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-amber-500" />
                Ωράριο Λειτουργίας
              </h3>
              <div className="bg-gray-900 p-5 rounded-2xl border border-gray-800 space-y-3">
                <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                  <span className="text-gray-300">Καθημερινά</span>
                  <span className="text-amber-500 font-bold text-sm">11:30 π.μ. – 01:30 π.μ.</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Δευτέρα</span>
                  <span className="text-red-400 font-bold bg-red-400/10 px-3 py-1 rounded-full text-xs">
                    Κλειστά
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>

      </main>
    </div>
  );
}