"use client";

import { useCallback, useEffect, useState } from "react";
import { UserPlus, Loader2 } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import Avatar from "@/components/Avatar";
import type { Employee } from "@/lib/types";

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[] | null>(null);
  const [name, setName] = useState("");
  const [redditUsername, setRedditUsername] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

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
        body: JSON.stringify({ name, redditUsername }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to add employee");
        return;
      }
      setSuccess(`${name} added to the roster`);
      setName("");
      setRedditUsername("");
      await load();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminShell>
      <div className="mx-auto max-w-5xl space-y-5">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Employees</h1>
          <p className="text-xs text-faint">
            The roster fills itself — employees are added on their first
            sign-in. You can also add someone by hand.
          </p>
        </div>

        <div className="grid items-start gap-4 lg:grid-cols-[320px_1fr]">
          {/* Add form */}
          <section className="card p-5">
            <h2 className="text-[15px] font-medium">Add manually</h2>
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
                <label className="kicker mb-1.5 block">Reddit username</label>
                <input
                  type="text"
                  value={redditUsername}
                  onChange={(e) => setRedditUsername(e.target.value)}
                  placeholder="u/username"
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
                {saving ? "Adding" : "Add employee"}
              </button>
            </form>
          </section>

          {/* List */}
          <section className="card overflow-hidden">
            <div className="flex items-baseline justify-between px-5 pb-1 pt-4">
              <h2 className="text-[15px] font-medium">Roster</h2>
              {employees ? (
                <span className="text-[11px] text-faint">
                  {employees.length}{" "}
                  {employees.length === 1 ? "person" : "people"}
                </span>
              ) : null}
            </div>
            {!employees ? (
              <div className="flex h-32 items-center justify-center">
                <Loader2 size={22} className="animate-spin text-faint" />
              </div>
            ) : employees.length === 0 ? (
              <p className="px-5 pb-5 pt-2 text-[13px] text-muted">
                Empty for now. Share the app link with the team — they appear
                here after their first sign-in.
              </p>
            ) : (
              <ul className="divide-y divide-edge px-5 pb-2">
                {employees.map((e) => (
                  <li key={e.id} className="flex items-center gap-3 py-2.5">
                    <Avatar name={e.name} size={30} />
                    <div className="min-w-0 flex-1 leading-tight">
                      <p className="truncate text-[13px]">{e.name}</p>
                      <p className="text-[10px] text-faint">
                        {e.reddit_username}
                      </p>
                    </div>
                    <span className="font-mono text-[10px] text-faint">
                      {new Date(e.added_at).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                      })}
                    </span>
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
