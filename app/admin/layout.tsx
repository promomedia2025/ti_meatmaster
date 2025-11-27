"use client";

import { PusherProvider } from "@/lib/pusher-context";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PusherProvider>{children}</PusherProvider>;
}

