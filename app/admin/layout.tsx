"use client";

import { PusherProvider } from "@/lib/pusher-context";
import { AdminSidebar } from "@/components/admin-sidebar";
import { AdminGlobalNotifications } from "@/components/admin-global-notifications";
import { useAdminAuth } from "@/lib/admin-auth";
import { usePathname } from "next/navigation";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/admin/login";
  const { isAuthenticated, isLoading, isExpired } = useAdminAuth();

  // Show loading state while checking auth (except on login page)
  if (!isLoginPage && isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1a1a1a]">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  // On login page, always show content
  if (isLoginPage) {
    return <>{children}</>;
  }

  // If not authenticated and not on login page, don't show content
  // (the hook will redirect)
  if (!isAuthenticated) {
    return null;
  }

  // Authenticated - show full layout
  return (
    <PusherProvider>
      <AdminGlobalNotifications />
      <div className="min-h-screen bg-[#1a1a1a] flex">
        <AdminSidebar />
        <div className="flex-1 lg:ml-64">{children}</div>
      </div>
    </PusherProvider>
  );
}
