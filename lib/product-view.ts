import { shop } from "@/config/shop";
import { fill, type Messages } from "./i18n";
import { christmasCutoffDate, deliveryDays, endOfDayInEstonia, type Product } from "./product-schema";
import { meta, products } from "./products";

export const PLACEHOLDER_IMAGE = "/images/placeholder.svg";

export function deliveryText(product: Product, m: Messages): string {
  const { min, max } = deliveryDays(product, shop.defaultDeliveryDays);
  return fill(min === max ? m.product.deliverySame : m.product.delivery, { min, max });
}

/** The moment after which this product no longer arrives before Christmas. */
export function productCutoff(product: Product): string {
  return endOfDayInEstonia(christmasCutoffDate(product, meta));
}

/**
 * The sitewide deadline is the earliest one among the products on sale, so
 * the banner never promises more than every product can keep.
 */
export function shopCutoff(): string {
  const dates =
    products.length > 0
      ? products.map((p) => christmasCutoffDate(p, meta))
      : Object.values(meta.christmasCutoff);
  return endOfDayInEstonia(dates.sort()[0]!);
}
