"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Flame,
  Heart,
  MessageCircle,
  CheckCircle2,
  Loader2,
  LogOut,
} from "lucide-react";
import StatCard from "@/components/StatCard";
import {
  clearEmployeeSession,
  getEmployeeSession,
  type EmployeeSession,
} from "@/lib/session";
import type { EmployeeStats } from "@/lib/types";

const TIME_OPTIONS = [20, 30, 40];

function greetingIST(): string {
  const h = Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      hour12: false,
    }).format(new Date())
  );
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function EmployeeDashboard() {
  const router = useRouter();
  const [session, setSession] = useState<EmployeeSession | null>(null);
  const [stats, setStats] = useState<EmployeeStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Form state
  const [timeSpent, setTimeSpent] = useState(30);
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
          timeSpent,
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
      sessionStorage.setItem(
        "ret_last_submission",
        JSON.stringify(data.submission)
      );
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
        <Loader2 size={24} className="animate-spin text-faint" />
      </main>
    );
  }

  const today = new Date().toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-5 py-8">
      <div className="mb-7">
        <p className="kicker">{today}</p>
        <h1 className="mt-1 text-xl font-semibold tracking-tight">
          {greetingIST()}, {session.name.split(" ")[0]}
        </h1>
        <p className="mt-0.5 text-xs text-faint">{session.redditUsername}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Day streak"
          value={stats?.streak ?? 0}
          icon={Flame}
          accent="#ff4500"
        />
        <StatCard
          label="Total likes"
          value={stats?.totalLikes ?? 0}
          icon={Heart}
          accent="#f06595"
        />
        <StatCard
          label="Comments"
          value={stats?.totalComments ?? 0}
          icon={MessageCircle}
          accent="#22b8cf"
        />
        <StatCard
          label="Reports"
          value={stats?.reportsDone ?? 0}
          icon={CheckCircle2}
          accent="#4ade80"
        />
      </div>

      <section className="card mt-5 p-5">
        {stats?.submittedToday ? (
          <div className="flex flex-col items-center py-7 text-center">
            <span className="dot mb-3 h-2.5 w-2.5 bg-ok" />
            <h2 className="text-[15px] font-medium">
              Today&apos;s report is in
            </h2>
            <p className="mt-1 max-w-[240px] text-xs leading-relaxed text-muted">
              {stats.todaySubmission
                ? `${stats.todaySubmission.likes} likes, ${stats.todaySubmission.comments} comments in ${stats.todaySubmission.communities}.`
                : "Come back tomorrow to keep the streak going."}
            </p>
          </div>
        ) : (
          <>
            <h2 className="text-[15px] font-medium">Today&apos;s activity</h2>
            <p className="mt-0.5 text-xs text-faint">
              Takes about thirty seconds.
            </p>
            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label className="kicker mb-1.5 block">Time spent</label>
                <div className="grid grid-cols-3 gap-1 rounded-lg border border-edge bg-surface-2 p-1">
                  {TIME_OPTIONS.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setTimeSpent(m)}
                      className={`rounded-md py-1.5 text-[13px] transition-colors ${
                        timeSpent === m
                          ? "bg-accent font-medium text-white"
                          : "text-muted hover:text-white"
                      }`}
                    >
                      {m} min
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="kicker mb-1.5 block">Likes given</label>
                  <input
                    type="number"
                    min={0}
                    value={likes}
                    onChange={(e) => setLikes(e.target.value)}
                    placeholder="0"
                    required
                    className="input tabular-nums"
                  />
                </div>
                <div>
                  <label className="kicker mb-1.5 block">Comments made</label>
                  <input
                    type="number"
                    min={0}
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    placeholder="0"
                    required
                    className="input tabular-nums"
                  />
                </div>
              </div>
              <div>
                <label className="kicker mb-1.5 block">
                  Communities engaged
                </label>
                <input
                  type="text"
                  value={communities}
                  onChange={(e) => setCommunities(e.target.value)}
                  placeholder="r/webdev, r/india"
                  required
                  className="input"
                />
              </div>

              {error ? <p className="alert-error">{error}</p> : null}

              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary w-full"
              >
                {submitting ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : null}
                {submitting ? "Submitting" : "Submit report"}
              </button>
            </form>
          </>
        )}
      </section>

      <button
        onClick={handleLogout}
        className="mx-auto mt-7 flex items-center gap-1.5 text-xs text-faint transition-colors hover:text-white"
      >
        <LogOut size={12} /> Logout
      </button>
    </main>
  );
}
