"use client";

import { Navigation } from "@/components/navigation";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";

export default function DiscoveryPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-foreground mb-4">Discovery</h1>
        <p className="text-muted-foreground">
          Discover new restaurants and food options near you.
        </p>
      </main>
      <MobileBottomNav />
    </div>
  );
}
