"use client";

import { usePathname, useRouter } from "next/navigation";
import { i18n, type Locale } from "@/lib/i18n/config";
import { Globe } from "lucide-react";

interface LanguageSwitcherProps {
  currentLang: Locale;
}

export function LanguageSwitcher({ currentLang }: LanguageSwitcherProps) {
  const pathname = usePathname();
  const router = useRouter();

  const switchLanguage = (newLang: Locale) => {
    if (!pathname) return;

    // Remove current locale from pathname and add new locale
    const segments = pathname.split("/");
    segments[1] = newLang;
    const newPath = segments.join("/");

    router.push(newPath);
  };

  return (
    <div className="relative group">
      <button className="flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:text-primary transition-colors rounded-lg hover:bg-muted">
        <Globe className="w-4 h-4" />
        <span className="uppercase">{currentLang}</span>
      </button>

      {/* Dropdown */}
      <div className="absolute top-full right-0 mt-2 bg-background border border-border rounded-lg shadow-lg min-w-[120px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
        <div className="py-1">
          {i18n.locales.map((locale) => (
            <button
              key={locale}
              onClick={() => switchLanguage(locale)}
              className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                currentLang === locale
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground hover:bg-muted"
              }`}
            >
              {locale === "el" ? "Ελληνικά" : "English"}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
