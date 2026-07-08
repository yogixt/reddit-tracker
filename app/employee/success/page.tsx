"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { clearEmployeeSession, getEmployeeSession } from "@/lib/session";
import { PLATFORM_META, isPlatform, type Platform } from "@/lib/platforms";

interface LastSubmission {
  platform: Platform;
  likes: number;
  comments: number;
  posts: number;
  communities: string;
  submittedAt: string;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-2 text-[13px]">
      <span className="shrink-0 font-mono text-[11px] uppercase tracking-wider text-ink-faint">
        {label}
      </span>
      <span className="flex-1 -translate-y-[3px] border-b border-dotted border-ink-faint" />
      <span className="max-w-[55%] truncate text-right font-mono tabular-nums">
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

  const meta =
    submission && isPlatform(submission.platform)
      ? PLATFORM_META[submission.platform]
      : null;

  return (
    <main className="flex flex-1 items-center justify-center px-5 py-10">
      <div className="card w-full max-w-sm p-7">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 18 }}
          className="mb-4 flex h-11 w-11 items-center justify-center border-[1.5px] border-ink bg-ok text-paper"
        >
          <Check size={22} strokeWidth={3} />
        </motion.div>

        <span className="tab-chip">Logged</span>
        <h1 className="display mt-3 text-3xl">
          {meta ? `${meta.label} activity in.` : "Activity in."}
        </h1>
        <p className="mt-2 text-[13px] text-ink-soft">
          That&apos;s logged for today. The streak lives on.
        </p>

        {submission ? (
          <div className="mt-6 space-y-2.5 border-t-[1.5px] border-ink pt-5">
            <Row label="Platform" value={meta?.label ?? submission.platform} />
            <Row label="Likes" value={String(submission.likes)} />
            <Row label="Comments" value={String(submission.comments)} />
            <Row label="Posts" value={String(submission.posts)} />
            {submission.communities ? (
              <Row label={meta?.contextLabel ?? "Context"} value={submission.communities} />
            ) : null}
            <Row
              label="Logged at"
              value={new Date(submission.submittedAt).toLocaleTimeString("en-IN", {
                timeZone: "Asia/Kolkata",
                hour: "2-digit",
                minute: "2-digit",
              })}
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
