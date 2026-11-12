# PRODUCTS.md — Product catalogue implementation guide (for Claude Code)

Read this together with `CLAUDE.md`. The product data lives in **`products.json`** in the repo root.
This file explains the data, how to implement it, and what is still unverified.

---

## 1. How to implement

1. **Load `products.json` at build time** (or at request time if the stack needs it). It is the single source of truth — never hard-code product data in components.
2. **Only render products with `"status": "active"`.**
   - `draft` = being prepared, hide from the live site (OK to show in a local preview with a "DRAFT" badge).
   - `blocked` = must not appear anywhere public (compliance problem).
3. **Routes:** `/{lang}/tooted/{slug}` (ET) and `/{lang}/products/{slug}` (EN), or whatever the router pattern in `CLAUDE.md` decides. `slug` is the Estonian slug.
4. **Localised fields** are objects `{ "et": "...", "en": "..." }`. Fall back to `en` only if `et` is missing, and log a warning.
5. **Variants:** if `variants` is non-empty, require the customer to pick one before "Add to cart". Cart lines store `productId + variantId`.
6. **Prices:** `price` is in EUR **including 24% VAT**. Show it as `9,90 €` in ET and `€9.90` in EN.
   - `compareAtPrice` is `null` for all products. Do **not** show strike-through prices unless it is set (EU Omnibus rule).
7. **Images:**
   - `images` = the store's own images (empty for now → show a neutral placeholder).
   - `supplierImages` = links to the supplier's listing photos, **for reference only**. Do not hot-link them on the live site. When the owner confirms a product, download the chosen ones into `/public/products/{id}/`, convert to WebP, and move them into `images`.
8. **Product page must show:**
   - Name, price, variant picker, add-to-cart
   - Delivery estimate (from `supplier.deliveryEstimateDaysEE`, or a generic config value if null) + the Christmas cutoff banner from `_meta.christmasCutoff`
   - Description and specs (hide spec rows that are null — never print "null")
   - **Product safety section (GPSR):** manufacturer, EU responsible person, product identifier, warnings. If these are null, the product cannot be set to `active` (add a build-time check that fails or warns).
9. **Never display `supplier.*` data publicly** (cost, supplier name, URLs, notes). It's internal only. Keep it out of the client bundle if the stack allows.
10. **Order notification email** to the owner should include `supplier.url` and `supplierVariantName` for each line, so manual fulfilment is fast.

### Validation script (please create)
`scripts/validate-products.(js|ts)` that checks every product and prints a table:
- missing ET/EN text, or text containing `TODO`
- `status: active` but any `safety.*` field is null
- `status: active` but `images` is empty
- `status: active` but `supplier.unitCostEUR` is null
- margin check: if cost fields are filled, print `price / 1.24 − unitCost − shipping` (net margin before ads and fees) and flag anything under €3

---

## 2. Product status and validation (as of 12 Nov 2026)

Nothing below is verified against a supplier quote, a sample or a compliance document. "On site" means the value the preview site shows today; it is not a confirmed fact. Run `npm run validate` for the exact list of fields each product still lacks.

| Product | Price on site | Status | Verified | Unverified / missing | Owner decision needed |
|---|---|---|---|---|---|
| Christmas pet bandana | 9.90 € | draft | nothing | material ("nylon" is from the listing), dimensions, fit/closure, care, which designs, cost, warehouse, delivery time, manufacturer + EU responsible person, own photos | sizes or one size; keep or drop if the EU surcharge removes the margin |
| Embroidered Christmas stocking | 8.90 € | draft | nothing | that it is a hanging decoration and not socks, size, fibre, hanging loop, care, cost, warehouse, safety data, photos of each colour | which of the four colours to carry |
| Felt ornament set | 14.90 € | draft | nothing | supplier, piece count, sizes, material, small-parts/age suitability, everything else | whether to sell it at all before a supplier is found |
| Christmas beanie & scarf | 14.90 € (placeholder) | draft | nothing | supplier, adult or child, size, fibre, care, colours | price |
| Gift bag & tag set | 6.90 € (placeholder) | draft | nothing | supplier, quantity, bag sizes, paper, tag count | price |
| Throw blanket | 29.90 € (placeholder) | draft | nothing | supplier, size, fibre, weight, care, colours | price |
| Christmas tree reflector | 4.90 € | **blocked** | nothing | certified supplier (EN 17353 / EN 13356 + CE) | stays blocked until a certificate exists |

Recommended launch assortment: start with the two products that have a supplier listing (bandana, stocking) once samples confirm them, rather than six thin listings. The other four stay drafts.

### Optional product fields (all customer-facing)
Add these to a product in `products.json` when the facts are confirmed; leave them out otherwise.

- `specs.material`, `specs.dimensions` — `{ "et": "…", "en": "…" }`, or `null` while unknown (the row is then hidden)
- `packContents` — what is in the box, `{ et, en }`
- `care` — washing/care instructions, `{ et, en }`
- `availability` — `"sold-out"` keeps the page visible but removes the buy button; the server refuses the order too
- `seo` — `{ "title": { et, en }, "description": { et, en } }`; defaults to the name and short description

## 3. Supplier sources found

| Product | Source | Key facts from the listing |
|---|---|---|
| Pet bandana | [EPROLO – Pet Bandana for Dogs and Cats](https://eprolo.com/app/product/pet-bandana-for-dogs-and-cats-thanksgiving-christmas-halloween-pet-triangle-scarf-bib) | Nylon; 43/43/65 cm; ~30 designs, each with cut or hemmed edge; mixed holidays; ships within 24 h; 7-day apparel returns |
| Christmas stocking | [EPROLO – Christmas Stocking Decorations](https://eprolo.com/app/product/christmas-stocking-decorations-embroidered-decorations-christmas-hot-stamped-socks) | Cloth, embroidery; 4 colours (red, green, grey, dark red); ships within 24 h |
| Pet bandana (alternative, not recommended) | [Spocket – Ho Ho Ho Bandana](https://www.spocket.co/dropship/categories/pets/ho-ho-ho-bandana) | Handmade in California; cost $11.24, suggested retail $14.99; sizes Mini–Giant by neck size. Ships from the US → slow + duty for EU, too expensive for this budget |
| Reflector (reference only) | Uxcell tree-shaped reflectors sold on Walmart (US) | Retail ~$9–19 for 6–12 pcs. No EU certification evidence → not usable |

### Price reference (what buyers already see)
- Christmas pet bandanas in big US shops: roughly $5–15 each.
- Felt ornament sets in retail: roughly $10–30 per set.
- In Estonia, battery LED Christmas lights already sell from about €4.99 on local price-comparison sites — **dropshipping lights from China won't compete on price**, so lights are left out.

---

## 4. Next products to research (not in JSON yet)

Ideas only — no supplier, price or availability is confirmed for any of them. Sources are the references the idea came from, not suppliers.

| Idea | Category | Check before adding | Came from |
|---|---|---|---|
| LED window decoration / warm-white light chain | Winter home | EU-compliant supplier, power source, IP rating, batteries, CE declaration, instructions. Local shops sell battery lights from about 4.99 €, so price is hard to match (see section 3). | printandmerchandise.com Christmas theme |
| Wooden Christmas ornament set | Decorations | finish safety, sizes, piece count; EU rules restrict some chemicals and wood preservatives in decorations | promoonline.eu Christmas theme |
| Wrapping paper, ribbon and tag bundle | Gift wrapping | exact sheet count and lengths, materials | mpreklaam.ee Christmas products |
| Pet Christmas toy | Pets | durability, no small parts, supervision note; never call it "indestructible" | new idea |

Supplier search on 12 Nov 2026 found no supplier that verifiably stocks any of these in the EU and dropships to Estonia. Platforms worth checking by hand, none of them confirmed: Hertwill (says it ships from European warehouses), Syncee and Spocket (EU-warehouse filters).

Unverified, but relevant to margin on anything shipped from outside the EU: one shipping guide says the EU's duty exemption for parcels under 150 € ended on 1 July 2026 and a flat customs duty per item now applies. Confirm with the Estonian Tax and Customs Board before relying on a non-EU supplier.

Add each product to `products.json` with `status: "draft"` using the same structure once it has a real supplier.
