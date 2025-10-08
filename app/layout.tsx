import type React from "react";
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Analytics } from "@vercel/analytics/next";
import { Suspense } from "react";
import { AuthProvider } from "@/lib/auth-context";
import { PusherProvider } from "@/lib/pusher-context";
import { CartProvider } from "@/lib/cart-context";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wolt - Παράδοση φαγητού",
  description: "Παραγγείλετε φαγητό από τα αγαπημένα σας εστιατόρια",
  generator: "v0.app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="el" className="dark">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <AuthProvider>
          <PusherProvider>
            <CartProvider>
              <Header />
              <Suspense fallback={null}>{children}</Suspense>
              <Footer />
              <Analytics />
              <Toaster position="top-right" richColors />
            </CartProvider>
          </PusherProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
