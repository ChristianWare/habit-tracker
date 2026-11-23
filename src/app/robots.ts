import type { MetadataRoute } from "next";

// A private app: nothing for search engines.
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", disallow: "/" } };
}
