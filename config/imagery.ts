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
//
// The current pictures are AI-generated mood images, not photographs of any
// product on sale. Keep it that way: never use one as a product photo.

export interface Photo {
  /** Path under public/, e.g. "/images/hero.webp". */
  src: string;
  /** What the photo shows, for visitors who cannot see it. */
  alt: { et: string; en: string };
  /** Where the photo came from and under what licence. */
  source: string;
}

// Estonian alt texts below: TODO: check ET
const CANVA = "Generated with Canva AI on 12 Nov 2026 from the shop's own prompt; file supplied by the owner.";

export const imagery: { hero: Photo | null; categories: Record<string, Photo> } = {
  hero: {
    src: "/images/hero.webp",
    alt: {
      et: "Hämar elutuba jõuluõhtul: põlev kamin, küünlad ja tuledes kuusk.",
      en: "A dim living room on Christmas evening: a lit fireplace, candles and a tree with lights.",
    },
    source: CANVA,
  },
  categories: {
    pets: {
      src: "/images/categories/pets.webp",
      alt: { et: "Kuldne retriiver lamab jõulukuuse kõrval vaibal.", en: "A golden retriever lying on a rug beside a Christmas tree." },
      source: CANVA,
    },
    decor: {
      src: "/images/categories/decor.webp",
      alt: { et: "Kuldsed ja veinipunased kuuseehted kuuseoksal.", en: "Gold and wine-red baubles on a fir branch." },
      source: CANVA,
    },
    accessories: {
      src: "/images/categories/accessories.webp",
      alt: { et: "Volditud valged ja veinipunased kudumid puidust pingil, taustal küünlad.", en: "Folded cream and wine-red knitwear on a wooden bench, candles behind." },
      source: CANVA,
    },
    "gift-wrap": {
      src: "/images/categories/gift-wrap.webp",
      alt: { et: "Jõupaberisse ja veinipunasesse paberisse pakitud kingid sametpaeltega.", en: "Presents wrapped in kraft and wine-red paper with velvet ribbons." },
      source: CANVA,
    },
    // home: no photograph yet.
  },
};
