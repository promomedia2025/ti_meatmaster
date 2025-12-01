"use client";

import { useState } from "react";
import { Menu, X, Printer } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AdminPrinterOptionsSidebar } from "./admin-printer-options-sidebar";

export function AdminSidebar() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isPrinterOptionsOpen, setIsPrinterOptionsOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <>
      {/* Hamburger Menu Button - Mobile Only */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsSidebarOpen(true)}
        className="fixed top-4 left-4 z-30 text-white hover:bg-[#2a2a2a] lg:hidden"
      >
        <Menu className="w-6 h-6" />
      </Button>

      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 h-full bg-[#2a2a2a] border-r border-gray-700 z-50 transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } w-64 lg:translate-x-0`}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <h2 className="text-xl font-bold text-white">Admin Menu</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(false)}
              className="text-white hover:bg-[#3a3a3a] lg:hidden"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Sidebar Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            <Link
              href="/admin"
              onClick={() => setIsSidebarOpen(false)}
              className={`block w-full text-left px-4 py-3 rounded-lg transition-colors ${
                isActive("/admin")
                  ? "bg-[#ff9328ff] text-white"
                  : "text-white hover:bg-[#3a3a3a]"
              }`}
            >
              Dashboard
            </Link>
            <Link
              href="/admin/orders"
              onClick={() => setIsSidebarOpen(false)}
              className={`block w-full text-left px-4 py-3 rounded-lg transition-colors ${
                isActive("/admin/orders")
                  ? "bg-[#ff9328ff] text-white"
                  : "text-white hover:bg-[#3a3a3a]"
              }`}
            >
              Παραγγελιες
            </Link>
            <Link
              href="/admin/menu"
              onClick={() => setIsSidebarOpen(false)}
              className={`block w-full text-left px-4 py-3 rounded-lg transition-colors ${
                isActive("/admin/menu")
                  ? "bg-[#ff9328ff] text-white"
                  : "text-white hover:bg-[#3a3a3a]"
              }`}
            >
              Menu
            </Link>
            <button
              onClick={() => {
                setIsSidebarOpen(false);
                // Handle Order History navigation
              }}
              className="w-full text-left px-4 py-3 rounded-lg text-white hover:bg-[#3a3a3a] transition-colors"
            >
              Ιστορικο παραγγελιων
            </button>
            <Link
              href="/admin/intervals"
              onClick={() => setIsSidebarOpen(false)}
              className={`block w-full text-left px-4 py-3 rounded-lg transition-colors ${
                isActive("/admin/intervals")
                  ? "bg-[#ff9328ff] text-white"
                  : "text-white hover:bg-[#3a3a3a]"
              }`}
            >
              Χρονος παραγγελιας
            </Link>
            <button
              onClick={() => {
                setIsSidebarOpen(false);
                setIsPrinterOptionsOpen(true);
              }}
              className="w-full text-left px-4 py-3 rounded-lg text-white hover:bg-[#3a3a3a] transition-colors flex items-center gap-2"
            >
              <Printer className="w-5 h-5" />
              Επιλογες εκτυπωτη
            </button>
          </nav>
        </div>
      </div>

      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Printer Options Sidebar */}
      <AdminPrinterOptionsSidebar
        isOpen={isPrinterOptionsOpen}
        onClose={() => setIsPrinterOptionsOpen(false)}
      />
    </>
  );
}
