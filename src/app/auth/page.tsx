import type { Metadata } from "next";
import { AuthPanel } from "@/components/auth-panel";

export const metadata: Metadata = {
  title: "Sign In",
};

export default async function AuthPage({ searchParams }: PageProps<"/auth">) {
  const params = await searchParams;
  const mode = firstParam(params.mode) === "signin" ? "signin" : "signup";
  const role = firstParam(params.role) === "host" ? "host" : "guest";

  return <AuthPanel key={`${mode}-${role}`} initialMode={mode} initialRole={role} />;
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
