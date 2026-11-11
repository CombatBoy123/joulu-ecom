import raw from "@/products.json";
import et from "@/messages/et.json";
import { shop } from "@/config/shop";
import { validateCatalog, type Catalog, type CatalogMeta, type Product } from "./product-schema";

// Runs once when the site is built (and on every reload in `npm run dev`).
// A mistake in products.json, or an "active" product that is not ready to be
// sold, stops the build here instead of reaching the live shop.
const report = validateCatalog(raw, Object.keys(et.categories));
if (report.errors.length > 0) {
  throw new Error(
    `products.json has ${report.errors.length} problem(s):\n` + report.errors.map((e) => `  - ${e}`).join("\n"),
  );
}
for (const warning of report.warnings) console.warn(`[products.json] ${warning}`);

const catalog = raw as unknown as Catalog;

export const meta: CatalogMeta = catalog._meta;

/**
 * Drafts are listed, marked with a badge, in local preview (`npm run dev`)
 * and, before launch, on the built site while config/shop.ts has
 * previewDrafts on. Otherwise only active products exist. Blocked products
 * are never exposed by this module at all.
 */
export const isPreview = process.env.NODE_ENV === "development" || shop.previewDrafts;

export const products: Product[] = catalog.products.filter(
  (p) => p.status === "active" || (isPreview && p.status === "draft"),
);

/** Categories that have something to show, in order of first appearance. */
export const categories: string[] = [...new Set(products.map((p) => p.category))];

export function getProduct(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

export function getProductsInCategory(category: string): Product[] {
  return products.filter((p) => p.category === category);
}
