// POST /api/stripe-webhook — Stripe calls this when a payment completes.
// This, not the customer's browser returning to the shop, is what makes an
// order "paid": it then goes to the owner and the customer by e-mail.

import type { Locale } from "../lib/product-schema.ts";
import { json } from "./checkout.ts";
import { verifyWebhook } from "./stripe.ts";

export interface EmailText {
  subject: string;
  greeting: string;
  body: string;
  total: string;
  delivery: string;
  signoff: string;
}

export interface WebhookDeps {
  webhookSecret: string | undefined;
  /** E-mail is sent through Resend when all three are set; otherwise skipped. */
  resendApiKey: string | undefined;
  emailFrom: string | undefined;
  ownerEmail: string | undefined;
  shopName: string;
  emailText: Record<Locale, EmailText>;
  fetchImpl: typeof fetch;
  now?: () => number;
}

const euros = (cents: number, locale: Locale) =>
  new Intl.NumberFormat(locale === "et" ? "et-EE" : "en-IE", { style: "currency", currency: "EUR" }).format(cents / 100);

async function sendEmail(deps: WebhookDeps, to: string, subject: string, text: string, idempotencyKey: string) {
  const response = await deps.fetchImpl("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${deps.resendApiKey}`,
      "Content-Type": "application/json",
      // Stripe may deliver the same event twice; this stops a second e-mail.
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify({ from: deps.emailFrom, to: [to], subject, text }),
  });
  if (!response.ok) throw new Error(`e-mail to ${to === deps.ownerEmail ? "owner" : "customer"} failed: ${response.status}`);
}

export async function handleWebhook(request: Request, deps: WebhookDeps): Promise<Response> {
  if (!deps.webhookSecret) return json(503, { error: "webhook-not-configured" });

  const payload = await request.text();
  const now = Math.floor((deps.now?.() ?? Date.now()) / 1000);
  if (!(await verifyWebhook(payload, request.headers.get("Stripe-Signature"), deps.webhookSecret, now))) {
    return json(400, { error: "invalid-signature" });
  }

  const event = JSON.parse(payload);
  const session = event?.data?.object;
  const paidNow =
    (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") &&
    session?.payment_status === "paid";
  if (!paidNow) return json(200, { received: true });

  if (!deps.resendApiKey || !deps.emailFrom || !deps.ownerEmail) {
    console.warn(`Order ${session.id} is paid but e-mail is not configured; see it in the Stripe dashboard.`);
    return json(200, { received: true, email: "not-configured" });
  }

  const meta: Record<string, string> = session.metadata ?? {};
  const locale: Locale = meta.locale === "en" ? "en" : "et";
  const lines = Object.keys(meta)
    .filter((k) => /^line_\d+$/.test(k))
    .sort((a, b) => Number(a.slice(5)) - Number(b.slice(5)))
    .map((k) => meta[k]);
  const total = euros(session.amount_total ?? 0, locale);
  const customer = session.customer_details ?? {};

  const ownerText = [
    `New paid order ${session.id}`,
    "",
    ...lines.map((l) => `- ${l}`),
    "",
    `Total paid: ${total}`,
    `Shipping: ${meta.shipping_method}`,
    `Parcel machine: ${meta.parcel_machine}`,
    `Recipient: ${meta.recipient_name}`,
    `Phone: ${customer.phone ?? "-"}`,
    `E-mail: ${customer.email ?? "-"}`,
    `Language: ${locale}`,
  ].join("\n");

  try {
    await sendEmail(deps, deps.ownerEmail, `New order: ${total}`, ownerText, `${event.id}-owner`);
    if (customer.email) {
      const t = deps.emailText[locale];
      const customerText = [
        t.greeting.replace("{name}", meta.recipient_name ?? ""),
        "",
        t.body,
        "",
        `${t.total}: ${total}`,
        `${t.delivery}: ${meta.parcel_machine}`,
        "",
        t.signoff,
        deps.shopName,
      ].join("\n");
      await sendEmail(deps, customer.email, t.subject.replace("{shop}", deps.shopName), customerText, `${event.id}-customer`);
    }
  } catch (error) {
    // A failure answer makes Stripe deliver the event again later.
    console.error(String(error));
    return json(500, { error: "email-failed" });
  }
  return json(200, { received: true, email: "sent" });
}
