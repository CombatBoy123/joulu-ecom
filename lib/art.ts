// Which illustration stands in for a category or for a product that has no
// photo yet. The drawings are decoration and placeholders: they do not show
// the actual product, so they are never given the product's name as alt text.

type Scene = "hero" | "ornaments" | "fairylights" | "candles" | "wreaths" | "trees" | "presents";
type Art =
  | "bauble" | "ribbon" | "candle" | "wreath" | "tree" | "lights"
  | "garland" | "votive" | "star" | "minitree" | "pomander" | "curtain";
type Tone = "champagne" | "burgundy" | "green";

const CATEGORY_SCENE: Record<string, Scene> = {
  decor: "ornaments",
  pets: "wreaths",
  accessories: "fairylights",
  "gift-wrap": "presents",
  home: "candles",
  safety: "fairylights",
};

const CATEGORY_ART: Record<string, { art: Art; tone: Tone }> = {
  decor: { art: "bauble", tone: "champagne" },
  pets: { art: "ribbon", tone: "burgundy" },
  accessories: { art: "star", tone: "champagne" },
  "gift-wrap": { art: "pomander", tone: "burgundy" },
  home: { art: "votive", tone: "champagne" },
};

const PRODUCT_ART: Record<string, { art: Art; tone: Tone }> = {
  "christmas-stocking-decoration": { art: "star", tone: "burgundy" },
  "christmas-beanie-scarf": { art: "minitree", tone: "green" },
};

export function categoryScene(category: string): Scene {
  return CATEGORY_SCENE[category] ?? "ornaments";
}

export function placeholderArt(product: { id: string; category: string }): { art: Art; tone: Tone } {
  return PRODUCT_ART[product.id] ?? CATEGORY_ART[product.category] ?? { art: "bauble", tone: "champagne" };
}
