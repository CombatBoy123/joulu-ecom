// Shape of products.json (see PRODUCTS.md) and the checks that guard it.
//
// This file has no imports on purpose: the build uses it, and the tests and
// scripts/validate-products.ts run it directly under Node.

export const LOCALES = ["et", "en"] as const;
export type Locale = (typeof LOCALES)[number];

/** Text in every language of the shop. null = not written yet. */
export type Localized = Record<Locale, string | null>;

export type ProductStatus = "active" | "draft" | "blocked";

/** A fact about the product: translated text, or null while unconfirmed.
 *  A plain string is accepted in drafts but must be translated before sale. */
export type SpecText = string | Localized | null;

export interface Variant {
  id: string;
  name: Localized;
  /** The option to pick on the supplier's listing. Internal. */
  supplierVariantName: string | null;
  sku: string | null;
}

export interface Product {
  id: string;
  /** Estonian slug, used in the URL in both languages. */
  slug: string;
  /** Only "active" is sold. "blocked" must never be public. */
  status: ProductStatus;
  category: string;
  name: Localized;
  shortDescription: Localized;
  description: Localized;
  /** EUR, VAT included. */
  price: number;
  /** Stays null until there is a real 30-day price history (EU Omnibus rule). */
  compareAtPrice: number | null;
  variants: Variant[];
  /** The shop's own images, as paths under public/. */
  images: string[];
  /**
   * A stand-in picture for a product that has no photo yet, e.g. an
   * AI-generated mood image. Always shown with an "illustrative image"
   * label, never counts as a product photo, and is ignored once `images`
   * has a real one. An active product still needs a real photo.
   */
  illustration?: string;
  /** Supplier listing photos, for reference only. Never shown or hot-linked. */
  supplierImages: string[];
  specs: { material: SpecText; dimensions: SpecText; weightG: number | null };
  /** What is in the box, e.g. "6 ornaments". Optional. */
  packContents?: Localized;
  /** Washing / care instructions. Optional. */
  care?: Localized;
  /** "sold-out" keeps the product visible but not buyable. Default: available. */
  availability?: "available" | "sold-out";
  /** Search-engine title and description. Default: name and short description. */
  seo?: { title: Localized; description: Localized };
  /** Internal only: never rendered, never sent to the browser. */
  supplier: {
    name: string | null;
    url: string | null;
    productTitle: string | null;
    unitCostEUR: number | null;
    shippingCostEUR: number | null;
    /** Two-letter country code the order ships from, e.g. "DE" or "CN". */
    warehouse: string | null;
    processing: string | null;
    /** Working days to Estonia: a number, or { min, max }. */
    deliveryEstimateDaysEE: number | { min: number; max: number } | null;
    returns: string | null;
    notes: string | null;
  };
  /** Product safety information (EU General Product Safety Regulation). */
  safety: {
    manufacturerName: string | null;
    manufacturerAddress: string | null;
    euResponsiblePersonName: string | null;
    euResponsiblePersonAddress: string | null;
    productIdentifier: string | null;
    warnings: Localized;
    certifications: string[];
  };
  tags: string[];
}

export interface CatalogMeta {
  version: number;
  currency: "EUR";
  pricesIncludeVAT: true;
  vatRateEE: number;
  /** Last order day (Estonian time) for delivery before Christmas. */
  christmasCutoff: { chinaDirect: string; euWarehouse: string };
}

export interface Catalog {
  _meta: CatalogMeta;
  products: Product[];
}

// ---- Derived values ----

const EU_COUNTRIES = new Set(
  "AT BE BG HR CY CZ DK EE FI FR DE GR HU IE IT LV LT LU MT NL PL PT RO SK SI ES SE".split(" "),
);

/** A spec in the visitor's language; null when there is nothing to show. */
export function specText(value: SpecText, locale: Locale): string | null {
  if (value === null) return null;
  if (typeof value === "string") return value;
  return value[locale] ?? value.en ?? value.et;
}

export function isSoldOut(product: { availability?: string }): boolean {
  return product.availability === "sold-out";
}

export function priceCents(product: Pick<Product, "price">): number {
  return Math.round(product.price * 100);
}

/**
 * The last order day for this product. A product whose warehouse is unknown
 * or outside the EU gets the earlier, safer date.
 */
export function christmasCutoffDate(product: Pick<Product, "supplier">, meta: CatalogMeta): string {
  const warehouse = product.supplier.warehouse;
  return warehouse !== null && EU_COUNTRIES.has(warehouse)
    ? meta.christmasCutoff.euWarehouse
    : meta.christmasCutoff.chinaDirect;
}

/** "2026-12-05" -> the last second of that day in Estonia (UTC+2 in winter). */
export function endOfDayInEstonia(date: string): string {
  return `${date}T23:59:59+02:00`;
}

export function deliveryDays(
  product: Pick<Product, "supplier">,
  fallback: { min: number; max: number },
): { min: number; max: number } {
  const estimate = product.supplier.deliveryEstimateDaysEE;
  if (estimate === null) return fallback;
  return typeof estimate === "number" ? { min: estimate, max: estimate } : estimate;
}

/**
 * Net margin per unit before ads and payment fees:
 * price without VAT − unit cost − shipping. null when a cost is unknown.
 */
export function netMarginEUR(product: Pick<Product, "price" | "supplier">, meta: CatalogMeta): number | null {
  const { unitCostEUR, shippingCostEUR } = product.supplier;
  if (unitCostEUR === null || shippingCostEUR === null) return null;
  return product.price / (1 + meta.vatRateEE) - unitCostEUR - shippingCostEUR;
}

// ---- Validation ----

export const MIN_MARGIN_EUR = 3;

export interface ProductReport {
  id: string;
  status: string;
  /** The data is malformed. Always stops the build, whatever the status. */
  structure: string[];
  /** Must be fixed before the product may be "active". */
  blocking: string[];
  /** Worth knowing, does not stop anything. */
  advisory: string[];
}

export interface CatalogReport {
  meta: string[];
  products: ProductReport[];
  /** Problems that stop the build. */
  errors: string[];
  /** Notes about products that are on sale. */
  warnings: string[];
}

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const UNFINISHED = /\b(TODO|TBD)\b/;

type Obj = Record<string, unknown>;

const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);
const isTextOrNull = (v: unknown): v is string | null => v === null || typeof v === "string";
const isNumberOrNull = (v: unknown): v is number | null =>
  v === null || (typeof v === "number" && Number.isFinite(v) && v >= 0);
const isBlank = (v: unknown) => v === null || (typeof v === "string" && v.trim() === "");
const isDate = (v: unknown) => typeof v === "string" && ISO_DATE.test(v) && !Number.isNaN(Date.parse(v));

function checkMeta(meta: unknown): string[] {
  const problems: string[] = [];
  if (!isObj(meta)) return ["_meta: missing"];
  if (meta.currency !== "EUR") problems.push('_meta.currency: the shop only supports "EUR"');
  if (meta.pricesIncludeVAT !== true) problems.push("_meta.pricesIncludeVAT: must be true; prices are shown as final");
  if (typeof meta.vatRateEE !== "number" || meta.vatRateEE < 0 || meta.vatRateEE >= 1) {
    problems.push("_meta.vatRateEE: must be a fraction such as 0.24");
  }
  const cutoff = meta.christmasCutoff;
  if (!isObj(cutoff) || !isDate(cutoff.chinaDirect) || !isDate(cutoff.euWarehouse)) {
    problems.push("_meta.christmasCutoff: chinaDirect and euWarehouse must be dates like 2026-12-05");
  }
  return problems;
}

function checkProduct(p: Obj, knownCategories: readonly string[] | undefined): Omit<ProductReport, "id" | "status"> {
  const structure: string[] = [];
  const blocking: string[] = [];
  const advisory: string[] = [];

  /** A { et, en } text: malformed is a structure problem, unfinished is blocking. */
  const localized = (field: string, v: unknown) => {
    if (!isObj(v) || !LOCALES.every((l) => isTextOrNull(v[l]))) {
      structure.push(`${field}: must be { ${LOCALES.map((l) => `"${l}": text or null`).join(", ")} }`);
      return;
    }
    for (const l of LOCALES) {
      if (isBlank(v[l])) blocking.push(`${field}.${l}: missing`);
      else if (UNFINISHED.test(v[l] as string)) blocking.push(`${field}.${l}: still contains TODO/TBD`);
    }
  };

  if (typeof p.slug !== "string" || !SLUG.test(p.slug)) {
    structure.push(`slug: must be lowercase letters, digits and hyphens (got ${JSON.stringify(p.slug)})`);
  }
  if (p.status !== "active" && p.status !== "draft" && p.status !== "blocked") {
    structure.push('status: must be "active", "draft" or "blocked"');
  }
  if (typeof p.category !== "string" || p.category === "") {
    structure.push("category: must be text");
  } else if (knownCategories && !knownCategories.includes(p.category)) {
    structure.push(`category: "${p.category}" has no name in messages/*.json under "categories"`);
  }

  localized("name", p.name);
  localized("shortDescription", p.shortDescription);
  localized("description", p.description);

  if (typeof p.price !== "number" || !(p.price > 0) || Math.abs(p.price * 100 - Math.round(p.price * 100)) > 1e-6) {
    structure.push("price: must be an amount in euros above 0 with at most two decimals, e.g. 9.90");
  }
  if (!isNumberOrNull(p.compareAtPrice)) {
    structure.push("compareAtPrice: must be a number or null");
  } else if (p.compareAtPrice !== null) {
    advisory.push("compareAtPrice is set but is not shown: the shop has no 30-day price history yet");
  }

  if (!Array.isArray(p.variants)) {
    structure.push("variants: must be a list (empty if the product has no options)");
  } else {
    const seen = new Set<unknown>();
    p.variants.forEach((v: unknown, i: number) => {
      const at = `variants[${i}]`;
      if (!isObj(v)) return void structure.push(`${at}: must be an object`);
      if (typeof v.id !== "string" || !SLUG.test(v.id)) structure.push(`${at}.id: must be lowercase letters, digits and hyphens`);
      else if (seen.has(v.id)) structure.push(`${at}.id: "${v.id}" is used more than once`);
      seen.add(v.id);
      localized(`${at}.name`, v.name);
      if (!isTextOrNull(v.supplierVariantName)) structure.push(`${at}.supplierVariantName: must be text or null`);
      else if (isBlank(v.supplierVariantName) || UNFINISHED.test(v.supplierVariantName as string)) {
        blocking.push(`${at}.supplierVariantName: not known yet, so the order could not be placed`);
      }
      if (!isTextOrNull(v.sku)) structure.push(`${at}.sku: must be text or null`);
    });
  }

  if (!Array.isArray(p.images) || !p.images.every((s) => typeof s === "string" && s.startsWith("/"))) {
    structure.push('images: must be a list of paths under public/, each starting with "/" (no links to other sites)');
  } else if (p.images.length === 0) {
    blocking.push("images: no product photo");
  }
  if (p.illustration !== undefined && (typeof p.illustration !== "string" || !p.illustration.startsWith("/"))) {
    structure.push('illustration: must be a path under public/, starting with "/"');
  }
  if (!Array.isArray(p.supplierImages) || !p.supplierImages.every((s) => typeof s === "string")) {
    structure.push("supplierImages: must be a list of links");
  }

  const isLocalizedShape = (v: unknown): v is Obj => isObj(v) && LOCALES.every((l) => isTextOrNull(v[l]));
  const specs = p.specs;
  if (!isObj(specs) || !isNumberOrNull(specs.weightG)) {
    structure.push("specs: needs material, dimensions and weightG (number/null)");
  } else {
    for (const f of ["material", "dimensions"] as const) {
      const v = specs[f];
      if (v === null) continue; // unknown facts are simply not shown
      if (typeof v === "string") {
        blocking.push(`specs.${f}: written in one language only; use { "et": "…", "en": "…" }`);
        if (UNFINISHED.test(v)) blocking.push(`specs.${f}: still contains TODO/TBD`);
      } else if (isLocalizedShape(v)) {
        localized(`specs.${f}`, v);
      } else {
        structure.push(`specs.${f}: must be text, { et, en } or null`);
      }
    }
  }

  // Optional customer-facing fields: checked only when present.
  for (const f of ["packContents", "care"] as const) {
    if (p[f] !== undefined) localized(f, p[f]);
  }
  if (p.availability !== undefined && p.availability !== "available" && p.availability !== "sold-out") {
    structure.push('availability: must be "available" or "sold-out"');
  }
  if (p.seo !== undefined) {
    if (!isObj(p.seo)) structure.push("seo: must be { title, description }");
    else {
      localized("seo.title", p.seo.title);
      localized("seo.description", p.seo.description);
    }
  }

  const s = p.supplier;
  if (!isObj(s)) {
    structure.push("supplier: must be an object");
  } else {
    for (const f of ["name", "url", "productTitle", "processing", "returns", "notes"] as const) {
      if (!isTextOrNull(s[f])) structure.push(`supplier.${f}: must be text or null`);
    }
    for (const f of ["unitCostEUR", "shippingCostEUR"] as const) {
      if (!isNumberOrNull(s[f])) structure.push(`supplier.${f}: must be a number or null`);
    }
    if (s.warehouse !== null && (typeof s.warehouse !== "string" || !/^[A-Z]{2}$/.test(s.warehouse))) {
      structure.push('supplier.warehouse: must be a two-letter country code such as "DE" or "CN", or null');
    } else if (s.warehouse === null) {
      advisory.push("supplier.warehouse unknown: the earlier (non-EU) Christmas cutoff is used");
    }
    const d = s.deliveryEstimateDaysEE;
    const positiveInt = (n: unknown) => typeof n === "number" && Number.isInteger(n) && n >= 1;
    if (d === null) {
      advisory.push("supplier.deliveryEstimateDaysEE unknown: the generic estimate from config/shop.ts is shown");
    } else if (!(positiveInt(d) || (isObj(d) && positiveInt(d.min) && positiveInt(d.max) && (d.max as number) >= (d.min as number)))) {
      structure.push("supplier.deliveryEstimateDaysEE: must be working days as a number or { min, max }, or null");
    }
    if (s.unitCostEUR === null) advisory.push("supplier.unitCostEUR unknown: margin cannot be checked");
  }

  const safety = p.safety;
  if (!isObj(safety)) {
    structure.push("safety: must be an object");
  } else {
    for (const f of [
      "manufacturerName",
      "manufacturerAddress",
      "euResponsiblePersonName",
      "euResponsiblePersonAddress",
      "productIdentifier",
    ] as const) {
      if (!isTextOrNull(safety[f])) structure.push(`safety.${f}: must be text or null`);
      else if (isBlank(safety[f])) blocking.push(`safety.${f}: missing`);
    }
    localized("safety.warnings", safety.warnings);
    if (!Array.isArray(safety.certifications) || !safety.certifications.every((c) => typeof c === "string")) {
      structure.push("safety.certifications: must be a list of text");
    }
  }

  if (!Array.isArray(p.tags) || !p.tags.every((t) => typeof t === "string")) {
    structure.push("tags: must be a list of text");
  }

  return { structure, blocking, advisory };
}

/**
 * @param knownCategories category slugs that have a display name; when given,
 *   a product in any other category is a structure problem.
 */
export function validateCatalog(data: unknown, knownCategories?: readonly string[]): CatalogReport {
  const report: CatalogReport = { meta: [], products: [], errors: [], warnings: [] };

  if (!isObj(data) || !Array.isArray(data.products)) {
    report.errors.push('the file must be { "_meta": {...}, "products": [...] }');
    return report;
  }

  report.meta = checkMeta(data._meta);
  report.errors.push(...report.meta);

  const ids = new Set<string>();
  const slugs = new Set<string>();
  data.products.forEach((p: unknown, i: number) => {
    if (!isObj(p)) return void report.errors.push(`products[${i}]: must be an object`);
    const id = typeof p.id === "string" && p.id !== "" ? p.id : `products[${i}]`;
    const result = checkProduct(p, knownCategories);

    if (typeof p.id !== "string" || p.id === "") result.structure.push("id: must be non-empty text");
    else if (ids.has(p.id)) result.structure.push(`id: "${p.id}" is used more than once`);
    ids.add(id);
    if (typeof p.slug === "string") {
      if (slugs.has(p.slug)) result.structure.push(`slug: "${p.slug}" is used more than once`);
      slugs.add(p.slug);
    }

    if (result.structure.length === 0 && report.meta.length === 0) {
      const margin = netMarginEUR(p as unknown as Product, data._meta as CatalogMeta);
      if (margin !== null && margin < MIN_MARGIN_EUR) {
        result.advisory.push(`net margin is ${margin.toFixed(2)} €, under ${MIN_MARGIN_EUR} € before ads and fees`);
      }
    }

    report.products.push({ id, status: String(p.status), ...result });
    report.errors.push(...result.structure.map((m) => `${id}: ${m}`));
    if (p.status === "active") {
      report.errors.push(...result.blocking.map((m) => `${id}: cannot be active — ${m}`));
      report.warnings.push(...result.advisory.map((m) => `${id}: ${m}`));
    }
  });

  return report;
}
