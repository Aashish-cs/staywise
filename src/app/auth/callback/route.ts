import { NextResponse, type NextRequest } from "next/server";
import { getSafeRedirectPath } from "@/lib/safe-redirect";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = getSafeRedirectPath(requestUrl.searchParams.get("next")) ?? "/dashboard";
  const providerError =
    requestUrl.searchParams.get("error") ?? requestUrl.searchParams.get("error_code");

  if (providerError) {
    return NextResponse.redirect(
      buildAuthErrorUrl(requestUrl, providerError.includes("expired") ? "expired" : "callback", next),
    );
  }

  if (!code) {
    return NextResponse.redirect(buildAuthErrorUrl(requestUrl, "missing-code", next));
  }

  const supabase = await createSupabaseServerClient();
  const { error } = (await supabase?.auth.exchangeCodeForSession(code)) ?? {
    error: new Error("Supabase is not configured."),
  };

  if (error) {
    return NextResponse.redirect(buildAuthErrorUrl(requestUrl, "callback", next));
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}

function buildAuthErrorUrl(requestUrl: URL, error: string, next: string) {
  const redirectUrl = new URL("/auth", requestUrl.origin);
  redirectUrl.searchParams.set("mode", "signin");
  redirectUrl.searchParams.set("error", error);
  redirectUrl.searchParams.set("next", next);

  return redirectUrl;
}
