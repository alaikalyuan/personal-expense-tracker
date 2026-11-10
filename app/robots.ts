import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Everything except the landing page needs a session; auth and API routes are never useful to crawl.
      disallow: ["/api/", "/auth/"],
    },
  };
}
