"use client";

import { useEffect, useState } from "react";
import {
  Users,
  FileCheck,
  Percent,
  Heart,
  MessageCircle,
  Globe,
  Loader2,
} from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import StatCard from "@/components/StatCard";
import Avatar from "@/components/Avatar";
import type { Analytics } from "@/lib/types";

export default function AdminDashboard() {
  const [data, setData] = useState<Analytics | null>(null);

  useEffect(() => {
    fetch("/api/analytics")
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null));
  }, []);

  return (
    <AdminShell>
      {!data ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 size={24} className="animate-spin text-faint" />
        </div>
      ) : (
        <div className="mx-auto max-w-5xl space-y-5">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Dashboard</h1>
            <p className="text-xs text-faint">
              Team engagement at a glance, today in IST.
            </p>
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

          {/* Heatmap */}
          <section className="card p-5">
            <div className="flex items-baseline justify-between">
              <h2 className="text-[15px] font-medium">Who&apos;s in today</h2>
              <span className="text-[11px] text-faint">
                {data.kpis.submittedToday}/{data.kpis.totalEmployees} submitted
              </span>
            </div>
            {data.heatmap.length === 0 ? (
              <p className="mt-4 text-[13px] text-muted">
                No one on the roster yet. Employees appear here after their
                first sign-in.
              </p>
            ) : (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {data.heatmap.map((e) => (
                  <span
                    key={e.name}
                    className="flex items-center gap-1.5 rounded-md border border-edge bg-surface-2 px-2.5 py-1 text-xs"
                  >
                    <span
                      className={`dot ${e.submittedToday ? "bg-ok" : "bg-bad"}`}
                    />
                    {e.name}
                  </span>
                ))}
              </div>
            )}
          </section>

          {/* Today's activity table */}
          <section className="card overflow-hidden">
            <div className="px-5 pb-1 pt-4">
              <h2 className="text-[15px] font-medium">Today&apos;s reports</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="tbl min-w-[640px]">
                <thead>
                  <tr>
                    <th className="pl-5">Employee</th>
                    <th>Time</th>
                    <th>Likes</th>
                    <th>Comments</th>
                    <th>Communities</th>
                    <th className="pr-5">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.heatmap.map((emp) => {
                    const sub = data.todaySubmissions.find(
                      (s) =>
                        String(s.name).toLowerCase() === emp.name.toLowerCase()
                    );
                    return (
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
                        <td className="tabular-nums text-muted">
                          {sub ? `${sub.time_spent}m` : "—"}
                        </td>
                        <td className="tabular-nums">
                          {sub ? sub.likes : "—"}
                        </td>
                        <td className="tabular-nums">
                          {sub ? sub.comments : "—"}
                        </td>
                        <td className="max-w-[200px] truncate text-muted">
                          {sub ? sub.communities : "—"}
                        </td>
                        <td className="pr-5">
                          <span
                            className={`inline-flex items-center gap-1.5 text-xs ${
                              sub ? "text-ok" : "text-bad"
                            }`}
                          >
                            <span
                              className={`dot ${sub ? "bg-ok" : "bg-bad"}`}
                            />
                            {sub ? "Submitted" : "Missing"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {data.heatmap.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-5 py-8 text-center text-[13px] text-muted"
                      >
                        Nothing to show yet.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </AdminShell>
  );
}
