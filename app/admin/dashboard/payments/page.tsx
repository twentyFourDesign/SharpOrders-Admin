"use client";

import { useEffect, useState, useCallback } from "react";

type Payment = {
  id: string;
  amount: number;
  amountNaira: number;
  status: string;
  reference?: string | null;
  createdAt: string;
  bid?: {
    offerAmount?: number | null;
    driver?: { email?: string; firstName?: string | null; lastName?: string | null } | null;
    load?: {
      loadDescription?: string | null;
      shipper?: { email?: string; businessName?: string | null } | null;
    } | null;
  } | null;
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  success: "bg-emerald-100 text-emerald-700",
  failed: "bg-red-100 text-red-700",
};

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const LIMIT = 20;

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem("admin_token");
    const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
    if (status) params.set("status", status);
    const res = await fetch(`/api/admin/payments?${params}`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setPayments(data.payments ?? []);
    setTotal(data.total ?? 0);
    setLoading(false);
  }, [page, status]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  return (
    <div className="p-6 md:p-8 space-y-6 bg-gray-50">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
        <p className="text-gray-500 text-sm mt-1">{total.toLocaleString()} total payment records</p>
      </div>

      <div className="flex gap-3">
        <div className="flex rounded-xl overflow-hidden border border-slate-700 bg-slate-900 text-sm">
          {(["", "pending", "success", "failed"] as const).map((s) => (
            <button key={s} onClick={() => { setStatus(s); setPage(1); }} className={`px-4 py-2 font-medium transition ${status === s ? "bg-blue-600 text-gray-900" : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"}`}>
              {s === "" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500 text-xs uppercase tracking-wider">
                <th className="text-left px-5 py-3.5 font-medium">Amount</th>
                <th className="text-left px-5 py-3.5 font-medium">Reference</th>
                <th className="text-left px-5 py-3.5 font-medium">Shipper</th>
                <th className="text-left px-5 py-3.5 font-medium">Driver</th>
                <th className="text-left px-5 py-3.5 font-medium">Load</th>
                <th className="text-left px-5 py-3.5 font-medium">Status</th>
                <th className="text-left px-5 py-3.5 font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={7} className="py-16 text-center"><div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" /></td></tr>
              ) : payments.length === 0 ? (
                <tr><td colSpan={7} className="py-16 text-center text-gray-500">No payments found</td></tr>
              ) : payments.map((p) => {
                const driverName = [p.bid?.driver?.firstName, p.bid?.driver?.lastName].filter(Boolean).join(" ") || p.bid?.driver?.email || "—";
                return (
                  <tr key={p.id} className="hover:bg-gray-50 transition">
                    <td className="px-5 py-3.5">
                      <p className="text-gray-900 font-semibold">₦{p.amountNaira.toLocaleString()}</p>
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 font-mono text-xs truncate max-w-[120px]">{p.reference ?? "—"}</td>
                    <td className="px-5 py-3.5 text-gray-700 truncate max-w-[130px]">{p.bid?.load?.shipper?.businessName ?? p.bid?.load?.shipper?.email ?? "—"}</td>
                    <td className="px-5 py-3.5 text-gray-700 truncate max-w-[130px]">{driverName}</td>
                    <td className="px-5 py-3.5 text-gray-500 truncate max-w-[160px]">{p.bid?.load?.loadDescription ?? "—"}</td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[p.status] ?? "bg-gray-100 text-gray-500"}`}>{p.status}</span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 whitespace-nowrap">{new Date(p.createdAt).toLocaleDateString("en-NG")}</td>
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
