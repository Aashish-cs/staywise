import clsx from "clsx";

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={clsx("animate-pulse rounded-2xl bg-[#eee6df]", className)}
      aria-hidden="true"
    />
  );
}

function HeaderSkeleton() {
  return (
    <header className="border-b border-[#ebe3dd] bg-white">
      <div className="mx-auto flex max-w-[1536px] items-center justify-between gap-4 px-5 py-4 lg:px-8">
        <div className="flex items-center gap-3">
          <SkeletonBlock className="h-10 w-10 rounded-2xl" />
          <div className="space-y-2">
            <SkeletonBlock className="h-4 w-24" />
            <SkeletonBlock className="h-3 w-36" />
          </div>
        </div>
        <SkeletonBlock className="hidden h-11 w-[34rem] rounded-full lg:block" />
        <div className="flex gap-2">
          <SkeletonBlock className="h-10 w-24 rounded-full" />
          <SkeletonBlock className="h-10 w-20 rounded-full" />
        </div>
      </div>
    </header>
  );
}

export function MarketplaceHomeLoading() {
  return (
    <main className="min-h-screen bg-white text-[#201a18]" aria-label="Loading StayWise">
      <HeaderSkeleton />
      <section className="border-b border-[#ebe3dd] bg-[#fbfaf8]">
        <div className="mx-auto max-w-[1536px] px-5 py-6 lg:px-8">
          <div className="mx-auto max-w-4xl space-y-3 text-center">
            <SkeletonBlock className="mx-auto h-4 w-48" />
            <SkeletonBlock className="mx-auto h-12 w-full max-w-3xl" />
          </div>
          <SkeletonBlock className="mx-auto mt-6 h-20 max-w-5xl rounded-full" />
          <SkeletonBlock className="mx-auto mt-4 h-16 max-w-5xl rounded-[1.65rem]" />
        </div>
      </section>
      <ListingRailSkeleton />
      <ListingRailSkeleton compact />
    </main>
  );
}

export function AppShellLoading() {
  return (
    <main className="min-h-screen bg-white text-[#201a18]" aria-label="Loading StayWise">
      <HeaderSkeleton />
      <section className="mx-auto max-w-[1536px] px-5 py-8 lg:px-8">
        <div className="max-w-2xl space-y-3">
          <SkeletonBlock className="h-5 w-36" />
          <SkeletonBlock className="h-10 w-full" />
          <SkeletonBlock className="h-5 w-2/3" />
        </div>
        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <SkeletonBlock key={index} className="h-52 rounded-[28px]" />
          ))}
        </div>
      </section>
    </main>
  );
}

export function SearchPageLoading() {
  return (
    <main className="min-h-screen bg-white text-[#201a18]" aria-label="Loading search">
      <HeaderSkeleton />
      <section className="mx-auto grid max-w-[1536px] gap-6 px-5 py-6 lg:grid-cols-[360px_minmax(0,1fr)] lg:px-8">
        <aside className="space-y-4 rounded-[28px] border border-[#eadfd6] bg-white p-5 shadow-sm">
          <SkeletonBlock className="h-5 w-28" />
          <SkeletonBlock className="h-24 w-full rounded-3xl" />
          <SkeletonBlock className="h-12 w-full rounded-full" />
          <SkeletonBlock className="h-14 w-full" />
          <SkeletonBlock className="h-14 w-full" />
          <SkeletonBlock className="h-28 w-full rounded-3xl" />
        </aside>
        <section className="min-w-0 space-y-5">
          <div className="flex items-end justify-between gap-4">
            <div className="space-y-3">
              <SkeletonBlock className="h-5 w-52" />
              <SkeletonBlock className="h-8 w-72" />
            </div>
            <SkeletonBlock className="h-10 w-36 rounded-full" />
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }, (_, index) => (
              <ListingCardSkeleton key={index} />
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}

export function ListingDetailLoading() {
  return (
    <main className="min-h-screen bg-white pb-24 text-[#201a18]" aria-label="Loading listing">
      <HeaderSkeleton />
      <section className="mx-auto max-w-[1536px] px-5 py-6 lg:px-8">
        <SkeletonBlock className="h-5 w-36" />
        <div className="mt-5 space-y-3">
          <SkeletonBlock className="h-10 w-full max-w-4xl" />
          <SkeletonBlock className="h-5 w-96" />
        </div>
        <SkeletonBlock className="mt-6 aspect-[16/9] min-h-[300px] w-full rounded-[28px]" />
        <div className="mt-9 grid gap-10 lg:grid-cols-[minmax(0,1fr)_390px]">
          <div className="space-y-6">
            <SkeletonBlock className="h-28 w-full rounded-[24px]" />
            <SkeletonBlock className="h-48 w-full rounded-[24px]" />
            <SkeletonBlock className="h-72 w-full rounded-[24px]" />
          </div>
          <aside className="space-y-4 rounded-[28px] border border-[#eadfd6] bg-white p-5 shadow-sm">
            <SkeletonBlock className="h-7 w-32" />
            <SkeletonBlock className="h-28 w-full rounded-3xl" />
            <SkeletonBlock className="h-44 w-full rounded-3xl" />
            <SkeletonBlock className="h-12 w-full rounded-full" />
          </aside>
        </div>
      </section>
    </main>
  );
}

export function DashboardLoading() {
  return (
    <main className="min-h-screen bg-white text-[#201a18]" aria-label="Loading trips">
      <HeaderSkeleton />
      <section className="mx-auto max-w-[1536px] px-5 py-8 lg:px-8">
        <div className="space-y-3">
          <SkeletonBlock className="h-5 w-40" />
          <SkeletonBlock className="h-10 w-72" />
        </div>
        <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-5">
            {Array.from({ length: 3 }, (_, index) => (
              <SkeletonBlock key={index} className="h-56 w-full rounded-[28px]" />
            ))}
          </div>
          <aside className="space-y-4">
            <SkeletonBlock className="h-40 w-full rounded-[28px]" />
            <SkeletonBlock className="h-64 w-full rounded-[28px]" />
          </aside>
        </div>
      </section>
    </main>
  );
}

export function HostWorkspaceLoading() {
  return (
    <main className="min-h-screen bg-white text-[#201a18]" aria-label="Loading host workspace">
      <HeaderSkeleton />
      <section className="mx-auto max-w-[1536px] px-5 py-8 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-3">
            <SkeletonBlock className="h-5 w-36" />
            <SkeletonBlock className="h-10 w-80" />
          </div>
          <SkeletonBlock className="h-12 w-40 rounded-full" />
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <SkeletonBlock key={index} className="h-32 rounded-[24px]" />
          ))}
        </div>
        <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          <SkeletonBlock className="h-[34rem] rounded-[28px]" />
          <SkeletonBlock className="h-[28rem] rounded-[28px]" />
        </div>
      </section>
    </main>
  );
}

function ListingRailSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <section className="mx-auto max-w-[1536px] px-5 py-8 lg:px-8">
      <div className="flex items-center justify-between">
        <SkeletonBlock className="h-7 w-72" />
        <SkeletonBlock className="h-9 w-16 rounded-full" />
      </div>
      <div className="mt-5 grid gap-5 md:grid-cols-3 xl:grid-cols-5">
        {Array.from({ length: compact ? 5 : 10 }, (_, index) => (
          <ListingCardSkeleton key={index} />
        ))}
      </div>
    </section>
  );
}

function ListingCardSkeleton() {
  return (
    <article className="space-y-3">
      <SkeletonBlock className="aspect-square rounded-[24px]" />
      <SkeletonBlock className="h-4 w-3/4" />
      <SkeletonBlock className="h-4 w-1/2" />
    </article>
  );
}
