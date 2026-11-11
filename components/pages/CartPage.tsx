import { CartView } from "@/components/CartView";
import { shop } from "@/config/shop";
import { getMessages, type Locale } from "@/lib/i18n";
import { PLACEHOLDER_IMAGE } from "@/lib/product-view";
import { isPreview, products } from "@/lib/products";
import { toPublicProduct } from "@/lib/public-catalog";
import { routes } from "@/lib/routes";

export function CartPage({ locale }: { locale: Locale }) {
  const m = getMessages(locale);
  return (
    <div className="container page">
      <div className="page-intro">
        <h1>{m.cart.title}</h1>
      </div>
      <CartView
        locale={locale}
        m={m}
        products={products.map(toPublicProduct)}
        shipping={shop.shipping.map(({ id, carrier, country, priceCents }) => ({ id, carrier, country, priceCents }))}
        allowDrafts={isPreview}
        placeholderImage={PLACEHOLDER_IMAGE}
        links={{
          home: routes.home(locale),
          terms: routes.legal(locale, "terms"),
          returns: routes.legal(locale, "returns"),
          product: Object.fromEntries(products.map((p) => [p.id, routes.product(locale, p.slug)])),
        }}
      />
    </div>
  );
}
