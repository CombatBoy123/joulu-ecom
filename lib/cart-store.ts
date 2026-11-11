"use client";

import { useSyncExternalStore } from "react";
import { MAX_LINES, MAX_QUANTITY, parseCart, type CartLine } from "./order";

// The cart lives in the visitor's browser and holds only product id, option
// and quantity. Prices are never stored: they are looked up when shown and
// decided by the server when paying.

const KEY = "cart.v1";
const EVENT = "cart-change";
const EMPTY: CartLine[] = [];

let cached: { raw: string | null; lines: CartLine[] } = { raw: null, lines: EMPTY };

function read(): CartLine[] {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(KEY);
  } catch {
    // Storage can be blocked (private mode); the cart is then simply empty.
  }
  if (raw === cached.raw) return cached.lines;
  let lines: CartLine[] = EMPTY;
  try {
    lines = (raw && parseCart(JSON.parse(raw))) || EMPTY;
  } catch {
    lines = EMPTY;
  }
  cached = { raw, lines };
  return lines;
}

function write(lines: CartLine[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(lines));
  } catch {
    // Nothing to do: without storage the cart cannot be kept.
  }
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

const same = (a: CartLine, productId: string, variantId: string | null) =>
  a.productId === productId && a.variantId === variantId;

export const cart = {
  add(productId: string, variantId: string | null, quantity: number) {
    const lines = read();
    const existing = lines.find((l) => same(l, productId, variantId));
    if (existing) {
      cart.setQuantity(productId, variantId, existing.quantity + quantity);
    } else if (lines.length < MAX_LINES) {
      write([...lines, { productId, variantId, quantity: Math.min(quantity, MAX_QUANTITY) }]);
    }
  },
  setQuantity(productId: string, variantId: string | null, quantity: number) {
    const q = Math.max(1, Math.min(MAX_QUANTITY, quantity));
    write(read().map((l) => (same(l, productId, variantId) ? { ...l, quantity: q } : l)));
  },
  remove(productId: string, variantId: string | null) {
    write(read().filter((l) => !same(l, productId, variantId)));
  },
  clear() {
    write([]);
  },
};

/** The cart's lines; empty on the server and until the browser has loaded. */
export function useCart(): CartLine[] {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}
