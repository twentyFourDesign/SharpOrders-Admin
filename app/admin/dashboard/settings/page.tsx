"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

type Admin = { id: string; email: string; name?: string | null; isSuperAdmin: boolean; createdAt: string };

export default function AdminSettingsPage() {
  const router = useRouter();
  const [admin, setAdmin] = useState<Admin | null>(null);

  // Change password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState(false);

  // Create admin state (super admin only)
  const [createEmail, setCreateEmail] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createConfirmPassword, setCreateConfirmPassword] = useState("");
  const [createName, setCreateName] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    fetch("/api/admin/auth/me", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => setAdmin(d.admin));
  }, []);

  async function handleChangePassword(e: FormEvent) {
    e.preventDefault();
    setPwError(null);
    setPwSuccess(false);
    if (newPassword !== confirmPassword) { setPwError("Passwords do not match"); return; }
    if (newPassword.length < 8) { setPwError("Password must be at least 8 characters"); return; }
    setPwLoading(true);
    const token = localStorage.getItem("admin_token");
    const res = await fetch("/api/admin/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await res.json();
    if (!res.ok) { setPwError(data.error ?? "Failed to change password"); }
    else { setPwSuccess(true); setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); }
    setPwLoading(false);
  }

  async function handleCreateAdmin(e: FormEvent) {
    e.preventDefault();
    setCreateError(null);
    setCreateSuccess(false);
    if (createPassword !== createConfirmPassword) {
      setCreateError("Passwords do not match");
      return;
    }
    if (createPassword.length < 8) {
      setCreateError("Password must be at least 8 characters");
      return;
    }
    setCreateLoading(true);
    const token = localStorage.getItem("admin_token");
    const res = await fetch("/api/admin/admins", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ email: createEmail.trim(), password: createPassword, name: createName.trim() || undefined }),
    });
    const data = await res.json();
    if (!res.ok) {
      setCreateError(data.error ?? "Failed to create admin");
    } else {
      setCreateSuccess(true);
      setCreateEmail("");
      setCreatePassword("");
      setCreateConfirmPassword("");
      setCreateName("");
    }
    setCreateLoading(false);
  }

  function handleLogout() {
    localStorage.removeItem("admin_token");
    router.replace("/");
  }

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-2xl bg-gray-50">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your admin account</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4 shadow-sm">
        <h2 className="text-gray-900 font-semibold">Account details</h2>
        {admin ? (
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Email</span>
              <span className="text-gray-900">{admin.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Name</span>
              <span className="text-gray-900">{admin.name ?? "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Role</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${admin.isSuperAdmin ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}`}>
                {admin.isSuperAdmin ? "Super Admin" : "Admin"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Admin since</span>
              <span className="text-gray-900">{new Date(admin.createdAt).toLocaleDateString("en-NG", { year: "numeric", month: "long", day: "numeric" })}</span>
            </div>
          </div>
        ) : (
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <h2 className="text-gray-900 font-semibold mb-4">Change password</h2>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Current password</label>
            <input type="password" required value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full px-4 py-2.5 rounded-lg bg-white border border-gray-200 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">New password</label>
            <input type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full px-4 py-2.5 rounded-lg bg-white border border-gray-200 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm new password</label>
            <input type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full px-4 py-2.5 rounded-lg bg-white border border-gray-200 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
          </div>
          {pwError && <p className="text-red-600 text-sm">{pwError}</p>}
          {pwSuccess && <p className="text-emerald-600 text-sm">Password changed successfully.</p>}
          <button type="submit" disabled={pwLoading} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-medium rounded-lg transition text-sm">
            {pwLoading ? "Updating…" : "Update password"}
          </button>
        </form>
      </div>

      {admin?.isSuperAdmin && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-gray-900 font-semibold mb-4">Create admin</h2>
          <p className="text-gray-600 text-sm mb-4">Create a new admin account. They will be able to log in and manage the dashboard (non–super admin).</p>
          <form onSubmit={handleCreateAdmin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input type="email" required value={createEmail} onChange={(e) => setCreateEmail(e.target.value)} className="w-full px-4 py-2.5 rounded-lg bg-white border border-gray-200 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" placeholder="admin@example.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Name (optional)</label>
              <input type="text" value={createName} onChange={(e) => setCreateName(e.target.value)} className="w-full px-4 py-2.5 rounded-lg bg-white border border-gray-200 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" placeholder="Admin name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <input type="password" required value={createPassword} onChange={(e) => setCreatePassword(e.target.value)} className="w-full px-4 py-2.5 rounded-lg bg-white border border-gray-200 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm password</label>
              <input type="password" required value={createConfirmPassword} onChange={(e) => setCreateConfirmPassword(e.target.value)} className="w-full px-4 py-2.5 rounded-lg bg-white border border-gray-200 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            </div>
            {createError && <p className="text-red-600 text-sm">{createError}</p>}
            {createSuccess && <p className="text-emerald-600 text-sm">Admin created successfully.</p>}
            <button type="submit" disabled={createLoading} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-medium rounded-lg transition text-sm">
              {createLoading ? "Creating…" : "Create admin"}
            </button>
          </form>
        </div>
      )}

      <div className="bg-red-50 border border-red-200 rounded-xl p-6 space-y-3">
        <h2 className="text-red-700 font-semibold">Sign out</h2>
        <p className="text-gray-600 text-sm">You will be redirected to the login page.</p>
        <button onClick={handleLogout} className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white font-medium rounded-lg transition text-sm">
          Sign out
        </button>
      </div>
    </div>
  );
}