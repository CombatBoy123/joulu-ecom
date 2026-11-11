// npm run validate — checks products.json and prints what each product still
// needs before it can be sold. Exits with an error if the build would fail.

import { readFileSync } from "node:fs";
import { netMarginEUR, validateCatalog, type Catalog } from "../lib/product-schema.ts";

const read = (path: string) => JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8"));

const data = read("../products.json");
const knownCategories = Object.keys(read("../messages/et.json").categories);
const report = validateCatalog(data, knownCategories);

console.table(
  report.products.map((r) => {
    const product = (data as Catalog).products.find((p) => p.id === r.id);
    const margin = product && r.structure.length === 0 && report.meta.length === 0 ? netMarginEUR(product, data._meta) : null;
    return {
      product: r.id,
      status: r.status,
      "price €": product?.price ?? "?",
      "net margin €": margin === null ? "unknown" : margin.toFixed(2),
      "data errors": r.structure.length,
      "missing before sale": r.blocking.length,
      notes: r.advisory.length,
    };
  }),
);

for (const r of report.products) {
  if (r.structure.length + r.blocking.length + r.advisory.length === 0) continue;
  console.log(`\n${r.id} (${r.status})`);
  for (const m of r.structure) console.log(`  ERROR    ${m}`);
  for (const m of r.blocking) console.log(`  ${r.status === "active" ? "ERROR  " : "MISSING"}  ${m}`);
  for (const m of r.advisory) console.log(`  note     ${m}`);
}

const onSale = report.products.filter((r) => r.status === "active").length;
console.log(`\n${onSale} of ${report.products.length} products are on sale.`);

if (report.errors.length > 0) {
  console.error(`\n${report.errors.length} problem(s) would stop the build:`);
  for (const e of report.errors) console.error(`  - ${e}`);
  process.exit(1);
}
