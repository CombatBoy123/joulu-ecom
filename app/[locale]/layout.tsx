import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Fraunces, Libre_Franklin } from "next/font/google";
import { notFound } from "next/navigation";
import { ChristmasBanner } from "@/components/ChristmasBanner";
import { CartLink } from "@/components/CartLink";
import { LanguageSwitch } from "@/components/LanguageSwitch";
import { shop } from "@/config/shop";
import { christmasBannerState } from "@/lib/christmas";
import { categoryName, fill, formatDayMonth, getMessages, isLocale, LOCALE_NAMES, LOCALES } from "@/lib/i18n";
import { shopCutoff } from "@/lib/product-view";
import { categories } from "@/lib/products";
import { getLegalPage } from "@/lib/legal";
import { LEGAL_PAGE_IDS, routes } from "@/lib/routes";
import "../globals.css";

// Downloaded when the site is built and served from our own domain: the
// visitor's browser never contacts Google.
const heading = Fraunces({ subsets: ["latin", "latin-ext"], variable: "--font-heading", display: "swap" });
const body = Libre_Franklin({ subsets: ["latin", "latin-ext"], variable: "--font-body", display: "swap" });

type Props = { children: ReactNode; params: Promise<{ locale: string }> };

// Only the listed languages exist; anything else is a 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export const viewport: Viewport = { themeColor: "#7a1418" };

export async function generateMetadata({ params }: Pick<Props, "params">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const m = getMessages(locale);
  return {
    title: { default: shop.name, template: `%s · ${shop.name}` },
    description: m.meta.description,
    alternates: {
      languages: Object.fromEntries(LOCALES.map((l) => [l, routes.home(l)])),
    },
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const m = getMessages(locale);
  const christmas = { orderBy: shopCutoff(), seasonEnds: shop.christmasSeasonEnds };
  const carriers = [...new Set(shop.shipping.map((s) => s.carrier))].join(", ");

  return (
    <html lang={locale} className={`${heading.variable} ${body.variable}`}>
      <body>
        <a className="skip-link" href="#content">
          {m.nav.skipToContent}
        </a>
        <ChristmasBanner
          className="christmas-banner"
          config={christmas}
          initialState={christmasBannerState(new Date(), christmas)}
          beforeText={fill(m.christmas.beforeCutoff, { date: formatDayMonth(christmas.orderBy, locale) })}
          afterText={m.christmas.afterCutoff}
        />
        <header className="site-header">
          <div className="site-header__bar">
            <a className="site-name" href={routes.home(locale)}>
              {shop.name}
            </a>
            <div className="site-header__tools">
              <nav aria-label={m.nav.language}>
                <LanguageSwitch locale={locale} names={LOCALE_NAMES} />
              </nav>
              <CartLink href={routes.cart(locale)} label={m.nav.cart} countLabel={m.nav.cartCount} />
            </div>
          </div>
          <div className="awning" aria-hidden="true" />
          {categories.length > 0 && (
            <nav className="category-nav" aria-label={m.nav.categories}>
              <ul>
                {categories.map((slug) => (
                  <li key={slug}>
                    <a href={routes.category(locale, slug)}>{categoryName(slug, m)}</a>
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </header>
        <main id="content">{children}</main>
        <footer className="site-footer">
          <dl>
            <div>
              <dt>{m.footer.deliveryHeading}</dt>
              <dd>{fill(m.footer.delivery, { carriers })}</dd>
            </div>
            <div>
              <dt>{m.footer.returnsHeading}</dt>
              <dd>{m.footer.returns}</dd>
            </div>
          </dl>
          <nav className="site-footer__links" aria-label={m.nav.info}>
            <ul>
              {LEGAL_PAGE_IDS.map((id) => (
                <li key={id}>
                  <a href={routes.legal(locale, id)}>{getLegalPage(locale, id).title}</a>
                </li>
              ))}
            </ul>
          </nav>
          <p className="site-footer__name">{shop.name}</p>
        </footer>
      </body>
    </html>
  );
}
