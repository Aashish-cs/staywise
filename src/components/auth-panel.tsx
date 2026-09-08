"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { ArrowRight, CheckCircle2, Mail, ShieldCheck, UserRound } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { hasSupabaseConfig } from "@/lib/supabase/config";

type AuthMode = "signin" | "signup";
type AccountRole = "guest" | "host";

export function AuthPanel({
  initialMode = "signup",
  initialRole = "guest",
}: {
  initialMode?: AuthMode;
  initialRole?: AccountRole;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [role, setRole] = useState<AccountRole>(initialRole);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (!hasSupabaseConfig()) {
      setError("Supabase keys are missing. Add them to .env.local before testing auth.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = createSupabaseBrowserClient();

      if (mode === "signup") {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?next=${
              role === "host" ? "/host" : "/dashboard"
            }`,
            data: {
              full_name: fullName,
              role,
            },
          },
        });

        if (signUpError) {
          setError(signUpError.message);
          return;
        }

        setMessage("Check your inbox to confirm the email address.");
        return;
      }

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .maybeSingle();

      const roleFromProfile = profile?.role ?? data.user.user_metadata?.role;
      router.replace(roleFromProfile === "host" ? "/host" : "/dashboard");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid min-h-screen bg-[#f7f3ee] text-[#201a18] lg:grid-cols-[minmax(0,1fr)_560px]">
      <section className="relative hidden overflow-hidden lg:block">
        <Image
          src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1800&q=80"
          alt="Modern short-term rental living space"
          fill
          sizes="50vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />
        <div className="absolute bottom-10 left-10 max-w-lg text-white">
          <Link href="/" className="mb-8 inline-flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#ff385c]">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="text-2xl font-semibold">StayWise</span>
          </Link>
          <h1 className="text-4xl font-semibold leading-tight tracking-tight">
            Real accounts for guests and hosts.
          </h1>
          <p className="mt-4 text-base leading-7 text-white/85">
            Email confirmation, password reset, role-based routing, and protected data
            are ready for the production stack.
          </p>
        </div>
      </section>

      <section className="flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-md rounded-[28px] border border-[#eadfd6] bg-[#fffaf5] p-6 shadow-sm">
          <Link href="/" className="mb-8 flex items-center gap-3 lg:hidden">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#ff385c] text-white">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="text-xl font-semibold">StayWise</span>
          </Link>

          <div className="grid grid-cols-2 rounded-full bg-white p-1">
            {(["signup", "signin"] as AuthMode[]).map((item) => (
              <button
                type="button"
                key={item}
                className={clsx(
                  "h-11 rounded-full text-sm font-semibold capitalize transition",
                  mode === item
                    ? "bg-[#201a18] text-white"
                    : "text-[#5f5148] hover:text-[#201a18]",
                )}
                onClick={() => setMode(item)}
              >
                {item === "signup" ? "Create account" : "Sign in"}
              </button>
            ))}
          </div>

          <div className="mt-7">
            <p className="text-sm font-semibold text-[#ff385c]">
              {mode === "signup" ? "Email verified access" : "Welcome back"}
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">
              {mode === "signup" ? "Start with a verified account." : "Continue to StayWise."}
            </h2>
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            {mode === "signup" && (
              <>
                <label className="block">
                  <span className="field-label">Full name</span>
                  <span className="field-shell">
                    <UserRound className="h-4 w-4 text-[#786a60]" aria-hidden="true" />
                    <input
                      value={fullName}
                      onChange={(event) => setFullName(event.target.value)}
                      className="field-input"
                      placeholder="Ashish Mishra"
                      required
                    />
                  </span>
                </label>

                <div>
                  <span className="field-label">Account role</span>
                  <div className="grid grid-cols-2 gap-2">
                    {(["guest", "host"] as AccountRole[]).map((item) => (
                      <button
                        type="button"
                        key={item}
                        aria-pressed={role === item}
                        className={clsx(
                          "choice-button capitalize",
                          role === item && "choice-button-active",
                        )}
                        onClick={() => setRole(item)}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            <label className="block">
              <span className="field-label">Email</span>
              <span className="field-shell">
                <Mail className="h-4 w-4 text-[#786a60]" aria-hidden="true" />
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="field-input"
                  placeholder="name@example.com"
                  autoComplete="email"
                  required
                />
              </span>
            </label>

            <label className="block">
              <span className="field-label">Password</span>
              <span className="field-shell">
                <ShieldCheck className="h-4 w-4 text-[#786a60]" aria-hidden="true" />
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="field-input"
                  placeholder="At least 8 characters"
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  required
                />
              </span>
            </label>

            {error && (
              <p className="rounded-2xl bg-[#fff3f5] p-3 text-sm font-semibold text-[#bd1740]">
                {error}
              </p>
            )}

            {message && (
              <p className="flex items-center gap-2 rounded-2xl bg-[#e7f2e4] p-3 text-sm font-semibold text-[#315d3b]">
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#ff385c] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#df2348] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting
                ? "Working"
                : mode === "signup"
                  ? "Create verified account"
                  : "Sign in"}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </form>

          <Link
            href="/auth/reset-password"
            className="mt-4 inline-flex text-sm font-semibold text-[#5f5148] hover:text-[#ff385c]"
          >
            Reset password
          </Link>
        </div>
      </section>
    </div>
  );
}
