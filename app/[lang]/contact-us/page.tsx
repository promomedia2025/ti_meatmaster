"use client";

import Link from "next/link";
import { 
  MapPin, 
  Mail, 
  Phone, 
  ArrowLeft, 
  Navigation2, 
  Clock, 
  Map, 
  CheckCircle2 
} from "lucide-react";

export default function ContactPage() {
  
  const deliveryAreas = [
    "Χολαργός",
    "Παπάγου",
    "Αγία Παρασκευή",
    "Κάτω Χαλάνδρι",
    "Νέο Ψυχικό",
    "Πεντάγωνο"
  ];

  return (
    <div className="min-h-screen bg-black text-zinc-200 font-sans selection:bg-[var(--brand-border)]/30">
      
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
            <Phone className="w-6 h-6 text-[var(--brand-border)]" />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight mb-1">
              Επικοινωνία
            </h1>
            <p className="text-zinc-400 text-sm">
              Βρείτε μας στο Χολαργό ή καλέστε μας
            </p>
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-8 md:py-12 space-y-8">
        
        {/* --- MAP SECTION --- */}
        <div className="w-full h-[400px] md:h-[450px] rounded-3xl overflow-hidden shadow-2xl border border-zinc-800 relative group">
          <iframe
            width="100%"
            height="100%"
            style={{ 
              border: 0, 
              filter: "grayscale(100%) invert(90%) contrast(85%) brightness(80%)",
              pointerEvents: "none" 
            }} 
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            src="https://www.openstreetmap.org/export/embed.html?bbox=23.792,37.998,23.802,38.005&layer=mapnik"
            title="Cocofino Location"
            className="w-full h-full scale-[1.1]" 
          ></iframe>
          
          {/* Animated Map Pin */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[85%] flex flex-col items-center z-10">
             <MapPin className="w-12 h-12 text-[var(--brand-border)] fill-[var(--brand-border)]/20 drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)]" />
             <div className="w-2 h-2 bg-[var(--brand-border)] rounded-full mt-[-6px] shadow-[0_0_15px_var(--brand-border)]" />
          </div>

          {/* Navigation Button */}
          <a 
            href="https://www.google.com/maps/dir/?api=1&destination=Φανερωμένης+1α+Χολαργός"
            target="_blank" 
            rel="noopener noreferrer"
            className="absolute bottom-6 right-6 bg-[var(--brand-border)] hover:bg-[var(--brand-hover)] text-black hover:text-white px-6 py-3 rounded-xl font-black flex items-center gap-2.5 shadow-xl transition-all hover:scale-105 active:scale-95 z-20 group/btn"
          >
            <Navigation2 className="w-5 h-5 fill-current" />
            <span>ΠΛΟΗΓΗΣΗ</span>
          </a>
          <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_80px_rgba(0,0,0,0.6)]" />
        </div>

        {/* --- CONTACT CARDS --- */}
        <div className="grid md:grid-cols-3 gap-4 md:gap-6">
          
          {/* Address */}
          <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 hover:border-[var(--brand-border)]/50 transition-all duration-300 group flex flex-col items-center text-center gap-4">
            <div className="p-4 bg-black rounded-full text-[var(--brand-border)] group-hover:bg-[var(--brand-border)] group-hover:text-black transition-colors duration-300 border border-zinc-800">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-white font-bold mb-1">Διεύθυνση</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">Φανερωμένης 1α,<br/> Χολαργός 155 61</p>
            </div>
          </div>

          {/* Phone */}
          <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 hover:border-[var(--brand-border)]/50 transition-all duration-300 group flex flex-col items-center text-center gap-4">
            <div className="p-4 bg-black rounded-full text-[var(--brand-border)] group-hover:bg-[var(--brand-border)] group-hover:text-black transition-colors duration-300 border border-zinc-800">
              <Phone className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-white font-bold mb-1">Τηλέφωνο</h3>
              <p className="text-zinc-400 text-sm">210 6543065</p>
            </div>
          </div>

          {/* Email */}
          <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 hover:border-[var(--brand-border)]/50 transition-all duration-300 group flex flex-col items-center text-center gap-4">
            <div className="p-4 bg-black rounded-full text-[var(--brand-border)] group-hover:bg-[var(--brand-border)] group-hover:text-black transition-colors duration-300 border border-zinc-800">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-white font-bold mb-1">Email</h3>
              <p className="text-zinc-400 text-sm break-all">cocofinowoltdrive@gmail.com</p>
            </div>
          </div>
        </div>

        {/* --- DELIVERY & HOURS SECTION --- */}
        <div className="grid md:grid-cols-2 gap-6">
          
          {/* Delivery Areas */}
          <div className="bg-zinc-900 p-8 rounded-2xl border border-zinc-800 hover:border-[var(--brand-border)]/30 transition-all group">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-black rounded-xl text-[var(--brand-border)] border border-zinc-800 group-hover:bg-[var(--brand-border)] group-hover:text-black transition-all">
                <Map className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Περιοχές Παράδοσης</h3>
            </div>
            <ul className="grid grid-cols-2 gap-y-4 gap-x-4">
              {deliveryAreas.map((area) => (
                <li key={area} className="flex items-center gap-2 text-zinc-400 group-hover:text-zinc-200 transition-colors">
                  <CheckCircle2 className="w-4 h-4 text-[var(--brand-border)] shrink-0" />
                  <span className="text-sm md:text-base font-medium">{area}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Opening Hours */}
          <div className="bg-zinc-900 p-8 rounded-2xl border border-zinc-800 hover:border-[var(--brand-border)]/30 transition-all group">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-black rounded-xl text-[var(--brand-border)] border border-zinc-800 group-hover:bg-[var(--brand-border)] group-hover:text-black transition-all">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Ωράριο Λειτουργίας</h3>
            </div>
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
                <span className="text-zinc-300 font-medium">Καθημερινά</span>
                <span className="text-[var(--brand-border)] font-black text-sm">11:30 π.μ. – 01:30 π.μ.</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-300 font-medium">Δευτέρα</span>
                <span className="text-zinc-500 font-bold bg-black border border-zinc-800 px-4 py-1 rounded-full text-xs uppercase tracking-widest">
                  Κλειστά
                </span>
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}