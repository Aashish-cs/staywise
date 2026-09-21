import type {
  ButtonHTMLAttributes,
  ComponentProps,
  HTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import Link from "next/link";
import clsx from "clsx";
import { Minus, Plus, Star, type LucideIcon } from "lucide-react";
import { formatCurrency } from "@/lib/currency";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";
type BadgeTone = "neutral" | "brand" | "success" | "info" | "warning" | "danger";

const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-full font-extrabold transition disabled:cursor-not-allowed disabled:opacity-60";
const buttonVariants: Record<ButtonVariant, string> = {
  danger: "bg-[#bd1740] text-white hover:bg-[#94102f]",
  ghost: "text-[#5f5148] hover:bg-[#f7f3ee] hover:text-[#201a18]",
  outline:
    "border border-[#eadfd6] bg-white text-[#201a18] hover:border-[#ff385c] hover:text-[#df2348]",
  primary: "bg-[#ff385c] text-white shadow-sm hover:bg-[#df2348]",
  secondary: "bg-[#201a18] text-white hover:bg-black",
};
const buttonSizes: Record<ButtonSize, string> = {
  lg: "h-12 px-6 text-sm",
  md: "h-11 px-5 text-sm",
  sm: "h-9 px-3 text-xs",
};
const badgeTones: Record<BadgeTone, string> = {
  brand: "bg-[#fff3f5] text-[#bd1740]",
  danger: "bg-[#fff3f5] text-[#bd1740]",
  info: "bg-[#edf6f8] text-[#23515a]",
  neutral: "bg-[#f7f3ee] text-[#5f5148]",
  success: "bg-[#e7f2e4] text-[#315d3b]",
  warning: "bg-[#fff5dd] text-[#7a5100]",
};

export function Button({
  className,
  size = "md",
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  size?: ButtonSize;
  variant?: ButtonVariant;
}) {
  return (
    <button
      className={clsx(buttonBase, buttonVariants[variant], buttonSizes[size], className)}
      {...props}
    />
  );
}

export function ButtonLink({
  className,
  size = "md",
  variant = "primary",
  ...props
}: ComponentProps<typeof Link> & {
  children: ReactNode;
  className?: string;
  size?: ButtonSize;
  variant?: ButtonVariant;
}) {
  return (
    <Link
      className={clsx(buttonBase, buttonVariants[variant], buttonSizes[size], className)}
      {...props}
    />
  );
}

export function Badge({
  children,
  className,
  tone = "neutral",
}: {
  children: ReactNode;
  className?: string;
  tone?: BadgeTone;
}) {
  return (
    <span
      className={clsx(
        "inline-flex min-h-7 items-center rounded-full px-3 py-1 text-xs font-extrabold",
        badgeTones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function FieldLabel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <span className={clsx("field-label", className)}>{children}</span>;
}

export function FieldShell({
  children,
  className,
  icon: Icon,
}: {
  children: ReactNode;
  className?: string;
  icon?: LucideIcon;
}) {
  return (
    <span className={clsx("field-shell", className)}>
      {Icon && <Icon className="h-4 w-4 text-[#786a60]" aria-hidden="true" />}
      {children}
    </span>
  );
}

export function TextInput({
  className,
  icon,
  label,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  icon?: LucideIcon;
  label?: string;
}) {
  return (
    <label className="block">
      {label && <FieldLabel>{label}</FieldLabel>}
      <FieldShell icon={icon}>
        <input className={clsx("field-input", className)} {...props} />
      </FieldShell>
    </label>
  );
}

export function DateField({
  className,
  icon,
  label,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  icon?: LucideIcon;
  label?: string;
}) {
  return <TextInput className={className} icon={icon} label={label} type="date" {...props} />;
}

export function SelectControl({
  children,
  className,
  icon,
  label,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & {
  icon?: LucideIcon;
  label?: string;
}) {
  return (
    <label className="block">
      {label && <FieldLabel>{label}</FieldLabel>}
      <FieldShell icon={icon}>
        <select className={clsx("field-input appearance-none", className)} {...props}>
          {children}
        </select>
      </FieldShell>
    </label>
  );
}

export function TextArea({
  className,
  label,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
}) {
  return (
    <label className="block">
      {label && <FieldLabel>{label}</FieldLabel>}
      <textarea className={clsx("field-textarea", className)} {...props} />
    </label>
  );
}

export function Surface({
  as: Component = "div",
  children,
  className,
  ...props
}: {
  as?: "article" | "aside" | "div" | "nav" | "section";
  children: ReactNode;
  className?: string;
} & HTMLAttributes<HTMLElement>) {
  return (
    <Component
      className={clsx(
        "rounded-[24px] border border-[#eadfd6] bg-white shadow-sm",
        className,
      )}
      {...props}
    >
      {children}
    </Component>
  );
}

export function FloatingPanel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "overflow-hidden rounded-2xl border border-[#eadfd6] bg-white py-2 text-sm font-semibold shadow-xl",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function SearchBarShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "grid overflow-hidden rounded-[2rem] border border-[#e6ddd5] bg-white text-left shadow-[0_18px_55px_rgba(32,26,24,0.12)] md:rounded-full",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function EmptyState({
  actions,
  body,
  className,
  icon: Icon,
  title,
}: {
  actions?: ReactNode;
  body: ReactNode;
  className?: string;
  icon?: LucideIcon;
  title: string;
}) {
  return (
    <div
      className={clsx(
        "rounded-[24px] border border-dashed border-[#d7c8bd] bg-white p-8 text-center",
        className,
      )}
    >
      {Icon && <Icon className="mx-auto h-8 w-8 text-[#ff385c]" aria-hidden="true" />}
      <p className="mt-4 text-lg font-extrabold">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm font-semibold leading-6 text-[#786a60]">
        {body}
      </p>
      {actions && <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">{actions}</div>}
    </div>
  );
}

export function Notice({
  children,
  className,
  tone = "neutral",
}: {
  children: ReactNode;
  className?: string;
  tone?: BadgeTone;
}) {
  return (
    <p
      className={clsx(
        "rounded-2xl p-3 text-sm font-semibold",
        badgeTones[tone],
        className,
      )}
    >
      {children}
    </p>
  );
}

export function Skeleton({
  className,
}: {
  className?: string;
}) {
  return <div className={clsx("animate-pulse rounded-2xl bg-[#f1ebe6]", className)} />;
}

export function Avatar({
  imageUrl,
  name,
  size = "md",
}: {
  imageUrl?: string | null;
  name: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClasses: Record<"sm" | "md" | "lg", string> = {
    lg: "h-14 w-14 text-base",
    md: "h-11 w-11 text-sm",
    sm: "h-8 w-8 text-xs",
  };
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  if (imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageUrl}
        alt={name}
        className={clsx("rounded-full object-cover", sizeClasses[size])}
      />
    );
  }

  return (
    <span
      aria-label={name}
      className={clsx(
        "inline-flex items-center justify-center rounded-full bg-[#201a18] font-extrabold text-white",
        sizeClasses[size],
      )}
    >
      {initials || name[0]?.toUpperCase() || "S"}
    </span>
  );
}

export function GuestStepper({
  label = "Guests",
  max = 16,
  min = 1,
  onChange,
  value,
}: {
  label?: string;
  max?: number;
  min?: number;
  onChange: (value: number) => void;
  value: number;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-[#eadfd6] bg-white px-4 py-3">
      <span>
        <span className="block text-sm font-extrabold">{label}</span>
        <span className="block text-xs font-semibold text-[#786a60]">
          Up to {max} guests
        </span>
      </span>
      <span className="flex items-center gap-3">
        <button
          type="button"
          aria-label={`Decrease ${label.toLowerCase()}`}
          disabled={value <= min}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-[#d8cbc1] text-[#201a18] disabled:cursor-not-allowed disabled:opacity-40"
          onClick={() => onChange(Math.max(min, value - 1))}
        >
          <Minus className="h-4 w-4" aria-hidden="true" />
        </button>
        <span className="w-6 text-center text-sm font-extrabold">{value}</span>
        <button
          type="button"
          aria-label={`Increase ${label.toLowerCase()}`}
          disabled={value >= max}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-[#d8cbc1] text-[#201a18] disabled:cursor-not-allowed disabled:opacity-40"
          onClick={() => onChange(Math.min(max, value + 1))}
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
        </button>
      </span>
    </div>
  );
}

export function RatingDisplay({
  rating,
  reviewCount,
}: {
  rating: number | null;
  reviewCount?: number | null;
}) {
  if (!rating || !reviewCount) {
    return <Badge tone="neutral">New</Badge>;
  }

  return (
    <span className="inline-flex items-center gap-1 text-sm font-extrabold">
      <Star className="h-4 w-4 fill-[#ffb84d] text-[#ffb84d]" aria-hidden="true" />
      {rating.toFixed(2)}
      <span className="font-semibold text-[#786a60]">({reviewCount})</span>
    </span>
  );
}

export function Price({
  amount,
  suffix = "night",
  tone = "default",
}: {
  amount: number;
  suffix?: string;
  tone?: "default" | "inverse";
}) {
  const isInverse = tone === "inverse";

  return (
    <span>
      <span className={clsx("font-extrabold", isInverse ? "text-white" : "text-[#201a18]")}>
        {formatCurrency(amount)}
      </span>{" "}
      <span className={isInverse ? "text-white/85" : "text-[#5f5148]"}>{suffix}</span>
    </span>
  );
}
