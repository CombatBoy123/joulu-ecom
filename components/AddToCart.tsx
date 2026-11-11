"use client";

import { useState } from "react";
import { cart } from "@/lib/cart-store";
import { MAX_QUANTITY } from "@/lib/order";

interface Props {
  productId: string;
  variants: { id: string; name: string }[];
  cartHref: string;
  text: {
    chooseOption: string;
    quantity: string;
    addToCart: string;
    added: string;
    viewCart: string;
    pickOptionFirst: string;
  };
}

export function AddToCart({ productId, variants, cartHref, text }: Props) {
  const [variantId, setVariantId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState<"added" | "pick" | null>(null);

  const add = (event: React.FormEvent) => {
    event.preventDefault();
    if (variants.length > 0 && variantId === null) return setMessage("pick");
    cart.add(productId, variantId, quantity);
    setMessage("added");
  };

  return (
    <form className="add-to-cart" onSubmit={add}>
      {variants.length > 0 && (
        <fieldset className="options">
          <legend>{text.chooseOption}</legend>
          {variants.map((v) => (
            <label key={v.id} className="options__item">
              <input
                type="radio"
                name="variant"
                value={v.id}
                checked={variantId === v.id}
                onChange={() => {
                  setVariantId(v.id);
                  setMessage(null);
                }}
              />
              <span>{v.name}</span>
            </label>
          ))}
        </fieldset>
      )}

      <div className="add-to-cart__row">
        <label className="quantity">
          <span>{text.quantity}</span>
          <select value={quantity} onChange={(e) => setQuantity(Number(e.target.value))}>
            {Array.from({ length: Math.min(10, MAX_QUANTITY) }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="button">
          {text.addToCart}
        </button>
      </div>

      <p className="add-to-cart__message" role="status">
        {message === "pick" && text.pickOptionFirst}
        {message === "added" && (
          <>
            {text.added} <a href={cartHref}>{text.viewCart}</a>
          </>
        )}
      </p>
    </form>
  );
}
