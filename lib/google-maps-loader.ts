"use client";

import { Loader } from "@googlemaps/js-api-loader";

let loaderPromise: Promise<void> | null = null;
let initializedLanguage: string | null = null;

export async function loadGoogleMaps(language: string = "el"): Promise<void> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey || apiKey === "your_google_api_key_here") {
    throw new Error("Google Maps API key not configured");
  }

  // If already initialized, do not reinitialize with different options
  if (loaderPromise) {
    if (initializedLanguage && initializedLanguage !== language) {
      // We cannot reload the Google Maps script with different options at runtime
      // so we keep the first-loaded language and proceed to avoid crashes.
      if (typeof window !== "undefined") {
        console.warn(
          "Google Maps already initialized with language",
          initializedLanguage,
          "- requested:",
          language,
          "(keeping existing to avoid reloading script)"
        );
      }
    }
    return loaderPromise;
  }

  const loader = new Loader({
    apiKey,
    version: "weekly",
    libraries: ["places"],
    language,
    region: "GR",
  });

  initializedLanguage = language;
  loaderPromise = loader.load();
  return loaderPromise;
}




















