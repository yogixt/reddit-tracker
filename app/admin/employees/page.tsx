"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
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
      setSuccess(`${name} added`);
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
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold">Employees</h1>
          <p className="text-xs text-muted">
            Add team members and view the roster
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
          {/* Add form */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="glass gradient-border h-fit rounded-2xl p-5"
          >
            <div className="mb-4 flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/20 text-primary">
                <UserPlus size={18} />
              </div>
              <h2 className="font-semibold">Add Employee</h2>
            </div>
            <form onSubmit={handleAdd} className="space-y-3.5">
              <div>
                <label className="mb-1.5 block text-xs text-muted">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full name"
                  required
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs text-muted">
                  Reddit Username
                </label>
                <input
                  type="text"
                  value={redditUsername}
                  onChange={(e) => setRedditUsername(e.target.value)}
                  placeholder="u/username"
                  required
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {error ? (
                <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
                  {error}
                </p>
              ) : null}
              {success ? (
                <p className="rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-2 text-xs text-green-400">
                  {success}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={saving}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-medium transition hover:bg-primary/90 disabled:opacity-60 glow-primary"
              >
                {saving ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <UserPlus size={15} />
                )}
                {saving ? "Adding..." : "Add Employee"}
              </button>
            </form>
          </motion.section>

          {/* List */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass gradient-border rounded-2xl p-5"
          >
            <h2 className="mb-4 font-semibold">
              Team Roster{" "}
              {employees ? (
                <span className="text-xs font-normal text-muted">
                  ({employees.length})
                </span>
              ) : null}
            </h2>
            {!employees ? (
              <div className="flex h-32 items-center justify-center">
                <Loader2 size={24} className="animate-spin text-primary" />
              </div>
            ) : employees.length === 0 ? (
              <p className="text-sm text-muted">
                No employees yet. Add your first team member.
              </p>
            ) : (
              <ul className="divide-y divide-white/5">
                {employees.map((e) => (
                  <li key={e.id} className="flex items-center gap-3 py-3">
                    <Avatar name={e.name} size={34} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm">{e.name}</p>
                      <p className="text-[10px] text-secondary">
                        {e.reddit_username}
                      </p>
                    </div>
                    <span className="text-[10px] text-muted">
                      Added{" "}
                      {new Date(e.added_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </motion.section>
        </div>
      </div>
    </AdminShell>
  );
}
