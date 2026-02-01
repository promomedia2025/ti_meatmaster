"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { MapPin, Clock, LogOut, Settings, Heart } from "lucide-react";
import Link from "next/link";

export default function UserPage() {
  const { user, isAuthenticated, logout, isLoading } = useAuth() as any;
  const router = useRouter();

  // --- Helper Logic for Name & Initials ---
  const getFullName = () => {
    if (!user) return "Προφίλ Χρήστη";
    if (user.first_name || user.last_name) {
      return `${user.first_name || ""} ${user.last_name || ""}`.trim();
    }
    return user.name || user.email || "Προφίλ Χρήστη";
  };

  const getInitials = () => {
    if (!user) return "U";
    const first = user.first_name?.charAt(0) || "";
    const last = user.last_name?.charAt(0) || "";
    if (first || last) return (first + last).toUpperCase();
    const fallback = user.name || user.email || "";
    return fallback.charAt(0).toUpperCase() || "U";
  };

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || (!user && isAuthenticated !== false)) {
    return <div className="min-h-screen bg-black" />;
  }

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const renderMenuItem = (
    href: string | null,
    title: string,
    description: string,
    icon: React.ReactNode,
    onClick?: () => void
  ) => {
    const content = (
      <div className="flex items-center gap-4">
        {/* ICON: Using Brand Orange #ff9328 */}
        <div className="w-12 h-12 rounded-xl bg-[#ff9328]/10 flex items-center justify-center text-[#ff9328] group-hover:bg-[#ff9328] group-hover:text-white transition-all duration-300">
          {icon}
        </div>
        
        <div className="flex-1">
          <h3 className="text-lg font-bold text-white group-hover:text-[#ff9328] transition-colors">
            {title}
          </h3>
          <p className="text-zinc-500 text-sm group-hover:text-zinc-400 transition-colors">
            {description}
          </p>
        </div>
        
        <div className="text-zinc-600 group-hover:text-[#ff9328] transition-colors transform group-hover:translate-x-1 duration-200">
          →
        </div>
      </div>
    );

    const baseClasses = "block w-full text-left bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-[#ff9328]/30 hover:bg-zinc-800 transition-all duration-200 group";

    return href ? (
      <Link href={href} className={baseClasses}>{content}</Link>
    ) : (
      <button onClick={onClick} className={baseClasses}>{content}</button>
    );
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="bg-zinc-900 border-b border-zinc-800">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center gap-6">
            {/* Avatar Circle: Brand Orange Background */}
            <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center border-4 border-black shadow-xl shrink-0">
              <span className="text-3xl font-bold text-white tracking-wider">
                {getInitials()}
              </span>
            </div>
            
            <div className="overflow-hidden">
              <h1 className="text-3xl font-bold text-white truncate mb-1">
                {getFullName()}
              </h1>
              <p className="text-zinc-400 truncate">{user?.email}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="space-y-4">
          {renderMenuItem(
            "/user/profile",
            "Προφίλ Χρήστη", 
            "Επεξεργασία των προσωπικών σας στοιχείων",
            <Settings className="w-6 h-6" />
          )}

          {renderMenuItem(
            "/address-book",
            "Βιβλίο Διευθύνσεων",
            "Διαχείριση των διευθύνσεων παράδοσης",
            <MapPin className="w-6 h-6" />
          )}

          {renderMenuItem(
            "/order-history",
            "Ιστορικό Παραγγελιών",
            "Προβολή των προηγούμενων παραγγελιών σας",
            <Clock className="w-6 h-6" />
          )}

          {renderMenuItem(
            null,
            "Αποσύνδεση",
            "Αποσύνδεση από τον λογαριασμό σας",
            <LogOut className="w-6 h-6" />,
            handleLogout
          )}
        </div>
      </div>
    </div>
  );
}