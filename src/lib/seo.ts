import type { Metadata } from "next";

export const siteUrl = new URL(
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://staywise-tau.vercel.app",
);

export const noIndexRobots = {
  follow: false,
  index: false,
} satisfies Metadata["robots"];

export function canonicalPath(path: string) {
  return path.startsWith("/") ? path : `/${path}`;
}

export function truncateMetaDescription(value: string, maxLength = 155) {
  const normalized = value.trim().replace(/\s+/g, " ");

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 1).trimEnd()}...`;
}
