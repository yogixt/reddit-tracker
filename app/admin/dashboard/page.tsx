"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
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
          <Loader2 size={28} className="animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-6">
          <div>
            <h1 className="text-xl font-bold">Dashboard</h1>
            <p className="text-xs text-muted">
              Team Reddit engagement at a glance
            </p>
          </div>

          {/* KPI cards */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            <StatCard
              label="Total Employees"
              value={data.kpis.totalEmployees}
              icon={Users}
              accent="#8B5CF6"
              delay={0.02}
            />
            <StatCard
              label="Reports Today"
              value={data.kpis.submittedToday}
              sub={`${data.kpis.pendingToday} pending`}
              icon={FileCheck}
              accent="#10B981"
              delay={0.06}
            />
            <StatCard
              label="Participation"
              value={`${data.kpis.participationRate}%`}
              icon={Percent}
              accent="#06B6D4"
              delay={0.1}
            />
            <StatCard
              label="Likes Today"
              value={data.kpis.likesToday}
              icon={Heart}
              accent="#EC4899"
              delay={0.14}
            />
            <StatCard
              label="Comments Today"
              value={data.kpis.commentsToday}
              icon={MessageCircle}
              accent="#F59E0B"
              delay={0.18}
            />
            <StatCard
              label="Communities"
              value={data.kpis.activeCommunities}
              icon={Globe}
              accent="#A78BFA"
              delay={0.22}
            />
          </div>

          {/* Heatmap */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass gradient-border rounded-2xl p-5"
          >
            <h2 className="mb-1 font-semibold">Team Activity</h2>
            <p className="mb-4 text-xs text-muted">
              Green submitted today, red missing
            </p>
            {data.heatmap.length === 0 ? (
              <p className="text-sm text-muted">No employees added yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {data.heatmap.map((e) => (
                  <span
                    key={e.name}
                    className={`rounded-full border px-3 py-1.5 text-xs ${
                      e.submittedToday
                        ? "border-green-500/40 bg-green-500/10 text-green-300 glow-green"
                        : "border-red-500/40 bg-red-500/10 text-red-300 glow-red"
                    }`}
                  >
                    {e.name}
                  </span>
                ))}
              </div>
            )}
          </motion.section>

          {/* Today's activity table */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass gradient-border overflow-hidden rounded-2xl"
          >
            <div className="p-5 pb-3">
              <h2 className="font-semibold">Today&apos;s Activity</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-y border-white/5 text-left text-xs text-muted">
                    <th className="px-5 py-2.5 font-medium">Employee</th>
                    <th className="px-3 py-2.5 font-medium">Time</th>
                    <th className="px-3 py-2.5 font-medium">Likes</th>
                    <th className="px-3 py-2.5 font-medium">Comments</th>
                    <th className="px-3 py-2.5 font-medium">Communities</th>
                    <th className="px-5 py-2.5 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.heatmap.map((emp) => {
                    const sub = data.todaySubmissions.find(
                      (s) =>
                        String(s.name).toLowerCase() === emp.name.toLowerCase()
                    );
                    return (
                      <tr
                        key={emp.name}
                        className="border-b border-white/5 last:border-0"
                      >
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2.5">
                            <Avatar name={emp.name} size={28} />
                            <div>
                              <p className="leading-tight">{emp.name}</p>
                              <p className="text-[10px] text-secondary">
                                {emp.reddit_username}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-muted">
                          {sub ? `${sub.time_spent} min` : "-"}
                        </td>
                        <td className="px-3 py-3">{sub ? sub.likes : "-"}</td>
                        <td className="px-3 py-3">
                          {sub ? sub.comments : "-"}
                        </td>
                        <td className="max-w-[200px] truncate px-3 py-3 text-muted">
                          {sub ? sub.communities : "-"}
                        </td>
                        <td className="px-5 py-3">
                          {sub ? (
                            <span className="rounded-full border border-green-500/40 bg-green-500/10 px-2.5 py-0.5 text-[11px] text-green-300">
                              Submitted
                            </span>
                          ) : (
                            <span className="rounded-full border border-red-500/40 bg-red-500/10 px-2.5 py-0.5 text-[11px] text-red-300">
                              Missing
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {data.heatmap.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-5 py-8 text-center text-sm text-muted"
                      >
                        No employees yet. Add them in the Employees tab.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </motion.section>
        </div>
      )}
    </AdminShell>
  );
}
