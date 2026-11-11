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

## 2. Product status (as of 11 Nov 2026)

| Product | Status | Supplier found | What's missing |
|---|---|---|---|
| Christmas pet bandana | draft | EPROLO listing | cost, warehouse, delivery time to EE, pick Christmas designs, GPSR info, own photos |
| Embroidered Christmas stocking (hanging decoration) | draft | EPROLO listing | confirm it's a hanging decoration not wearable socks, size, cost, warehouse, GPSR info |
| Felt ornament set | draft | none yet | everything — supplier still to find |
| Christmas tree reflector | **blocked** | none valid | certified supplier (EN 17353/EN 13356 + CE) |

### Things the owner must check personally (supplier accounts need a login)
- **Unit cost, shipping cost and real warehouse** — supplier pages only show these after you sign up (free) and log in. EPROLO's pages also show inventory as being in **US warehouses**, which would be slow and taxed for Estonia — check if EU/CN stock exists.
- **EU extra tax:** both EPROLO listings warn that each EU order gets an extra tax of **at least 6 USD**. On a €9.90 product that may wipe out the margin — verify with the shipping calculator for Estonia before activating.
- **Order 1 sample of each** before going live.

---

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
- Christmas beanie / scarf (light, sells into January)
- Gift bag + gift tag sets (cart add-on)
- Non-heated throw blanket (higher price, check shipping weight)

Add each one to `products.json` with `status: "draft"` using the same structure.
