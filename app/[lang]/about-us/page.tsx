"use client";

import Link from "next/link";
import {
  Store,
  ArrowLeft,
  Award,
  MapPin,
  Phone,
  Mail,
  Clock,
  Map,
  CheckCircle2,
  Truck,
  ShieldCheck,
  Star
} from "lucide-react";

export default function AboutUsPage() {
  const deliveryAreas = [
    "Ζωγράφου",
    "Ιλίσια",
    "Γουδί",
    "Καισαριανή",
    "Αμπελόκηποι"
  ];

  const openingHours = [
    { days: "Δευτέρα - Κυριακή", hours: "08:00 - 20:00" },
  ];

  const features = [
    {
      icon: Award,
      title: "Master στο Κρέας",
      desc: "Εξειδίκευση στα μυστικά του κρέατος. Γνωρίζουμε πώς να αξιοποιούμε με τον νοστιμότερο τρόπο και την τελευταία ίνα ενός πολύτιμου σφάγιου.",
    },
    {
      icon: Star,
      title: "Εκλεκτές Κοπές",
      desc: "Ελιά και οσομπούκο όπως δεν τα έχεις ξαναφάει, αλλά και αυθεντικό Black Angus από Αμερική, Αργεντινή και Ουρουγουάη.",
    },
    {
      icon: ShieldCheck,
      title: "Ελευθέρας Βοσκής",
      desc: "Από τα καλύτερα βοσκοτόπια, με αδιαπραγμάτευτη αγάπη για το ελευθέρας βοσκής μοσχαράκι και το ποιοτικό αμνοερίφιο.",
    },
    {
      icon: Truck,
      title: "Άμεση Εξυπηρέτηση",
      desc: "Παράδοση στο χώρο σας με απόλυτη ασφάλεια και προσοχή στη συσκευασία, διατηρώντας την αναλλοίωτη ποιότητα των προϊόντων μας.",
    },
  ];

  return (
    <div className="min-h-screen bg-black text-zinc-200 font-sans selection:bg-[var(--brand-border)]/30">
      {/* Header */}
      <header className="bg-zinc-900 border-b border-zinc-800 relative z-[1]">
        <div className="max-w-4xl mx-auto px-4 py-8 flex items-center gap-6">
          <Link
            href="/"
            className="p-2 bg-black border border-zinc-800 rounded-xl hover:border-[var(--brand-hover)] transition-all text-zinc-400 hover:text-white shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>

          <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center shrink-0 border-4 border-zinc-900 shadow-xl">
            <Store className="w-6 h-6 text-[var(--brand-border)]" />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight mb-1">
              Σχετικά με εμάς
            </h1>
            <p className="text-zinc-400 text-sm">
              Λίγα λόγια για το The Meat Master
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12 space-y-12 relative z-10">
        {/* Intro */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-white">Η ιστορία μας</h2>
          <div className="text-lg leading-relaxed text-zinc-400 space-y-4">
            <p>
              Το{" "}
              <span className="text-[var(--brand-border)] font-bold">
                The Meat Master
              </span>{" "}
              άνοιξε το 2015 στου Ζωγράφου και πρόκειται για ένα project που έχει κάνει το κρέας σπουδή. Έχουμε πάρει master κι εξειδίκευση στα μυστικά του και ξέρουμε πώς να αξιοποιούμε με τον νοστιμότερο και πιο ευειδή τρόπο και την τελευταία ίνα ενός πολύτιμου σφάγιου.
            </p>
            <p>
              Από τα βοσκοτόπια στο πιο μπουτίκ κρεοπωλείο της περιοχής, τρέφουμε την ίδια αγάπη για το ελευθέρας βοσκής μοσχαράκι και το αμνοερίφιο.
            </p>
            <p>
              Σε εμάς θα βρείτε ελιά και οσομπούκο όπως δεν τα έχετε ξαναφάει, καθώς και εξαιρετικής ποιότητας Black Angus από την Αμερική, την Αργεντινή και την Ουρουγουάη. Στόχος μας είναι να σας προσφέρουμε κρέας που δέχεται συγχαρητήρια σε κάθε τραπέζωμα.
            </p>
          </div>
        </section>

        {/* Feature Cards */}
        <section className="grid md:grid-cols-2 gap-4">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 hover:border-[var(--brand-border)]/50 transition-all duration-300 group hover:shadow-[0_0_20px_rgba(255,147,40,0.05)]"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-black rounded-xl text-[var(--brand-border)] shrink-0 group-hover:bg-[var(--brand-border)] group-hover:text-black transition-colors duration-300 border border-zinc-800">
                  <feature.icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* Quote */}
        <section className="bg-gradient-to-r from-[var(--brand-border)]/10 to-transparent border-l-4 border-[var(--brand-border)] p-6 rounded-r-xl">
          <p className="text-lg text-zinc-200 italic leading-relaxed">
            "Από τα βοσκοτόπια στο πιο μπουτίκ κρεοπωλείο της περιοχής — κρέας που δέχεται συγχαρητήρια σε κάθε τραπέζωμα."
          </p>
        </section>

        <hr className="border-zinc-800" />

        {/* Info Grid */}
        <div className="grid md:grid-cols-2 gap-12">
          {/* Contact */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-white flex items-center gap-3">
              <Store className="w-5 h-5 text-[var(--brand-border)]" />
              Επικοινωνία
            </h3>

            <ul className="space-y-6">
              <li className="flex items-start gap-4 text-zinc-400 group">
                <div className="p-2 bg-zinc-900 rounded-lg border border-zinc-800 group-hover:border-[var(--brand-border)]/50 transition-colors">
                  <MapPin className="w-5 h-5 text-[var(--brand-border)]" />
                </div>
                <div>
                  <p className="font-bold text-white mb-1">
                    The Meat Master
                  </p>
                  <p className="text-sm">
                    Λεωφόρος Στρατάρχου Αλεξάνδρου Παπάγου 80α, Ζωγράφου, 15772, Αθήνα
                  </p>
                </div>
              </li>

              <li className="flex items-center gap-4 text-zinc-400 group">
                <div className="p-2 bg-zinc-900 rounded-lg border border-zinc-800 group-hover:border-[var(--brand-border)]/50 transition-colors">
                  <Phone className="w-5 h-5 text-[var(--brand-border)]" />
                </div>
                <p className="font-medium text-white">21 0748 8000</p>
              </li>

              <li className="flex items-center gap-4 text-zinc-400 group">
                <div className="p-2 bg-zinc-900 rounded-lg border border-zinc-800 group-hover:border-[var(--brand-border)]/50 transition-colors">
                  <Mail className="w-5 h-5 text-[var(--brand-border)]" />
                </div>
                <p className="font-medium text-white break-all">
                  themeatmaster@gmail.com
                </p>
              </li>
            </ul>

            <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 mt-8 hover:border-[var(--brand-hover)] transition-colors shadow-xl">
              <h4 className="text-white font-bold mb-2 flex items-center gap-2">
                <Phone className="w-4 h-4 text-[var(--brand-border)]" />
                Τηλεφωνικές Παραγγελίες
              </h4>
              <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
                Για παραγγελίες και πληροφορίες κοπών, καλέστε μας — θα χαρούμε να σας εξυπηρετήσουμε.
              </p>
              <a
                href="tel:2107488000"
                className="inline-flex items-center justify-center w-full py-4 px-4 rounded-xl bg-[var(--brand-border)] hover:bg-[var(--brand-hover)] text-black hover:text-white font-black transition-all shadow-lg shadow-[var(--brand-border)]/10 hover:scale-[1.02]"
              >
                ΚΑΛΕΣΤΕ ΣΤΟ 210 748 8000
              </a>
            </div>
          </div>

          {/* Delivery & Hours */}
          <div className="space-y-8">
            {/* Delivery Areas */}
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-3 mb-4">
                <Map className="w-5 h-5 text-[var(--brand-border)]" />
                Περιοχές Εξυπηρέτησης
              </h3>

              <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 shadow-inner shadow-black">
                <ul className="columns-2 gap-6">
                  {deliveryAreas.map((area) => (
                    <li
                      key={area}
                      className="break-inside-avoid mb-3 flex items-center gap-2 text-zinc-400 text-sm hover:text-white transition-colors"
                    >
                      <CheckCircle2 className="w-4 h-4 text-[var(--brand-border)]" />
                      <span>{area}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <p className="mt-3 text-xs text-zinc-500">
                *Η κάλυψη ενδέχεται να διαφέρει ανά διεύθυνση.
              </p>
            </div>

            {/* Opening Hours */}
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-3 mb-4">
                <Clock className="w-5 h-5 text-[var(--brand-border)]" />
                Ωράριο Λειτουργίας
              </h3>

              <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
                <div className="space-y-3">
                  {openingHours.map((row, idx) => (
                    <div
                      key={row.days}
                      className={`flex justify-between items-center gap-4 ${idx !== openingHours.length - 1
                          ? "border-b border-zinc-800 pb-3"
                          : ""
                        }`}
                    >
                      <span className="text-zinc-300 font-medium">
                        {row.days}
                      </span>

                      {row.hours === "Κλειστά" ? (
                        <span className="text-zinc-500 font-bold bg-black border border-zinc-800 px-3 py-1 rounded-full text-xs uppercase tracking-wider">
                          {row.hours}
                        </span>
                      ) : (
                        <span className="text-[var(--brand-border)] font-black text-sm text-right">
                          {row.hours}
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                <p className="mt-5 text-xs text-zinc-500">
                  *Το ωράριο ενδέχεται να διαφοροποιείται σε αργίες.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}