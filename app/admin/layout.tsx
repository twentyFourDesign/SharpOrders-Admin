import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SharpOrder Admin",
  description: "SharpOrder admin dashboard",
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
