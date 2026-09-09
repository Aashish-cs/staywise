"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { hasSupabaseConfig } from "@/lib/supabase/config";

export function UpdatePasswordPanel() {
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
      const { error: updateError } = await supabase.auth.updateUser({ password });

      if (updateError) {
        setError(updateError.message);
        return;
      }

      setMessage("Password updated. You can sign in now.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f3ee] px-5 py-10 text-[#201a18]">
      <section className="w-full max-w-md rounded-[28px] border border-[#eadfd6] bg-[#fffaf5] p-6 shadow-sm">
        <h1 className="text-3xl font-semibold tracking-tight">Choose a new password</h1>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="field-label">New password</span>
            <span className="field-shell">
              <ShieldCheck className="h-4 w-4 text-[#786a60]" aria-hidden="true" />
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="field-input"
                placeholder="At least 8 characters"
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

          {message && (
            <Link
              href="/auth?mode=signin"
              className="flex h-11 w-full items-center justify-center rounded-full border border-[#eadfd6] bg-white text-sm font-semibold hover:border-[#ff385c] hover:text-[#df2348]"
            >
              Back to sign in
            </Link>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="h-12 w-full rounded-full bg-[#ff385c] text-sm font-semibold text-white hover:bg-[#df2348] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "Saving" : "Update password"}
          </button>
        </form>
      </section>
    </main>
  );
}
