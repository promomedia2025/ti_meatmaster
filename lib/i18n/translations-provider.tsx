"use client";

import { createContext, useContext } from "react";
import { type Locale } from "./config";

interface TranslationsContextType {
  dict: any;
  lang: Locale;
}

const TranslationsContext = createContext<TranslationsContextType | undefined>(
  undefined
);

export function TranslationsProvider({
  children,
  dict,
  lang,
}: {
  children: React.ReactNode;
  dict: any;
  lang: Locale;
}) {
  return (
    <TranslationsContext.Provider value={{ dict, lang }}>
      {children}
    </TranslationsContext.Provider>
  );
}

export function useTranslations() {
  const context = useContext(TranslationsContext);
  if (!context) {
    throw new Error(
      "useTranslations must be used within a TranslationsProvider"
    );
  }
  return context;
}
