"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

type StatusTab = "all" | "pending" | "processing" | "completed" | "rejected";

type PayoutRequest = {
  id: string;
  requestedAt: string;
  driverId: string;
  driverName: string;
  driverPhone: string | null;
  driverEmail: string;
  amountKobo: number;
  amountNaira: number;
  bankName: string;
  bankAccountName: string;
  bankAccountNumber: string;
  status: string;
  riskBankDetailsRecent: boolean;
  riskUnusuallyLarge: boolean;
  bankReferenceNumber: string | null;
  rejectionReason: string | null;
  processedAt: string | null;
};

type DriverContext = {
  request: {
    id: string;
    amountKobo: number;
    amountNaira: number;
    status: string;
    requestedAt: string;
    bankName: string;
    bankAccountName: string;
    bankAccountNumber: string;
    bankReferenceNumber: string | null;
    proofOfPaymentUrl: string | null;
    rejectionReason: string | null;
    processedAt: string | null;
    riskBankDetailsRecent: boolean;
    riskUnusuallyLarge: boolean;
  };
  driver: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    kycName: string;
    bankAccountName: string;
    nameMismatch: boolean;
  };
  ledger: {
    completedTrips: number;
    totalEarned: number;
    platformDeduction: number;
    netEarnings: number;
    currentBalanceKobo: number;
    transactions: Array<{
      id: string;
      type: string;
      amount: number;
      amountNaira: number;
      description: string;
      status: string;
      createdAt: string;
    }>;
  };
  lastFivePayouts: Array<{
    id: string;
    amountNaira: number;
    processedAt: string | null;
    bankReferenceNumber: string | null;
  }>;
};

const REJECTION_REASONS = [
  "Invalid bank details",
  "Suspected fraud",
  "System error",
  "Duplicate request",
  "Other",
] as const;

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        copy();
      }}
      className="inline-flex items-center gap-1 text-gray-600 hover:text-gray-800 ml-1"
      title={`Copy ${label}`}
    >
      {copied ? (
        <span className="text-emerald-600 text-xs">Copied</span>
      ) : (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h2m0 0v2m0 8v2m0 0h2a2 2 0 002-2v-2m0-4v-2m0-4V6a2 2 0 00-2-2h-2m0 0V4m0 8h.01" />
        </svg>
      )}
    </button>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export default function PayoutQueuePage() {
  const [tab, setTab] = useState<StatusTab>("all");
  const [requests, setRequests] = useState<PayoutRequest[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [drawerRequestId, setDrawerRequestId] = useState<string | null>(null);
  const [drawerData, setDrawerData] = useState<DriverContext | null>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [markPaidRequest, setMarkPaidRequest] = useState<PayoutRequest | null>(null);
  const [markPaidRef, setMarkPaidRef] = useState("");
  const [markPaidNotes, setMarkPaidNotes] = useState("");
  const [markPaidProofUrl, setMarkPaidProofUrl] = useState<string | null>(null);
  const [markPaidProofUploading, setMarkPaidProofUploading] = useState(false);
  const [markPaidLoading, setMarkPaidLoading] = useState(false);
  const [rejectRequest, setRejectRequest] = useState<PayoutRequest | null>(null);
  const [rejectReason, setRejectReason] = useState<string>("");
  const [rejectLoading, setRejectLoading] = useState(false);
  const [bulkReconcileOpen, setBulkReconcileOpen] = useState(false);
  const [bulkMasterRef, setBulkMasterRef] = useState("");
  const [bulkReconcileLoading, setBulkReconcileLoading] = useState(false);
  const [drawerMarkPaidRef, setDrawerMarkPaidRef] = useState("");
  const [drawerMarkPaidNotes, setDrawerMarkPaidNotes] = useState("");
  const [drawerInvoiceUrl, setDrawerInvoiceUrl] = useState<string | null>(null);
  const [drawerInvoiceUploading, setDrawerInvoiceUploading] = useState(false);
  const [drawerMarkPaidLoading, setDrawerMarkPaidLoading] = useState(false);
  const LIMIT = 20;

  const fetchList = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem("admin_token");
    const params = new URLSearchParams({
      page: String(page),
      limit: String(LIMIT),
    });
    if (tab !== "all") params.set("status", tab);
    const res = await fetch(`/api/admin/payout-queue?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const data = await res.json();
    setRequests(data.requests ?? []);
    setTotal(data.total ?? 0);
    setLoading(false);
  }, [tab, page]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  useEffect(() => {
    setSelectedIds(new Set());
    setPage(1);
  }, [tab]);

  const fetchDrawer = useCallback(async (id: string) => {
    setDrawerRequestId(id);
    setDrawerData(null);
    setDrawerLoading(true);
    const token = localStorage.getItem("admin_token");
    const res = await fetch(`/api/admin/payout-queue/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (res.ok) setDrawerData(data);
    setDrawerLoading(false);
  }, []);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === requests.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(requests.map((r) => r.id)));
  };

  const selectedList = requests.filter((r) => selectedIds.has(r.id));
  const selectedProcessing = selectedList.filter((r) => r.status === "processing");

  async function setProcessing(id: string) {
    const token = localStorage.getItem("admin_token");
    await fetch(`/api/admin/payout-queue/${id}/processing`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchList();
  }

  async function handleDrawerInvoiceUpload(file: File) {
    setDrawerInvoiceUploading(true);
    setDrawerInvoiceUrl(null);
    const token = localStorage.getItem("admin_token");
    const form = new FormData();
    form.set("file", file);
    const res = await fetch("/api/admin/upload/proof-of-payment", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
    const data = await res.json();
    setDrawerInvoiceUploading(false);
    if (res.ok && data.url) setDrawerInvoiceUrl(data.url);
  }

  async function handleDrawerMarkPaid() {
    if (!drawerRequestId || !drawerMarkPaidRef.trim()) return;
    setDrawerMarkPaidLoading(true);
    const token = localStorage.getItem("admin_token");
    const res = await fetch(`/api/admin/payout-queue/${drawerRequestId}/mark-paid`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        bankReferenceNumber: drawerMarkPaidRef.trim(),
        internalNotes: drawerMarkPaidNotes.trim() || undefined,
        proofOfPaymentUrl: drawerInvoiceUrl || undefined,
      }),
    });
    setDrawerMarkPaidLoading(false);
    if (res.ok) {
      setDrawerRequestId(null);
      setDrawerMarkPaidRef("");
      setDrawerMarkPaidNotes("");
      setDrawerInvoiceUrl(null);
      fetchList();
    }
  }

  async function handleProofUpload(file: File) {
    setMarkPaidProofUploading(true);
    setMarkPaidProofUrl(null);
    const token = localStorage.getItem("admin_token");
    const form = new FormData();
    form.set("file", file);
    const res = await fetch("/api/admin/upload/proof-of-payment", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
    const data = await res.json();
    setMarkPaidProofUploading(false);
    if (res.ok && data.url) setMarkPaidProofUrl(data.url);
  }

  async function handleMarkPaid() {
    if (!markPaidRequest || !markPaidRef.trim()) return;
    setMarkPaidLoading(true);
    const token = localStorage.getItem("admin_token");
    const res = await fetch(`/api/admin/payout-queue/${markPaidRequest.id}/mark-paid`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        bankReferenceNumber: markPaidRef.trim(),
        internalNotes: markPaidNotes.trim() || undefined,
        proofOfPaymentUrl: markPaidProofUrl || undefined,
      }),
    });
    setMarkPaidLoading(false);
    if (res.ok) {
      setMarkPaidRequest(null);
      setMarkPaidRef("");
      setMarkPaidNotes("");
      setMarkPaidProofUrl(null);
      fetchList();
      if (drawerRequestId === markPaidRequest.id) setDrawerRequestId(null);
    }
  }

  async function handleReject() {
    if (!rejectRequest || !rejectReason) return;
    setRejectLoading(true);
    const token = localStorage.getItem("admin_token");
    const res = await fetch(`/api/admin/payout-queue/${rejectRequest.id}/reject`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ reason: rejectReason }),
    });
    setRejectLoading(false);
    if (res.ok) {
      setRejectRequest(null);
      setRejectReason("");
      fetchList();
      if (drawerRequestId === rejectRequest.id) setDrawerRequestId(null);
    }
  }

  async function handleBulkReconcile() {
    if (selectedProcessing.length === 0 || !bulkMasterRef.trim()) return;
    setBulkReconcileLoading(true);
    const token = localStorage.getItem("admin_token");
    const res = await fetch("/api/admin/payout-queue/bulk-reconcile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        ids: selectedProcessing.map((r) => r.id),
        masterReferenceNumber: bulkMasterRef.trim(),
      }),
    });
    setBulkReconcileLoading(false);
    if (res.ok) {
      setBulkReconcileOpen(false);
      setBulkMasterRef("");
      setSelectedIds(new Set());
      fetchList();
    }
  }

  function exportToCsv() {
    if (selectedList.length === 0) return;
    const headers = [
      "Request ID",
      "Date",
      "Driver Name",
      "Driver Phone",
      "Amount Requested (₦)",
      "Bank Name",
      "Account Name",
      "Account Number",
      "Status",
      "Risk: Bank details recent",
      "Risk: Unusually large",
    ];
    const rows = selectedList.map((r) => [
      r.id,
      formatDate(r.requestedAt),
      r.driverName,
      r.driverPhone ?? "",
      r.amountNaira,
      r.bankName,
      r.bankAccountName,
      r.bankAccountNumber,
      r.status,
      r.riskBankDetailsRecent ? "Yes" : "No",
      r.riskUnusuallyLarge ? "Yes" : "No",
    ]);
    const csv = [headers.join(","), ...rows.map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payout-queue-${tab}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const statusTabs: { key: StatusTab; label: string }[] = [
    { key: "all", label: "All" },
    { key: "pending", label: "Pending" },
    { key: "processing", label: "Processing" },
    { key: "completed", label: "Completed" },
    { key: "rejected", label: "Rejected" },
  ];

  const showList = !drawerRequestId;

  return (
    <div className="p-6 md:p-8 space-y-6 bg-gray-50 min-h-screen">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Payout Queue</h1>
        <p className="text-gray-700 text-sm mt-1">
          Withdrawal requests from drivers · maker-checker approval
        </p>
      </div>

      {showList && (
      <>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-xl overflow-hidden border border-slate-200 bg-white text-sm shadow-sm">
          {statusTabs.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-4 py-2.5 font-medium transition ${
                tab === key
                  ? "bg-blue-600 text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-gray-700">
              {selectedIds.size} selected
            </span>
            <button
              onClick={exportToCsv}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700"
            >
              Export to CSV
            </button>
            {tab === "processing" && selectedProcessing.length > 0 && (
              <button
                onClick={() => setBulkReconcileOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
              >
                Reconcile Batch ({selectedProcessing.length})
              </button>
            )}
          </div>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-gray-700">Loading...</div>
          ) : requests.length === 0 ? (
            <div className="p-12 text-center text-gray-700">
              No {tab === "all" ? "" : tab} withdrawal requests.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-100 text-gray-800 text-xs uppercase tracking-wider font-semibold">
                  <th className="text-left px-4 py-3 w-10">
                    {(tab === "all" || tab === "pending" || tab === "processing") && (
                      <input
                        type="checkbox"
                        checked={requests.length > 0 && selectedIds.size === requests.length}
                        onChange={toggleSelectAll}
                        className="rounded border-gray-300"
                      />
                    )}
                  </th>
                  <th className="text-left px-4 py-3">Request ID & Date</th>
                  <th className="text-left px-4 py-3">Driver</th>
                  <th className="text-left px-4 py-3">Amount</th>
                  <th className="text-left px-4 py-3">Bank Details</th>
                  <th className="text-left px-4 py-3">Risk</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-right px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => fetchDrawer(r.id)}
                    className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                  >
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      {(tab === "all" || tab === "pending" || tab === "processing") && (
                        <input
                          type="checkbox"
                          checked={selectedIds.has(r.id)}
                          onChange={() => toggleSelect(r.id)}
                          className="rounded border-gray-300"
                        />
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-gray-800">{r.id.slice(0, 8)}…</span>
                      <br />
                      <span className="text-gray-700">{formatDate(r.requestedAt)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/dashboard/users?driver=${r.driverId}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-blue-600 hover:underline font-medium"
                      >
                        {r.driverName}
                      </Link>
                      {r.driverPhone && (
                        <span className="block text-gray-700 text-xs">{r.driverPhone}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-gray-900">₦{r.amountNaira.toLocaleString()}</span>
                      <CopyButton value={String(r.amountNaira)} label="amount" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-gray-800">
                        {r.bankName} · {r.bankAccountName}
                      </div>
                      <span className="font-mono text-xs text-gray-800">
                        {r.bankAccountNumber}
                        <CopyButton value={r.bankAccountNumber} label="account number" />
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {(r.riskBankDetailsRecent || r.riskUnusuallyLarge) && (
                        <span
                          className="inline-flex items-center gap-0.5 text-amber-600"
                          title={
                            [
                              r.riskBankDetailsRecent && "Bank details updated in last 24h",
                              r.riskUnusuallyLarge && "Unusually large amount",
                            ]
                              .filter(Boolean)
                              .join("; ")
                          }
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                          r.status === "pending"
                            ? "bg-amber-100 text-amber-800"
                            : r.status === "processing"
                            ? "bg-blue-100 text-blue-800"
                            : r.status === "completed"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => fetchDrawer(r.id)}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700"
                      >
                        View details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {total > LIMIT && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
            <span className="text-sm text-gray-500">
              Page {page} of {Math.ceil(total / LIMIT)}
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1 rounded border border-gray-300 text-sm disabled:opacity-50"
              >
                Previous
              </button>
              <button
                disabled={page >= Math.ceil(total / LIMIT)}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1 rounded border border-gray-300 text-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
      </>
      )}

      {/* Full detail section — replaces list when viewing a payout */}
      {drawerRequestId && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">Payout details</h2>
            <button
              onClick={() => {
                setDrawerRequestId(null);
                setDrawerMarkPaidRef("");
                setDrawerMarkPaidNotes("");
                setDrawerInvoiceUrl(null);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-100"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to list
            </button>
          </div>
          <div className="p-6">
            {drawerLoading ? (
              <p className="text-gray-700">Loading...</p>
            ) : drawerData ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left column */}
                <div className="space-y-6">
                  {/* Request summary */}
                  <div className="rounded-lg border border-gray-200 p-4 bg-gray-50">
                    <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Withdrawal request</h3>
                    <div className="flex justify-between items-baseline">
                      <span className="text-2xl font-bold text-gray-900">₦{drawerData.request.amountNaira.toLocaleString()}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${
                          drawerData.request.status === "pending"
                            ? "bg-amber-100 text-amber-800"
                            : drawerData.request.status === "processing"
                            ? "bg-blue-100 text-blue-800"
                            : drawerData.request.status === "completed"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {drawerData.request.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mt-1">{formatDate(drawerData.request.requestedAt)}</p>
                  </div>

                  {/* Bank details */}
                  <div className="rounded-lg border border-gray-200 p-4">
                    <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-3">Bank details</h3>
                    <dl className="space-y-3">
                      <div>
                        <dt className="text-xs text-gray-600 font-medium">Bank name</dt>
                        <dd className="flex items-center gap-1 mt-0.5">
                          <span className="font-medium">{drawerData.request.bankName}</span>
                          <CopyButton value={drawerData.request.bankName} label="bank name" />
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs text-gray-600 font-medium">Account name</dt>
                        <dd className="flex items-center gap-1 mt-0.5">
                          <span className="font-medium">{drawerData.request.bankAccountName}</span>
                          <CopyButton value={drawerData.request.bankAccountName} label="account name" />
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs text-gray-600 font-medium">Account number</dt>
                        <dd className="flex items-center gap-1 mt-0.5">
                          <span className="font-mono font-medium">{drawerData.request.bankAccountNumber}</span>
                          <CopyButton value={drawerData.request.bankAccountNumber} label="account number" />
                        </dd>
                      </div>
                    </dl>
                  </div>

                  {/* Identity */}
                  <div>
                    <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Identity</h3>
                    <div className="flex flex-wrap gap-2 items-center">
                      <span className="font-medium">KYC: {drawerData.driver.kycName}</span>
                      <span className="text-gray-500">|</span>
                      <span>Bank account: {drawerData.driver.bankAccountName}</span>
                      {drawerData.driver.nameMismatch && (
                        <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-xs font-medium">
                          Mismatch
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 mt-1">{drawerData.driver.email}</p>
                    {drawerData.driver.phone && <p className="text-sm text-gray-700">{drawerData.driver.phone}</p>}
                  </div>

                  {/* Ledger */}
                  <div>
                    <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Ledger</h3>
                    <div className="rounded border border-gray-200 overflow-hidden">
                      <table className="w-full text-sm">
                        <tbody>
                          <tr className="border-b border-gray-100">
                            <td className="px-3 py-2 text-gray-700">Completed trips</td>
                            <td className="px-3 py-2 text-right">{drawerData.ledger.completedTrips}</td>
                          </tr>
                          <tr className="border-b border-gray-100">
                            <td className="px-3 py-2 text-gray-700">Total earned</td>
                            <td className="px-3 py-2 text-right">{drawerData.ledger.totalEarned}</td>
                          </tr>
                          <tr className="border-b border-gray-100">
                            <td className="px-3 py-2 text-gray-700">Platform deduction</td>
                            <td className="px-3 py-2 text-right">-{drawerData.ledger.platformDeduction}</td>
                          </tr>
                          <tr className="border-b border-gray-100">
                            <td className="px-3 py-2 text-gray-700">Net earnings</td>
                            <td className="px-3 py-2 text-right">{drawerData.ledger.netEarnings}</td>
                          </tr>
                          <tr>
                            <td className="px-3 py-2 text-gray-700">Current balance</td>
                            <td className="px-3 py-2 text-right font-medium">
                              ₦{Number(drawerData.ledger.currentBalanceKobo).toLocaleString()}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Last 5 payouts */}
                  <div>
                    <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Last 5 payouts</h3>
                    <ul className="space-y-1 text-sm">
                      {drawerData.lastFivePayouts.length === 0 ? (
                        <li className="text-gray-700">None</li>
                      ) : (
                        drawerData.lastFivePayouts.map((p) => (
                          <li key={p.id} className="flex justify-between">
                            <span className="text-gray-800">₦{p.amountNaira.toLocaleString()}</span>
                            <span className="text-gray-700">
                              {p.processedAt ? formatDate(p.processedAt) : ""} {p.bankReferenceNumber && `· ${p.bankReferenceNumber}`}
                            </span>
                          </li>
                        ))
                      )}
                    </ul>
                  </div>

                </div>

                {/* Right column — Actions + Mark as paid */}
                <div className="space-y-6">
                  {/* Invoice upload + Mark as paid (for pending/processing) */}
                  {(drawerData.request.status === "pending" || drawerData.request.status === "processing") && (
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-5 space-y-4">
                      <h3 className="text-sm font-semibold text-gray-900">Actions</h3>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Bank reference / session ID <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={drawerMarkPaidRef}
                          onChange={(e) => setDrawerMarkPaidRef(e.target.value)}
                          placeholder="e.g. TRF123456"
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Upload invoice</label>
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          className="w-full text-sm text-gray-700 file:mr-2 file:py-1.5 file:px-3 file:rounded file:border-0 file:bg-gray-200 file:text-gray-800"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleDrawerInvoiceUpload(f);
                            e.target.value = "";
                          }}
                          disabled={drawerInvoiceUploading}
                        />
                        {drawerInvoiceUploading && <span className="text-xs text-gray-700">Uploading…</span>}
                        {(drawerInvoiceUrl || drawerData.request.proofOfPaymentUrl) && (
                          <a
                            href={drawerInvoiceUrl || drawerData.request.proofOfPaymentUrl || ""}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline block mt-1"
                          >
                            View invoice
                          </a>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Internal notes (optional)</label>
                        <textarea
                          value={drawerMarkPaidNotes}
                          onChange={(e) => setDrawerMarkPaidNotes(e.target.value)}
                          rows={2}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        />
                      </div>
                      <div className="flex flex-wrap gap-3 pt-2">
                        <button
                          onClick={handleDrawerMarkPaid}
                          disabled={!drawerMarkPaidRef.trim() || drawerMarkPaidLoading}
                          className="flex-1 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
                        >
                          {drawerMarkPaidLoading ? "Saving…" : "Mark as paid"}
                        </button>
                        {drawerData.request.status === "pending" && (
                          <button
                            onClick={() => setProcessing(drawerRequestId)}
                            className="px-4 py-2 rounded-lg border border-blue-300 text-blue-700 text-sm font-medium hover:bg-blue-50"
                          >
                            Set Processing
                          </button>
                        )}
                        <button
                          onClick={() => {
                            const req = requests.find((r) => r.id === drawerRequestId);
                            setRejectRequest(
                              req ??
                                ({
                                  id: drawerRequestId,
                                  amountNaira: drawerData?.request?.amountNaira ?? 0,
                                } as PayoutRequest),
                            );
                            setRejectReason("");
                          }}
                          className="px-4 py-2 rounded-lg border border-red-300 text-red-700 text-sm font-medium hover:bg-red-50"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Invoice link for completed */}
                  {drawerData.request.status === "completed" && drawerData.request.proofOfPaymentUrl && (
                    <div>
                      <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Invoice</h3>
                      <a
                        href={drawerData.request.proofOfPaymentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm"
                      >
                        View invoice
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-gray-700">Failed to load context.</p>
            )}
          </div>
        </div>
      )}

      {/* Mark as Paid modal */}
      {markPaidRequest && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4" aria-modal="true" role="dialog">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMarkPaidRequest(null)} />
          <div className="relative bg-white rounded-xl shadow-lg max-w-md w-full p-6 space-y-4">
            <h3 className="font-semibold text-gray-900">Mark as paid</h3>
            <p className="text-sm text-gray-700">
              Request: {markPaidRequest.id.slice(0, 8)}… · ₦{markPaidRequest.amountNaira.toLocaleString()}
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bank reference / session ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={markPaidRef}
                onChange={(e) => setMarkPaidRef(e.target.value)}
                placeholder="e.g. TRF123456"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Proof of payment (optional)</label>
              <input
                type="file"
                accept="image/*,.pdf"
                className="w-full text-sm text-gray-700 file:mr-2 file:py-1.5 file:px-3 file:rounded file:border-0 file:bg-gray-200 file:text-gray-800"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleProofUpload(f);
                  e.target.value = "";
                }}
                disabled={markPaidProofUploading}
              />
              {markPaidProofUploading && <span className="text-xs text-gray-500">Uploading…</span>}
              {markPaidProofUrl && (
                <a href={markPaidProofUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline block mt-1">
                  View uploaded file
                </a>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Internal notes (optional)</label>
              <textarea
                value={markPaidNotes}
                onChange={(e) => setMarkPaidNotes(e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setMarkPaidRequest(null)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleMarkPaid}
                disabled={!markPaidRef.trim() || markPaidLoading}
                className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium disabled:opacity-50"
              >
                {markPaidLoading ? "Saving…" : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject modal */}
      {rejectRequest && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4" aria-modal="true" role="dialog">
          <div className="absolute inset-0 bg-black/50" onClick={() => setRejectRequest(null)} />
          <div className="relative bg-white rounded-xl shadow-lg max-w-md w-full p-6 space-y-4">
            <h3 className="font-semibold text-gray-900">Reject withdrawal</h3>
            <p className="text-sm text-gray-700">
              Request: {rejectRequest.id.slice(0, 8)}… · ₦{rejectRequest.amountNaira.toLocaleString()}. Driver will be notified.
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason <span className="text-red-500">*</span></label>
              <select
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">Select reason</option>
                {REJECTION_REASONS.map((reason) => (
                  <option key={reason} value={reason}>
                    {reason}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setRejectRequest(null)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectReason || rejectLoading}
                className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium disabled:opacity-50"
              >
                {rejectLoading ? "Rejecting…" : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk reconcile modal */}
      {bulkReconcileOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4" aria-modal="true" role="dialog">
          <div className="absolute inset-0 bg-black/50" onClick={() => setBulkReconcileOpen(false)} />
          <div className="relative bg-white rounded-xl shadow-lg max-w-md w-full p-6 space-y-4">
            <h3 className="font-semibold text-gray-900">Reconcile batch</h3>
            <p className="text-sm text-gray-700">
              Mark {selectedProcessing.length} request(s) as completed with one master reference.
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Master reference number <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={bulkMasterRef}
                onChange={(e) => setBulkMasterRef(e.target.value)}
                placeholder="e.g. BATCH-2024-001"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setBulkReconcileOpen(false)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkReconcile}
                disabled={!bulkMasterRef.trim() || bulkReconcileLoading}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium disabled:opacity-50"
              >
                {bulkReconcileLoading ? "Saving…" : "Reconcile all"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
