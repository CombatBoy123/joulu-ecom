import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CartPage } from "@/components/pages/CartPage";
import { CategoryPage, categoryMetadata } from "@/components/pages/CategoryPage";
import { HomePage } from "@/components/pages/HomePage";
import { LegalPage, legalMetadata } from "@/components/pages/LegalPage";
import { OrderPage } from "@/components/pages/OrderPage";
import { ProductPage, productMetadata } from "@/components/pages/ProductPage";
import { getMessages, isLocale, LOCALES } from "@/lib/i18n";
import { categories, products } from "@/lib/products";
import { LEGAL_PAGE_IDS, pagePath, resolvePath, type Page } from "@/lib/routes";

// One route serves every page of the shop.
//
// Why not a folder per page type: the site is a static export, and a static
// export refuses to build a dynamic route that has nothing to generate. A shop
// with no products on sale yet would therefore not build at all. This route
// always has the home page, so it always builds.

type Props = { params: Promise<{ locale: string; path?: string[] }> };

export const dynamicParams = false;

export function generateStaticParams() {
  const pages: Page[] = [
    { kind: "home" },
    { kind: "cart" },
    { kind: "order" },
    ...LEGAL_PAGE_IDS.map((id): Page => ({ kind: "legal", id })),
    ...categories.map((slug): Page => ({ kind: "category", slug })),
    ...products.map((p): Page => ({ kind: "product", slug: p.slug })),
  ];
  return LOCALES.flatMap((locale) => pages.map((page) => ({ locale, path: pagePath(locale, page) })));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, path } = await params;
  const page = isLocale(locale) ? resolvePath(locale, path) : null;
  if (!page || !isLocale(locale)) return {};
  if (page.kind === "product") return productMetadata(locale, page.slug);
  if (page.kind === "category") return categoryMetadata(locale, page.slug);
  if (page.kind === "legal") return legalMetadata(locale, page.id);
  // The cart and the order status are personal pages, not search results.
  if (page.kind === "cart") return { title: getMessages(locale).cart.title, robots: { index: false } };
  if (page.kind === "order") return { robots: { index: false } };
  return {};
}

export default async function Page({ params }: Props) {
  const { locale, path } = await params;
  if (!isLocale(locale)) notFound();
  const page = resolvePath(locale, path);
  if (!page) notFound();

  if (page.kind === "product") return <ProductPage locale={locale} slug={page.slug} />;
  if (page.kind === "category") return <CategoryPage locale={locale} slug={page.slug} />;
  if (page.kind === "cart") return <CartPage locale={locale} />;
  if (page.kind === "order") return <OrderPage locale={locale} />;
  if (page.kind === "legal") return <LegalPage locale={locale} id={page.id} />;
  return <HomePage locale={locale} />;
}
