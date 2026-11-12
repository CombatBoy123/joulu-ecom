import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AddToCart } from "@/components/AddToCart";
import { ProductMedia } from "@/components/ProductCard";
import { ChristmasBanner } from "@/components/ChristmasBanner";
import { shop } from "@/config/shop";
import { christmasBannerState } from "@/lib/christmas";
import { categoryName, fill, formatDayMonth, formatPrice, getMessages, pick, type Locale } from "@/lib/i18n";
import { isSoldOut, priceCents, specText } from "@/lib/product-schema";
import { deliveryText, productCutoff } from "@/lib/product-view";
import { getProduct } from "@/lib/products";
import { routes } from "@/lib/routes";

export function productMetadata(locale: Locale, slug: string): Metadata {
  const product = getProduct(slug);
  if (!product) return {};
  return {
    title: pick(product.seo?.title ?? product.name, locale),
    description: pick(product.seo?.description ?? product.shortDescription, locale),
    openGraph: product.images[0] ? { images: [product.images[0]] } : undefined,
    alternates: {
      languages: { et: routes.product("et", product.slug), en: routes.product("en", product.slug) },
    },
    // Drafts only exist in local preview, but never let one be indexed.
    robots: product.status === "active" ? undefined : { index: false },
  };
}

export function ProductPage({ locale, slug }: { locale: Locale; slug: string }) {
  const product = getProduct(slug);
  if (!product) notFound();

  const m = getMessages(locale);
  const name = pick(product.name, locale, `${product.id} name`);
  const images = product.images.length > 0 ? product.images : null;
  const christmas = { orderBy: productCutoff(product), seasonEnds: shop.christmasSeasonEnds };
  const { specs, safety } = product;

  // Rows without a value are left out; "null" is never printed.
  const specRows = [
    [m.product.packContents, product.packContents ? pick(product.packContents, locale) : null],
    [m.product.material, specText(specs.material, locale)],
    [m.product.dimensions, specText(specs.dimensions, locale)],
    [m.product.weight, specs.weightG === null ? null : fill(m.product.weightValue, { g: specs.weightG })],
    [m.product.care, product.care ? pick(product.care, locale) : null],
  ].filter((row): row is [string, string] => Boolean(row[1]));

  const operator = (operatorName: string | null, address: string | null) =>
    operatorName || address ? [operatorName, address].filter(Boolean).join(", ") : m.product.notProvided;
  const warnings = pick(safety.warnings, locale, `${product.id} warnings`);

  // Search engines are told about a product only once it is really on sale.
  const structuredData =
    product.status === "active"
      ? {
          "@context": "https://schema.org",
          "@type": "Product",
          name,
          description: pick(product.shortDescription, locale),
          sku: product.id,
          image: product.images.map((src) => shop.siteUrl + src),
          offers: {
            "@type": "Offer",
            url: shop.siteUrl + routes.product(locale, product.slug),
            price: product.price.toFixed(2),
            priceCurrency: "EUR",
            availability: isSoldOut(product) ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
          },
        }
      : null;

  return (
    <article className="product container page">
      {structuredData && (
        <script
          type="application/ld+json"
          // "<" is escaped so that product text can never close the script tag.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}
        />
      )}
      <nav className="breadcrumb" aria-label={m.nav.breadcrumb}>
        <a href={routes.home(locale)}>{m.nav.home}</a>
        <span aria-hidden="true"> / </span>
        <a href={routes.category(locale, product.category)}>{categoryName(product.category, m)}</a>
      </nav>

      <div className="product__layout">
        <div className="product__gallery">
          <div className="product__image">
            <ProductMedia product={product} name={name} m={m} eager size={800} />
          </div>
          {images && images.length > 1 && (
            <ul className="product__thumbs">
              {images.slice(1).map((src, i) => (
                <li key={src}>
                  <img src={src} alt={`${name} ${i + 2}`} width={400} height={400} loading="lazy" decoding="async" />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="product__buy">
          {product.status === "draft" && <span className="badge badge--inline">{m.product.draftBadge}</span>}
          <p className="eyebrow">{categoryName(product.category, m)}</p>
          <h1>{name}</h1>
          <p className="product__short">{pick(product.shortDescription, locale)}</p>

          <p className="product__price">
            <span className="visually-hidden">{m.product.price}: </span>
            {formatPrice(priceCents(product), locale)}
          </p>
          <p className="product__delivery">{deliveryText(product, m)}</p>
          <ChristmasBanner
            className="product__christmas"
            config={christmas}
            initialState={christmasBannerState(new Date(), christmas)}
            beforeText={fill(m.product.christmas, { date: formatDayMonth(christmas.orderBy, locale) })}
          />

          {isSoldOut(product) ? (
            <p className="notice product__sold-out">{m.product.soldOutNote}</p>
          ) : (
            <>
              {/* Only ids and names go to the browser; supplier data stays here. */}
              <AddToCart
                productId={product.id}
                variants={product.variants.map((v) => ({ id: v.id, name: pick(v.name, locale) }))}
                cartHref={routes.cart(locale)}
                text={{
                  chooseOption: m.product.chooseOption,
                  quantity: m.product.quantity,
                  addToCart: m.product.addToCart,
                  added: m.product.added,
                  viewCart: m.product.viewCart,
                  pickOptionFirst: m.product.pickOptionFirst,
                }}
              />
            </>
          )}
        </div>
      </div>

      <section className="product__section">
        <h2>{m.product.description}</h2>
        <p>{pick(product.description, locale, `${product.id} description`)}</p>
      </section>

      {specRows.length > 0 && (
        <section className="product__section">
          <h2>{m.product.specs}</h2>
          <dl className="facts">
            {specRows.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      <section className="product__section">
        <h2>{m.product.safetyHeading}</h2>
        <dl className="facts">
          <div>
            <dt>{m.product.manufacturer}</dt>
            <dd>{operator(safety.manufacturerName, safety.manufacturerAddress)}</dd>
          </div>
          <div>
            <dt>{m.product.euResponsiblePerson}</dt>
            <dd>{operator(safety.euResponsiblePersonName, safety.euResponsiblePersonAddress)}</dd>
          </div>
          <div>
            <dt>{m.product.identifier}</dt>
            <dd>{safety.productIdentifier || m.product.notProvided}</dd>
          </div>
          <div>
            <dt>{m.product.warnings}</dt>
            <dd>{warnings || m.product.notProvided}</dd>
          </div>
        </dl>
      </section>
    </article>
  );
}
