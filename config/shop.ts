// Everything about the shop that the owner changes without touching code:
// dates, shipping, countries. Values marked TODO are placeholders that must be
// confirmed by the owner before launch.

export const shop = {
  /** TODO(owner): shop name, legal entity and contact details. */
  name: "Jõulupood",

  currency: "EUR",

  /**
   * Whether the seller is VAT-registered decides how prices are described
   * ("incl. VAT" or not) and what goes on receipts.
   * TODO(owner): set to true or false; null hides VAT wording entirely.
   */
  vatRegistered: null as boolean | null,

  /**
   * The Christmas order deadlines themselves live in products.json
   * (_meta.christmasCutoff). After this moment the banner is no longer shown.
   */
  christmasSeasonEnds: "2026-12-24T23:59:59+02:00",

  /**
   * Shown when a product has no delivery estimate of its own
   * (supplier.deliveryEstimateDaysEE is null). Working days.
   * TODO(owner): placeholder, not a real supplier figure.
   */
  defaultDeliveryDays: { min: 7, max: 14 },

  /** Countries the shop delivers to. Adding a country starts here. */
  countries: ["EE"],

  /**
   * Shipping methods offered at checkout, per country.
   * TODO(owner): prices are placeholders, not real carrier rates.
   */
  shipping: [
    { id: "omniva-parcel-machine", carrier: "Omniva", type: "parcel-machine", country: "EE", priceCents: 399 },
    { id: "dpd-parcel-machine", carrier: "DPD", type: "parcel-machine", country: "EE", priceCents: 399 },
    { id: "smartpost-parcel-machine", carrier: "Smartpost", type: "parcel-machine", country: "EE", priceCents: 399 },
  ],
} as const;

export type ShippingMethod = (typeof shop.shipping)[number];
