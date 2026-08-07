import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/dashboard", "/admin", "/login", "/register"],
    },
    sitemap: ["https://neyroeros.com/sitemap.xml", "https://neyroeros.com/image-sitemap.xml"],
    host: "https://neyroeros.com",
  };
}
