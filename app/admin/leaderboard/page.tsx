"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Heart,
  MessageCircle,
  CalendarCheck,
  Trophy,
  Loader2,
  type LucideIcon,
} from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import Avatar from "@/components/Avatar";
import type { Analytics, LeaderboardEntry } from "@/lib/types";

const RANK_COLORS = ["#FBBF24", "#94A3B8", "#B45309"];

function Column({
  title,
  icon: Icon,
  accent,
  entries,
  unit,
  delay,
}: {
  title: string;
  icon: LucideIcon;
  accent: string;
  entries: LeaderboardEntry[];
  unit: string;
  delay: number;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="glass gradient-border rounded-2xl p-5"
    >
      <div className="mb-4 flex items-center gap-2.5">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-xl"
          style={{ background: `${accent}1f`, color: accent }}
        >
          <Icon size={18} />
        </div>
        <h2 className="font-semibold">{title}</h2>
      </div>

      {entries.length === 0 ? (
        <p className="text-sm text-muted">No data yet.</p>
      ) : (
        <ol className="space-y-2.5">
          {entries.map((e, i) => (
            <li key={e.name} className="flex items-center gap-3">
              <span className="w-5 text-center text-xs text-muted">
                {i < 3 ? (
                  <Trophy size={14} style={{ color: RANK_COLORS[i] }} />
                ) : (
                  i + 1
                )}
              </span>
              <Avatar name={e.name} size={30} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm leading-tight">{e.name}</p>
                <p className="text-[10px] text-secondary">
                  {e.reddit_username}
                </p>
              </div>
              <span className="text-sm font-semibold" style={{ color: accent }}>
                {e.value}
                <span className="ml-1 text-[10px] font-normal text-muted">
                  {unit}
                </span>
              </span>
            </li>
          ))}
        </ol>
      )}
    </motion.section>
  );
}

export default function LeaderboardPage() {
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
            <h1 className="text-xl font-bold">Leaderboard</h1>
            <p className="text-xs text-muted">All-time team rankings</p>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <Column
              title="Top Likes"
              icon={Heart}
              accent="#EC4899"
              entries={data.leaderboard.topLikes}
              unit="likes"
              delay={0.05}
            />
            <Column
              title="Top Comments"
              icon={MessageCircle}
              accent="#06B6D4"
              entries={data.leaderboard.topComments}
              unit="comments"
              delay={0.1}
            />
            <Column
              title="Top Participants"
              icon={CalendarCheck}
              accent="#10B981"
              entries={data.leaderboard.topParticipants}
              unit="days"
              delay={0.15}
            />
          </div>
        </div>
      )}
    </AdminShell>
  );
}
