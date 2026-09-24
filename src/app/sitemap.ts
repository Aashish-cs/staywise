import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";
import { siteUrl } from "@/lib/seo";
import { supabaseAnonKey, supabaseUrl } from "@/lib/supabase/config";

type SitemapListingRow = {
  id: string;
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const publicRoutes: MetadataRoute.Sitemap = [
    {
      url: new URL("/", siteUrl).toString(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: new URL("/search", siteUrl).toString(),
      changeFrequency: "daily",
      priority: 0.8,
    },
  ];

  if (!supabaseUrl || !supabaseAnonKey) {
    return publicRoutes;
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
      },
    });
    const { data, error } = await supabase
      .from("listings")
      .select("id")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .returns<SitemapListingRow[]>();

    if (error) {
      throw error;
    }

    const listingRoutes = (data ?? []).map((listing) => ({
      url: new URL(`/listings/${listing.id}`, siteUrl).toString(),
      changeFrequency: "daily" as const,
      priority: 0.7,
    }));

    return [...publicRoutes, ...listingRoutes];
  } catch (error) {
    console.error("Unable to build listing sitemap", error);
    return publicRoutes;
  }
}
