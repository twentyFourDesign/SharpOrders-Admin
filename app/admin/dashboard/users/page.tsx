"use client";

import { useEffect, useState, useCallback } from "react";

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
  const LIMIT = 20;

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem("admin_token");
    const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
    if (role) params.set("role", role);
    if (search) params.set("search", search);
    const res = await fetch(`/api/admin/users?${params}`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setUsers(data.users ?? []);
    setTotal(data.total ?? 0);
    setLoading(false);
  }, [page, role, search]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  function displayName(u: User) {
    if (u.businessName) return u.businessName;
    const name = [u.firstName, u.lastName].filter(Boolean).join(" ");
    return name || u.email;
  }

  return (
    <div className="p-6 md:p-8 space-y-6 bg-gray-50">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <p className="text-gray-500 text-sm mt-1">{total.toLocaleString()} total registered users</p>
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
                <th className="text-left px-5 py-3.5 font-medium">Verified</th>
                <th className="text-left px-5 py-3.5 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={6} className="py-16 text-center text-gray-500">
                  <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                </td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={6} className="py-16 text-center text-gray-500">No users found</td></tr>
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
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.emailVerified ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"}`}>
                      {u.emailVerified ? "Yes" : "No"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-gray-600 whitespace-nowrap">
                    {new Date(u.createdAt).toLocaleDateString("en-NG")}
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
    </div>
  );
}
