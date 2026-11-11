// The server side of the shop, running as a Cloudflare Worker next to the
// static site. It only answers /api/*; every other address is a static file.
//
// Secrets come from the Cloudflare dashboard (or .dev.vars locally), never
// from the repository: see .dev.vars.example.

import catalog from "../products.json";
import et from "../messages/et.json";
import en from "../messages/en.json";
import { shop } from "../config/shop.ts";
import type { Product } from "../lib/product-schema.ts";
import { routes } from "../lib/routes.ts";
import { createCheckout, json, orderStatus } from "./checkout.ts";
import { handleWebhook } from "./webhook.ts";

interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> };
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  RESEND_API_KEY?: string;
  ORDER_EMAIL_FROM?: string;
  ORDER_EMAIL_TO?: string;
}

const products = catalog.products as unknown as Product[];

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url);
    if (!pathname.startsWith("/api/")) return env.ASSETS.fetch(request);

    const fetchImpl: typeof fetch = (input, init) => fetch(input, init);
    try {
      if (pathname === "/api/checkout" && request.method === "POST") {
        return await createCheckout(request, {
          stripeSecretKey: env.STRIPE_SECRET_KEY,
          products,
          shipping: shop.shipping,
          text: { et: { parcelMachine: et.cart.parcelMachineWord }, en: { parcelMachine: en.cart.parcelMachineWord } },
          paths: {
            et: { order: routes.order("et"), cart: routes.cart("et") },
            en: { order: routes.order("en"), cart: routes.cart("en") },
          },
          fetchImpl,
        });
      }
      if (pathname === "/api/order" && request.method === "GET") {
        return await orderStatus(request, { stripeSecretKey: env.STRIPE_SECRET_KEY, fetchImpl });
      }
      if (pathname === "/api/stripe-webhook" && request.method === "POST") {
        return await handleWebhook(request, {
          webhookSecret: env.STRIPE_WEBHOOK_SECRET,
          resendApiKey: env.RESEND_API_KEY,
          emailFrom: env.ORDER_EMAIL_FROM,
          ownerEmail: env.ORDER_EMAIL_TO,
          shopName: shop.name,
          emailText: { et: et.email, en: en.email },
          fetchImpl,
        });
      }
      return json(404, { error: "not-found" });
    } catch (error) {
      console.error(error);
      return json(500, { error: "server-error" });
    }
  },
};
