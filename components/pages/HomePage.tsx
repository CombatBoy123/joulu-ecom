import { ProductGrid } from "@/components/ProductCard";
import { getMessages, type Locale } from "@/lib/i18n";
import { products } from "@/lib/products";

export function HomePage({ locale }: { locale: Locale }) {
  const m = getMessages(locale);
  return (
    <>
      <div className="page-intro">
        <h1>{m.home.title}</h1>
        <p>{m.home.intro}</p>
      </div>

      <section aria-labelledby="products-heading">
        <h2 id="products-heading" className="section-heading">
          {m.home.productsHeading}
        </h2>
        {products.length === 0 ? <p>{m.home.empty}</p> : <ProductGrid items={products} locale={locale} m={m} />}
      </section>
    </>
  );
}
