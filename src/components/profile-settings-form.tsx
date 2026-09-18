"use client";

import Link from "next/link";
import { useActionState } from "react";
import { CheckCircle2, LockKeyhole, Save } from "lucide-react";
import {
  updateProfileAction,
  type ProfileActionState,
} from "@/app/profile/actions";

const initialState: ProfileActionState = {
  ok: false,
  message: "",
};

type ProfileSettingsFormProps = {
  email: string;
  fullName: string;
  role: "guest" | "host";
  settings: {
    tripReminderEmails: boolean;
    hostDigestEmails: boolean;
    marketingOptIn: boolean;
  };
};

export function ProfileSettingsForm({ email, fullName, role, settings }: ProfileSettingsFormProps) {
  const [state, formAction, isPending] = useActionState(updateProfileAction, initialState);

  return (
    <form action={formAction} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <section className="rounded-[28px] border border-[#eadfd6] bg-white p-6 shadow-sm md:p-8">
        <div className="flex items-start justify-between gap-4 border-b border-[#eadfd6] pb-6">
          <div>
            <p className="text-sm font-extrabold text-[#ff385c]">Personal details</p>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight">Your account identity</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-[#5f5148]">
              Keep the name StayWise uses across your trips, reviews, and hosting workspace.
            </p>
          </div>
          <span className="rounded-full bg-[#e7f2e4] px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-[#315d3b]">
            {role} account
          </span>
        </div>

        <div className="mt-6 grid gap-5">
          <label className="block">
            <span className="field-label">Full name</span>
            <span className="field-shell">
              <input
                name="fullName"
                defaultValue={fullName}
                maxLength={80}
                placeholder="Your name"
                autoComplete="name"
                className="field-input"
              />
            </span>
          </label>

          <label className="block">
            <span className="field-label">Verified email</span>
            <span className="field-shell bg-[#f7f3ee]">
              <LockKeyhole className="h-4 w-4 shrink-0 text-[#786a60]" aria-hidden="true" />
              <input
                value={email}
                readOnly
                aria-describedby="verified-email-note"
                className="field-input cursor-not-allowed"
              />
            </span>
            <span id="verified-email-note" className="mt-2 block text-xs font-semibold text-[#786a60]">
              Email changes are handled through account verification.
            </span>
          </label>
        </div>

        <div className="mt-8 border-t border-[#eadfd6] pt-6">
          <p className="text-sm font-extrabold">Email preferences</p>
          <div className="mt-4 grid gap-3">
            <Preference
              defaultChecked={settings.tripReminderEmails}
              name="tripReminderEmails"
              title="Trip reminders"
              body="Get helpful reminders before upcoming stays."
            />
            <Preference
              defaultChecked={settings.hostDigestEmails}
              name="hostDigestEmails"
              title="Hosting updates"
              body="Receive reservation and listing activity updates."
            />
            <Preference
              defaultChecked={settings.marketingOptIn}
              name="marketingOptIn"
              title="StayWise news"
              body="Occasional product updates and travel inspiration."
            />
          </div>
        </div>

        {state.message ? (
          <div
            className={`mt-6 rounded-2xl p-4 text-sm font-extrabold ${
              state.ok ? "bg-[#e7f2e4] text-[#315d3b]" : "bg-[#fff3f5] text-[#bd1740]"
            }`}
          >
            {state.ok ? <CheckCircle2 className="mr-2 inline h-4 w-4" aria-hidden="true" /> : null}
            {state.message}
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-[#eadfd6] pt-6">
          <Link
            href="/auth/reset-password"
            className="inline-flex h-11 items-center justify-center rounded-full border border-[#eadfd6] bg-white px-5 text-sm font-extrabold hover:border-[#ff385c]"
          >
            Change password
          </Link>
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#201a18] px-5 text-sm font-extrabold text-white hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save className="h-4 w-4" aria-hidden="true" />
            {isPending ? "Saving" : "Save changes"}
          </button>
        </div>
      </section>

      <aside className="self-start rounded-[28px] bg-[#201a18] p-6 text-white shadow-sm lg:sticky lg:top-24">
        <p className="text-sm font-extrabold text-[#ffb84d]">Account snapshot</p>
        <h2 className="mt-2 text-2xl font-extrabold tracking-tight">Built around your stays.</h2>
        <p className="mt-4 text-sm font-semibold leading-7 text-white/75">
          Your verified account keeps saved stays, reservations, reviews, and hosting tools connected without exposing private account details publicly.
        </p>
        <div className="mt-6 grid gap-2">
          <Link href="/dashboard" className="rounded-2xl bg-white/10 px-4 py-3 text-sm font-extrabold hover:bg-white/15">
            Open my trips
          </Link>
          <Link href={role === "host" ? "/host" : "/host/onboarding"} className="rounded-2xl bg-white/10 px-4 py-3 text-sm font-extrabold hover:bg-white/15">
            {role === "host" ? "Open host workspace" : "Become a host"}
          </Link>
        </div>
      </aside>
    </form>
  );
}

function Preference({
  body,
  defaultChecked,
  name,
  title,
}: {
  body: string;
  defaultChecked: boolean;
  name: string;
  title: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[#eadfd6] p-4 hover:border-[#ff385c]">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="mt-1 h-4 w-4 accent-[#ff385c]"
      />
      <span>
        <span className="block text-sm font-extrabold">{title}</span>
        <span className="mt-1 block text-sm font-semibold leading-6 text-[#5f5148]">{body}</span>
      </span>
    </label>
  );
}
