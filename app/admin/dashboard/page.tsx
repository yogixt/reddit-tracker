"use client";

import { useState } from "react";
import useSWR from "swr";
import {
  Users,
  FileCheck,
  Percent,
  Heart,
  MessageCircle,
  Globe,
  Loader2,
  Flame,
  AlertTriangle,
  Trophy,
  Zap,
  TrendingUp,
  Activity,
  RefreshCw,
  Radio,
  Send,
} from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import StatCard from "@/components/StatCard";
import Avatar from "@/components/Avatar";
import { PLATFORM_META, isPlatform } from "@/lib/platforms";
import type { Analytics, WarningType } from "@/lib/types";

const fetcher = (url: string) => fetch(url, { cache: "no-store" }).then((r) => r.json());

const WARNING_LABELS: Record<WarningType, string> = {
  missed_today: "Missed today",
  missed_yesterday: "Missed yesterday too",
  no_activity_7d: "No activity in 7 days",
  low_attendance: "Low attendance (< 50%)",
  streak_broken: "Streak broken",
};

const WARNING_COLORS: Record<WarningType, string> = {
  missed_today: "text-bad",
  missed_yesterday: "text-bad",
  no_activity_7d: "text-bad",
  low_attendance: "text-[#fbbf24]",
  streak_broken: "text-[#fbbf24]",
};

function ScoreBadge({ score }: { score: number }) {
  let color = "text-bad";
  if (score >= 70) color = "text-ok";
  else if (score >= 40) color = "text-[#fbbf24]";
  return (
    <span className={`text-[11px] font-medium tabular-nums ${color}`}>
      {score}
    </span>
  );
}

function ActivityCell({ done, isToday }: { done: boolean; isToday?: boolean }) {
  return (
    <div
      className={`h-[22px] w-[22px] rounded-[5px] border transition-colors ${
        done
          ? "border-ok/30 bg-ok/20"
          : isToday
          ? "border-bad/40 bg-bad/10"
          : "border-edge-strong bg-surface-2/50"
      }`}
      title={done ? "Submitted" : "Missing"}
    />
  );
}

export default function AdminDashboard() {
  const {
    data,
    error,
    isLoading,
    isValidating,
    mutate,
  } = useSWR<Analytics>("/api/analytics", fetcher, {
    refreshInterval: 30000,
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    dedupingInterval: 5000,
  });

  const [notifyLoading, setNotifyLoading] = useState(false);
  const [notifyMsg, setNotifyMsg] = useState("");
  const lastUpdated = data ? new Date() : null;

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
      {isLoading && !data ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 size={24} className="animate-spin text-faint" />
        </div>
      ) : error || !data ? (
        <div className="flex h-64 flex-col items-center justify-center gap-3">
          <p className="text-sm text-muted">Failed to load dashboard.</p>
          <button onClick={() => mutate()} className="btn btn-primary text-xs">
            <RefreshCw size={13} />
            Retry
          </button>
        </div>
      ) : (
        <div className="mx-auto max-w-6xl space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="tab-chip">Today · IST</span>
              <h1 className="display mt-3 text-3xl">Dashboard</h1>
              <p className="mt-1 text-xs text-faint">
                Team engagement at a glance, today in IST.
                {lastUpdated ? (
                  <span className="ml-2 text-[10px] tabular-nums text-faint/70">
                    Updated{" "}
                    {lastUpdated.toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </span>
                ) : null}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex gap-3 text-[11px] text-faint">
                <span className="flex items-center gap-1.5">
                  <Activity size={12} className="text-ok" />
                  {data.kpis.submittedToday}/{data.kpis.totalEmployees} active
                </span>
                <span className="flex items-center gap-1.5">
                  <Flame size={12} className="text-accent" />
                  {data.onFire.length} on fire
                </span>
                <span className="flex items-center gap-1.5">
                  <AlertTriangle size={12} className="text-bad" />
                  {data.needsAttention.length} need attention
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleNotify}
                  disabled={notifyLoading}
                  className="btn btn-ghost text-[11px] text-bad hover:border-bad/30 hover:text-bad"
                  title="Send WhatsApp alert"
                >
                  <Send size={13} />
                  {notifyLoading ? "Sending…" : "Alert"}
                </button>
                <span
                  className={`btn btn-ghost pointer-events-none text-[11px] border-ok/30 text-ok`}
                  title="Live sync on (30s)"
                >
                  <Radio size={13} className={isValidating ? "" : "animate-pulse"} />
                  Live
                </span>
                <button
                  onClick={() => mutate()}
                  disabled={isValidating}
                  className="btn btn-ghost text-[11px]"
                  title="Refresh now"
                >
                  <RefreshCw
                    size={13}
                    className={isValidating ? "animate-spin" : ""}
                  />
                </button>
              </div>
            </div>
            {notifyMsg ? (
              <p
                className={`text-[11px] ${
                  notifyMsg.includes("sent") ? "text-ok" : "text-bad"
                }`}
              >
                {notifyMsg}
              </p>
            ) : null}
          </div>

          {/* KPI cards */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            <StatCard
              label="Employees"
              value={data.kpis.totalEmployees}
              icon={Users}
            />
            <StatCard
              label="Reports today"
              value={data.kpis.submittedToday}
              sub={`${data.kpis.pendingToday} pending`}
              icon={FileCheck}
              accent="#4ade80"
            />
            <StatCard
              label="Participation"
              value={`${data.kpis.participationRate}%`}
              icon={Percent}
              accent="#ff4500"
            />
            <StatCard
              label="Likes today"
              value={data.kpis.likesToday}
              icon={Heart}
              accent="#f06595"
            />
            <StatCard
              label="Comments"
              value={data.kpis.commentsToday}
              icon={MessageCircle}
              accent="#22b8cf"
            />
            <StatCard
              label="Communities"
              value={data.kpis.activeCommunities}
              icon={Globe}
              accent="#9775fa"
            />
          </div>

          {/* Proof wall — today's uploaded screenshots */}
          {(() => {
            const shots = data.todaySubmissions.filter((s) => s.screenshot_url);
            if (shots.length === 0) return null;
            return (
              <section className="card p-5">
                <div className="flex items-center gap-2 pb-3">
                  <FileCheck size={16} className="text-accent" />
                  <h2 className="display text-xl">Proof wall</h2>
                  <span className="ml-auto kicker">{shots.length} today</span>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                  {shots.map((s) => {
                    const m = isPlatform(s.platform) ? PLATFORM_META[s.platform] : null;
                    return (
                      <a
                        key={`${s.name}-${s.platform}`}
                        href={s.screenshot_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group block border-[1.5px] border-ink"
                        title={`${s.name} — ${m?.label ?? s.platform}`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={s.screenshot_url}
                          alt={`${s.name} ${s.platform} proof`}
                          className="aspect-video w-full object-cover"
                        />
                        <div className="flex items-center justify-between gap-1 border-t-[1.5px] border-ink px-2 py-1.5">
                          <span className="truncate font-mono text-[10px]">{s.name}</span>
                          <span
                            className="shrink-0 font-mono text-[9px] font-bold uppercase"
                            style={{ color: m?.color }}
                          >
                            {m?.label ?? s.platform}
                          </span>
                        </div>
                      </a>
                    );
                  })}
                </div>
              </section>
            );
          })()}

          {/* Top row: On Fire + Needs Attention + Top Performers */}
          <div className="grid gap-4 lg:grid-cols-3">
            {/* On Fire */}
            <section className="card p-5">
              <div className="flex items-center gap-2 pb-3">
                <Flame size={16} className="text-accent" />
                <h2 className="text-[15px] font-medium">On Fire</h2>
                <span className="ml-auto kicker">
                  {data.onFire.length} streaking
                </span>
              </div>
              {data.onFire.length === 0 ? (
                <p className="text-[13px] text-muted">
                  No active streaks yet. Streaks start at 3 days.
                </p>
              ) : (
                <ol className="space-y-2.5">
                  {data.onFire.map((e) => (
                    <li key={e.name} className="flex items-center gap-2.5">
                      <Avatar name={e.name} size={26} />
                      <div className="min-w-0 flex-1 leading-tight">
                        <p className="truncate text-[13px]">{e.name}</p>
                        <p className="text-[10px] text-faint">
                          {e.reddit_username}
                        </p>
                      </div>
                      <span className="flex items-center gap-1 text-[11px] font-medium text-accent">
                        <Flame size={11} />
                        {e.currentStreak}d
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </section>

            {/* Needs Attention */}
            <section className="card p-5">
              <div className="flex items-center gap-2 pb-3">
                <AlertTriangle size={16} className="text-bad" />
                <h2 className="text-[15px] font-medium">Needs Attention</h2>
                <span className="ml-auto kicker">
                  {data.needsAttention.length} flagged
                </span>
              </div>
              {data.needsAttention.length === 0 ? (
                <p className="text-[13px] text-muted">
                  Everyone is on track. Great work!
                </p>
              ) : (
                <ol className="space-y-2.5">
                  {data.needsAttention.map((e) => (
                    <li key={e.name} className="flex items-center gap-2.5">
                      <Avatar name={e.name} size={26} />
                      <div className="min-w-0 flex-1 leading-tight">
                        <p className="truncate text-[13px]">{e.name}</p>
                        <div className="flex flex-wrap gap-x-2 gap-y-0.5">
                          {e.warnings.map((w) => (
                            <span
                              key={w}
                              className={`text-[10px] ${WARNING_COLORS[w]}`}
                            >
                              {WARNING_LABELS[w]}
                            </span>
                          ))}
                        </div>
                      </div>
                      <ScoreBadge score={e.score} />
                    </li>
                  ))}
                </ol>
              )}
            </section>

            {/* Top Performers */}
            <section className="card p-5">
              <div className="flex items-center gap-2 pb-3">
                <Trophy size={16} className="text-[#fbbf24]" />
                <h2 className="text-[15px] font-medium">Top Performers</h2>
                <span className="ml-auto kicker">score</span>
              </div>
              {data.topPerformers.length === 0 ? (
                <p className="text-[13px] text-muted">No data yet.</p>
              ) : (
                <ol className="space-y-2.5">
                  {data.topPerformers.map((e, i) => (
                    <li key={e.name} className="flex items-center gap-2.5">
                      <span
                        className={`w-5 shrink-0 text-center font-mono text-[10px] tabular-nums ${
                          i === 0
                            ? "text-[#fbbf24]"
                            : i < 3
                            ? "text-white"
                            : "text-faint"
                        }`}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <Avatar name={e.name} size={26} />
                      <div className="min-w-0 flex-1 leading-tight">
                        <p className="truncate text-[13px]">{e.name}</p>
                        <p className="text-[10px] text-faint">
                          {e.avgLikes} avg likes ·{" "}
                          {Math.round(e.attendanceRate * 100)}% attendance
                        </p>
                      </div>
                      <ScoreBadge score={e.score} />
                    </li>
                  ))}
                </ol>
              )}
            </section>
          </div>

          {/* Last 7 Days Activity Grid */}
          <section className="card p-5">
            <div className="flex items-baseline justify-between pb-4">
              <div className="flex items-center gap-2">
                <Activity size={16} className="text-accent" />
                <h2 className="text-[15px] font-medium">
                  Last 7 Days Activity
                </h2>
              </div>
              <div className="flex gap-3 text-[11px] text-faint">
                <span className="flex items-center gap-1.5">
                  <span className="h-[10px] w-[10px] rounded-[3px] border border-ok/30 bg-ok/20" />
                  Done
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-[10px] w-[10px] rounded-[3px] border border-edge-strong bg-surface-2/50" />
                  Missed
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-[10px] w-[10px] rounded-[3px] border border-bad/40 bg-bad/10" />
                  Today missing
                </span>
              </div>
            </div>

            {data.performance.length === 0 ? (
              <p className="text-[13px] text-muted">No employees yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <div className="min-w-[600px]">
                  {/* Day labels */}
                  <div className="grid grid-cols-[180px_repeat(7,1fr)] gap-2 pb-2">
                    <div className="text-[10px] font-medium uppercase tracking-wider text-faint">
                      Employee
                    </div>
                    {data.last7DayLabels.map((label, i) => (
                      <div
                        key={i}
                        className={`text-center text-[10px] font-medium ${
                          i === 0 ? "text-accent" : "text-faint"
                        }`}
                      >
                        {label}
                      </div>
                    ))}
                  </div>

                  {/* Rows */}
                  <div className="space-y-1.5">
                    {data.performance.map((emp) => (
                      <div
                        key={emp.name}
                        className="grid grid-cols-[180px_repeat(7,1fr)] items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-surface-2/40"
                      >
                        <div className="flex items-center gap-2">
                          <Avatar name={emp.name} size={22} />
                          <div className="min-w-0 leading-tight">
                            <p className="truncate text-[12px]">{emp.name}</p>
                            {emp.currentStreak > 0 ? (
                              <p className="flex items-center gap-0.5 text-[10px] text-accent">
                                <Flame size={9} />
                                {emp.currentStreak}d streak
                              </p>
                            ) : (
                              <p className="text-[10px] text-faint">
                                {emp.reddit_username}
                              </p>
                            )}
                          </div>
                        </div>
                        {emp.last7Days.map((done, i) => (
                          <div key={i} className="flex justify-center">
                            <ActivityCell done={done} isToday={i === 0} />
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Full performance table */}
          <section className="card overflow-hidden">
            <div className="flex items-baseline justify-between px-5 pb-1 pt-4">
              <h2 className="text-[15px] font-medium">Team Tracker</h2>
              <span className="text-[11px] text-faint">
                {data.performance.length} people · all metrics
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="tbl min-w-[900px]">
                <thead>
                  <tr>
                    <th className="pl-5">Employee</th>
                    <th>Score</th>
                    <th>Streak</th>
                    <th>30d Rate</th>
                    <th>Avg Likes</th>
                    <th>Avg Comments</th>
                    <th>Today</th>
                    <th className="pr-5">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.performance.map((emp) => (
                    <tr key={emp.name}>
                      <td className="pl-5">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={emp.name} size={26} />
                          <div className="leading-tight">
                            <p>{emp.name}</p>
                            <p className="text-[10px] text-faint">
                              {emp.reddit_username}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <ScoreBadge score={emp.score} />
                      </td>
                      <td className="tabular-nums">
                        {emp.currentStreak > 0 ? (
                          <span className="flex items-center gap-1 text-accent">
                            <Flame size={11} />
                            {emp.currentStreak}d
                          </span>
                        ) : (
                          <span className="text-faint">—</span>
                        )}
                      </td>
                      <td className="tabular-nums text-muted">
                        {Math.round(emp.attendanceRate * 100)}%
                      </td>
                      <td className="tabular-nums">{emp.avgLikes}</td>
                      <td className="tabular-nums">{emp.avgComments}</td>
                      <td className="tabular-nums text-muted">
                        {emp.todaySubmission
                          ? `${emp.todaySubmission.time_spent}m`
                          : "—"}
                      </td>
                      <td className="pr-5">
                        {emp.submittedToday ? (
                          <span className="inline-flex items-center gap-1.5 text-xs text-ok">
                            <span className="dot bg-ok" />
                            Done
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs text-bad">
                            <span className="dot bg-bad" />
                            Missing
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {data.performance.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-5 py-8 text-center text-[13px] text-muted"
                      >
                        No employees on the roster yet.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </section>

          {/* Bottom row: summary stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <section className="card p-5">
              <div className="flex items-center gap-2 pb-2">
                <TrendingUp size={14} className="text-ok" />
                <h3 className="text-[13px] font-medium">Best Attendance</h3>
              </div>
              {[...data.performance]
                .sort((a, b) => b.attendanceRate - a.attendanceRate)
                .slice(0, 3)
                .map((e) => (
                  <div
                    key={e.name}
                    className="flex items-center justify-between py-1"
                  >
                    <span className="text-[13px]">{e.name}</span>
                    <span className="text-[11px] text-muted">
                      {Math.round(e.attendanceRate * 100)}%
                    </span>
                  </div>
                ))}
            </section>

            <section className="card p-5">
              <div className="flex items-center gap-2 pb-2">
                <Zap size={14} className="text-[#fbbf24]" />
                <h3 className="text-[13px] font-medium">Most Productive</h3>
              </div>
              {[...data.performance]
                .sort((a, b) => b.totalReports - a.totalReports)
                .slice(0, 3)
                .map((e) => (
                  <div
                    key={e.name}
                    className="flex items-center justify-between py-1"
                  >
                    <span className="text-[13px]">{e.name}</span>
                    <span className="text-[11px] text-muted">
                      {e.totalReports} reports
                    </span>
                  </div>
                ))}
            </section>

            <section className="card p-5">
              <div className="flex items-center gap-2 pb-2">
                <Heart size={14} className="text-[#f06595]" />
                <h3 className="text-[13px] font-medium">Highest Engagement</h3>
              </div>
              {[...data.performance]
                .sort(
                  (a, b) =>
                    b.totalLikes + b.totalComments * 2 -
                    (a.totalLikes + a.totalComments * 2)
                )
                .slice(0, 3)
                .map((e) => (
                  <div
                    key={e.name}
                    className="flex items-center justify-between py-1"
                  >
                    <span className="text-[13px]">{e.name}</span>
                    <span className="text-[11px] text-muted">
                      {e.totalLikes} likes · {e.totalComments} cmts
                    </span>
                  </div>
                ))}
            </section>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
