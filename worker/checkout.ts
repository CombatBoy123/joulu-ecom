// POST /api/checkout — turns a cart into a Stripe Checkout session.
// GET  /api/order    — tells the confirmation page whether a session was paid.

import { priceOrder, parseCart, type CheckoutRequest, type OrderError } from "../lib/order.ts";
import { LOCALES, type Locale, type Product } from "../lib/product-schema.ts";
import { stripeRequest } from "./stripe.ts";

export interface ShippingMethod {
  id: string;
  carrier: string;
  type: string;
  country: string;
  priceCents: number;
}

export interface CheckoutDeps {
  stripeSecretKey: string | undefined;
  products: Product[];
  shipping: readonly ShippingMethod[];
  /** Words the server itself puts on the Stripe page. */
  text: Record<Locale, { parcelMachine: string }>;
  paths: Record<Locale, { order: string; cart: string }>;
  fetchImpl: typeof fetch;
}

export const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });

/** Trimmed single-line text within a length, or null. */
function cleanText(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const text = value.replace(/\s+/g, " ").trim();
  return text.length >= 2 && text.length <= max ? text : null;
}

function parseRequest(body: unknown): CheckoutRequest | null {
  if (typeof body !== "object" || body === null) return null;
  const b = body as Record<string, unknown>;
  const cart = parseCart(b.cart);
  const recipientName = cleanText(b.recipientName, 100);
  const parcelMachine = cleanText(b.parcelMachine, 150);
  if (!cart || !recipientName || !parcelMachine) return null;
  if (typeof b.locale !== "string" || !(LOCALES as readonly string[]).includes(b.locale)) return null;
  if (typeof b.shippingId !== "string") return null;
  return { locale: b.locale as Locale, cart, shippingId: b.shippingId, recipientName, parcelMachine };
}

export async function createCheckout(request: Request, deps: CheckoutDeps): Promise<Response> {
  if (!deps.stripeSecretKey) return json(503, { error: "payments-not-configured" });

  let body: unknown;
  try {
    body = JSON.parse((await request.text()).slice(0, 20_000));
  } catch {
    return json(400, { error: "invalid-request" });
  }
  const input = parseRequest(body);
  if (!input) return json(400, { error: "invalid-request" });

  // Prices come from the server's own catalogue. Only "active" products can
  // be bought, whatever the browser's cart contains.
  const order = priceOrder(input.cart, input.shippingId, deps.products, deps.shipping);
  if (!order.ok) {
    return json(400, { error: order.error satisfies OrderError, productId: order.productId });
  }

  const { locale } = input;
  const origin = new URL(request.url).origin;
  const metadata: Record<string, string> = {
    locale,
    recipient_name: input.recipientName,
    shipping_method: order.shipping.id,
    parcel_machine: input.parcelMachine,
  };
  // One line per item for the owner: what to order from the supplier.
  order.lines.forEach((line, i) => {
    const variant = line.product.variants.find((v) => v.id === line.variantId);
    metadata[`line_${i + 1}`] = [
      `${line.quantity} x ${line.product.id}${variant ? ` / ${variant.id}` : ""}`,
      variant?.supplierVariantName ? `supplier option: ${variant.supplierVariantName}` : null,
      line.product.supplier.url,
    ]
      .filter(Boolean)
      .join(" | ")
      .slice(0, 500);
  });

  const session = await stripeRequest(
    deps.stripeSecretKey,
    "POST",
    "/checkout/sessions",
    {
      mode: "payment",
      locale,
      line_items: order.lines.map((line) => {
        const variant = line.product.variants.find((v) => v.id === line.variantId);
        const name = line.product.name[locale] ?? line.product.name.en ?? line.product.id;
        const variantName = variant ? (variant.name[locale] ?? variant.name.en) : null;
        return {
          quantity: line.quantity,
          price_data: {
            currency: "eur",
            unit_amount: line.unitCents,
            product_data: { name: variantName ? `${name} – ${variantName}` : name },
          },
        };
      }),
      shipping_options: [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            display_name: `${order.shipping.carrier} ${deps.text[locale].parcelMachine}: ${input.parcelMachine}`.slice(0, 100),
            fixed_amount: { amount: order.shipping.priceCents, currency: "eur" },
          },
        },
      ],
      // Stripe collects the e-mail address itself; the phone number is needed
      // for the parcel-machine notification.
      phone_number_collection: { enabled: true },
      metadata,
      success_url: `${origin}${deps.paths[locale].order}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}${deps.paths[locale].cart}`,
    },
    deps.fetchImpl,
  );

  if (!session.ok || typeof session.data?.url !== "string") {
    console.error("Stripe refused to create a checkout session", session.status, session.data?.error?.message);
    return json(502, { error: "payment-provider-error" });
  }
  return json(200, { url: session.data.url });
}

/**
 * The confirmation page asks here instead of trusting its own address: only
 * Stripe's answer decides whether the order is shown as paid.
 */
export async function orderStatus(request: Request, deps: Pick<CheckoutDeps, "stripeSecretKey" | "fetchImpl">): Promise<Response> {
  if (!deps.stripeSecretKey) return json(503, { error: "payments-not-configured" });
  const sessionId = new URL(request.url).searchParams.get("session_id") ?? "";
  if (!/^cs_(test|live)_[A-Za-z0-9]{10,200}$/.test(sessionId)) return json(400, { error: "invalid-request" });

  const session = await stripeRequest(deps.stripeSecretKey, "GET", `/checkout/sessions/${sessionId}`, undefined, deps.fetchImpl);
  if (!session.ok) return json(session.status === 404 ? 404 : 502, { error: "not-found" });

  // Only what the page needs. No name, address or e-mail leaves the server.
  return json(200, {
    paid: session.data.payment_status === "paid",
    totalCents: typeof session.data.amount_total === "number" ? session.data.amount_total : null,
  });
}
