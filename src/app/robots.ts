import { MetadataRoute } from "next";
export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://patina.eu";
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/admin/", "/escrow/", "/messages/", "/api/", "/auth/"] },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
