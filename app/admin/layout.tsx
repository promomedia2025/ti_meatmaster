"use client";

import { useState, useEffect } from "react";
import { PusherProvider } from "@/lib/pusher-context";
import { AdminSidebar } from "@/components/admin-sidebar";
import { AdminGlobalNotifications } from "@/components/admin-global-notifications";
import { useAdminAuth } from "@/lib/admin-auth";
import { usePathname } from "next/navigation";
import { isElectron } from "@/lib/electron-utils";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/admin/login";
  const { isAuthenticated, isLoading } = useAdminAuth();
  const [runningInElectron, setRunningInElectron] = useState(false);

  useEffect(() => {
    setRunningInElectron(isElectron());
  }, []);

  // When running inside Electron, push toggle-all-schedules config (URL + locationId)
  // into the main process via window.electron.setToggleConfig.
  useEffect(() => {
    if (typeof window === "undefined") return;

    const anyWindow = window as any;
    const electronBridge = anyWindow.electron;

    if (
      !electronBridge ||
      typeof electronBridge.setToggleConfig !== "function"
    ) {
      // Not in Electron or bridge not wired; nothing to do.
      return;
    }

    const baseApiUrl = process.env.NEXT_PUBLIC_API_URL;
    const rawLocationId = process.env.NEXT_PUBLIC_LOCATION_ID;
    const locationId = rawLocationId ? Number(rawLocationId) : undefined;

    if (!baseApiUrl) {
      console.warn(
        "[AdminLayout] NEXT_PUBLIC_API_URL is not set; skipping Electron toggle config setup.",
      );
      return;
    }

    if (!locationId || Number.isNaN(locationId)) {
      console.warn(
        "[AdminLayout] NEXT_PUBLIC_LOCATION_ID is not set or invalid; skipping Electron toggle config setup.",
      );
      return;
    }

    const url = `${baseApiUrl}/admin/helloworld/toggle-all-schedules`;

    console.log("[AdminLayout] Setting Electron toggle config:", {
      url,
      locationId,
    });

    void electronBridge
      .setToggleConfig(url, locationId)
      .then((result: any) => {
        console.log("[AdminLayout] Electron toggle config result:", result);
      })
      .catch((error: any) => {
        console.warn(
          "[AdminLayout] Failed to set Electron toggle config:",
          error,
        );
      });
  }, []);

  const content =
    !isLoginPage && isLoading ? (
      <div className="min-h-screen flex items-center justify-center bg-[#1a1a1a]">
        <div className="text-white">Loading...</div>
      </div>
    ) : isLoginPage ? (
      <>{children}</>
    ) : !isAuthenticated ? null : (
      <div className="min-h-screen bg-[#1a1a1a] flex">
        <AdminSidebar />
        <div className="flex-1 lg:ml-64">{children}</div>
      </div>
    );

  // Only in Electron: keep Pusher + admin.orders subscription mounted for all admin routes
  // (including login) so logout doesn't drop the subscription and trigger store-close automation.
  // In the browser: only subscribe when authenticated so randos can't stay on the channel.
  if (runningInElectron) {
    return (
      <PusherProvider>
        <AdminGlobalNotifications />
        {content}
      </PusherProvider>
    );
  }

  // Browser: subscription only when authenticated
  if (isLoginPage) {
    return <>{children}</>;
  }
  if (!isAuthenticated) {
    return null;
  }
  return (
    <PusherProvider>
      <AdminGlobalNotifications />
      {content}
    </PusherProvider>
  );
}
