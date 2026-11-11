import type { ReactNode } from "react";
import { DEFAULT_LOCALE } from "@/lib/i18n";

// Layout of the bare domain only, whose single job is to forward to the
// default language. Real pages use app/[locale]/layout.tsx.
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang={DEFAULT_LOCALE}>
      <head>
        <meta httpEquiv="refresh" content={`0; url=/${DEFAULT_LOCALE}/`} />
      </head>
      <body>{children}</body>
    </html>
  );
}
