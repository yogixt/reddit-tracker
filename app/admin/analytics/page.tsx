"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import AdminShell from "@/components/admin/AdminShell";
import type { Analytics } from "@/lib/types";

const tooltipStyle = {
  background: "#0F172A",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 12,
  fontSize: 12,
  color: "#fff",
};

export default function AnalyticsPage() {
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
            <h1 className="text-xl font-bold">Analytics</h1>
            <p className="text-xs text-muted">
              Daily and weekly engagement trends
            </p>
          </div>

          {/* Daily reports area chart */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="glass gradient-border rounded-2xl p-5"
          >
            <h2 className="mb-1 font-semibold">Daily Reports</h2>
            <p className="mb-4 text-xs text-muted">Last 30 days</p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.daily}>
                  <defs>
                    <linearGradient id="gradReports" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.05)"
                  />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: "#94A3B8", fontSize: 10 }}
                    tickFormatter={(d: string) => d.slice(5)}
                    stroke="rgba(255,255,255,0.1)"
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: "#94A3B8", fontSize: 10 }}
                    stroke="rgba(255,255,255,0.1)"
                  />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area
                    type="monotone"
                    dataKey="reports"
                    stroke="#8B5CF6"
                    strokeWidth={2}
                    fill="url(#gradReports)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.section>

          {/* Weekly performance bar chart */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass gradient-border rounded-2xl p-5"
          >
            <h2 className="mb-1 font-semibold">Weekly Performance</h2>
            <p className="mb-4 text-xs text-muted">
              Average likes vs comments per submission
            </p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.weekly}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.05)"
                  />
                  <XAxis
                    dataKey="week"
                    tick={{ fill: "#94A3B8", fontSize: 10 }}
                    stroke="rgba(255,255,255,0.1)"
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: "#94A3B8", fontSize: 10 }}
                    stroke="rgba(255,255,255,0.1)"
                  />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(139,92,246,0.06)" }} />
                  <Bar
                    dataKey="avgLikes"
                    name="Avg Likes"
                    stackId="a"
                    fill="#8B5CF6"
                    radius={[0, 0, 0, 0]}
                  />
                  <Bar
                    dataKey="avgComments"
                    name="Avg Comments"
                    stackId="a"
                    fill="#A78BFA"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.section>

          {/* Weekly details table */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="glass gradient-border overflow-hidden rounded-2xl"
          >
            <div className="p-5 pb-3">
              <h2 className="font-semibold">Weekly Details</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="border-y border-white/5 text-left text-xs text-muted">
                    <th className="px-5 py-2.5 font-medium">Week</th>
                    <th className="px-3 py-2.5 font-medium">Participation</th>
                    <th className="px-3 py-2.5 font-medium">Avg Likes</th>
                    <th className="px-3 py-2.5 font-medium">Avg Comments</th>
                    <th className="px-5 py-2.5 font-medium">Avg Time</th>
                  </tr>
                </thead>
                <tbody>
                  {data.weekly.map((w) => (
                    <tr
                      key={w.week}
                      className="border-b border-white/5 last:border-0"
                    >
                      <td className="px-5 py-3 text-muted">{w.week}</td>
                      <td className="px-3 py-3">{w.participation}%</td>
                      <td className="px-3 py-3">{w.avgLikes}</td>
                      <td className="px-3 py-3">{w.avgComments}</td>
                      <td className="px-5 py-3">{w.avgTime} min</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.section>
        </div>
      )}
    </AdminShell>
  );
}
