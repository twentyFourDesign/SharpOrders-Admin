"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminIndexPage() {
  const router = useRouter();
  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    router.replace(token ? "/admin/dashboard" : "/");
  }, [router]);
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
