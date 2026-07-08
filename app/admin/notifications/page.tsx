"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, Trash2, Loader2, UserPlus, Send, Info } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";

interface Recipient {
  id: number;
  name: string;
  phone: string;
  apikey: string;
  added_at: string;
}

export default function NotificationsPage() {
  const [recipients, setRecipients] = useState<Recipient[] | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [apikey, setApikey] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);
  const [notifyLoading, setNotifyLoading] = useState(false);
  const [notifyMsg, setNotifyMsg] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/recipients");
    const data = await res.json();
    setRecipients(data.recipients);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);
    try {
      const res = await fetch("/api/recipients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, apikey }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to add");
        return;
      }
      setSuccess(`${name} added as recipient`);
      setName("");
      setPhone("");
      setApikey("");
      await load();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Remove this recipient?")) return;
    await fetch(`/api/recipients?id=${id}`, { method: "DELETE" });
    await load();
  }

  async function handleNotify() {
    setNotifyLoading(true);
    setNotifyMsg("");
    try {
      const res = await fetch("/api/notify", { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        setNotifyMsg(json.error ?? "Failed to send");
      } else if (json.sent) {
        setNotifyMsg(json.message);
      } else {
        setNotifyMsg(json.message);
      }
    } catch {
      setNotifyMsg("Network error");
    } finally {
      setNotifyLoading(false);
    }
  }

  return (
    <AdminShell>
      <div className="mx-auto max-w-5xl space-y-5">
        <div>
          <span className="tab-chip">Alerts</span>
          <h1 className="display mt-3 text-3xl">WhatsApp alerts</h1>
          <p className="mt-1 text-xs text-faint">
            Broadcast daily miss reports to anyone who registers with
            CallMeBot.
          </p>
        </div>

        <div className="grid items-start gap-4 lg:grid-cols-[360px_1fr]">
          {/* Add recipient form */}
          <section className="card p-5">
            <h2 className="text-[15px] font-medium">Add recipient</h2>

            <div className="mt-3 rounded-lg border border-edge-strong bg-surface-2/50 p-3">
              <div className="flex items-start gap-2 text-[11px] text-muted">
                <Info size={13} className="mt-0.5 shrink-0 text-accent" />
                <p>
                  Each person must save <strong>+34 605 782 620</strong> as a
                  contact, send{" "}
                  <code className="rounded bg-surface px-1 py-0.5 text-[10px] text-white">
                    I allow callmebot to send me messages
                  </code>
                  , then share their API key with you.
                </p>
              </div>
            </div>

            <form onSubmit={handleAdd} className="mt-4 space-y-3.5">
              <div>
                <label className="kicker mb-1.5 block">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Manager"
                  required
                  className="input"
                />
              </div>
              <div>
                <label className="kicker mb-1.5 block">Phone</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="918123456789 (with country code, no +)"
                  required
                  className="input"
                />
              </div>
              <div>
                <label className="kicker mb-1.5 block">CallMeBot API Key</label>
                <input
                  type="text"
                  value={apikey}
                  onChange={(e) => setApikey(e.target.value)}
                  placeholder="xxxxxx"
                  required
                  className="input"
                />
              </div>

              {error ? <p className="alert-error">{error}</p> : null}
              {success ? <p className="alert-ok">{success}</p> : null}

              <button
                type="submit"
                disabled={saving}
                className="btn btn-primary w-full"
              >
                {saving ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <UserPlus size={14} />
                )}
                {saving ? "Adding" : "Add recipient"}
              </button>
            </form>

            <div className="mt-4 border-t border-edge pt-4">
              <button
                onClick={handleNotify}
                disabled={notifyLoading}
                className="btn btn-ghost w-full text-bad hover:border-bad/30 hover:text-bad"
              >
                {notifyLoading ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <Send size={14} />
                )}
                {notifyLoading ? "Sending…" : "Send alert now"}
              </button>
              {notifyMsg ? (
                <p
                  className={`mt-2 text-center text-[11px] ${
                    notifyMsg.includes("sent") ? "text-ok" : "text-bad"
                  }`}
                >
                  {notifyMsg}
                </p>
              ) : null}
            </div>
          </section>

          {/* Recipients list */}
          <section className="card overflow-hidden">
            <div className="flex items-baseline justify-between px-5 pb-1 pt-4">
              <h2 className="text-[15px] font-medium">Recipients</h2>
              {recipients ? (
                <span className="text-[11px] text-faint">
                  {recipients.length}{" "}
                  {recipients.length === 1 ? "person" : "people"}
                </span>
              ) : null}
            </div>
            {!recipients ? (
              <div className="flex h-32 items-center justify-center">
                <Loader2 size={22} className="animate-spin text-faint" />
              </div>
            ) : recipients.length === 0 ? (
              <p className="px-5 pb-5 pt-2 text-[13px] text-muted">
                No recipients yet. Add someone to start broadcasting alerts.
              </p>
            ) : (
              <ul className="divide-y divide-edge px-5 pb-2">
                {recipients.map((r) => (
                  <li
                    key={r.id}
                    className="flex items-center gap-3 py-2.5"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
                      <Bell size={14} />
                    </div>
                    <div className="min-w-0 flex-1 leading-tight">
                      <p className="truncate text-[13px]">{r.name}</p>
                      <p className="text-[10px] text-faint">
                        {r.phone}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDelete(r.id)}
                      className="rounded-md p-1.5 text-faint transition-colors hover:bg-surface-2 hover:text-bad"
                      title="Remove"
                    >
                      <Trash2 size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </AdminShell>
  );
}
