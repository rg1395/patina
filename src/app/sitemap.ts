import { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://patina.eu";

  const { data: listings } = await supabase.from("listings").select("slug,updated_at").eq("status","active").order("updated_at",{ascending:false}).limit(1000);
  const { data: threads } = await supabase.from("forum_threads").select("slug,created_at").order("created_at",{ascending:false}).limit(500);
  const { data: profiles } = await supabase.from("profiles").select("username,created_at").order("created_at",{ascending:false}).limit(500);

  const static_pages = ["/","/search","/community","/pools","/workshops","/events","/about"].map(url => ({ url: base + url, changeFrequency: "daily" as const, priority: url === "/" ? 1 : 0.8 }));

  const listing_pages = (listings ?? []).map(l => ({ url: `${base}/listings/${l.slug}`, lastModified: new Date(l.updated_at), changeFrequency: "weekly" as const, priority: 0.7 }));
  const thread_pages = (threads ?? []).map(t => ({ url: `${base}/community/${t.slug}`, lastModified: new Date(t.created_at), changeFrequency: "weekly" as const, priority: 0.5 }));
  const profile_pages = (profiles ?? []).map(p => ({ url: `${base}/profile/${p.username}`, lastModified: new Date(p.created_at), changeFrequency: "monthly" as const, priority: 0.4 }));

  return [...static_pages, ...listing_pages, ...thread_pages, ...profile_pages];
}
