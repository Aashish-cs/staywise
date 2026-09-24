import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/search", "/listings/"],
        disallow: [
          "/api/",
          "/auth/",
          "/dashboard",
          "/favorites",
          "/host",
          "/profile",
          "/reservations/",
        ],
      },
    ],
    sitemap: new URL("/sitemap.xml", siteUrl).toString(),
  };
}
