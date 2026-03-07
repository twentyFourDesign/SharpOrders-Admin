"use client";

import { useEffect, useState, useCallback } from "react";

type Bid = {
  id: string;
  offerAmount: number;
  status: string;
  createdAt: string;
  load?: {
    id: string;
    loadDescription: string;
    truckType: string;
    shipper?: { email?: string; businessName?: string | null } | null;
  } | null;
  driver?: { email?: string; firstName?: string | null; lastName?: string | null } | null;
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  accepted: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-700",
};

export default function AdminBidsPage() {
  const [bids, setBids] = useState<Bid[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const LIMIT = 20;

  const fetchBids = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    const token = localStorage.getItem("admin_token");
    const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
    if (status) params.set("status", status);
    const res = await fetch(`/api/admin/bids?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const data = await res.json();
    setBids(data.bids ?? []);
    setTotal(data.total ?? 0);
    setLoading(false);
  }, [page, status]);

  useEffect(() => {
    fetchBids();
    const interval = setInterval(() => fetchBids(false), 30_000);
    return () => clearInterval(interval);
  }, [fetchBids]);

  return (
    <div className="p-6 md:p-8 space-y-6 bg-gray-50">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bids</h1>
          <p className="text-gray-500 text-sm mt-1">{total.toLocaleString()} total · refreshes every 30s</p>
        </div>
        <button type="button" onClick={() => fetchBids()} className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition">Refresh</button>
      </div>

      <div className="flex gap-3">
        <div className="flex rounded-lg overflow-hidden border border-gray-200 bg-white text-sm">
          {(["", "pending", "accepted", "rejected"] as const).map((s) => (
            <button key={s} onClick={() => { setStatus(s); setPage(1); }} className={`px-4 py-2 font-medium transition ${status === s ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"}`}>
              {s === "" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500 text-xs uppercase tracking-wider">
                <th className="text-left px-5 py-3.5 font-medium">Driver</th>
                <th className="text-left px-5 py-3.5 font-medium">Load</th>
                <th className="text-left px-5 py-3.5 font-medium">Shipper</th>
                <th className="text-left px-5 py-3.5 font-medium">Offer (₦)</th>
                <th className="text-left px-5 py-3.5 font-medium">Status</th>
                <th className="text-left px-5 py-3.5 font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={6} className="py-16 text-center"><div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" /></td></tr>
              ) : bids.length === 0 ? (
                <tr><td colSpan={6} className="py-16 text-center text-gray-500">No bids found</td></tr>
              ) : bids.map((b) => {
                const driverName = [b.driver?.firstName, b.driver?.lastName].filter(Boolean).join(" ") || b.driver?.email || "—";
                return (
                  <tr key={b.id} className="hover:bg-gray-50 transition">
                    <td className="px-5 py-3.5 text-gray-900">{driverName}</td>
                    <td className="px-5 py-3.5">
                      <p className="text-gray-900 truncate max-w-[160px]">{b.load?.loadDescription ?? "—"}</p>
                      <p className="text-gray-500 text-xs">{b.load?.truckType}</p>
                    </td>
                    <td className="px-5 py-3.5 text-gray-700 truncate max-w-[140px]">{b.load?.shipper?.businessName ?? b.load?.shipper?.email ?? "—"}</td>
                    <td className="px-5 py-3.5 text-gray-700">{b.offerAmount != null ? `₦${b.offerAmount.toLocaleString()}` : "—"}</td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[b.status] ?? "bg-gray-100 text-gray-600"}`}>{b.status}</span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600 whitespace-nowrap">{new Date(b.createdAt).toLocaleDateString("en-NG")}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {total > LIMIT && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-200 text-sm">
            <p className="text-gray-500">Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 disabled:opacity-40 text-gray-700 rounded-lg transition">Prev</button>
              <button onClick={() => setPage((p) => p + 1)} disabled={page * LIMIT >= total} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 disabled:opacity-40 text-gray-700 rounded-lg transition">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
