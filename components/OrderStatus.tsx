"use client";

import { useEffect, useState } from "react";
import { cart } from "@/lib/cart-store";
import { fill, formatPrice, type Locale, type Messages } from "@/lib/i18n";

type State = { kind: "checking" } | { kind: "paid"; totalCents: number | null } | { kind: "unpaid" } | { kind: "error" };

// Arriving on this page proves nothing: the address can be typed by anyone.
// The page asks the server, which asks Stripe, and only then says "paid".
export function OrderStatus({ locale, m, links }: { locale: Locale; m: Messages["order"]; links: { home: string; cart: string } }) {
  const [state, setState] = useState<State>({ kind: "checking" });

  useEffect(() => {
    const sessionId = new URLSearchParams(window.location.search).get("session_id");
    if (!sessionId) return setState({ kind: "error" });
    let cancelled = false;
    fetch(`/api/order?session_id=${encodeURIComponent(sessionId)}`)
      .then(async (response) => {
        if (!response.ok) throw new Error(String(response.status));
        const data = await response.json();
        if (cancelled) return;
        if (data.paid === true) {
          cart.clear();
          setState({ kind: "paid", totalCents: typeof data.totalCents === "number" ? data.totalCents : null });
        } else {
          setState({ kind: "unpaid" });
        }
      })
      .catch(() => !cancelled && setState({ kind: "error" }));
    return () => {
      cancelled = true;
    };
  }, []);

  if (state.kind === "checking") return <p aria-busy="true">{m.checking}</p>;
  if (state.kind === "paid") {
    return (
      <div className="page-intro">
        <h1>{m.paidTitle}</h1>
        <p>{m.paidBody}</p>
        {state.totalCents !== null && <p>{fill(m.paidTotal, { total: formatPrice(state.totalCents, locale) })}</p>}
        <p>
          <a className="button button--secondary" href={links.home}>
            {m.backHome}
          </a>
        </p>
      </div>
    );
  }
  return (
    <div className="page-intro">
      <h1>{state.kind === "unpaid" ? m.unpaidTitle : m.errorTitle}</h1>
      <p>{state.kind === "unpaid" ? m.unpaidBody : m.errorBody}</p>
      <p>
        <a className="button button--secondary" href={state.kind === "unpaid" ? links.cart : links.home}>
          {state.kind === "unpaid" ? m.backToCart : m.backHome}
        </a>
      </p>
    </div>
  );
}
