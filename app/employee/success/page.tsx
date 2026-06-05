"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check, LayoutDashboard, LogOut } from "lucide-react";
import { clearEmployeeSession, getEmployeeSession } from "@/lib/session";

interface LastSubmission {
  timeSpent: number;
  likes: number;
  comments: number;
  communities: string;
  submittedAt: string;
}

export default function SuccessPage() {
  const router = useRouter();
  const [submission, setSubmission] = useState<LastSubmission | null>(null);

  useEffect(() => {
    if (!getEmployeeSession()) {
      router.replace("/employee/login");
      return;
    }
    try {
      const raw = sessionStorage.getItem("ret_last_submission");
      if (raw) setSubmission(JSON.parse(raw));
    } catch {
      // ignore
    }
  }, [router]);

  function handleLogout() {
    clearEmployeeSession();
    router.push("/");
  }

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass gradient-border w-full max-w-sm rounded-2xl p-6 sm:p-8 text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 16, delay: 0.1 }}
          className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/15 text-green-400 glow-green"
        >
          <Check size={32} strokeWidth={3} />
        </motion.div>

        <h1 className="text-xl font-semibold">Activity Submitted</h1>
        <p className="mt-1 text-xs text-muted">
          Your daily report has been recorded.
        </p>

        {submission ? (
          <div className="mt-5 space-y-2 rounded-xl border border-white/10 bg-white/5 p-4 text-left text-sm">
            <Row label="Time Spent" value={`${submission.timeSpent} minutes`} />
            <Row label="Likes Given" value={String(submission.likes)} />
            <Row label="Comments Made" value={String(submission.comments)} />
            <Row label="Communities" value={submission.communities} />
            <Row
              label="Submitted At"
              value={new Date(submission.submittedAt).toLocaleString("en-IN", {
                timeZone: "Asia/Kolkata",
                dateStyle: "medium",
                timeStyle: "short",
              })}
            />
          </div>
        ) : null}

        <div className="mt-6 grid gap-2">
          <Link
            href="/employee/dashboard"
            className="flex items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-medium transition hover:bg-primary/90 glow-primary"
          >
            <LayoutDashboard size={15} /> Back to Dashboard
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 rounded-xl border border-white/10 py-2.5 text-sm text-muted transition hover:text-white"
          >
            <LogOut size={15} /> Logout
          </button>
        </div>
      </motion.div>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-xs text-muted">{label}</span>
      <span className="text-right text-xs">{value}</span>
    </div>
  );
}
