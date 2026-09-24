import type { ReactNode } from "react";
import clsx from "clsx";
import type { LucideIcon } from "lucide-react";
import { Sparkles } from "lucide-react";
import { ButtonLink } from "@/components/ui/primitives";

type RouteStateAction = {
  href: string;
  label: string;
  variant?: "primary" | "secondary" | "outline" | "ghost";
};

type RouteStatePanelProps = {
  actionSlot?: ReactNode;
  actions?: RouteStateAction[];
  body: string;
  children?: ReactNode;
  className?: string;
  eyebrow: string;
  icon?: LucideIcon;
  title: string;
  variant?: "page" | "embedded";
};

export function RouteStatePanel({
  actionSlot,
  actions = [],
  body,
  children,
  className,
  eyebrow,
  icon: Icon = Sparkles,
  title,
  variant = "page",
}: RouteStatePanelProps) {
  const isEmbedded = variant === "embedded";

  return (
    <section
      className={clsx(
        "relative overflow-hidden border border-[#eadfd6] bg-[#fffaf7] shadow-sm",
        isEmbedded
          ? "rounded-[24px] p-6"
          : "rounded-[32px] p-8 shadow-[0_24px_80px_rgba(32,26,24,0.10)] md:p-10",
        className,
      )}
    >
      <div
        className="absolute right-0 top-0 h-28 w-28 rounded-bl-[56px] bg-[#ff385c]/10"
        aria-hidden="true"
      />
      <div
        className={clsx(
          "flex items-center justify-center rounded-2xl bg-[#ff385c] text-white shadow-sm",
          isEmbedded ? "h-12 w-12" : "h-14 w-14",
        )}
      >
        <Icon className={isEmbedded ? "h-5 w-5" : "h-6 w-6"} aria-hidden="true" />
      </div>

      <p className="mt-6 text-sm font-extrabold uppercase tracking-wide text-[#ff385c]">
        {eyebrow}
      </p>
      <h1
        className={clsx(
          "mt-2 max-w-3xl font-extrabold leading-tight tracking-tight text-[#201a18]",
          isEmbedded ? "text-2xl md:text-3xl" : "text-4xl md:text-5xl",
        )}
      >
        {title}
      </h1>
      <p className="mt-4 max-w-2xl text-sm font-semibold leading-6 text-[#5f5148] md:text-base">
        {body}
      </p>

      {(actions.length > 0 || actionSlot) && (
        <div className="mt-7 flex flex-wrap items-center gap-3">
          {actionSlot}
          {actions.map((action) => (
            <ButtonLink
              key={`${action.href}-${action.label}`}
              href={action.href}
              variant={action.variant ?? "primary"}
            >
              {action.label}
            </ButtonLink>
          ))}
        </div>
      )}

      {children ? <div className="mt-7">{children}</div> : null}
    </section>
  );
}
