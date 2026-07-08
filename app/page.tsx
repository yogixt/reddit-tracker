"use client";

import Link from "next/link";
import { Users, ShieldCheck, ArrowRight } from "lucide-react";

const PLATFORMS = [
  { label: "Reddit", color: "#ff5a1f" },
  { label: "Quora", color: "#e5533d" },
  { label: "LinkedIn", color: "#3b8ee0" },
];

export default function Landing() {
  return (
    <main className="flex flex-1 flex-col px-5">
      <header className="mx-auto flex w-full max-w-2xl items-center gap-2.5 py-6">
        <span className="h-2.5 w-2.5 rounded-full bg-accent" />
        <span className="text-[13px] font-semibold">Tracker</span>
        <span className="kicker ml-auto">internal tool</span>
      </header>

      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center pb-24">
        <span className="tab-chip mb-5">Daily engagement log</span>
        <h1 className="display max-w-lg text-[44px] sm:text-[56px]">
          One log a day keeps the <span className="accent-word">graphs</span>{" "}
          alive.
        </h1>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-muted">
          Track the team&apos;s engagement across Reddit, Quora and LinkedIn.
          Reddit syncs automatically; log the rest in seconds. Streaks, likes,
          comments, screenshots and participation — all in one place.
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          {PLATFORMS.map((p) => (
            <span key={p.label} className="pill" style={{ color: p.color }}>
              {p.label}
            </span>
          ))}
        </div>

        <div className="mt-10 grid gap-3 sm:grid-cols-2">
          <Link
            href="/employee/login"
            className="card group p-5 transition-colors hover:border-edge-strong"
          >
            <div className="flex items-center justify-between">
              <Users size={18} strokeWidth={1.75} className="text-accent" />
              <ArrowRight
                size={15}
                className="text-faint transition-transform group-hover:translate-x-0.5 group-hover:text-text"
              />
            </div>
            <p className="mt-4 text-[15px] font-medium">I&apos;m an employee</p>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              Log today&apos;s activity and attach a proof screenshot. First
              time? Your profile is created when you sign in.
            </p>
          </Link>

          <Link
            href="/admin/login"
            className="card group p-5 transition-colors hover:border-edge-strong"
          >
            <div className="flex items-center justify-between">
              <ShieldCheck size={18} strokeWidth={1.75} className="text-muted" />
              <ArrowRight
                size={15}
                className="text-faint transition-transform group-hover:translate-x-0.5 group-hover:text-text"
              />
            </div>
            <p className="mt-4 text-[15px] font-medium">Admin</p>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              Dashboard, proof wall, leaderboard, analytics and the roster.
            </p>
          </Link>
        </div>
      </div>

      <footer className="mx-auto flex w-full max-w-2xl flex-wrap items-center justify-between gap-2 pb-6">
        <p className="text-[11px] text-faint">
          Reddit · Quora · LinkedIn engagement, one dashboard.
        </p>
        <p className="text-[11px] text-faint">
          Reports close at midnight IST. Missed days break the streak.
        </p>
      </footer>
    </main>
  );
}
