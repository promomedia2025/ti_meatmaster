import { i18n, type Locale } from "./config";

export function isValidLocale(locale: string): locale is Locale {
  return i18n.locales.includes(locale as Locale);
}

export function getValidLocale(locale: string): Locale {
  return isValidLocale(locale) ? locale : i18n.defaultLocale;
}
