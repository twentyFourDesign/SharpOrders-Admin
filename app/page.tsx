import Link from "next/link";

const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.sharporder";

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 010 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z" />
    </svg>
  );
}

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-zinc-950 font-sans text-zinc-100 antialiased selection:bg-teal-500/25 selection:text-teal-50">
      {/* Background */}
      <div
        className="pointer-events-none fixed inset-0 -z-10"
        aria-hidden
      >
        <div className="absolute inset-0 bg-zinc-950" />
        <div className="absolute top-0 left-1/2 h-[600px] w-[1200px] -translate-x-1/2 rounded-full bg-teal-500/[0.12] blur-[120px]" />
        <div className="absolute right-0 top-1/3 h-[500px] w-[500px] translate-x-1/4 rounded-full bg-emerald-600/[0.08] blur-[100px]" />
        <div className="absolute bottom-0 left-0 h-[400px] w-[600px] -translate-x-1/4 rounded-full bg-cyan-500/[0.06] blur-[90px]" />
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
            backgroundSize: "64px 64px",
            maskImage:
              "radial-gradient(ellipse 80% 60% at 50% 0%, black 20%, transparent 70%)",
          }}
        />
      </div>

      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-zinc-950/75 backdrop-blur-xl backdrop-saturate-150">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="flex items-center gap-2.5 text-[15px] font-semibold tracking-tight text-white"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400 to-emerald-600 text-white shadow-lg shadow-teal-900/40">
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </span>
            SharpOrder
          </Link>
          <nav className="flex items-center gap-1 sm:gap-2">
            <Link
              href="/legal/privacy"
              className="hidden rounded-lg px-3 py-2 text-sm text-zinc-400 transition hover:bg-white/[0.05] hover:text-white sm:inline"
            >
              Privacy
            </Link>
            <a
              href={PLAY_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-300 transition hover:bg-white/[0.05] hover:text-white"
            >
              Google Play
            </a>
            <Link
              href="/admin/login"
              className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-medium text-white transition hover:border-white/20 hover:bg-white/[0.08]"
            >
              Admin
            </Link>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="mx-auto max-w-6xl px-4 pb-20 pt-14 sm:px-6 sm:pb-28 sm:pt-20 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="inline-flex items-center gap-2 rounded-full border border-teal-500/20 bg-teal-500/10 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.2em] text-teal-300/90">
              Logistics platform
            </p>
            <h1 className="mt-8 text-balance text-4xl font-semibold tracking-tight text-white sm:text-5xl sm:leading-[1.08] lg:text-[3.25rem]">
              Freight that moves with{" "}
              <span className="bg-gradient-to-r from-teal-200 via-teal-400 to-emerald-400 bg-clip-text text-transparent">
                clarity and control
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-pretty text-lg leading-relaxed text-zinc-400 sm:text-xl">
              One app for shippers and drivers—post loads, compare bids, track
              shipments end-to-end, and keep payouts organized.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
              <a
                href={PLAY_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center gap-2.5 rounded-xl bg-white px-8 py-3.5 text-sm font-semibold text-zinc-950 shadow-xl shadow-black/20 transition hover:bg-zinc-100 sm:w-auto"
              >
                <PlayIcon className="h-5 w-5" />
                Get it on Google Play
              </a>
              <Link
                href="/legal/terms"
                className="inline-flex w-full items-center justify-center rounded-xl border border-zinc-600/80 bg-zinc-900/50 px-8 py-3.5 text-sm font-medium text-zinc-200 backdrop-blur-sm transition hover:border-zinc-500 hover:bg-zinc-800/50 sm:w-auto"
              >
                Terms &amp; policies
              </Link>
            </div>
          </div>

          {/* App preview strip */}
          <div className="mx-auto mt-16 max-w-4xl sm:mt-20">
            <div className="relative rounded-2xl border border-white/[0.08] bg-gradient-to-b from-zinc-900/80 to-zinc-950/90 p-1 shadow-2xl shadow-black/40">
              <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-zinc-900/40 px-6 py-8 sm:px-10 sm:py-10">
                <div className="flex flex-col items-center justify-between gap-8 sm:flex-row sm:items-start">
                  <div className="text-center sm:text-left">
                    <p className="text-xs font-medium uppercase tracking-widest text-zinc-500">
                      Built for the road
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-white sm:text-3xl">
                      Loads · Bids · Shipments · Wallet
                    </p>
                    <p className="mt-3 max-w-sm text-sm leading-relaxed text-zinc-500">
                      Everything you need to coordinate freight in real time, in
                      one place.
                    </p>
                  </div>
                  <div className="grid w-full max-w-xs grid-cols-2 gap-3 sm:max-w-none">
                    {[
                      { label: "Live bids", sub: "Compare offers" },
                      { label: "Tracking", sub: "Pickup to delivery" },
                      { label: "Payouts", sub: "Driver wallet" },
                      { label: "Support", sub: "In-app help" },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-left"
                      >
                        <p className="text-sm font-medium text-white">
                          {item.label}
                        </p>
                        <p className="mt-0.5 text-xs text-zinc-500">{item.sub}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Audience cards */}
        <section className="border-t border-white/[0.06] bg-zinc-950/50 py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                Two sides of the same lane
              </h2>
              <p className="mt-4 text-zinc-400">
                Whether you&apos;re moving cargo or hauling it, SharpOrder keeps
                the workflow simple.
              </p>
            </div>
            <div className="mt-14 grid gap-6 lg:grid-cols-2 lg:gap-8">
              <article className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-zinc-900/30 p-8 transition hover:border-teal-500/25 hover:bg-zinc-900/50">
                <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-teal-500/10 blur-2xl transition group-hover:bg-teal-500/15" />
                <div className="relative">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-teal-500/15 text-teal-400">
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                      />
                    </svg>
                  </span>
                  <h3 className="mt-6 text-xl font-semibold text-white">
                    For shippers
                  </h3>
                  <p className="mt-3 leading-relaxed text-zinc-400">
                    Publish loads, invite competition on bids, and watch each
                    shipment from assignment through delivery—with fewer phone
                    calls and clearer status.
                  </p>
                </div>
              </article>
              <article className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-zinc-900/30 p-8 transition hover:border-emerald-500/25 hover:bg-zinc-900/50">
                <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-emerald-500/10 blur-2xl transition group-hover:bg-emerald-500/15" />
                <div className="relative">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                      />
                    </svg>
                  </span>
                  <h3 className="mt-6 text-xl font-semibold text-white">
                    For drivers
                  </h3>
                  <p className="mt-3 leading-relaxed text-zinc-400">
                    Scan the load board, apply to jobs that match your equipment,
                    run trips, and use wallet tools designed around how you
                    actually work on the road.
                  </p>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="relative overflow-hidden rounded-2xl border border-teal-500/20 bg-gradient-to-br from-teal-950/80 via-zinc-900 to-zinc-950 px-8 py-12 text-center sm:px-12 sm:py-14">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(45,212,191,0.15),transparent)]" />
              <div className="relative">
                <h2 className="text-2xl font-semibold text-white sm:text-3xl">
                  Download SharpOrder
                </h2>
                <p className="mx-auto mt-3 max-w-md text-sm text-teal-100/70 sm:text-base">
                  Available on Google Play for Android. Use the same platform
                  your network trusts for freight coordination.
                </p>
                <a
                  href={PLAY_STORE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-8 inline-flex items-center justify-center gap-2 rounded-xl bg-white px-8 py-3.5 text-sm font-semibold text-zinc-950 shadow-lg transition hover:bg-teal-50"
                >
                  <PlayIcon className="h-5 w-5" />
                  Open in Play Store
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/[0.06] bg-zinc-950 py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-white">SharpOrder</p>
              <p className="mt-2 max-w-xs text-sm leading-relaxed text-zinc-500">
                Mobile logistics for shippers and drivers. API and services for the
                SharpOrder app.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:gap-16">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Legal
                </p>
                <ul className="mt-4 space-y-3 text-sm">
                  <li>
                    <Link
                      href="/legal/terms"
                      className="text-zinc-400 transition hover:text-white"
                    >
                      Terms of Service
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/legal/privacy"
                      className="text-zinc-400 transition hover:text-white"
                    >
                      Privacy Policy
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/legal/delete-account"
                      className="text-zinc-400 transition hover:text-white"
                    >
                      Delete account
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  More
                </p>
                <ul className="mt-4 space-y-3 text-sm">
                  <li>
                    <Link
                      href="/legal/acceptable-use"
                      className="text-zinc-400 transition hover:text-white"
                    >
                      Acceptable use
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/legal/cancellation"
                      className="text-zinc-400 transition hover:text-white"
                    >
                      Cancellation
                    </Link>
                  </li>
                  <li>
                    <a
                      href={PLAY_STORE_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-zinc-400 transition hover:text-white"
                    >
                      Google Play
                    </a>
                  </li>
                </ul>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Team
                </p>
                <ul className="mt-4 space-y-3 text-sm">
                  <li>
                    <Link
                      href="/admin/login"
                      className="text-zinc-400 transition hover:text-white"
                    >
                      Admin sign in
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div className="mt-12 flex flex-col gap-2 border-t border-white/[0.06] pt-8 text-sm text-zinc-600 sm:flex-row sm:items-center sm:justify-between">
            <span>© {new Date().getFullYear()} SharpOrder</span>
            <span className="text-zinc-600">All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
