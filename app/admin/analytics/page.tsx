"use client";

import { useEffect, useState } from "react";
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
  background: "#18181b",
  border: "1px solid #2e2e34",
  borderRadius: 8,
  fontSize: 12,
  color: "#f4f4f5",
};

const axisTick = { fill: "#5d5d66", fontSize: 10 };
const gridStroke = "#1c1c1f";

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
          <Loader2 size={24} className="animate-spin text-faint" />
        </div>
      ) : (
        <div className="mx-auto max-w-5xl space-y-5">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Analytics</h1>
            <p className="text-xs text-faint">
              Daily and weekly engagement trends.
            </p>
          </div>

          {/* Daily reports area chart */}
          <section className="card p-5">
            <div className="flex items-baseline justify-between">
              <h2 className="text-[15px] font-medium">Daily reports</h2>
              <span className="kicker">last 30 days</span>
            </div>
            <div className="mt-4 h-60">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.daily}>
                  <defs>
                    <linearGradient id="gradReports" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ff4500" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#ff4500" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={axisTick}
                    tickFormatter={(d: string) => d.slice(5)}
                    stroke="#2e2e34"
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={axisTick}
                    stroke="transparent"
                    tickLine={false}
                    width={28}
                  />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area
                    type="monotone"
                    dataKey="reports"
                    stroke="#ff4500"
                    strokeWidth={1.75}
                    fill="url(#gradReports)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Weekly performance bar chart */}
          <section className="card p-5">
            <div className="flex items-baseline justify-between">
              <h2 className="text-[15px] font-medium">Weekly performance</h2>
              <span className="kicker">avg per report</span>
            </div>
            <div className="mt-4 h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.weekly} barCategoryGap="35%">
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                  <XAxis
                    dataKey="week"
                    tick={axisTick}
                    stroke="#2e2e34"
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={axisTick}
                    stroke="transparent"
                    tickLine={false}
                    width={28}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    cursor={{ fill: "rgba(255,255,255,0.02)" }}
                  />
                  <Bar
                    dataKey="avgLikes"
                    name="Avg likes"
                    stackId="a"
                    fill="#ff4500"
                  />
                  <Bar
                    dataKey="avgComments"
                    name="Avg comments"
                    stackId="a"
                    fill="#3f3f46"
                    radius={[3, 3, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex gap-4 text-[11px] text-muted">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-sm bg-accent" /> Avg likes
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-sm bg-[#3f3f46]" /> Avg
                comments
              </span>
            </div>
          </section>

          {/* Weekly details table */}
          <section className="card overflow-hidden">
            <div className="px-5 pb-1 pt-4">
              <h2 className="text-[15px] font-medium">Weekly details</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="tbl min-w-[560px]">
                <thead>
                  <tr>
                    <th className="pl-5">Week</th>
                    <th>Participation</th>
                    <th>Avg likes</th>
                    <th>Avg comments</th>
                    <th className="pr-5">Avg time</th>
                  </tr>
                </thead>
                <tbody>
                  {data.weekly.map((w) => (
                    <tr key={w.week}>
                      <td className="pl-5 font-mono text-xs text-muted">
                        {w.week}
                      </td>
                      <td className="tabular-nums">{w.participation}%</td>
                      <td className="tabular-nums">{w.avgLikes}</td>
                      <td className="tabular-nums">{w.avgComments}</td>
                      <td className="pr-5 tabular-nums">{w.avgTime} min</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </AdminShell>
  );
}
