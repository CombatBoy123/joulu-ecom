import { categoryName, formatPrice, pick, type Locale, type Messages } from "@/lib/i18n";
import { priceCents, type Product } from "@/lib/product-schema";
import { deliveryText, PLACEHOLDER_IMAGE } from "@/lib/product-view";
import { routes } from "@/lib/routes";

interface Props {
  product: Product;
  locale: Locale;
  m: Messages;
  /** Images above the fold load eagerly. */
  eager?: boolean;
}

export function ProductCard({ product, locale, m, eager = false }: Props) {
  const name = pick(product.name, locale, `${product.id} name`);
  const image = product.images[0];
  return (
    <li className="product-card">
      <a href={routes.product(locale, product.slug)}>
        <span className="product-card__image">
          <img
            src={image ?? PLACEHOLDER_IMAGE}
            alt={image ? name : m.product.photoPending}
            width={400}
            height={400}
            loading={eager ? "eager" : "lazy"}
            decoding="async"
          />
          {product.status === "draft" && <span className="draft-badge">{m.product.draftBadge}</span>}
        </span>
        <span className="product-card__category">{categoryName(product.category, m)}</span>
        <span className="product-card__name">{name}</span>
      </a>
      <p className="product-card__price">{formatPrice(priceCents(product), locale)}</p>
      <p className="product-card__delivery">{deliveryText(product, m)}</p>
    </li>
  );
}

export function ProductGrid({ items, locale, m }: { items: Product[]; locale: Locale; m: Messages }) {
  return (
    <ul className="product-grid">
      {items.map((product, i) => (
        <ProductCard key={product.id} product={product} locale={locale} m={m} eager={i < 4} />
      ))}
    </ul>
  );
}
