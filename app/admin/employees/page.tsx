"use client";

import { useCallback, useEffect, useState } from "react";
import { UserPlus, Loader2, Trash2, Pencil, Check, X } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import Avatar from "@/components/Avatar";
import { PLATFORM_META } from "@/lib/platforms";
import type { Employee } from "@/lib/types";

function HandleTag({ label, value, color }: { label: string; value: string; color: string }) {
  if (!value) return null;
  return (
    <span className="pill" style={{ color }} title={value}>
      {label}
    </span>
  );
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[] | null>(null);
  const [name, setName] = useState("");
  const [redditUsername, setRedditUsername] = useState("");
  const [quoraUsername, setQuoraUsername] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  // Inline edit state
  const [editId, setEditId] = useState<number | null>(null);
  const [eReddit, setEReddit] = useState("");
  const [eQuora, setEQuora] = useState("");
  const [eLinkedin, setELinkedin] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/employees");
    const data = await res.json();
    setEmployees(data.employees);
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
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, redditUsername, quoraUsername, linkedinUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to add employee");
        return;
      }
      setSuccess(`${name} added to the roster`);
      setName("");
      setRedditUsername("");
      setQuoraUsername("");
      setLinkedinUrl("");
      await load();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number, empName: string) {
    if (!confirm(`Remove ${empName} from the roster?`)) return;
    await fetch(`/api/employees?id=${id}`, { method: "DELETE" });
    await load();
  }

  function startEdit(emp: Employee) {
    setEditId(emp.id);
    setEReddit(emp.reddit_username);
    setEQuora(emp.quora_username);
    setELinkedin(emp.linkedin_url);
  }

  async function saveEdit(id: number) {
    setEditSaving(true);
    try {
      await fetch("/api/employees", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          redditUsername: eReddit,
          quoraUsername: eQuora,
          linkedinUrl: eLinkedin,
        }),
      });
      setEditId(null);
      await load();
    } finally {
      setEditSaving(false);
    }
  }

  return (
    <AdminShell>
      <div className="mx-auto max-w-5xl space-y-5">
        <div>
          <span className="tab-chip">Roster</span>
          <h1 className="display mt-3 text-3xl">Employees</h1>
          <p className="mt-1 text-xs text-ink-faint">
            Link each person&apos;s handles so their engagement can be tracked
            and auto-synced. At least one platform is required.
          </p>
        </div>

        <div className="grid items-start gap-4 lg:grid-cols-[340px_1fr]">
          {/* Add form */}
          <section className="card p-5">
            <h2 className="display text-xl">Add person</h2>
            <form onSubmit={handleAdd} className="mt-4 space-y-3.5">
              <div>
                <label className="kicker mb-1.5 block">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full name"
                  required
                  className="input"
                />
              </div>
              <div>
                <label className="kicker mb-1.5 block" style={{ color: PLATFORM_META.reddit.color }}>
                  Reddit username
                </label>
                <input
                  type="text"
                  value={redditUsername}
                  onChange={(e) => setRedditUsername(e.target.value)}
                  placeholder="u/username"
                  className="input"
                />
              </div>
              <div>
                <label className="kicker mb-1.5 block" style={{ color: PLATFORM_META.quora.color }}>
                  Quora profile
                </label>
                <input
                  type="text"
                  value={quoraUsername}
                  onChange={(e) => setQuoraUsername(e.target.value)}
                  placeholder="profile handle or URL"
                  className="input"
                />
              </div>
              <div>
                <label className="kicker mb-1.5 block" style={{ color: PLATFORM_META.linkedin.color }}>
                  LinkedIn URL
                </label>
                <input
                  type="text"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder="linkedin.com/in/username"
                  className="input"
                />
              </div>

              {error ? <p className="alert-error">{error}</p> : null}
              {success ? <p className="alert-ok">{success}</p> : null}

              <button type="submit" disabled={saving} className="btn btn-primary w-full">
                {saving ? <Loader2 size={15} className="animate-spin" /> : <UserPlus size={14} />}
                {saving ? "Adding" : "Add employee"}
              </button>
            </form>
          </section>

          {/* List */}
          <section className="card overflow-hidden">
            <div className="flex items-baseline justify-between border-b-[1.5px] border-ink px-5 py-3">
              <h2 className="display text-xl">Team</h2>
              {employees ? (
                <span className="font-mono text-[11px] text-ink-faint">
                  {employees.length} {employees.length === 1 ? "person" : "people"}
                </span>
              ) : null}
            </div>
            {!employees ? (
              <div className="flex h-32 items-center justify-center">
                <Loader2 size={22} className="animate-spin text-ink-faint" />
              </div>
            ) : employees.length === 0 ? (
              <p className="px-5 py-6 text-[13px] text-ink-soft">
                Empty for now. Add people above, or they appear here after their
                first sign-in.
              </p>
            ) : (
              <ul className="divide-y divide-[rgba(255,255,255,0.08)] px-5">
                {employees.map((e) =>
                  editId === e.id ? (
                    <li key={e.id} className="py-3">
                      <div className="flex items-center gap-2 pb-2.5">
                        <Avatar name={e.name} size={26} />
                        <p className="text-[13px] font-medium">{e.name}</p>
                        <span className="kicker ml-auto">editing handles</span>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-3">
                        <input
                          value={eReddit}
                          onChange={(ev) => setEReddit(ev.target.value)}
                          placeholder="u/reddit"
                          className="input py-2 text-[12px]"
                          style={{ borderColor: PLATFORM_META.reddit.color }}
                        />
                        <input
                          value={eQuora}
                          onChange={(ev) => setEQuora(ev.target.value)}
                          placeholder="Quora handle/URL"
                          className="input py-2 text-[12px]"
                          style={{ borderColor: PLATFORM_META.quora.color }}
                        />
                        <input
                          value={eLinkedin}
                          onChange={(ev) => setELinkedin(ev.target.value)}
                          placeholder="linkedin.com/in/…"
                          className="input py-2 text-[12px]"
                          style={{ borderColor: PLATFORM_META.linkedin.color }}
                        />
                      </div>
                      <div className="mt-2.5 flex gap-2">
                        <button
                          onClick={() => saveEdit(e.id)}
                          disabled={editSaving}
                          className="btn btn-primary px-3 py-1.5 text-[11px]"
                        >
                          {editSaving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                          Save
                        </button>
                        <button
                          onClick={() => setEditId(null)}
                          className="btn btn-ghost px-3 py-1.5 text-[11px]"
                        >
                          <X size={13} /> Cancel
                        </button>
                      </div>
                    </li>
                  ) : (
                    <li key={e.id} className="flex items-center gap-3 py-3">
                      <Avatar name={e.name} size={30} />
                      <div className="min-w-0 flex-1 leading-tight">
                        <p className="truncate text-[13px] font-medium">{e.name}</p>
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          <HandleTag label="Reddit" value={e.reddit_username} color={PLATFORM_META.reddit.color} />
                          <HandleTag label="Quora" value={e.quora_username} color={PLATFORM_META.quora.color} />
                          <HandleTag label="LinkedIn" value={e.linkedin_url} color={PLATFORM_META.linkedin.color} />
                          {!e.reddit_username && !e.quora_username && !e.linkedin_url ? (
                            <span className="font-mono text-[10px] text-faint">no handles linked</span>
                          ) : null}
                        </div>
                      </div>
                      <button
                        onClick={() => startEdit(e)}
                        className="p-1.5 text-faint transition-colors hover:text-accent"
                        title="Edit handles"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(e.id, e.name)}
                        className="p-1.5 text-faint transition-colors hover:text-bad"
                        title="Remove employee"
                      >
                        <Trash2 size={14} />
                      </button>
                    </li>
                  )
                )}
              </ul>
            )}
          </section>
        </div>
      </div>
    </AdminShell>
  );
}
