"use client";

import { type ReactNode, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { Menu, Sparkles, UserRound } from "lucide-react";

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
          className={clsx("flex items-center gap-3", brandClassName)}
          aria-label="StayWise home"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#ff385c] text-white shadow-sm">
            <Sparkles className="h-5 w-5" aria-hidden="true" />
          </span>
          <span>
            <span className="block text-xl font-extrabold tracking-tight">
              StayWise
            </span>
            <span className="hidden text-xs font-semibold text-[#786a60] sm:block">
              Smart Stays, Better Days.
            </span>
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

export function StayWiseAccountMenu({
  accountHref,
  accountLabel,
  accountLinkClassName,
  accountLinkVisibilityClassName = "hidden sm:block",
  isSignedIn,
  menuClassName,
}: StayWiseAccountMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

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
      <div className="relative">
        <button
          type="button"
          aria-expanded={isOpen}
          aria-label="Open account menu"
          className="flex h-11 items-center gap-2 rounded-full border border-[#ddd0c6] bg-white px-3 text-sm shadow-sm"
          onClick={() => setIsOpen((current) => !current)}
        >
          <Menu className="h-4 w-4" aria-hidden="true" />
          <UserRound className="h-5 w-5" aria-hidden="true" />
        </button>

        {isOpen && (
          <div
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
