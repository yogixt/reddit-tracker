"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { clearEmployeeSession, getEmployeeSession } from "@/lib/session";

interface LastSubmission {
  timeSpent: number;
  likes: number;
  comments: number;
  communities: string;
  submittedAt: string;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-2 text-[13px]">
      <span className="shrink-0 text-xs text-muted">{label}</span>
      <span className="flex-1 -translate-y-[3px] border-b border-dotted border-edge-strong" />
      <span className="max-w-[55%] truncate text-right tabular-nums">
        {value}
      </span>
    </div>
  );
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
    <main className="flex flex-1 items-center justify-center px-5 py-10">
      <div className="card w-full max-w-sm p-7">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 18 }}
          className="mb-4 flex h-11 w-11 items-center justify-center rounded-full border border-ok/30 bg-ok/10 text-ok"
        >
          <Check size={22} strokeWidth={2.5} />
        </motion.div>

        <h1 className="text-lg font-semibold tracking-tight">Report logged</h1>
        <p className="mt-1 text-[13px] text-muted">
          That&apos;s it for today. The streak lives on.
        </p>

        {submission ? (
          <div className="mt-6 space-y-2.5 border-t border-edge pt-5">
            <Row label="Time spent" value={`${submission.timeSpent} min`} />
            <Row label="Likes given" value={String(submission.likes)} />
            <Row label="Comments made" value={String(submission.comments)} />
            <Row label="Communities" value={submission.communities} />
            <Row
              label="Logged at"
              value={new Date(submission.submittedAt).toLocaleTimeString(
                "en-IN",
                {
                  timeZone: "Asia/Kolkata",
                  hour: "2-digit",
                  minute: "2-digit",
                }
              )}
            />
          </div>
        ) : null}

        <div className="mt-7 grid gap-2">
          <Link href="/employee/dashboard" className="btn btn-primary">
            Back to dashboard
          </Link>
          <button onClick={handleLogout} className="btn btn-ghost">
            Logout
          </button>
        </div>
      </div>
    </main>
  );
}
