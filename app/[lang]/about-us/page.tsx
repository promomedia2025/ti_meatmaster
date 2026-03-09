"use client";

import Link from "next/link";
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
  ChefHat,
} from "lucide-react";

export default function AboutUsPage() {
  const deliveryAreas = [
    "Κορυδαλλός",
    "Νίκαια",
    "Κερατσίνι",
    "Δραπετσώνα",
    "Κάτω Αιγάλεω"
  ];

  const openingHours = [
    { days: "Δευτέρα", hours: "Κλειστά" },
    { days: "Τρίτη, Τετάρτη & Πέμπτη", hours: "4:00 μ.μ. – 12:00 π.μ." },
    { days: "Παρασκευή, Σάββατο & Κυριακή", hours: "12:00 μ.μ. – 12:00 π.μ." },
  ];

  const features = [
    {
      icon: UtensilsCrossed,
      title: "Αυθεντική Ιταλική Γεύση",
      desc: "Πίτσες Trattoria με ισορροπημένες γεύσεις, προσεγμένα υλικά και σωστή τεχνική.",
    },
    {
      icon: ChefHat,
      title: "Ζύμη που ξεχωρίζει",
      desc: "Καθημερινή προετοιμασία και σωστή ωρίμανση για ελαφριά, τραγανή βάση και πλούσιο άρωμα.",
    },
    {
      icon: Award,
      title: "Ποιότητα σε κάθε επιλογή",
      desc: "Επιλέγουμε υλικά που “δένουν” σωστά μεταξύ τους, για γεύση που μένει σταθερή κάθε φορά.",
    },
    {
      icon: Bike,
      title: "Delivery με συνέπεια",
      desc: "Online παραγγελίες και γρήγορη εξυπηρέτηση στις γύρω περιοχές, με προσοχή στη συσκευασία.",
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
              Λίγα λόγια για την Perfetta Pizza Trattoria
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
              Η{" "}
              <span className="text-[var(--brand-border)] font-bold">
                Perfetta Pizza Trattoria
              </span>{" "}
              δημιουργήθηκε με έναν απλό στόχο: να προσφέρει αυθεντική ιταλική
              πίτσα και ποιοτικές γεύσεις, φτιαγμένες με αγνά υλικά και σωστή
              τεχνική.
            </p>
            <p>
              Δίνουμε ιδιαίτερη σημασία στη ζύμη μας — προετοιμάζεται καθημερινά
              και ωριμάζει σωστά ώστε να είναι ελαφριά, τραγανή και γευστική. Οι
              σάλτσες, τα τυριά και τα υπόλοιπα υλικά επιλέγονται προσεκτικά, για
              να δίνουν ισορροπία και σταθερή ποιότητα σε κάθε παραγγελία.
            </p>
            <p>
              Είτε μας επισκεφθείτε στο κατάστημα, είτε παραγγείλετε online,
              φροντίζουμε κάθε γεύμα να φτάνει όπως πρέπει: ζεστό, προσεγμένο και
              με το “Perfetta” αποτέλεσμα.
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
            "Στην Perfetta Pizza Trattoria η πίτσα δεν είναι απλώς ένα γεύμα —
            είναι εμπειρία."
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
                    Perfetta Pizza Trattoria
                  </p>
                  <p className="text-sm">
                    {/* ΒΑΛΕ ΕΔΩ ΤΗΝ ΠΡΑΓΜΑΤΙΚΗ ΔΙΕΥΘΥΝΣΗ */}
                    Φιλικής Εταιρείας 13, Κορυδαλλός, 18120, Αττική
                  </p>
                </div>
              </li>

              <li className="flex items-center gap-4 text-zinc-400 group">
                <div className="p-2 bg-zinc-900 rounded-lg border border-zinc-800 group-hover:border-[var(--brand-border)]/50 transition-colors">
                  <Phone className="w-5 h-5 text-[var(--brand-border)]" />
                </div>
                <p className="font-medium text-white">210 4952489</p>
              </li>

              <li className="flex items-center gap-4 text-zinc-400 group">
                <div className="p-2 bg-zinc-900 rounded-lg border border-zinc-800 group-hover:border-[var(--brand-border)]/50 transition-colors">
                  <Mail className="w-5 h-5 text-[var(--brand-border)]" />
                </div>
                <p className="font-medium text-white break-all">
                  perfetta@gmail.com
                </p>
              </li>
            </ul>

            <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 mt-8 hover:border-[var(--brand-hover)] transition-colors shadow-xl">
              <h4 className="text-white font-bold mb-2 flex items-center gap-2">
                <Phone className="w-4 h-4 text-[var(--brand-border)]" />
                Τηλεφωνικές Παραγγελίες
              </h4>
              <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
                Για παραγγελίες και πληροφορίες, καλέστε μας — θα χαρούμε να σας
                εξυπηρετήσουμε.
              </p>
              <a
                href="tel:2104952489"
                className="inline-flex items-center justify-center w-full py-4 px-4 rounded-xl bg-[var(--brand-border)] hover:bg-[var(--brand-hover)] text-black hover:text-white font-black transition-all shadow-lg shadow-[var(--brand-border)]/10 hover:scale-[1.02]"
              >
                ΚΑΛΕΣΤΕ ΣΤΟ 210 4952489
              </a>
            </div>
          </div>

          {/* Delivery & Hours */}
          <div className="space-y-8">
            {/* Delivery Areas */}
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-3 mb-4">
                <Map className="w-5 h-5 text-[var(--brand-border)]" />
                Περιοχές Παράδοσης
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
