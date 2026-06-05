"use client";

import Link from "next/link";
import Image from "next/image";
import { Users, ShieldCheck, ArrowRight } from "lucide-react";

export default function Landing() {
  return (
    <main className="flex flex-1 flex-col px-5">
      <header className="mx-auto flex w-full max-w-2xl items-center gap-2.5 py-6">
        <Image src="/logo.png" alt="" width={24} height={24} priority />
        <span className="text-[13px] font-semibold">Tracker</span>
        <span className="kicker ml-auto">internal tool</span>
      </header>

      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center pb-24">
        <p className="kicker mb-3 text-accent">Daily engagement log</p>
        <h1 className="max-w-md text-[28px] font-semibold leading-tight tracking-tight sm:text-[34px]">
          One report a day keeps the graphs alive.
        </h1>
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted">
          Log your Reddit activity in under thirty seconds. Streaks, likes,
          comments and team participation, all in one place.
        </p>

        <div className="mt-10 grid gap-3 sm:grid-cols-2">
          <Link
            href="/employee/login"
            className="card group p-5 transition-colors hover:border-edge-strong"
          >
            <div className="flex items-center justify-between">
              <Users size={18} strokeWidth={1.75} className="text-accent" />
              <ArrowRight
                size={15}
                className="text-faint transition-transform group-hover:translate-x-0.5 group-hover:text-white"
              />
            </div>
            <p className="mt-4 text-[15px] font-medium">I&apos;m an employee</p>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              Submit today&apos;s activity. First time? Your account is created
              when you sign in.
            </p>
          </Link>

          <Link
            href="/admin/login"
            className="card group p-5 transition-colors hover:border-edge-strong"
          >
            <div className="flex items-center justify-between">
              <ShieldCheck
                size={18}
                strokeWidth={1.75}
                className="text-muted"
              />
              <ArrowRight
                size={15}
                className="text-faint transition-transform group-hover:translate-x-0.5 group-hover:text-white"
              />
            </div>
            <p className="mt-4 text-[15px] font-medium">Admin</p>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              Team dashboard, leaderboard, analytics and roster.
            </p>
          </Link>
        </div>
      </div>

      <footer className="mx-auto w-full max-w-2xl pb-6">
        <p className="text-[11px] text-faint">
          Reports close at midnight IST. Missed days break the streak.
        </p>
      </footer>
    </main>
  );
}
