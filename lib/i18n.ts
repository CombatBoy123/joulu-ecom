import et from "@/messages/et.json";
import en from "@/messages/en.json";
import { LOCALES, type Locale, type Localized } from "./product-schema";

export { LOCALES, type Locale };
export const DEFAULT_LOCALE: Locale = "et";

export type Messages = typeof et;

// Checking each file against the other's shape makes a missing or misspelt
// key a type error, so the two files cannot drift apart unnoticed.
const messages: Record<Locale, Messages> = { et: et satisfies typeof en, en: en satisfies Messages };

export const LOCALE_NAMES: Record<Locale, string> = { et: "Eesti", en: "English" };

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

export function getMessages(locale: Locale): Messages {
  return messages[locale];
}

/**
 * The text in the visitor's language. Falls back to English, with a build
 * warning, when the Estonian text is missing (PRODUCTS.md, rule 4).
 */
export function pick(text: Localized, locale: Locale, what = "text"): string {
  const own = text[locale];
  if (own) return own;
  const other = text.en ?? text.et ?? "";
  if (other) console.warn(`[i18n] ${what}: no "${locale}" text, showing another language`);
  return other;
}

export function categoryName(slug: string, m: Messages): string {
  return (m.categories as Record<string, string>)[slug] ?? slug;
}

/** 990 -> "9,90 €" (et) / "€9.90" (en) */
export function formatPrice(cents: number, locale: Locale): string {
  return new Intl.NumberFormat(locale === "et" ? "et-EE" : "en-IE", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

/** fill("Delivery in {min}–{max} days", { min: 3, max: 7 }) */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (whole, key: string) =>
    key in values ? String(values[key]) : whole,
  );
}

/** "10. detsember" (et) / "10 December" (en), always in Estonian time. */
export function formatDayMonth(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === "et" ? "et-EE" : "en-GB", {
    day: "numeric",
    month: "long",
    timeZone: "Europe/Tallinn",
  }).format(new Date(iso));
}
