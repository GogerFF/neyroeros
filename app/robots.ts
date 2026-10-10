import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      // allow: "/" is retained as the broad baseline; media paths below
      // override the /api/ disallow for public crawler assets.
      allow: [
        "/",
        "/api/images/preview/", "/api/images/thumbnail/", "/api/images/og/", "/api/images/original/",
        "/api/videos/*/video", "/api/videos/*/poster",
        "/api/stories/images/", "/api/avatars/",
        "/api/hero/*/mp4", "/api/hero/*/webm", "/api/hero/*/poster",
      ],
      disallow: ["/api/", "/dashboard", "/admin", "/login", "/register"],
    },
    sitemap: ["https://neyroeros.com/sitemap.xml", "https://neyroeros.com/image-sitemap.xml"],
    host: "https://neyroeros.com",
  };
}
