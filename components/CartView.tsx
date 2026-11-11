"use client";

import { useEffect, useState } from "react";
import { cart, useCart } from "@/lib/cart-store";
import { fill, formatPrice, type Locale, type Messages } from "@/lib/i18n";
import { MAX_QUANTITY, priceOrder, type CheckoutRequest } from "@/lib/order";
import type { PublicProduct } from "@/lib/public-catalog";

interface ShippingOption {
  id: string;
  carrier: string;
  country: string;
  priceCents: number;
}

interface Props {
  locale: Locale;
  m: Messages;
  products: PublicProduct[];
  shipping: ShippingOption[];
  /** Local preview may put drafts in the cart; the server still refuses them. */
  allowDrafts: boolean;
  links: { home: string; terms: string; returns: string; product: Record<string, string> };
  placeholderImage: string;
}

export function CartView({ locale, m, products, shipping, allowDrafts, links, placeholderImage }: Props) {
  const stored = useCart();
  const [ready, setReady] = useState(false);
  const [shippingId, setShippingId] = useState(shipping[0]?.id ?? "");
  const [recipientName, setRecipientName] = useState("");
  const [parcelMachine, setParcelMachine] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => setReady(true), []);

  const canBuy = (p: PublicProduct) => p.status === "active" || (allowDrafts && p.status === "draft");
  // Lines whose product has since been withdrawn are dropped, with a note.
  const lines = stored.filter((l) => {
    const p = products.find((x) => x.id === l.productId);
    return p && canBuy(p) && (p.variants.length === 0 ? l.variantId === null : p.variants.some((v) => v.id === l.variantId));
  });
  const dropped = stored.length - lines.length;

  if (!ready) return <p aria-busy="true">&nbsp;</p>;
  if (lines.length === 0) {
    return (
      <>
        {dropped > 0 && <p className="notice">{m.cart.unavailableLine}</p>}
        <p>{m.cart.empty}</p>
        <p>
          <a className="button button--secondary" href={links.home}>
            {m.cart.continueShopping}
          </a>
        </p>
      </>
    );
  }

  const order = priceOrder(lines, shippingId, products, shipping, canBuy);
  if (!order.ok) return <p className="notice">{m.cart.errors.generic}</p>;

  const pay = async (event: React.FormEvent) => {
    event.preventDefault();
    if (recipientName.trim().length < 2 || parcelMachine.trim().length < 2) return setError(m.cart.errors.form);
    setError(null);
    setSending(true);
    try {
      const body: CheckoutRequest = { locale, cart: lines, shippingId, recipientName, parcelMachine };
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok && typeof data.url === "string") {
        window.location.assign(data.url);
        return;
      }
      const known = m.cart.errors as Record<string, string>;
      setError(known[data.error] ?? m.cart.errors.generic);
    } catch {
      setError(m.cart.errors.generic);
    }
    setSending(false);
  };

  return (
    <form className="cart" onSubmit={pay} noValidate>
      <div>
        {dropped > 0 && <p className="notice">{m.cart.unavailableLine}</p>}
        <ul className="cart__lines">
          {order.lines.map((line) => {
            const p = line.product;
            const variant = p.variants.find((v) => v.id === line.variantId);
            const name = p.name[locale] ?? p.name.en ?? p.id;
            const set = (q: number) => cart.setQuantity(p.id, line.variantId, q);
            return (
              <li key={`${p.id}/${line.variantId}`} className="cart-line">
                <img src={p.image ?? placeholderImage} alt="" width={80} height={80} />
                <div className="cart-line__text">
                  <a href={links.product[p.id]}>{name}</a>
                  {variant && <span className="cart-line__variant">{variant.name[locale] ?? variant.name.en}</span>}
                  <span className="cart-line__unit">{formatPrice(line.unitCents, locale)}</span>
                </div>
                <div className="cart-line__controls">
                  <div className="stepper">
                    <button type="button" aria-label={m.cart.decrease} disabled={line.quantity <= 1} onClick={() => set(line.quantity - 1)}>
                      −
                    </button>
                    <span aria-live="polite">{line.quantity}</span>
                    <button type="button" aria-label={m.cart.increase} disabled={line.quantity >= MAX_QUANTITY} onClick={() => set(line.quantity + 1)}>
                      +
                    </button>
                  </div>
                  <strong>{formatPrice(line.totalCents, locale)}</strong>
                  <button type="button" className="link-button" onClick={() => cart.remove(p.id, line.variantId)}>
                    {m.cart.remove}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="cart__checkout">
        <fieldset className="options options--stacked">
          <legend>{m.cart.shippingHeading}</legend>
          {shipping.map((s) => (
            <label key={s.id} className="options__item">
              <input type="radio" name="shipping" value={s.id} checked={shippingId === s.id} onChange={() => setShippingId(s.id)} />
              <span>{fill(m.cart.shippingOption, { carrier: s.carrier })}</span>
              <span className="options__price">{formatPrice(s.priceCents, locale)}</span>
            </label>
          ))}
        </fieldset>

        <label className="field">
          <span>{m.cart.parcelMachine}</span>
          <input
            type="text"
            value={parcelMachine}
            onChange={(e) => {
              setParcelMachine(e.target.value);
              setError(null);
            }}
            maxLength={150}
            required
            aria-describedby="parcel-hint"
          />
          <small id="parcel-hint">{m.cart.parcelMachineHint}</small>
        </label>
        <label className="field">
          <span>{m.cart.recipientName}</span>
          <input type="text" value={recipientName} onChange={(e) => {
              setRecipientName(e.target.value);
              setError(null);
            }} maxLength={100} autoComplete="name" required />
        </label>
        <p className="cart__note">{m.cart.contactNote}</p>

        <dl className="totals">
          <div>
            <dt>{m.cart.items}</dt>
            <dd>{formatPrice(order.itemsCents, locale)}</dd>
          </div>
          <div>
            <dt>{m.cart.shipping}</dt>
            <dd>{formatPrice(order.shipping.priceCents, locale)}</dd>
          </div>
          <div className="totals__total">
            <dt>{m.cart.total}</dt>
            <dd>{formatPrice(order.totalCents, locale)}</dd>
          </div>
        </dl>

        <p className="cart__note">
          {m.cart.legalNote} <a href={links.terms}>{m.cart.terms}</a> · <a href={links.returns}>{m.cart.returns}</a>
        </p>
        <p className="form-error" role="alert">
          {error}
        </p>
        <button type="submit" className="button button--pay" disabled={sending}>
          {sending ? m.cart.paying : m.cart.pay}
        </button>
      </div>
    </form>
  );
}
