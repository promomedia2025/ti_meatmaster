"use client";

import { PusherProvider } from "@/lib/pusher-context";
import { AdminSidebar } from "@/components/admin-sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PusherProvider>
      <div className="min-h-screen bg-[#1a1a1a] flex">
        <AdminSidebar />
        <div className="flex-1 lg:ml-64">
          {children}
        </div>
      </div>
    </PusherProvider>
  );
}

