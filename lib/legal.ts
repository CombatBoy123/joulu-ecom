import et from "@/content/legal.et.json";
import en from "@/content/legal.en.json";
import type { Locale } from "./product-schema";
import type { LegalPageId } from "./routes";

export interface LegalPage {
  title: string;
  /** false = placeholder text, shown with a "draft" notice and kept out of search engines. */
  approved: boolean;
  sections: { heading: string; body: string[] }[];
}

const content: Record<Locale, Record<LegalPageId, LegalPage>> = { et, en };

export function getLegalPage(locale: Locale, id: LegalPageId): LegalPage {
  return content[locale][id];
}
