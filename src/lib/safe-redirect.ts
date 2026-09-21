const safeRedirectBase = "https://staywise.local";

export function getSafeRedirectPath(
  value: string | null | undefined,
  fallback: string | null = null,
) {
  const candidate = value?.trim();

  if (
    !candidate ||
    !candidate.startsWith("/") ||
    candidate.startsWith("//") ||
    candidate.startsWith("/\\")
  ) {
    return fallback;
  }

  try {
    const parsed = new URL(candidate, safeRedirectBase);

    if (parsed.origin !== safeRedirectBase) {
      return fallback;
    }

    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}
