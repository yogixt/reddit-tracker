"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import Avatar from "@/components/Avatar";
import type { Analytics, LeaderboardEntry } from "@/lib/types";

function Column({
  title,
  entries,
  unit,
}: {
  title: string;
  entries: LeaderboardEntry[];
  unit: string;
}) {
  return (
    <section className="card p-5">
      <div className="flex items-baseline justify-between">
        <h2 className="text-[15px] font-medium">{title}</h2>
        <span className="kicker">{unit}</span>
      </div>

      {entries.length === 0 ? (
        <p className="mt-4 text-[13px] text-muted">No data yet.</p>
      ) : (
        <ol className="mt-4 space-y-3">
          {entries.map((e, i) => (
            <li key={e.name} className="flex items-center gap-3">
              <span
                className={`w-6 shrink-0 font-mono text-[11px] tabular-nums ${
                  i === 0 ? "text-accent" : i < 3 ? "text-white" : "text-faint"
                }`}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <Avatar name={e.name} size={28} />
              <div className="min-w-0 flex-1 leading-tight">
                <p className="truncate text-[13px]">{e.name}</p>
                <p className="text-[10px] text-faint">{e.reddit_username}</p>
              </div>
              <span className="text-[13px] font-medium tabular-nums">
                {e.value}
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
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
          <Loader2 size={24} className="animate-spin text-faint" />
        </div>
      ) : (
        <div className="mx-auto max-w-5xl space-y-5">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">
              Leaderboard
            </h1>
            <p className="text-xs text-faint">
              All-time rankings across the team.
            </p>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <Column
              title="Most likes"
              entries={data.leaderboard.topLikes}
              unit="likes"
            />
            <Column
              title="Most comments"
              entries={data.leaderboard.topComments}
              unit="comments"
            />
            <Column
              title="Most consistent"
              entries={data.leaderboard.topParticipants}
              unit="days"
            />
          </div>
        </div>
      )}
    </AdminShell>
  );
}
