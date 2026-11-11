import type { Metadata } from "next";
import { getMessages, type Locale } from "@/lib/i18n";
import { getLegalPage } from "@/lib/legal";
import { routes, type LegalPageId } from "@/lib/routes";

export function legalMetadata(locale: Locale, id: LegalPageId): Metadata {
  const page = getLegalPage(locale, id);
  return {
    title: page.title,
    alternates: { languages: { et: routes.legal("et", id), en: routes.legal("en", id) } },
    robots: page.approved ? undefined : { index: false },
  };
}

export function LegalPage({ locale, id }: { locale: Locale; id: LegalPageId }) {
  const page = getLegalPage(locale, id);
  return (
    <article className="legal">
      <div className="page-intro">
        <h1>{page.title}</h1>
      </div>
      {!page.approved && <p className="notice">{getMessages(locale).legal.draftNotice}</p>}
      {page.sections.map((section) => (
        <section key={section.heading} className="product__section">
          <h2>{section.heading}</h2>
          {section.body.map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </section>
      ))}
    </article>
  );
}
