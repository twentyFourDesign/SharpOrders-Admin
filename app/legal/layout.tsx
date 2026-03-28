import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Legal — SharpOrder",
  description:
    "Terms, privacy, acceptable use, cancellation, and account deletion information for SharpOrder.",
};

export default function LegalSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-200/60 to-zinc-300/50 px-4 py-8 md:py-12">
      {children}
    </div>
  );
}
