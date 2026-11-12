import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { CartLink } from "@/components/CartLink";
import { ChristmasBanner } from "@/components/ChristmasBanner";
import { LanguageSwitch } from "@/components/LanguageSwitch";
import { Logo } from "@/components/Logo";
import { Snowfall } from "@/components/Snowfall";
import { shop } from "@/config/shop";
import { christmasBannerState } from "@/lib/christmas";
import { categoryName, fill, formatDayMonth, getMessages, isLocale, LOCALE_NAMES, LOCALES } from "@/lib/i18n";
import { getLegalPage } from "@/lib/legal";
import { shopCutoff } from "@/lib/product-view";
import { categories } from "@/lib/products";
import { LEGAL_PAGE_IDS, routes } from "@/lib/routes";
import { fontClasses } from "../fonts";
import "../globals.css";

type Props = { children: ReactNode; params: Promise<{ locale: string }> };

// Only the listed languages exist; anything else is a 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export const viewport: Viewport = { themeColor: "#100b09" };

export async function generateMetadata({ params }: Pick<Props, "params">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const m = getMessages(locale);
  return {
    metadataBase: new URL(shop.siteUrl),
    title: { default: shop.name, template: `%s · ${shop.name}` },
    openGraph: { siteName: shop.name, type: "website", locale: locale === "et" ? "et_EE" : "en_GB" },
    description: m.meta.description,
    alternates: {
      languages: Object.fromEntries(LOCALES.map((l) => [l, routes.home(l)])),
    },
    // A shop that is showing drafts is not open and must not be indexed.
    robots: shop.previewDrafts ? { index: false, follow: false } : undefined,
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const m = getMessages(locale);
  const christmas = { orderBy: shopCutoff(), seasonEnds: shop.christmasSeasonEnds };
  const carriers = [...new Set(shop.shipping.map((s) => s.carrier))].join(", ");

  return (
    <html lang={locale} className={fontClasses}>
      <body>
        <Snowfall />
        <a className="skip-link" href="#content">
          {m.nav.skipToContent}
        </a>
        {shop.previewDrafts && <p className="preview-notice">{m.preview.notice}</p>}
        <ChristmasBanner
          className="christmas-banner"
          config={christmas}
          initialState={christmasBannerState(new Date(), christmas)}
          beforeText={fill(m.christmas.beforeCutoff, { date: formatDayMonth(christmas.orderBy, locale) })}
          afterText={m.christmas.afterCutoff}
        />
        <header className="site-header">
          <div className="container site-header__bar">
            <Logo href={routes.home(locale)} name={shop.name} />
            {categories.length > 0 && (
              <nav className="site-nav" aria-label={m.nav.categories}>
                <ul>
                  {categories.map((slug) => (
                    <li key={slug}>
                      <a href={routes.category(locale, slug)}>{categoryName(slug, m)}</a>
                    </li>
                  ))}
                </ul>
              </nav>
            )}
            <div className="site-header__tools">
              <nav aria-label={m.nav.language}>
                <LanguageSwitch locale={locale} names={LOCALE_NAMES} />
              </nav>
              <CartLink href={routes.cart(locale)} label={m.nav.cart} countLabel={m.nav.cartCount} />
            </div>
          </div>
        </header>
        <main id="content">{children}</main>
        <footer className="site-footer">
          <div className="container site-footer__grid">
            <div className="site-footer__brand">
              <Logo href={routes.home(locale)} name={shop.name} />
              <p>{m.footer.tagline}</p>
            </div>
            {categories.length > 0 && (
              <nav aria-label={m.footer.shop}>
                <h2>{m.footer.shop}</h2>
                <ul>
                  {categories.map((slug) => (
                    <li key={slug}>
                      <a href={routes.category(locale, slug)}>{categoryName(slug, m)}</a>
                    </li>
                  ))}
                </ul>
              </nav>
            )}
            <nav aria-label={m.footer.info}>
              <h2>{m.footer.info}</h2>
              <ul>
                {LEGAL_PAGE_IDS.map((id) => (
                  <li key={id}>
                    <a href={routes.legal(locale, id)}>{getLegalPage(locale, id).title}</a>
                  </li>
                ))}
              </ul>
            </nav>
            <div>
              <h2>{m.footer.deliveryHeading}</h2>
              <p>{fill(m.footer.delivery, { carriers })}</p>
              <h2>{m.footer.returnsHeading}</h2>
              <p>{m.footer.returns}</p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
