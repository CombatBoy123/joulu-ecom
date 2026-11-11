import { LOCALE_NAMES, LOCALES } from "@/lib/i18n";

// The bare domain. On Cloudflare Pages public/_redirects answers "/" with a
// real redirect before this page is ever served; the meta refresh in the
// layout is the fallback for local development and any other static host.
export const metadata = { robots: { index: false } };

export default function RootPage() {
  return (
    <ul>
      {LOCALES.map((locale) => (
        <li key={locale}>
          <a href={`/${locale}/`} lang={locale}>
            {LOCALE_NAMES[locale]}
          </a>
        </li>
      ))}
    </ul>
  );
}
