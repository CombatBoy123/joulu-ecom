import type { NextConfig } from "next";

// The shop is a fully static site (hosted on Cloudflare Pages). Anything that
// needs a server — creating a Stripe Checkout session, the Stripe webhook —
// lives in Cloudflare Pages Functions, not in Next.js.
const config: NextConfig = {
  output: "export",
  trailingSlash: true,
  // next/image's on-demand optimiser needs a server; images are optimised
  // ahead of time instead.
  images: { unoptimized: true },
  // One 404 page for the whole site; needed because each language has its
  // own root layout (see app/global-not-found.tsx).
  experimental: { globalNotFound: true },
};

export default config;
