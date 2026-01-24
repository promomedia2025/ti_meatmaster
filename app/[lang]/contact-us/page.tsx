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
    <div className="min-h-screen bg-gray-950 text-gray-200 font-sans selection:bg-amber-500/30">
      
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-6 flex items-center gap-4">
          <Link
            href="/"
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-white"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>

          <div className="w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/20">
            <Phone className="w-6 h-6 text-gray-950" />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Επικοινωνία
            </h1>
            <p className="text-gray-400 text-sm">
              Βρείτε μας στο Χολαργό ή καλέστε μας
            </p>
          </div>
        </div>
      </div>

      <main className="px-4 py-8 md:py-12 relative">
        <div className="max-w-4xl mx-auto flex flex-col gap-8">
          
          {/* --- MAP SECTION --- */}
          <div className="w-full h-[400px] md:h-[450px] rounded-3xl overflow-hidden shadow-2xl shadow-black/50 border border-gray-800 relative group">
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
            
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[85%] flex flex-col items-center z-10">
               <MapPin className="w-12 h-12 text-red-600 fill-red-600 drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)] animate-in fade-in zoom-in duration-500" />
               <div className="w-2 h-2 bg-red-500 rounded-full mt-[-6px] shadow-[0_0_10px_rgba(239,68,68,1)]" />
            </div>

            <a 
              href="https://www.google.com/maps/place/Cocofino+%CE%97+%CE%9D%CE%AD%CE%B1+%CE%93%CE%B5%CF%8D%CF%83%CE%B7+%CE%A3%CF%84%CE%BF+%CE%9A%CE%BF%CF%84%CF%8C%CF%80%CE%BF%CF%85%CE%BB%CE%BF/@38.0051124,23.7909093,17z/data=!3m1!4b1!4m6!3m5!1s0x14a19844372f8c63:0x85d5746e71cd9e81!8m2!3d38.0051083!4d23.7957802!16s%2Fg%2F11b7jc9vpr?entry=ttu&g_ep=EgoyMDI2MDExOS4wIKXMDSoASAFQAw%3D%3D"
              target="_blank" 
              rel="noopener noreferrer"
              className="absolute bottom-6 right-6 bg-amber-500 hover:bg-amber-400 text-gray-950 px-5 py-3 rounded-xl font-bold flex items-center gap-2.5 shadow-xl transition-all hover:scale-105 active:scale-95 z-20 group/btn"
            >
              <Navigation2 className="w-5 h-5 fill-current" />
              <span>Πλοήγηση</span>
            </a>
            <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_60px_rgba(0,0,0,0.8)]" />
          </div>

          {/* --- CONTACT GRID (Original 3 Cards) --- */}
          <div className="grid md:grid-cols-3 gap-4 md:gap-6">
            
            {/* Address */}
            <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800 hover:border-amber-500/50 transition-all duration-300 group flex flex-col items-center text-center gap-4 hover:shadow-[0_0_30px_rgba(245,158,11,0.1)]">
              <div className="p-4 bg-gray-800 rounded-full text-amber-500 group-hover:bg-amber-500 group-hover:text-gray-950 transition-colors duration-300">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Διεύθυνση</h3>
                <p className="text-gray-400 text-sm leading-relaxed">Φανερωμένης 1α,<br/> Χολαργός 155 61</p>
              </div>
            </div>

            {/* Phone */}
            <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800 hover:border-amber-500/50 transition-all duration-300 group flex flex-col items-center text-center gap-4 hover:shadow-[0_0_30px_rgba(245,158,11,0.1)]">
              <div className="p-4 bg-gray-800 rounded-full text-amber-500 group-hover:bg-amber-500 group-hover:text-gray-950 transition-colors duration-300">
                <Phone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Τηλέφωνο</h3>
                <p className="text-gray-400 text-sm">210 6543065</p>
              </div>
            </div>

            {/* Email */}
            <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800 hover:border-amber-500/50 transition-all duration-300 group flex flex-col items-center text-center gap-4 hover:shadow-[0_0_30px_rgba(245,158,11,0.1)]">
              <div className="p-4 bg-gray-800 rounded-full text-amber-500 group-hover:bg-amber-500 group-hover:text-gray-950 transition-colors duration-300">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Email</h3>
                <p className="text-gray-400 text-sm break-all">cocofinowoltdrive@gmail.com</p>
              </div>
            </div>

          </div>

          {/* --- INFO SECTION (Delivery & Hours) --- */}
          <div className="grid md:grid-cols-2 gap-4 md:gap-6">
            
            {/* Delivery Areas Card */}
            <div className="bg-gray-900 p-8 rounded-2xl border border-gray-800 hover:border-amber-500/50 transition-all duration-300 group hover:shadow-[0_0_30px_rgba(245,158,11,0.1)] relative overflow-hidden">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-gray-800 rounded-xl text-amber-500 group-hover:bg-amber-500 group-hover:text-gray-950 transition-colors duration-300">
                  <Map className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white">Περιοχές Παράδοσης</h3>
              </div>
              
              <ul className="grid grid-cols-2 gap-y-3 gap-x-4">
                {deliveryAreas.map((area) => (
                  <li key={area} className="flex items-center gap-2 text-gray-400 group-hover:text-gray-300 transition-colors">
                    <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0" />
                    <span className="text-sm md:text-base">{area}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Opening Hours Card */}
            <div className="bg-gray-900 p-8 rounded-2xl border border-gray-800 hover:border-amber-500/50 transition-all duration-300 group hover:shadow-[0_0_30px_rgba(245,158,11,0.1)] relative overflow-hidden">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-gray-800 rounded-xl text-amber-500 group-hover:bg-amber-500 group-hover:text-gray-950 transition-colors duration-300">
                  <Clock className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white">Ωράριο Λειτουργίας</h3>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-gray-800 pb-3">
                  <span className="text-gray-300 font-medium">Καθημερινά</span>
                  <span className="text-amber-500 font-bold">11:30 π.μ. – 01:30 π.μ.</span>
                </div>
                <div className="flex justify-between items-center pt-1">
                  <span className="text-gray-300 font-medium">Δευτέρα</span>
                  <span className="text-red-400 font-bold bg-red-400/10 px-3 py-1 rounded-full text-sm">
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