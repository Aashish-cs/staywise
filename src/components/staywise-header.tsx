"use client";

import { type ReactNode, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { Globe2, Home, Menu, Sparkles, UserRound } from "lucide-react";

type StayWiseHeaderProps = {
  actions?: ReactNode;
  brandClassName?: string;
  center?: ReactNode;
  children?: ReactNode;
  className?: string;
  innerClassName?: string;
  nav?: ReactNode;
};

type StayWiseAccountMenuProps = {
  accountHref: string;
  accountLabel: string;
  accountLinkClassName?: string;
  accountLinkVisibilityClassName?: string;
  isSignedIn: boolean;
  menuClassName?: string;
};

type StayWisePrimaryNavProps = {
  activeTab: "all" | "homes";
  homesHref: string;
};

export function StayWiseHeader({
  actions,
  brandClassName,
  center,
  children,
  className,
  innerClassName,
  nav,
}: StayWiseHeaderProps) {
  return (
    <header
      className={clsx(
        "sticky top-0 z-30 border-b border-[#ebe3dd] bg-white/95 backdrop-blur",
        className,
      )}
    >
      <div
        className={clsx(
          "mx-auto flex max-w-[1536px] items-center justify-between gap-4 px-5 py-4 lg:px-8",
          innerClassName,
        )}
      >
        <Link
          href="/"
          className={clsx("flex items-center gap-2", brandClassName)}
          aria-label="StayWise home"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#fff3f5] text-[#ff385c]">
            <Sparkles className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="text-xl font-extrabold tracking-tight text-[#ff385c]">
            StayWise
          </span>
        </Link>

        {center}
        {nav}

        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
      {children}
    </header>
  );
}

export function StayWisePrimaryNav({ activeTab, homesHref }: StayWisePrimaryNavProps) {
  const items = [
    {
      href: "/",
      icon: Globe2,
      key: "all",
      label: "All",
    },
    {
      href: homesHref,
      icon: Home,
      key: "homes",
      label: "Homes",
    },
  ] as const;

  return (
    <nav aria-label="StayWise categories" className="flex items-center justify-center gap-8">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = item.key === activeTab;

        return (
          <Link
            key={item.key}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={clsx(
              "group relative flex h-14 items-center gap-2 text-sm font-extrabold transition",
              isActive ? "text-[#201a18]" : "text-[#6f655e] hover:text-[#201a18]",
            )}
          >
            <Icon
              className={clsx(
                "h-5 w-5 transition",
                isActive ? "text-[#201a18]" : "text-[#8c8179] group-hover:text-[#201a18]",
              )}
              aria-hidden="true"
            />
            {item.label}
            <span
              className={clsx(
                "absolute inset-x-0 -bottom-1 h-0.5 rounded-full transition",
                isActive ? "bg-[#201a18]" : "bg-transparent group-hover:bg-[#d7cec7]",
              )}
            />
          </Link>
        );
      })}
    </nav>
  );
}

export function StayWiseAccountMenu({
  accountHref,
  accountLabel,
  accountLinkClassName,
  accountLinkVisibilityClassName = "hidden sm:block",
  isSignedIn,
  menuClassName,
}: StayWiseAccountMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (isOpen && !rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (isOpen && event.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <>
      <Link
        className={clsx(
          "rounded-full px-4 py-2 text-sm font-semibold hover:bg-[#f7f3ee]",
          "whitespace-nowrap",
          accountLinkVisibilityClassName,
          accountLinkClassName,
        )}
        href={accountHref}
        onClick={() => setIsOpen(false)}
      >
        {accountLabel}
      </Link>
      <div ref={rootRef} className="relative">
        <button
          ref={triggerRef}
          type="button"
          aria-expanded={isOpen}
          aria-controls={isOpen ? menuId : undefined}
          aria-haspopup="true"
          aria-label={isOpen ? "Close account menu" : "Open account menu"}
          className="flex h-11 items-center gap-2 rounded-full border border-[#ddd0c6] bg-white px-3 text-sm shadow-sm"
          onClick={() => setIsOpen((current) => !current)}
        >
          <Menu className="h-4 w-4" aria-hidden="true" />
          <UserRound className="h-5 w-5" aria-hidden="true" />
        </button>

        {isOpen && (
          <div
            id={menuId}
            role="region"
            aria-label="Account menu"
            className={clsx(
              "absolute right-0 top-full z-40 mt-2 w-56 overflow-hidden rounded-2xl border border-[#eadfd6] bg-white py-2 text-sm font-semibold shadow-xl",
              menuClassName,
            )}
          >
            {isSignedIn ? (
              <>
                <Link
                  href="/dashboard"
                  className="block px-4 py-3 hover:bg-[#fff3f5]"
                  onClick={() => setIsOpen(false)}
                >
                  My trips
                </Link>
                <Link
                  href="/profile"
                  className="block px-4 py-3 hover:bg-[#fff3f5]"
                  onClick={() => setIsOpen(false)}
                >
                  Profile & settings
                </Link>
                <Link
                  href="/favorites"
                  className="block px-4 py-3 hover:bg-[#fff3f5]"
                  onClick={() => setIsOpen(false)}
                >
                  Saved stays
                </Link>
                <Link
                  href="/host"
                  className="block px-4 py-3 hover:bg-[#fff3f5]"
                  onClick={() => setIsOpen(false)}
                >
                  Host dashboard
                </Link>
                <form action="/auth/signout" method="post">
                  <button
                    type="submit"
                    className="w-full px-4 py-3 text-left font-semibold hover:bg-[#fff3f5]"
                  >
                    Sign out
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link
                  href="/auth?mode=signin"
                  className="block px-4 py-3 hover:bg-[#fff3f5]"
                  onClick={() => setIsOpen(false)}
                >
                  Sign in
                </Link>
                <Link
                  href="/auth?mode=signup"
                  className="block px-4 py-3 hover:bg-[#fff3f5]"
                  onClick={() => setIsOpen(false)}
                >
                  Create account
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}
