import { enUS, es, fr, pt, ar as arSA } from "date-fns/locale";
import type { Locale as DateFnsLocale } from "date-fns";

// Swahili has no dedicated date-fns locale pack as of date-fns v3;
// we fall back to enUS formatting rules for sw (month/day names are
// pulled from the sw translation strings elsewhere in the app, this
// only governs numeric layout/ordering).
export const SUPPORTED_LANGUAGES = ["en", "es", "fr", "sw", "pt", "ar"] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const RTL_LANGUAGES: SupportedLanguage[] = ["ar"];

export function isRTL(lang: string): boolean {
  return RTL_LANGUAGES.includes(lang as SupportedLanguage);
}

// BCP-47 tags used for Intl.NumberFormat / Intl.DateTimeFormat
const INTL_LOCALE_MAP: Record<SupportedLanguage, string> = {
  en: "en-US",
  es: "es-ES",
  fr: "fr-FR",
  sw: "sw-KE",
  pt: "pt-PT",
  ar: "ar-SA",
};

// date-fns Locale objects for use with format(), formatDistance(), etc.
const DATE_FNS_LOCALE_MAP: Record<SupportedLanguage, DateFnsLocale> = {
  en: enUS,
  es: es,
  fr: fr,
  sw: enUS,
  pt: pt,
  ar: arSA,
};

export function getIntlLocale(lang: string): string {
  return INTL_LOCALE_MAP[lang as SupportedLanguage] ?? "en-US";
}

export function getDateFnsLocale(lang: string): DateFnsLocale {
  return DATE_FNS_LOCALE_MAP[lang as SupportedLanguage] ?? enUS;
}

/**
 * Format a numeric amount per-locale. Currency code is passed separately
 * since on-chain assets (XLM, USDC, EURC, ...) aren't ISO-4217 currencies;
 * for those we format as a decimal and append the asset code ourselves.
 */
export function formatAmount(
  amount: number,
  lang: string,
  options?: { currencyCode?: string; maximumFractionDigits?: number },
): string {
  const locale = getIntlLocale(lang);
  const { currencyCode, maximumFractionDigits = 7 } = options ?? {};

  if (currencyCode && ["USD", "EUR", "GBP", "KES", "NGN"].includes(currencyCode)) {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currencyCode,
    }).format(amount);
  }

  return new Intl.NumberFormat(locale, {
    maximumFractionDigits,
  }).format(amount);
}

export function formatDate(
  date: Date | number | string,
  lang: string,
  options?: Intl.DateTimeFormatOptions,
): string {
  const locale = getIntlLocale(lang);
  const d = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
    ...options,
  }).format(d);
}