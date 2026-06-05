"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Flame,
  Heart,
  MessageCircle,
  CheckCircle2,
  Loader2,
  LogOut,
  Send,
} from "lucide-react";
import StatCard from "@/components/StatCard";
import {
  clearEmployeeSession,
  getEmployeeSession,
  type EmployeeSession,
} from "@/lib/session";
import type { EmployeeStats } from "@/lib/types";

export default function EmployeeDashboard() {
  const router = useRouter();
  const [session, setSession] = useState<EmployeeSession | null>(null);
  const [stats, setStats] = useState<EmployeeStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Form state
  const [timeSpent, setTimeSpent] = useState("30");
  const [likes, setLikes] = useState("");
  const [comments, setComments] = useState("");
  const [communities, setCommunities] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const loadStats = useCallback(async (name: string) => {
    const res = await fetch(
      `/api/submissions?name=${encodeURIComponent(name)}`
    );
    const data = await res.json();
    setStats(data.stats);
    setLoading(false);
  }, []);

  useEffect(() => {
    const s = getEmployeeSession();
    if (!s) {
      router.replace("/employee/login");
      return;
    }
    setSession(s);
    loadStats(s.name);
  }, [router, loadStats]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!session) return;
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: session.name,
          redditUsername: session.redditUsername,
          timeSpent: Number(timeSpent),
          likes: Number(likes),
          comments: Number(comments),
          communities,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Submission failed");
        return;
      }
      sessionStorage.setItem("ret_last_submission", JSON.stringify(data.submission));
      router.push("/employee/success");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleLogout() {
    clearEmployeeSession();
    router.push("/");
  }

  if (loading || !session) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <Loader2 size={28} className="animate-spin text-primary" />
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <p className="text-xs text-muted">Welcome back</p>
        <h1 className="text-2xl font-bold">{session.name}</h1>
        <p className="text-xs text-secondary">{session.redditUsername}</p>
      </motion.div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Day Streak"
          value={stats?.streak ?? 0}
          icon={Flame}
          accent="#F59E0B"
          delay={0.05}
        />
        <StatCard
          label="Total Likes"
          value={stats?.totalLikes ?? 0}
          icon={Heart}
          accent="#EC4899"
          delay={0.1}
        />
        <StatCard
          label="Total Comments"
          value={stats?.totalComments ?? 0}
          icon={MessageCircle}
          accent="#06B6D4"
          delay={0.15}
        />
        <StatCard
          label="Reports Done"
          value={stats?.reportsDone ?? 0}
          icon={CheckCircle2}
          accent="#10B981"
          delay={0.2}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="glass gradient-border mt-6 rounded-2xl p-5 sm:p-6"
      >
        {stats?.submittedToday ? (
          <div className="flex flex-col items-center py-6 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-500/15 text-green-400 glow-green">
              <CheckCircle2 size={26} />
            </div>
            <h2 className="font-semibold">Already Submitted</h2>
            <p className="mt-1 text-xs text-muted">
              You have logged your activity for today. See you tomorrow.
            </p>
          </div>
        ) : (
          <>
            <h2 className="mb-4 font-semibold">Submit Daily Activity</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs text-muted">
                  Time Spent
                </label>
                <select
                  value={timeSpent}
                  onChange={(e) => setTimeSpent(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm outline-none transition focus:border-primary/60"
                >
                  <option value="20">20 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="40">40 minutes</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs text-muted">
                    Likes Given
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={likes}
                    onChange={(e) => setLikes(e.target.value)}
                    placeholder="0"
                    required
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs text-muted">
                    Comments Made
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    placeholder="0"
                    required
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs text-muted">
                  Communities Engaged
                </label>
                <input
                  type="text"
                  value={communities}
                  onChange={(e) => setCommunities(e.target.value)}
                  placeholder="r/webdev, r/india"
                  required
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {error ? (
                <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-medium transition hover:bg-primary/90 disabled:opacity-60 glow-primary"
              >
                {submitting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Send size={15} />
                )}
                {submitting ? "Submitting..." : "Submit Activity"}
              </button>
            </form>
          </>
        )}
      </motion.div>

      <button
        onClick={handleLogout}
        className="mx-auto mt-6 flex items-center gap-1.5 text-xs text-muted transition hover:text-white"
      >
        <LogOut size={13} /> Logout
      </button>
    </main>
  );
}
