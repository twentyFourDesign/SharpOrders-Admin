"use client";

import { useEffect, useState, useCallback } from "react";

type Load = {
  id: string;
  truckType: string;
  loadDescription: string;
  status: string;
  offerAmount?: number | null;
  recipientName?: string | null;
  pickupCity?: string | null;
  deliveryCity?: string | null;
  pickupState?: string | null;
  deliveryState?: string | null;
  createdAt: string;
  shipper?: { email?: string; businessName?: string | null; firstName?: string | null; lastName?: string | null } | null;
  _count?: { bids: number };
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600",
  available: "bg-blue-100 text-blue-700",
  applied: "bg-yellow-100 text-yellow-700",
  accepted: "bg-emerald-100 text-emerald-700",
  in_transit: "bg-amber-100 text-amber-700",
  at_pickup: "bg-amber-100 text-amber-700",
  approaching_dropoff: "bg-amber-100 text-amber-700",
  delivered: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function AdminLoadsPage() {
  const [loads, setLoads] = useState<Load[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const LIMIT = 20;

  const fetchLoads = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    const token = localStorage.getItem("admin_token");
    const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
    if (status) params.set("status", status);
    if (search) params.set("search", search);
    try {
      const res = await fetch(`/api/admin/loads?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const text = await res.text();
      const data = text ? JSON.parse(text) : {};
      if (!res.ok) {
        setLoads([]);
        setTotal(0);
        return;
      }
      setLoads(data.loads ?? []);
      setTotal(data.total ?? 0);
    } catch {
      setLoads([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, status, search]);

  useEffect(() => {
    fetchLoads();
    const interval = setInterval(() => fetchLoads(false), 30_000);
    return () => clearInterval(interval);
  }, [fetchLoads]);

  const STATUSES = ["", "draft", "available", "applied", "accepted", "in_transit", "delivered", "cancelled"];

  return (
    <div className="p-6 md:p-8 space-y-6 bg-gray-50">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Loads</h1>
          <p className="text-gray-500 text-sm mt-1">{total.toLocaleString()} total · refreshes every 30s</p>
        </div>
        <button type="button" onClick={() => fetchLoads()} className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition">Refresh</button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="px-4 py-2 rounded-lg bg-white border border-gray-200 text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {STATUSES.map((s) => <option key={s} value={s}>{s === "" ? "All statuses" : s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
        <form className="flex flex-1 gap-2" onSubmit={(e) => { e.preventDefault(); setSearch(searchInput); setPage(1); }}>
          <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search by description, recipient…" className="flex-1 px-4 py-2 rounded-lg bg-white border border-gray-200 text-gray-900 placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition">Search</button>
          {search && <button type="button" onClick={() => { setSearch(""); setSearchInput(""); setPage(1); }} className="px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm transition">Clear</button>}
        </form>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500 text-xs uppercase tracking-wider">
                <th className="text-left px-5 py-3.5 font-medium">Description</th>
                <th className="text-left px-5 py-3.5 font-medium">Route</th>
                <th className="text-left px-5 py-3.5 font-medium">Shipper</th>
                <th className="text-left px-5 py-3.5 font-medium">Offer</th>
                <th className="text-left px-5 py-3.5 font-medium">Bids</th>
                <th className="text-left px-5 py-3.5 font-medium">Status</th>
                <th className="text-left px-5 py-3.5 font-medium">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={7} className="py-16 text-center"><div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" /></td></tr>
              ) : loads.length === 0 ? (
                <tr><td colSpan={7} className="py-16 text-center text-gray-500">No loads found</td></tr>
              ) : loads.map((l) => {
                const shipperName = l.shipper?.businessName ?? [l.shipper?.firstName, l.shipper?.lastName].filter(Boolean).join(" ") ?? l.shipper?.email ?? "—";
                const route = [l.pickupCity ?? l.pickupState, l.deliveryCity ?? l.deliveryState].filter(Boolean).join(" → ") || "—";
                return (
                  <tr key={l.id} className="hover:bg-gray-50 transition">
                    <td className="px-5 py-3.5">
                      <p className="text-gray-900 font-medium truncate max-w-[180px]">{l.loadDescription}</p>
                      <p className="text-gray-500 text-xs mt-0.5">{l.truckType}</p>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600 whitespace-nowrap">{route}</td>
                    <td className="px-5 py-3.5 text-gray-700 truncate max-w-[140px]">{shipperName}</td>
                    <td className="px-5 py-3.5 text-gray-700 whitespace-nowrap">{l.offerAmount ? `₦${l.offerAmount.toLocaleString()}` : "—"}</td>
                    <td className="px-5 py-3.5 text-gray-700">{l._count?.bids ?? 0}</td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[l.status] ?? "bg-gray-100 text-gray-600"}`}>{l.status}</span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600 whitespace-nowrap">{new Date(l.createdAt).toLocaleDateString("en-NG")}</td>
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
