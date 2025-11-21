"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { MapPin, Clock, User, LogOut, Settings, Heart } from "lucide-react";
import Link from "next/link";

export default function UserPage() {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-white">Redirecting...</div>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">
                {user?.name || user?.email || "User Profile"}
              </h1>
              <p className="text-gray-400">{user?.email}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-4">
          {/* Profile */}
          <Link
            href="/user/profile"
            className="block bg-gray-900 border border-gray-800 rounded-lg p-6 hover:bg-gray-800 transition-colors group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center group-hover:bg-purple-500/30 transition-colors">
                <Settings className="w-6 h-6 text-purple-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white">
                  Προφίλ Χρήστη
                </h3>
                <p className="text-gray-400 text-sm">
                  Επεξεργασία των προσωπικών σας στοιχείων
                </p>
              </div>
              <div className="text-gray-400 group-hover:text-white transition-colors">
                →
              </div>
            </div>
          </Link>


          {/* Address Book */}
          <Link
            href="/address-book"
            className="block bg-gray-900 border border-gray-800 rounded-lg p-6 hover:bg-gray-800 transition-colors group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center group-hover:bg-green-500/30 transition-colors">
                <MapPin className="w-6 h-6 text-green-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white">
                  Βιβλίο Διευθύνσεων
                </h3>
                <p className="text-gray-400 text-sm">
                  Διαχείριση των διευθύνσεων παράδοσης
                </p>
              </div>
              <div className="text-gray-400 group-hover:text-white transition-colors">
                →
              </div>
            </div>
          </Link>

          {/* Order History */}
          <Link
            href="/order-history"
            className="block bg-gray-900 border border-gray-800 rounded-lg p-6 hover:bg-gray-800 transition-colors group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
                <Clock className="w-6 h-6 text-blue-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white">
                  Ιστορικό Παραγγελιών
                </h3>
                <p className="text-gray-400 text-sm">
                  Προβολή των προηγούμενων παραγγελιών σας
                </p>
              </div>
              <div className="text-gray-400 group-hover:text-white transition-colors">
                →
              </div>
            </div>
          </Link>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-full bg-gray-900 border border-gray-800 rounded-lg p-6 hover:bg-gray-800 transition-colors group text-left"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center group-hover:bg-red-500/30 transition-colors">
                <LogOut className="w-6 h-6 text-red-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white">Αποσύνδεση</h3>
                <p className="text-gray-400 text-sm">
                  Αποσύνδεση από τον λογαριασμό σας
                </p>
              </div>
              <div className="text-gray-400 group-hover:text-white transition-colors">
                →
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
