"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Users, ShieldCheck, ArrowRight } from "lucide-react";

export default function Landing() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col items-center text-center"
      >
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 p-2 glow-primary">
          <Image src="/logo.png" alt="Reddit Engagement Tracker" width={56} height={56} priority />
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
          Reddit Engagement{" "}
          <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Tracker
          </span>
        </h1>
        <p className="mt-3 max-w-md text-sm text-muted">
          Log your daily Reddit activity in under 30 seconds. Track streaks,
          likes, comments, and team participation.
        </p>
      </motion.div>

      <div className="mt-10 grid w-full max-w-md gap-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Link
            href="/employee/login"
            className="glass gradient-border group flex items-center gap-4 rounded-2xl p-5 transition hover:glow-primary"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/20 text-primary">
              <Users size={22} />
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold">I&apos;m an Employee</p>
              <p className="text-xs text-muted">
                Submit your daily Reddit activity
              </p>
            </div>
            <ArrowRight
              size={18}
              className="text-muted transition group-hover:translate-x-1 group-hover:text-primary"
            />
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Link
            href="/admin/login"
            className="glass gradient-border group flex items-center gap-4 rounded-2xl p-5 transition hover:glow-primary"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary/20 text-secondary">
              <ShieldCheck size={22} />
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold">Admin Login</p>
              <p className="text-xs text-muted">
                Team dashboard, analytics, and reports
              </p>
            </div>
            <ArrowRight
              size={18}
              className="text-muted transition group-hover:translate-x-1 group-hover:text-secondary"
            />
          </Link>
        </motion.div>
      </div>
    </main>
  );
}
