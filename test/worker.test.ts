import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createCheckout, orderStatus, type CheckoutDeps } from "../worker/checkout.ts";
import { formEncode, signPayload, verifyWebhook } from "../worker/stripe.ts";
import { handleWebhook, type WebhookDeps } from "../worker/webhook.ts";

// ---- helpers ----

/** The owner's catalogue with the stocking made sellable. */
function products() {
  const { products } = JSON.parse(readFileSync(new URL("../products.json", import.meta.url), "utf8"));
  products.find((p: any) => p.id === "christmas-stocking-decoration").status = "active";
  return products;
}

/** A stand-in for the network that records what was sent. */
function fakeFetch(answer: (url: string, init: RequestInit) => { status?: number; body: unknown }) {
  const calls: { url: string; init: RequestInit }[] = [];
  const impl = (async (url: any, init: any = {}) => {
    calls.push({ url: String(url), init });
    const { status = 200, body } = answer(String(url), init);
    return new Response(JSON.stringify(body), { status });
  }) as typeof fetch;
  return { impl, calls };
}

function checkoutDeps(fetchImpl: typeof fetch, over: Partial<CheckoutDeps> = {}): CheckoutDeps {
  return {
    stripeSecretKey: "sk_test_x",
    products: products(),
    shipping: [{ id: "omniva-parcel-machine", carrier: "Omniva", type: "parcel-machine", country: "EE", priceCents: 399 }],
    text: { et: { parcelMachine: "pakiautomaat" }, en: { parcelMachine: "parcel machine" } },
    paths: { et: { order: "/et/tellimus/", cart: "/et/ostukorv/" }, en: { order: "/en/order/", cart: "/en/cart/" } },
    fetchImpl,
    ...over,
  };
}

const checkoutRequest = (body: unknown) =>
  new Request("https://shop.example/api/checkout", { method: "POST", body: typeof body === "string" ? body : JSON.stringify(body) });

const validBody = {
  locale: "et",
  cart: [{ productId: "christmas-stocking-decoration", variantId: "red", quantity: 2 }],
  shippingId: "omniva-parcel-machine",
  recipientName: "Mari Maasikas",
  parcelMachine: "Tartu Lõunakeskuse pakiautomaat",
};

const sent = (init: RequestInit) => new URLSearchParams(String(init.body));

// ---- checkout ----

test("checkout charges the catalogue price, never one from the browser", async () => {
  const stripe = fakeFetch(() => ({ body: { url: "https://checkout.stripe.com/c/pay/cs_test_1" } }));
  const body = { ...validBody, cart: [{ ...validBody.cart[0], price: 0.01, unitCents: 1 }], totalCents: 1 };
  const response = await createCheckout(checkoutRequest(body), checkoutDeps(stripe.impl));

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { url: "https://checkout.stripe.com/c/pay/cs_test_1" });

  const form = sent(stripe.calls[0]!.init);
  assert.equal(stripe.calls[0]!.url, "https://api.stripe.com/v1/checkout/sessions");
  assert.equal((stripe.calls[0]!.init.headers as any).Authorization, "Bearer sk_test_x");
  assert.equal(form.get("line_items[0][price_data][unit_amount]"), "890");
  assert.equal(form.get("line_items[0][quantity]"), "2");
  assert.equal(form.get("line_items[0][price_data][currency]"), "eur");
  assert.equal(form.get("line_items[0][price_data][product_data][name]"), "Tikitud jõulusokk (kaunistus) – Punane");
  assert.equal(form.get("shipping_options[0][shipping_rate_data][fixed_amount][amount]"), "399");
  assert.equal(form.get("locale"), "et");
  assert.equal(form.get("success_url"), "https://shop.example/et/tellimus/?session_id={CHECKOUT_SESSION_ID}");
  assert.equal(form.get("cancel_url"), "https://shop.example/et/ostukorv/");
});

test("the order carries what the owner needs to fulfil it, for the owner only", async () => {
  const stripe = fakeFetch(() => ({ body: { url: "https://checkout.stripe.com/x" } }));
  await createCheckout(checkoutRequest(validBody), checkoutDeps(stripe.impl));
  const form = sent(stripe.calls[0]!.init);
  assert.equal(form.get("metadata[recipient_name]"), "Mari Maasikas");
  assert.equal(form.get("metadata[parcel_machine]"), "Tartu Lõunakeskuse pakiautomaat");
  assert.match(form.get("metadata[line_1]")!, /^2 x christmas-stocking-decoration \/ red \| supplier option: Red hot stamping socks 01 \| https:\/\/eprolo\.com/);
  // The supplier never appears in anything the customer sees on Stripe's page.
  assert.doesNotMatch(form.get("line_items[0][price_data][product_data][name]")!, /eprolo|stamping/i);
});

const rejected: [string, unknown, number, string][] = [
  ["a draft product", { ...validBody, cart: [{ productId: "pet-bandana-christmas", variantId: "design-tbd-cut", quantity: 1 }] }, 400, "unavailable"],
  ["the blocked reflector", { ...validBody, cart: [{ productId: "christmas-reflector", variantId: null, quantity: 1 }] }, 400, "unavailable"],
  ["a negative quantity", { ...validBody, cart: [{ ...validBody.cart[0], quantity: -5 }] }, 400, "invalid-request"],
  ["a missing option", { ...validBody, cart: [{ ...validBody.cart[0], variantId: null }] }, 400, "variant-required"],
  ["an invented shipping method", { ...validBody, shippingId: "free" }, 400, "unknown-shipping"],
  ["no recipient name", { ...validBody, recipientName: " " }, 400, "invalid-request"],
  ["an unknown language", { ...validBody, locale: "ru" }, 400, "invalid-request"],
  ["a body that is not JSON", "<html>", 400, "invalid-request"],
];
for (const [name, body, status, error] of rejected) {
  test(`checkout rejects ${name} without contacting Stripe`, async () => {
    const stripe = fakeFetch(() => ({ body: {} }));
    const response = await createCheckout(checkoutRequest(body), checkoutDeps(stripe.impl));
    assert.equal(response.status, status);
    assert.equal((await response.json()).error, error);
    assert.equal(stripe.calls.length, 0);
  });
}

test("checkout refuses a product that has sold out since it was put in the cart", async () => {
  const stripe = fakeFetch(() => ({ body: {} }));
  const list = products();
  list.find((p: any) => p.id === "christmas-stocking-decoration").availability = "sold-out";
  const response = await createCheckout(checkoutRequest(validBody), checkoutDeps(stripe.impl, { products: list }));
  assert.equal(response.status, 400);
  assert.equal((await response.json()).error, "unavailable");
  assert.equal(stripe.calls.length, 0);
});

test("without a Stripe key the shop says payment is not open", async () => {
  const stripe = fakeFetch(() => ({ body: {} }));
  const response = await createCheckout(checkoutRequest(validBody), checkoutDeps(stripe.impl, { stripeSecretKey: undefined }));
  assert.equal(response.status, 503);
  assert.equal(stripe.calls.length, 0);
});

test("a Stripe failure is reported without leaking Stripe's message", async () => {
  const stripe = fakeFetch(() => ({ status: 401, body: { error: { message: "Invalid API Key provided: sk_test_x" } } }));
  const response = await createCheckout(checkoutRequest(validBody), checkoutDeps(stripe.impl));
  assert.equal(response.status, 502);
  assert.deepEqual(await response.json(), { error: "payment-provider-error" });
});

// ---- order status ----

const SESSION = "cs_test_a1B2c3D4e5F6g7H8";
const statusRequest = (id: string) => new Request(`https://shop.example/api/order?session_id=${id}`);

test("order status reports paid only when Stripe says so, and nothing personal", async () => {
  const paid = fakeFetch(() => ({ body: { payment_status: "paid", amount_total: 2179, customer_details: { email: "a@b.ee" } } }));
  const response = await orderStatus(statusRequest(SESSION), { stripeSecretKey: "sk_test_x", fetchImpl: paid.impl });
  assert.deepEqual(await response.json(), { paid: true, totalCents: 2179 });
  assert.equal(paid.calls[0]!.url, `https://api.stripe.com/v1/checkout/sessions/${SESSION}`);

  const unpaid = fakeFetch(() => ({ body: { payment_status: "unpaid", amount_total: 2179 } }));
  const second = await orderStatus(statusRequest(SESSION), { stripeSecretKey: "sk_test_x", fetchImpl: unpaid.impl });
  assert.equal((await second.json()).paid, false);
});

test("order status refuses anything that is not a session id", async () => {
  const stripe = fakeFetch(() => ({ body: {} }));
  for (const id of ["", "paid", "../../charges", "cs_test_", "pi_123456789012"]) {
    const response = await orderStatus(statusRequest(id), { stripeSecretKey: "sk_test_x", fetchImpl: stripe.impl });
    assert.equal(response.status, 400, id);
  }
  assert.equal(stripe.calls.length, 0);
});

// ---- webhook ----

const SECRET = "whsec_test";
const NOW = 1_800_000_000;

const paidEvent = (over: Record<string, unknown> = {}) =>
  JSON.stringify({
    id: "evt_1",
    type: "checkout.session.completed",
    data: {
      object: {
        id: SESSION,
        payment_status: "paid",
        amount_total: 2179,
        customer_details: { email: "mari@example.ee", phone: "+3725550000" },
        metadata: {
          locale: "et",
          recipient_name: "Mari Maasikas",
          shipping_method: "omniva-parcel-machine",
          parcel_machine: "Tartu Lõunakeskuse pakiautomaat",
          line_1: "2 x christmas-stocking-decoration / red | supplier option: Red hot stamping socks 01",
        },
        ...over,
      },
    },
  });

async function webhookRequest(payload: string, secret = SECRET, timestamp = NOW) {
  const signature = await signPayload(secret, timestamp, payload);
  return new Request("https://shop.example/api/stripe-webhook", {
    method: "POST",
    body: payload,
    headers: { "Stripe-Signature": `t=${timestamp},v1=${signature}` },
  });
}

function webhookDeps(fetchImpl: typeof fetch, over: Partial<WebhookDeps> = {}): WebhookDeps {
  const text = { subject: "Sinu tellimus poest {shop}", greeting: "Tere, {name}!", body: "Aitäh.", total: "Tasutud summa", delivery: "Pakiautomaat", signoff: "Parimat" };
  return {
    webhookSecret: SECRET,
    resendApiKey: "re_x",
    emailFrom: "pood@example.ee",
    ownerEmail: "omanik@example.ee",
    shopName: "Jõulupood",
    emailText: { et: text, en: text },
    fetchImpl,
    now: () => NOW * 1000,
    ...over,
  };
}

test("a signed, paid order is e-mailed to the owner and the customer", async () => {
  const mail = fakeFetch(() => ({ body: { id: "email_1" } }));
  const response = await handleWebhook(await webhookRequest(paidEvent()), webhookDeps(mail.impl));
  assert.equal(response.status, 200);
  assert.equal(mail.calls.length, 2);

  const [owner, customer] = mail.calls.map((c) => JSON.parse(String(c.init.body)));
  assert.deepEqual(owner.to, ["omanik@example.ee"]);
  for (const part of ["2 x christmas-stocking-decoration / red", "Red hot stamping socks 01", "Mari Maasikas", "Tartu Lõunakeskuse pakiautomaat", "+3725550000", "mari@example.ee", "21,79"]) {
    assert.ok(owner.text.includes(part), `owner e-mail lacks ${part}`);
  }
  assert.deepEqual(customer.to, ["mari@example.ee"]);
  assert.equal(customer.subject, "Sinu tellimus poest Jõulupood");
  assert.match(customer.text, /Tere, Mari Maasikas!/);
  assert.match(customer.text, /21,79/);
  // The customer is never told who the supplier is.
  assert.doesNotMatch(customer.text, /stamping|supplier/i);
  // A repeated delivery of the same event must not send a second e-mail.
  assert.equal((mail.calls[0]!.init.headers as any)["Idempotency-Key"], "evt_1-owner");
});

const forged: [string, () => Promise<Request>][] = [
  ["no signature", async () => new Request("https://shop.example/api/stripe-webhook", { method: "POST", body: paidEvent() })],
  ["a signature made with another secret", () => webhookRequest(paidEvent(), "whsec_attacker")],
  ["a body changed after signing", async () => {
    const real = await webhookRequest(paidEvent());
    return new Request(real.url, { method: "POST", body: paidEvent({ amount_total: 1 }), headers: real.headers });
  }],
  ["an old, replayed message", () => webhookRequest(paidEvent(), SECRET, NOW - 3600)],
];
for (const [name, build] of forged) {
  test(`webhook ignores ${name}`, async () => {
    const mail = fakeFetch(() => ({ body: {} }));
    const response = await handleWebhook(await build(), webhookDeps(mail.impl));
    assert.equal(response.status, 400);
    assert.equal(mail.calls.length, 0);
  });
}

test("an unpaid session sends nothing", async () => {
  const mail = fakeFetch(() => ({ body: {} }));
  const response = await handleWebhook(await webhookRequest(paidEvent({ payment_status: "unpaid" })), webhookDeps(mail.impl));
  assert.equal(response.status, 200);
  assert.equal(mail.calls.length, 0);
});

test("a failed e-mail makes Stripe try again later", async () => {
  const mail = fakeFetch(() => ({ status: 500, body: {} }));
  const response = await handleWebhook(await webhookRequest(paidEvent()), webhookDeps(mail.impl));
  assert.equal(response.status, 500);
});

test("without e-mail settings a paid order is still acknowledged", async () => {
  const mail = fakeFetch(() => ({ body: {} }));
  const response = await handleWebhook(await webhookRequest(paidEvent()), webhookDeps(mail.impl, { resendApiKey: undefined }));
  assert.equal(response.status, 200);
  assert.equal(mail.calls.length, 0);
});

// ---- encoding ----

test("nested data is written the way Stripe's API expects", () => {
  assert.equal(
    decodeURIComponent(formEncode({ mode: "payment", line_items: [{ quantity: 2, price_data: { currency: "eur" } }], skip: null })),
    "mode=payment&line_items[0][quantity]=2&line_items[0][price_data][currency]=eur",
  );
});

test("verifyWebhook accepts only the right secret within the time window", async () => {
  const signature = await signPayload(SECRET, NOW, "{}");
  assert.equal(await verifyWebhook("{}", `t=${NOW},v1=${signature}`, SECRET, NOW + 10), true);
  assert.equal(await verifyWebhook("{}", `t=${NOW},v1=${signature}`, "other", NOW + 10), false);
  assert.equal(await verifyWebhook("{}", `t=${NOW},v1=${signature}`, SECRET, NOW + 301), false);
  assert.equal(await verifyWebhook("{}", "garbage", SECRET, NOW), false);
});
