"use client";

import { useEffect, useState, useCallback, useRef } from "react";

type Load = {
  id: string;
  truckType: string;
  loadDescription: string;
  status: string;
  offerAmount?: number | null;
  loadImageUrl?: string | null;
  recipientName?: string | null;
  recipientNumber?: string | null;
  pickupCity?: string | null;
  deliveryCity?: string | null;
  pickupState?: string | null;
  deliveryState?: string | null;
  pickupAddress?: string | null;
  deliveryAddress?: string | null;
  pickupMapsUrl?: string | null;
  deliveryMapsUrl?: string | null;
  rejectedReason?: string | null;
  rejectedAt?: string | null;
  acceptedDriverId?: string | null;
  acceptedAt?: string | null;
  createdAt: string;
  shipper?: { id?: string; email?: string; businessName?: string | null; firstName?: string | null; lastName?: string | null; phoneNumber?: string | null } | null;
  _count?: { bids: number };
};

type Driver = { id: string; email: string; name: string; phoneNumber?: string | null };

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
  const [actionsOpenForId, setActionsOpenForId] = useState<string | null>(null);
  const actionsMenuRef = useRef<HTMLDivElement>(null);

  const [viewLoad, setViewLoad] = useState<Load | null>(null);
  const [viewLoadDetail, setViewLoadDetail] = useState<Record<string, unknown> | null>(null);
  const [viewLoadLoading, setViewLoadLoading] = useState(false);

  const [assignLoad, setAssignLoad] = useState<Load | null>(null);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [assignDriverId, setAssignDriverId] = useState("");
  const [assignLoading, setAssignLoading] = useState(false);

  const [rejectLoad, setRejectLoad] = useState<Load | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectLoading, setRejectLoading] = useState(false);

  const [imageLoad, setImageLoad] = useState<Load | null>(null);

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

  useEffect(() => {
    if (!actionsOpenForId) return;
    function handleClickOutside(e: MouseEvent) {
      if (actionsMenuRef.current && !actionsMenuRef.current.contains(e.target as Node)) {
        setActionsOpenForId(null);
      }
    }
    document.addEventListener("click", handleClickOutside, true);
    return () => document.removeEventListener("click", handleClickOutside, true);
  }, [actionsOpenForId]);

  useEffect(() => {
    if (!assignLoad) return;
    const token = localStorage.getItem("admin_token");
    fetch("/api/admin/drivers", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => setDrivers(data.drivers ?? []))
      .catch(() => setDrivers([]));
    setAssignDriverId("");
  }, [assignLoad]);

  async function fetchLoadDetail(loadId: string) {
    setViewLoadLoading(true);
    const token = localStorage.getItem("admin_token");
    try {
      const res = await fetch(`/api/admin/loads/${loadId}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setViewLoadDetail(res.ok ? data : null);
    } catch {
      setViewLoadDetail(null);
    } finally {
      setViewLoadLoading(false);
    }
  }

  async function handleAssign() {
    if (!assignLoad || !assignDriverId) return;
    setAssignLoading(true);
    const token = localStorage.getItem("admin_token");
    const res = await fetch(`/api/admin/loads/${assignLoad.id}/assign`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ driverId: assignDriverId }),
    });
    setAssignLoading(false);
    if (res.ok) {
      setAssignLoad(null);
      fetchLoads(false);
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "Failed to assign");
    }
  }

  async function handleReject() {
    if (!rejectLoad) return;
    setRejectLoading(true);
    const token = localStorage.getItem("admin_token");
    const res = await fetch(`/api/admin/loads/${rejectLoad.id}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ reason: rejectReason.trim() || "Rejected by admin" }),
    });
    setRejectLoading(false);
    if (res.ok) {
      setRejectLoad(null);
      setRejectReason("");
      fetchLoads(false);
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "Failed to reject");
    }
  }

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
                <th className="text-left px-5 py-3.5 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={8} className="py-16 text-center"><div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" /></td></tr>
              ) : loads.length === 0 ? (
                <tr><td colSpan={8} className="py-16 text-center text-gray-500">No loads found</td></tr>
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
                    <td className="px-5 py-3.5">
                      <div className="relative" ref={actionsOpenForId === l.id ? actionsMenuRef : undefined}>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setActionsOpenForId(actionsOpenForId === l.id ? null : l.id); }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                        >
                          Actions
                          <svg className={`w-4 h-4 text-gray-500 transition-transform ${actionsOpenForId === l.id ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        {actionsOpenForId === l.id && (
                          <div className="absolute right-0 top-full mt-1 z-20 min-w-[200px] py-1 bg-white border border-gray-200 rounded-lg shadow-lg">
                            <button
                              type="button"
                              onClick={() => { setViewLoad(l); setViewLoadDetail(null); fetchLoadDetail(l.id); setActionsOpenForId(null); }}
                              className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 transition first:rounded-t-lg"
                            >
                              View Load
                            </button>
                            <button
                              type="button"
                              onClick={() => { if (l.status === "available" || l.status === "applied") { setAssignLoad(l); setActionsOpenForId(null); } }}
                              disabled={l.status !== "available" && l.status !== "applied"}
                              title={l.status !== "available" && l.status !== "applied" ? "Only available or applied loads can be assigned" : undefined}
                              className="w-full text-left px-4 py-2.5 text-sm text-emerald-700 hover:bg-emerald-50 transition disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                            >
                              Assign Load to Driver
                            </button>
                            <button
                              type="button"
                              onClick={() => { if (l.status !== "delivered" && l.status !== "cancelled") { setRejectLoad(l); setRejectReason(""); setActionsOpenForId(null); } }}
                              disabled={l.status === "delivered" || l.status === "cancelled"}
                              title={l.status === "delivered" || l.status === "cancelled" ? "Cannot reject delivered or cancelled loads" : undefined}
                              className="w-full text-left px-4 py-2.5 text-sm text-red-700 hover:bg-red-50 transition disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                            >
                              Reject Load (Give Reasons)
                            </button>
                            <button
                              type="button"
                              onClick={() => { setImageLoad(l); setActionsOpenForId(null); }}
                              className="w-full text-left px-4 py-2.5 text-sm text-blue-700 hover:bg-blue-50 transition last:rounded-b-lg"
                            >
                              View Load Image
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
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

      {/* View Load modal */}
      {viewLoad && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setViewLoad(null)}>
          <div className="bg-white rounded-xl shadow-lg max-w-lg w-full max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900">Load details</h3>
            {viewLoadLoading ? (
              <div className="py-8 flex justify-center"><div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
            ) : viewLoadDetail ? (
              <div className="mt-4 space-y-3 text-sm">
                <p><span className="text-gray-500">Description:</span> <span className="text-gray-900">{(viewLoadDetail as Load).loadDescription}</span></p>
                <p><span className="text-gray-500">Truck type:</span> <span className="text-gray-900">{(viewLoadDetail as Load).truckType}</span></p>
                <p><span className="text-gray-500">Offer:</span> <span className="text-gray-900">₦{Number((viewLoadDetail as Load).offerAmount ?? 0).toLocaleString()}</span></p>
                <p><span className="text-gray-500">Pickup:</span> <span className="text-gray-900">{(viewLoadDetail as Load).pickupAddress ?? "—"}</span></p>
                <p><span className="text-gray-500">Delivery:</span> <span className="text-gray-900">{(viewLoadDetail as Load).deliveryAddress ?? "—"}</span></p>
                <p><span className="text-gray-500">Recipient:</span> <span className="text-gray-900">{(viewLoadDetail as Load).recipientName ?? "—"} {(viewLoadDetail as Load).recipientNumber ? ` · ${(viewLoadDetail as Load).recipientNumber}` : ""}</span></p>
                <p><span className="text-gray-500">Status:</span> <span className="text-gray-900">{(viewLoadDetail as Load).status}</span></p>
                {(viewLoadDetail as Load).rejectedReason && (
                  <p><span className="text-gray-500">Rejection reason:</span> <span className="text-red-600">{(viewLoadDetail as Load).rejectedReason}</span></p>
                )}
                {((viewLoadDetail as { shipper?: { email?: string; businessName?: string | null; firstName?: string | null; lastName?: string | null } }).shipper) && (
                  <p><span className="text-gray-500">Shipper:</span> <span className="text-gray-900">
                    {((viewLoadDetail as { shipper: { businessName?: string | null; firstName?: string | null; lastName?: string | null; email?: string } }).shipper).businessName ?? [((viewLoadDetail as { shipper: { firstName?: string | null; lastName?: string | null } }).shipper).firstName, ((viewLoadDetail as { shipper: { lastName?: string | null } }).shipper).lastName].filter(Boolean).join(" ") ?? ((viewLoadDetail as { shipper: { email?: string } }).shipper).email ?? "—"}
                  </span></p>
                )}
              </div>
            ) : (
              <p className="mt-4 text-gray-500">Could not load details.</p>
            )}
            <button type="button" onClick={() => setViewLoad(null)} className="mt-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium">Close</button>
          </div>
        </div>
      )}

      {/* Assign Load modal */}
      {assignLoad && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => !assignLoading && setAssignLoad(null)}>
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900">Assign load to driver</h3>
            <p className="mt-1 text-sm text-gray-600 truncate">{assignLoad.loadDescription}</p>
            <label className="block mt-4 text-sm font-medium text-gray-700">Driver</label>
            <select
              value={assignDriverId}
              onChange={(e) => setAssignDriverId(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-200 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select driver…</option>
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>{d.name} ({d.email})</option>
              ))}
            </select>
            <div className="mt-4 flex gap-2">
              <button type="button" onClick={handleAssign} disabled={assignLoading || !assignDriverId} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white rounded-lg text-sm font-medium">Assign</button>
              <button type="button" onClick={() => setAssignLoad(null)} disabled={assignLoading} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Load modal */}
      {rejectLoad && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => !rejectLoading && setRejectLoad(null)}>
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900">Reject load</h3>
            <p className="mt-1 text-sm text-gray-600 truncate">{rejectLoad.loadDescription}</p>
            <label className="block mt-4 text-sm font-medium text-gray-700">Reason (optional)</label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              placeholder="Give a reason for rejection…"
              className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-200 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="mt-4 flex gap-2">
              <button type="button" onClick={handleReject} disabled={rejectLoading} className="px-4 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-60 text-white rounded-lg text-sm font-medium">Reject load</button>
              <button type="button" onClick={() => setRejectLoad(null)} disabled={rejectLoading} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* View Load Image modal */}
      {imageLoad && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setImageLoad(null)}>
          <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900">Load image</h3>
            <p className="mt-1 text-sm text-gray-600 truncate">{imageLoad.loadDescription}</p>
            <div className="mt-4">
              {imageLoad.loadImageUrl ? (
                <img src={imageLoad.loadImageUrl} alt="Load" className="w-full rounded-lg border border-gray-200 object-contain max-h-[70vh]" />
              ) : (
                <div className="py-12 text-center text-gray-500 bg-gray-50 rounded-lg border border-gray-200">No image for this load</div>
              )}
            </div>
            <button type="button" onClick={() => setImageLoad(null)} className="mt-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
