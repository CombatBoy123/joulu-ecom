import type { Metadata } from "next";
import { Logo } from "@/components/Logo";
import { shop } from "@/config/shop";
import { DEFAULT_LOCALE, getMessages, LOCALES } from "@/lib/i18n";
import { routes } from "@/lib/routes";
import { fontClasses } from "./fonts";
import "./globals.css";

// The page for any address that does not exist. A static site cannot know
// which language the visitor wanted, so it speaks both.
export const metadata: Metadata = {
  title: `${getMessages(DEFAULT_LOCALE).notFound.title} · ${shop.name}`,
  robots: { index: false },
};

export default function GlobalNotFound() {
  return (
    <html lang={DEFAULT_LOCALE} className={fontClasses}>
      <body>
        <header className="site-header">
          <div className="container site-header__bar">
            <Logo href={routes.home(DEFAULT_LOCALE)} name={shop.name} />
          </div>
        </header>
        <main className="container page not-found">
          {LOCALES.map((locale) => {
            const m = getMessages(locale).notFound;
            return (
              <section key={locale} lang={locale}>
                <h1>{m.title}</h1>
                <p>{m.body}</p>
                <a className="button button--secondary" href={routes.home(locale)}>
                  {m.home}
                </a>
              </section>
            );
          })}
        </main>
      </body>
    </html>
  );
}
