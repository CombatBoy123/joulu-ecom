"use client";

import { usePathname } from "next/navigation";
import { LOCALES, type Locale } from "@/lib/product-schema";
import { switchLocalePath } from "@/lib/routes";

interface Props {
  locale: Locale;
  names: Record<Locale, string>;
}

export function LanguageSwitch({ locale, names }: Props) {
  const pathname = usePathname();
  return (
    <ul className="language-switch">
      {LOCALES.map((l) => (
        <li key={l}>
          <a href={switchLocalePath(pathname, l)} lang={l} hrefLang={l} aria-current={l === locale ? "true" : undefined}>
            {l.toUpperCase()}
            <span className="visually-hidden"> – {names[l]}</span>
          </a>
        </li>
      ))}
    </ul>
  );
}
