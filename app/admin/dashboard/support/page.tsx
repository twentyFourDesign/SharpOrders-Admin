"use client";

import { useEffect, useState, useCallback } from "react";

type Ticket = {
  id: string;
  title: string;
  description: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  user?: { id?: string; email?: string; businessName?: string | null; firstName?: string | null; lastName?: string | null } | null;
};

const STATUS_COLORS: Record<string, string> = {
  open: "bg-red-100 text-red-700",
  in_progress: "bg-yellow-100 text-yellow-700",
  resolved: "bg-emerald-100 text-emerald-700",
  closed: "bg-gray-100 text-gray-600",
};

const NEXT_STATUSES: Record<string, string[]> = {
  open: ["in_progress", "resolved", "closed"],
  in_progress: ["resolved", "closed"],
  resolved: ["closed"],
  closed: [],
};

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const LIMIT = 20;

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem("admin_token");
    const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
    if (status) params.set("status", status);
    const res = await fetch(`/api/admin/support?${params}`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setTickets(data.tickets ?? []);
    setTotal(data.total ?? 0);
    setLoading(false);
  }, [page, status]);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  async function updateStatus(id: string, newStatus: string) {
    setUpdating(id);
    const token = localStorage.getItem("admin_token");
    await fetch("/api/admin/support", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id, status: newStatus }),
    });
    setUpdating(null);
    fetchTickets();
  }

  return (
    <div className="p-6 md:p-8 space-y-6 bg-gray-50">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Support Tickets</h1>
        <p className="text-gray-500 text-sm mt-1">{total.toLocaleString()} total tickets</p>
      </div>

      <div className="flex gap-3">
        <div className="flex rounded-lg overflow-hidden border border-gray-200 bg-white text-sm">
          {(["", "open", "in_progress", "resolved", "closed"] as const).map((s) => (
            <button key={s} onClick={() => { setStatus(s); setPage(1); }} className={`px-4 py-2 font-medium transition ${status === s ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"}`}>
              {s === "" ? "All" : s.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-16 text-gray-500">No tickets found</div>
      ) : (
        <div className="space-y-3">
          {tickets.map((t) => {
            const userName = t.user?.businessName ?? [t.user?.firstName, t.user?.lastName].filter(Boolean).join(" ") ?? t.user?.email ?? "Unknown user";
            const isExpanded = expanded === t.id;
            return (
              <div key={t.id} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <button
                  className="w-full flex items-start gap-4 px-5 py-4 text-left hover:bg-gray-50 transition"
                  onClick={() => setExpanded(isExpanded ? null : t.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-gray-900 font-medium">{t.title}</p>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[t.status] ?? "bg-gray-100 text-gray-600"}`}>{t.status.replace("_", " ")}</span>
                    </div>
                    <p className="text-gray-500 text-xs mt-0.5">{userName} · {new Date(t.createdAt).toLocaleDateString("en-NG")}</p>
                  </div>
                  <svg className={`w-4 h-4 text-gray-500 shrink-0 mt-1 transition-transform ${isExpanded ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isExpanded && (
                  <div className="px-5 pb-4 border-t border-gray-200 pt-4">
                    <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{t.description}</p>
                    {NEXT_STATUSES[t.status]?.length > 0 && (
                      <div className="flex items-center gap-2 mt-4 flex-wrap">
                        <p className="text-gray-500 text-xs">Update status:</p>
                        {NEXT_STATUSES[t.status].map((ns) => (
                          <button
                            key={ns}
                            onClick={() => updateStatus(t.id, ns)}
                            disabled={updating === t.id}
                            className="px-3 py-1 bg-gray-200 hover:bg-gray-300 disabled:opacity-60 text-gray-700 rounded-lg text-xs font-medium transition"
                          >
                            {updating === t.id ? "…" : ns.replace("_", " ")}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {total > LIMIT && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-gray-500">Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 disabled:opacity-40 text-gray-700 rounded-lg transition">Prev</button>
            <button onClick={() => setPage((p) => p + 1)} disabled={page * LIMIT >= total} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 disabled:opacity-40 text-gray-700 rounded-lg transition">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
