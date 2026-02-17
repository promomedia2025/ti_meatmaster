"use client";

import { usePathname } from "next/navigation";
import { Footer } from "@/components/footer"; // Import your existing Footer
import type { Locale } from "@/lib/i18n/config"; // Import types if needed

type Props = {
    lang: Locale;
    dict: any;
};

export function FooterWrapper({ lang, dict }: Props) {
    const pathname = usePathname();

    // Check if current path is exactly the home page (e.g., "/el" or "/en")
    // We compare against `/${lang}` because your layout is localized.
    const isHomePage = pathname === `/${lang}`;

    return (
        // Logic:
        // If Home Page: class is "" (Visible everywhere)
        // If NOT Home: class is "hidden md:block" (Hidden on mobile, Visible on desktop)
        <div className={isHomePage ? "" : "hidden md:block"}>
            <Footer lang={lang} dict={dict} />
        </div>
    );
}