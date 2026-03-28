import Link from "next/link";
import { LEGAL_NAV } from "../nav-config";

type LegalShellProps = {
  headerTitle: string;
  lastUpdated: string;
  activeHref: string;
  children: React.ReactNode;
};

export function LegalShell({
  headerTitle,
  lastUpdated,
  activeHref,
  children,
}: LegalShellProps) {
  return (
    <div className="mx-auto w-full max-w-4xl overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-md">
      <header className="flex flex-col gap-1 border-b border-zinc-200/80 bg-[#f0eef5] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5">
        <h1 className="text-lg font-bold tracking-tight text-zinc-800 sm:text-xl">
          {headerTitle}
        </h1>
        <p className="text-sm text-zinc-500">Last updated {lastUpdated}</p>
      </header>

      <div className="flex min-h-[min(70vh,520px)] flex-col md:flex-row">
        <nav
          aria-label="Legal documents"
          className="border-b border-zinc-200 bg-[#faf9fc] p-4 md:w-[min(260px,38%)] md:shrink-0 md:border-b-0 md:border-r md:border-zinc-200 md:p-5"
        >
          <ul className="space-y-0.5">
            {LEGAL_NAV.map((item) => {
              const active = activeHref === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`block rounded-lg px-3 py-2.5 text-sm transition ${
                      active
                        ? "bg-teal-50 font-semibold text-teal-800"
                        : "text-zinc-600 hover:bg-zinc-100/80 hover:text-zinc-900"
                    }`}
                  >
                    <span className="mr-1.5 font-normal text-zinc-400">
                      {item.num}.
                    </span>
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="min-w-0 flex-1 bg-white">
          <div className="h-full p-5 md:p-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
