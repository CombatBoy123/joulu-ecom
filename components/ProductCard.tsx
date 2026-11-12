import { Arrow } from "@/components/Logo";
import { categoryName, formatPrice, pick, type Locale, type Messages } from "@/lib/i18n";
import { priceCents, type Product } from "@/lib/product-schema";
import { deliveryText } from "@/lib/product-view";
import { routes } from "@/lib/routes";

interface Props {
  product: Product;
  locale: Locale;
  m: Messages;
  /** Images above the fold load eagerly. */
  eager?: boolean;
}

/** The product's photo, or a quiet panel saying one is on its way. */
export function ProductMedia({ product, name, m, eager, size }: { product: Product; name: string; m: Messages; eager?: boolean; size: number }) {
  const image = product.images[0];
  if (image) {
    return <img src={image} alt={name} width={size} height={size} loading={eager ? "eager" : "lazy"} decoding="async" />;
  }
  return (
    <span className="no-photo">
      <span>{m.product.photoPending}</span>
    </span>
  );
}

export function ProductCard({ product, locale, m, eager = false }: Props) {
  const name = pick(product.name, locale, `${product.id} name`);
  const href = routes.product(locale, product.slug);
  return (
    <li className="pcard">
      <a className="pcard__media" href={href} tabIndex={-1} aria-hidden="true">
        <ProductMedia product={product} name="" m={m} eager={eager} size={480} />
        {product.status === "draft" && <span className="badge">{m.product.draftBadge}</span>}
      </a>
      <div className="pcard__body">
        <span className="pcard__cat">{categoryName(product.category, m)}</span>
        <h3 className="pcard__name">
          <a href={href}>{name}</a>
        </h3>
        <p className="pcard__delivery">{deliveryText(product, m)}</p>
        <div className="pcard__foot">
          <span className="pcard__price">{formatPrice(priceCents(product), locale)}</span>
          <a className="pill" href={href} aria-label={`${m.product.view}: ${name}`}>
            {m.product.view} <Arrow />
          </a>
        </div>
      </div>
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
