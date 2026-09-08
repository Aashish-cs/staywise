"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { hasSupabaseConfig } from "@/lib/supabase/config";

export function PasswordResetPanel() {
  const [email, setEmail] = useState("");
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

    setIsSubmitting(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });

      if (resetError) {
        setError(resetError.message);
        return;
      }

      setMessage("Password reset email sent.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f3ee] px-5 py-10 text-[#201a18]">
      <section className="w-full max-w-md rounded-[28px] border border-[#eadfd6] bg-[#fffaf5] p-6 shadow-sm">
        <Link href="/auth" className="inline-flex items-center gap-2 text-sm font-semibold text-[#5f5148] hover:text-[#ff385c]">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to sign in
        </Link>
        <h1 className="mt-8 text-3xl font-semibold tracking-tight">Reset password</h1>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
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
            <p className="rounded-2xl bg-[#e7f2e4] p-3 text-sm font-semibold text-[#315d3b]">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="h-12 w-full rounded-full bg-[#ff385c] text-sm font-semibold text-white hover:bg-[#df2348] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "Sending" : "Send reset email"}
          </button>
        </form>
      </section>
    </main>
  );
}
