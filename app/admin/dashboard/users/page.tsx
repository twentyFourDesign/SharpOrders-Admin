"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";

type User = {
  id: string;
  email: string;
  role: "shipper" | "driver";
  firstName?: string | null;
  lastName?: string | null;
  businessName?: string | null;
  phone?: string | null;
  phoneNumber?: string | null;
  emailVerified: boolean;
  suspendedUntil?: string | null;
  isBlacklisted?: boolean;
  createdAt: string;
};

const ROLE_LABELS = { shipper: "Shipper", driver: "Driver" } as const;
const ROLE_COLORS = { shipper: "bg-emerald-100 text-emerald-700", driver: "bg-blue-100 text-blue-700" };

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [role, setRole] = useState<"" | "shipper" | "driver">("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionsOpenForId, setActionsOpenForId] = useState<string | null>(null);
  const actionsMenuRef = useRef<HTMLDivElement>(null);
  const [viewIdUser, setViewIdUser] = useState<User | null>(null);
  const [suspendUser, setSuspendUser] = useState<User | null>(null);
  const [suspendHours, setSuspendHours] = useState("24");
  const [suspendLoading, setSuspendLoading] = useState(false);
  const [blacklistUser, setBlacklistUser] = useState<User | null>(null);
  const [blacklistLoading, setBlacklistLoading] = useState(false);
  const router = useRouter();
  const LIMIT = 20;

  const fetchUsers = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    const token = localStorage.getItem("admin_token");
    const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
    if (role) params.set("role", role);
    if (search) params.set("search", search);
    const res = await fetch(`/api/admin/users?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const data = await res.json();
    setUsers(data.users ?? []);
    setTotal(data.total ?? 0);
    setLoading(false);
  }, [page, role, search]);

  useEffect(() => {
    fetchUsers();
    const interval = setInterval(() => fetchUsers(false), 30_000);
    return () => clearInterval(interval);
  }, [fetchUsers]);

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

  function displayName(u: User) {
    if (u.businessName) return u.businessName;
    const name = [u.firstName, u.lastName].filter(Boolean).join(" ");
    return name || u.email;
  }

  async function handleSuspend() {
    if (!suspendUser) return;
    setSuspendLoading(true);
    const token = localStorage.getItem("admin_token");
    const res = await fetch(`/api/admin/users/${suspendUser.id}/suspend`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ durationHours: Number(suspendHours) || 24 }),
    });
    setSuspendLoading(false);
    if (res.ok) {
      setSuspendUser(null);
      setSuspendHours("24");
      fetchUsers(false);
    }
  }

  async function handleBlacklist(blacklist: boolean) {
    if (!blacklistUser) return;
    setBlacklistLoading(true);
    const token = localStorage.getItem("admin_token");
    const res = await fetch(`/api/admin/users/${blacklistUser.id}/blacklist`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ blacklist }),
    });
    setBlacklistLoading(false);
    if (res.ok) {
      setBlacklistUser(null);
      fetchUsers(false);
    }
  }

  return (
    <div className="p-6 md:p-8 space-y-6 bg-gray-50">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-500 text-sm mt-1">{total.toLocaleString()} total · refreshes every 30s</p>
        </div>
        <button type="button" onClick={() => fetchUsers()} className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition">Refresh</button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex rounded-lg overflow-hidden border border-gray-200 bg-white text-sm">
          {(["", "shipper", "driver"] as const).map((r) => (
            <button
              key={r}
              onClick={() => { setRole(r); setPage(1); }}
              className={`px-4 py-2 font-medium transition ${role === r ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"}`}
            >
              {r === "" ? "All" : ROLE_LABELS[r]}
            </button>
          ))}
        </div>
        <form className="flex flex-1 gap-2" onSubmit={(e) => { e.preventDefault(); setSearch(searchInput); setPage(1); }}>
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by name, email…"
            className="flex-1 px-4 py-2 rounded-lg bg-white border border-gray-200 text-gray-900 placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition">Search</button>
          {search && (
            <button type="button" onClick={() => { setSearch(""); setSearchInput(""); setPage(1); }} className="px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm transition">Clear</button>
          )}
        </form>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500 text-xs uppercase tracking-wider">
                <th className="text-left px-5 py-3.5 font-medium">Name</th>
                <th className="text-left px-5 py-3.5 font-medium">Email</th>
                <th className="text-left px-5 py-3.5 font-medium">Role</th>
                <th className="text-left px-5 py-3.5 font-medium">Phone</th>
                <th className="text-left px-5 py-3.5 font-medium">Status</th>
                <th className="text-left px-5 py-3.5 font-medium">Joined</th>
                <th className="text-left px-5 py-3.5 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={7} className="py-16 text-center text-gray-500">
                  <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                </td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={7} className="py-16 text-center text-gray-500">No users found</td></tr>
              ) : users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50 transition">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold shrink-0">
                        {displayName(u)[0].toUpperCase()}
                      </div>
                      <span className="text-gray-900 font-medium truncate max-w-[160px]">{displayName(u)}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-gray-700">{u.email}</td>
                  <td className="px-5 py-3.5">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[u.role]}`}>
                      {ROLE_LABELS[u.role]}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-gray-600">{u.phone ?? u.phoneNumber ?? "—"}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex flex-wrap gap-1">
                      {u.isBlacklisted && <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">Blacklisted</span>}
                      {u.suspendedUntil && new Date(u.suspendedUntil) > new Date() && <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">Suspended</span>}
                      {u.emailVerified && <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">Verified</span>}
                      {!u.isBlacklisted && (!u.suspendedUntil || new Date(u.suspendedUntil) <= new Date()) && !u.emailVerified && <span className="text-gray-400 text-xs">—</span>}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-gray-600 whitespace-nowrap">
                    {new Date(u.createdAt).toLocaleDateString("en-NG")}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="relative" ref={actionsOpenForId === u.id ? actionsMenuRef : undefined}>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setActionsOpenForId(actionsOpenForId === u.id ? null : u.id); }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                      >
                        Actions
                        <svg className={`w-4 h-4 text-gray-500 transition-transform ${actionsOpenForId === u.id ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {actionsOpenForId === u.id && (
                        <div className="absolute right-0 top-full mt-1 z-20 min-w-[160px] py-1 bg-white border border-gray-200 rounded-lg shadow-lg">
                          <button
                            type="button"
                            onClick={() => { setViewIdUser(u); setActionsOpenForId(null); }}
                            className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 transition first:rounded-t-lg"
                          >
                            View ID
                          </button>
                          <button
                            type="button"
                            onClick={() => { setSuspendUser(u); setSuspendHours("24"); setActionsOpenForId(null); }}
                            className="w-full text-left px-4 py-2.5 text-sm text-amber-700 hover:bg-amber-50 transition"
                          >
                            Suspend
                          </button>
                          <button
                            type="button"
                            onClick={() => { setBlacklistUser(u); setActionsOpenForId(null); }}
                            className="w-full text-left px-4 py-2.5 text-sm text-red-700 hover:bg-red-50 transition"
                          >
                            {u.isBlacklisted ? "Unblacklist" : "Blacklist"}
                          </button>
                            <button
                              type="button"
                              onClick={() => { router.push(`/admin/dashboard/chat/${u.id}`); setActionsOpenForId(null); }}
                              className="w-full text-left px-4 py-2.5 text-sm text-blue-700 hover:bg-blue-50 transition last:rounded-b-lg"
                            >
                              Message
                            </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
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

      {/* View ID modal */}
      {viewIdUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setViewIdUser(null)}>
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900">User ID</h3>
            <p className="mt-2 text-sm text-gray-600 font-mono break-all">{viewIdUser.id}</p>
            <button type="button" onClick={() => setViewIdUser(null)} className="mt-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium">Close</button>
          </div>
        </div>
      )}

      {/* Suspend modal */}
      {suspendUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => !suspendLoading && setSuspendUser(null)}>
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900">Suspend user</h3>
            <p className="mt-1 text-sm text-gray-600">{displayName(suspendUser)} ({suspendUser.email})</p>
            <label className="block mt-4 text-sm font-medium text-gray-700">Duration (hours)</label>
            <input type="number" min={1} value={suspendHours} onChange={(e) => setSuspendHours(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-200 text-gray-900 text-sm" />
            <div className="mt-4 flex gap-2">
              <button type="button" onClick={handleSuspend} disabled={suspendLoading} className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-60 text-white rounded-lg text-sm font-medium">Suspend</button>
              <button type="button" onClick={() => setSuspendUser(null)} disabled={suspendLoading} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Blacklist confirm modal */}
      {blacklistUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => !blacklistLoading && setBlacklistUser(null)}>
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900">{blacklistUser.isBlacklisted ? "Remove from blacklist?" : "Blacklist user?"}</h3>
            <p className="mt-1 text-sm text-gray-600">{displayName(blacklistUser)} ({blacklistUser.email})</p>
            <div className="mt-4 flex gap-2">
              <button type="button" onClick={() => handleBlacklist(!blacklistUser.isBlacklisted)} disabled={blacklistLoading} className={`px-4 py-2 rounded-lg text-sm font-medium ${blacklistUser.isBlacklisted ? "bg-emerald-600 hover:bg-emerald-500" : "bg-red-600 hover:bg-red-500"} text-white disabled:opacity-60`}>
                {blacklistLoading ? "…" : blacklistUser.isBlacklisted ? "Unblacklist" : "Blacklist"}
              </button>
              <button type="button" onClick={() => setBlacklistUser(null)} disabled={blacklistLoading} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium">Cancel</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
