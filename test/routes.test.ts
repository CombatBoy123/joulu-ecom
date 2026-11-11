import { test } from "node:test";
import assert from "node:assert/strict";
import { LEGAL_PAGE_IDS, pagePath, resolvePath, routes, switchLocalePath } from "../lib/routes.ts";

test("path words are translated, the slug is not", () => {
  assert.equal(routes.product("et", "jouluhelkur"), "/et/tooted/jouluhelkur/");
  assert.equal(routes.product("en", "jouluhelkur"), "/en/products/jouluhelkur/");
});

test("switching language keeps the visitor on the same page", () => {
  assert.equal(switchLocalePath("/et/tooted/jouluhelkur/", "en"), "/en/products/jouluhelkur/");
  assert.equal(switchLocalePath("/en/category/decor/", "et"), "/et/kategooria/decor/");
  assert.equal(switchLocalePath("/et/", "en"), "/en/");
  assert.equal(switchLocalePath("/en/", "en"), "/en/");
});


test("a URL resolves to its page only in its own language", () => {
  assert.deepEqual(resolvePath("et", []), { kind: "home" });
  assert.deepEqual(resolvePath("et", ["tooted", "x"]), { kind: "product", slug: "x" });
  assert.deepEqual(resolvePath("en", ["category", "decor"]), { kind: "category", slug: "decor" });
  assert.equal(resolvePath("en", ["tooted", "x"]), null);
  assert.equal(resolvePath("et", ["tooted"]), null);
  assert.equal(resolvePath("et", ["tooted", "x", "y"]), null);
});

test("pagePath and resolvePath are inverses", () => {
  const page = { kind: "product", slug: "x" } as const;
  assert.deepEqual(resolvePath("en", pagePath("en", page)), page);
});

test("cart, order and legal pages have a translated address in each language", () => {
  assert.equal(routes.cart("et"), "/et/ostukorv/");
  assert.equal(routes.order("en"), "/en/order/");
  assert.equal(routes.legal("et", "returns"), "/et/info/tagastamine/");
  assert.equal(switchLocalePath("/et/info/muugitingimused/", "en"), "/en/info/terms/");
  assert.equal(switchLocalePath("/en/cart/", "et"), "/et/ostukorv/");
  for (const id of LEGAL_PAGE_IDS) {
    assert.deepEqual(resolvePath("et", pagePath("et", { kind: "legal", id })), { kind: "legal", id });
  }
  assert.equal(resolvePath("en", ["info", "muugitingimused"]), null);
});

test("an unknown address falls back to the home page when switching language", () => {
  assert.equal(switchLocalePath("/et/midagi/muud/", "en"), "/en/");
});
