"use client";

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
    <div className="min-h-screen bg-black text-zinc-200 font-sans selection:bg-[#ff9328]/30">
      
      {/* Header */}
      <div className="bg-zinc-900 border-b border-zinc-800 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-8 flex items-center gap-6">
          <Link
            href="/"
            className="p-2 bg-black border border-zinc-800 rounded-xl hover:border-[#915316] transition-all text-zinc-400 hover:text-white shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>

          {/* Logo Circle: Brand Orange */}
          <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center shrink-0 border-4 border-zinc-900 shadow-xl">
            <Store className="w-6 h-6 text-[#ff9328]" />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight mb-1">
              Σχετικά με εμάς
            </h1>
            <p className="text-zinc-400 text-sm">
              Λίγα λόγια για το Cocofino
            </p>
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-12 space-y-12">
        
        {/* Intro Section */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-white">Η ιστορία μας</h2>
          <div className="text-lg leading-relaxed text-zinc-400 space-y-4">
            <p>
              Το <span className="text-[#ff9328] font-bold">Cocofino</span> είναι το αγαπημένο σας ψητοπωλείο που προσφέρει κυρίως 
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
          {[
            { 
              icon: UtensilsCrossed, 
              title: "Μεγάλη Ποικιλία", 
              desc: "Κοτόπουλο σούβλας, σχάρας, φτερούγες, καλαμάκια, γύρος, μπιφτέκια, σουβλάκια και μαγειρευτά." 
            },
            { 
              icon: Bike, 
              title: "Ταχύτητα & Φροντίδα", 
              desc: "Online παραγγελίες και delivery με ταχύτητα και φροντίδα για κάθε γεύμα." 
            },
            { 
              icon: Award, 
              title: "Κορυφαία Ποιότητα", 
              desc: "Δίνουμε έμφαση στην ποιότητα των υλικών και την φροντίδα σε κάθε παραγγελία." 
            },
            { 
              icon: ChefHat, 
              title: "Φρέσκο Φαγητό", 
              desc: "Καθημερινά φρεσκομαγειρεμένα φαγητά με αγνά υλικά." 
            }
          ].map((feature, idx) => (
            <div key={idx} className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 hover:border-[#ff9328]/50 transition-all duration-300 group hover:shadow-[0_0_20px_rgba(255,147,40,0.05)]">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-black rounded-xl text-[#ff9328] shrink-0 group-hover:bg-[#ff9328] group-hover:text-black transition-colors duration-300 border border-zinc-800">
                  <feature.icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-2">{feature.title}</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* Summary Quote */}
        <section className="bg-gradient-to-r from-[#ff9328]/10 to-transparent border-l-4 border-[#ff9328] p-6 rounded-r-xl">
          <p className="text-lg text-zinc-200 italic leading-relaxed">
            "Αν ψάχνετε για γρήγορο, νόστιμο και ποιοτικό κοτόπουλο, 
            κρεατικά, σουβλάκια ή μαγειρευτά, το Cocofino είναι η καλύτερη επιλογή!!"
          </p>
        </section>

        <hr className="border-zinc-800" />

        {/* Info Grid (Contact, Delivery, Hours) */}
        <div className="grid md:grid-cols-2 gap-12">
          
          {/* Contact Info */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-white flex items-center gap-3">
              <Store className="w-5 h-5 text-[#ff9328]" />
              Επικοινωνία
            </h3>
            <ul className="space-y-6">
               <li className="flex items-start gap-4 text-zinc-400 group">
                <div className="p-2 bg-zinc-900 rounded-lg border border-zinc-800 group-hover:border-[#ff9328]/50 transition-colors">
                    <MapPin className="w-5 h-5 text-[#ff9328]" />
                </div>
                <div>
                  <p className="font-bold text-white mb-1">Ψητοπωλείο Cocofino</p>
                  <p className="text-sm">Φανερωμένης 1Α, Χολαργός 15561, Αττική</p>
                </div>
              </li>
              <li className="flex items-center gap-4 text-zinc-400 group">
                <div className="p-2 bg-zinc-900 rounded-lg border border-zinc-800 group-hover:border-[#ff9328]/50 transition-colors">
                    <Phone className="w-5 h-5 text-[#ff9328]" />
                </div>
                <p className="font-medium text-white">210 6543065</p>
              </li>
              <li className="flex items-center gap-4 text-zinc-400 group">
                <div className="p-2 bg-zinc-900 rounded-lg border border-zinc-800 group-hover:border-[#ff9328]/50 transition-colors">
                    <Mail className="w-5 h-5 text-[#ff9328]" />
                </div>
                <p className="font-medium text-white break-all">cocofinowoltdrive@gmail.com</p>
              </li>
            </ul>

            <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 mt-8 hover:border-[#915316] transition-colors shadow-xl">
              <h4 className="text-white font-bold mb-2 flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#ff9328]" />
                Τηλεφωνικές Παραγγελίες
              </h4>
              <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
                Μπορείτε να παρακολουθείτε καθημερινά το ηλεκτρονικό μας κατάστημα για τα φαγητά ημέρας και να μας καλείτε.
              </p>
              <a 
                href="tel:2106543065" 
                className="inline-flex items-center justify-center w-full py-4 px-4 rounded-xl bg-[#ff9328] hover:bg-[#915316] text-black hover:text-white font-black transition-all shadow-lg shadow-[#ff9328]/10 hover:scale-[1.02]"
              >
                ΚΑΛΕΣΤΕ ΣΤΟ 210 6543065
              </a>
            </div>
          </div>

          {/* Delivery & Hours */}
          <div className="space-y-8">
            
            {/* Delivery Areas */}
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-3 mb-4">
                <Map className="w-5 h-5 text-[#ff9328]" />
                Περιοχές Παράδοσης
              </h3>
              <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 shadow-inner shadow-black">
                <ul className="grid grid-cols-2 gap-y-3 gap-x-4">
                  {deliveryAreas.map((area) => (
                    <li key={area} className="flex items-center gap-2 text-zinc-400 text-sm group hover:text-white transition-colors">
                      <CheckCircle2 className="w-4 h-4 text-[#ff9328]" />
                      {area}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Hours */}
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-3 mb-4">
                <Clock className="w-5 h-5 text-[#ff9328]" />
                Ωράριο Λειτουργίας
              </h3>
              <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 space-y-4">
                <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
                  <span className="text-zinc-300 font-medium">Καθημερινά</span>
                  <span className="text-[#ff9328] font-bold text-sm">11:30 π.μ. – 01:30 π.μ.</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-300 font-medium">Δευτέρα</span>
                  <span className="text-zinc-500 font-bold bg-black border border-zinc-800 px-3 py-1 rounded-full text-xs uppercase tracking-wider">
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