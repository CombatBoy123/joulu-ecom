import type { Locale } from "./product-schema.ts";

// Every internal URL is built and recognised here. Path words are translated;
// a product's slug is the Estonian one in both languages (see PRODUCTS.md).

/** Pages with a slug after the path word. */
const SECTIONS = {
  product: { et: "tooted", en: "products" },
  category: { et: "kategooria", en: "category" },
} as const;

/** Single pages. */
const PAGES = {
  cart: { et: "ostukorv", en: "cart" },
  order: { et: "tellimus", en: "order" },
} as const;

/** Legal and customer-information pages, under /<lang>/info/. */
const INFO = "info";
export const LEGAL_PAGES = {
  terms: { et: "muugitingimused", en: "terms" },
  privacy: { et: "privaatsus", en: "privacy" },
  cookies: { et: "kupsised", en: "cookies" },
  returns: { et: "tagastamine", en: "returns" },
  shipping: { et: "tarne", en: "shipping" },
  contact: { et: "kontakt", en: "contact" },
} as const;
export type LegalPageId = keyof typeof LEGAL_PAGES;
export const LEGAL_PAGE_IDS = Object.keys(LEGAL_PAGES) as LegalPageId[];

export type Page =
  | { kind: "home" }
  | { kind: "product"; slug: string }
  | { kind: "category"; slug: string }
  | { kind: "cart" }
  | { kind: "order" }
  | { kind: "legal"; id: LegalPageId };

/** The path of a page without the language: ["products", "x"]. */
export function pagePath(locale: Locale, page: Page): string[] {
  switch (page.kind) {
    case "home":
      return [];
    case "product":
    case "category":
      return [SECTIONS[page.kind][locale], page.slug];
    case "cart":
    case "order":
      return [PAGES[page.kind][locale]];
    case "legal":
      return [INFO, LEGAL_PAGES[page.id][locale]];
  }
}

/** Which page a URL means: ("en", ["products", "x"]) -> product x. null = no such page. */
export function resolvePath(locale: Locale, path: readonly string[] = []): Page | null {
  const [first, second, ...extra] = path;
  if (first === undefined) return { kind: "home" };
  if (extra.length > 0) return null;

  if (second === undefined) {
    if (first === PAGES.cart[locale]) return { kind: "cart" };
    if (first === PAGES.order[locale]) return { kind: "order" };
    return null;
  }
  if (first === SECTIONS.product[locale]) return { kind: "product", slug: second };
  if (first === SECTIONS.category[locale]) return { kind: "category", slug: second };
  if (first === INFO) {
    const id = LEGAL_PAGE_IDS.find((key) => LEGAL_PAGES[key][locale] === second);
    return id ? { kind: "legal", id } : null;
  }
  return null;
}

const url = (locale: Locale, page: Page) => ["", locale, ...pagePath(locale, page), ""].join("/");

export const routes = {
  home: (locale: Locale) => url(locale, { kind: "home" }),
  product: (locale: Locale, slug: string) => url(locale, { kind: "product", slug }),
  category: (locale: Locale, slug: string) => url(locale, { kind: "category", slug }),
  cart: (locale: Locale) => url(locale, { kind: "cart" }),
  order: (locale: Locale) => url(locale, { kind: "order" }),
  legal: (locale: Locale, id: LegalPageId) => url(locale, { kind: "legal", id }),
};

/** The same page in another language: /et/tooted/x/ -> /en/products/x/ */
export function switchLocalePath(pathname: string, target: Locale): string {
  const [current, ...path] = pathname.split("/").filter(Boolean);
  const page = current === "et" || current === "en" ? resolvePath(current, path) : null;
  return url(target, page ?? { kind: "home" });
}
