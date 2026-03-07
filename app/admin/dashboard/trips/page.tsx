"use client";

import { useEffect, useState, useCallback } from "react";

type Shipment = {
  id: string;
  status: string;
  fareOffer?: number | null;
  createdAt: string;
  shipper?: { email?: string; businessName?: string | null; firstName?: string | null; lastName?: string | null } | null;
  driver?: { email?: string; firstName?: string | null; lastName?: string | null } | null;
  load?: {
    loadDescription?: string | null;
    truckType?: string | null;
    pickupCity?: string | null;
    deliveryCity?: string | null;
    pickupState?: string | null;
    deliveryState?: string | null;
  } | null;
};

const STATUS_COLORS: Record<string, string> = {
  active: "bg-blue-100 text-blue-700",
  in_transit: "bg-yellow-100 text-yellow-700",
  delivered: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function AdminTripsPage() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const LIMIT = 20;

  const fetchTrips = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem("admin_token");
    const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
    if (status) params.set("status", status);
    const res = await fetch(`/api/admin/trips?${params}`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setShipments(data.shipments ?? []);
    setTotal(data.total ?? 0);
    setLoading(false);
  }, [page, status]);

  useEffect(() => { fetchTrips(); }, [fetchTrips]);

  const STATUSES = ["", "active", "in_transit", "delivered", "cancelled"];

  return (
    <div className="p-6 md:p-8 space-y-6 bg-gray-50">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Trips</h1>
        <p className="text-gray-500 text-sm mt-1">{total.toLocaleString()} total trips</p>
      </div>

      <div className="flex gap-3">
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="px-4 py-2 rounded-xl bg-white border border-gray-200 text-gray-700 text-sm focus:outline-none focus:border-blue-600"
        >
          {STATUSES.map((s) => <option key={s} value={s}>{s === "" ? "All statuses" : s.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}</option>)}
        </select>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500 text-xs uppercase tracking-wider">
                <th className="text-left px-5 py-3.5 font-medium">Load</th>
                <th className="text-left px-5 py-3.5 font-medium">Route</th>
                <th className="text-left px-5 py-3.5 font-medium">Shipper</th>
                <th className="text-left px-5 py-3.5 font-medium">Driver</th>
                <th className="text-left px-5 py-3.5 font-medium">Fare (₦)</th>
                <th className="text-left px-5 py-3.5 font-medium">Status</th>
                <th className="text-left px-5 py-3.5 font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={7} className="py-16 text-center"><div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" /></td></tr>
              ) : shipments.length === 0 ? (
                <tr><td colSpan={7} className="py-16 text-center text-gray-500">No trips found</td></tr>
              ) : shipments.map((s) => {
                const route = [s.load?.pickupCity ?? s.load?.pickupState, s.load?.deliveryCity ?? s.load?.deliveryState].filter(Boolean).join(" → ") || "—";
                const shipperName = s.shipper?.businessName ?? [s.shipper?.firstName, s.shipper?.lastName].filter(Boolean).join(" ") ?? s.shipper?.email ?? "—";
                const driverName = [s.driver?.firstName, s.driver?.lastName].filter(Boolean).join(" ") || s.driver?.email || "—";
                return (
                  <tr key={s.id} className="hover:bg-gray-50 transition">
                    <td className="px-5 py-3.5">
                      <p className="text-gray-900 truncate max-w-[160px]">{s.load?.loadDescription ?? "—"}</p>
                      <p className="text-slate-500 text-xs">{s.load?.truckType}</p>
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 whitespace-nowrap">{route}</td>
                    <td className="px-5 py-3.5 text-gray-700 truncate max-w-[130px]">{shipperName}</td>
                    <td className="px-5 py-3.5 text-gray-700 truncate max-w-[130px]">{driverName}</td>
                    <td className="px-5 py-3.5 text-gray-700">{s.fareOffer ? `₦${s.fareOffer.toLocaleString()}` : "—"}</td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[s.status] ?? "bg-gray-200 text-gray-500"}`}>{s.status.replace("_", " ")}</span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 whitespace-nowrap">{new Date(s.createdAt).toLocaleDateString("en-NG")}</td>
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
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 bg-gray-200 hover:bg-slate-700 disabled:opacity-40 text-gray-700 rounded-lg transition">Prev</button>
              <button onClick={() => setPage((p) => p + 1)} disabled={page * LIMIT >= total} className="px-3 py-1.5 bg-gray-200 hover:bg-slate-700 disabled:opacity-40 text-gray-700 rounded-lg transition">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
