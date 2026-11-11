"use client";

import { useCart } from "@/lib/cart-store";

export function CartLink({ href, label, countLabel }: { href: string; label: string; countLabel: string }) {
  const count = useCart().reduce((sum, line) => sum + line.quantity, 0);
  return (
    <a className="cart-link" href={href} aria-label={count > 0 ? countLabel.replace("{count}", String(count)) : label}>
      {label}
      {count > 0 && <span className="cart-link__count">{count}</span>}
    </a>
  );
}
