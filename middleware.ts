import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { i18n } from "./lib/i18n/config";

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Skip locale redirect for admin routes
  if (pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  // Check if there is any supported locale in the pathname
  const pathnameIsMissingLocale = i18n.locales.every(
    (locale) => !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`
  );

  // Redirect if there is no locale
  if (pathnameIsMissingLocale) {
    // Default to Greek locale
    const locale = i18n.defaultLocale;

    // Preserve query parameters when redirecting
    const searchParams = request.nextUrl.searchParams.toString();
    const newPath = `/${locale}${
      pathname.startsWith("/") ? "" : "/"
    }${pathname}`;
    const newUrl = new URL(newPath, request.url);

    // Add search params if they exist
    if (searchParams) {
      newUrl.search = searchParams;
    }

    return NextResponse.redirect(newUrl);
  }
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.svg|.*\\.gif|.*\\.webp|.*\\.mp4|.*\\.webm|.*\\.mov|.*\\.ogg|.*\\.mp3|.*\\.wav).*)",
  ],
};