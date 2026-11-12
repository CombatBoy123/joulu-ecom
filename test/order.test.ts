import { test } from "node:test";
import assert from "node:assert/strict";
import { parseCart, priceOrder } from "../lib/order.ts";

const products = [
  { id: "stocking", status: "active", price: 8.9, variants: [{ id: "red" }, { id: "green" }] },
  { id: "bag", status: "active", price: 6.9, variants: [] },
  { id: "draft", status: "draft", price: 1, variants: [] },
  { id: "reflector", status: "blocked", price: 4.9, variants: [] },
  { id: "gone", status: "active", price: 5, variants: [], availability: "sold-out" },
];
const shipping = [{ id: "omniva", country: "EE", priceCents: 399 }];
const line = (productId: string, variantId: string | null = null, quantity = 1) => ({ productId, variantId, quantity });

test("total is items plus shipping, in whole cents", () => {
  const order = priceOrder([line("stocking", "red", 3), line("bag", null, 2)], "omniva", products, shipping);
  assert.ok(order.ok);
  assert.equal(order.itemsCents, 3 * 890 + 2 * 690);
  assert.equal(order.totalCents, 3 * 890 + 2 * 690 + 399);
});

const refused: [string, ReturnType<typeof line>[], string, string][] = [
  ["an empty cart", [], "omniva", "empty"],
  ["a product that does not exist", [line("ghost")], "omniva", "unknown-product"],
  ["a draft product", [line("draft")], "omniva", "unavailable"],
  ["a blocked product", [line("reflector")], "omniva", "unavailable"],
  ["a sold-out product", [line("gone")], "omniva", "unavailable"],
  ["a product with options but none chosen", [line("stocking")], "omniva", "variant-required"],
  ["an option that does not exist", [line("stocking", "purple")], "omniva", "unknown-variant"],
  ["an option on a product without options", [line("bag", "red")], "omniva", "unknown-variant"],
  ["an unknown shipping method", [line("bag")], "free-shipping", "unknown-shipping"],
];
for (const [name, cart, shippingId, error] of refused) {
  test(`refuses ${name}`, () => {
    const order = priceOrder(cart, shippingId, products, shipping);
    assert.equal(order.ok, false);
    assert.equal(!order.ok && order.error, error);
  });
}

test("a cart from the browser is accepted only if well-formed", () => {
  assert.deepEqual(parseCart([line("bag", null, 2)]), [line("bag", null, 2)]);
  for (const bad of [
    "bag",
    [{ productId: "bag", variantId: null, quantity: 0 }],
    [{ productId: "bag", variantId: null, quantity: -1 }],
    [{ productId: "bag", variantId: null, quantity: 1.5 }],
    [{ productId: "bag", variantId: null, quantity: 21 }],
    [{ productId: "bag", variantId: null, quantity: "2" }],
    [{ productId: 7, variantId: null, quantity: 1 }],
    [{ productId: "bag", quantity: 1 }],
    Array.from({ length: 21 }, () => line("bag")),
  ]) {
    assert.equal(parseCart(bad), null, JSON.stringify(bad).slice(0, 60));
  }
});

test("extra fields such as a price sent by the browser are dropped", () => {
  assert.deepEqual(parseCart([{ ...line("bag"), price: 0.01, unitCents: 1 }]), [line("bag")]);
});
