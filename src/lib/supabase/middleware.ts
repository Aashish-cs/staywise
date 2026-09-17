import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  hasSupabaseConfig,
  requireSupabaseConfig,
} from "@/lib/supabase/config";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });

  if (!hasSupabaseConfig()) {
    return response;
  }

  const { supabaseUrl, supabaseAnonKey } = requireSupabaseConfig();
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && isProtectedWorkspace(request.nextUrl.pathname)) {
    const redirectUrl = new URL("/auth", request.url);
    redirectUrl.searchParams.set("mode", "signin");
    redirectUrl.searchParams.set(
      "next",
      `${request.nextUrl.pathname}${request.nextUrl.search}`,
    );

    if (request.nextUrl.pathname.startsWith("/host")) {
      redirectUrl.searchParams.set("role", "host");
    }

    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

function isProtectedWorkspace(pathname: string) {
  return (
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/") ||
    pathname === "/favorites" ||
    pathname.startsWith("/favorites/") ||
    pathname === "/host" ||
    pathname.startsWith("/host/")
  );
}
