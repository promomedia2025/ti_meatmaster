"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type Locale } from "./config";

interface LocalizedLinkProps extends React.ComponentProps<typeof Link> {
  locale?: Locale;
}

export function LocalizedLink({ href, locale, ...props }: LocalizedLinkProps) {
  const pathname = usePathname();
  const currentLocale = pathname?.split("/")[1] as Locale;
  const targetLocale = locale || currentLocale;

  // Ensure href is a string for manipulation
  const hrefString = typeof href === "string" ? href : href.pathname || "/";

  // Add locale prefix if not already present
  const localizedHref = hrefString.startsWith(`/${targetLocale}`)
    ? hrefString
    : `/${targetLocale}${hrefString}`;

  return <Link href={localizedHref} {...props} />;
}
