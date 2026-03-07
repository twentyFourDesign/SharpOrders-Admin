"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

type Reply = { id: string; message: string; isFromStaff: boolean; createdAt: string };
type Ticket = {
  id: string;
  title: string;
  description: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  replies: Reply[];
};
type ChatData = { ticket: Ticket; user: { id: string; email: string; displayName: string } };

export default function AdminUserChatPage() {
  const params = useParams();
  const userId = params?.userId as string;
  const [data, setData] = useState<ChatData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);

  const fetchChat = useCallback(async (silent = false) => {
    if (!userId) return;
    if (!silent) setLoading(true);
    setError(null);
    const token = localStorage.getItem("admin_token");
    try {
      const res = await fetch(`/api/admin/users/${userId}/chat`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Failed to load chat");
        setData(null);
        return;
      }
      setData(json);
    } catch {
      setError("Failed to load chat");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchChat();
  }, [fetchChat]);

  // Poll for new messages from the user every 10 seconds
  useEffect(() => {
    if (!data?.ticket?.id) return;
    const interval = setInterval(() => fetchChat(true), 10_000);
    return () => clearInterval(interval);
  }, [data?.ticket?.id, fetchChat]);

  async function sendReply() {
    const msg = replyText.trim();
    if (!msg || !data?.ticket || sending) return;
    setSending(true);
    const token = localStorage.getItem("admin_token");
    try {
      const res = await fetch(`/api/admin/support/tickets/${data.ticket.id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: msg }),
      });
      if (res.ok) {
        setReplyText("");
        fetchChat();
      }
    } finally {
      setSending(false);
    }
  }

  if (loading && !data) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6">
        <Link href="/admin/dashboard/users" className="text-blue-600 hover:underline text-sm font-medium">
          ← Back to Users
        </Link>
        <p className="mt-4 text-red-600">{error ?? "Chat not found"}</p>
      </div>
    );
  }

  const { ticket, user } = data;

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/admin/dashboard/users"
          className="text-blue-600 hover:underline text-sm font-medium"
        >
          ← Back to Users
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">Chat with {user.displayName}</h1>
          <p className="text-sm text-gray-500">{user.email}</p>
        </div>
        <button
          type="button"
          onClick={() => fetchChat()}
          className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
        >
          Refresh
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Thread</p>
          <p className="text-gray-900 font-medium mt-1">{ticket.title}</p>
          <p className="text-gray-600 text-sm mt-1 whitespace-pre-wrap">{ticket.description}</p>
          <p className="text-gray-400 text-xs mt-2">{new Date(ticket.createdAt).toLocaleString("en-NG")}</p>
        </div>

        <div className="p-4 space-y-3 max-h-[50vh] overflow-y-auto">
          {(ticket.replies ?? []).length === 0 ? (
            <p className="text-gray-500 text-sm">No replies yet. Send a message below.</p>
          ) : (
            (ticket.replies ?? []).map((r) => (
              <div
                key={r.id}
                className={`rounded-lg p-3 text-sm ${
                  r.isFromStaff ? "bg-blue-50 border border-blue-100 ml-0" : "bg-gray-50 border border-gray-100 mr-0"
                }`}
              >
                <p className="text-gray-500 text-xs font-medium mb-1">{r.isFromStaff ? "You" : "User"}</p>
                <p className="text-gray-800 whitespace-pre-wrap">{r.message}</p>
                <p className="text-gray-400 text-xs mt-1">{new Date(r.createdAt).toLocaleString("en-NG")}</p>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-gray-200">
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Type your message…"
            rows={3}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            type="button"
            onClick={sendReply}
            disabled={sending || !replyText.trim()}
            className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition"
          >
            {sending ? "Sending…" : "Send reply"}
          </button>
        </div>
      </div>
    </div>
  );
}
