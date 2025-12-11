import type React from "react";
import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { Suspense } from "react";
import { AuthProvider } from "@/lib/auth-context";
import { PusherProvider } from "@/lib/pusher-context";
import { ServerCartProvider } from "@/lib/server-cart-context";
import { LocationProvider } from "@/lib/location-context";
import { DeliveryAvailabilityProvider } from "@/lib/delivery-availability-context";
import { TranslationsProvider } from "@/lib/i18n/translations-provider";
import { CartSidebarProvider } from "@/lib/cart-sidebar-context";
import { Footer } from "@/components/footer";
import { Toaster } from "sonner";
import { WoltNavbar } from "@/components/ui/woltcopies/woltnavbar";
import { i18n, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";

export async function generateStaticParams() {
  return i18n.locales.map((locale) => ({ lang: locale }));
}

export const metadata: Metadata = {
  title: "Σπιτικό - Αθήνα - Online Delivery",
  description: "Παραγγείλετε φαγητό από τα αγαπημένα σας εστιατόρια",
  generator: "v0.app",
};

export default async function LangLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: { lang: Locale };
}>) {
  const dict = await getDictionary(params.lang);

  return (
    <div
      lang={params.lang}
      className="pb-16 md:pb-0 notranslate"
      translate="no"
    >
      <TranslationsProvider dict={dict} lang={params.lang}>
        <AuthProvider>
          <LocationProvider>
            <DeliveryAvailabilityProvider>
              <PusherProvider>
                <ServerCartProvider>
                  <CartSidebarProvider>
                    <WoltNavbar lang={params.lang} dict={dict} />
                    <Suspense fallback={null}>{children}</Suspense>
                    <Footer lang={params.lang} dict={dict} />
                    <Analytics />
                    <Toaster position="top-right" richColors />
                  </CartSidebarProvider>
                </ServerCartProvider>
              </PusherProvider>
            </DeliveryAvailabilityProvider>
          </LocationProvider>
        </AuthProvider>
      </TranslationsProvider>
    </div>
  );
}
