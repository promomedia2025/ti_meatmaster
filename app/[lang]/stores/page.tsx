"use client";

import { Navigation } from "@/components/navigation";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";

export default function StoresPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-foreground mb-4">Stores</h1>
        <p className="text-muted-foreground">
          Explore stores and shops for delivery.
        </p>
      </main>
      <MobileBottomNav />
    </div>
  );
}
