import { Arrow } from "@/components/Logo";
import { ProductGrid } from "@/components/ProductCard";
import { categoryName, getMessages, type Locale } from "@/lib/i18n";
import { categoryPhoto, heroPhoto } from "@/lib/imagery";
import { categories, products } from "@/lib/products";
import { routes } from "@/lib/routes";

export function HomePage({ locale }: { locale: Locale }) {
  const m = getMessages(locale);
  return (
    <>
      <section className={heroPhoto ? "hero hero--photo" : "hero"}>
        {heroPhoto && (
          <div className="hero__art">
            <img
              src={heroPhoto.src}
              alt={heroPhoto.alt[locale]}
              fetchPriority="high"
              decoding="async"
            />
            <div className="hero__scrim" />
          </div>
        )}
        <div className="container hero__content">
          <p className="eyebrow">{m.home.eyebrow}</p>
          <h1 className="hero__title">
            <span>{m.home.titleLead}</span> <em>{m.home.titleAccent}</em>
          </h1>
          <p className="hero__desc">{m.home.intro}</p>
          <a className="btn" href="#products">
            {m.home.cta} <Arrow />
          </a>
        </div>
      </section>

      {categories.length > 0 && (
        <section
          className="section container"
          aria-labelledby="categories-heading"
        >
          <div className="section-head">
            <p className="eyebrow">{m.home.categoriesEyebrow}</p>
            <h2 id="categories-heading" className="section-title">
              {m.home.categoriesTitle} <em>{m.home.categoriesTitleAccent}</em>
            </h2>
          </div>
          <ul className="cat-grid">
            {categories.map((slug) => {
              const photo = categoryPhoto(slug);
              return (
                <li key={slug}>
                  <a className="cat-card" href={routes.category(locale, slug)}>
                    {photo && (
                      <img
                        className="cat-card__art"
                        src={photo.src}
                        alt={photo.alt[locale]}
                        loading="lazy"
                        decoding="async"
                      />
                    )}
                    <span className="cat-card__overlay" />
                    <span className="cat-card__body">
                      <span className="cat-card__title">
                        {categoryName(slug, m)}
                      </span>
                      <span className="cat-card__arrow">
                        <Arrow />
                      </span>
                    </span>
                  </a>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section
        id="products"
        className="section container"
        aria-labelledby="products-heading"
      >
        <div className="section-head">
          <p className="eyebrow">{m.home.productsEyebrow}</p>
          <h2 id="products-heading" className="section-title">
            {m.home.productsTitle} <em>{m.home.productsTitleAccent}</em>
          </h2>
        </div>
        {products.length === 0 ? (
          <p className="muted">{m.home.empty}</p>
        ) : (
          <ProductGrid items={products} locale={locale} m={m} />
        )}
      </section>

      <section className="facts-strip">
        <ol className="container">
          {m.home.facts.map((fact, i) => (
            <li key={fact.title}>
              <span className="facts-strip__no">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3>{fact.title}</h3>
              <p>{fact.body}</p>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}
