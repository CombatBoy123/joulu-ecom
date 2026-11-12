# CLAUDE.md — Christmas Shop Website

## Project
A small Christmas/winter gift web shop run by one person in Estonia (Tartu county).
Products are dropshipped from suppliers with EU warehouses. The owner decides products, prices and suppliers elsewhere — **this repo is only the website**.

- Owner: web dev experience, e-commerce beginner, 10–20 h/week
- Budget is tiny (€100–300 total) → no paid themes, no paid SaaS unless I approve it
- Deadline: live and taking orders as early as possible, ideally before **27 Nov 2026** (Black Friday). Christmas Eve (24 Dec) is the main gift day in Estonia.
- Launch market: Estonia first (maybe Latvia/Finland later). Build so more countries can be added.

## Tech stack
- Framework: Next.js, built as a fully static site (`output: "export"`) — no Next.js server, API routes or middleware (decided 11 Nov 2026)
- Hosting: Cloudflare Workers (`wrangler.jsonc`): the static `out/` folder plus a small Worker in `worker/` that answers `/api/*`; deploy command `npx wrangler deploy` (decided 11 Nov 2026)
- Payments: Stripe Checkout (decided 11 Nov 2026)
- Database: none. Products are in `products.json`; a paid order lives in Stripe and is e-mailed by the webhook
- E-mail: Resend, optional and off until its key is set (`[owner to confirm]`)

If a field is still blank, ask me before choosing. Prefer the simplest option that works: static pages + a hosted checkout beats a custom backend.

## Commands
- `npm run dev` — local preview at http://localhost:3000; also lists `draft` products, marked with a badge
- `npm run build` — static site into `out/`, `active` products only (plus drafts while `previewDrafts` is on); stops with a list of problems if `products.json` is malformed or an `active` product is not ready to be sold
- `npm run validate` — table of every product and what it still needs before it can be `active`
- `npx wrangler dev` — after `npm run build`: the built site with its server side, as on Cloudflare (secrets from `.dev.vars`, see `.dev.vars.example`)
- `npm test` — unit tests
- `npm run typecheck` — TypeScript, including translation-key parity between `messages/et.json` and `messages/en.json`

## Where things live
- `products.json` — the product catalogue, single source of truth (guide: `PRODUCTS.md`, field reference and checks: `lib/product-schema.ts`). `supplier.*` is internal and never rendered.
- `config/imagery.ts` — hero and category photographs (file, alt text, where it came from); the build stops if a listed file is missing
- `config/shop.ts` — shop name, site address (`siteUrl`, used for sitemap, sharing previews and product data for search engines), shipping methods, countries, VAT status, fallback delivery estimate, and `previewDrafts` (pre-launch switch: shows drafts on the built site with a preview notice and hides the site from search engines; **must be `false` at launch**)
- `messages/et.json`, `messages/en.json` — all UI text, including category names (a new category needs a name in both)
- `app/[locale]/[[...path]]/page.tsx` — one route for home, products and categories (a static export cannot build a dynamic route with nothing to generate, e.g. no products on sale)
- `lib/routes.ts` — all URLs: `/et/tooted/<slug>/`, `/en/products/<slug>/`, `/et/kategooria/<slug>/`, `/en/category/<slug>/`
- `components/pages/` — the pages themselves
- `app/global-not-found.tsx`, `app/robots.ts`, `app/sitemap.ts` — the 404 page, and what search engines are told (everything is disallowed while `previewDrafts` is on)
- `content/legal.et.json`, `content/legal.en.json` — legal pages; each shows a "draft" notice and is hidden from search engines until its `approved` is `true`
- `lib/order.ts` — cart → priced order; the browser uses it for display, the server for what is charged
- `worker/` — server side: `POST /api/checkout` (creates the Stripe session from server-side prices), `GET /api/order` (is this session paid?), `POST /api/stripe-webhook` (signature-checked; sends the order e-mails)

## Money and data rules in the code
- The browser sends only product id, option and quantity. Prices, shipping cost and which products are buyable are decided in `worker/checkout.ts` from `products.json`.
- An order is paid only when Stripe says so: the confirmation page asks `/api/order`, and e-mails are sent only from a signature-verified webhook.
- `supplier.*` goes to the owner (Stripe metadata, owner e-mail) and never to a page or the customer. Browser code gets products only through `lib/public-catalog.ts`.
- The cart is in the browser's localStorage. The shop stores no customer data; name and parcel machine go to Stripe with the order, e-mail and phone are collected by Stripe.

## MVP scope (build in this order)
1. Product data in one file (`products.json` or similar) so I can add/remove products without touching code
2. Home page
3. Collection/category page
4. Product page
5. Cart
6. Checkout (hosted checkout from the payment provider — do not build card forms)
7. Order confirmation page + confirmation email
8. Legal pages (see Compliance)
9. Language switch Estonian ⇄ English

Not in MVP: user accounts, wishlists, blog, reviews system, live chat, multi-currency (EUR only).

## Languages
- Estonian is the default language, English second. All UI text lives in translation files, never hard-coded.
- I will write/approve the Estonian copy. Mark any Estonian you generate with `TODO: check ET` so I review it.

## Design direction
**"Noël" — a dark, candle-lit Christmas boutique** (owner's decision, 11 Nov 2026; replaces the earlier cream/red/green market-stall direction). The look comes from the owner's Noël prototype and is defined in `app/globals.css`:

- Colours: background `#100b09`, panels `#1c100e`, burgundy `#651b26`, champagne `#d9b995` (accent, buttons), cream `#f1e5d5` (text), muted `#b8a99b`.
- Type: Cormorant Garamond headings, with the accent word of a heading in champagne italic; Inter for everything else. Small uppercase, widely spaced "eyebrow" labels with a hairline rule.
- Shapes: pill buttons; bordered cards with small corner radii and only a slight lift on hover. No heavy shadows or oversized rounding.
- Pictures: photography, not illustration. Product photos belong to each product (`products.json` → `images`); the home-page hero and category tiles take photos listed in `config/imagery.ts`. A product without a photo may carry a stand-in picture (`illustration` in `products.json`, files in `public/images/illustrations/`): it is always labelled "illustrative image" and never counts as a product photo, so an `active` product still needs a real one. With neither, the site shows a plain candle-lit "photo pending" panel. No cartoon or geometric SVG art.
- Layout: less decoration, more art direction — generous spacing and a restrained editorial rhythm.
- Motion: light snowfall, hover lifts. Everything is off under `prefers-reduced-motion`.

Usability and conversion still come before decoration: clear prices, delivery estimate under every price, obvious purchase buttons, and it must work at 375px.

### From the prototype, deliberately NOT carried over
These would be invented claims or needless data collection in a real shop, so do not add them back without real data behind them:
- "Bestseller"/"Sale" badges and struck-through prices (no 30-day price history exists)
- discount codes and "limited time" promotions, free-delivery meters, countdowns, "online now"
- the demo product catalogue, reviews, newsletter sign-up and account page

### Still avoid
Purple/blue gradients, glassmorphism, neon glows, emoji as icons, fake-looking stock photos, floating 3D shapes, slogans that say nothing about the product.

## Required site elements
- **Christmas delivery banner** sitewide, driven by config (e.g. "Telli enne 10. detsembrit — jõuab jõuludeks"). Dates come from config, never hard-coded. After the cutoff it switches to a different message automatically.
- Delivery estimate on every product page, under the price
- Shipping options at checkout incl. parcel machines (Omniva / DPD / Smartpost) — can start as a simple dropdown with manual fulfilment
- Clear total price incl. VAT and shipping before payment
- Mobile-first: most buyers will be on phones. Test at 375px width.
- Fast: optimised images, no heavy libraries for simple things

## Compliance (EU / Estonia) — do not skip
- **No fake urgency or fake social proof.** No fake countdown timers, fake "12 people are viewing", fake stock counters, or invented reviews. These are illegal under EU consumer law.
- **Discount badges** ("-30%") must show the lowest price of the previous 30 days (EU Omnibus rule). If there is no real price history, don't show strike-through prices.
- **Product page safety info (GPSR):** fields for manufacturer name/address, EU responsible person name/address, product identifier, warnings/safety info, and an image of the product. Include these in the product data schema even if empty for now.
- **Legal pages** (I'll provide final text; create pages with placeholders): Terms of sale, Privacy policy (GDPR), Cookie policy, Returns & 14-day right of withdrawal (with a withdrawal form), Shipping info, Contact / company details.
- **Cookie consent** before any analytics or marketing pixels load. Essential cookies only by default.
- Checkout must state that pressing pay means an obligation to pay (e.g. button "Tellin ja maksan / Order with obligation to pay").
- Collect only the data needed for the order.

## Orders & fulfilment
- At launch I fulfil orders manually: each paid order must reach me by email (and/or a simple admin list) with items, quantities, customer name, address/parcel machine, phone and email.
- Customer gets a confirmation email in their language.
- Keep the order flow simple enough to later connect to a supplier API (e.g. CJdropshipping) — but don't build that integration now.

## How to work with me
- Ask before adding any dependency, paid service, or tracking script.
- Small steps, one feature at a time; tell me how to test each one.
- Use placeholder products and images until I give real ones. Never invent product claims (materials, certifications, "hypoallergenic", etc.).
- Keep secrets (API keys) in environment variables, never in the repo.
- When something touches money, law, or customer data, flag it and explain the risk in one or two lines.
