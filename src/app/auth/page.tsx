import type { Metadata } from "next";
import { AuthPanel } from "@/components/auth-panel";
import { getSafeRedirectPath } from "@/lib/safe-redirect";

export const metadata: Metadata = {
  title: "Sign In",
};

export default async function AuthPage({ searchParams }: PageProps<"/auth">) {
  const params = await searchParams;
  const mode = firstParam(params.mode) === "signin" ? "signin" : "signup";
  const role = firstParam(params.role) === "host" ? "host" : "guest";
  const next = getSafeRedirectPath(firstParam(params.next));
  const authError = getAuthErrorMessage(firstParam(params.error));

  return (
    <AuthPanel
      key={`${mode}-${role}-${next ?? ""}-${authError ?? ""}`}
      initialError={authError}
      initialMode={mode}
      initialNext={next}
      initialRole={role}
    />
  );
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function getAuthErrorMessage(value: string | undefined) {
  if (!value) {
    return null;
  }

  if (value === "callback") {
    return "We could not finish sign-in from that email link. Try signing in again.";
  }

  if (value === "missing-code") {
    return "That email link is missing its verification code. Request a new link.";
  }

  if (value === "expired") {
    return "That email link expired. Request a new link and try again.";
  }

  return "Authentication could not be completed. Try again.";
}
