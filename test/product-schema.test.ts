import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  specText,
  christmasCutoffDate,
  deliveryDays,
  netMarginEUR,
  priceCents,
  validateCatalog,
} from "../lib/product-schema.ts";

const load = () => JSON.parse(readFileSync(new URL("../products.json", import.meta.url), "utf8"));
const CATEGORIES = Object.keys(JSON.parse(readFileSync(new URL("../messages/et.json", import.meta.url), "utf8")).categories);

/** A product with every field filled in, i.e. one that may be sold. */
function ready() {
  const catalog = load();
  const p = catalog.products[1];
  Object.assign(p, {
    status: "active",
    shortDescription: { et: "Riputatav jõulusokk.", en: "Hanging Christmas stocking." },
    description: { et: "Tikitud jõulusokk.", en: "Embroidered Christmas stocking." },
    images: ["/products/christmas-stocking-decoration/1.webp"],
    specs: { material: { et: "Puuvill", en: "Cotton" }, dimensions: null, weightG: null },
  });
  Object.assign(p.supplier, { unitCostEUR: 2, shippingCostEUR: 1.5, warehouse: "DE", deliveryEstimateDaysEE: { min: 4, max: 8 } });
  Object.assign(p.safety, {
    manufacturerName: "Maker Ltd",
    manufacturerAddress: "1 Road, City",
    euResponsiblePersonName: "EU Rep OÜ",
    euResponsiblePersonAddress: "Tänav 1, Tartu",
    productIdentifier: "CS-01",
    warnings: { et: "Dekoratsioon, mitte mänguasi.", en: "Decoration, not a toy." },
  });
  return { catalog, p };
}

test("the owner's products.json is valid as it stands", () => {
  assert.deepEqual(validateCatalog(load(), CATEGORIES).errors, []);
});

test("a draft may be incomplete, and the report says what it still needs", () => {
  const report = validateCatalog(load(), CATEGORIES);
  const bandana = report.products.find((r) => r.id === "pet-bandana-christmas");
  assert.match(bandana!.blocking.join("\n"), /safety\.manufacturerName: missing/);
  assert.match(bandana!.blocking.join("\n"), /images: no product photo/);
  assert.match(bandana!.blocking.join("\n"), /description\.et: still contains TODO/);
});

test("a complete product may be active", () => {
  const { catalog } = ready();
  assert.deepEqual(validateCatalog(catalog, CATEGORIES).errors, []);
});

const notSellable: [string, (p: any) => void, RegExp][] = [
  ["no manufacturer", (p) => (p.safety.manufacturerName = null), /cannot be active.*manufacturerName/],
  ["no EU responsible person", (p) => (p.safety.euResponsiblePersonAddress = ""), /cannot be active.*euResponsiblePersonAddress/],
  ["no safety warning in Estonian", (p) => (p.safety.warnings.et = null), /cannot be active.*warnings\.et/],
  ["no photo", (p) => (p.images = []), /cannot be active.*images/],
  ["Estonian text awaiting review", (p) => (p.name.et += " TODO: check ET"), /cannot be active.*name\.et/],
  ["missing English description", (p) => (p.description.en = null), /cannot be active.*description\.en/],
  ["a material written in one language only", (p) => (p.specs.material = "Cotton"), /cannot be active.*specs\.material/],
  ["care instructions awaiting review", (p) => (p.care = { et: "Käsipesu. TODO: check ET", en: "Hand wash." }), /cannot be active.*care\.et/],
  ["a search title in one language only", (p) => (p.seo = { title: { et: "Jõulusokk", en: null }, description: { et: "a", en: "b" } }), /cannot be active.*seo\.title\.en/],
  ["variant the supplier cannot identify", (p) => (p.variants[0].supplierVariantName = "TBD"), /cannot be active.*supplierVariantName/],
];

for (const [name, breakIt, expected] of notSellable) {
  test(`refuses to put on sale: ${name}`, () => {
    const { catalog, p } = ready();
    breakIt(p);
    assert.match(validateCatalog(catalog, CATEGORIES).errors.join("\n"), expected);
  });
}

const malformed: [string, (p: any) => void, RegExp][] = [
  ["price as text", (p) => (p.price = "9.90"), /price/],
  ["price with three decimals", (p) => (p.price = 9.905), /price/],
  ["unknown status", (p) => (p.status = "live"), /status/],
  ["category without a name", (p) => (p.category = "toys"), /category/],
  ["hot-linked image", (p) => (p.images = ["https://example.com/a.jpg"]), /images/],
  ["duplicate slug", (p) => (p.slug = "jouluhelkur"), /more than once/],
  ["duplicate variant id", (p) => (p.variants[1].id = p.variants[0].id), /more than once/],
  ["warehouse as free text", (p) => (p.supplier.warehouse = "Germany"), /warehouse/],
  ["an illustration linked from another site", (p) => (p.illustration = "https://example.com/a.png"), /illustration/],
  ["an unknown availability", (p) => (p.availability = "soon"), /availability/],
  ["a material that is a number", (p) => (p.specs.material = 5), /specs\.material/],
  ["missing safety block", (p) => delete p.safety, /safety/],
];

for (const [name, breakIt, expected] of malformed) {
  test(`rejects even in a draft: ${name}`, () => {
    const catalog = load();
    breakIt(catalog.products[0]);
    assert.match(validateCatalog(catalog, CATEGORIES).errors.join("\n"), expected);
  });
}

test("prices in another currency or without VAT are rejected", () => {
  const catalog = load();
  catalog._meta.pricesIncludeVAT = false;
  assert.match(validateCatalog(catalog, CATEGORIES).errors.join("\n"), /pricesIncludeVAT/);
});

test("a thin margin on a product that is on sale is reported", () => {
  const { catalog, p } = ready();
  p.supplier.unitCostEUR = 4; // 8.90 / 1.24 − 4 − 1.5 = 1.68
  const report = validateCatalog(catalog, CATEGORIES);
  assert.deepEqual(report.errors, []);
  assert.match(report.warnings.join("\n"), /net margin is 1\.68 €/);
});

test("9.90 € is 990 cents, without floating-point drift", () => {
  assert.equal(priceCents({ price: 9.9 }), 990);
  assert.equal(priceCents({ price: 14.9 }), 1490);
});

test("margin is unknown until both costs are known", () => {
  const { catalog, p } = ready();
  assert.equal(netMarginEUR(p, catalog._meta)!.toFixed(2), "3.68");
  p.supplier.shippingCostEUR = null;
  assert.equal(netMarginEUR(p, catalog._meta), null);
});

test("only a known EU warehouse gets the later Christmas cutoff", () => {
  const { _meta } = load();
  const from = (warehouse: string | null) => christmasCutoffDate({ supplier: { warehouse } } as any, _meta);
  assert.equal(from("DE"), "2026-12-15");
  assert.equal(from("CN"), "2026-12-05");
  assert.equal(from("US"), "2026-12-05");
  assert.equal(from(null), "2026-12-05");
});

test("delivery estimate falls back to the shop-wide one", () => {
  const fallback = { min: 7, max: 14 };
  const days = (d: unknown) => deliveryDays({ supplier: { deliveryEstimateDaysEE: d } } as any, fallback);
  assert.deepEqual(days(null), fallback);
  assert.deepEqual(days(5), { min: 5, max: 5 });
  assert.deepEqual(days({ min: 4, max: 8 }), { min: 4, max: 8 });
});

test("optional fields are accepted when complete", () => {
  const { catalog, p } = ready();
  Object.assign(p, {
    packContents: { et: "1 sokk", en: "1 stocking" },
    care: { et: "Käsipesu.", en: "Hand wash." },
    availability: "sold-out",
    seo: { title: { et: "Jõulusokk", en: "Christmas stocking" }, description: { et: "Riputatav.", en: "Hanging." } },
  });
  assert.deepEqual(validateCatalog(catalog, CATEGORIES).errors, []);
});

test("a spec is shown in the visitor's language, and not at all when unknown", () => {
  assert.equal(specText({ et: "Puuvill", en: "Cotton" }, "et"), "Puuvill");
  assert.equal(specText({ et: null, en: "Cotton" }, "et"), "Cotton");
  assert.equal(specText(null, "et"), null);
});

test("an illustration is not a product photo: an active product still needs a real one", () => {
  const { catalog, p } = ready();
  p.images = [];
  p.illustration = "/images/illustrations/christmas-stocking-decoration.webp";
  assert.match(validateCatalog(catalog, CATEGORIES).errors.join("\n"), /cannot be active.*images: no product photo/);
});
