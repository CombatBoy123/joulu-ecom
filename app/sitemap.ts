import type { MetadataRoute } from "next";
import { shop } from "@/config/shop";
import { LOCALES } from "@/lib/i18n";
import { getLegalPage } from "@/lib/legal";
import { categories, products } from "@/lib/products";
import { LEGAL_PAGE_IDS, routes } from "@/lib/routes";

export const dynamic = "force-static";

// Only pages that are meant to be found: products that are on sale, their
// categories, and legal pages whose text the owner has approved.
export default function sitemap(): MetadataRoute.Sitemap {
  const onSale = products.filter((p) => p.status === "active");
  const paths = LOCALES.flatMap((locale) => [
    routes.home(locale),
    ...categories.filter((c) => onSale.some((p) => p.category === c)).map((c) => routes.category(locale, c)),
    ...onSale.map((p) => routes.product(locale, p.slug)),
    ...LEGAL_PAGE_IDS.filter((id) => getLegalPage(locale, id).approved).map((id) => routes.legal(locale, id)),
  ]);
  return paths.map((path) => ({ url: shop.siteUrl + path }));
}
