// Photographs used for atmosphere: the home-page hero and the category tiles.
// (Product photos are not here; they belong to each product in products.json.)
//
// To add one: put an optimised file in public/images/ (WebP or JPEG, hero
// about 2000 px wide, category tiles about 900 px wide) and list it below.
// Where nothing is listed, the site shows a plain candle-lit panel instead.
// The build stops if a listed file does not exist.
//
// Only use photographs the shop has the right to use, and record where each
// came from in `source`: that note is for the owner and is never shown.

export interface Photo {
  /** Path under public/, e.g. "/images/hero.webp". */
  src: string;
  /** What the photo shows, for visitors who cannot see it. */
  alt: { et: string; en: string };
  /** Where the photo came from and under what licence. */
  source: string;
}

export const imagery: { hero: Photo | null; categories: Record<string, Photo> } = {
  hero: null,
  categories: {
    // decor: { src: "/images/categories/decor.webp", alt: { et: "…", en: "…" }, source: "…" },
  },
};
