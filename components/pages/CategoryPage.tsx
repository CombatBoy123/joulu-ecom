import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductGrid } from "@/components/ProductCard";
import { categoryName, getMessages, type Locale } from "@/lib/i18n";
import { categories, getProductsInCategory } from "@/lib/products";
import { routes } from "@/lib/routes";

export function categoryMetadata(locale: Locale, slug: string): Metadata {
  if (!categories.includes(slug)) return {};
  return {
    title: categoryName(slug, getMessages(locale)),
    alternates: { languages: { et: routes.category("et", slug), en: routes.category("en", slug) } },
  };
}

export function CategoryPage({ locale, slug }: { locale: Locale; slug: string }) {
  if (!categories.includes(slug)) notFound();
  const m = getMessages(locale);
  const items = getProductsInCategory(slug);

  return (
    <>
      <nav className="breadcrumb" aria-label={m.nav.breadcrumb}>
        <a href={routes.home(locale)}>{m.nav.home}</a>
      </nav>
      <div className="page-intro">
        <h1>{categoryName(slug, m)}</h1>
      </div>
      {items.length === 0 ? <p>{m.category.empty}</p> : <ProductGrid items={items} locale={locale} m={m} />}
    </>
  );
}
