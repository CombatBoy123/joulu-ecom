import { Cormorant_Garamond, Inter } from "next/font/google";

// Downloaded when the site is built and served from our own domain: the
// visitor's browser never contacts Google.
const heading = Cormorant_Garamond({
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600"],
  style: ["normal", "italic"],
  variable: "--font-heading",
  display: "swap",
});
const body = Inter({ subsets: ["latin", "latin-ext"], variable: "--font-body", display: "swap" });

/** Put on <html>; globals.css reads the two font variables. */
export const fontClasses = `${heading.variable} ${body.variable}`;
