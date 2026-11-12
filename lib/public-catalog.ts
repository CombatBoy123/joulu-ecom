import type { Localized, Product } from "./product-schema";

/**
 * The part of a product the browser is allowed to have. Cart and checkout
 * code runs in the browser, so anything it is given ends up in the page:
 * supplier data must never be part of this.
 */
export interface PublicProduct {
  id: string;
  slug: string;
  status: string;
  availability: "available" | "sold-out";
  price: number;
  name: Localized;
  image: string | null;
  variants: { id: string; name: Localized }[];
}

export function toPublicProduct(product: Product): PublicProduct {
  return {
    id: product.id,
    slug: product.slug,
    status: product.status,
    availability: product.availability ?? "available",
    price: product.price,
    name: product.name,
    image: product.images[0] ?? null,
    variants: product.variants.map((v) => ({ id: v.id, name: v.name })),
  };
}
