"use client";

import { useEffect, useState, useCallback } from "react";

type Reply = { id: string; message: string; isFromStaff: boolean; createdAt: string };
type TicketUser = {
  id?: string;
  email?: string;
  userType?: string;
  businessName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  displayName?: string | null;
  phone?: string | null;
  phoneNumber?: string | null;
};
type Ticket = {
  id: string;
  title: string;
  description: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  user?: TicketUser | null;
  replies?: Reply[];
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
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [sendingReply, setSendingReply] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const LIMIT = 20;

  const fetchTickets = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    const token = localStorage.getItem("admin_token");
    const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
    if (status) params.set("status", status);
    const res = await fetch(`/api/admin/support?${params}`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setTickets(data.tickets ?? []);
    setTotal(data.total ?? 0);
    setLoading(false);
    setRefreshing(false);
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
    fetchTickets(true);
  }

  async function sendReply(ticketId: string) {
    const message = replyText[ticketId]?.trim();
    if (!message) return;
    setSendingReply(ticketId);
    const token = localStorage.getItem("admin_token");
    try {
      const res = await fetch(`/api/admin/support/tickets/${ticketId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message }),
      });
      if (res.ok) {
        setReplyText((prev) => ({ ...prev, [ticketId]: "" }));
        fetchTickets(true);
      }
    } finally {
      setSendingReply(null);
    }
  }

  function onRefresh() {
    setRefreshing(true);
    fetchTickets(true);
  }

  return (
    <div className="p-6 md:p-8 space-y-6 bg-gray-50">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Support Tickets</h1>
          <p className="text-gray-500 text-sm mt-1">{total.toLocaleString()} total tickets</p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60 transition"
        >
          {refreshing ? "Refreshing…" : "Refresh"}
        </button>
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
            const u = t.user;
            const displayName = u?.displayName?.trim() || (u?.businessName?.trim()) || [u?.firstName, u?.lastName].filter(Boolean).join(" ").trim() || u?.email || "Unknown user";
            const phone = (u?.phoneNumber?.trim() || u?.phone?.trim()) || null;
            const role = u?.userType ? (String(u.userType) === "driver" ? "Driver" : "Shipper") : null;
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
                      {role && <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">{role}</span>}
                    </div>
                    <p className="text-gray-500 text-xs mt-0.5">{displayName}{u?.email ? ` · ${u.email}` : ""} · {new Date(t.createdAt).toLocaleDateString("en-NG")}</p>
                  </div>
                  <svg className={`w-4 h-4 text-gray-500 shrink-0 mt-1 transition-transform ${isExpanded ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isExpanded && (
                  <div className="px-5 pb-4 border-t border-gray-200 pt-4 space-y-4">
                    {u && (
                      <div className="rounded-lg bg-gray-50 border border-gray-100 p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div><span className="text-gray-500">Role</span><p className="text-gray-900 font-medium">{role ?? "—"}</p></div>
                        <div><span className="text-gray-500">Name</span><p className="text-gray-900">{displayName}</p></div>
                        <div><span className="text-gray-500">Email</span><p className="text-gray-900">{u.email ?? "—"}</p></div>
                        <div><span className="text-gray-500">Phone</span><p className="text-gray-900">{phone ?? "—"}</p></div>
                        {u.businessName && <div className="sm:col-span-2"><span className="text-gray-500">Business</span><p className="text-gray-900">{u.businessName}</p></div>}
                      </div>
                    )}
                    <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{t.description}</p>

                    {(t.replies?.length ?? 0) > 0 && (
                      <div className="space-y-2">
                        <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">Replies</p>
                        {t.replies!.map((r) => (
                          <div
                            key={r.id}
                            className={`rounded-lg p-3 text-sm ${r.isFromStaff ? "bg-blue-50 border border-blue-100" : "bg-gray-50 border border-gray-100"}`}
                          >
                            <p className="text-gray-500 text-xs font-medium mb-1">{r.isFromStaff ? "Support" : "User"}</p>
                            <p className="text-gray-800 whitespace-pre-wrap">{r.message}</p>
                            <p className="text-gray-400 text-xs mt-1">{new Date(r.createdAt).toLocaleString("en-NG")}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="space-y-2">
                      <label className="block text-gray-600 text-xs font-medium">Reply as support</label>
                      <textarea
                        value={replyText[t.id] ?? ""}
                        onChange={(e) => setReplyText((prev) => ({ ...prev, [t.id]: e.target.value }))}
                        placeholder="Type your reply…"
                        rows={3}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button
                        type="button"
                        onClick={() => sendReply(t.id)}
                        disabled={sendingReply === t.id || !(replyText[t.id]?.trim())}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition"
                      >
                        {sendingReply === t.id ? "Sending…" : "Send reply"}
                      </button>
                    </div>

                    {NEXT_STATUSES[t.status]?.length > 0 && (
                      <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-gray-100">
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
