"use client";

import { useActionState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  CalendarCheck2,
  Camera,
  MapPinned,
  ShieldCheck,
} from "lucide-react";
import {
  activateHostAccountAction,
  type HostOnboardingActionState,
} from "@/app/host/actions";

const initialState: HostOnboardingActionState = {
  ok: false,
  message: "",
};

const onboardingSteps = [
  {
    icon: MapPinned,
    title: "Set a real location",
    body: "Use a precise city, neighborhood, and address so guests can discover the right stay.",
  },
  {
    icon: Camera,
    title: "Show the space clearly",
    body: "Add a useful photo set and honest details before publishing anything guests will rely on.",
  },
  {
    icon: CalendarCheck2,
    title: "Keep availability current",
    body: "Confirmed reservations and host blocks will protect your calendar from double bookings.",
  },
  {
    icon: ShieldCheck,
    title: "Build guest trust",
    body: "StayWise keeps host tools behind verified accounts and surfaces legitimate guest feedback.",
  },
];

export function HostOnboardingPanel({
  email,
  fullName,
}: {
  email?: string;
  fullName?: string | null;
}) {
  const [state, formAction, isPending] = useActionState(
    activateHostAccountAction,
    initialState,
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_390px]">
      <section className="rounded-[28px] border border-[#eadfd6] bg-[#fffaf5] p-6 shadow-sm md:p-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff3f5] text-[#ff385c]">
          <BadgeCheck className="h-6 w-6" aria-hidden="true" />
        </div>
        <p className="mt-6 text-sm font-extrabold text-[#ff385c]">Host onboarding</p>
        <h1 className="mt-2 max-w-2xl text-4xl font-extrabold leading-tight tracking-tight md:text-5xl">
          Turn your space into a StayWise stay.
        </h1>
        <p className="mt-5 max-w-2xl text-base font-semibold leading-7 text-[#5f5148]">
          {fullName ? `Welcome, ${fullName}. ` : "Welcome. "}Start with the host account setup,
          then create a listing when you are ready to describe the real guest experience.
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {onboardingSteps.map(({ body, icon: Icon, title }, index) => (
            <article key={title} className="rounded-[22px] border border-[#eadfd6] bg-white p-5">
              <div className="flex items-start justify-between gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#f7f3ee] text-[#201a18]">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="text-sm font-extrabold text-[#786a60]">0{index + 1}</span>
              </div>
              <h2 className="mt-5 font-extrabold">{title}</h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-[#5f5148]">{body}</p>
            </article>
          ))}
        </div>

        {state.message ? (
          <p
            role={state.ok ? "status" : "alert"}
            className={`mt-5 rounded-2xl p-4 text-sm font-extrabold ${
              state.ok ? "bg-[#e7f2e4] text-[#315d3b]" : "bg-[#fff3f5] text-[#bd1740]"
            }`}
          >
            {state.message}
          </p>
        ) : null}

        <form action={formAction} className="mt-8 border-t border-[#eadfd6] pt-6">
          <p className="text-sm font-extrabold">Account ready for hosting</p>
          <p className="mt-2 text-sm font-semibold leading-6 text-[#5f5148]">
            {email ?? "Your verified account"} will be connected to your host workspace. You can
            create, manage, and publish your own listings after activation.
          </p>
          <button
            type="submit"
            disabled={isPending}
            className="mt-5 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#201a18] px-6 text-sm font-extrabold text-white hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? "Activating host tools" : "Start hosting"}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </form>
      </section>

      <aside className="self-start rounded-[28px] border border-[#eadfd6] bg-[#201a18] p-6 text-white shadow-sm lg:sticky lg:top-8">
        <p className="text-sm font-extrabold text-[#ffb84d]">StayWise standard</p>
        <h2 className="mt-2 text-2xl font-extrabold tracking-tight">
          Clear details create better stays.
        </h2>
        <p className="mt-4 text-sm font-semibold leading-7 text-white/75">
          The host workspace keeps the important pieces together: accurate listing data, useful
          photos, protected reservations, and guest feedback based on completed stays.
        </p>
        <div className="mt-6 rounded-2xl bg-white/10 p-4">
          <p className="text-sm font-extrabold">Next after activation</p>
          <p className="mt-2 text-sm font-semibold leading-6 text-white/75">
            The listing wizard will guide you through the property, location, amenities, photos,
            pricing, and publish review.
          </p>
        </div>
      </aside>
    </div>
  );
}
