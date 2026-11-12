import type { MetadataRoute } from "next";
import { shop } from "@/config/shop";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  // A shop that is still showing drafts asks search engines to stay away.
  if (shop.previewDrafts) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/"] },
    sitemap: `${shop.siteUrl}/sitemap.xml`,
  };
}
