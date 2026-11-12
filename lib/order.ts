// Turns a cart into an order with prices. The browser uses it to show totals;
// the server uses it, against its own copy of the catalogue, to decide what
// is actually charged. Nothing the browser says about prices is ever used.
//
// No imports except types, so the tests and the Worker can both load it.

import type { Locale } from "./product-schema.ts";

export const MAX_LINES = 20;
export const MAX_QUANTITY = 20;

export interface CartLine {
  productId: string;
  variantId: string | null;
  quantity: number;
}

/** The least a product must carry to be priced. */
export interface Sellable {
  id: string;
  status: string;
  price: number;
  variants: { id: string }[];
  availability?: string;
}

export interface Shipping {
  id: string;
  country: string;
  priceCents: number;
}

export type OrderError =
  | "empty"
  | "too-many-lines"
  | "unknown-product"
  | "unavailable"
  | "variant-required"
  | "unknown-variant"
  | "unknown-shipping";

export type Order<P extends Sellable, S extends Shipping> =
  | {
      ok: true;
      lines: { product: P; variantId: string | null; quantity: number; unitCents: number; totalCents: number }[];
      itemsCents: number;
      shipping: S;
      totalCents: number;
    }
  | { ok: false; error: OrderError; productId?: string };

/** Accepts only a well-formed cart; anything else is null. */
export function parseCart(input: unknown): CartLine[] | null {
  if (!Array.isArray(input) || input.length > MAX_LINES) return null;
  const lines: CartLine[] = [];
  for (const raw of input) {
    if (typeof raw !== "object" || raw === null) return null;
    const { productId, variantId, quantity } = raw as Record<string, unknown>;
    if (typeof productId !== "string" || productId.length === 0 || productId.length > 100) return null;
    if (variantId !== null && (typeof variantId !== "string" || variantId.length > 100)) return null;
    if (typeof quantity !== "number" || !Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY) return null;
    lines.push({ productId, variantId, quantity });
  }
  return lines;
}

export function priceOrder<P extends Sellable, S extends Shipping>(
  cart: readonly CartLine[],
  shippingId: string,
  products: readonly P[],
  shippingMethods: readonly S[],
  /** Which products may be bought. The server only ever allows "active". */
  canBuy: (product: P) => boolean = (p) => p.status === "active" && p.availability !== "sold-out",
): Order<P, S> {
  if (cart.length === 0) return { ok: false, error: "empty" };
  if (cart.length > MAX_LINES) return { ok: false, error: "too-many-lines" };

  const shipping = shippingMethods.find((s) => s.id === shippingId);
  if (!shipping) return { ok: false, error: "unknown-shipping" };

  const lines = [];
  for (const line of cart) {
    const product = products.find((p) => p.id === line.productId);
    if (!product) return { ok: false, error: "unknown-product", productId: line.productId };
    if (!canBuy(product)) return { ok: false, error: "unavailable", productId: product.id };
    if (product.variants.length > 0) {
      if (line.variantId === null) return { ok: false, error: "variant-required", productId: product.id };
      if (!product.variants.some((v) => v.id === line.variantId)) {
        return { ok: false, error: "unknown-variant", productId: product.id };
      }
    } else if (line.variantId !== null) {
      return { ok: false, error: "unknown-variant", productId: product.id };
    }
    const unitCents = Math.round(product.price * 100);
    lines.push({ product, variantId: line.variantId, quantity: line.quantity, unitCents, totalCents: unitCents * line.quantity });
  }

  const itemsCents = lines.reduce((sum, l) => sum + l.totalCents, 0);
  return { ok: true, lines, itemsCents, shipping, totalCents: itemsCents + shipping.priceCents };
}

/** What the checkout form sends to the server. */
export interface CheckoutRequest {
  locale: Locale;
  cart: CartLine[];
  shippingId: string;
  recipientName: string;
  parcelMachine: string;
}
